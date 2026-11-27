# AGENTS.md — KingdomLudo Project Rules

## 1. Project Identity
- **Name**: KingdomLudo (`com.kingdomludo.app`)
- **Type**: 3D Fantasy Island Ludo (Web, PWA, Android Capacitor 8, Cloudflare Workers + Durable Objects)
- **SSOT Version**: `package.json#version` (synced via `pnpm run version:sync`)

## 2. Commands
- `pnpm test` — Vitest unit & integration tests (jsdom + node)
- `pnpm run lint` — `tsc --noEmit && eslint .`
- `pnpm run build` — `tsx scripts/sync-version.ts sync && vite build`
- `pnpm exec wrangler deploy --dry-run` — Validate Cloudflare Worker + Durable Objects + Assets bundle
- `pnpm run version:bump <patch|minor|major>` — Bump SSOT version

## 3. Architecture & Conventions
- **Package Manager**: `pnpm` (`pnpm-lock.yaml` is authoritative; never commit `bun.lock` or `package-lock.json`).
- **3D Engine**: Imperative Three.js in `src/three/` — keep React reconciliation out of the 60fps loop.
- **Icons**: Use `lucide-react` SVG icons only. Never use raw Unicode emojis as UI icons.
- **Multiplayer**: Always pass `?roomCode=<CODE|QUEUE>` to `/ws` so each room maps to its own isolated `LudoRoomDO`.
- **Security**:
  - Never put `SUPABASE_SERVICE_ROLE_KEY` or `ALTCHA_HMAC_KEY` in `VITE_*` variables.
  - Local fallback storage uses AES-256-GCM (`src/persistence/cryptoVault.ts`) and runs versioned migrations (`src/persistence/migrations.ts`) on startup.
- **Docs**: UPPER_SNAKE_CASE in `docs/` (matching existing repo convention) and UPPERCASE at root.
