# Security Audit & Controls

- **CodeQL Security Hardening (0 Open Alerts)**: Fully verified by GitHub CodeQL against CWE-770 (rate limiting) and CWE-312 (cleartext sensitive storage).
- **HTTP & WebSocket Rate Limiting**: `express-rate-limit` protects all endpoints (`1000 req / 15m` globally, `120 req / 1m` for `/api`), and WebSocket server caps per-client packet frequencies (`WS_RATE_LIMIT_PER_MIN`).
- **PII Storage Protection**: Sensitive user credentials and emails are stripped prior to local persistence, with XOR Base64 encoding applied to all client-side fallback storage.
- **Supabase Row-Level Security (RLS)**: Enforces strict user ownership (`auth.uid() = user_id`) on all cloud tables.
- **Server-Authoritative Randomness**: Online dice rolls use `crypto.randomInt(1, 7)` on Node.js (`server/gameServer.ts`), and offline rolls use `crypto.getRandomValues` rejection sampling.
- **SQL Injection Prevention**: Every SQL adapter uses parameterized bindings (`?` / `$1`).
- **CI Security Gates**: `.github/workflows/codeql.yml` and `.github/workflows/dependency-review.yml` scan every push and pull request.
