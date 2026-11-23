# KingdomLudo — Android Key Backup & Disaster Recovery Playbook

This document defines the disaster recovery and key restoration protocol for KingdomLudo (`com.kingdomludo.app`).

---

## 1. The Core Law of Android Key Management

> [!CAUTION]
> **A lost release signing key cannot be replaced or recovered by Google, GitHub, or any AI assistant.**
> If your release signing key (`kingdomludo-release.jks`) is lost:
> 1. Existing users with the GitHub APK will **never receive automated updates**.
> 2. Attempting to install an update signed with any new key will trigger:
>    `INSTALL_FAILED_UPDATE_INCOMPATIBLE`
> 3. Users must completely uninstall KingdomLudo to install newer versions, which destroys all local match history, unlocked character customizations, and offline game saves.

### Why GitHub Secrets Is NOT a Disaster Backup
- **GitHub Secrets are write-only**: Once saved, neither you nor any GitHub administrator can view, read, or download the secret back.
- **Account or Organization Lockout**: If your GitHub account is compromised, banned, or the repository is accidentally deleted, the secret is permanently lost.
- **Base64 is NOT Encryption**: Base64 is merely text encoding. Storing Base64 files unencrypted on your desktop or cloud is equivalent to leaving your private key in plain text.

---

## 2. The 3-Copy Backup Strategy

Maintain three distinct copies across different physical media and failure domains:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        3-COPY BACKUP TOPOLOGY                          │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Copy 1: Primary PC │ Copy 2: USB Drive  │ Copy 3: Offsite / Safe Vault │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ Local Fast SSD     │ Offline Air-Gapped │ Separate Location / Cloud    │
│ User Profile       │ Removable USB      │ Encrypted Master Vault       │
│ Active Development │ Physical Safe      │ Catastrophic Redundancy      │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Copy 1: Primary Workstation
- Location: `$HOME\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks`
- Protection: Windows User Account Security / BitLocker disk encryption.
- Purpose: Active CI/CD configuration and local release builds.

### Copy 2: Removable Offline USB Drive
- Media: Clean USB flash drive stored in a safe drawer or desk.
- File: `kingdomludo-backup.7z` (AES-256 encrypted with header encryption enabled).
- Protection: Encrypted archive password known only to you.
- Purpose: Primary recovery if your PC requires a Windows re-install or experiences drive failure.

### Copy 3: Secondary Physical Location or Encrypted Personal Vault
- Media: A second USB flash drive kept at a family member's house, a physical locker, or uploaded to a zero-knowledge cloud vault (e.g., KeePassXC database, Bitwarden encrypted attachment, or Cryptomator container).
- File: `kingdomludo-backup.7z`.
- Purpose: Complete catastrophic protection against fire, flood, theft, or total hardware loss.

---

## 3. Disaster Recovery Scenarios & Action Plans

### Scenario A: Windows PC Reset or Hard Drive Failure
1. Insert your **Copy 2 USB Drive** into your newly installed Windows machine.
2. Install 7-Zip from [7-zip.org](https://www.7-zip.org/).
3. Copy `kingdomludo-backup.7z` to `C:\Users\<User>\KingdomLudo-Signing\ENCRYPTED-BACKUP\`.
4. Right-click `kingdomludo-backup.7z` &rarr; **7-Zip** &rarr; **Extract Here** (enter your archive password).
5. Move the extracted `kingdomludo-release.jks` to `C:\Users\<User>\KingdomLudo-Signing\ORIGINAL\`.
6. Verify keystore integrity:
   ```powershell
   keytool -list -v -keystore "C:\Users\<User>\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks" -alias kingdomludo
   ```

### Scenario B: Accidental File Deletion on Local PC
1. Do **not** attempt to generate a new key with `keytool`.
2. Connect your backup USB drive.
3. Extract `kingdomludo-release.jks` back into your `$HOME\KingdomLudo-Signing\ORIGINAL\` folder.

### Scenario C: GitHub Repository Deletion / Fork Re-creation
1. Create a new GitHub repository for KingdomLudo.
2. Push your project source code.
3. Re-export the Base64 string from your local keystore:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks")) | Set-Clipboard
   ```
4. Re-populate the 4 secrets under **Repository Settings &rarr; Secrets and variables &rarr; Actions**:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
5. Run the release workflow. The output APKs will have the exact same cryptographic signature and will update existing installs cleanly.

---

## 4. Keystore Integrity Verification Manual

You can audit the validity of your keystore at any time without risking corruption or accidental edits:

```powershell
keytool -list -v -keystore "$HOME\KingdomLudo-Signing\ORIGINAL\kingdomludo-release.jks"
```

### What to check:
1. **Entry type**: Must be `PrivateKeyEntry`.
2. **Certificate chain length**: Typically `1`.
3. **Valid from ... until**: Confirm expiration date (should be ~27 years in the future).
4. **Certificate fingerprints**:
   - `SHA256: XX:XX:XX:...`
   - Keep this SHA-256 fingerprint saved. It is the public identity of KingdomLudo on Android devices.

---

## 5. Google Play Console Future Enrollment (PEPK Guide)

When you are ready to publish KingdomLudo to the Google Play Store:

1. In Google Play Console, start app setup for `com.kingdomludo.app`.
2. Go to **Release &rarr; Setup &rarr; App Integrity &rarr; App signing**.
3. Choose **"Use existing app signing key"** &rarr; **"Export and upload a key from Java Keystore"**.
4. Download Google's Play Encrypt Private Key (`pepk.jar`) tool provided in the console.
5. Run the PEPK export command locally on your machine:
   ```bash
   java -jar pepk.jar \
     --keystore="$HOME/KingdomLudo-Signing/ORIGINAL/kingdomludo-release.jks" \
     --alias=kingdomludo \
     --output=output.zip \
     --rsa-aes-encryption \
     --encryption-key-path=/path/to/encryption_public_key.pem
   ```
6. Upload the resulting `output.zip` to the Play Console.

**Outcome**: Google Play now signs the Play Store app with your **K1** key. Any user who previously installed the GitHub APK can seamlessly update their app through the Play Store with zero data loss.
