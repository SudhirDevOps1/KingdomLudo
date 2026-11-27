# TASKS.md — KingdomLudo Task Tracker

## Done
- [x] Core 3D Ludo engine, 12 procedural heroes, 6 board themes, 2D SVG fallback (`AC-01`, `AC-02`)
- [x] Isolated per-room Cloudflare Durable Objects (`?roomCode=`) + `room:leave` + `room:update_profile` (`AC-04`)
- [x] Online rival UI distinction (`ONLINE RIVAL` vs `BOT`) + Multiplayer Commander Setup bar (`AC-04`)
- [x] Self-hosted ALTCHA SHA-256 PoW anti-spam + edge/WS rate limiting + security headers (`AC-06`)
- [x] Legal pages (`/terms`, `/privacy`, `/cookies`, `/fair-play`) + global Footer (`AC-07`)
- [x] DiceBear Avatar Studio + AES-256-GCM local encryption + `v1 -> v2` data migrations (`AC-03`, `AC-05`)
- [x] Replace all raw UI emojis with Lucide SVG icons and streamline first-load HomeHub
- [x] Complete ATLAS documentation, continuity files, and `.env.example` updates

## In Progress
- [ ] Live verification of Google OAuth once owner configures Client ID/Secret in Supabase Dashboard

## Pending / Proposed
- [ ] Configure `ALTCHA_HMAC_KEY` secret in Cloudflare Worker Dashboard (`docs/CLOUDFLARE_ENV_GUIDE.md`)
- [ ] Optional: Bundle code-splitting (`manualChunks` for `three`) to bring main JS chunk under 500 kB
- [ ] Legal counsel review of `PRIVACY_POLICY.md`, `TERMS.md`, `COOKIE_POLICY.md` before public commercial launch

## Blocked
- None in codebase; Google OAuth requires owner credentials in Supabase Dashboard.
