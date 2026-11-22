# Threat Model

| Threat Vector | Mitigation Implemented | Residual Risk |
| :--- | :--- | :--- |
| Client-side dice manipulation | Authoritative server generates dice via `crypto.randomInt(1, 7)` and ignores client dice input | None for online rooms |
| Out-of-turn / replay packet injection | `handleMatchRoll` and `handleMatchMove` verify `activeSeat.clientId` and `expectedSeq === matchState.moveSeq` | Requires room code possession; private codes use 6-char unambiguous alphabet |
| WebSocket flood / DoS | Per-connection sliding-window rate limiter (`WS_RATE_LIMIT_PER_MIN`) | Edge WAF / Cloudflare recommended for public internet exposure |
| Firestore horizontal privilege escalation | `firestore.rules` enforces `isOwner(userId)` + strict PII subcollection `/private/account` | Requires Firebase Auth token integrity |
| SQL injection | All adapters bind parameters (`?` / `$1`) rather than interpolating strings | None on parameterized queries |
| Leaked DB / keystore secrets in client | Server DB credentials read strictly from `process.env`; Android keystores base64-decoded only during CI release step and deleted in `always()` | Depends on maintainer keeping `.env` untracked |
