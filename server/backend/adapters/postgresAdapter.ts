import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import type {
  DatabaseProvider,
  PaginationOptions,
  ProviderCapabilities,
  ProviderName,
  QueryResult,
} from '../interfaces';

export class PostgresAdapter implements DatabaseProvider {
  public readonly capabilities: ProviderCapabilities;
  private pool: Pool | null = null;
  private readonly connectionString: string;

  constructor(
    connectionString: string,
    variant: Extract<ProviderName, 'postgres' | 'supabase' | 'neon'> = 'postgres',
  ) {
    this.connectionString = connectionString;
    this.capabilities = {
      provider: variant,
      engineKind: 'sql',
      supportsSqlQueries: true,
      supportsTransactions: true,
      supportsAuth: variant === 'supabase',
      supportsRealtime: variant === 'supabase',
      supportsStorage: variant === 'supabase',
      supportsOfflineLocal: variant !== 'postgres',
      notes:
        variant === 'supabase'
          ? 'Supabase PostgreSQL; supports separate Supabase Auth/Realtime/Storage.'
          : variant === 'neon'
            ? 'Neon Serverless PostgreSQL; requires separate auth/realtime/storage.'
            : 'Standard PostgreSQL; requires separate auth/realtime/storage.',
    };
  }

  public async connect(): Promise<void> {
    if (this.pool) return;
    if (!this.connectionString) {
      throw new Error(`Missing PostgreSQL connection URL for ${this.capabilities.provider}.`);
    }
    this.pool = new Pool({
      connectionString: this.connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  public async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      await this.connect();
      await this.pool!.query('SELECT 1');
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: `${this.capabilities.provider} PostgreSQL connected`,
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: err instanceof Error ? err.message : 'PostgreSQL connection failed',
      };
    }
  }

  public async migrate(
    migrationsDir = path.resolve(process.cwd(), 'database/migrations'),
  ): Promise<{ applied: string[] }> {
    await this.connect();
    await this.pool!.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at BIGINT NOT NULL
      );
    `);

    if (!fs.existsSync(migrationsDir)) return { applied: [] };
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const res = await this.pool!.query<{ version: string }>(
      'SELECT version FROM schema_migrations',
    );
    const appliedSet = new Set(res.rows.map((r) => r.version));
    const newlyApplied: string[] = [];

    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const client = await this.pool!.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2)', [
          file,
          Date.now(),
        ]);
        await client.query('COMMIT');
        newlyApplied.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    return { applied: newlyApplied };
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    await this.connect();
    // Convert ? placeholders to $1..$n if provided
    let paramIdx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIdx}`);
    const result = await this.pool!.query(pgSql, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? result.rows.length,
    };
  }

  public async transaction<T>(fn: (tx: DatabaseProvider) => Promise<T>): Promise<T> {
    await this.connect();
    const client = await this.pool!.connect();
    const txProvider: DatabaseProvider = {
      capabilities: this.capabilities,
      connect: async () => {},
      disconnect: async () => {},
      healthCheck: () => this.healthCheck(),
      migrate: () => Promise.resolve({ applied: [] }),
      query: async <R = Record<string, unknown>>(sql: string, params: unknown[] = []) => {
        let idx = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
        const r = await client.query(pgSql, params);
        return { rows: r.rows as R[], rowCount: r.rowCount ?? r.rows.length };
      },
      transaction: (nested) => nested(txProvider),
      paginate: async <R = Record<string, unknown>>(
        sql: string,
        params: unknown[],
        options: PaginationOptions,
      ) => txProvider.query<R>(`${sql} LIMIT ? OFFSET ?`, [...params, options.limit, options.offset]),
    };

    try {
      await client.query('BEGIN');
      const output = await fn(txProvider);
      await client.query('COMMIT');
      return output;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
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
