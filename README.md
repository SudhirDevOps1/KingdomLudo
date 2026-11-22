# KingdomLudo (`0.1.0-alpha.0`)

**Channel:** Alpha (`v0.1.0-alpha.0`) · **Stability:** Early development

KingdomLudo is a 3D fantasy island tabletop Ludo game built with React 19, TypeScript, Three.js, Express + WebSockets, IndexedDB, Firebase Auth & Firestore, Capacitor Android configuration, and interchangeable server database adapters.

## Key Implemented Features

- **Playable 3D Ludo Engine**: Exact 15×15 board topology (52-cell main ring, 8 star safe zones, colored home lanes, and central Royal Crown Sanctuary) with 2, 3, and 4 player seats.
- **Living 3D Fantasy Island & 6 Environments**: Animated PBR ocean, cliff waterfalls, mist, distant castles with fluttering flags, swaying foliage, clouds, birds, and 6 selectable themes anchored on the **Royal Enchanted Courtyard** island.
- **12 Original Articulated 3D Heroes**: Multi-part grounded `THREE.Group` models across Crimson Spire, Cobalt Bastion, Emerald Grove, and Sovereign Sun — each with 3 outfits, 3 colorways, 14-state animation reactions (`idle`, `walk`, `hop`, `capture`, `celebrate`, `victory`, etc.), and optional external `.glb` attachment via `GLTFLoader`.
- **Offline & AI Gameplay**: Pass & Play, Play vs Computer (`easy`, `medium`, `hard` AI), Practice Skirmish Challenges, and auto-saved mid-match resume via IndexedDB.
- **Authoritative Online Multiplayer**: Built-in Express + `ws` WebSocket server with CSPRNG dice rolls (`crypto.randomInt`), 6-character private invite rooms (`?room=CODE`), turn timers, reconnect recovery, and 2P/4P public matchmaking queues.
- **Automatic 2D Fallback & Accessibility**: Software/no-WebGL detection, live 2D SVG board toggle, Zen full-viewport play mode, reduced-motion support, and full keyboard controls (`Space`, `1-4`, `C`, `H`, `Esc`).
- **PWA & Capacitor Android**: Installable Progressive Web App via `vite-plugin-pwa`, bespoke 3D Royal Crown & Ludo Dice icons across Web/PWA/Android (`com.kingdomludo.app`), and automated CI/CD release workflows.
- **Interchangeable Database Adapters**: Capability-based backend abstraction supporting SQLite (`node:sqlite` default), PostgreSQL / Supabase / Neon (`pg`), Turso (`@libsql/client`), Cloudflare D1 HTTP API, and Firebase Firestore.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` — Start Express + WebSocket server + Vite middleware on port `3000`
- `npm run build` — Build production client bundle (`dist/`)
- `npm start` — Run production Express + WebSocket server serving `dist/`
- `npm run lint` — TypeScript strict check (`tsc --noEmit`) + ESLint security rules check
- `npm test` — Execute Vitest unit and integration test suites

## Honest Alpha Release Notes (`0.1.0-alpha.0`)

- **Web, PWA, Multiplayer Server & Tests**: Fully built and verified locally on Linux Node.js.
- **Android APK / AAB Binaries**: Configured cleanly (`com.kingdomludo.app`, Gradle, mipmaps, adaptive icons) for automated builds via `.github/workflows/android-debug.yml` and `.github/workflows/android-release.yml`; Android SDK/JDK is not installed inside this build container, so APK/AAB compilation is deferred to GitHub Actions or a local Android Studio/Gradle workstation.
- **3D Character Models**: All 12 heroes render and animate procedurally by default; external skeletal `.glb` files can be wired via `optionalGlbPath`.

## Documentation

Full architecture, design, security, database, multiplayer, Android, feature status, and release guides live in [`docs/`](./docs/).
