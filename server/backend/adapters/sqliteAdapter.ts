import fs from 'fs';
import path from 'path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type {
  DatabaseProvider,
  PaginationOptions,
  ProviderCapabilities,
  QueryResult,
} from '../interfaces';

export class SqliteAdapter implements DatabaseProvider {
  public readonly capabilities: ProviderCapabilities = {
    provider: 'sqlite',
    engineKind: 'sql',
    supportsSqlQueries: true,
    supportsTransactions: true,
    supportsAuth: false,
    supportsRealtime: false,
    supportsStorage: false,
    supportsOfflineLocal: true,
    notes: 'Local embedded SQLite via Node built-in node:sqlite. Single-node persistence.',
  };

  private db: DatabaseSync | null = null;
  private readonly dbPath: string;

  constructor(dbPath = './data/kingdom-ludo.sqlite') {
    this.dbPath = dbPath;
  }

  public async connect(): Promise<void> {
    if (this.db) return;
    if (this.dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(this.dbPath)), { recursive: true });
    }
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  }

  public async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  public async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      await this.connect();
      this.db!.prepare('SELECT 1 AS ok').get();
      return {
        ok: true,
        latencyMs: Math.round(performance.now() - start),
        message: 'Local SQLite connected',
      };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        message: err instanceof Error ? err.message : 'SQLite error',
      };
    }
  }

  public async migrate(migrationsDir = path.resolve(process.cwd(), 'database/migrations')): Promise<{ applied: string[] }> {
    await this.connect();
    const db = this.db!;
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at BIGINT NOT NULL
      );
    `);

    if (!fs.existsSync(migrationsDir)) return { applied: [] };
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.includes('supabase') && !f.includes('postgres'))
      .sort();

    const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{
      version: string;
    }>;
    const alreadyApplied = new Set(appliedRows.map((r) => r.version));
    const newlyApplied: string[] = [];

    for (const file of files) {
      if (alreadyApplied.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      db.exec('BEGIN');
      try {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
          file,
          Date.now(),
        );
        db.exec('COMMIT');
        newlyApplied.push(file);
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }

    return { applied: newlyApplied };
  }

  public async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    await this.connect();
    const db = this.db!;
    // Convert $1, $2 style placeholders if passed, to SQLite ? placeholders
    const normalizedSql = sql.replace(/\$\d+/g, '?');
    const stmt = db.prepare(normalizedSql);
    const trimmed = normalizedSql.trim().toUpperCase();
    const bindParams = params as SQLInputValue[];

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
      const rows = stmt.all(...bindParams) as T[];
      return { rows, rowCount: rows.length };
    }

    const result = stmt.run(...bindParams);
    return { rows: [], rowCount: Number(result.changes ?? 0) };
  }

  public async transaction<T>(fn: (tx: DatabaseProvider) => Promise<T>): Promise<T> {
    await this.connect();
    this.db!.exec('BEGIN');
    try {
      const result = await fn(this);
      this.db!.exec('COMMIT');
      return result;
    } catch (err) {
      this.db!.exec('ROLLBACK');
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
