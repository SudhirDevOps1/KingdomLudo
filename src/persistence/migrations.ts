import { decryptVaultData, encryptVaultData } from './cryptoVault';
import { createRandomAvatarSeed } from '../services/avatar/dicebearService';
import type { StoredMatchHistoryItem, StoredProfile } from './localPersistence';

export const CURRENT_SCHEMA_VERSION = 2;
const SCHEMA_VERSION_KEY = 'kingdomludo_schema_version';
const RETENTION_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function runDataMigrations(): Promise<{
  fromVersion: number;
  toVersion: number;
  migratedKeys: number;
}> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { fromVersion: CURRENT_SCHEMA_VERSION, toVersion: CURRENT_SCHEMA_VERSION, migratedKeys: 0 };
  }

  const rawVer = localStorage.getItem(SCHEMA_VERSION_KEY);
  const fromVersion = rawVer ? Number(rawVer) || 1 : 1;

  if (fromVersion >= CURRENT_SCHEMA_VERSION) {
    return { fromVersion, toVersion: CURRENT_SCHEMA_VERSION, migratedKeys: 0 };
  }

  let migratedKeys = 0;
  const keys = ['ck_profile', 'ck_settings', 'ck_history', 'ck_active_match'];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const plaintext = await decryptVaultData(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(plaintext);
      } catch {
        continue;
      }

      if (key === 'ck_profile' && parsed && typeof parsed === 'object') {
        const prof = parsed as Partial<StoredProfile>;
        if (!prof.avatarStyle) prof.avatarStyle = 'adventurer';
        if (!prof.avatarSeed) prof.avatarSeed = createRandomAvatarSeed();
        parsed = prof;
      }

      if (key === 'ck_history' && Array.isArray(parsed)) {
        const now = Date.now();
        parsed = (parsed as StoredMatchHistoryItem[])
          .map((item) => ({
            ...item,
            expiresAt: item.expiresAt ?? now + RETENTION_30_DAYS_MS,
          }))
          .filter((item) => !item.expiresAt || item.expiresAt > now);
      }

      const encrypted = await encryptVaultData(JSON.stringify(parsed));
      localStorage.setItem(key, encrypted);
      migratedKeys += 1;
    } catch {
      // preserve original key on unexpected parse failure
    }
  }

  try {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  } catch {
    // ignore
  }

  return { fromVersion, toVersion: CURRENT_SCHEMA_VERSION, migratedKeys };
}
