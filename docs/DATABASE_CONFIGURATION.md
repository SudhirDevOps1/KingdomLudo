# 🗄️ Database Architecture & Storage Configuration

KingdomLudo provides an interchangeable, capability-based database abstraction layer defined in [`server/backend/providerFactory.ts`](../server/backend/providerFactory.ts).

If external cloud database credentials are missing or unconfigured, the application **automatically and safely falls back to local SQLite**, ensuring that local development and offline testing work with zero setup friction.

---

## 📊 Supported Storage Providers

| `DATABASE_PROVIDER` | Best For | Required Environment Variables | Setup Complexity |
| :--- | :--- | :--- | :--- |
| **`sqlite`** *(Default)* | Local Development, Offline Desktop | `SQLITE_DB_PATH` *(Optional, defaults to `./data/kingdom-ludo.sqlite`)* | ⭐ Zero config |
| **`supabase`** | Cloud Production, Cross-device sync | `POSTGRES_URL` (Supabase Connection Pooler) or `SUPABASE_URL` + `SUPABASE_ANON_KEY` | ⭐⭐ Free Tier |
| **`postgres`** | Self-hosted PostgreSQL / Neon / AWS RDS | `POSTGRES_URL` *(URI format)* | ⭐⭐ Simple |
| **`turso`** | Edge-replicated libSQL | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | ⭐⭐ Free Tier |
| **`d1`** | Cloudflare Workers Serverless | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN` | ⭐⭐⭐ Edge |

---

## 🛠️ Provider Details

### 1. SQLite (`sqlite`) — Default Local Engine
- Utilizes Node's native SQLite engine (`node:sqlite`).
- Database file is created automatically at `./data/kingdom-ludo.sqlite`.
- Includes schema initialization and automatic table creation on startup.
- Ideal for fast local development, unit tests, and continuous integration runners.

### 2. Supabase PostgreSQL (`supabase` / `postgres`)
- Supabase provides a hosted PostgreSQL instance with Row-Level Security (RLS) and built-in connection pooling via PgBouncer / Supavisor.
- To configure:
  ```env
  DATABASE_PROVIDER=supabase
  POSTGRES_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
  SUPABASE_URL="https://[PROJECT_REF].supabase.co"
  SUPABASE_ANON_KEY="[ANON_KEY]"
  ```
- All migration scripts reside in [`supabase/migrations/`](../supabase/migrations/).

### 3. Cloudflare D1 (`d1`)
- Serverless SQL database integrated with Cloudflare Workers.
- Allows edge workers to read and write match state with minimal cold-start latency.
- Managed via `wrangler.jsonc`.

---

## 🔍 Runtime Capability Checking
The game server exposes an unauthenticated, zero-leak health check:
- Endpoint: `GET /api/config/capabilities`
- Returns active provider name, health status, and supported features without disclosing connection strings or credentials.
- Also viewable in-game via **Settings → Database Config**.
