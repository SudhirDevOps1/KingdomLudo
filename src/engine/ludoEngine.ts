import {
  getAbsoluteTrackIndex,
  getSeatsForPlayerCount,
  SAFE_TRACK_INDICES,
} from './boardTopology';
import type {
  AIDifficulty,
  AIPersonality,
  KingdomColor,
  MatchState,
  MoveOption,
  PlayerSeat,
  PlayerSeatType,
  RuleConfig,
  RulePreset,
} from './types';

export const RULE_PRESETS: Record<RulePreset, RuleConfig> = {
  classic_kingdom: {
    preset: 'classic_kingdom',
    extraTurnOnSix: true,
    extraTurnOnCapture: true,
    extraTurnOnHome: true,
    safeZonesEnabled: true,
    threeSixesForfeitTurn: true,
    exactHomeRequired: true,
    turnTimerSeconds: 30,
  },
  standard: {
    preset: 'standard',
    extraTurnOnSix: true,
    extraTurnOnCapture: false,
    extraTurnOnHome: false,
    safeZonesEnabled: true,
    threeSixesForfeitTurn: false,
    exactHomeRequired: true,
    turnTimerSeconds: 30,
  },
};

export interface SeatSetupInput {
  color?: KingdomColor;
  name: string;
  type: PlayerSeatType;
  aiDifficulty?: AIDifficulty;
  aiPersonality?: AIPersonality;
  characterId: string;
  outfitId?: string;
  skinId?: string;
  userId?: string;
}

export interface CreateMatchInput {
  matchId: string;
  mode: MatchState['mode'];
  boardThemeId: string;
  rules: RuleConfig;
  seats: SeatSetupInput[];
  now?: number;
}

export function createInitialMatchState(input: CreateMatchInput): MatchState {
  if (input.seats.length < 2 || input.seats.length > 4) {
    throw new Error('Ludo requires between 2 and 4 players.');
  }

  const defaultColors = getSeatsForPlayerCount(input.seats.length as 2 | 3 | 4);
  const usedColors = new Set<KingdomColor>();

  const players: PlayerSeat[] = input.seats.map((seat, idx) => {
    const color = seat.color ?? defaultColors[idx];
    if (usedColors.has(color)) {
      throw new Error(`Duplicate kingdom color "${color}" in match setup.`);
    }
    usedColors.add(color);

    return {
      seatIndex: idx,
      color,
      name: seat.name.trim() || `Player ${idx + 1}`,
      type: seat.type,
      aiDifficulty: seat.aiDifficulty,
      aiPersonality: seat.aiPersonality,
      characterId: seat.characterId,
      outfitId: seat.outfitId ?? 'royal-guard',
      skinId: seat.skinId ?? 'classic',
      connected: true,
      ready: true,
      userId: seat.userId,
      pieces: [
        { pieceIndex: 0, progress: -1 },
        { pieceIndex: 1, progress: -1 },
        { pieceIndex: 2, progress: -1 },
        { pieceIndex: 3, progress: -1 },
      ],
      finishedOrder: null,
      stats: {
        capturesMade: 0,
        timesCaptured: 0,
        sixesRolled: 0,
        turnsTaken: 0,
      },
    };
  });

  const ts = input.now ?? Date.now();
  return {
    matchId: input.matchId,
    mode: input.mode,
    boardThemeId: input.boardThemeId,
    rules: { ...input.rules },
    players,
    activeSeatIndex: 0,
    phase: 'WAITING_ROLL',
    currentDice: null,
    consecutiveSixes: 0,
    legalMoves: [],
    moveSeq: 0,
    moveLog: [],
    winners: [],
    startedAt: ts,
    updatedAt: ts,
    finishedAt: null,
  };
}

/**
 * Cryptographically unbiased uniform die roll 1..6 using Web Crypto API.
 */
export function rollCryptoDie(): number {
  const buf = new Uint32Array(1);
  // Rejection sampling to eliminate modulo bias (2^32 % 6 !== 0)
  const limit = Math.floor(0x100000000 / 6) * 6;
  while (true) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < limit) {
      return (buf[0] % 6) + 1;
    }
  }
}

export function isValidDiceValue(dice: number): boolean {
  return Number.isInteger(dice) && dice >= 1 && dice <= 6;
}

export function getLegalMovesForDice(
  state: MatchState,
  seatIndex: number,
  dice: number,
): MoveOption[] {
  if (!isValidDiceValue(dice)) return [];
  const player = state.players[seatIndex];
  if (!player || player.finishedOrder !== null) return [];

  const options: MoveOption[] = [];

  for (const piece of player.pieces) {
    if (piece.progress === 56) continue;

    let toProgress: number;
    let entersBoard = false;

    if (piece.progress === -1) {
      if (dice !== 6) continue;
      toProgress = 0;
      entersBoard = true;
    } else {
      toProgress = piece.progress + dice;
      if (toProgress > 56) {
        if (state.rules.exactHomeRequired) {
          continue;
        }
        toProgress = 56;
      }
    }

    const targetAbs = getAbsoluteTrackIndex(player.color, toProgress);
    const landsOnSafeZone =
      targetAbs !== null && state.rules.safeZonesEnabled && SAFE_TRACK_INDICES.has(targetAbs);

    const capturedPieces: MoveOption['capturedPieces'] = [];
    if (targetAbs !== null && !landsOnSafeZone) {
      for (const opponent of state.players) {
        if (opponent.seatIndex === seatIndex) continue;
        for (const oppPiece of opponent.pieces) {
          const oppAbs = getAbsoluteTrackIndex(opponent.color, oppPiece.progress);
          if (oppAbs === targetAbs) {
            capturedPieces.push({
              seatIndex: opponent.seatIndex,
              color: opponent.color,
              pieceIndex: oppPiece.pieceIndex,
            });
          }
        }
      }
    }

    options.push({
      pieceIndex: piece.pieceIndex,
      fromProgress: piece.progress,
      toProgress,
      entersBoard,
      reachesHome: toProgress === 56,
      landsOnSafeZone,
      capturedPieces,
    });
  }

  return options;
}

export function findNextActiveSeatIndex(players: PlayerSeat[], currentSeat: number): number {
  const count = players.length;
  for (let offset = 1; offset <= count; offset++) {
    const candidate = (currentSeat + offset) % count;
    if (players[candidate].finishedOrder === null) {
      return candidate;
    }
  }
  return currentSeat;
}

function clonePlayers(players: PlayerSeat[]): PlayerSeat[] {
  return players.map((p) => ({
    ...p,
    pieces: [
      { ...p.pieces[0] },
      { ...p.pieces[1] },
      { ...p.pieces[2] },
      { ...p.pieces[3] },
    ],
    stats: { ...p.stats },
  }));
}

export function applyDiceRoll(
  state: MatchState,
  seatIndex: number,
  diceValue: number,
  now = Date.now(),
): MatchState {
  if (state.phase !== 'WAITING_ROLL') {
    throw new Error(`Cannot roll dice in phase "${state.phase}".`);
  }
  if (seatIndex !== state.activeSeatIndex) {
    throw new Error(`It is not seat ${seatIndex}'s turn.`);
  }
  if (!isValidDiceValue(diceValue)) {
    throw new Error(`Invalid dice value: ${diceValue}`);
  }

  const players = clonePlayers(state.players);
  const activePlayer = players[seatIndex];
  activePlayer.stats.turnsTaken += 1;
  if (diceValue === 6) {
    activePlayer.stats.sixesRolled += 1;
  }

  const nextConsecutiveSixes = diceValue === 6 ? state.consecutiveSixes + 1 : 0;

  // Check optional consecutive-three-sixes forfeit rule
  if (state.rules.threeSixesForfeitTurn && nextConsecutiveSixes >= 3) {
    const nextSeat = findNextActiveSeatIndex(players, seatIndex);
    const seq = state.moveSeq + 1;
    return {
      ...state,
      players,
      activeSeatIndex: nextSeat,
      phase: 'WAITING_ROLL',
      currentDice: null,
      consecutiveSixes: 0,
      legalMoves: [],
      moveSeq: seq,
      updatedAt: now,
      moveLog: [
        ...state.moveLog,
        {
          seq,
          timestamp: now,
          seatIndex,
          color: activePlayer.color,
          playerName: activePlayer.name,
          diceValue,
          action: 'forfeit_three_sixes',
        },
      ],
    };
  }

  const legalMoves = getLegalMovesForDice({ ...state, players }, seatIndex, diceValue);

  if (legalMoves.length === 0) {
    const nextSeat = findNextActiveSeatIndex(players, seatIndex);
    const seq = state.moveSeq + 1;
    return {
      ...state,
      players,
      activeSeatIndex: nextSeat,
      phase: 'WAITING_ROLL',
      currentDice: null,
      consecutiveSixes: 0,
      legalMoves: [],
      moveSeq: seq,
      updatedAt: now,
      moveLog: [
        ...state.moveLog,
        {
          seq,
          timestamp: now,
          seatIndex,
          color: activePlayer.color,
          playerName: activePlayer.name,
          diceValue,
          action: 'roll_no_move',
        },
      ],
    };
  }

  return {
    ...state,
    players,
    phase: 'WAITING_MOVE',
    currentDice: diceValue,
    consecutiveSixes: nextConsecutiveSixes,
    legalMoves,
    updatedAt: now,
  };
}

export function applyPieceMove(
  state: MatchState,
  seatIndex: number,
  pieceIndex: 0 | 1 | 2 | 3,
  now = Date.now(),
): { nextState: MatchState; executedMove: MoveOption } {
  if (state.phase !== 'WAITING_MOVE' || state.currentDice === null) {
    throw new Error(`Cannot move piece in phase "${state.phase}".`);
  }
  if (seatIndex !== state.activeSeatIndex) {
    throw new Error(`It is not seat ${seatIndex}'s turn.`);
  }

  const move = state.legalMoves.find((m) => m.pieceIndex === pieceIndex);
  if (!move) {
    throw new Error(`Piece ${pieceIndex} is not a legal move for dice ${state.currentDice}.`);
  }

  const players = clonePlayers(state.players);
  const activePlayer = players[seatIndex];
  const diceValue = state.currentDice;

  // Move piece
  activePlayer.pieces[pieceIndex].progress = move.toProgress;

  // Execute captures
  for (const cap of move.capturedPieces) {
    const victim = players[cap.seatIndex];
    victim.pieces[cap.pieceIndex].progress = -1;
    victim.stats.timesCaptured += 1;
    activePlayer.stats.capturesMade += 1;
  }

  // Check if player just completed all 4 pieces
  const winners = [...state.winners];
  const justFinishedMatchForSeat =
    activePlayer.pieces.every((p) => p.progress === 56) && activePlayer.finishedOrder === null;

  if (justFinishedMatchForSeat) {
    activePlayer.finishedOrder = winners.length + 1;
    winners.push(activePlayer.color);
  }

  const remainingPlayers = players.filter((p) => p.finishedOrder === null);
  const matchCompleted = remainingPlayers.length <= 1;

  if (matchCompleted && remainingPlayers.length === 1) {
    const lastPlayer = remainingPlayers[0];
    lastPlayer.finishedOrder = winners.length + 1;
    winners.push(lastPlayer.color);
  }

  const awardedExtraTurn =
    !justFinishedMatchForSeat &&
    !matchCompleted &&
    ((diceValue === 6 && state.rules.extraTurnOnSix) ||
      (move.capturedPieces.length > 0 && state.rules.extraTurnOnCapture) ||
      (move.reachesHome && state.rules.extraTurnOnHome));

  const nextSeat = matchCompleted
    ? seatIndex
    : awardedExtraTurn
      ? seatIndex
      : findNextActiveSeatIndex(players, seatIndex);

  const seq = state.moveSeq + 1;
  const nextState: MatchState = {
    ...state,
    players,
    activeSeatIndex: nextSeat,
    phase: matchCompleted ? 'GAME_OVER' : 'WAITING_ROLL',
    currentDice: null,
    consecutiveSixes: awardedExtraTurn && diceValue === 6 ? state.consecutiveSixes : 0,
    legalMoves: [],
    moveSeq: seq,
    winners,
    updatedAt: now,
    finishedAt: matchCompleted ? now : null,
    moveLog: [
      ...state.moveLog,
      {
        seq,
        timestamp: now,
        seatIndex,
        color: activePlayer.color,
        playerName: activePlayer.name,
        diceValue,
        action: 'move',
        pieceIndex,
        fromProgress: move.fromProgress,
        toProgress: move.toProgress,
        capturedCount: move.capturedPieces.length,
        reachedHome: move.reachesHome,
        awardedExtraTurn,
      },
    ],
  };

  return { nextState, executedMove: move };
}

export function forceTurnTimeout(state: MatchState, now = Date.now()): MatchState {
  if (state.phase === 'GAME_OVER') return state;

  const players = clonePlayers(state.players);
  const activePlayer = players[state.activeSeatIndex];

  // If waiting move, auto-select the first legal move deterministically
  if (state.phase === 'WAITING_MOVE' && state.legalMoves.length > 0) {
    return applyPieceMove(state, state.activeSeatIndex, state.legalMoves[0].pieceIndex, now)
      .nextState;
  }

  // Otherwise pass turn
  const nextSeat = findNextActiveSeatIndex(players, state.activeSeatIndex);
  const seq = state.moveSeq + 1;
  return {
    ...state,
    players,
    activeSeatIndex: nextSeat,
    phase: 'WAITING_ROLL',
    currentDice: null,
    consecutiveSixes: 0,
    legalMoves: [],
    moveSeq: seq,
    updatedAt: now,
    moveLog: [
      ...state.moveLog,
      {
        seq,
        timestamp: now,
        seatIndex: state.activeSeatIndex,
        color: activePlayer.color,
        playerName: activePlayer.name,
        diceValue: state.currentDice ?? 0,
        action: 'pass',
      },
    ],
  };
}
