# API & WebSocket Reference

## HTTP Endpoints (`server.ts`)
- `GET /api/health` → `{ status: 'healthy' | 'degraded', provider, dbHealth: { ok, latencyMs, message }, uptimeSeconds }`
- `GET /api/config/capabilities` → `{ activeProvider, validation, supportedProviders }`
- `GET /api/matches` → `{ matches: [...] }` (latest 20 completed matches)
- `GET /api/rooms/:code` → `{ room }` or `404`
- `GET /api/server-stats` → `{ activeRooms, queuedPlayers }`

## WebSocket Endpoint (`/ws`)
- **Client → Server**: `room:create`, `room:join`, `room:ready`, `room:start`, `room:leave`, `match:roll`, `match:move`, `match:reconnect`, `queue:join`, `queue:leave`
- **Server → Client**: `room:snapshot`, `match:event`, `queue:status`, `queue:matched`, `error`
