# Cloudflare Worker & Build Environment Configuration Guide

## 1. Cloudflare Workers & Pages → Build Environment Variables
Set these under **Settings → Build → Variables and secrets** (used at build time by `vite build`):

| Variable | Type | Value / Where to Find |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Plaintext | Supabase Dashboard → Project Settings → Data API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Plaintext | Supabase Dashboard → Project Settings → API Keys → `anon` / `public` key |

---

## 2. Cloudflare Worker → Runtime Variables & Secrets
Set these under **Settings → Variables and Secrets** (used at runtime by `server/cloudflare/worker.ts` and `LudoRoomDO`):

| Variable | Type | Value / Purpose |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Plaintext | Same Supabase Project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** (Encrypted) | Supabase Dashboard → API Keys → `service_role` secret (NEVER put in `VITE_*`) |
| `ALTCHA_HMAC_KEY` | **Secret** (Encrypted) | Any random 32+ character secret string used to sign ALTCHA Proof-of-Work challenges |

Non-secret defaults (`ENVIRONMENT = "production"`, `APP_NAME = "KingdomLudo"`) are already configured in `wrangler.jsonc`.

---

## 3. Supabase Authentication Troubleshooting (`Email not confirmed`)
If a user registers with an email and sees **`Email not confirmed`** on Sign In:
1. Open **Supabase Dashboard → Authentication → Providers → Email**.
2. Either:
   - Keep **Confirm email** ON (recommended for production) and click the confirmation link sent to the inbox (or use the **"Resend Confirmation Email"** button in KingdomLudo's Profile page), **OR**
   - Toggle **Confirm email** OFF if you want instant login without email verification.
3. Under **Authentication → URL Configuration**, set **Site URL** and **Redirect URLs** to your live Cloudflare URL (`https://kingdomludo.sudhirdevops1.workers.dev`).
