# Android Permissions Audit (`android/app/src/main/AndroidManifest.xml`)

Only minimal permissions strictly necessary for multiplayer connectivity, tactile feedback, and optional turn alerts are declared:

| Permission | Purpose |
| :--- | :--- |
| `android.permission.INTERNET` | Optional online multiplayer WebSockets and Supabase cloud sync |
| `android.permission.ACCESS_NETWORK_STATE` | Detect offline vs online transitions cleanly |
| `android.permission.VIBRATE` | Haptic feedback on dice rolls and captures (`@capacitor/haptics`) |
| `android.permission.POST_NOTIFICATIONS` | Optional turn/room notifications on Android 13+ |

Explicitly omitted: Camera, Microphone, Contacts, Precise/Coarse Location, External Storage, Phone State. `android:allowBackup="false"` and `android:usesCleartextTraffic="false"` harden release builds.
