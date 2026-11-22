-- Migration 001: Core tables for Player Profiles and Match Records
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  auth_provider TEXT NOT NULL DEFAULT 'guest',
  selected_character_id TEXT NOT NULL DEFAULT 'ignis-drake',
  wins INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  captures_made INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  room_code TEXT,
  mode TEXT NOT NULL,
  board_theme_id TEXT NOT NULL,
  winner_color TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  duration_ms BIGINT NOT NULL,
  state_json TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);
