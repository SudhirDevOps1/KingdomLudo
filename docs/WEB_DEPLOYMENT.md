# Web & Full-Stack Deployment Guide

## Option A — Full-Stack Node.js Server (Express + WebSockets + SPA)
Suitable for Render, Fly.io, Railway, or VPS:
1. Build frontend bundle: `npm run build`
2. Set production env vars (`PORT=3000`, `NODE_ENV=production`, `DATABASE_PROVIDER=...`).
3. Start server: `npm start` (`NODE_ENV=production tsx server.ts`).

## Option B — Static PWA Frontend (Cloudflare Pages) + Remote Game Server
1. Deploy `dist/` to Cloudflare Pages via `.github/workflows/web-deploy.yml`.
2. Set `VITE_WS_URL=wss://your-game-server.example.com/ws` as a repository variable so the static frontend connects to your hosted Express/WS server.
