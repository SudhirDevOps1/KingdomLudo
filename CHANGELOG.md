# Changelog

All notable changes to **KingdomLudo** will be documented in this file.
Versioning follows Semantic Versioning and is configured for automated prerelease/release workflows via Release Please.

## [0.1.0-alpha.1](https://github.com/SudhirDevOps1/KingdomLudo/compare/kingdomludo-v0.1.0-alpha.0...kingdomludo-v0.1.0-alpha.1) (2026-11-27)


### Features

* add Playwright E2E suite, Husky pre-commit hooks, Open Graph tags, robots, sitemap, llms.txt, and visual secrets wireframe ([4dc8117](https://github.com/SudhirDevOps1/KingdomLudo/commit/4dc8117088c8da0f3e8fafcb8cfe235ef386b51d))
* **android:** harden release signing, ephemeral CI keystore, and disaster recovery protocol ([cbe7e8d](https://github.com/SudhirDevOps1/KingdomLudo/commit/cbe7e8d005e94880977f1a5f1ca965fd5047a0d1))
* **avatar,crypto,ux:** add DiceBear v9 avatars, AES-GCM vault, data migrations, resend email, and icon polish ([0e51c80](https://github.com/SudhirDevOps1/KingdomLudo/commit/0e51c807051f5aab5ee675739eb6d2e177376f49))
* delete aistudio directory and implement unified SSOT versioning system ([64514a8](https://github.com/SudhirDevOps1/KingdomLudo/commit/64514a82f6c0fe8a17ac07854b7c4975db7a70c0))
* **hud:** add labeled Chat with unread badge, 1-tap Voice button, and floating message preview in ActiveGameView ([652cf0f](https://github.com/SudhirDevOps1/KingdomLudo/commit/652cf0fcadec2705e846e49d030b496032c31d13))
* KingdomLudo AAA 3D fantasy island, Supabase Auth & Cloudflare multiplayer ([a9739aa](https://github.com/SudhirDevOps1/KingdomLudo/commit/a9739aa2e3c527bad4e8bd880cc18673501938ac))
* **legal:** add Terms of Service, Privacy Policy, Cookies, Fair Play pages and global Footer ([75cffdc](https://github.com/SudhirDevOps1/KingdomLudo/commit/75cffdca12052cd570900cffc8f9e7e838f984f9))
* **security,ux:** add ALTCHA PoW anti-spam, security headers, 30d TTL persistence, and clean animated HomeHub ([8d8060b](https://github.com/SudhirDevOps1/KingdomLudo/commit/8d8060b4003a64635d82ecee2e12fb5f74ccd912))
* **social,db:** add ephemeral room chat, P2P WebRTC voice, custom room names, DO auto-cleanup, and logged-in leaderboard ([399982c](https://github.com/SudhirDevOps1/KingdomLudo/commit/399982cc7b74d4eb19a509ff828784ac8b9e9eee))


### Bug Fixes

* **android:** add @capacitor/android, sync android assets, and fix vitest config ([3ae8c04](https://github.com/SudhirDevOps1/KingdomLudo/commit/3ae8c0455e31356bb07eb32edd4cda0921cbd788))
* **android:** upgrade java to 21 in android workflows and app build.gradle ([7746f22](https://github.com/SudhirDevOps1/KingdomLudo/commit/7746f22440320b3255d43221e33cf6927aa57d4c))
* **ci:** migrate workflows to pnpm, fix actions syntax and update eslint config ([9d9cd72](https://github.com/SudhirDevOps1/KingdomLudo/commit/9d9cd72aacde55c38f13bd2d55ddf1caabb455de))
* **ci:** remove legacy bun.lock so cloudflare uses pnpm-lock.yaml ([85e4274](https://github.com/SudhirDevOps1/KingdomLudo/commit/85e42747bd2de57cbe7604eec1491b5b387b8e5c))
* **ci:** set node environment for sqlite test, bump agp to 8.9.1 and compileSdk to 36 ([4dc7e0d](https://github.com/SudhirDevOps1/KingdomLudo/commit/4dc7e0d809633647c57c2b4f7bbeb827f6c31df6))
* **multiplayer:** distinguish online rivals from AI bots and add commander setup bar ([dc21221](https://github.com/SudhirDevOps1/KingdomLudo/commit/dc212213ec5d8cc481f3a4d85de582a986092579))
* **multiplayer:** isolate rooms per roomCode, fix deep-links, eliminate idle WS traffic, and add edge/auth rate limiting ([8109f02](https://github.com/SudhirDevOps1/KingdomLudo/commit/8109f029bb74eeb9e8374794fe135a3c06ac257b))
* **release:** sync src/config/version.ts in release-please PRs ([843bf59](https://github.com/SudhirDevOps1/KingdomLudo/commit/843bf59a4a234d0bc252048089984a79322563af))
* **security:** remove compiled android assets from git + add CF build config ([4f6e1bc](https://github.com/SudhirDevOps1/KingdomLudo/commit/4f6e1bc72f09864669ff5405dcf9add555943f21))
* **security:** resolve CodeQL alerts for missing rate limiting and cleartext localStorage storage ([57706bd](https://github.com/SudhirDevOps1/KingdomLudo/commit/57706bdc7136bd266e2ca1db45dda780dfe672d4))
* **security:** validate voice:signal clientId from session + add CSP header ([4d95487](https://github.com/SudhirDevOps1/KingdomLudo/commit/4d95487521885bb78a04adef0f2ca342678090bc))
* unignore src/data and commit game characters, themes, and i18n ([3dc4369](https://github.com/SudhirDevOps1/KingdomLudo/commit/3dc4369ecfbdcbcc63a5a1862b05805ac206f3f2))
* **workflows:** rely on hosted android sdk, isolate node tests in vitest, relax roll moveSeq check ([461b2bd](https://github.com/SudhirDevOps1/KingdomLudo/commit/461b2bdca28cd1679ec8620005f4ec98fe180646))
* **wrangler:** correct assets schema to use not_found_handling for SPA ([df2f426](https://github.com/SudhirDevOps1/KingdomLudo/commit/df2f4264de7f4a041cfa9b981b309a7a29e4f4f2))

## [0.1.0-alpha.0] - 2026-11-22

### Added & Changed
- **Official Rebrand to KingdomLudo**: Unified branding across web shell, PWA manifest, splash/onboarding, navigation, About & Help, server startup banner, Capacitor (`com.kingdomludo.app`), Android resources, and documentation.
- **Original App Icon & Favicon Pipeline**: Added 3D Royal Crown & Ludo Dice emblem, vector `icon.svg`, multi-resolution `favicon.ico`, PWA `192x192` / `512x512` / maskable PNGs, `apple-touch-icon.png`, and Android `mipmap-*` + adaptive icon resources.
- **Living 3D Fantasy Island & Articulated Heroes**: Animated ocean shader, waterfalls, mist, distant kingdoms, swaying trees, 12 grounded multi-part 3D creatures with 14-state animation controller, 4-channel Web Audio soundscape, and Zen full-viewport gameplay mode.
- **Core Game & Platform**: Deterministic 15×15 Ludo rules, 3-tier AI, 2D SVG fallback, IndexedDB offline save/resume, Firebase Auth & Firestore sync, authoritative Express + WebSocket multiplayer (`/ws`), 5 database adapters, and GitHub Actions CI/CD workflows.

### Alpha Stability & Known Boundaries
- Channel: **Alpha** (`0.1.0-alpha.0`) — active early development.
- Native Android APK/AAB binaries require Android SDK/JDK via GitHub Actions CI or a local Android workstation; they are not compiled inside the web build container.
