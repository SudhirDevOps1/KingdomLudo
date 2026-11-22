# Game Server Architecture (`server.ts` & `server/gameServer.ts`)

- **Express + `ws` Unified Port**: In development, `tsx server.ts` mounts Vite's `middlewareMode` inside Express on port `3000`. In production, `NODE_ENV=production tsx server.ts` serves static `dist/` assets alongside `/api/*` and `/ws`.
- **REST Endpoints**:
  - `GET /api/health` — Returns server uptime and active `DatabaseProvider.healthCheck()` status/latency.
  - `GET /api/config/capabilities` — Exposes non-secret active provider capabilities and the supported provider matrix.
  - `GET /api/matches` — Paginated match history from configured SQL backend.
  - `GET /api/rooms/:code` — Non-sensitive room lobby metadata lookup.
  - `GET /api/server-stats` — Active room count and matchmaking queue depth.
- **Abuse & Rate Controls**: Per-socket sliding-window rate limiter (`WS_RATE_LIMIT_PER_MIN`, default `120` msgs/min), display name sanitization, and strict seat ownership verification.
