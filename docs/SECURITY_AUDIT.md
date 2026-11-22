# Security Audit & Controls

- **Firestore Security Rules (`firestore.rules` & `security_spec.md`)**: Enforces user-ownership (`request.auth.uid == userId`), type/range validation on stats, immutable `createdAt`, explicit field whitelisting on `hasOnly`, and PII email isolation under `/users/{userId}/private/account`. Validated cleanly with `@firebase/eslint-plugin-security-rules`.
- **Server-Authoritative Randomness**: Online dice rolls use `crypto.randomInt(1, 7)` on Node.js (`server/gameServer.ts`), and offline rolls use `crypto.getRandomValues` rejection sampling.
- **SQL Injection Prevention**: Every SQL adapter uses parameterized bindings (`?` / `$1`).
- **Rate Limiting & Sanitization**: WebSocket server caps per-client traffic (`WS_RATE_LIMIT_PER_MIN`), caps player display names, and validates turn ownership + `expectedSeq`.
- **CI Security Gates**: `.github/workflows/codeql.yml` and `.github/workflows/dependency-review.yml` scan every push and pull request.
