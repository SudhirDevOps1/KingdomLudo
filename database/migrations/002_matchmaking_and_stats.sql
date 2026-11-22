-- Migration 002: Matchmaking history and player leaderboard indexes
CREATE TABLE IF NOT EXISTS room_events (
  event_id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_room_events_code ON room_events (room_code, created_at);
CREATE INDEX IF NOT EXISTS idx_players_wins ON players (wins DESC, matches_played DESC);
