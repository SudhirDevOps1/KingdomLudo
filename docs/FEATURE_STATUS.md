# KingdomLudo `0.1.0-alpha.0` — Honest Feature & Release Status

This document records the verified engineering status of every subsystem in **KingdomLudo** (`v0.1.0-alpha.0`, Channel: **Alpha**, Stability: **Early development**).

| Area | Status | Notes & Verification |
| :--- | :--- | :--- |
| Core 15×15 Ludo Engine & Rules | **TESTED** | Verified via Vitest (`tests/engine.test.ts`). |
| 3-Tier AI Opponents (Easy / Medium / Hard) | **TESTED** | Verified via Vitest (`tests/ai.test.ts`). |
| Living 3D Fantasy Island & 6 Board Themes | **IMPLEMENTED** | Ocean shader, waterfalls, mist, distant castles, clouds, birds, 6 themes (`src/three/islandWorld.ts`, `boardScene.ts`). |
| 12 Articulated Non-Pawn 3D Heroes & 14-State Animator | **IMPLEMENTED** | Grounded feet/wings, outfits, colorways, optional `.glb` loader (`src/three/characterBuilder.ts`, `characterAnimController.ts`). |
| 2D SVG Fallback & Zen Full-Viewport Play | **TESTED** | Interactive SVG board tested via Vitest (`tests/ui.test.tsx`); Zen mode & zoom controls in `ActiveGameView.tsx`. |
| 4-Channel Web Audio Soundscape | **TESTED** | Master, SFX, Music, and Island Ambience synthesis (`tests/animation_and_audio.test.ts`). |
| Offline IndexedDB Persistence & Auto-Save | **IMPLEMENTED** | Uses preserved `character_kingdom_ludo_db` for zero data-loss upgrades. |
| Firebase Auth & Firestore Cloud Sync | **IMPLEMENTED** | Optional Google sign-in + owner-scoped Firestore rules (`firestore.rules`). |
| Authoritative Express + WebSocket Multiplayer (`/ws`) | **TESTED** | Verified via Vitest (`tests/server.test.ts`) and live `/ws` handshake check. |
| 5-Provider Database Adapter Layer | **TESTED** | SQLite verified live; PostgreSQL/Turso/D1/Firestore adapters configured via `DATABASE_PROVIDER`. |
| KingdomLudo Icon & Favicon Suite | **IMPLEMENTED** | Original 3D emblem rasterized to `favicon.ico`, `icon.svg`, PWA `192/512/maskable`, `apple-touch-icon.png`, and Android `mipmap-*` + adaptive XMLs. |
| Local Git Repository & `v0.1.0-alpha.0` Tag | **IMPLEMENTED** | Local `.git` initialized, clean commit tagged `v0.1.0-alpha.0`, and pre-rebrand `.tar.gz` backup saved. |
| Android APK / AAB Native Compilation | **BLOCKED** | Android SDK / JDK not installed in this Linux Node container; `.github/workflows/android-*.yml` builds on GitHub Runners. |
| Remote GitHub Tag Deletion / GitHub Release Publish | **BLOCKED** | No `gh` CLI, credentials, or GitHub remote configured in this sandbox; ready for `git push -u origin main --follow-tags`. |
