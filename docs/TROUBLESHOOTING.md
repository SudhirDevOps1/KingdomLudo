# Troubleshooting Guide

- **Blank or Slow 3D Board on Low-End Device**: Open **Settings → 3D Graphics** and choose `low`, or enable **Prefer 2D Board Fallback Mode** in **Settings → General**.
- **WebGL Context Lost Error**: The viewport automatically switches to `Board2DFallback` when `webglcontextlost` fires so matches continue without losing progress.
- **Online Room Connection Fails on Static Host**: Ensure `VITE_WS_URL` points to your live Express/WebSocket server (`wss://.../ws`).
- **Node `node:sqlite` Warning / Error**: Ensure Node.js 22.13+ (`node -v`) is installed; older Node versions do not ship `node:sqlite`.
- **Android Build Cannot Find Keystore**: `android-release.yml` builds unsigned release artifacts if `ANDROID_KEYSTORE_BASE64` is unset; configure all 4 Android signing secrets for Play Store AAB signing.
