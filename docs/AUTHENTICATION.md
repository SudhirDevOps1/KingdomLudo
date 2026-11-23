# 🛡️ Authentication Architecture & Guest-First System

KingdomLudo implements a **zero-friction, guest-first authentication model** designed for instant gameplay, coupled with **Supabase Auth** for persistent cloud accounts across devices.

Implementation: [`src/services/auth/authService.ts`](../src/services/auth/authService.ts)

---

## ⚡ 1. Zero-Friction Guest Mode (Default)

### Overview
Players launch directly into the game without being blocked by registration modals, phone verifications, or passwords.
- Every player receives a cryptographic guest identity:
  ```typescript
  export interface GuestSession {
    guestId: string;     // e.g. "gst_a8f9c10b2d3e"
    guestToken: string;  // 24-char cryptographic token
    displayName: string; // e.g. "Royal Knight #402"
    createdAt: number;   // Timestamp
  }
  ```
- **Local Persistence**: Guest profiles and stats are persisted in IndexedDB (`idb`) with an encrypted fallback in `localStorage`.
- **Offline Capabilities**: Full access to Offline Pass & Play, AI Skirmishes, 3D Animation Studio, custom outfits, and local match history without internet connectivity.

---

## ☁️ 2. Supabase Auth (Optional Registered Accounts)

### Why Register?
Registering an account is completely optional and offers:
- Multi-device progress synchronization (mobile, tablet, desktop).
- Cloud match history and global leaderboard rankings.
- Unlocked outfit and hero preservation across browser resets.

### Supported Authentication Methods
1. **Email & Password**: Verified authentication via Supabase GoTrue.
2. **Magic Link / OTP**: Passwordless sign-in directly to the user's email.
3. **OAuth Providers** *(configurable)*: Google, GitHub, Apple, Discord via Supabase Dashboard.

### Monotonic Profile Syncing
When a guest signs in or creates an account:
1. Local offline stats (wins, captures, sixes rolled) merge **monotonically** (`Math.max(local, cloud)`) with the Supabase PostgreSQL profile table (`profiles`).
2. Local unlocked cosmetics and achievements are unioned with cloud state.
3. The player never loses offline progress when transitioning to a registered cloud account.

---

## 🔒 3. Privacy, Security & Data Sanitization

- **No Cleartext Credentials**: User emails and account UUIDs are excluded from insecure client storage (`localStorage` fallback) to prevent PII leakage (verified clean by GitHub CodeQL).
- **Row-Level Security (RLS)**: Supabase PostgreSQL tables are locked with strict RLS policies (`auth.uid() = user_id`) so that players can only read and update their own profiles.
- **Account Deletion**: Players can permanently delete their cloud profile and erase all match telemetry directly from the in-game Settings/Profile menu.
