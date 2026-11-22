# Firestore Security Specification (Payload-First TDD)

## 1. Data Invariants

1. **Identity Isolation**: A user may only create or mutate `/users/{userId}` when `request.auth.uid == userId` and `incoming().uid == request.auth.uid`.
2. **PII Split**: Email and private preferences live exclusively in `/users/{userId}/private/{docId}`, readable and writable only by the owner (`request.auth.uid == userId`).
3. **Owner-Scoped Match History**: Every `/matches/{matchId}` document must have `ownerId == request.auth.uid`, immutable `createdAt == request.time`, and valid bounded numeric metrics (`playerCount` in `2..4`).
4. **Strict Key Allowlisting**: No shadow fields (`isAdmin`, `role`, `verified`) are allowed in any write payload (`hasAll` + `hasOnly`).
5. **No Blanket Collection Listing**: All `allow list` rules evaluate `resource.data` against `request.auth.uid`.

## 2. Dirty Dozen Attack Payloads (All Must Fail with PERMISSION_DENIED)

1. Unauthenticated write to `/users/user_1`.
2. Authenticated `user_A` creating `/users/user_B` with `uid: "user_A"`.
3. Authenticated `user_A` creating `/users/user_A` with shadow field `isAdmin: true`.
4. Authenticated `user_A` reading `/users/user_B/private/settings` (PII exfiltration).
5. Authenticated `user_A` writing `/users/user_A` with `displayName` > 48 chars.
6. Authenticated `user_A` writing `/users/user_A` with `wins: -5`.
7. Authenticated `user_A` creating `/matches/m1` with `ownerId: "user_B"`.
8. Authenticated `user_A` listing `/matches` without owner constraint (`user_B` docs).
9. Authenticated `user_A` updating `/matches/m1` to change `winnerColor` after creation (immutable outcome).
10. Authenticated `user_A` writing `/matches/m1` with `createdAt` forged to past timestamp (`!= request.time`).
11. Authenticated `user_A` injecting an oversized or invalid character document ID (`bad id with spaces!`).
12. Authenticated `user_A` writing to an undeclared collection `/admin_logs/log1`.
