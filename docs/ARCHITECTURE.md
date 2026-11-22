# System Architecture Overview — KingdomLudo AAA

```
+---------------------------------------------------------------------------------------+
| Client Layer (React 19 + TypeScript + Zustand + Three.js + Web Audio + PWA)           |
|  - UI Views & 4-Corner HUD (src/components/views/*, src/components/game/*)            |
|    * Dedicated Red, Blue, Green, Yellow corner player cards with embedded dice        |
|    * Unmistakable [HUMAN] [YOUR PLAYER] vs [COMPUTER] [HARD AI] identity badges       |
|    * Dynamic Move Choice Pill, How-to-Play Modal & Explore Island Mode                |
|  - 3D Board & Living Island (src/three/*) + 2D SVG Fallback (src/components/game/*)   |
|    * Clean Ivory/Cream physical stone track (#F3EBDD / #E7D9BF / #D9C9AC)              |
|    * 4 Kingdom starting sanctuaries & 4 safe star tiles (#D7A64B)                      |
|    * 4 solid colored home runways & 4-quadrant central sanctuary dais                  |
|    * Animated ocean waves, foam, swimming fish, circling birds & atmospheric sky      |
|    * Dynamic camera framing with zero HUD occlusion                                    |
|    * Multi-stage victory rocket fireworks & confetti on authentic match win            |
|  - Deterministic Source-of-Truth Ludo Engine (src/engine/*)                           |
|  - Layered Procedural Web Audio Engine (src/audio/soundEngine.ts)                     |
|    * Zero external audio network requests (100% offline Web Audio API synthesis)       |
|  - Local Offline Persistence (src/persistence/localPersistence.ts)                    |
|    * Embedded SQLite on Android (Capacitor Community SQLite) & Browser IndexedDB      |
|    * Full backup export (exportBackupJSON) & restore (restoreBackupJSON)              |
|  - Cloud Synchronization (Optional Firebase Google Auth & Firestore Sync)             |
+-------------------------------------------+-------------------------------------------+
                                            | HTTPS / WebSocket (/ws, /api/*)
+-------------------------------------------v-------------------------------------------+
| Server Layer (Express + ws in server.ts & server/gameServer.ts)                       |
|  - Authoritative Room & Matchmaking Manager                                           |
|  - CSPRNG Dice & Turn Timer Enforcer                                                  |
|  - Capability-Based DB Factory (server/backend/providerFactory.ts)                     |
+-------------------------------------------+-------------------------------------------+
                                            |
                    +-----------------------+-----------------------+
                    v                       v                       v
      [SQLite (node:sqlite / OPFS)]   [Postgres / Supabase]   [Turso / D1 / Firebase]
      25-table normalized schema      Multi-region SQL        Serverless DB / Cloud Sync
      (003_full_normalized_schema.sql)
```

## Core Architectural Modules

1. **Deterministic Rule Engine (`src/engine/`)**:
   - `ludoEngine.ts`: Single authoritative source of truth for dice outcomes, legal move generation, piece progression, star sanctuaries, capture mechanics, and victory detection.
   - `boardTopology.ts`: Shared 15x15 coordinate definition ensuring 100% visual and logical synchronization between 2D and 3D boards.
   - `aiEngine.ts`: 3 distinct AI personalities across Easy, Medium, and Hard tiers.

2. **3D Living Fantasy Island & Board (`src/three/`)**:
   - `boardScene.ts`: Three.js scene manager featuring dynamic camera framing, high-contrast engraved bevels, 4-corner yard spotlights, and multi-stage rocket victory fireworks.
   - `proceduralTextures.ts`: GPU-accelerated canvas textures for ivory/cream stone tiles, safe star emblems, and 4-quadrant central sanctuary crown.
   - `islandWorld.ts`: Living fantasy island with wave vertex displacement, shoreline foam, swimming fish schools, circling birds, and 7 selectable world palettes.
   - `characterAnimController.ts`: Organic non-robotic character animation (idle breathing, scanning head tilts, ear twitches, squash-and-stretch hops).

3. **Responsive Tabletop HUD (`src/components/views/ActiveGameView.tsx`)**:
   - 4 corner player cards positioned over corners with zero board occlusion.
   - Unmistakable `[HUMAN] [YOUR PLAYER]` / `[COMPUTER] [HARD AI]` identity badges.
   - Interactive corner dice controls with bouncing `ROLL (Space)` and automated AI spinners.
   - Floating move selection pill when human moves are available.
   - 360° Island Explore Mode with landmark POI HUD.

4. **Normalized 25-Table SQLite Architecture (`database/migrations/`)**:
   - `001_initial_schema.sql`: Core schema migrations and match records.
   - `002_matchmaking_and_stats.sql`: Matchmaking events and leaderboard indexes.
   - `003_full_normalized_schema.sql`: 25 normalized tables covering profiles, preferences, character inventory, equipment, island themes, board themes, game moves, snapshots, achievements, audio/graphics preferences, and cloud sync queues.
