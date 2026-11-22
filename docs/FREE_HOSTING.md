# Free Hosting Blueprint & Limitations

| Layer | Free Option | Limits to Watch |
| :--- | :--- | :--- |
| **Static Web & PWA** | Cloudflare Pages | Unlimited bandwidth, 500 builds/month; requires external `VITE_WS_URL` for multiplayer |
| **Express + WebSocket Server** | Render Free / Fly.io / Railway Hobby | Free instances sleep after inactivity (~15–30s cold wake on initial WS connect) |
| **Server Database** | SQLite (`./data/*.sqlite`) / Turso / Neon / Supabase | Ephemeral local disks reset SQLite on redeploy; use Turso (5 GB) or Neon (0.5 GB) for persistent remote SQL |
| **Auth & Cloud Sync** | Firebase Spark Plan | 50k reads / 20k writes / 1 GB Firestore per day; Google Auth free for 50k MAU |
| **CI/CD & Releases** | GitHub Actions (Public Repo) | Unlimited minutes on public repos; 2,000 mins/month on private repos |
