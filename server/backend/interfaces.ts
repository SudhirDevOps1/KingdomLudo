export type ProviderName =
  | 'sqlite'
  | 'postgres'
  | 'supabase'
  | 'neon'
  | 'turso'
  | 'd1';

export interface ProviderCapabilities {
  provider: ProviderName;
  engineKind: 'sql' | 'nosql';
  supportsSqlQueries: boolean;
  supportsTransactions: boolean;
  supportsAuth: boolean;
  supportsRealtime: boolean;
  supportsStorage: boolean;
  supportsOfflineLocal: boolean;
  notes: string;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface DatabaseProvider {
  readonly capabilities: ProviderCapabilities;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message: string }>;
  migrate(migrationsDir?: string): Promise<{ applied: string[] }>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  transaction<T>(fn: (tx: DatabaseProvider) => Promise<T>): Promise<T>;
  paginate<T = Record<string, unknown>>(
    sql: string,
    params: unknown[],
    options: PaginationOptions,
  ): Promise<QueryResult<T>>;
}

export interface AuthSession {
  userId: string;
  displayName: string;
  email?: string;
  isGuest: boolean;
  expiresAt: number;
}

export interface AuthProvider {
  readonly supported: boolean;
  signIn(credentials: { token?: string; displayName?: string }): Promise<AuthSession>;
  signUp(credentials: { email: string; displayName: string }): Promise<AuthSession>;
  signOut(sessionId: string): Promise<void>;
  getSession(sessionId: string): Promise<AuthSession | null>;
  refreshSession(sessionId: string): Promise<AuthSession | null>;
  resetPassword(email: string): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
}

export interface RealtimeProvider {
  readonly supported: boolean;
  connect(): Promise<void>;
  subscribe(channel: string, handler: (payload: unknown) => void): () => void;
  unsubscribe(channel: string): void;
  publish(channel: string, payload: unknown): Promise<void>;
  reconnect(): Promise<void>;
}

export interface StorageProvider {
  readonly supported: boolean;
  upload(key: string, data: Uint8Array, contentType: string): Promise<string>;
  download(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
