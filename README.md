# 👑 KingdomLudo 3D

[![CI](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/ci.yml/badge.svg)](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/ci.yml)
[![CodeQL Security Analysis](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/codeql.yml/badge.svg)](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/codeql.yml)
[![Android Debug APK](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/android-debug.yml/badge.svg)](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/android-debug.yml)
[![Deploy Web & PWA](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/web-deploy.yml/badge.svg)](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/web-deploy.yml)
[![Release Please](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/release-please.yml/badge.svg)](https://github.com/SudhirDevOps1/KingdomLudo/actions/workflows/release-please.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Security: 0 Open Alerts](https://img.shields.io/badge/CodeQL-0%20Alerts%20Fixed-brightgreen)](https://github.com/SudhirDevOps1/KingdomLudo/security/code-scanning)

> **KingdomLudo** is an AAA-styled, full-fidelity 3D tabletop fantasy island Ludo experience built with **React 19**, **Three.js**, **TypeScript**, **Supabase**, **Cloudflare Pages/Workers**, **Node.js/Express WebSockets**, and **Capacitor 8 Android Native**.

---

## 🌟 Highlights & Key Features

### 🏰 1. Living 3D Fantasy Island Tabletop
- **Exact 15×15 Ludo Topology**: 52-cell main perimeter, 8 star safe zones, 4 colored home columns, and the central Royal Crown Sanctuary.
- **Dynamic PBR Island**: Animated ocean shaders, cascading cliffside waterfalls, atmospheric mist, fluttering kingdom banners, dynamic day/sunset lighting, and floating particles.
- **6 Royal Environments**: Selectable themes including *Enchanted Royal Courtyard*, *Obsidian Caldera*, *Astral Void*, *Sunken Atlantis*, *Glacial Citadel*, and *Neon Cyber-Kingdom*.

### ⚔️ 2. 12 Articulated 3D Heroes & Animation Studio
- **4 Distinct Kingdoms**:
  - 🔴 **Crimson Spire**: Lord Ignis, Lady Ember, General Ash
  - 🔵 **Cobalt Bastion**: Prince Tide, Sentinel Wave, Admiral Marina
  - 🟢 **Emerald Grove**: Warden Grove, Huntress Thorn, Sage Leaf
  - 🟡 **Sovereign Sun**: King Aurelius, Knight Dawn, High Cleric Sol
- **14 Procedural & Skeletal Animation States**: Natural breathing idle, walking cycle with foot contact, energetic running, jump & anticipation, impact landing compression, royal celebration, token capture slam, and crown victory fanfare.
- **Customization Studio**: 3 interchangeable armor sets, royal colorways, accessories, dynamic camera orbit controls, and external `.glb` model support.

### 🎲 3. Authoritative Multiplayer & Smart AI
- **Guest-First Architecture**: Instant play with cryptographic guest sessions (`gst_...`) — zero sign-up friction.
- **Supabase Cloud Sync**: Optional registered account authentication (Email/Password, Magic Link, OAuth) with cross-device statistics, achievements, and unlocked outfits.
- **Anti-Cheat Authoritative Engine**: Server-enforced turn timing, CSPRNG cryptographically secure dice rolls (`crypto.randomInt`), private 6-character room codes (`?room=CODE`), and automatic reconnect match state recovery.
- **Adaptive Bot AI**: Three distinct AI personas:
  - 🟢 **Easy (Casual)**: Random valid moves, light defense.
  - 🟡 **Medium (Tactical)**: Balanced safe-zone prioritization, captures opportunities when available.
  - 🔴 **Hard (Grandmaster)**: Strategic risk analysis, min-max capture aggression, defensive stacking, and endgame efficiency.

### 📱 4. Cross-Platform: Web, PWA & Native Android
- **Progressive Web App (PWA)**: Offline-first asset caching with Workbox and custom Service Worker.
- **Capacitor 8 Native Android**: Full Android 15/16 and Java 21 compatibility (`com.kingdomludo.app`) with custom adaptive icons, splash screens, immersive status bars, and hardware haptics.
- **2D Lightweight Fallback**: Automatic detection of low-power or non-WebGL devices, live 2D SVG board toggle, and Zen full-viewport play mode.

---

## 🛠️ Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        KingdomLudo Client (PWA)                        │
│   React 19  •  Three.js (WebGL)  •  Tailwind CSS  •  Lucide  •  idb     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
 ┌─────────────────────────────┐         ┌─────────────────────────────┐
 │    Local Offline Engine     │         │   Online Multiplayer Mode   │
 │ • Procedural AI Bots        │         │ • WSS / Realtime WebSockets │
 │ • IndexedDB Match Storage   │         │ • Authoritative Matchmaker  │
 │ • Encrypted Safe Storage    │         │ • Server-Side Validation    │
 └─────────────────────────────┘         └──────────────┬──────────────┘
                                                        │
        ┌───────────────────────────────────────────────┴─────────────────┐
        ▼                                                                 ▼
 ┌───────────────────────────────┐               ┌──────────────────────────────┐
 │    Express + WS Game Server   │   - or -      │  Cloudflare Workers / DO     │
 │ • Rate-Limited API & Static   │               │ • Durable Objects State      │
 │ • CSPRNG Dice Generation      │               │ • Edge Latency Optimization  │
 └──────────────┬────────────────┘               └──────────────┬───────────────┘
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │   Supabase Cloud Platform   │
                         │ • Supabase Auth (JWT/OAuth) │
                         │ • PostgreSQL (RLS Secured)  │
                         └─────────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 5.8, Vite 8, React Router 7 |
| **3D Rendering & Animation** | Three.js (r187), WebGL, PBR Shaders, Canvas Keyframing |
| **Styling & Motion** | Tailwind CSS v4, Motion (Framer Motion) |
| **State & Local Storage** | Custom Reactive Store, IndexedDB (`idb`), Encrypted `localStorage` |
| **Multiplayer Server** | Node.js 22, Express 4, `ws` (WebSockets), `express-rate-limit` |
| **Cloud & Serverless** | Cloudflare Pages, Cloudflare Workers, Cloudflare Durable Objects |
| **Authentication & Database**| Supabase Auth, Supabase PostgreSQL, SQLite (`node:sqlite`), Turso |
| **Mobile & Native** | Capacitor 8 (`@capacitor/android`), Java 21, Android Gradle Plugin 8.9.1 |
| **Security & Quality** | GitHub CodeQL (0 alerts), ESLint, Vitest, TypeScript Strict Mode |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v10.x` (recommended) or `npm` / `bun`

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/SudhirDevOps1/KingdomLudo.git
cd KingdomLudo

# Install dependencies
pnpm install
```

### 2. Configure Environment (Optional)
```bash
# Copy example environment configuration
cp .env.example .env
```
*(By default, KingdomLudo runs locally out-of-the-box with embedded zero-config SQLite — no external database setup is required for local play!)*

### 3. Run Development Server
```bash
pnpm dev
```
Open your browser at **`http://localhost:3000`**.

---

## 🧪 Testing & Verification

KingdomLudo has a comprehensive automated test suite covering game engine logic, bot AI, persistence, Supabase authentication, rate limiting, and 3D adapters:

```bash
# Run strict TypeScript check and ESLint
pnpm run lint

# Run Vitest test suite (8 test suites, 26 unit & integration tests)
pnpm test

# Build production client bundle with PWA Service Worker
pnpm run build

# Start production Node.js + WebSocket game server
pnpm start
```

---

## 🔐 GitHub Secrets & Environment Variables

When deploying through GitHub Actions or hosting on Cloudflare Pages and Supabase, configure your repository secrets and variables in:
👉 **`GitHub Repo → Settings → Secrets and variables → Actions`**

### 🔑 Repository Secrets (Encrypted)
| Secret Name | Required For | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` | Web & PWA Deployment | Cloudflare API Token with `Cloudflare Pages: Edit` permissions |
| `VITE_SUPABASE_URL` | Cloud Accounts (Optional) | Your Supabase project URL (`https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Cloud Accounts (Optional) | Your Supabase anonymous public API key |
| `ANDROID_KEYSTORE_BASE64` | Signed Android Release APK | Base64-encoded release `.jks` keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Signed Android Release APK | Password for the release keystore |
| `ANDROID_KEY_ALIAS` | Signed Android Release APK | Key alias name inside the keystore |
| `ANDROID_KEY_PASSWORD` | Signed Android Release APK | Password for the signing key alias |

### 🌐 Repository Variables (Plaintext)
| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `CLOUDFLARE_ACCOUNT_ID` | *(Your Account ID)* | 32-character Cloudflare Account ID |
| `CLOUDFLARE_PAGES_PROJECT` | `kingdomludo` | Target project name on Cloudflare Pages |
| `VITE_WS_URL` | *(empty = same host)* | Remote WebSocket server URL (e.g. `wss://game.yourdomain.com/ws`) |
| `VITE_APP_NAME` | `KingdomLudo` | Custom display application title |

📖 **For full, step-by-step setup instructions with screenshots and command-line generators, read [`docs/GITHUB_SECRETS.md`](./docs/GITHUB_SECRETS.md).**

---

## 📁 Repository Directory Structure

```text
KingdomLudo/
├── .github/
│   └── workflows/                # Automated CI/CD Pipelines
│       ├── ci.yml                # Lint, TypeScript, Vitest, Production Build
│       ├── codeql.yml            # CodeQL Security Scanning (0 open alerts)
│       ├── web-deploy.yml        # Cloudflare Pages Auto-Deploy
│       ├── android-debug.yml     # Nightly Android Debug APK Compilation
│       ├── android-release.yml   # Signed Production APK & AAB Generator
│       └── release-please.yml    # Semantic Versioning & Release Automation
├── android/                      # Native Capacitor Android 15/16 Project (Java 21)
├── docs/                         # In-Depth Architectural & Technical Guides
│   ├── ARCHITECTURE.md           # Full System Architecture & Data Flow
│   ├── AUTHENTICATION.md         # Supabase Auth & Guest-First Spec
│   ├── DATABASE_CONFIGURATION.md # Supabase PostgreSQL & SQLite Guide
│   ├── GITHUB_SECRETS.md         # Step-by-Step GitHub Env & Secrets Tutorial
│   └── ...                       # 35+ Comprehensive Project Docs
├── server/                       # Authoritative Backend Game Server
│   ├── backend/                  # Interchangeable Database Adapters (SQLite, PG, D1)
│   ├── gameServer.ts             # Authoritative Room & Match Coordination
│   └── rateLimiting.ts           # WebSocket & HTTP Rate Limiting Rules
├── src/                          # React 19 Frontend Application
│   ├── components/               # UI Modals, Audio, HUD, Fallback 2D Board
│   ├── engine/                   # Ludo Core Rules, CSPRNG Dice, Bot AI Logic
│   ├── persistence/              # Local IDB & Encrypted Storage Handlers
│   ├── services/                 # Supabase Auth, Sound FX & Multiplayer Sync
│   └── three/                    # 3D Board, Heroes, Ocean Shaders, Materials
├── capacitor.config.ts           # Capacitor Native Mobile Configuration
├── package.json                  # Scripts & Dependency Manifest
├── server.ts                     # Standalone Express + WS Production Server
├── vite.config.ts                # Vite 8 + PWA + Workbox Configuration
└── wrangler.jsonc                # Cloudflare Pages & Workers Config
```

---

## 🛡️ Security & Reliability

- **0 CodeQL Alerts**: Cleaned and hardened against CWE-770 (rate limiting) and CWE-312 (cleartext sensitive storage).
- **Express Rate Limiting**: Global DoS throttling (`1000 req / 15m`) and API protections (`120 req / 1m`) active on all endpoints.
- **Client Sanitization**: Personal Identifiable Information (PII) like emails are stripped before local fallback persistence, with XOR Base64 storage encryption.
- **Authoritative Validation**: Dice rolls, token movements, and win conditions are calculated on the authoritative server or local engine, preventing client-side packet tampering.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<p align="center">
  Built with 👑 by <a href="https://github.com/SudhirDevOps1">SudhirDevOps1</a> and the KingdomLudo Team.
</p>
