# GitHub Secrets & Repository Variables

Configure these in **GitHub Repository Settings → Secrets and variables → Actions** before enabling optional deployment steps:

## Secrets (Encrypted)
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded release `.jks` keystore for signing Release APK/AAB.
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password.
- `ANDROID_KEY_ALIAS`: Signing key alias.
- `ANDROID_KEY_PASSWORD`: Signing key password.
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Cloudflare Pages Edit permission.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`: Public client Firebase config (optional override of `firebase-applet-config.json`).

## Variables (Plaintext)
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account identifier.
- `CLOUDFLARE_PAGES_PROJECT`: Target Pages project name (defaults to `kingdomludo`).
- `VITE_WS_URL`: Remote WebSocket URL (e.g. `wss://api.yourdomain.com/ws`) when hosting static frontend separately from Node server.
- `VITE_APP_NAME`: Brand name override.
