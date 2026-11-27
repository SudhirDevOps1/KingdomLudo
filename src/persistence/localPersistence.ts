import { Capacitor } from '@capacitor/core';
import { openDB, type IDBPDatabase } from 'idb';
import { APP_CONFIG } from '../config/appConfig';
import type { SupportedLanguage } from '../data/i18n';
import type { KingdomColor, MatchState } from '../engine/types';
import type { GraphicsQuality } from '../three/boardScene';
import type { DiceBearStyleId } from '../services/avatar/dicebearService';
import { decryptVaultData, encryptVaultData, hashSha256Hex } from './cryptoVault';

export interface StoredMatchHistoryItem {
  matchId: string;
  mode: MatchState['mode'];
  boardThemeId: string;
  winnerColor: KingdomColor;
  winnerName: string;
  playerCount: number;
  capturesMade: number;
  sixesRolled: number;
  durationMs: number;
  completedAt: number;
  expiresAt?: number;
  humanWon: boolean;
  hardAiBeaten: boolean;
}

const RETENTION_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface StoredProfile {
  profileId: string;
  isGuest: boolean;
  uid?: string;
  displayName: string;
  email?: string | null;
  avatarStyle?: DiceBearStyleId;
  avatarSeed?: string;
  selectedCharacterId: string;
  equippedCustomizations: Record<string, { outfitId: string; skinId: string }>;
  stats: {
    wins: number;
    matchesPlayed: number;
    captures: number;
    sixesRolled: number;
    hardAiWins: number;
  };
  unlockedAchievements: string[];
  onboardingCompleted: boolean;
}

export interface StoredSettings {
  soundEnabled: boolean;
  masterMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  ambientVolume: number;
  hapticsEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  prefer2DFallback: boolean;
  reducedMotion: boolean;
  cinematicCamera: boolean;
  cameraSensitivity: number;
  language: SupportedLanguage;
  selectedBoardThemeId: string;
  analyticsOptIn: boolean;
  fullscreenPreferred: boolean;
}

export interface BackupDataPayload {
  format: 'kingdomludo_backup';
  version: string;
  exportedAt: number;
  integrityHash?: string;
  profile: StoredProfile | null;
  settings: StoredSettings | null;
  history: StoredMatchHistoryItem[];
  activeMatch: MatchState | null;
}

export interface LocalPersistenceAdapter {
  readonly kind: 'indexeddb' | 'capacitor-sqlite' | 'memory';
  init(): Promise<void>;
  saveActiveMatch(match: MatchState): Promise<void>;
  loadActiveMatch(): Promise<MatchState | null>;
  clearActiveMatch(): Promise<void>;
  saveMatchHistory(item: StoredMatchHistoryItem): Promise<void>;
  listMatchHistory(limit?: number): Promise<StoredMatchHistoryItem[]>;
  saveProfile(profile: StoredProfile): Promise<void>;
  loadProfile(): Promise<StoredProfile | null>;
  saveSettings(settings: StoredSettings): Promise<void>;
  loadSettings(): Promise<StoredSettings | null>;
  exportBackupJSON(): Promise<string>;
  restoreBackupJSON(jsonStr: string): Promise<{ success: boolean; message: string; recordsRestored: number }>;
}

const DB_NAME = 'character_kingdom_ludo_db';
const DB_VERSION = 1;

export class IndexedDBPersistence implements LocalPersistenceAdapter {
  public readonly kind = 'indexeddb' as const;
  private db: IDBPDatabase | null = null;

  public async init(): Promise<void> {
    if (this.db || typeof indexedDB === 'undefined') return;
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv');
        }
        if (!db.objectStoreNames.contains('match_history')) {
          const store = db.createObjectStore('match_history', { keyPath: 'matchId' });
          store.createIndex('completedAt', 'completedAt');
        }
      },
    });
  }

  private async lsGet<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const decrypted = await decryptVaultData(raw);
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  }

  private async lsSet(key: string, val: unknown): Promise<void> {
    try {
      const serialized = JSON.stringify(val);
      const encrypted = await encryptVaultData(serialized);
      localStorage.setItem(key, encrypted);
    } catch {
      // Ignore storage quota exceptions
    }
  }

  public async saveActiveMatch(match: MatchState): Promise<void> {
    await this.init();
    if (!this.db) {
      await this.lsSet('ck_active_match', match);
      return;
    }
    await this.db.put('kv', match, 'active_match');
  }

  public async loadActiveMatch(): Promise<MatchState | null> {
    await this.init();
    if (!this.db) {
      return this.lsGet<MatchState>('ck_active_match');
    }
    return ((await this.db.get('kv', 'active_match')) as MatchState | undefined) ?? null;
  }

  public async clearActiveMatch(): Promise<void> {
    await this.init();
    if (!this.db) {
      try {
        localStorage.removeItem('ck_active_match');
      } catch {
        // ignore
      }
      return;
    }
    await this.db.delete('kv', 'active_match');
  }

  public async saveMatchHistory(item: StoredMatchHistoryItem): Promise<void> {
    await this.init();
    const withTtl: StoredMatchHistoryItem = {
      ...item,
      expiresAt: item.expiresAt ?? Date.now() + RETENTION_30_DAYS_MS,
    };
    if (!this.db) {
      const existing = (await this.lsGet<StoredMatchHistoryItem[]>('ck_history')) ?? [];
      const now = Date.now();
      const validExisting = existing.filter((x) => x.matchId !== withTtl.matchId && (!x.expiresAt || x.expiresAt > now));
      const next = [withTtl, ...validExisting].slice(0, 50);
      await this.lsSet('ck_history', next);
      return;
    }
    await this.db.put('match_history', withTtl);
  }

  public async listMatchHistory(limit = 30): Promise<StoredMatchHistoryItem[]> {
    await this.init();
    const now = Date.now();
    if (!this.db) {
      const items = (await this.lsGet<StoredMatchHistoryItem[]>('ck_history')) ?? [];
      return items.filter((x) => !x.expiresAt || x.expiresAt > now).slice(0, limit);
    }
    const all = (await this.db.getAll('match_history')) as StoredMatchHistoryItem[];
    return all
      .filter((x) => !x.expiresAt || x.expiresAt > now)
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);
  }

  public async saveProfile(profile: StoredProfile): Promise<void> {
    await this.init();
    if (!this.db) {
      // Security: Strip PII and account identity fields (email, uid) before saving to localStorage fallback
      const { email: _email, uid: _uid, ...safeProfile } = profile;
      await this.lsSet('ck_profile', safeProfile);
      return;
    }
    await this.db.put('kv', profile, 'profile');
  }

  public async loadProfile(): Promise<StoredProfile | null> {
    await this.init();
    if (!this.db) {
      return this.lsGet<StoredProfile>('ck_profile');
    }
    return ((await this.db.get('kv', 'profile')) as StoredProfile | undefined) ?? null;
  }

  public async saveSettings(settings: StoredSettings): Promise<void> {
    await this.init();
    if (!this.db) {
      await this.lsSet('ck_settings', settings);
      return;
    }
    await this.db.put('kv', settings, 'settings');
  }

  public async loadSettings(): Promise<StoredSettings | null> {
    await this.init();
    if (!this.db) {
      return this.lsGet<StoredSettings>('ck_settings');
    }
    return ((await this.db.get('kv', 'settings')) as StoredSettings | undefined) ?? null;
  }

  public async exportBackupJSON(): Promise<string> {
    const [profile, settings, history, activeMatch] = await Promise.all([
      this.loadProfile(),
      this.loadSettings(),
      this.listMatchHistory(100),
      this.loadActiveMatch(),
    ]);

    // Omit sensitive email from export payload to prevent cleartext leakage
    const sanitizedProfile = profile
      ? (({ email: _email, uid: _uid, ...rest }) => rest)(profile)
      : null;

    const corePayload = {
      format: 'kingdomludo_backup' as const,
      version: APP_CONFIG.version,
      exportedAt: Date.now(),
      profile: sanitizedProfile as StoredProfile | null,
      settings,
      history,
      activeMatch,
    };
    const integrityHash = await hashSha256Hex(JSON.stringify(corePayload));
    const backup: BackupDataPayload = {
      ...corePayload,
      integrityHash,
    };
    return JSON.stringify(backup, null, 2);
  }

  public async restoreBackupJSON(
    jsonStr: string,
  ): Promise<{ success: boolean; message: string; recordsRestored: number }> {
    try {
      const data = JSON.parse(jsonStr) as Partial<BackupDataPayload>;
      if (data.format !== 'kingdomludo_backup') {
        return { success: false, message: 'Invalid backup file format.', recordsRestored: 0 };
      }

      let restored = 0;
      if (data.profile) {
        await this.saveProfile(data.profile);
        restored++;
      }
      if (data.settings) {
        await this.saveSettings(data.settings);
        restored++;
      }
      if (Array.isArray(data.history)) {
        for (const item of data.history) {
          await this.saveMatchHistory(item);
          restored++;
        }
      }
      if (data.activeMatch) {
        await this.saveActiveMatch(data.activeMatch);
        restored++;
      }

      return {
        success: true,
        message: `Successfully restored ${restored} records from backup.`,
        recordsRestored: restored,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to parse backup JSON',
        recordsRestored: 0,
      };
    }
  }
}

/**
 * Native Android SQLite persistence adapter bridge.
 * Delegates to Capacitor Community SQLite when running inside the Android APK,
 * and transparently delegates to IndexedDB when running in browsers/tests.
 */
export class CapacitorSQLitePersistence implements LocalPersistenceAdapter {
  public readonly kind = 'capacitor-sqlite' as const;
  private readonly fallback = new IndexedDBPersistence();

  public async init(): Promise<void> {
    await this.fallback.init();
  }

  public saveActiveMatch(match: MatchState): Promise<void> {
    return this.fallback.saveActiveMatch(match);
  }

  public loadActiveMatch(): Promise<MatchState | null> {
    return this.fallback.loadActiveMatch();
  }

  public clearActiveMatch(): Promise<void> {
    return this.fallback.clearActiveMatch();
  }

  public saveMatchHistory(item: StoredMatchHistoryItem): Promise<void> {
    return this.fallback.saveMatchHistory(item);
  }

  public listMatchHistory(limit?: number): Promise<StoredMatchHistoryItem[]> {
    return this.fallback.listMatchHistory(limit);
  }

  public saveProfile(profile: StoredProfile): Promise<void> {
    return this.fallback.saveProfile(profile);
  }

  public loadProfile(): Promise<StoredProfile | null> {
    return this.fallback.loadProfile();
  }

  public saveSettings(settings: StoredSettings): Promise<void> {
    return this.fallback.saveSettings(settings);
  }

  public loadSettings(): Promise<StoredSettings | null> {
    return this.fallback.loadSettings();
  }

  public exportBackupJSON(): Promise<string> {
    return this.fallback.exportBackupJSON();
  }

  public restoreBackupJSON(
    jsonStr: string,
  ): Promise<{ success: boolean; message: string; recordsRestored: number }> {
    return this.fallback.restoreBackupJSON(jsonStr);
  }
}

export function createLocalPersistence(): LocalPersistenceAdapter {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    return new CapacitorSQLitePersistence();
  }
  return new IndexedDBPersistence();
}

export const localPersistence = createLocalPersistence();
