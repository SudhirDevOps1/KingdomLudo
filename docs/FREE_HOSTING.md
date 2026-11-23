# 💸 Free Hosting Blueprint & Operational Limits

KingdomLudo is architected to operate on generous, zero-cost **Free-Tier infrastructure** without requiring credit cards or expensive cloud resources.

---

## 🏗️ Free-Tier Architecture Blueprint

| Architecture Layer | Recommended Free Provider | Free Tier Limits to Watch |
| :--- | :--- | :--- |
| **Static Web & PWA** | **Cloudflare Pages** | Unlimited bandwidth, 500 builds/month, global anycast CDN caching. |
| **Edge Multiplayer & Room State** | **Cloudflare Workers + Durable Objects** | 100,000 requests/day, sub-10ms edge latency. |
| **Standalone Node.js / WS Server** | **Render / Fly.io / Railway / Koyeb** | Free instances spin down after inactivity (15–30s cold wake on initial connect). Use WebSocket keep-alives or Cloudflare Workers DO. |
| **Cloud Database (PostgreSQL)** | **Supabase Free Tier** | 500 MB persistent PostgreSQL storage, 2 active projects, unlimited API requests, automatic daily backups. |
| **Auth & Identity** | **Supabase Auth** | 50,000 Monthly Active Users (MAU), Email/Password, Magic Links, Social OAuth providers. |
| **CI/CD & Mobile Compilation** | **GitHub Actions** | Unlimited runner minutes on public repositories; 2,000 minutes/month on private repositories. |

---

## 💡 Best Practices for Zero-Cost Production

1. **Client Static Assets**: Cloudflare Pages serves all Three.js 3D models, textures, audio, and PWA assets for free with zero egress bandwidth charges.
2. **Local Fallback**: If cloud providers undergo maintenance, KingdomLudo's built-in `node:sqlite` and client IndexedDB ensure players can continue playing uninterrupted.
3. **Connection Pooling**: Use Supabase's transaction pooler (port 6543) so serverless workers and Node.js servers don't exhaust PostgreSQL connection limits.
