# Database Schema & Data Protection (`DATABASE_SCHEMA.md`)

## 1. Local Device Storage (IndexedDB `character_kingdom_ludo_db` + Encrypted `localStorage` Fallback)
- **KV Store (`kv`)**:
  - `profile` (`StoredProfile`): `profileId`, `isGuest`, `uid?`, `displayName`, `email?` (stripped from `localStorage` fallback), `avatarStyle`, `avatarSeed`, `selectedCharacterId`, `equippedCustomizations`, `stats`, `unlockedAchievements`, `onboardingCompleted`.
  - `settings` (`StoredSettings`): audio volumes, `graphicsQuality`, `prefer2DFallback`, `reducedMotion`, `language`, `selectedBoardThemeId`.
  - `active_match` (`MatchState`): resumable offline match snapshot.
- **Match History Store (`match_history`, PK: `matchId`, Index: `completedAt`)**:
  - Columns: `matchId`, `mode`, `boardThemeId`, `winnerColor`, `winnerName`, `playerCount`, `capturesMade`, `sixesRolled`, `durationMs`, `completedAt`, `expiresAt` (30-day TTL), `humanWon`, `hardAiBeaten`.
- **Schema Migration Metadata**:
  - `kingdomludo_schema_version`: currently `2` (`src/persistence/migrations.ts`). Upgrades legacy `enc:` XOR payloads to `aes:` AES-256-GCM and backfills `avatarStyle` / `avatarSeed` / `expiresAt`.

## 2. Cloudflare Durable Object Storage (`LudoRoomDO`)
- `room_code` (`string`): 6-char room identifier or `'QUEUE'`.
- `room_data` (`StoredRoomState`): `roomCode`, `hostClientId`, `boardThemeId`, `maxPlayers`, `rules`, `status` (`lobby` | `playing` | `finished`), `seats[]`, `matchState`, `turnDeadlineAt`. Deleted automatically when all players leave a lobby.

## 3. Supabase Cloud Tables (Optional Registered Sync)
- `profiles`: `id` (UUID PK, FK `auth.users`), `display_name`, `selected_character_id`, `updated_at`. Protected by Supabase RLS (`auth.uid() = id`).
- `matches`: `id`, `room_code`, `mode`, `board_theme_id`, `winner_color`, `player_count`, `duration_ms`, `created_at`.

## 4. Data Protection at Rest (ATLAS §13.6)
- **Passwords**: Handled exclusively by Supabase Auth (never stored in app DB or local storage).
- **Local Profile / Settings / Match History**: Encrypted at rest in fallback storage using Web Crypto **AES-256-GCM** (`PBKDF2-SHA256` derived key, random 12-byte IV per write, `aes:<iv>:<ciphertext>`).
- **Backup Exports**: Signed with a deterministic **SHA-256** `integrityHash`, with `email` and `uid` stripped.
- **Temporary Guest Retention**: 30-day (`30 * 24 * 60 * 60 * 1000` ms) TTL enforced on guest sessions and match history.
