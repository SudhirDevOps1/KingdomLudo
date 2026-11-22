# Changelog

All notable changes to **KingdomLudo** will be documented in this file.
Versioning follows Semantic Versioning and is configured for automated prerelease/release workflows via Release Please.

## [0.1.0-alpha.0] - 2026-11-22

### Added & Changed
- **Official Rebrand to KingdomLudo**: Unified branding across web shell, PWA manifest, splash/onboarding, navigation, About & Help, server startup banner, Capacitor (`com.kingdomludo.app`), Android resources, and documentation.
- **Original App Icon & Favicon Pipeline**: Added 3D Royal Crown & Ludo Dice emblem, vector `icon.svg`, multi-resolution `favicon.ico`, PWA `192x192` / `512x512` / maskable PNGs, `apple-touch-icon.png`, and Android `mipmap-*` + adaptive icon resources.
- **Living 3D Fantasy Island & Articulated Heroes**: Animated ocean shader, waterfalls, mist, distant kingdoms, swaying trees, 12 grounded multi-part 3D creatures with 14-state animation controller, 4-channel Web Audio soundscape, and Zen full-viewport gameplay mode.
- **Core Game & Platform**: Deterministic 15×15 Ludo rules, 3-tier AI, 2D SVG fallback, IndexedDB offline save/resume, Firebase Auth & Firestore sync, authoritative Express + WebSocket multiplayer (`/ws`), 5 database adapters, and GitHub Actions CI/CD workflows.

### Alpha Stability & Known Boundaries
- Channel: **Alpha** (`0.1.0-alpha.0`) — active early development.
- Native Android APK/AAB binaries require Android SDK/JDK via GitHub Actions CI or a local Android workstation; they are not compiled inside the web build container.
