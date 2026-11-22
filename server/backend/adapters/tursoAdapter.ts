import fs from 'fs';
import path from 'path';
import { createClient, type Client, type InValue } from '@libsql/client';
import type {
  DatabaseProvider,
  PaginationOptions,
  ProviderCapabilities,
  QueryResult,
} from '../interfaces';

export class TursoAdapter implements DatabaseProvider {
  public readonly capabilities: ProviderCapabilities = {
    provider: 'turso',
    engineKind: 'sql',
    supportsSqlQueries: true,
    supportsTransactions: true,
    supportsAuth: false,
    supportsRealtime: false,
    supportsStorage: false,
    supportsOfflineLocal: true,
    notes: 'Turso / libSQL edge SQLite; supports embedded replicas and standard SQL.',
  };

  private client: Client | null = null;
  private readonly url: string;
  private readonly authToken: string;

  constructor(url: string, authToken = '') {
    this.url = url;
    this.authToken = authToken;
  }

  public async connect(): Promise<void> {
    if (this.client) return;
    if (!this.url) {
      throw new Error('Missing TURSO_DATABASE_URL for Turso adapter.');
    }
    this.client = createClient({
      url: this.url,
      authToken: this.authToken || undefined,
    });
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  public async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      await this.connect();
      await this.client!.execute('SELECT 1');
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: 'Turso libSQL connected',
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: err instanceof Error ? err.message : 'Turso connection failed',
      };
    }
  }

  public async migrate(
    migrationsDir = path.resolve(process.cwd(), 'database/migrations'),
  ): Promise<{ applied: string[] }> {
    await this.connect();
    await this.client!.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at BIGINT NOT NULL
      )
    `);
    if (!fs.existsSync(migrationsDir)) return { applied: [] };
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const res = await this.client!.execute('SELECT version FROM schema_migrations');
    const appliedSet = new Set(res.rows.map((r) => String(r.version)));
    const newlyApplied: string[] = [];

    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await this.client!.executeMultiple(sql);
      await this.client!.execute({
        sql: 'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        args: [file, Date.now()],
      });
      newlyApplied.push(file);
    }

    return { applied: newlyApplied };
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    await this.connect();
    const normalizedSql = sql.replace(/\$\d+/g, '?');
    const res = await this.client!.execute({
      sql: normalizedSql,
      args: params as InValue[],
    });
    return {
      rows: res.rows as unknown as T[],
      rowCount: res.rowsAffected ?? res.rows.length,
    };
  }

  public async transaction<T>(fn: (tx: DatabaseProvider) => Promise<T>): Promise<T> {
    await this.connect();
    const tx = await this.client!.transaction('write');
    const txProvider: DatabaseProvider = {
      capabilities: this.capabilities,
      connect: async () => {},
      disconnect: async () => {},
      healthCheck: () => this.healthCheck(),
      migrate: () => Promise.resolve({ applied: [] }),
      query: async <R = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
        const res = await tx.execute({
          sql: sql.replace(/\$\d+/g, '?'),
          args: params as InValue[],
        });
        return {
          rows: res.rows as unknown as R[],
          rowCount: res.rowsAffected ?? res.rows.length,
        };
      },
      transaction: (nested) => nested(txProvider),
      paginate: async <R = Record<string, unknown>>(
        sql: string,
        params: unknown[],
        options: PaginationOptions,
      ) => txProvider.query<R>(`${sql} LIMIT ? OFFSET ?`, [...params, options.limit, options.offset]),
    };

    try {
      const result = await fn(txProvider);
      await tx.commit();
      return result;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  }

  public async paginate<T = Record<string, unknown>>(
    sql: string,
    params: unknown[],
    options: PaginationOptions,
  ): Promise<QueryResult<T>> {
    const safeLimit = Math.max(1, Math.min(200, Math.floor(options.limit)));
    const safeOffset = Math.max(0, Math.floor(options.offset));
    return this.query<T>(`${sql} LIMIT ? OFFSET ?`, [...params, safeLimit, safeOffset]);
  }
}
