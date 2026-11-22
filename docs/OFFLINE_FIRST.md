# Offline-First Persistence (`src/persistence/localPersistence.ts`)

- **Browser & PWA Storage**: Uses IndexedDB (`idb` library) database `character_kingdom_ludo_db` (preserved across the KingdomLudo rebrand so existing offline saves and profiles never reset) with object store `kv` storing `profile`, `settings`, `activeMatch`, and `matchHistory`.
- **Auto-Save & Resume**: Every offline roll and piece move persists `activeMatch`. Leaving or backgrounding a match preserves state so the player sees a **Resume Saved Match** card on `HomeHub`.
- **Service Worker Caching**: `vite-plugin-pwa` caches static JS/CSS/HTML/SVG/JPG/PNG assets via Workbox `generateSW`, excluding `/api/` and `/ws` endpoints from offline HTML fallback (`navigateFallbackDenylist`).
- **Offline Banner**: `OfflineIndicator` informs the player when the browser reports `navigator.onLine === false` while offline modes continue working seamlessly.
