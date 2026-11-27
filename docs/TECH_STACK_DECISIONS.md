# Technical Stack Decisions & Trade-offs
> Checked: 2026-11-27

| Area | Selected | Alternatives Rejected | Why | Cost / Free-Tier Limits |
|---|---|---|---|---|
| **3D Engine** | `three` (0.187.0, MIT) | React Three Fiber, Babylon.js | Zero React reconciler overhead in 60fps loop; explicit disposal | Free OSS (MIT) |
| **UI & Motion** | React 19 + Tailwind CSS v4 + Zustand 5 + `motion` | Redux Toolkit, CSS-only | Clean selectors, minimal bundle, GPU-composited motion | Free OSS (MIT) |
| **Edge & Multiplayer** | Cloudflare Workers + Durable Objects | Render Node container, Photon, Colyseus | Zero cold-start WebSockets, per-room DO isolation, turn alarms | Free tier: 100k Worker req/day (https://developers.cloudflare.com/workers/platform/pricing/) |
| **Auth & Cloud Sync** | Supabase Auth & Postgres | Firebase Auth/Firestore, custom JWT server | Built-in Email + Google OAuth, RLS, Postgres portability | Free tier: 500 MB DB, 50k MAU (https://supabase.com/pricing) |
| **Avatars** | `@dicebear/core` 9.4.3 + `@dicebear/collection` 9.4.2 | Gravatar, external image CDNs | 100% offline SVG data URIs; zero user PII sent externally | Free OSS (MIT core; per-style CC0/CC-BY; https://www.dicebear.com/styles/) |
| **Bot Protection** | Self-hosted ALTCHA SHA-256 PoW (Web Crypto) | Google reCAPTCHA, hCaptcha | Zero third-party tracking cookies, zero CAPTCHA friction | Free (runs on Worker Web Crypto) |
| **Local Persistence** | IndexedDB (`idb`) + Web Crypto AES-256-GCM + Capacitor SQLite | Plain `localStorage`, unencrypted JSON | Works offline, encrypts PII/profile at rest, 30-day TTL pruning | Local device storage |
| **Mobile Wrapper** | Capacitor 8 | React Native, Flutter | Single TypeScript/Vite codebase for Web, PWA, and Android APK | Free OSS (MIT) |

## Why This Stack for KingdomLudo
KingdomLudo is an offline-first 3D tabletop game with optional online multiplayer. Running Web + WebSocket Durable Objects on Cloudflare Workers eliminates Node cold starts and keeps hosting free-tier viable, while IndexedDB + AES-GCM + DiceBear local SVG generation ensures the entire game works with zero internet or account required.
