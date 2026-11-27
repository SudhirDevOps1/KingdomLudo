# HANDOFF.md — Latest Session State

- **Last Updated**: 2026-11-27
- **Branch**: `main`
- **Verified Passing**:
  - `pnpm test` → 10 test files, 33 tests passed
  - `pnpm run lint` → 0 errors
  - `pnpm run build` → built cleanly (`dist/` + PWA precache)
  - `pnpm exec wrangler deploy --dry-run` → 45.96 KiB Worker + 39 static assets
- **What Changed Recently**:
  - Added ALTCHA Proof-of-Work anti-spam, Worker security headers, and `/api/health` info minimization.
  - Added 30-day TTL persistence, AES-256-GCM local vault, and `v1 -> v2` data migrations.
  - Added DiceBear Avatar Studio (`ProfileView.tsx`, `TopNav.tsx`) and Resend Confirmation Email button.
  - Replaced all raw UI emojis with `lucide-react` icons and removed the blocking splash/onboarding wall.
  - Added Ephemeral Room Chat, P2P WebRTC Voice Chat, Custom Room Name, DO auto-cleanup (`deleteAll()`), and Logged-In Global Leaderboard.
  - Added `version:verify` to `.github/workflows/ci.yml`, `.release-please-manifest.json` sync, and `clearAuthError` UX fix in `ProfileView`.
- **Next Actions for Owner**:
  1. In **Supabase Dashboard → Authentication → Providers → Email**, either keep email confirmation ON (users click link / Resend button) or toggle it OFF for instant email login.
  2. In **Supabase Dashboard → Authentication → Providers → Google**, add Google OAuth Client ID & Secret to enable Single-Click Google OAuth.
  3. In **Cloudflare Worker → Variables and Secrets**, set `ALTCHA_HMAC_KEY` (32+ random chars), `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
