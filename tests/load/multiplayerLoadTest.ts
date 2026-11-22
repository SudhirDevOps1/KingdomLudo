import { WebSocket } from 'ws';

interface LoadTestOptions {
  serverUrl: string;
  totalRooms: number;
  playersPerRoom: 2 | 4;
}

interface LatencyMetric {
  startMs: number;
  endMs: number;
  durationMs: number;
}

export async function runMultiplayerLoadSimulation(
  options: LoadTestOptions = {
    serverUrl: 'ws://127.0.0.1:3000/ws',
    totalRooms: 10,
    playersPerRoom: 2,
  },
): Promise<{
  roomsCreated: number;
  totalConnections: number;
  messagesSent: number;
  messagesReceived: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  successRate: number;
}> {
  const { serverUrl, totalRooms, playersPerRoom } = options;
  const latencies: number[] = [];
  let totalConnections = 0;
  let messagesSent = 0;
  let messagesReceived = 0;
  let successfulMatches = 0;

  const roomCodes: string[] = [];

  // Phase 1: Connect host clients and create rooms
  for (let i = 0; i < totalRooms; i++) {
    const ws = new WebSocket(serverUrl);
    totalConnections++;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, 3000);

      ws.on('open', () => {
        const start = performance.now();
        messagesSent++;
        ws.send(
          JSON.stringify({
            type: 'room:create',
            clientId: `load_host_${i}`,
            playerName: `Host Commander #${i}`,
            characterId: 'ignis-drake',
            outfitId: 'royal-guard',
            skinId: 'classic',
            boardThemeId: 'royal-enchanted-courtyard',
            maxPlayers: playersPerRoom,
            rules: {
              safeZonesEnabled: true,
              extraTurnOnSix: true,
              extraTurnOnCapture: true,
              cutPenaltyToYard: true,
              mustRollSixToStart: true,
              exactHomeEntryOnly: true,
            },
          }),
        );

        ws.on('message', (raw) => {
          messagesReceived++;
          const duration = performance.now() - start;
          latencies.push(duration);
          try {
            const data = JSON.parse(raw.toString());
            if ((data.type === 'room:snapshot' || data.type === 'room:update') && data.room?.roomCode) {
              roomCodes.push(data.room.roomCode);
              successfulMatches++;
            }
          } catch {
            // ignore
          }
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  latencies.sort((a, b) => a - b);
  const avgLatencyMs =
    latencies.length > 0
      ? latencies.reduce((acc, v) => acc + v, 0) / latencies.length
      : 0;
  const p95Idx = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Idx] ?? avgLatencyMs;
  const successRate = totalRooms > 0 ? (successfulMatches / totalRooms) * 100 : 100;

  return {
    roomsCreated: roomCodes.length,
    totalConnections,
    messagesSent,
    messagesReceived,
    avgLatencyMs: Number(avgLatencyMs.toFixed(2)),
    p95LatencyMs: Number(p95LatencyMs.toFixed(2)),
    successRate: Number(successRate.toFixed(1)),
  };
}

// Allow direct execution from CLI
const isDirectCli = process.argv[1] && process.argv[1].includes('multiplayerLoadTest');
if (isDirectCli) {
  console.log('🚀 Launching KingdomLudo Multiplayer Load Simulation...');
  runMultiplayerLoadSimulation({
    serverUrl: process.env.LOAD_TEST_URL || 'ws://127.0.0.1:3000/ws',
    totalRooms: 10,
    playersPerRoom: 2,
  })
    .then((result) => {
      console.log('\n📊 Load Test Results:');
      console.log(`  • Rooms Created:      ${result.roomsCreated}`);
      console.log(`  • Total Connections:  ${result.totalConnections}`);
      console.log(`  • Messages Processed: ${result.messagesSent + result.messagesReceived}`);
      console.log(`  • Average Latency:    ${result.avgLatencyMs} ms`);
      console.log(`  • p95 Latency:        ${result.p95LatencyMs} ms`);
      console.log(`  • Success Rate:       ${result.successRate} %\n`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Load simulation encountered an error:', err);
      process.exit(1);
    });
}
