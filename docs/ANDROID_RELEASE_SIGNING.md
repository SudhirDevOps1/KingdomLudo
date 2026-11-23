# KingdomLudo — Secure Android Release Signing Guide

This guide details the complete protocol for generating, securing, backing up, and configuring release signing keys for **KingdomLudo** (`com.kingdomludo.app`).

---

## 1. Release Signing Strategy (K1 vs K2)

Understanding Android cryptographic identity is essential before generating any keys:

```
┌─────────────────────────────────────────────────────────────────┐
│               K1 — Developer App Signing Key                    │
│                 (kingdomludo-release.jks)                       │
│                                                                 │
│  • Exclusively held and controlled by developer.                │
│  • Signs APKs published on GitHub Releases.                    │
│  • Enforces Android update compatibility (cannot be changed).   │
│  • Backed up using 3-copy offline disaster recovery.           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Future Google Play Store Launch
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Google Play App Signing (PEPK)                  │
│                                                                 │
│  • Developer exports K1 to Google via PEPK encryption tool.     │
│  • Google signs Play Store releases with K1.                    │
│  • Users can upgrade seamlessly from GitHub APK to Play Store!  │
└─────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Android Update Compatibility**:
> When a user installs KingdomLudo from a GitHub Release APK, the Android OS locks the application package name (`com.kingdomludo.app`) to that specific signing certificate. If you lose K1 or generate a new key for an update, the installation will fail with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Users would be forced to uninstall the game, wiping their local save data and offline statistics.

---

## 2. Local Key Generation Protocol (JDK `keytool`)

Generate the release keystore locally on your computer. **Never generate private keys on public servers, CI systems, or through third-party websites.**

### 2.1 Security Golden Rules
1. **Never pass passwords in CLI flags**: Flags like `-storepass` or `-keypass` save your plain-text passwords into Windows shell history (`ConsoleHost_history.txt`), process monitors, and screen recordings. Always let `keytool` prompt interactively.
2. **Never paste passwords or keystore contents into AI chat**: Private keys and passphrases must remain strictly confidential to you.
3. **Never place keystore files inside the git repository**: Store keys in a dedicated private directory completely outside `d:\coding project\character-kingdom-3d-ludo (3)`.

### 2.2 Directory Setup Outside Git
Open PowerShell and create a private signing vault in your user profile:

```powershell
New-Item -ItemType Directory -Path "$HOME\KingdomLudo-Signing\ORIGINAL" -Force
New-Item -ItemType Directory -Path "$HOME\KingdomLudo-Signing\ENCRYPTED-BACKUP" -Force
New-Item -ItemType Directory -Path "$HOME\KingdomLudo-Signing\KEY-INFO" -Force
cd "$HOME\KingdomLudo-Signing\ORIGINAL"
```

### 2.3 Interactive Generation Command
Execute the following `keytool` command. `keytool` is included with Java JDK 21 on your system:

```powershell
keytool -genkeypair -v `
  -keystore kingdomludo-release.jks `
  -alias kingdomludo `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storetype PKCS12
```

### Parameter Breakdown:
- `-keystore kingdomludo-release.jks`: Target file name using standard PKCS12 keystore format.
- `-alias kingdomludo`: Unique identifier for the key entry within the keystore.
- `-keyalg RSA -keysize 2048`: 2048-bit RSA algorithm supported natively from Android 7.0 (API 24) to Android 15+ (API 36).
- `-validity 10000`: 10,000 days (~27 years) validity, satisfying Google Play's 25+ year validity requirement.
- `-storetype PKCS12`: Modern, cross-platform industry standard replacing legacy proprietary JKS storage.

### Interactive Prompts Walkthrough:
When prompted, provide:
1. **Keystore password**: Enter a strong passphrase (16+ characters, symbols, numbers). *Characters will not appear on screen while typing.*
2. **Re-enter new password**: Confirm your passphrase.
3. **What is your first and last name?**: e.g., `KingdomLudo Developer`
4. **What is the name of your organizational unit?**: e.g., `KingdomLudo Studios`
5. **What is the name of your organization?**: e.g., `KingdomLudo`
6. **What is the name of your City or Locality?**: e.g., `Mumbai`
7. **What is the name of your State or Province?**: e.g., `Maharashtra`
8. **What is the two-letter country code?**: e.g., `IN`
9. **Is CN=..., OU=... correct? [no]:**: Type `yes` and press Enter.

---

## 3. Verifying the Keystore

Verify your keystore without modifying it using the read-only `-list` command:

```powershell
keytool -list -v -keystore kingdomludo-release.jks -alias kingdomludo
```

You will see:
- Keystore type: `PKCS12`
- Alias name: `kingdomludo`
- Certificate SHA-256 fingerprint (e.g. `SHA256: 3A:4F:91:...`)

Record your **Alias Name** (`kingdomludo`) and **SHA-256 Fingerprint** in `$HOME\KingdomLudo-Signing\KEY-INFO\README.txt` for your records. **Do not write the password in this file.**

---

## 4. Local AES-256 Encrypted Backup (7-Zip)

Protect your original keystore against local storage corruption and unauthorized access using free 7-Zip AES-256 encryption.

If 7-Zip is installed:
```powershell
& "C:\Program Files\7-Zip\7z.exe" a -t7z "$HOME\KingdomLudo-Signing\ENCRYPTED-BACKUP\kingdomludo-backup.7z" "$HOME\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks" -p -mhe=on
```
*-mhe=on encrypts header metadata so file names inside the archive are concealed.*

---

## 5. Configuring GitHub Actions Secrets for CI/CD

To allow GitHub Actions to build and sign release APKs without exposing secrets:

### Step 5.1: Export Keystore to Base64 String
In PowerShell, run this command to copy the Base64 representation directly to your clipboard:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks")) | Set-Clipboard
```
*Note: This command copies the string cleanly without line breaks or carriage returns.*

### Step 5.2: Add Secrets to GitHub Repository
1. Navigate to: `https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions`
2. Add the following **4 Repository Secrets**:

| Secret Name | Value Description |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | The Base64 string from your clipboard (from Step 5.1) |
| `ANDROID_KEYSTORE_PASSWORD` | The passphrase chosen during key generation |
| `ANDROID_KEY_ALIAS` | `kingdomludo` (the exact alias name chosen) |
| `ANDROID_KEY_PASSWORD` | The key password (identical to keystore password in PKCS12) |

---

## 6. How CI/CD Build & Signing Works

When a release tag is pushed (e.g. `git tag v0.1.0 && git push origin v0.1.0`):
1. **Environment Setup**: GitHub Actions runner spins up an ephemeral Ubuntu VM.
2. **Keystore Materialization**: The base64 secret is decoded into a temporary file `android/release-keystore.jks`.
3. **Compilation & Signing**: Gradle runs `./gradlew assembleRelease bundleRelease` with V1, V2, and V3 APK signatures applied.
4. **Signature Verification**: Runner validates the APK signature using `apksigner` / `jarsigner`.
5. **Checksum Generation**: Runner calculates SHA-256 checksums (`SHA256SUMS.txt`).
6. **Publishing**: Signed APK (`app-release.apk`) and checksums are attached to the GitHub Release.
7. **Secure Shredding**: In the `always()` post-step, the runner executes:
   ```bash
   shred -u -z -n 3 android/release-keystore.jks
   ```
   This zeroes out disk sectors before unlinking the file, ensuring zero remnants on runner disk storage.
