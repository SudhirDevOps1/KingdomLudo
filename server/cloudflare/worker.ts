/// <reference types="@cloudflare/workers-types" />

import { LudoRoomDO } from './ludoRoomDO';

export { LudoRoomDO };

interface Env {
  LUDO_ROOM_DO: DurableObjectNamespace;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API Health check
    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'healthy',
        platform: 'cloudflare-workers',
        durableObjects: true,
        uptime: 'serverless-edge',
      });
    }

    // Guest Token generation endpoint
    if (url.pathname === '/api/guest/session') {
      const guestId = `gst_${crypto.randomUUID()}`;
      const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
      return Response.json({
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

      const roomCode = (url.searchParams.get('roomCode') || 'LOBBY').toUpperCase();
      const doId = env.LUDO_ROOM_DO.idFromName(roomCode);
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
