import crypto from 'crypto';
import type { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { getSeatsForPlayerCount } from '../src/engine/boardTopology';
import {
  applyDiceRoll,
  applyPieceMove,
  createInitialMatchState,
  forceTurnTimeout,
  RULE_PRESETS,
} from '../src/engine/ludoEngine';
import type { MatchState, RuleConfig } from '../src/engine/types';
import type {
  ClientToServerMessage,
  RoomSeatSummary,
  RoomSnapshot,
  ServerToClientMessage,
} from '../src/shared/protocol';
import type { DatabaseProvider } from './backend/interfaces';

interface ManagedRoom {
  roomCode: string;
  hostClientId: string;
  boardThemeId: string;
  maxPlayers: 2 | 3 | 4;
  rules: RuleConfig;
  status: 'lobby' | 'playing' | 'finished';
  seats: RoomSeatSummary[];
  matchState: MatchState | null;
  turnDeadlineAt: number | null;
  turnTimerHandle: ReturnType<typeof setTimeout> | null;
}

interface QueueEntry {
  clientId: string;
  playerName: string;
  userId?: string;
  characterId: string;
  outfitId: string;
  skinId: string;
  preferredPlayers: 2 | 4;
  joinedAt: number;
}

interface ClientConn {
  ws: WebSocket;
  clientId: string | null;
  roomCode: string | null;
  msgCountWindow: number;
  windowStart: number;
}

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_ALPHABET[crypto.randomInt(0, INVITE_ALPHABET.length)];
  }
  return code;
}

function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^\w\s\-'.]/g, '').trim().slice(0, 32);
  return cleaned || 'Royal Player';
}

export class AuthoritativeGameServer {
  private readonly wss: WebSocketServer;
  private readonly db: DatabaseProvider;
  private readonly rooms = new Map<string, ManagedRoom>();
  private readonly connections = new Set<ClientConn>();
  private readonly clientSockets = new Map<string, WebSocket>();
  private readonly queue: QueueEntry[] = [];
  private readonly rateLimitPerMin: number;

  constructor(wss: WebSocketServer, db: DatabaseProvider, rateLimitPerMin = 120) {
    this.wss = wss;
    this.db = db;
    this.rateLimitPerMin = rateLimitPerMin;

    this.wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
      const conn: ClientConn = {
        ws,
        clientId: null,
        roomCode: null,
        msgCountWindow: 0,
        windowStart: Date.now(),
      };
      this.connections.add(conn);

      ws.on('message', (raw) => {
        this.handleRawMessage(conn, raw.toString());
      });

      ws.on('close', () => {
        this.handleDisconnect(conn);
      });
    });
  }

  public getRoomSummary(code: string): RoomSnapshot | null {
    const room = this.rooms.get(code.toUpperCase());
    return room ? this.toSnapshot(room) : null;
  }

  public getPublicStats(): { activeRooms: number; queuedPlayers: number } {
    return {
      activeRooms: this.rooms.size,
      queuedPlayers: this.queue.length,
    };
  }

  private toSnapshot(room: ManagedRoom): RoomSnapshot {
    return {
      roomCode: room.roomCode,
      hostClientId: room.hostClientId,
      boardThemeId: room.boardThemeId,
      maxPlayers: room.maxPlayers,
      rules: room.rules,
      status: room.status,
      seats: room.seats.map((s) => ({ ...s })),
      matchState: room.matchState,
      turnDeadlineAt: room.turnDeadlineAt,
    };
  }

  private send(ws: WebSocket, payload: ServerToClientMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.send(ws, { type: 'error', code, message });
  }

  private broadcastRoom(room: ManagedRoom, event?: ServerToClientMessage): void {
    const msg: ServerToClientMessage = event ?? {
      type: 'room:snapshot',
      room: this.toSnapshot(room),
    };
    for (const seat of room.seats) {
      if (!seat.clientId) continue;
      const sock = this.clientSockets.get(seat.clientId);
      if (sock) this.send(sock, msg);
    }
  }

  private handleRawMessage(conn: ClientConn, raw: string): void {
    const now = Date.now();
    if (now - conn.windowStart > 60000) {
      conn.windowStart = now;
      conn.msgCountWindow = 0;
    }
    conn.msgCountWindow += 1;
    if (conn.msgCountWindow > this.rateLimitPerMin) {
      this.sendError(conn.ws, 'RATE_LIMITED', 'Too many requests. Please slow down.');
      return;
    }

    let msg: ClientToServerMessage;
    try {
      msg = JSON.parse(raw) as ClientToServerMessage;
    } catch {
      this.sendError(conn.ws, 'BAD_JSON', 'Malformed JSON payload.');
      return;
    }

    if (!msg || typeof msg.type !== 'string' || !('clientId' in msg) || !msg.clientId) {
      this.sendError(conn.ws, 'INVALID_PAYLOAD', 'Missing clientId or message type.');
      return;
    }

    conn.clientId = msg.clientId;
    this.clientSockets.set(msg.clientId, conn.ws);

    try {
      switch (msg.type) {
        case 'room:create':
          this.handleCreateRoom(conn, msg);
          break;
        case 'room:update_profile':
          this.handleUpdateProfile(msg);
          break;
        case 'room:join':
          this.handleJoinRoom(conn, msg);
          break;
        case 'room:ready':
          this.handleReady(conn, msg);
          break;
        case 'room:start':
          this.handleStartRoom(conn, msg);
          break;
        case 'room:leave':
          this.handleLeaveRoom(conn, msg.roomCode, msg.clientId);
          break;
        case 'match:roll':
          this.handleMatchRoll(conn, msg);
          break;
        case 'match:move':
          this.handleMatchMove(conn, msg);
          break;
        case 'match:reconnect':
          this.handleReconnect(conn, msg.roomCode, msg.clientId);
          break;
        case 'queue:join':
          this.handleQueueJoin(conn, msg);
          break;
        case 'queue:leave':
          this.handleQueueLeave(msg.clientId);
          break;
        default:
          this.sendError(conn.ws, 'UNKNOWN_TYPE', 'Unsupported message type.');
      }
    } catch (err) {
      this.sendError(
        conn.ws,
        'SERVER_ERROR',
        err instanceof Error ? err.message : 'Unexpected server error',
      );
    }
  }

  private handleCreateRoom(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'room:create' }>,
  ): void {
    const requested = msg.roomCode?.trim().toUpperCase();
    let roomCode = requested && /^[A-Z0-9]{4,12}$/.test(requested) && !this.rooms.has(requested)
      ? requested
      : generateInviteCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateInviteCode();
    }

    const colors = getSeatsForPlayerCount(msg.maxPlayers);
    const room: ManagedRoom = {
      roomCode,
      hostClientId: msg.clientId,
      boardThemeId: msg.boardThemeId || 'royal-enchanted-courtyard',
      maxPlayers: msg.maxPlayers,
      rules: msg.rules || RULE_PRESETS.classic_kingdom,
      status: 'lobby',
      seats: [
        {
          seatIndex: 0,
          color: colors[0],
          clientId: msg.clientId,
          userId: msg.userId,
          name: sanitizeName(msg.playerName),
          characterId: msg.characterId,
          outfitId: msg.outfitId,
          skinId: msg.skinId,
          ready: true,
          connected: true,
          isHost: true,
        },
      ],
      matchState: null,
      turnDeadlineAt: null,
      turnTimerHandle: null,
    };

    this.rooms.set(roomCode, room);
    conn.roomCode = roomCode;
    this.broadcastRoom(room);
  }

  private handleJoinRoom(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'room:join' }>,
  ): void {
    const code = msg.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      this.sendError(conn.ws, 'ROOM_NOT_FOUND', `Room "${code}" was not found.`);
      return;
    }

    const existingSeat = room.seats.find((s) => s.clientId === msg.clientId);
    if (existingSeat) {
      existingSeat.connected = true;
      conn.roomCode = code;
      this.broadcastRoom(room);
      return;
    }

    if (room.status !== 'lobby') {
      this.sendError(conn.ws, 'MATCH_IN_PROGRESS', 'This match has already started.');
      return;
    }

    if (room.seats.length >= room.maxPlayers) {
      this.sendError(conn.ws, 'ROOM_FULL', 'This room is already full.');
      return;
    }

    const colors = getSeatsForPlayerCount(room.maxPlayers);
    const seatIndex = room.seats.length;
    let chosenName = sanitizeName(msg.playerName) || `Challenger #${room.seats.length + 1}`;
    const existingNames = room.seats.map((s) => s.name.trim().toLowerCase());
    if (existingNames.includes(chosenName.toLowerCase())) {
      chosenName = `${chosenName} (${room.seats.length + 1})`;
    }

    room.seats.push({
      seatIndex,
      color: colors[seatIndex],
      clientId: msg.clientId,
      userId: msg.userId,
      name: chosenName,
      characterId: msg.characterId,
      outfitId: msg.outfitId,
      skinId: msg.skinId,
      ready: false,
      connected: true,
      isHost: false,
    });

    conn.roomCode = code;
    this.broadcastRoom(room);
  }

  private handleReady(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'room:ready' }>,
  ): void {
    const room = this.rooms.get(msg.roomCode.toUpperCase());
    if (!room) return;
    const seat = room.seats.find((s) => s.clientId === msg.clientId);
    if (!seat) return;
    seat.ready = msg.ready;
    this.broadcastRoom(room);
  }

  private handleUpdateProfile(
    msg: Extract<ClientToServerMessage, { type: 'room:update_profile' }>,
  ): void {
    const room = this.rooms.get(msg.roomCode.toUpperCase());
    if (!room || room.status !== 'lobby') return;
    const seat = room.seats.find((s) => s.clientId === msg.clientId);
    if (!seat) return;

    let chosenName = sanitizeName(msg.playerName);
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
    this.broadcastRoom(room);
  }

  private handleStartRoom(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'room:start' }>,
  ): void {
    const room = this.rooms.get(msg.roomCode.toUpperCase());
    if (!room) {
      this.sendError(conn.ws, 'ROOM_NOT_FOUND', 'Room not found.');
      return;
    }
    if (room.hostClientId !== msg.clientId) {
      this.sendError(conn.ws, 'NOT_HOST', 'Only the room host can start the match.');
      return;
    }
    if (room.seats.length < 2) {
      this.sendError(conn.ws, 'NEED_PLAYERS', 'At least 2 players must join before starting.');
      return;
    }
    if (!room.seats.every((s) => s.ready)) {
      this.sendError(conn.ws, 'NOT_READY', 'All seated players must be ready.');
      return;
    }

    this.startMatchInRoom(room, 'online_private');
  }

  private startMatchInRoom(room: ManagedRoom, mode: 'online_private' | 'online_public'): void {
    room.status = 'playing';
    room.matchState = createInitialMatchState({
      matchId: `online_${room.roomCode}_${Date.now()}`,
      mode,
      boardThemeId: room.boardThemeId,
      rules: room.rules,
      seats: room.seats.map((s) => ({
        color: s.color,
        name: s.name,
        type: 'human',
        characterId: s.characterId,
        outfitId: s.outfitId,
        skinId: s.skinId,
        userId: s.userId ?? s.clientId ?? undefined,
      })),
    });

    this.scheduleTurnTimer(room);
    this.broadcastRoom(room);
  }

  private handleMatchRoll(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'match:roll' }>,
  ): void {
    const room = this.rooms.get(msg.roomCode.toUpperCase());
    if (!room || !room.matchState) {
      this.sendError(conn.ws, 'MATCH_NOT_FOUND', 'Active match not found.');
      return;
    }

    // Idempotency guard for duplicate retries
    if (msg.expectedSeq !== room.matchState.moveSeq) {
      this.send(conn.ws, { type: 'room:snapshot', room: this.toSnapshot(room) });
      return;
    }

    const activeSeat = room.seats[room.matchState.activeSeatIndex];
    if (!activeSeat || activeSeat.clientId !== msg.clientId) {
      this.sendError(conn.ws, 'NOT_YOUR_TURN', 'It is not your turn to roll.');
      return;
    }

    // Authoritative CSPRNG dice roll (never client-supplied)
    const diceValue = crypto.randomInt(1, 7);
    const nextState = applyDiceRoll(room.matchState, activeSeat.seatIndex, diceValue);
    room.matchState = nextState;

    this.scheduleTurnTimer(room);
    this.broadcastRoom(room, {
      type: 'match:event',
      event: 'dice_rolled',
      diceValue,
      seatIndex: activeSeat.seatIndex,
      room: this.toSnapshot(room),
    });
  }

  private handleMatchMove(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'match:move' }>,
  ): void {
    const room = this.rooms.get(msg.roomCode.toUpperCase());
    if (!room || !room.matchState) {
      this.sendError(conn.ws, 'MATCH_NOT_FOUND', 'Active match not found.');
      return;
    }

    if (msg.expectedSeq !== room.matchState.moveSeq) {
      this.send(conn.ws, { type: 'room:snapshot', room: this.toSnapshot(room) });
      return;
    }

    const activeSeat = room.seats[room.matchState.activeSeatIndex];
    if (!activeSeat || activeSeat.clientId !== msg.clientId) {
      this.sendError(conn.ws, 'NOT_YOUR_TURN', 'It is not your turn to move.');
      return;
    }

    const { nextState } = applyPieceMove(room.matchState, activeSeat.seatIndex, msg.pieceIndex);
    room.matchState = nextState;

    if (nextState.phase === 'GAME_OVER') {
      room.status = 'finished';
      this.clearTurnTimer(room);
      void this.persistFinishedMatch(room);
    } else {
      this.scheduleTurnTimer(room);
    }

    this.broadcastRoom(room, {
      type: 'match:event',
      event: 'piece_moved',
      seatIndex: activeSeat.seatIndex,
      room: this.toSnapshot(room),
    });
  }

  private handleReconnect(conn: ClientConn, roomCode: string, clientId: string): void {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      this.sendError(conn.ws, 'ROOM_NOT_FOUND', 'Room expired or no longer exists.');
      return;
    }
    const seat = room.seats.find((s) => s.clientId === clientId);
    if (!seat) {
      this.sendError(conn.ws, 'NOT_IN_ROOM', 'Player seat not found in this room.');
      return;
    }

    seat.connected = true;
    conn.roomCode = room.roomCode;
    if (room.matchState) {
      room.matchState.players[seat.seatIndex].connected = true;
    }

    this.broadcastRoom(room, {
      type: 'match:event',
      event: 'player_reconnected',
      seatIndex: seat.seatIndex,
      room: this.toSnapshot(room),
    });
  }

  private handleLeaveRoom(conn: ClientConn, roomCode: string, clientId: string): void {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;
    if (room.status === 'lobby') {
      room.seats = room.seats.filter((s) => s.clientId !== clientId);
      if (room.seats.length === 0) {
        this.clearTurnTimer(room);
        this.rooms.delete(room.roomCode);
        return;
      }
      if (room.hostClientId === clientId) {
        room.hostClientId = room.seats[0].clientId!;
        room.seats[0].isHost = true;
      }
      room.seats.forEach((s, idx) => {
        s.seatIndex = idx;
      });
    } else {
      const seat = room.seats.find((s) => s.clientId === clientId);
      if (seat) seat.connected = false;
    }
    conn.roomCode = null;
    this.broadcastRoom(room);
  }

  private handleQueueJoin(
    conn: ClientConn,
    msg: Extract<ClientToServerMessage, { type: 'queue:join' }>,
  ): void {
    if (!this.queue.some((q) => q.clientId === msg.clientId)) {
      this.queue.push({
        clientId: msg.clientId,
        playerName: sanitizeName(msg.playerName),
        userId: msg.userId,
        characterId: msg.characterId,
        outfitId: msg.outfitId,
        skinId: msg.skinId,
        preferredPlayers: msg.preferredPlayers,
        joinedAt: Date.now(),
      });
    }

    this.tryMatchmake(msg.preferredPlayers);

    // Send queue status to remaining waiters
    const matchingEntries = this.queue.filter((q) => q.preferredPlayers === msg.preferredPlayers);
    matchingEntries.forEach((entry, idx) => {
      const sock = this.clientSockets.get(entry.clientId);
      if (sock) {
        this.send(sock, {
          type: 'queue:status',
          inQueue: true,
          position: idx + 1,
          preferredPlayers: msg.preferredPlayers,
          queuedCount: matchingEntries.length,
        });
      }
    });
  }

  private handleQueueLeave(clientId: string): void {
    const idx = this.queue.findIndex((q) => q.clientId === clientId);
    if (idx !== -1) {
      const removed = this.queue.splice(idx, 1)[0];
      const sock = this.clientSockets.get(clientId);
      if (sock) {
        this.send(sock, {
          type: 'queue:status',
          inQueue: false,
          position: 0,
          preferredPlayers: removed.preferredPlayers,
          queuedCount: 0,
        });
      }
    }
  }

  private tryMatchmake(preferredPlayers: 2 | 4): void {
    const eligible = this.queue.filter((q) => q.preferredPlayers === preferredPlayers);
    if (eligible.length < preferredPlayers) return;

    const picked = eligible.slice(0, preferredPlayers);
    for (const entry of picked) {
      const i = this.queue.findIndex((q) => q.clientId === entry.clientId);
      if (i !== -1) this.queue.splice(i, 1);
    }

    let roomCode = generateInviteCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateInviteCode();
    }

    const colors = getSeatsForPlayerCount(preferredPlayers);
    const room: ManagedRoom = {
      roomCode,
      hostClientId: picked[0].clientId,
      boardThemeId: 'royal-enchanted-courtyard',
      maxPlayers: preferredPlayers,
      rules: RULE_PRESETS.classic_kingdom,
      status: 'playing',
      seats: picked.map((entry, idx) => ({
        seatIndex: idx,
        color: colors[idx],
        clientId: entry.clientId,
        userId: entry.userId,
        name: entry.playerName,
        characterId: entry.characterId,
        outfitId: entry.outfitId,
        skinId: entry.skinId,
        ready: true,
        connected: true,
        isHost: idx === 0,
      })),
      matchState: null,
      turnDeadlineAt: null,
      turnTimerHandle: null,
    };

    this.rooms.set(roomCode, room);
    picked.forEach((entry) => {
      const sock = this.clientSockets.get(entry.clientId);
      if (sock) {
        this.send(sock, { type: 'queue:matched', roomCode });
      }
    });
    this.startMatchInRoom(room, 'online_public');
  }

  private scheduleTurnTimer(room: ManagedRoom): void {
    this.clearTurnTimer(room);
    if (!room.matchState || room.matchState.phase === 'GAME_OVER') return;

    const seconds = Math.max(10, room.rules.turnTimerSeconds || 30);
    room.turnDeadlineAt = Date.now() + seconds * 1000;
    room.turnTimerHandle = setTimeout(() => {
      if (!room.matchState || room.matchState.phase === 'GAME_OVER') return;
      room.matchState = forceTurnTimeout(room.matchState);
      if (room.matchState.phase === 'GAME_OVER') {
        room.status = 'finished';
        void this.persistFinishedMatch(room);
      } else {
        this.scheduleTurnTimer(room);
      }
      this.broadcastRoom(room, {
        type: 'match:event',
        event: 'turn_timeout',
        room: this.toSnapshot(room),
      });
    }, seconds * 1000);
  }

  private clearTurnTimer(room: ManagedRoom): void {
    if (room.turnTimerHandle) {
      clearTimeout(room.turnTimerHandle);
      room.turnTimerHandle = null;
    }
    room.turnDeadlineAt = null;
  }

  private async persistFinishedMatch(room: ManagedRoom): Promise<void> {
    if (!room.matchState || !room.matchState.winners[0]) return;
    const state = room.matchState;
    const durationMs = (state.finishedAt ?? Date.now()) - state.startedAt;
    try {
      await this.db.query(
        `INSERT INTO matches (match_id, room_code, mode, board_theme_id, winner_color, player_count, duration_ms, state_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          state.matchId,
          room.roomCode,
          state.mode,
          state.boardThemeId,
          state.winners[0],
          state.players.length,
          durationMs,
          JSON.stringify({ winners: state.winners, moveCount: state.moveSeq }),
          Date.now(),
        ],
      );
    } catch (err) {
      console.error('Failed to persist online match:', err);
    }
  }

  private handleDisconnect(conn: ClientConn): void {
    this.connections.delete(conn);
    if (conn.clientId) {
      if (this.clientSockets.get(conn.clientId) === conn.ws) {
        this.clientSockets.delete(conn.clientId);
      }
      this.handleQueueLeave(conn.clientId);

      if (conn.roomCode) {
        const room = this.rooms.get(conn.roomCode);
        if (room) {
          const seat = room.seats.find((s) => s.clientId === conn.clientId);
          if (seat) {
            seat.connected = false;
            if (room.matchState) {
              room.matchState.players[seat.seatIndex].connected = false;
            }
            this.broadcastRoom(room);
          }
        }
      }
    }
  }
}
