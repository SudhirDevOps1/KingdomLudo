import { getAbsoluteTrackIndex, SAFE_TRACK_INDICES } from './boardTopology';
import type { AIDifficulty, AIPersonality, MatchState, MoveOption } from './types';

interface ScoredMove {
  move: MoveOption;
  score: number;
}

const PERSONALITY_WEIGHTS: Record<
  AIPersonality,
  { capture: number; safety: number; home: number; progress: number; risk: number }
> = {
  aggressive: { capture: 1.45, safety: 0.75, home: 1.0, progress: 1.05, risk: 0.65 },
  guardian: { capture: 0.9, safety: 1.45, home: 1.15, progress: 0.9, risk: 1.4 },
  balanced: { capture: 1.15, safety: 1.1, home: 1.2, progress: 1.0, risk: 1.0 },
  tactician: { capture: 1.3, safety: 1.25, home: 1.35, progress: 1.1, risk: 1.25 },
};

function countThreateningOpponents(
  state: MatchState,
  seatIndex: number,
  absoluteTrackIdx: number,
): number {
  if (state.rules.safeZonesEnabled && SAFE_TRACK_INDICES.has(absoluteTrackIdx)) {
    return 0;
  }

  let threats = 0;
  for (const opp of state.players) {
    if (opp.seatIndex === seatIndex || opp.finishedOrder !== null) continue;
    for (const oppPiece of opp.pieces) {
      if (oppPiece.progress < 0 || oppPiece.progress > 50) continue;
      const oppAbs = getAbsoluteTrackIndex(opp.color, oppPiece.progress);
      if (oppAbs === null) continue;
      const dist = (absoluteTrackIdx - oppAbs + 52) % 52;
      if (dist >= 1 && dist <= 6 && oppPiece.progress + dist <= 50) {
        threats += 1;
      }
    }
  }
  return threats;
}

export function evaluateMoveScore(
  state: MatchState,
  seatIndex: number,
  move: MoveOption,
  difficulty: AIDifficulty,
  personality: AIPersonality = 'balanced',
): number {
  if (difficulty === 'easy') {
    // Easy prioritizes leaving base or reaching home slightly, otherwise light heuristic
    let score = move.toProgress * 0.4;
    if (move.entersBoard) score += 20;
    if (move.reachesHome) score += 35;
    if (move.capturedPieces.length > 0) score += 18;
    return score;
  }

  const player = state.players[seatIndex];
  const weights = PERSONALITY_WEIGHTS[personality];
  let score = 0;

  // 1. Exact home completion (highest value)
  if (move.reachesHome) {
    score += 120 * weights.home;
  }

  // 2. Entering home lane (safe from all opponents!)
  if (move.fromProgress <= 50 && move.toProgress >= 51 && move.toProgress < 56) {
    score += 75 * weights.home;
  }

  // 3. Capturing opponent pieces (weighted by progress denied to opponent!)
  if (move.capturedPieces.length > 0) {
    let opponentLostProgress = 0;
    for (const cap of move.capturedPieces) {
      const oppPiece = state.players[cap.seatIndex]?.pieces[cap.pieceIndex];
      opponentLostProgress += Math.max(0, oppPiece?.progress ?? 0);
    }
    // High-value deny: sending a piece back from progress 45 is worth far more than from 2
    score += (90 + opponentLostProgress * 2.2) * weights.capture;
    if (state.rules.extraTurnOnCapture) {
      score += 35 * weights.capture;
    }
  }

  // 4. Leaving base on a 6
  if (move.entersBoard) {
    score += 55 * weights.progress;
  }

  // 5. Safe zone shelter bonus
  if (move.landsOnSafeZone) {
    score += 42 * weights.safety;
  }

  // 6. Progression & lead bonus
  score += move.toProgress * 0.85 * weights.progress;

  // 6b. Tactical Hunting: positioning within strike range (1-6 tiles) behind vulnerable opponents
  if (move.toProgress <= 50) {
    const toAbs = getAbsoluteTrackIndex(player.color, move.toProgress);
    if (toAbs !== null) {
      for (const opp of state.players) {
        if (opp.seatIndex === seatIndex || opp.finishedOrder !== null) continue;
        for (const oppPiece of opp.pieces) {
          if (oppPiece.progress < 0 || oppPiece.progress > 50) continue;
          const oppAbs = getAbsoluteTrackIndex(opp.color, oppPiece.progress);
          if (oppAbs === null) continue;
          const dist = (oppAbs - toAbs + 52) % 52;
          if (dist >= 1 && dist <= 6 && (!state.rules.safeZonesEnabled || !SAFE_TRACK_INDICES.has(oppAbs))) {
            score += (14 + oppPiece.progress * 0.35) * weights.capture;
          }
        }
      }
    }
  }

  // 7. Hard difficulty: evaluate threat delta (leaving threatened square vs walking into danger)
  if (difficulty === 'hard') {
    const fromAbs = getAbsoluteTrackIndex(player.color, move.fromProgress);
    const toAbs = getAbsoluteTrackIndex(player.color, move.toProgress);

    if (fromAbs !== null) {
      const currentThreats = countThreateningOpponents(state, seatIndex, fromAbs);
      if (currentThreats > 0) {
        score += currentThreats * 28 * weights.risk; // Escaping danger!
      }
      // Slight penalty for abandoning a safe zone unless capturing or entering home lane
      if (
        state.rules.safeZonesEnabled &&
        SAFE_TRACK_INDICES.has(fromAbs) &&
        !move.landsOnSafeZone &&
        move.toProgress <= 50 &&
        move.capturedPieces.length === 0
      ) {
        score -= 18 * weights.safety;
      }
    }

    if (toAbs !== null) {
      const destThreats = countThreateningOpponents(state, seatIndex, toAbs);
      if (destThreats > 0) {
        // Penalize walking into danger proportional to how much progress we'd lose
        score -= destThreats * (18 + move.toProgress * 0.45) * weights.risk;
      }
    }

    // Prefer advancing lead piece when close to finish, or spreading out from start
    if (move.toProgress >= 44) {
      score += 18 * weights.home;
    }
  }

  return score;
}

export function chooseBestAIMove(
  state: MatchState,
  seatIndex: number,
  rng: () => number = Math.random,
): MoveOption {
  const moves = state.legalMoves;
  if (moves.length === 0) {
    throw new Error('AI cannot choose a move when legalMoves is empty.');
  }
  if (moves.length === 1) return moves[0];

  const seat = state.players[seatIndex];
  const difficulty: AIDifficulty = seat.aiDifficulty ?? 'medium';
  const personality: AIPersonality = seat.aiPersonality ?? 'balanced';

  const scored: ScoredMove[] = moves.map((move) => ({
    move,
    score: evaluateMoveScore(state, seatIndex, move, difficulty, personality),
  }));

  scored.sort((a, b) => b.score - a.score);

  if (difficulty === 'easy') {
    // Easy AI picks among top candidates with mild noise so it feels approachable
    const roll = rng();
    if (roll < 0.45 && scored.length > 1) {
      return scored[Math.min(1, scored.length - 1)].move;
    }
  }

  return scored[0].move;
}
