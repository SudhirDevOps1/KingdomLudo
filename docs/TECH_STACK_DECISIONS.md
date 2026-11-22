# Technical Stack Decisions & Trade-offs

## 1. 3D Rendering: Three.js (Imperative Engine) vs React Three Fiber vs Babylon.js
- **Decision**: Direct Three.js (`three`) wrapped inside an imperative `LudoBoardViewport` class mounted via `useRef`.
- **Advantages**: Zero React reconciliation overhead inside the 60fps render loop, deterministic disposal of geometries/materials/textures, explicit `PMREMGenerator(RoomEnvironment)` lighting, and clean software-WebGL detection.
- **Disadvantages**: Requires manual synchronization between Zustand `MatchState` and Three.js entities.
- **Maintenance & Free-Tier**: MIT licensed, zero licensing costs, long-term ecosystem stability.

## 2. UI Layer: React 19 + TypeScript + Tailwind CSS v4 + Zustand
- **Decision**: React 19 SPA with Zustand (`zustand`) single store.
- **Advantages**: Instant state selectors, clean separation between UI overlays and Three.js loop, minimal bundle footprint compared to Redux Toolkit.
- **Disadvantages**: Single store requires careful modularization as screens scale.

## 3. Multiplayer Transport: Built-in Express + `ws` WebSockets vs SaaS Realtime (Photon / Colyseus Cloud)
- **Decision**: Self-hosted Express + `ws` authoritative game server in `server.ts` + `server/gameServer.ts`.
- **Advantages**: Zero vendor lock-in, sub-millisecond CSPRNG dice generation (`crypto.randomInt`), deterministic validation on Node.js, runs on any free Node container (Render, Fly.io, Railway).
- **Disadvantages & Free-Tier Limits**: Single-node in-memory room map (`this.rooms`); scaling beyond one Node instance would require Redis Pub/Sub room state sharing. Free tiers (e.g., Render free web service) spin down after inactivity, causing initial WebSocket cold-start latency.

## 4. Database Portability: Custom Capability Adapter Interface vs Heavy ORM
- **Decision**: Capability-based `DatabaseProvider` interface (`server/backend/interfaces.ts`) with native `node:sqlite`, `pg`, `@libsql/client`, Cloudflare D1 REST, and Firebase client sync.
- **Advantages**: Zero C++ native compile issues (`node:sqlite` built into Node 22+), zero lock-in between local SQLite, Postgres (Supabase/Neon), Turso, and D1.
- **Disadvantages & Free-Tier Limits**: Schema changes must remain compatible with both SQLite and PostgreSQL dialects; free tiers enforce row/storage/compute caps (Neon 0.5 GB, Supabase 500 MB, Turso 5 GB, Firestore 1 GB + 50k reads/day).

## 5. Mobile Wrapper: Capacitor 8 vs React Native / Unity
- **Decision**: Capacitor 8 wrapping the Vite Web/PWA build.
- **Advantages**: Single codebase for Web, PWA, and Android APK/AAB with native haptics, status bar, splash screen, and deep linking.
- **Disadvantages**: WebView WebGL performance is lower than native Vulkan/Unity on very low-end Android devices—mitigated via `low`/`medium`/`high` DPR caps and the 2D SVG fallback mode.
