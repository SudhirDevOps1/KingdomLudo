# Testing Strategy & Verification

## Test Suites (`npm test` via Vitest)
- `tests/engine.test.ts`: 52-cell topology, 8 safe zones, CSPRNG dice bounds, yard deployment on 6, three-sixes forfeit, opponent captures, safe star immunity, exact home win condition, and turn timeouts.
- `tests/ai.test.ts`: Tactical scoring verification for Hard (capture priority) and Medium (home entry priority) AI.
- `tests/adapters.test.ts`: Provider capability matrix, env validation per provider, and live SQLite migrations, transactions, and pagination (`node:sqlite` in Node test environment).
- `tests/server.test.ts`: Boots real Express + `ws` server on ephemeral port, tests `/api/health`, `/api/config/capabilities`, WebSocket room creation/join/ready/start, out-of-turn rejection, and CSPRNG server roll.
- `tests/ui.test.tsx`: React Testing Library checks for `HomeHub` and `Board2DFallback` interactive callbacks.

## Static Analysis & Security
- `npm run lint`: Executes `tsc --noEmit` + `eslint .` (TypeScript strict mode + ESLint security rules).
- `npm run build`: Compiles production bundle (`dist/`) + PWA Workbox Service Worker.
