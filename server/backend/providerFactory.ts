import { validateProviderEnv } from './envValidator';
import type { DatabaseProvider, ProviderCapabilities } from './interfaces';
import { CloudflareD1Adapter } from './adapters/d1Adapter';
import { PostgresAdapter } from './adapters/postgresAdapter';
import { SqliteAdapter } from './adapters/sqliteAdapter';
import { TursoAdapter } from './adapters/tursoAdapter';

export const PROVIDER_MATRIX: ProviderCapabilities[] = [
  new SqliteAdapter().capabilities,
  new PostgresAdapter('', 'postgres').capabilities,
  new PostgresAdapter('', 'supabase').capabilities,
  new PostgresAdapter('', 'neon').capabilities,
  new TursoAdapter('').capabilities,
  new CloudflareD1Adapter('', '', '').capabilities,
];

export async function createConfiguredDatabaseProvider(
  env: Record<string, string | undefined> = process.env,
): Promise<{
  provider: DatabaseProvider;
  validation: ReturnType<typeof validateProviderEnv>;
}> {
  const validation = validateProviderEnv(env);

  if (!validation.valid) {
    // Graceful fallback to local SQLite in dev/preview if external credentials aren't supplied
    const fallback = new SqliteAdapter(env.SQLITE_DB_PATH || './data/kingdom-ludo.sqlite');
    await fallback.connect();
    await fallback.migrate();
    return { provider: fallback, validation };
  }

  let provider: DatabaseProvider;
  switch (validation.provider) {
    case 'postgres':
      provider = new PostgresAdapter(env.POSTGRES_URL!, 'postgres');
      break;
    case 'supabase':
      provider = new PostgresAdapter(env.POSTGRES_URL || env.SUPABASE_URL!, 'supabase');
      break;
    case 'neon':
      provider = new PostgresAdapter(env.NEON_DATABASE_URL || env.POSTGRES_URL!, 'neon');
      break;
    case 'turso':
      provider = new TursoAdapter(env.TURSO_DATABASE_URL!, env.TURSO_AUTH_TOKEN);
      break;
    case 'd1':
      provider = new CloudflareD1Adapter(
        env.CLOUDFLARE_ACCOUNT_ID!,
        env.CLOUDFLARE_DATABASE_ID!,
        env.CLOUDFLARE_D1_TOKEN!,
      );
      break;
    case 'sqlite':
    default:
      provider = new SqliteAdapter(env.SQLITE_DB_PATH || './data/kingdom-ludo.sqlite');
      break;
  }

  await provider.connect();
  await provider.migrate();
  return { provider, validation };
}
