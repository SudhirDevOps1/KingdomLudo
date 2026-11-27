# User Flows (`USER_FLOWS.md`)

## 1. First-Load & Offline / AI Match
- **Entry**: User opens `/` → `bootstrap()` runs `runDataMigrations()` → lands directly on `HomeHub` (`screen: 'home'`).
- **Happy Path**: Click **Play vs AI** or **Pass & Play** → configure 2–4 seats & rules in `MatchSetupView` → click **Launch Match** → `ActiveGameView` renders 3D board (or 2D SVG fallback) → roll dice (`Space` or corner button), move highlighted piece (`1–4` or click) → finish match → stats & 30-day history saved locally.
- **Error / Edge Path**: If WebGL is unavailable, `Board2DFallback` renders automatically without blocking gameplay.

## 2. Private Room Invite & Online Multiplayer
- **Entry**: User opens **Online Rooms** (`MultiplayerView`, idle with zero background WS traffic).
- **Host Path**: Enter Commander Name & select Hero → complete **ALTCHA "I am not a robot"** check → click **Host Private Room** → client generates 6-char code (e.g. `K7M9PQ`) and connects to `/ws?roomCode=K7M9PQ` → share **Copy Code** or **Copy Invite Link** (`/?room=K7M9PQ`) → when ≥2 players join, host clicks **Start Match** → all players transition to `ActiveGameView`.
- **Join via Invite Link**: Friend opens `https://<host>/?room=K7M9PQ` → `bootstrap()` detects `?room=` → opens `MultiplayerView` with `K7M9PQ` pre-filled → click **Join Room** → remote friend appears as `[ONLINE RIVAL]` with `RIVAL TURN` indicator.
- **Error / Edge Path**: Invalid/non-existent room code returns `ROOM_NOT_FOUND` toast; spamming WS messages triggers `RATE_LIMITED`; leaving room cleans up seat & closes WebSocket.

## 3. Cloud Account Sync & DiceBear Avatar Studio
- **Entry**: User clicks Profile pill in `TopNav` → `ProfileView`.
- **Avatar Studio**: Pick any of 6 DiceBear styles (`Adventurer`, `Mecha Bot`, `Royal Portrait`, `Commander`, `Pixel Knight`, `Kingdom Crest`), edit seed or click **Randomize** → encrypted locally & shown in `TopNav`.
- **Auth Path**: Complete **ALTCHA** check → Sign In / Register with Email or Google OAuth.
- **Error / Edge Path**: If Supabase returns `Email not confirmed`, inline amber banner offers **Resend Confirmation Email**. If Google provider is disabled in Supabase, toast reports the exact error without crashing.

## 4. Legal & Privacy Navigation
- **Entry**: Click Footer links (`Terms of Service`, `Privacy Policy`, `Cookies & Storage`, `Fair Play`) or visit `/terms`, `/privacy`, `/cookies`, `/fair-play` directly → `LegalView` opens on the matching tab.
