# Acceptance Criteria & Definition of Done (`ACCEPTANCE_CRITERIA.md`)

## Feature Acceptance Criteria (Mapped to PRD Musts)

- **AC-01 (Core Ludo Engine & Rules)**: 2–4 player seats, exact-roll crown entry, 3 consecutive 6s rule, star sanctuaries, and captures verified by `tests/engine.test.ts` and `tests/ai.test.ts`.
- **AC-02 (3D Heroes & 2D Fallback)**: 12 procedural 3D characters, 6 themes, and 2D SVG fallback verified by `tests/animation_and_audio.test.ts` and `tests/ui.test.tsx`.
- **AC-03 (AES-GCM Encryption, Migrations & 30-Day TTL)**: AES-256-GCM encryption roundtrip, legacy `enc:` -> `aes:` migration, and 30-day TTL retention verified by `tests/crypto_migration.test.ts` and `tests/adapters.test.ts`.
- **AC-04 (Isolated Authoritative Multiplayer)**: Per-room Durable Objects (`?roomCode=`), CSPRNG dice, turn validation, and `[ONLINE RIVAL]` UI distinction verified by `tests/server.test.ts` and `tests/ui.test.tsx`.
- **AC-05 (DiceBear Avatars & Auth UX)**: DiceBear v9 SVG generation (`data:image/svg+xml`) and Supabase auth helpers verified by `tests/crypto_migration.test.ts` and `tests/supabase_auth.test.ts`.
- **AC-06 (ALTCHA Anti-Spam & Edge Security)**: SHA-256 Proof-of-Work challenge/verification, tampered/expired token rejection, and security headers verified by `tests/altcha.test.ts`.
- **AC-07 (Legal & Compliance Pages)**: `/terms`, `/privacy`, `/cookies`, `/fair-play` routes and global Footer present in `src/App.tsx` and `src/components/layout/Footer.tsx`.

## Conditional Deliverables Status (ATLAS §1.3)
- `PRIVACY_POLICY.md`, `TERMS.md`, `COOKIE_POLICY.md`: Present as `<!-- DRAFT — requires legal review -->`.
- `PERMISSIONS.md`: Not applicable on Web (no camera/mic/location requested); Android permissions documented in `docs/ANDROID_PERMISSIONS.md`.
- `PAYMENT`: Not applicable — zero payment processing or real-money transactions.

## Definition of Done & Evidence Format
Every release requires:
```
pnpm test                      # Vitest unit/integration suites (0 failed)
pnpm run lint                  # tsc --noEmit && eslint . (0 errors)
pnpm run build                 # version:sync + vite build
pnpm exec wrangler deploy --dry-run
```
