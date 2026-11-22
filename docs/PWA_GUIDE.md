# Progressive Web App (PWA) Guide

- **Manifest & Workbox**: Configured via `VitePWA` in `vite.config.ts` with `registerType: 'autoUpdate'`, `display: 'standalone'`, `theme_color: '#E6A93C'`, and `background_color: '#10141E'`.
- **Icons**: `public/icon.svg`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`, and `public/apple-touch-icon.png` generated cleanly by `scripts/generate-pwa-icons.mjs`.
- **Install Flow**: `usePWAInstall` listens for `beforeinstallprompt` on Chromium/Android and exposes `PWAInstallButton`, plus Safari Share -> Add to Home Screen instructions on iOS.
- **Verification**: Run `npm run build` and verify `dist/manifest.webmanifest` and `dist/sw.js` are emitted cleanly.
