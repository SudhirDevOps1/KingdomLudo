# MEMORY.md — Durable Engineering Memory

- **Current Version**: `0.1.0-alpha.0` (`package.json#version`)
- **Cloudflare Hosting**: Deployed via GitHub-connected Cloudflare Workers (`wrangler.jsonc`). Must use `not_found_handling: "single-page-application"` with `html_handling: "auto-trailing-slash"` (Wrangler v4 schema).
- **Multiplayer Room Isolation**: Fixed global `'LOBBY'` (`4B070B`) collision by requiring `?roomCode=<CODE|QUEUE>` on `/ws` upgrades in `server/cloudflare/worker.ts` and generating unique 6-char room codes client-side.
- **Online Rival UI**: Remote players have `type: 'remote'` in `gameStore.ts`; `ActiveGameView.tsx` distinguishes `isLocalHuman`, `isRemoteHuman`, and `isBot`.
- **Anti-Spam & Security**: Self-hosted ALTCHA SHA-256 Proof-of-Work (`server/cloudflare/altcha.ts` + `src/components/common/AltchaWidget.tsx`), per-IP rate limits (`30 req/min`), and HTTP security headers on all Worker responses.
- **Local Encryption & Migrations**: `cryptoVault.ts` encrypts with Web Crypto AES-256-GCM (`aes:...`), and `migrations.ts` (`CURRENT_SCHEMA_VERSION = 2`) migrates legacy `enc:` XOR records and backfills DiceBear avatars + 30-day TTLs.
- **Avatars**: Uses `@dicebear/core@9.4.3` + `@dicebear/collection@9.4.2` offline SVG data URIs (`src/services/avatar/dicebearService.ts`).
