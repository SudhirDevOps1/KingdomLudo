import fs from 'fs';
import path from 'path';
import type {
  DatabaseProvider,
  PaginationOptions,
  ProviderCapabilities,
  QueryResult,
} from '../interfaces';

interface D1ApiResponse<T> {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: Array<{
    results: T[];
    meta?: { changes?: number };
  }>;
}

export class CloudflareD1Adapter implements DatabaseProvider {
  public readonly capabilities: ProviderCapabilities = {
    provider: 'd1',
    engineKind: 'sql',
    supportsSqlQueries: true,
    supportsTransactions: false,
    supportsAuth: false,
    supportsRealtime: false,
    supportsStorage: false,
    supportsOfflineLocal: false,
    notes:
      'Cloudflare D1 SQLite-over-HTTP REST API. Multi-statement batching uses D1 Worker bindings or sequential API statements; realtime requires Durable Objects.',
  };

  private readonly accountId: string;
  private readonly databaseId: string;
  private readonly apiToken: string;

  constructor(accountId: string, databaseId: string, apiToken: string) {
    this.accountId = accountId;
    this.databaseId = databaseId;
    this.apiToken = apiToken;
  }

  public async connect(): Promise<void> {
    if (!this.accountId || !this.databaseId || !this.apiToken) {
      throw new Error(
        'Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, or CLOUDFLARE_D1_TOKEN.',
      );
    }
  }

  public async disconnect(): Promise<void> {
    // Stateless HTTP API
  }

  public async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      await this.connect();
      await this.query('SELECT 1 AS ok');
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: 'Cloudflare D1 connected',
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: err instanceof Error ? err.message : 'Cloudflare D1 connection failed',
      };
    }
  }

  public async migrate(
    migrationsDir = path.resolve(process.cwd(), 'database/migrations'),
  ): Promise<{ applied: string[] }> {
    await this.connect();
    await this.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at BIGINT NOT NULL
      )
    `);
    if (!fs.existsSync(migrationsDir)) return { applied: [] };
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    const res = await this.query<{ version: string }>('SELECT version FROM schema_migrations');
    const appliedSet = new Set(res.rows.map((r) => r.version));
    const newlyApplied: string[] = [];

    for (const file of files) {
      if (appliedSet.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await this.query(stmt);
      }
      await this.query('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
        file,
        Date.now(),
      ]);
      newlyApplied.push(file);
    }

    return { applied: newlyApplied };
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    await this.connect();
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: sql.replace(/\$\d+/g, '?'),
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare D1 HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = (await response.json()) as D1ApiResponse<T>;
    if (!payload.success || !payload.result?.[0]) {
      throw new Error(payload.errors?.[0]?.message || 'Cloudflare D1 query error');
    }

    const first = payload.result[0];
    return {
      rows: first.results ?? [],
      rowCount: first.meta?.changes ?? first.results?.length ?? 0,
    };
  }

  public async transaction<T>(fn: (tx: DatabaseProvider) => Promise<T>): Promise<T> {
    // D1 HTTP REST API executes single-statement batches rather than interactive BEGIN/COMMIT transactions
    return fn(this);
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
