/// <reference types="@cloudflare/workers-types" />

import {
  applyDiceRoll,
  applyPieceMove,
  createInitialMatchState,
  forceTurnTimeout,
  RULE_PRESETS,
} from '../../src/engine/ludoEngine';
import { getSeatsForPlayerCount } from '../../src/engine/boardTopology';
import type { MatchState, RuleConfig } from '../../src/engine/types';
import type {
  ClientToServerMessage,
  RoomSeatSummary,
  RoomSnapshot,
  ServerToClientMessage,
} from '../../src/shared/protocol';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface StoredRoomState {
  roomCode: string;
  hostClientId: string;
  boardThemeId: string;
  maxPlayers: 2 | 3 | 4;
  rules: RuleConfig;
  status: 'lobby' | 'playing' | 'finished';
  seats: RoomSeatSummary[];
  matchState: MatchState | null;
  turnDeadlineAt: number | null;
}

interface QueueEntry {
  clientId: string;
  preferredPlayers: 2 | 4;
  ws: WebSocket;
  joinedAt: number;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export class LudoRoomDO {
  private state: DurableObjectState;
  private env: Env;
  private room: StoredRoomState | null = null;
  private cachedRoomCode: string | null = null;
  private clientSessions = new Map<WebSocket, { clientId: string; roomCode: string }>();
  private socketRateLimits = new Map<WebSocket, { count: number; resetAt: number }>();
  private matchmakingQueue: QueueEntry[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private async loadState(): Promise<StoredRoomState | null> {
    if (this.room) return this.room;
    const stored = await this.state.storage.get<StoredRoomState>('room_data');
    if (stored) {
      this.room = stored;
    }
    return this.room;
  }

  private async saveState(): Promise<void> {
    if (this.room) {
      await this.state.storage.put('room_data', this.room);
    }
  }

  private async getRoomCode(): Promise<string> {
    if (this.cachedRoomCode) return this.cachedRoomCode;
    const stored = await this.state.storage.get<string>('room_code');
    if (stored) {
      this.cachedRoomCode = stored;
      return stored;
    }
    return generateRoomCode();
  }

  public async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const paramCode = url.searchParams.get('roomCode')?.trim().toUpperCase();
    if (paramCode) {
      this.cachedRoomCode = paramCode;
      await this.state.storage.put('room_code', paramCode);
    }

    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      // Use Cloudflare WebSocket Hibernation API
      this.state.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname === '/snapshot') {
      const room = await this.loadState();
      return Response.json({ ok: true, room });
    }

    return new Response('Not found', { status: 404 });
  }

  private checkSocketRateLimit(ws: WebSocket): boolean {
    const now = Date.now();
    const bucket = this.socketRateLimits.get(ws);
    if (!bucket || now > bucket.resetAt) {
      this.socketRateLimits.set(ws, { count: 1, resetAt: now + 3000 });
      return true;
    }
    if (bucket.count >= 25) {
      return false;
    }
    bucket.count += 1;
    return true;
  }

  public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const rawStr = typeof message === 'string' ? message : new TextDecoder().decode(message);
      if (rawStr.length > 4096) {
        this.sendToSocket(ws, {
          type: 'error',
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Payload exceeds maximum allowed size.',
        });
        return;
      }
      if (!this.checkSocketRateLimit(ws)) {
        this.sendToSocket(ws, {
          type: 'error',
          code: 'RATE_LIMITED',
          message: 'Too many actions. Please slow down.',
        });
        return;
      }

      const msg = JSON.parse(rawStr) as ClientToServerMessage;
      await this.handleClientMessage(ws, msg);
    } catch (err) {
      this.sendToSocket(ws, {
        type: 'error',
        code: 'BAD_PAYLOAD',
        message: err instanceof Error ? err.message : 'Invalid JSON payload',
      });
    }
  }

  public async webSocketClose(ws: WebSocket): Promise<void> {
    this.socketRateLimits.delete(ws);
    this.matchmakingQueue = this.matchmakingQueue.filter((q) => q.ws !== ws);

    const session = this.clientSessions.get(ws);
    if (!session || !this.room) return;

    this.clientSessions.delete(ws);
    const seat = this.room.seats.find((s) => s.clientId === session.clientId);
    if (seat) {
      seat.connected = false;
      this.broadcast({
        type: 'room:snapshot',
        room: this.createSnapshot(),
      });
      await this.saveState();
    }
  }

  public webSocketError(ws: WebSocket, error: unknown): void {
    console.error('Durable Object WebSocket error:', error);
    this.socketRateLimits.delete(ws);
    this.matchmakingQueue = this.matchmakingQueue.filter((q) => q.ws !== ws);
    ws.close(1011, 'Internal Error');
  }

  public async alarm(): Promise<void> {
    const room = await this.loadState();
    if (!room || room.status !== 'playing' || !room.matchState) return;

    if (room.turnDeadlineAt && Date.now() >= room.turnDeadlineAt) {
      room.matchState = forceTurnTimeout(room.matchState);
      room.turnDeadlineAt = Date.now() + 25000;
      await this.state.storage.setAlarm(Date.now() + 25000);

      this.broadcast({
        type: 'room:snapshot',
        room: this.createSnapshot(),
      });
      await this.saveState();
    }
  }

  private async handleClientMessage(ws: WebSocket, msg: ClientToServerMessage): Promise<void> {
    const room = await this.loadState();

    switch (msg.type) {
      case 'queue:join': {
        this.matchmakingQueue = this.matchmakingQueue.filter(
          (q) => q.clientId !== msg.clientId && q.ws !== ws,
        );
        this.matchmakingQueue.push({
          clientId: msg.clientId,
          preferredPlayers: msg.preferredPlayers,
          ws,
          joinedAt: Date.now(),
        });

        const matchingBucket = this.matchmakingQueue.filter(
          (q) => q.preferredPlayers === msg.preferredPlayers,
        );

        if (matchingBucket.length >= msg.preferredPlayers) {
          const selected = matchingBucket.slice(0, msg.preferredPlayers);
          const selectedIds = new Set(selected.map((s) => s.clientId));
          this.matchmakingQueue = this.matchmakingQueue.filter((q) => !selectedIds.has(q.clientId));

          const matchedCode = generateRoomCode();
          selected.forEach((entry, idx) => {
            this.sendToSocket(entry.ws, {
              type: 'queue:matched',
              roomCode: matchedCode,
              isHost: idx === 0,
              preferredPlayers: msg.preferredPlayers,
            });
          });
        } else {
          matchingBucket.forEach((entry, idx) => {
            this.sendToSocket(entry.ws, {
              type: 'queue:status',
              inQueue: true,
              position: idx + 1,
              preferredPlayers: msg.preferredPlayers,
              queuedCount: matchingBucket.length,
            });
          });
        }
        break;
      }

      case 'queue:leave': {
        this.matchmakingQueue = this.matchmakingQueue.filter(
          (q) => q.clientId !== msg.clientId && q.ws !== ws,
        );
        this.sendToSocket(ws, {
          type: 'queue:status',
          inQueue: false,
          position: 0,
          preferredPlayers: 2,
          queuedCount: 0,
        });
        break;
      }

      case 'room:create': {
        if (room && room.status !== 'finished' && room.seats.some((s) => s.clientId !== null && s.connected)) {
          // If the same host is re-creating, return existing snapshot; otherwise reject collision
          if (room.hostClientId === msg.clientId) {
            this.clientSessions.set(ws, { clientId: msg.clientId, roomCode: room.roomCode });
            this.sendToSocket(ws, { type: 'room:snapshot', room: this.createSnapshot() });
            return;
          }
          this.sendToSocket(ws, {
            type: 'error',
            code: 'ROOM_EXISTS',
            message: 'Room code already in use. Please try hosting again.',
          });
          return;
        }

        const resolvedCode = (msg.roomCode || (await this.getRoomCode())).trim().toUpperCase();
        await this.state.storage.put('room_code', resolvedCode);
        this.cachedRoomCode = resolvedCode;

        const defaultSeats = getSeatsForPlayerCount(msg.maxPlayers);
        const hostName = (msg.playerName || '').trim().slice(0, 24) || 'Host Commander';
        const hostSeat: RoomSeatSummary = {
          seatIndex: 0,
          color: defaultSeats[0],
          clientId: msg.clientId,
          userId: msg.userId,
          name: hostName,
          characterId: msg.characterId,
          outfitId: msg.outfitId,
          skinId: msg.skinId,
          ready: true,
          connected: true,
          isHost: true,
        };

        const otherSeats: RoomSeatSummary[] = defaultSeats.slice(1).map((color, idx) => ({
          seatIndex: idx + 1,
          color,
          clientId: null,
          name: `Slot ${idx + 2}`,
          characterId: 'ignis-drake',
          outfitId: 'royal-guard',
          skinId: 'classic',
          ready: false,
          connected: false,
          isHost: false,
        }));

        this.room = {
          roomCode: resolvedCode,
          hostClientId: msg.clientId,
          boardThemeId: msg.boardThemeId,
          maxPlayers: msg.maxPlayers,
          rules: msg.rules || RULE_PRESETS.classic_kingdom,
          status: 'lobby',
          seats: [hostSeat, ...otherSeats],
          matchState: null,
          turnDeadlineAt: null,
        };

        this.clientSessions.set(ws, { clientId: msg.clientId, roomCode: this.room.roomCode });
        await this.saveState();

        this.sendToSocket(ws, {
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }

      case 'room:join': {
        if (!room) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found. Double-check the 6-character code.',
          });
          return;
        }

        if (room.status !== 'lobby') {
          const existingSeat = room.seats.find((s) => s.clientId === msg.clientId);
          if (!existingSeat) {
            this.sendToSocket(ws, {
              type: 'error',
              code: 'MATCH_IN_PROGRESS',
              message: 'This match has already started.',
            });
            return;
          }
        }

        let seat = room.seats.find((s) => s.clientId === msg.clientId);
        if (!seat) {
          const emptySeat = room.seats.find((s) => s.clientId === null);
          if (!emptySeat) {
            this.sendToSocket(ws, {
              type: 'error',
              code: 'ROOM_FULL',
              message: 'This royal room is already full.',
            });
            return;
          }
          emptySeat.clientId = msg.clientId;
          emptySeat.userId = msg.userId;
          let chosenName =
            (msg.playerName || '').trim().slice(0, 24) ||
            `Challenger #${room.seats.filter((s) => s.clientId !== null).length + 1}`;
          const existingNames = room.seats
            .filter((s) => s.clientId !== null && s !== emptySeat)
            .map((s) => s.name.trim().toLowerCase());
          if (existingNames.includes(chosenName.toLowerCase())) {
            chosenName = `${chosenName} (${room.seats.filter((s) => s.clientId !== null).length + 1})`;
          }
          emptySeat.name = chosenName;
          emptySeat.characterId = msg.characterId;
          emptySeat.outfitId = msg.outfitId;
          emptySeat.skinId = msg.skinId;
          emptySeat.connected = true;
          seat = emptySeat;
        } else {
          seat.connected = true;
        }

        this.clientSessions.set(ws, { clientId: msg.clientId, roomCode: room.roomCode });
        await this.saveState();

        this.broadcast({
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }

      case 'room:update_profile': {
        if (!room || room.status !== 'lobby') return;
        const seat = room.seats.find((s) => s.clientId === msg.clientId);
        if (!seat) return;

        let chosenName = (msg.playerName || '').trim().slice(0, 24) || seat.name;
        const existingNames = room.seats
          .filter((s) => s.clientId !== null && s !== seat)
          .map((s) => s.name.trim().toLowerCase());
        if (existingNames.includes(chosenName.toLowerCase())) {
          chosenName = `${chosenName} (${seat.seatIndex + 1})`;
        }

        seat.name = chosenName;
        seat.characterId = msg.characterId;
        seat.outfitId = msg.outfitId;
        seat.skinId = msg.skinId;

        await this.saveState();
        this.broadcast({
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }

      case 'room:ready': {
        if (!room) return;
        const seat = room.seats.find((s) => s.clientId === msg.clientId);
        if (seat) {
          seat.ready = msg.ready;
          await this.saveState();
          this.broadcast({
            type: 'room:snapshot',
            room: this.createSnapshot(),
          });
        }
        break;
      }

      case 'room:leave': {
        if (!room) return;
        const seat = room.seats.find((s) => s.clientId === msg.clientId);
        if (!seat) return;

        this.clientSessions.delete(ws);

        if (room.status === 'lobby') {
          seat.clientId = null;
          seat.userId = undefined;
          seat.name = `Slot ${seat.seatIndex + 1}`;
          seat.ready = false;
          seat.connected = false;
          seat.isHost = false;

          const remaining = room.seats.filter((s) => s.clientId !== null);
          if (remaining.length === 0) {
            this.room = null;
            await this.state.storage.delete('room_data');
            return;
          }

          if (room.hostClientId === msg.clientId) {
            room.hostClientId = remaining[0].clientId!;
            remaining[0].isHost = true;
            remaining[0].ready = true;
          }
        } else {
          seat.connected = false;
        }

        await this.saveState();
        this.broadcast({
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }

      case 'room:start': {
        if (!room || room.status !== 'lobby') return;
        if (room.hostClientId !== msg.clientId) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'NOT_HOST',
            message: 'Only the room host can commence the match.',
          });
          return;
        }

        const occupiedSeats = room.seats.filter((s) => s.clientId !== null);
        if (occupiedSeats.length < 2) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'NEED_PLAYERS',
            message: 'At least 2 players must join before starting.',
          });
          return;
        }

        const seatSetup = occupiedSeats.map((s) => ({
          color: s.color,
          name: s.name,
          type: 'human' as const,
          characterId: s.characterId,
          outfitId: s.outfitId,
          skinId: s.skinId,
          userId: s.userId,
        }));

        room.matchState = createInitialMatchState({
          matchId: `m_${Date.now()}_${room.roomCode}`,
          mode: 'online_private',
          boardThemeId: room.boardThemeId,
          rules: room.rules,
          seats: seatSetup,
        });

        room.status = 'playing';
        room.turnDeadlineAt = Date.now() + 25000;
        await this.state.storage.setAlarm(Date.now() + 25000);
        await this.saveState();

        this.broadcast({
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }

      case 'match:roll': {
        if (!room || room.status !== 'playing' || !room.matchState) return;
        const currentSeat = room.seats[room.matchState.activeSeatIndex];
        if (!currentSeat || currentSeat.clientId !== msg.clientId) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'NOT_YOUR_TURN',
            message: 'It is not your turn to roll the dice.',
          });
          return;
        }

        const diceValue = Math.floor(Math.random() * 6) + 1;
        room.matchState = applyDiceRoll(room.matchState, room.matchState.activeSeatIndex, diceValue);
        room.turnDeadlineAt = Date.now() + 25000;
        await this.state.storage.setAlarm(Date.now() + 25000);
        await this.saveState();

        this.broadcast({
          type: 'match:event',
          event: 'dice_rolled',
          diceValue,
          seatIndex: currentSeat.seatIndex,
          room: this.createSnapshot(),
        });
        break;
      }

      case 'match:move': {
        if (!room || room.status !== 'playing' || !room.matchState) return;
        const currentSeat = room.seats[room.matchState.activeSeatIndex];
        if (!currentSeat || currentSeat.clientId !== msg.clientId) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'NOT_YOUR_TURN',
            message: 'It is not your turn to make a move.',
          });
          return;
        }

        const moveResult = applyPieceMove(
          room.matchState,
          room.matchState.activeSeatIndex,
          msg.pieceIndex,
        );
        room.matchState = moveResult.nextState;

        if (room.matchState.phase === 'GAME_OVER') {
          room.status = 'finished';
          await this.state.storage.deleteAlarm();
          this.syncMatchToSupabase(room);
        } else {
          room.turnDeadlineAt = Date.now() + 25000;
          await this.state.storage.setAlarm(Date.now() + 25000);
        }

        await this.saveState();

        this.broadcast({
          type: 'match:event',
          event: 'piece_moved',
          seatIndex: currentSeat.seatIndex,
          room: this.createSnapshot(),
        });
        break;
      }

      case 'match:reconnect': {
        if (!room) {
          this.sendToSocket(ws, {
            type: 'error',
            code: 'ROOM_NOT_FOUND',
            message: 'Room not found for reconnection.',
          });
          return;
        }
        const seat = room.seats.find((s) => s.clientId === msg.clientId);
        if (seat) {
          seat.connected = true;
          this.clientSessions.set(ws, { clientId: msg.clientId, roomCode: room.roomCode });
          await this.saveState();
        }

        this.sendToSocket(ws, {
          type: 'room:snapshot',
          room: this.createSnapshot(),
        });
        break;
      }
    }
  }

  private createSnapshot(): RoomSnapshot {
    if (!this.room) {
      throw new Error('Cannot create snapshot of uninitialized room');
    }
    return {
      roomCode: this.room.roomCode,
      hostClientId: this.room.hostClientId,
      boardThemeId: this.room.boardThemeId,
      maxPlayers: this.room.maxPlayers,
      rules: this.room.rules,
      status: this.room.status,
      seats: this.room.seats,
      matchState: this.room.matchState,
      turnDeadlineAt: this.room.turnDeadlineAt,
    };
  }

  private sendToSocket(ws: WebSocket, msg: ServerToClientMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      // socket likely closed
    }
  }

  private broadcast(msg: ServerToClientMessage): void {
    const raw = JSON.stringify(msg);
    const sockets = this.state.getWebSockets();
    for (const ws of sockets) {
      try {
        ws.send(raw);
      } catch {
        // ignore individual socket failure
      }
    }
  }

  private async syncMatchToSupabase(room: StoredRoomState): Promise<void> {
    if (!this.env.SUPABASE_URL || !this.env.SUPABASE_SERVICE_ROLE_KEY || !room.matchState) {
      return;
    }
    try {
      const match = room.matchState;
      await fetch(`${this.env.SUPABASE_URL}/rest/v1/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          room_code: room.roomCode,
          mode: 'online_private',
          board_theme_id: room.boardThemeId,
          winner_color: match.winners[0] || 'red',
          player_count: match.players.length,
          duration_ms: Date.now() - (match.startedAt || Date.now()),
        }),
      });
    } catch (err) {
      console.warn('Failed to sync completed match to Supabase:', err);
    }
  }
}
