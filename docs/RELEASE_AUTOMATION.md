# Release Automation & Versioning

Versioning is automated using **Release Please** (`release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml`):

1. Current development channel is **Alpha** starting at `0.1.0-alpha.0` (`v0.1.0-alpha.0`).
2. Merge commits following Conventional Commits (`feat:`, `fix:`, `perf:`, `BREAKING CHANGE:`) into `main`.
3. Release Please opens/updates a Release PR bumping `package.json`, `.release-please-manifest.json`, and `CHANGELOG.md` using prerelease versioning.
4. Merging that PR creates a GitHub tag (e.g., `v0.1.0-alpha.1`) and publishes a GitHub Release marked as a prerelease while `-alpha` / `-beta` / `-rc` is active.
5. Publishing the release triggers `.github/workflows/android-release.yml`, compiling APK + AAB binaries, computing `SHA256SUMS.txt`, and attaching them to the GitHub Release.
