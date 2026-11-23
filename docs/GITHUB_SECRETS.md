# 🔐 GitHub Secrets & Variables Master Configuration Guide

This guide provides step-by-step instructions on configuring **GitHub Secrets** and **GitHub Repository Variables** for the KingdomLudo CI/CD and deployment workflows.

---

## 🧭 Navigation in GitHub Settings

1. Open your repository on GitHub:
   👉 **`https://github.com/SudhirDevOps1/KingdomLudo`**
2. Click the **⚙️ Settings** tab in the top navigation bar.
3. In the left-hand sidebar, scroll down to the **Security** category.
4. Click **Secrets and variables** → choose **Actions**.
5. You will see two tabs:
   - **Secrets** tab: for sensitive keys, passwords, private tokens.
   - **Variables** tab: for public configuration values like project names, IDs, URLs.

```text
Repository Settings
└── Secrets and variables
    └── Actions
        ├── Secrets   ──► [New repository secret]   (Encrypted & Masked)
        └── Variables ──► [New repository variable] (Visible in plaintext)
```

---

## 🔒 1. Secrets (Encrypted — Click "New repository secret")

Secrets are permanently encrypted and masked in all build and workflow logs. Once added, you can update them, but you can never read them back from GitHub.

| Secret Name | Required By | Description & Value Format | Where to Obtain |
| :--- | :--- | :--- | :--- |
| **`CLOUDFLARE_API_TOKEN`** | `web-deploy.yml` | API Token with permission to deploy Cloudflare Pages | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Custom Token → Template: **Edit Cloudflare Pages** |
| **`VITE_SUPABASE_URL`** | `web-deploy.yml` | Supabase API endpoint (e.g. `https://xxxx.supabase.co`) | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → **API** → Project URL |
| **`VITE_SUPABASE_ANON_KEY`**| `web-deploy.yml` | Supabase public anonymous client API key | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → **API** → `anon` `public` key |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Server / Edge | Server-side elevated admin key (never expose to frontend) | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → **API** → `service_role` key |
| **`POSTGRES_URL`** | Backend Server | PostgreSQL direct connection string (port 6543 / 5432) | Supabase Project Settings → **Database** → Connection String (URI format) |
| **`ANDROID_KEYSTORE_BASE64`** | `android-release.yml` | Base64-encoded string of your Android release `.jks` file | Generated locally using `keytool` (see generator commands below) |
| **`ANDROID_KEYSTORE_PASSWORD`** | `android-release.yml` | Password used when creating the release keystore | Your chosen keystore password |
| **`ANDROID_KEY_ALIAS`** | `android-release.yml` | Key alias name inside the keystore (e.g. `kingdomludo-key`) | The alias name passed to `keytool` |
| **`ANDROID_KEY_PASSWORD`** | `android-release.yml` | Password for the key alias | Your chosen alias password |

---

## 🌐 2. Variables (Plaintext — Click "New repository variable")

Variables are visible in plaintext in the repository settings and are injected into workflow steps without masking.

| Variable Name | Default / Example Value | Description |
| :--- | :--- | :--- |
| **`CLOUDFLARE_ACCOUNT_ID`** | `32-char hex string` | Your Cloudflare Account ID (Found in Cloudflare dashboard URL or sidebar) |
| **`CLOUDFLARE_PAGES_PROJECT`**| `kingdomludo` | Target project name on Cloudflare Pages |
| **`VITE_WS_URL`** | `wss://api.yourdomain.com/ws` | Remote WebSocket URL (Leave blank if frontend and server are hosted together) |
| **`VITE_APP_NAME`** | `KingdomLudo` | Brand application name override |

---

## 🛠️ Step-by-Step Provider Guides

### A. How to Get Cloudflare Credentials
1. **Cloudflare Account ID**:
   - Log into [dash.cloudflare.com](https://dash.cloudflare.com).
   - In the right-hand sidebar of your Overview or in the URL after `dash.cloudflare.com/`, copy the **Account ID** (e.g. `0123456789abcdef0123456789abcdef`).
   - Add as a **Repository Variable**: `CLOUDFLARE_ACCOUNT_ID`.
2. **Cloudflare API Token**:
   - Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).
   - Click **Create Token**.
   - Use the **Edit Cloudflare Pages** template (or create custom with `Account → Cloudflare Pages → Edit`).
   - Click **Continue to summary** → **Create Token**.
   - Copy the token immediately and add as a **Repository Secret**: `CLOUDFLARE_API_TOKEN`.

---

### B. How to Get Supabase Credentials
1. Open your project on [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings (⚙️ icon at the bottom of the left sidebar)** → **API**.
3. Under **Project URL**:
   - Copy the URL (e.g. `https://xyzprojectref.supabase.co`).
   - Add as a **Repository Secret**: `VITE_SUPABASE_URL`.
4. Under **Project API keys**:
   - Copy the `anon` `public` key.
   - Add as a **Repository Secret**: `VITE_SUPABASE_ANON_KEY`.

---

### C. How to Generate Android Release Keystore & Base64
If you want GitHub Actions to compile and sign a production Android Release APK (`android-release.yml`):

#### 1. Generate Keystore via Terminal
Open PowerShell (Windows) or Bash (Linux/macOS):
```bash
keytool -genkey -v -keystore kingdomludo-release.jks -alias kingdomludo-key -keyalg RSA -keysize 2048 -validity 10000
```
*(Enter a secure password and remember it).*

#### 2. Convert `.jks` file to Base64 String

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("kingdomludo-release.jks")) | Set-Content -Path "keystore_base64.txt"
```

**On Linux or macOS:**
```bash
base64 -w 0 kingdomludo-release.jks > keystore_base64.txt
```

#### 3. Save into GitHub Secrets
1. Open `keystore_base64.txt` and copy the entire text.
2. In GitHub Secrets, create **`ANDROID_KEYSTORE_BASE64`** and paste the text.
3. Create **`ANDROID_KEYSTORE_PASSWORD`** with your keystore password.
4. Create **`ANDROID_KEY_ALIAS`** with `kingdomludo-key`.
5. Create **`ANDROID_KEY_PASSWORD`** with your key alias password.

---

## 🚦 Workflows & What Triggers Them

| Workflow | Trigger | Secrets / Variables Used | Output |
| :--- | :--- | :--- | :--- |
| **CI (`ci.yml`)** | Push & Pull Request on `main` | None (runs in zero-config mode) | Runs TypeScript strict check, ESLint, Vitest, and Vite build |
| **CodeQL (`codeql.yml`)** | Push, PR & Weekly Cron | `GITHUB_TOKEN` (Built-in) | Scans for security vulnerabilities (CWE alerts) |
| **Android Debug APK (`android-debug.yml`)** | Push to `main` & Manual Dispatch | None (signs with debug key) | Produces unsigned Debug APK artifact for instant testing |
| **Deploy Web & PWA (`web-deploy.yml`)** | Push to `main` & Manual Dispatch | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_*` | Deploys live web app to Cloudflare Pages |
| **Android Release (`android-release.yml`)** | Release Published or Manual Dispatch | `ANDROID_KEYSTORE_*` | Compiles signed release APK and Android App Bundle (AAB) for Google Play |
| **Release Please (`release-please.yml`)** | Push to `main` | `GITHUB_TOKEN` | Automates semantic versioning, tags, and changelog updates |
