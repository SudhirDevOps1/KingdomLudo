# 🔐 GitHub Secrets & Variables Master Configuration Guide

This guide provides direct links, visual UI wireframes, exact copy-paste values, and step-by-step instructions for configuring **GitHub Encrypted Secrets** and **GitHub Repository Variables** for the KingdomLudo CI/CD and deployment pipelines.

---

## 🧭 Direct GitHub Settings Link

Open this link directly in your browser:  
👉 **[https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions](https://github.com/SudhirDevOps1/KingdomLudo/settings/secrets/actions)**

### 🖥️ What the GitHub Settings Screen Looks Like:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  SudhirDevOps1 / KingdomLudo                                                           │
│  [Code]  [Issues]  [Pull requests]  [Actions]  [Security]  [Insights]  [⚙️ Settings]   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Left Sidebar           │  Actions secrets and variables                               │
│  ────────────           │  ─────────────────────────────                               │
│  General                │                                                              │
│  Collaborators          │  ┌───────────────┬─────────────────┐                         │
│  ...                    │  │ Secrets (Tab) │ Variables (Tab) │                         │
│  Security               │  └───────────────┴─────────────────┘                         │
│   Secrets and variables │                                                              │
│    └── Actions  ◄───────┤  Repository secrets               [New repository secret] ◄──┼── Click here for Secrets
│                         │  These secrets are encrypted...                              │
│                         │                                                              │
│                         │  Repository variables             [New repository variable] ◄┼── Click here for Variables
│                         │  These variables are plaintext...                            │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🔒 1. Encrypted Secrets (`New repository secret`)

> **Kyu Encrypted?** Yeh sensitive tokens, passwords aur private keys hote hain jo save karne ke baad **kabhi kisi ko nahi dikhte** (GitHub logs me `***` mask ho jate hain).

### 🖼️ What the "New Repository Secret" Screen Looks Like:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Actions secrets / New secret                                                          │
│                                                                                        │
│  Name *                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ e.g. CLOUDFLARE_API_TOKEN                                                        │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  Secret *                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ (Paste the actual secret token / password / Base64 string here)                  │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  [ Add secret ] ◄── Click this green button to save                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 📋 Complete Secrets Table (7 Items Total):

| # | Name (Paste in `Name *` box) | Where & How to Get Value (Direct Links) |
| :- | :--- | :--- |
| **1** | `CLOUDFLARE_API_TOKEN` | **Direct Link:** [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)<br />1. Click **Create Token**.<br />2. Find template **Edit Cloudflare Pages** ➜ Click **Use template**.<br />3. Under Account Resources, select your account.<br />4. Click **Continue to summary** ➜ **Create Token**.<br />5. Copy token and paste in `Secret *` box. |
| **2** | `VITE_SUPABASE_URL` | **Direct Link:** [Supabase Dashboard](https://supabase.com/dashboard)<br />1. Select your project.<br />2. In left sidebar, click ⚙️ **Project Settings** (at the bottom).<br />3. Click **API**.<br />4. Under **Project URL**, copy URL (e.g. `https://xxxx.supabase.co`). |
| **3** | `VITE_SUPABASE_ANON_KEY` | **Direct Link:** [Supabase Dashboard](https://supabase.com/dashboard)<br />1. In same **Project Settings ➜ API** page.<br />2. Under **Project API keys**, copy the **`anon` `public`** key string. |
| **4** | `ANDROID_KEYSTORE_BASE64` | **Generated via PowerShell:** Run the 2 commands in [Section 3](#-3-how-to-generate-android-keystore-secrets-windows-powershell) below. It creates `keystore_base64.txt`. Copy all text inside and paste here. |
| **5** | `ANDROID_KEYSTORE_PASSWORD` | The password you typed when creating the keystore. |
| **6** | `ANDROID_KEY_ALIAS` | `kingdomludo-key` (The alias name used during creation). |
| **7** | `ANDROID_KEY_PASSWORD` | The key password (usually same as keystore password). |

---

## 🌐 2. Plaintext Variables (`New repository variable`)

> **Kyu Plaintext?** Yeh sensitive nahi hote (jaise Project ID, App Title, Domain URLs) aur settings me normal text me dikhte hain.

### 🖼️ What the "New Repository Variable" Screen Looks Like:
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Actions variables / New variable                                                      │
│                                                                                        │
│  Name *                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ e.g. CLOUDFLARE_ACCOUNT_ID                                                       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  Value *                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ (Paste the account ID or project name here)                                      │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  [ Add variable ] ◄── Click this green button to save                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 📋 Complete Variables Table (4 Items Total):

| # | Name (Paste in `Name *` box) | Value Example | Where to Find |
| :- | :--- | :--- | :--- |
| **1** | `CLOUDFLARE_ACCOUNT_ID` | `0123456789abcdef0123456789abcdef` | **Direct Link:** [Cloudflare Dashboard](https://dash.cloudflare.com)<br />Right sidebar me ya browser URL me jo 32-character ID hoti hai. |
| **2** | `CLOUDFLARE_PAGES_PROJECT` | `kingdomludo` | Project name on Cloudflare Pages (defaults to `kingdomludo`). |
| **3** | `VITE_WS_URL` | *(Blank if same host, or remote WSS)* | If client and server are hosted on same domain, leave empty. Otherwise `wss://game.yourdomain.com/ws`. |
| **4** | `VITE_APP_NAME` | `KingdomLudo` | Brand application title. |

---

## 🛠️ 3. How to Generate Android Keystore Secrets (Windows PowerShell)

If you want GitHub Actions to compile and sign production Android Release APKs and Google Play App Bundles (AABs):

### Step 1: Open PowerShell as Administrator and run:
```powershell
keytool -genkey -v -keystore kingdomludo-release.jks -alias kingdomludo-key -keyalg RSA -keysize 2048 -validity 10000
```
- Enter your password (e.g. `KingdomSecret2026!`). Remember this password.
- Fill in or press Enter for the organization details.
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
| **`web-deploy.yml`** | Publishes Web & PWA to Cloudflare Pages | `CLOUDFLARE_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, `VITE_WS_URL`, `VITE_APP_NAME` |
| **`android-release.yml`** | Compiles signed production Release APK & AAB | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | None |
| **`android-debug.yml`** | Builds nightly debug APK for testing | None (uses default debug keystore) | None |
| **`ci.yml`** | Typecheck, ESLint, Vitest, and production build | None (runs zero-config with embedded SQLite) | None |
| **`codeql.yml`** | Continuous security scanning (0 open alerts) | `GITHUB_TOKEN` *(Built-in)* | None |
| **`release-please.yml`** | Automated semantic versioning and changelogs | `GITHUB_TOKEN` *(Built-in)* | None |
