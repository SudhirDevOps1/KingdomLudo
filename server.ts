import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { createConfiguredDatabaseProvider, PROVIDER_MATRIX } from './server/backend/providerFactory';
import { AuthoritativeGameServer } from './server/gameServer';

export async function createAppServer(options?: { attachVite?: boolean; port?: number }) {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  const { provider: db, validation } = await createConfiguredDatabaseProvider(process.env);

  app.get('/api/health', async (_req, res) => {
    const dbHealth = await db.healthCheck();
    res.json({
      status: dbHealth.ok ? 'healthy' : 'degraded',
      provider: db.capabilities.provider,
      dbHealth,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get('/api/config/capabilities', (_req, res) => {
    res.json({
      activeProvider: db.capabilities,
      validation: {
        valid: validation.valid,
        selectedProvider: validation.provider,
        missingVars: validation.missingVars,
        warnings: validation.warnings,
      },
      supportedProviders: PROVIDER_MATRIX,
    });
  });

  app.get('/api/matches', async (_req, res) => {
    try {
      const result = await db.paginate<{
        match_id: string;
        room_code: string | null;
        mode: string;
        board_theme_id: string;
        winner_color: string;
        player_count: number;
        duration_ms: number;
        created_at: number;
      }>(
        'SELECT match_id, room_code, mode, board_theme_id, winner_color, player_count, duration_ms, created_at FROM matches ORDER BY created_at DESC',
        [],
        { limit: 20, offset: 0 },
      );
      res.json({ matches: result.rows });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Database query failed' });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    const pathname = (request.url ?? '').split('?')[0];
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  const rateLimit = Number(process.env.WS_RATE_LIMIT_PER_MIN || 120);
  const gameServer = new AuthoritativeGameServer(wss, db, rateLimit);

  app.get('/api/rooms/:code', (req, res) => {
    const room = gameServer.getRoomSummary(req.params.code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({ room });
  });

  app.get('/api/server-stats', (_req, res) => {
    res.json(gameServer.getPublicStats());
  });

  const isProd = process.env.NODE_ENV === 'production';
  const attachVite = options?.attachVite ?? !isProd;

  if (attachVite) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: {
          server,
          path: '/__vite_hmr',
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (isProd) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return { app, server, wss, db, gameServer };
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isMain) {
  const port = Number(process.env.PORT || 3000);
  createAppServer()
    .then(({ server }) => {
      server.listen(port, '0.0.0.0', () => {
        console.log(`\n👑 KingdomLudo v0.1.0-alpha.0 server is ready!`);
        console.log(`  ➜ Local:   http://localhost:${port}/`);
        console.log(`  ➜ Network: http://127.0.0.1:${port}/\n`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
