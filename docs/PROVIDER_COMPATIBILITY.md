# Database Provider Compatibility Matrix

| Provider | Package / Transport | SQL Queries | Transactions | Free-Tier Constraints & Notes |
| :--- | :--- | :--- | :--- | :--- |
| `sqlite` (Default) | Node 22 built-in `node:sqlite` | Yes | Yes | Zero external infra; single-node local file (`./data/kingdom-ludo.sqlite`). |
| `postgres` | `pg` connection pool | Yes | Yes | Self-hosted or managed PostgreSQL; SSL configurable via `POSTGRES_SSL`. |
| `supabase` | `pg` via Supabase Postgres URL | Yes | Yes | Free tier: 500 MB database, pauses after 7 days inactivity. |
| `neon` | `pg` via Neon Serverless Postgres | Yes | Yes | Free tier: 0.5 GB storage, scale-to-zero cold wake (~500ms). |
| `turso` | `@libsql/client` | Yes | Yes | Free tier: 5 GB storage, 500M row reads/month across edge replicas. |
| `d1` | Cloudflare D1 REST API | Yes | Emulated batch | Free tier: 5M rows read/day, 100k writes/day; REST latency higher than native socket. |
| `firebase` | Firebase Web SDK + Server SQLite fallback | No (NoSQL) | Document batch | Free Spark tier: 1 GB Firestore, 50k reads/20k writes/day; server falls back to local SQLite for SQL endpoints. |
