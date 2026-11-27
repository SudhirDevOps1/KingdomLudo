# Product Requirements Document (PRD) — KingdomLudo

## 1. Product Vision & Problem Statement
**KingdomLudo** delivers a stylized 3D fantasy island tabletop Ludo game playable offline-first and online across Web, PWA, and Android (Capacitor). It solves the lack of responsive, privacy-respecting, ad-free 3D Ludo experiences that work seamlessly both offline and in real-time multiplayer rooms.

## 2. Target Users
1. **Casual Tabletop Players**: Launch immediately in Guest Mode, play Pass & Play or Easy AI without registration.
2. **Competitive Tacticians**: Challenge Hard AI, unlock achievement skins, or join 2P/4P online matches with server-enforced turn timers.
3. **Friends & Families**: Generate 6-character private invite codes and `?room=CODE` links for cross-device sessions.

## 3. Goals & Non-Goals
- **Goals**: Instant offline playability; authoritative anti-cheat online rooms; AES-256-GCM encrypted local persistence with versioned migrations; custom DiceBear avatars; zero tracking cookies.
- **Non-Goals**: Real-money wagering/gambling; third-party ad networks; mandatory account creation for local play.

## 4. Functional Requirements (MoSCoW)
- **[FR-01 | Must → AC-01]** Support 2, 3, and 4 player seats with classic Ludo rules (`classic_kingdom` / `standard` presets).
- **[FR-02 | Must → AC-02]** Provide 12 distinct procedural 3D kingdom heroes (3 per faction) and 6 selectable 3D board themes.
- **[FR-03 | Must → AC-03]** Persist offline matches, profile, settings, and 30-day TTL match history locally in IndexedDB / AES-GCM encrypted storage with automatic schema migrations.
- **[FR-04 | Must → AC-04]** Guarantee server-authoritative dice rolls, move validation, and per-room isolated Durable Objects (`?roomCode=`) with turn timers in online matches.
- **[FR-05 | Must → AC-05]** Provide optional Supabase Email/Password and Google OAuth cloud sync, plus DiceBear v9 Avatar Studio (`adventurer`, `bottts`, `lorelei`, `avataaars`, `pixelArt`, `shapes`).
- **[FR-06 | Must → AC-06]** Protect auth and room/guest endpoints with self-hosted ALTCHA SHA-256 Proof-of-Work and per-IP/per-socket rate limiting.
- **[FR-07 | Should → AC-07]** Provide legal pages (`/terms`, `/privacy`, `/cookies`, `/fair-play`) and global footer navigation.

## 5. Non-Functional Requirements
- Responsive layout across 360px mobile portrait up to 1440px+ desktop displays (`>= 44px` touch targets).
- Accessible 2D SVG fallback board and full keyboard controls (`Space`, `1-4`, `C`, `H`, `Esc`), respecting `prefers-reduced-motion`.
- Zero API secrets shipped in client bundles or committed to version control.
