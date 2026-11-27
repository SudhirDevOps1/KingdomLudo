# Online Multiplayer Protocol (`src/shared/protocol.ts`)

> Checked: 2026-11-27

## 1. Transport & Room Isolation
- **WebSocket Gateway**: `/ws?roomCode=<CODE|QUEUE>` (Cloudflare Workers + `LudoRoomDO` Durable Objects with WebSocket Hibernation, or Express `ws` on local Node).
- **Per-Room Isolation**: Every room maps to its own isolated Durable Object (`idFromName(roomCode)`). Connections without a valid `roomCode` are rejected with `400`.
- **Auto-Cleanup**: Finished (`GAME_OVER`) or empty/abandoned rooms trigger `state.storage.deleteAll()` via Durable Object `alarm()` after 60 seconds, leaving zero stale room data in storage.

## 2. Flows Implemented
1. **Private Rooms**:
   - Host sends `room:create` (with custom `roomName` + client-generated 6-char `roomCode`) → server broadcasts `room:snapshot`.
   - Invite link format: `https://<host>/?room=CODE` (handled on Web `bootstrap()` & Capacitor `appUrlOpen`).
   - Challengers send `room:join` and `room:ready`; Host sends `room:start`.
2. **Public Matchmaking**:
   - Players connect to `/ws?roomCode=QUEUE`, send `queue:join` (`preferredPlayers: 2 | 4`), and once paired receive `queue:matched` with a fresh `roomCode`.
3. **Authoritative Turn & Reconnect**:
   - `match:roll`: Server generates dice value (`crypto.randomInt` / `Math.floor`), verifies `activeSeatIndex`.
   - `match:move`: Server validates `pieceIndex` against `legalMoves`.
   - `match:reconnect`: Restores `connected = true` and resends full `room:snapshot`.
   - Turn deadlines trigger `forceTurnTimeout` automatically after 25s.
4. **Ephemeral Text Chat & WebRTC P2P Voice**:
   - `chat:send`: Broadcasts `chat:message` in memory only (max 200 chars, never persisted to any database).
   - `voice:signal`: Relays WebRTC SDP/ICE signaling (`offer`, `answer`, `ice`, `join`, `leave`) directly between peers.

---

## 3. WebSocket & WebRTC Requirements & Project Limits

### What WebSocket & WebRTC Require
- **WebSocket**: HTTP Upgrade endpoint (`/ws?roomCode=...`) + Durable Object (`LudoRoomDO`).
- **WebRTC P2P Voice**:
  1. Signaling channel (uses existing room WebSocket `voice:signal`).
  2. STUN server (`stun:stun.l.google.com:19302`) for NAT traversal (~80–85% of networks).
  3. Optional TURN server (only needed behind strict symmetric NAT/corporate firewalls; if direct P2P cannot connect, voice degrades gracefully while text chat & gameplay continue).

### Enforced Limits (Platform + App Guardrails)
| Surface | Limit | Reason |
|---|---|---|
| **Cloudflare Free Tier (Workers & DO)** | `100,000` req/day (Workers & DO); Hibernation API avoids idle WS duration burn | Free-tier budget discipline (https://developers.cloudflare.com/workers/platform/pricing/) |
| **WebSocket Edge Upgrades** | `30` requests / `60s` per IP (`worker.ts`) | DDoS & spam protection |
| **WebSocket Message Size & Rate** | `4,096` bytes max payload; `25` messages / `3s` per socket (`ludoRoomDO.ts`) | Prevents flooding Durable Object |
| **In-Room Text Chat** | `200` chars/message; `50` messages in client memory; `0` DB persistence | Privacy-first & zero storage bloat |
| **WebRTC Voice Chat** | Audio-only P2P; max `3` remote peers (`4P` room); `45` min auto-session cap | Zero server audio billing; protects mobile battery & bandwidth |
| **Video Call & File Transfer** | **Disabled** (Not enabled in UI) | Keeps 3D WebGL at 60fps and avoids unmoderated file sharing |
