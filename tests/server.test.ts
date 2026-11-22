// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createAppServer } from '../server';
import type { ServerToClientMessage } from '../src/shared/protocol';

let baseUrl = '';
let wsUrl = '';
let closeServer: () => Promise<void>;
const dbPath = path.join(os.tmpdir(), `ck_ludo_srv_${Date.now()}.sqlite`);

function waitForMessage(
  ws: WebSocket,
  predicate: (msg: ServerToClientMessage) => boolean,
): Promise<ServerToClientMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket message timeout')), 4000);
    const handler = (raw: WebSocket.RawData) => {
      const parsed = JSON.parse(raw.toString()) as ServerToClientMessage;
      if (predicate(parsed)) {
        clearTimeout(timer);
        ws.off('message', handler);
        resolve(parsed);
      }
    };
    ws.on('message', handler);
  });
}

describe('Express + WebSocket Authoritative Multiplayer Server', () => {
  beforeAll(async () => {
    process.env.DATABASE_PROVIDER = 'sqlite';
    process.env.SQLITE_DB_PATH = dbPath;
    const { server, wss, db } = await createAppServer({ attachVite: false });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;

    closeServer = async () => {
      wss.clients.forEach((client) => client.terminate());
      wss.close();
      await new Promise<void>((res) => server.close(() => res()));
      await db.disconnect();
      if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
    };
  });

  afterAll(async () => {
    if (closeServer) await closeServer();
  });

  it('serves /api/health and /api/config/capabilities endpoints', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as { status: string; provider: string };
    expect(health.status).toBe('healthy');
    expect(health.provider).toBe('sqlite');

    const capRes = await fetch(`${baseUrl}/api/config/capabilities`);
    expect(capRes.status).toBe(200);
    const caps = (await capRes.json()) as { supportedProviders: Array<{ provider: string }> };
    expect(caps.supportedProviders.length).toBe(6);
    expect(caps.supportedProviders.map((p: { provider: string }) => p.provider)).not.toContain('firebase');
  });

  it('supports creating, joining, starting, rolling CSPRNG dice, and rejecting wrong-turn packets', async () => {
    const ws1 = new WebSocket(wsUrl);
    const ws2 = new WebSocket(wsUrl);
    await Promise.all([
      new Promise<void>((res) => ws1.once('open', () => res())),
      new Promise<void>((res) => ws2.once('open', () => res())),
    ]);

    const roomCreatedPromise = waitForMessage(ws1, (m) => m.type === 'room:snapshot');
    ws1.send(
      JSON.stringify({
        type: 'room:create',
        clientId: 'cli_host',
        playerName: 'Host',
        characterId: 'ignis-drake',
        outfitId: 'royal-guard',
        skinId: 'classic',
        boardThemeId: 'royal-enchanted-courtyard',
        maxPlayers: 2,
        rules: {
          extraTurnOnSix: true,
          extraTurnOnCapture: true,
          extraTurnOnHome: true,
          safeZonesEnabled: true,
          threeSixesForfeitTurn: true,
          exactHomeRequired: true,
          preset: 'classic_kingdom',
          turnTimerSeconds: 30,
        },
      }),
    );

    const createdMsg = await roomCreatedPromise;
    expect(createdMsg.type).toBe('room:snapshot');
    if (createdMsg.type !== 'room:snapshot') return;
    const roomCode = createdMsg.room.roomCode;
    expect(roomCode).toHaveLength(6);

    const joinedPromise = waitForMessage(
      ws2,
      (m) => m.type === 'room:snapshot' && m.room.seats.length === 2,
    );
    ws2.send(
      JSON.stringify({
        type: 'room:join',
        roomCode,
        clientId: 'cli_guest',
        playerName: 'Challenger',
        characterId: 'glacier-lupus',
        outfitId: 'royal-guard',
        skinId: 'classic',
      }),
    );
    await joinedPromise;

    const readyPromise = waitForMessage(
      ws1,
      (m) => m.type === 'room:snapshot' && m.room.seats.every((s) => s.ready),
    );
    ws2.send(
      JSON.stringify({
        type: 'room:ready',
        roomCode,
        clientId: 'cli_guest',
        ready: true,
      }),
    );
    await readyPromise;

    const startedPromise = waitForMessage(
      ws1,
      (m) => m.type === 'room:snapshot' && m.room.status === 'playing',
    );
    ws1.send(
      JSON.stringify({
        type: 'room:start',
        roomCode,
        clientId: 'cli_host',
      }),
    );
    const started = await startedPromise;
    expect(started.type).toBe('room:snapshot');

    // Out-of-turn roll from cli_guest must be rejected by server!
    const errPromise = waitForMessage(ws2, (m) => m.type === 'error');
    ws2.send(
      JSON.stringify({
        type: 'match:roll',
        roomCode,
        clientId: 'cli_guest',
        expectedSeq: 0,
      }),
    );
    const errMsg = await errPromise;
    expect(errMsg.type).toBe('error');

    // Valid roll by active host seat succeeds with CSPRNG dice 1..6
    const rolledPromise = waitForMessage(
      ws1,
      (m) => m.type === 'match:event' && m.event === 'dice_rolled',
    );
    ws1.send(
      JSON.stringify({
        type: 'match:roll',
        roomCode,
        clientId: 'cli_host',
        expectedSeq: 0,
      }),
    );
    const rolledMsg = await rolledPromise;
    if (rolledMsg.type === 'match:event') {
      expect(typeof rolledMsg.diceValue).toBe('number');
      expect(rolledMsg.diceValue).toBeGreaterThanOrEqual(1);
      expect(rolledMsg.diceValue).toBeLessThanOrEqual(6);
      expect([0, 1]).toContain(rolledMsg.room.matchState?.moveSeq);
    }

    ws1.close();
    ws2.close();
  });
});
