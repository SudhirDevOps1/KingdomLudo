# 🔐 GitHub Secrets & Variables Master Configuration Guide

This guide provides direct links, exact copy-paste values, and step-by-step instructions for configuring **GitHub Encrypted Secrets** and **GitHub Repository Variables** for the KingdomLudo CI/CD and deployment pipelines.

---

## 🧭 Direct GitHub Settings Link

Open this link directly in your browser:  
👉 **[https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions](https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions)**

```text
GitHub Repo: SudhirDevOps1/KingdomLudo
└── Settings
    └── Secrets and variables
        └── Actions
            ├── [Secrets tab]   ──► Click "New repository secret"   (Encrypted & Masked)
            └── [Variables tab] ──► Click "New repository variable" (Plaintext & Visible)
```

---

## 🔒 1. Encrypted Secrets (`New repository secret`)

Secrets are **permanently encrypted**. Once saved, they are masked (`***`) in all GitHub Actions build logs and cannot be read back by anyone.

Click **`New repository secret`** for each of the following:

| # | Secret Name | Value Format & Example | Where & How to Get It (Direct Links) |
| :-- | :--- | :--- | :--- |
| **1** | **`CLOUDFLARE_API_TOKEN`** | `v4.0-...` *(40-char string)* | **Direct Link:** [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)<br />1. Click **Create Token**.<br />2. Find the template **Edit Cloudflare Pages** and click **Use template**.<br />3. Under Account Resources, select your account.<br />4. Click **Continue to summary** ➜ **Create Token**.<br />5. Copy the token immediately and paste here. |
| **2** | **`VITE_SUPABASE_URL`** | `https://xxxx.supabase.co` | **Direct Link:** [Supabase Dashboard](https://supabase.com/dashboard)<br />1. Select your project.<br />2. In the left-hand sidebar, click ⚙️ **Project Settings** (at the very bottom).<br />3. Click **API**.<br />4. Under **Project URL**, copy the URL. |
| **3** | **`VITE_SUPABASE_ANON_KEY`** | `eyJhbGciOi...` *(Long JWT token)* | **Direct Link:** [Supabase Dashboard](https://supabase.com/dashboard)<br />1. In the same **Project Settings ➜ API** page.<br />2. Under **Project API keys**, copy the **`anon` `public`** key. |
| **4** | **`ANDROID_KEYSTORE_BASE64`** | `MIIKvgIBAzCC...` *(Base64 string)* | **Generated via PowerShell:** Run the 2 commands in [Section 3](#-3-how-to-generate-android-keystore-secrets-windows-powershell) below. It creates `keystore_base64.txt`. Copy the text inside and paste here. |
| **5** | **`ANDROID_KEYSTORE_PASSWORD`** | *(Your chosen password)* | The password you typed when creating the keystore. |
| **6** | **`ANDROID_KEY_ALIAS`** | `kingdomludo-key` | The alias name used during creation (`kingdomludo-key`). |
| **7** | **`ANDROID_KEY_PASSWORD`** | *(Your chosen password)* | The key password (usually the same as keystore password). |

---

## 🌐 2. Plaintext Variables (`New repository variable`)

Variables are **visible in plain text** in the repository settings. They are used for non-secret configuration like project names, account IDs, and public URLs.

Click the **`Variables`** tab ➜ Click **`New repository variable`** for each:

| # | Variable Name | Recommended Value | Where to Find / What It Means |
| :-- | :--- | :--- | :--- |
| **1** | **`CLOUDFLARE_ACCOUNT_ID`** | `32-character hex string` | **Direct Link:** [Cloudflare Dashboard](https://dash.cloudflare.com)<br />1. Log in to Cloudflare.<br />2. On the right-hand sidebar of your Overview (or in your browser address bar after `dash.cloudflare.com/`), copy your 32-character **Account ID**. |
| **2** | **`CLOUDFLARE_PAGES_PROJECT`** | `kingdomludo` | The name of your Cloudflare Pages project (matches `kingdomludo` in `wrangler.jsonc`). |
| **3** | **`VITE_WS_URL`** | *(Leave empty or enter remote WSS)* | If client and server are hosted on the same domain, leave this empty. If hosting frontend on Cloudflare Pages and backend on Render/Fly.io, enter e.g. `wss://game.yourdomain.com/ws`. |
| **4** | **`VITE_APP_NAME`** | `KingdomLudo` | Display name for the application title bar and PWA header. |

---

## 🛠️ 3. How to Generate Android Keystore Secrets (Windows PowerShell)

If you want GitHub Actions to compile and sign production Android Release APKs and Google Play App Bundles (AABs):

### Step 1: Open PowerShell as Administrator and run:
```powershell
keytool -genkey -v -keystore kingdomludo-release.jks -alias kingdomludo-key -keyalg RSA -keysize 2048 -validity 10000
```
- It will ask for a password (e.g. `KingdomSecret2026!`). Remember this password.
- It will ask for your name/organization. You can fill them in or press Enter.
- Type `yes` to confirm.

### Step 2: Convert the Keystore file into Base64 text:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("kingdomludo-release.jks")) | Set-Content -Path "keystore_base64.txt"
```

### Step 3: Add to GitHub Secrets:
1. Open `keystore_base64.txt` in Notepad.
2. Select All (`Ctrl + A`) and Copy (`Ctrl + C`).
3. In [GitHub Secrets](https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions), click **New repository secret**:
   - Name: `ANDROID_KEYSTORE_BASE64`
   - Secret: *Paste the Base64 text*
4. Create `ANDROID_KEYSTORE_PASSWORD` with your password.
5. Create `ANDROID_KEY_ALIAS` with `kingdomludo-key`.
6. Create `ANDROID_KEY_PASSWORD` with your key password.

---

## 🚦 Summary: Which Workflows Use What?

| Workflow File | Purpose | Secrets Used | Variables Used |
| :--- | :--- | :--- | :--- |
| **`web-deploy.yml`** | Builds and publishes Web & PWA to Cloudflare Pages | `CLOUDFLARE_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, `VITE_WS_URL`, `VITE_APP_NAME` |
| **`android-release.yml`** | Generates signed production Release APK & AAB | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | None |
| **`android-debug.yml`** | Builds nightly debug APK for testing | None (uses default debug keystore) | None |
| **`ci.yml`** | Strict typecheck, ESLint, Vitest, and production build | None (runs zero-config with embedded SQLite) | None |
| **`codeql.yml`** | Continuous security scanning (0 open alerts) | `GITHUB_TOKEN` *(Built-in)* | None |
| **`release-please.yml`** | Automated semantic versioning and changelogs | `GITHUB_TOKEN` *(Built-in)* | None |
