/// <reference types="@cloudflare/workers-types" />

import { createAltchaChallenge, verifyAltchaPayload } from './altcha';
import { LudoRoomDO } from './ludoRoomDO';

export { LudoRoomDO };

interface Env {
  LUDO_ROOM_DO: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ALTCHA_HMAC_KEY?: string;
}

// Lightweight per-isolate IP rate limiter to prevent abuse & unnecessary DO wakeups
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function checkEdgeRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
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

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content-Security-Policy: tighten client-side execution surface
  // - default-src 'self': only same-origin resources by default
  // - script-src 'self': no inline scripts, no eval (Vite bundles are src-only)
  // - connect-src: allow Supabase, Cloudflare Workers WS, and Google STUN
  // - style-src 'unsafe-inline': Tailwind/CSS-in-JS needs inline styles
  // - img-src: DiceBear SVG data URIs + same origin
  // - worker-src 'self' blob:: Vite service worker needs blob:
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://api.dicebear.com",
    "font-src 'self' data:",
    "connect-src 'self' wss: https://*.supabase.co https://*.supabase.in https://*.workers.dev stun:stun.l.google.com:19302",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonWithHeaders(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Strict per-IP rate limit on API & WebSocket upgrade endpoints (30 requests per 60s)
    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') {
      if (!checkEdgeRateLimit(clientIp, 30, 60_000)) {
        return jsonWithHeaders(
          { error: 'Too many requests. Please slow down and try again shortly.' },
          429,
        );
      }
    }

    // Minimal public health check (no internal infra details exposed)
    if (url.pathname === '/api/health') {
      return jsonWithHeaders({ status: 'ok' });
    }

    // ALTCHA Proof-of-Work Challenge endpoint
    if (url.pathname === '/api/altcha/challenge' && request.method === 'GET') {
      const challenge = await createAltchaChallenge(env.ALTCHA_HMAC_KEY);
      return jsonWithHeaders(challenge);
    }

    // ALTCHA Verification endpoint
    if (url.pathname === '/api/altcha/verify' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { payload?: string };
        const result = await verifyAltchaPayload(body.payload || '', env.ALTCHA_HMAC_KEY);
        return jsonWithHeaders({ ok: result.valid, reason: result.reason }, result.valid ? 200 : 403);
      } catch {
        return jsonWithHeaders({ ok: false, reason: 'Invalid request body' }, 400);
      }
    }

    // Sanitized Runtime Capabilities endpoint
    if (url.pathname === '/api/config/capabilities') {
      return jsonWithHeaders({
        activeProvider: {
          provider: 'edge-multiplayer',
          engineKind: 'realtime',
          notes: 'Authoritative WebSocket rooms active.',
        },
        supportedProviders: [
          {
            provider: 'edge-multiplayer',
            engineKind: 'realtime',
            notes: 'Real-time authoritative multiplayer rooms.',
          },
          {
            provider: 'cloud-sync',
            engineKind: 'auth',
            notes: 'Optional cloud profile & 30-day match sync.',
          },
        ],
      });
    }

    // Guest Token generation endpoint (POST + ALTCHA protected)
    if (url.pathname === '/api/guest/session') {
      if (request.method !== 'POST') {
        return jsonWithHeaders({ error: 'Method not allowed' }, 405);
      }
      try {
        const body = (await request.json()) as { altcha?: string };
        const check = await verifyAltchaPayload(body.altcha || '', env.ALTCHA_HMAC_KEY);
        if (!check.valid) {
          return jsonWithHeaders({ error: check.reason || 'Human verification required' }, 403);
        }
      } catch {
        return jsonWithHeaders({ error: 'ALTCHA verification payload required' }, 400);
      }

      const guestId = `gst_${crypto.randomUUID()}`;
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      return jsonWithHeaders({
        guestId,
        token,
        createdAt: Date.now(),
        expiresAt,
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

    // Fallback to static Cloudflare Pages / assets with security headers
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      return withSecurityHeaders(assetResponse);
    }

    return new Response('Not found', { status: 404 });
  },
};
