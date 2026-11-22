# Product Requirements Document (PRD)

## Product Vision
**KingdomLudo** delivers a stylized 3D fantasy island tabletop Ludo game playable offline and online across Web, PWA, and Android.

## Target Personas
1. **Casual Tabletop Players**: Launch immediately in Guest Mode, play Pass & Play or Easy AI without registration.
2. **Competitive Tacticians**: Challenge Hard AI, unlock achievement skins, or join 2P/4P online matches with turn timers.
3. **Friends & Families**: Generate 6-character private invite links (`?room=CODE`) for cross-device sessions.

## Functional Requirements
- Support 2, 3, and 4 player seats with classic Ludo rules and configurable presets (`classic_kingdom` / `standard`).
- Provide 12 distinct original 3D kingdom heroes (3 per faction) with outfits, unlockable skins, and 360° preview.
- Provide 6 selectable 3D board themes defaulting to **Royal Enchanted Courtyard**.
- Persist offline matches, player profile, settings, and match history locally via IndexedDB.
- Sync authenticated profiles and match summaries optionally to Firebase Firestore.
- Guarantee server-authoritative dice rolls (`crypto.randomInt`) and turn verification in online matches.

## Non-Functional Requirements
- Responsive layout across 360px mobile portrait up to 1440px+ desktop displays.
- Accessible 2D SVG fallback board and full keyboard controls (`Space`, `1-4`, `C`, `H`, `Esc`).
- Zero API secrets shipped in client bundles or committed to version control.
