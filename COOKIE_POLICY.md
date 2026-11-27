<!-- DRAFT — requires legal review -->
# Cookie & Local Storage Policy — KingdomLudo

Effective Date: November 27, 2026

KingdomLudo does **not** use third-party advertising or cross-site tracking cookies. We use strictly necessary local browser storage for gameplay:

| Storage Mechanism | Purpose | Retention |
|---|---|---|
| `IndexedDB` / `localStorage` (`ck_profile`, `ck_settings`, `ck_history`, `ck_active_match`) | Encrypted (`AES-256-GCM`) guest profile, preferences, saved match, and 30-day match history | 30 days (match history/guest session) or until reset |
| `sessionStorage` (`ck_client_id`) | Temporary multiplayer seat reconnection ID | Browser tab session |
| Service Worker Cache (`workbox`) | Offline PWA assets | Until updated |
| Supabase Auth Tokens | Session persistence only if you explicitly sign in | Until sign-out |

You can erase all local storage at any time via **Settings → Privacy & Data → Reset Local Saves & Preferences**.
