# Release Automation & Single Source of Truth (SSOT) Versioning

KingdomLudo uses a unified **Single Source of Truth (SSOT)** versioning architecture. Changing or bumping the version in one place updates all application layers, documentation, Android Gradle configurations, and web release manifests automatically.

---

## 1. Unified Version Management Commands

Manage project versioning across the entire repository using these simple commands:

```bash
# 1. Synchronize all project files with current package.json version
pnpm run version:sync

# 2. Bump version automatically (patch, minor, major, alpha, beta, rc)
pnpm run version:bump patch    # e.g., 0.1.0-alpha.0 -> 0.1.0-alpha.1 (or 0.1.1)
pnpm run version:bump minor    # e.g., 0.1.0 -> 0.2.0
pnpm run version:bump major    # e.g., 0.1.0 -> 1.0.0
pnpm run version:bump beta     # e.g., switches to beta channel

# 3. Set an explicit custom version across all files
pnpm run version:set 0.2.0-beta.0
```

---

## 2. What Gets Synchronized Automatically?

When `version:sync`, `version:bump`, or `version:set` runs (or during `pnpm run build`), the following targets are kept in 100% lockstep:

1. **`package.json`**: Root semantic version (`version`).
2. **`src/config/version.ts`**: Auto-generated typed configuration exporting:
   - `APP_VERSION`: Current semver string (e.g. `0.1.0-alpha.0`)
   - `APP_RELEASE_CHANNEL`: Detected channel (`Alpha`, `Beta`, `Release Candidate`, `Production`)
   - `APP_RELEASE_TAG`: Git tag format (e.g. `v0.1.0-alpha.0`)
   - `ANDROID_VERSION_CODE`: Computed integer code `(major * 10000) + (minor * 100) + patch`
   - `BUILD_TIMESTAMP`: ISO 8601 build timestamp
3. **Web & Runtime Code**:
   - `src/config/appConfig.ts`: Consumes `src/config/version.ts` directly.
   - `src/components/common/ErrorBoundary.tsx`: Displays live release tag & channel.
   - `src/persistence/localPersistence.ts`: Backups tagged with dynamic `APP_CONFIG.version`.
   - `server.ts`: Server startup banner dynamically logs `v${APP_VERSION}`.
4. **Android Native Project (`android/app/build.gradle`)**:
   - `versionName`: Evaluates `package.json` dynamically via Groovy `JsonSlurper`.
   - `versionCode`: Computed automatically from semver numbers `(major * 10000) + (minor * 100) + patch` (or overridden by CI `ANDROID_VERSION_CODE`).
5. **Metadata & Manifests**:
   - `metadata.json`: Description version updated.
   - `.release-please-manifest.json`: Target release manifest synchronized.
6. **Documentation & Changelogs**:
   - `README.md`: Version tags and release references synchronized.
   - `CHANGELOG.md`: Latest release header created/updated.
   - All markdown guides in `docs/*.md`: Version references updated in one shot.

---

## 3. GitHub Actions CI/CD Release Flow

1. Commit changes following Conventional Commits (`feat:`, `fix:`, `perf:`).
2. Push a git tag (e.g. `git tag v0.1.0 && git push origin v0.1.0`) or create a GitHub Release.
3. `.github/workflows/android-release.yml` triggers automatically:
   - Sets up Node 22, Java 21, and Gradle.
   - Materializes the release keystore ephemerally.
   - Builds signed APK (`app-release.apk`) and AAB (`app-release.aab`).
   - Verifies APK signature with `apksigner`.
   - Generates `SHA256SUMS.txt`.
   - Attaches release artifacts to the GitHub Release.
   - Shreds and wipes the ephemeral keystore on the runner disk.
