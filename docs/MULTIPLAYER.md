# Online Multiplayer Protocol (`src/shared/protocol.ts`)

## Transport
WebSocket endpoint `/ws` served alongside Express HTTP APIs on port `3000` (configurable on client via `VITE_WS_URL`).

## Flows Implemented
1. **Private Rooms**:
   - Host sends `room:create` → server assigns unique 6-character code (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) and broadcasts `room:snapshot`.
   - Invite link format: `https://<host>/?room=CODE` (handled by `extractRoomCodeFromUrl` on Web & Capacitor `appUrlOpen`).
   - Challengers send `room:join` and `room:ready`; Host sends `room:start`.
2. **Public Matchmaking**:
   - Players send `queue:join` (`preferredPlayers: 2 | 4`) and receive `queue:status` updates; once enough challengers match, server creates a room and emits `queue:matched` + `room:snapshot`.
3. **Authoritative Turn & Reconnect**:
   - `match:roll`: Server generates `crypto.randomInt(1, 7)` (never trusts client values), verifies `activeSeatIndex` and `expectedSeq` idempotency.
   - `match:move`: Server validates `pieceIndex` against `legalMoves`.
   - `match:reconnect`: Restores `connected = true` and resends full `room:snapshot`.
   - Turn deadlines trigger `forceTurnTimeout` automatically if a player idles past `turnTimerSeconds`.
