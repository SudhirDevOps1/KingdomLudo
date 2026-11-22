# Database Configuration Guide

Select the active backend storage engine using `DATABASE_PROVIDER` (server-side environment variable only). If external credentials are missing, `createConfiguredDatabaseProvider()` reports validation warnings and safely falls back to local SQLite.

| `DATABASE_PROVIDER` | Required Environment Variables |
| :--- | :--- |
| `sqlite` (default) | Optional `SQLITE_DB_PATH` (defaults to `./data/kingdom-ludo.sqlite`) |
| `postgres` | `POSTGRES_URL` (optional `POSTGRES_SSL=true`) |
| `supabase` | `POSTGRES_URL` or `SUPABASE_URL` |
| `neon` | `NEON_DATABASE_URL` (or `POSTGRES_URL`) |
| `turso` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| `d1` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN` |
| `firebase` | Client reads `/firebase-applet-config.json` (plus optional `FIREBASE_PROJECT_ID`) |

Inspect live configuration capabilities safely (without exposing secrets) via `GET /api/config/capabilities` or in the UI under **Settings → Database Config**.
