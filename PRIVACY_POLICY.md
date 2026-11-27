<!-- DRAFT — requires legal review -->
# Privacy Policy — KingdomLudo

**Effective Date:** November 27, 2026

## 1. Local & Guest Play

By default, KingdomLudo runs in **Guest Mode** without requiring an account. Player display names, match history, equipped characters, and preferences are stored locally on your device using IndexedDB (or SQLite on native builds).

## 2. Optional Google Sign-In & Cloud Sync

If you choose to sign in with Google via Firebase Authentication:
- Your display name, chosen character/theme preferences, and win/match counters are stored in Firebase Firestore under your user ID.
- Your email address is stored solely in your owner-isolated private profile document (`/users/{uid}/private/account`) and is never readable by other players.
- You may sign out at any time or permanently delete your Firebase account from the **Profile** screen.

## 3. Online Multiplayer

When playing online private rooms or public matchmaking, your chosen display name and character selection are broadcast to players in the same match room. Room state is held ephemerally in server memory and completed match summaries may be recorded to the configured database provider.

## 4. Permissions

The Android build requests only network connectivity (`INTERNET`, `ACCESS_NETWORK_STATE`), haptic vibration (`VIBRATE`), and optional notifications (`POST_NOTIFICATIONS`). It never accesses camera, microphone, contacts, or precise location.
