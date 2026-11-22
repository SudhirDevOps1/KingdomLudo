# Android Capacitor Setup & Local/CI Builds

## Configuration
- `capacitor.config.ts`: Package ID `com.kingdomludo.app`, App Name `KingdomLudo`, `webDir: 'dist'`, dark splash screen (`#10141E`), HTTPS Android scheme.
- Native Gradle skeleton resides in `android/` (`compileSdk 35`, `minSdk 24`, `targetSdk 35`, Java 17, `versionName "0.1.0-alpha.0"`, `versionCode 100`).
- Launcher & adaptive icon resources live in `android/app/src/main/res/mipmap-*/` and `mipmap-anydpi-v26/`.

## Honest Environment Note
This Node.js/Web build environment does **not** include the Android SDK or JDK. Consequently:
- Local APK/AAB binaries are **not** compiled inside this workspace (`BLOCKED` until run in CI or Android Studio).
- Complete GitHub Actions workflows (`.github/workflows/android-debug.yml` and `.github/workflows/android-release.yml`) automate `npm run build` -> `npx cap sync android` -> `./gradlew assembleDebug` / `bundleRelease` on Ubuntu runners with Java 17 and Android SDK installed.
