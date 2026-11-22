import type { ProviderName } from './interfaces';

export interface EnvValidationResult {
  valid: boolean;
  provider: ProviderName;
  missingVars: string[];
  warnings: string[];
}

const VALID_PROVIDERS = new Set<ProviderName>([
  'sqlite',
  'postgres',
  'supabase',
  'neon',
  'turso',
  'd1',
]);

export function resolveSelectedProvider(env: Record<string, string | undefined>): ProviderName {
  const raw = (env.DATABASE_PROVIDER || 'sqlite').toLowerCase() as ProviderName;
  return VALID_PROVIDERS.has(raw) ? raw : 'sqlite';
}

export function validateProviderEnv(env: Record<string, string | undefined>): EnvValidationResult {
  const raw = (env.DATABASE_PROVIDER || 'sqlite').toLowerCase();
  if (!VALID_PROVIDERS.has(raw as ProviderName)) {
    return {
      valid: false,
      provider: 'sqlite',
      missingVars: [`DATABASE_PROVIDER (unsupported value "${raw}")`],
      warnings: [],
    };
  }

  const provider = raw as ProviderName;
  const missingVars: string[] = [];
  const warnings: string[] = [];

  switch (provider) {
    case 'sqlite':
      if (!env.SQLITE_DB_PATH) {
        warnings.push('SQLITE_DB_PATH not set; defaulting to ./data/kingdom-ludo.sqlite');
      }
      break;
    case 'postgres':
      if (!env.POSTGRES_URL) missingVars.push('POSTGRES_URL');
      break;
    case 'supabase':
      if (!env.POSTGRES_URL && !env.SUPABASE_URL) {
        missingVars.push('POSTGRES_URL or SUPABASE_URL');
      }
      break;
    case 'neon':
      if (!env.NEON_DATABASE_URL && !env.POSTGRES_URL) {
        missingVars.push('NEON_DATABASE_URL');
      }
      break;
    case 'turso':
      if (!env.TURSO_DATABASE_URL) missingVars.push('TURSO_DATABASE_URL');
      if (!env.TURSO_AUTH_TOKEN) missingVars.push('TURSO_AUTH_TOKEN');
      break;
    case 'd1':
      if (!env.CLOUDFLARE_ACCOUNT_ID) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
      if (!env.CLOUDFLARE_DATABASE_ID) missingVars.push('CLOUDFLARE_DATABASE_ID');
      if (!env.CLOUDFLARE_D1_TOKEN) missingVars.push('CLOUDFLARE_D1_TOKEN');
      break;
  }

  return {
    valid: missingVars.length === 0,
    provider,
    missingVars,
    warnings,
  };
}
