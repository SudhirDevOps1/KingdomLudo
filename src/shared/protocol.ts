import type { KingdomColor, MatchState, RuleConfig } from '../engine/types';

export interface RoomSeatSummary {
  seatIndex: number;
  color: KingdomColor;
  clientId: string | null;
  userId?: string;
  name: string;
  characterId: string;
  outfitId: string;
  skinId: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
}

export interface RoomSnapshot {
  roomCode: string;
  roomName?: string;
  hostClientId: string;
  boardThemeId: string;
  maxPlayers: 2 | 3 | 4;
  rules: RuleConfig;
  status: 'lobby' | 'playing' | 'finished';
  seats: RoomSeatSummary[];
  matchState: MatchState | null;
  turnDeadlineAt: number | null;
}

export interface ChatMessageItem {
  id: string;
  senderClientId: string;
  senderName: string;
  senderColor: KingdomColor;
  text: string;
  sentAt: number;
}

export type ClientToServerMessage =
  | {
      type: 'room:create';
      roomCode?: string;
      roomName?: string;
      clientId: string;
      playerName: string;
      userId?: string;
      characterId: string;
      outfitId: string;
      skinId: string;
      boardThemeId: string;
      maxPlayers: 2 | 3 | 4;
      rules: RuleConfig;
    }
  | {
      type: 'room:update_profile';
      roomCode: string;
      clientId: string;
      playerName: string;
      characterId: string;
      outfitId: string;
      skinId: string;
    }
  | {
      type: 'room:join';
      roomCode: string;
      clientId: string;
      playerName: string;
      userId?: string;
      characterId: string;
      outfitId: string;
      skinId: string;
    }
  | {
      type: 'room:ready';
      roomCode: string;
      clientId: string;
      ready: boolean;
    }
  | {
      type: 'room:start';
      roomCode: string;
      clientId: string;
    }
  | {
      type: 'room:leave';
      roomCode: string;
      clientId: string;
    }
  | {
      type: 'match:roll';
      roomCode: string;
      clientId: string;
      expectedSeq: number;
    }
  | {
      type: 'match:move';
      roomCode: string;
      clientId: string;
      pieceIndex: 0 | 1 | 2 | 3;
      expectedSeq: number;
    }
  | {
      type: 'match:reconnect';
      roomCode: string;
      clientId: string;
    }
  | {
      type: 'queue:join';
      clientId: string;
      playerName: string;
      userId?: string;
      characterId: string;
      outfitId: string;
      skinId: string;
      preferredPlayers: 2 | 4;
    }
  | {
      type: 'queue:leave';
      clientId: string;
    }
  | {
      type: 'chat:send';
      roomCode: string;
      clientId: string;
      text: string;
    }
  | {
      type: 'voice:signal';
      roomCode: string;
      fromClientId: string;
      toClientId: string;
      signalType: 'offer' | 'answer' | 'ice' | 'join' | 'leave';
      payload?: unknown;
    };

export type ServerToClientMessage =
  | {
      type: 'room:snapshot';
      room: RoomSnapshot;
    }
  | {
      type: 'queue:status';
      inQueue: boolean;
      position: number;
      preferredPlayers: 2 | 4;
      queuedCount: number;
    }
  | {
      type: 'queue:matched';
      roomCode: string;
      isHost?: boolean;
      preferredPlayers?: 2 | 4;
    }
  | {
      type: 'match:event';
      event: 'dice_rolled' | 'piece_moved' | 'turn_timeout' | 'player_reconnected';
      room: RoomSnapshot;
      diceValue?: number;
      seatIndex?: number;
    }
  | {
      type: 'chat:message';
      message: ChatMessageItem;
    }
  | {
      type: 'voice:signal';
      fromClientId: string;
      toClientId: string;
      signalType: 'offer' | 'answer' | 'ice' | 'join' | 'leave';
      payload?: unknown;
    }
  | {
      type: 'error';
      code: string;
      message: string;
    };
