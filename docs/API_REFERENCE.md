# API & WebSocket Reference

## 1. Cloudflare Worker Edge Endpoints (`server/cloudflare/worker.ts`)
All `/api/*` and `/ws` routes enforce per-IP sliding-window rate limiting (`30 req / 60s`), `Cache-Control: no-store`, and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`).

- `GET /api/health`
  - **200**: `{ "status": "ok" }` (minimal liveness check, no internal stack leakage)
- `GET /api/altcha/challenge`
  - **200**: `{ "algorithm": "SHA-256", "challenge": "<hex>", "maxnumber": 50000, "salt": "<nonce>?expires=<unix>", "signature": "<hmac_hex>" }`
- `POST /api/altcha/verify`
  - **Request**: `{ "payload": "<base64_altcha_solution>" }`
  - **200**: `{ "ok": true }` | **403**: `{ "ok": false, "reason": "..." }`
- `POST /api/guest/session` *(ALTCHA-protected)*
  - **Request**: `{ "altcha": "<base64_altcha_solution>" }`
  - **200**: `{ "guestId": "gst_...", "token": "...", "createdAt": <ms>, "expiresAt": <ms+30d> }`
  - **403**: `{ "error": "Human verification required" }` | **405**: Method not allowed
- `GET /api/config/capabilities`
  - **200**: `{ "activeProvider": { "provider": "edge-multiplayer", ... }, "supportedProviders": [...] }`

## 2. Express Local/Node Server Endpoints (`server.ts`)
- `GET /api/health` → `{ status, provider, dbHealth, uptimeSeconds }`
- `GET /api/config/capabilities` → `{ activeProvider, validation, supportedProviders }`
- `GET /api/matches` → `{ matches: [...] }` (latest 20 completed matches)
- `GET /api/rooms/:code` → `{ room }` or `404`
- `GET /api/server-stats` → `{ activeRooms, queuedPlayers }`

## 3. WebSocket Multiplayer Gateway (`/ws?roomCode=<CODE|QUEUE>`)
- **Upgrade Validation**: Rejects missing/invalid `roomCode` (`400`), enforcing per-room isolated Cloudflare Durable Objects (`idFromName(roomCode)`).
- **Guardrails**: Max payload `4096` bytes; per-socket rate limit `25 msgs / 3s`.
- **Client → Server** (`src/shared/protocol.ts`):
  - `room:create`, `room:join`, `room:update_profile`, `room:ready`, `room:start`, `room:leave`, `match:roll`, `match:move`, `match:reconnect`, `queue:join`, `queue:leave`
- **Server → Client**:
  - `room:snapshot`, `match:event`, `queue:status`, `queue:matched`, `error` (`ROOM_NOT_FOUND`, `ROOM_EXISTS`, `ROOM_FULL`, `MATCH_IN_PROGRESS`, `NOT_HOST`, `NOT_YOUR_TURN`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`)
