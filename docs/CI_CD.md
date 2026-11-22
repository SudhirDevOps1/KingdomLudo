# CI/CD Pipeline Architecture (`.github/workflows/`)

- `ci.yml`: Runs on every push/PR to `main` — `npm ci`, `npm run lint` (`tsc --noEmit && eslint .`), `npm test` (`vitest run`), and `npm run build`, uploading `dist/` artifact.
- `web-deploy.yml`: Builds production SPA/PWA and publishes `dist/` to Cloudflare Pages when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set.
- `android-debug.yml`: Sets up Java 17 + Android SDK, runs `npm run build`, syncs Capacitor Android (`npx cap sync android`), and builds a debug APK artifact.
- `android-release.yml`: Triggers on published GitHub Releases; decodes keystore if configured, builds Release APK & AAB (`assembleRelease bundleRelease`), generates `SHA256SUMS.txt`, and uploads artifacts directly to the GitHub Release.
- `release-please.yml`: Automates Semantic Versioning PRs, tags, and `CHANGELOG.md` updates using Conventional Commits.
- `dependency-review.yml` & `codeql.yml`: Automated dependency vulnerability blocking and CodeQL static JavaScript/TypeScript analysis.
