# Authentication & Guest Mode (`src/services/firebase/firebaseClient.ts`)

## Zero-Friction Guest Mode
Players launch directly into Guest Mode backed by IndexedDB (`guest_local`), allowing offline Pass & Play, AI matches, customization, and achievement tracking without sign-up.

## Optional Firebase Google Sign-In
- Uses Firebase Web SDK (`signInWithPopup(auth, new GoogleAuthProvider())`) configured from `/firebase-applet-config.json` (or `VITE_FIREBASE_*` env overrides).
- On sign-in, local guest wins and matches played merge monotonically (`Math.max`) with Firestore `/users/{uid}`.
- Sensitive fields (`email`) are written exclusively to `/users/{uid}/private/account`, isolated by owner-only Firestore rules (`firestore.rules`).
- Users can sign out back to Guest Mode or permanently delete their Firebase Auth account from the **Profile** screen.
