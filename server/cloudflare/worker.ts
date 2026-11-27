/// <reference types="@cloudflare/workers-types" />

import { LudoRoomDO } from './ludoRoomDO';

export { LudoRoomDO };

interface Env {
  LUDO_ROOM_DO: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

// Lightweight per-isolate IP rate limiter to prevent abuse & unnecessary DO wakeups
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  // Periodic cleanup if map grows
  if (ipBuckets.size > 2000) {
    for (const [key, entry] of ipBuckets.entries()) {
      if (now > entry.resetAt) ipBuckets.delete(key);
    }
  }
  const existing = ipBuckets.get(ip);
  if (!existing || now > existing.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) {
    return false;
  }
  existing.count += 1;
  return true;
}

function jsonWithHeaders(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Rate-limit API & WebSocket upgrade endpoints (40 requests per 60s per IP)
    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') {
      if (!checkEdgeRateLimit(clientIp, 40, 60_000)) {
        return jsonWithHeaders(
          { error: 'Too many requests. Please slow down and try again shortly.' },
          429,
        );
      }
    }

    // API Health check
    if (url.pathname === '/api/health') {
      return jsonWithHeaders({
        status: 'healthy',
        platform: 'cloudflare-workers',
        durableObjects: true,
        uptime: 'serverless-edge',
      });
    }

    // Database / Runtime capabilities endpoint
    if (url.pathname === '/api/config/capabilities') {
      return jsonWithHeaders({
        activeProvider: {
          provider: 'cloudflare-durable-objects',
          engineKind: 'edge-sqlite',
          notes: 'Authoritative WebSocket rooms backed by Cloudflare Durable Objects.',
        },
        supportedProviders: [
          {
            provider: 'cloudflare-durable-objects',
            engineKind: 'edge-sqlite',
            notes: 'Zero-cold-start multiplayer rooms & turn alarms at the Cloudflare edge.',
          },
          {
            provider: 'supabase',
            engineKind: 'postgres',
            notes: 'Optional cloud auth & match history persistence.',
          },
        ],
      });
    }

    // Guest Token generation endpoint
    if (url.pathname === '/api/guest/session') {
      const guestId = `gst_${crypto.randomUUID()}`;
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      return jsonWithHeaders({
        guestId,
        token,
        createdAt: Date.now(),
      });
    }

    // WebSocket multiplayer gateway
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket Upgrade request', { status: 426 });
      }

      const rawCode = (url.searchParams.get('roomCode') || '').trim().toUpperCase();
      if (!rawCode || (rawCode !== 'QUEUE' && !/^[A-Z0-9]{4,12}$/.test(rawCode))) {
        return new Response('Valid roomCode query parameter is required.', { status: 400 });
      }

      const doId = env.LUDO_ROOM_DO.idFromName(rawCode);
      const roomStub = env.LUDO_ROOM_DO.get(doId);

      return roomStub.fetch(request);
    }

    // Fallback to static Cloudflare Pages / assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};
