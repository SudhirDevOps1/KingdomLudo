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

export class LudoRoomDO {
  private state: DurableObjectState;
  private env: Env;
  private room: StoredRoomState | null = null;
  private clientSessions = new Map<WebSocket, { clientId: string; roomCode: string }>();

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

  public async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

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

  public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const rawStr = typeof message === 'string' ? message : new TextDecoder().decode(message);
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
    let room = await this.loadState();

    switch (msg.type) {
      case 'room:create': {
        const defaultSeats = getSeatsForPlayerCount(msg.maxPlayers);
        const hostSeat: RoomSeatSummary = {
          seatIndex: 0,
          color: defaultSeats[0],
          clientId: msg.clientId,
          userId: msg.userId,
          name: msg.playerName,
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
          roomCode: this.state.id.toString().slice(0, 6).toUpperCase(),
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
            message: 'Room not initialized.',
          });
          return;
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
          let chosenName = (msg.playerName || '').trim().slice(0, 24) || `Challenger #${room.seats.filter((s) => s.clientId !== null).length + 1}`;
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

        const seatSetup = room.seats
          .filter((s) => s.clientId !== null)
          .map((s) => ({
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
        if (currentSeat.clientId !== msg.clientId) {
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
        if (currentSeat.clientId !== msg.clientId) {
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
