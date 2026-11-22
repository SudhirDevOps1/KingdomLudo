# Security Policy

## Reporting a Vulnerability

Please do **not** open public GitHub issues for security vulnerabilities. Report vulnerabilities privately to the repository maintainers with reproduction steps and affected commit/version.

## Security Architecture Highlights

- **Server-Authoritative Multiplayer**: Dice rolls use Node `crypto.randomInt(1, 7)` on the server; clients cannot submit dice values or out-of-turn actions.
- **Zero-Trust Firestore Rules**: Strict user-ownership rules with PII isolated under `/users/{userId}/private/{docId}` and validated via `@firebase/eslint-plugin-security-rules`.
- **Parameterized SQL**: All SQL adapters bind query parameters and isolate database secrets strictly to server environment variables.
- **Minimal Android Permissions**: Only `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE`, and `POST_NOTIFICATIONS` are declared.
