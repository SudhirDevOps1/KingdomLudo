# Database Migrations

SQL migrations live in `/database/migrations/` and run idempotently on server boot inside `provider.migrate()` tracked via the `schema_migrations` table:

- `001_initial_schema.sql`: Creates `schema_migrations`, `players` (`player_id`, `display_name`, `auth_provider`, `selected_character_id`, `wins`, `matches_played`, `captures_made`, timestamps), and `matches` (`match_id`, `room_code`, `mode`, `board_theme_id`, `winner_color`, `player_count`, `duration_ms`, `state_json`, `created_at`).
- `002_matchmaking_and_stats.sql`: Creates `matchmaking_audit` and `player_achievements` tables with descending timestamp indexes.

SQLite, PostgreSQL, Turso, and D1 adapters execute each unapplied `.sql` file once in lexical order.
