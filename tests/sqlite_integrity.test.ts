import { describe, expect, it } from 'vitest';
import path from 'path';
import fs from 'fs';
import { SqliteAdapter } from '../server/backend/adapters/sqliteAdapter';

describe('Local Embedded SQLite Database Verification', () => {
  it('automatically connects, creates schema migrations, and prepares all tables', async () => {
    const testDbPath = path.resolve(process.cwd(), './data/kingdom-ludo.sqlite');
    expect(fs.existsSync(testDbPath)).toBe(true);

    const adapter = new SqliteAdapter(testDbPath);
    await adapter.connect();

    const health = await adapter.healthCheck();
    expect(health.ok).toBe(true);

    // Apply migrations autonomously
    await adapter.migrate();

    // Verify all essential tables exist
    const tables = await adapter.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name ASC",
    );
    const tableNames = tables.rows.map((r) => r.name);

    expect(tableNames).toContain('schema_migrations');
    expect(tableNames).toContain('players');
    expect(tableNames).toContain('matches');
    expect(tableNames).toContain('room_events');
    expect(tableNames).toContain('app_settings');
    expect(tableNames).toContain('player_profiles');
    expect(tableNames).toContain('game_sessions');
    expect(tableNames).toContain('game_moves');
    expect(tableNames).toContain('game_pieces');
    expect(tableNames).toContain('achievements');
    expect(tableNames).toContain('backup_metadata');
    expect(tableNames).toContain('cloud_sync_queue');

    // Test inserting and retrieving a test match record
    const matchId = `test_offline_${Date.now()}`;
    await adapter.query(
      `INSERT INTO matches (match_id, room_code, mode, board_theme_id, winner_color, player_count, duration_ms, state_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [matchId, null, 'vs_ai', 'royal-enchanted-courtyard', 'red', 4, 120000, JSON.stringify({ ok: true }), Date.now()],
    );

    const matchQuery = await adapter.query<{ match_id: string; winner_color: string }>(
      'SELECT match_id, winner_color FROM matches WHERE match_id = ?',
      [matchId],
    );
    expect(matchQuery.rows.length).toBe(1);
    expect(matchQuery.rows[0].match_id).toBe(matchId);
    expect(matchQuery.rows[0].winner_color).toBe('red');

    // Clean up test record
    await adapter.query('DELETE FROM matches WHERE match_id = ?', [matchId]);
    await adapter.disconnect();
  });
});
