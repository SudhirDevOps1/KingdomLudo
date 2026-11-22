// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateProviderEnv } from '../server/backend/envValidator';
import { createConfiguredDatabaseProvider, PROVIDER_MATRIX } from '../server/backend/providerFactory';

const tempFiles: string[] = [];

afterEach(() => {
  for (const f of tempFiles.splice(0)) {
    if (fs.existsSync(f)) {
      fs.rmSync(f, { force: true });
    }
  }
});

describe('Database Provider Abstraction & SQLite Adapter', () => {
  it('exposes complete provider capability matrix', () => {
    expect(PROVIDER_MATRIX.map((p) => p.provider)).toEqual([
      'sqlite',
      'postgres',
      'supabase',
      'neon',
      'turso',
      'd1',
    ]);
  });

  it('validates missing environment variables safely per provider', () => {
    const pgCheck = validateProviderEnv({ DATABASE_PROVIDER: 'postgres' });
    expect(pgCheck.valid).toBe(false);
    expect(pgCheck.missingVars).toContain('POSTGRES_URL');

    const tursoCheck = validateProviderEnv({
      DATABASE_PROVIDER: 'turso',
      TURSO_DATABASE_URL: 'libsql://demo',
    });
    expect(tursoCheck.valid).toBe(false);
    expect(tursoCheck.missingVars).toContain('TURSO_AUTH_TOKEN');

    const d1Check = validateProviderEnv({ DATABASE_PROVIDER: 'd1' });
    expect(d1Check.valid).toBe(false);
    expect(d1Check.missingVars.length).toBeGreaterThanOrEqual(3);
  });

  it('initializes SQLite adapter, runs migrations, transactions, and paginated queries', async () => {
    const dbPath = path.join(os.tmpdir(), `ck_ludo_test_${Date.now()}.sqlite`);
    tempFiles.push(dbPath);

    const { provider } = await createConfiguredDatabaseProvider({
      DATABASE_PROVIDER: 'sqlite',
      SQLITE_DB_PATH: dbPath,
    });

    const health = await provider.healthCheck();
    expect(health.ok).toBe(true);
    expect(provider.capabilities.provider).toBe('sqlite');

    await provider.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO players (player_id, display_name, auth_provider, selected_character_id, wins, matches_played, captures_made, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['usr_1', 'Aurelia Tester', 'guest', 'ignis-drake', 2, 5, 3, Date.now(), Date.now()],
      );
      await tx.query(
        `INSERT INTO matches (match_id, room_code, mode, board_theme_id, winner_color, player_count, state_json, duration_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['m_1', 'ABC123', 'vs_ai', 'royal-enchanted-courtyard', 'red', 4, '{}', 45000, Date.now()],
      );
    });

    const userRes = await provider.query<{ display_name: string; wins: number }>(
      'SELECT display_name, wins FROM players WHERE player_id = ?',
      ['usr_1'],
    );
    expect(userRes.rows[0]?.display_name).toBe('Aurelia Tester');
    expect(userRes.rows[0]?.wins).toBe(2);

    const paged = await provider.paginate<{ match_id: string }>(
      'SELECT match_id FROM matches ORDER BY created_at DESC',
      [],
      { limit: 10, offset: 0 },
    );
    expect(paged.rowCount).toBe(1);
    expect(paged.rows[0].match_id).toBe('m_1');

    await provider.disconnect();
  });
});
