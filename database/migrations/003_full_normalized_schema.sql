-- Migration 003: 25-Table Normalized Production Schema for Offline & Online Game Operations

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  setting_val_json TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_profiles (
  profile_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'guest',
  is_guest INTEGER NOT NULL DEFAULT 1,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_preferences (
  profile_id TEXT PRIMARY KEY,
  language TEXT NOT NULL DEFAULT 'en',
  reduced_motion INTEGER NOT NULL DEFAULT 0,
  prefer_2d INTEGER NOT NULL DEFAULT 0,
  cinematic_camera INTEGER NOT NULL DEFAULT 1,
  sound_enabled INTEGER NOT NULL DEFAULT 1,
  haptics_enabled INTEGER NOT NULL DEFAULT 1,
  updated_at BIGINT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kingdoms (
  kingdom_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  motto TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS characters (
  character_id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  archetype TEXT NOT NULL,
  story TEXT,
  FOREIGN KEY (kingdom_id) REFERENCES kingdoms(kingdom_id)
);

CREATE TABLE IF NOT EXISTS character_skins (
  skin_id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  FOREIGN KEY (character_id) REFERENCES characters(character_id)
);

CREATE TABLE IF NOT EXISTS player_character_inventory (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  unlocked_at BIGINT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS player_character_equipment (
  profile_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  equipped_skin_id TEXT NOT NULL,
  equipped_outfit_id TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (profile_id, character_id)
);

CREATE TABLE IF NOT EXISTS island_themes (
  theme_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  sky_hex TEXT NOT NULL,
  fog_hex TEXT NOT NULL,
  sun_hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS board_themes (
  theme_id TEXT PRIMARY KEY,
  island_theme_id TEXT NOT NULL,
  name TEXT NOT NULL,
  plinth_hex TEXT NOT NULL,
  tabletop_hex TEXT NOT NULL,
  gold_trim_hex TEXT NOT NULL,
  FOREIGN KEY (island_theme_id) REFERENCES island_themes(theme_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  session_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  board_theme_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  winner_color TEXT,
  started_at BIGINT NOT NULL,
  finished_at BIGINT
);

CREATE TABLE IF NOT EXISTS game_players (
  session_id TEXT NOT NULL,
  seat_index INTEGER NOT NULL,
  profile_id TEXT,
  color TEXT NOT NULL,
  player_type TEXT NOT NULL,
  character_id TEXT NOT NULL,
  captures_made INTEGER NOT NULL DEFAULT 0,
  sixes_rolled INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, seat_index),
  FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_pieces (
  session_id TEXT NOT NULL,
  seat_index INTEGER NOT NULL,
  piece_index INTEGER NOT NULL,
  progress INTEGER NOT NULL DEFAULT -1,
  is_safe INTEGER NOT NULL DEFAULT 1,
  is_home INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, seat_index, piece_index),
  FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_moves (
  move_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  move_seq INTEGER NOT NULL,
  seat_index INTEGER NOT NULL,
  dice_value INTEGER NOT NULL,
  piece_index INTEGER,
  from_progress INTEGER,
  to_progress INTEGER,
  timestamp BIGINT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  move_seq INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS match_history (
  history_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  winner_color TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  duration_ms BIGINT NOT NULL,
  captures_made INTEGER NOT NULL DEFAULT 0,
  sixes_rolled INTEGER NOT NULL DEFAULT 0,
  completed_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  achievement_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'bronze',
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_achievements (
  profile_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at BIGINT NOT NULL,
  PRIMARY KEY (profile_id, achievement_id),
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audio_preferences (
  profile_id TEXT PRIMARY KEY,
  master_muted INTEGER NOT NULL DEFAULT 0,
  sfx_volume REAL NOT NULL DEFAULT 0.8,
  music_volume REAL NOT NULL DEFAULT 0.6,
  ambient_volume REAL NOT NULL DEFAULT 0.5,
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS graphics_preferences (
  profile_id TEXT PRIMARY KEY,
  quality TEXT NOT NULL DEFAULT 'high',
  target_fps INTEGER NOT NULL DEFAULT 60,
  shadows_enabled INTEGER NOT NULL DEFAULT 1,
  particles_enabled INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tutorial_progress (
  profile_id TEXT PRIMARY KEY,
  completed_slides_mask INTEGER NOT NULL DEFAULT 0,
  tutorial_completed INTEGER NOT NULL DEFAULT 0,
  completed_at BIGINT,
  FOREIGN KEY (profile_id) REFERENCES player_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS migration_history (
  migration_id TEXT PRIMARY KEY,
  migration_name TEXT NOT NULL,
  batch_no INTEGER NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  applied_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_metadata (
  backup_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  app_version TEXT NOT NULL,
  table_count INTEGER NOT NULL,
  record_count INTEGER NOT NULL,
  exported_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS cloud_sync_queue (
  queue_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS cloud_sync_conflicts (
  conflict_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_payload_json TEXT NOT NULL,
  remote_payload_json TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_at BIGINT
);

-- Production Indexes
CREATE INDEX IF NOT EXISTS idx_game_moves_session ON game_moves (session_id, move_seq);
CREATE INDEX IF NOT EXISTS idx_game_snapshots_session ON game_snapshots (session_id, move_seq);
CREATE INDEX IF NOT EXISTS idx_match_history_profile ON match_history (profile_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON cloud_sync_queue (created_at ASC);
