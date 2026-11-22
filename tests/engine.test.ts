import { describe, expect, it } from 'vitest';
import {
  getAbsoluteTrackIndex,
  KINGDOM_START_INDEX,
  MAIN_TRACK_COORDS,
  SAFE_TRACK_INDICES,
  STAR_TRACK_INDICES,
} from '../src/engine/boardTopology';
import {
  applyDiceRoll,
  applyPieceMove,
  createInitialMatchState,
  forceTurnTimeout,
  rollCryptoDie,
  RULE_PRESETS,
} from '../src/engine/ludoEngine';

function createSampleMatch(playerCount: 2 | 4 = 4) {
  const colors = playerCount === 2 ? (['red', 'yellow'] as const) : (['red', 'blue', 'yellow', 'green'] as const);
  return createInitialMatchState({
    matchId: 'test_match_1',
    mode: 'pass_and_play',
    boardThemeId: 'royal-enchanted-courtyard',
    rules: { ...RULE_PRESETS.classic_kingdom },
    seats: colors.map((color, idx) => ({
      color,
      name: `Player ${idx + 1}`,
      type: 'human',
      characterId: 'ignis-drake',
    })),
  });
}

describe('Board Topology & Ludo Engine', () => {
  it('defines exact 52 main track coordinates and 8 star safe zones', () => {
    expect(MAIN_TRACK_COORDS).toHaveLength(52);
    expect(SAFE_TRACK_INDICES.size).toBe(8);
    expect(STAR_TRACK_INDICES.size).toBe(4);
    expect(getAbsoluteTrackIndex('red', 0)).toBe(KINGDOM_START_INDEX.red);
    expect(getAbsoluteTrackIndex('blue', 0)).toBe(KINGDOM_START_INDEX.blue);
    expect(getAbsoluteTrackIndex('yellow', 0)).toBe(KINGDOM_START_INDEX.yellow);
    expect(getAbsoluteTrackIndex('green', 0)).toBe(KINGDOM_START_INDEX.green);
  });

  it('produces uniform CSPRNG dice values between 1 and 6', () => {
    for (let i = 0; i < 120; i++) {
      const val = rollCryptoDie();
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('requires a 6 to deploy from yard and grants bonus turn on 6', () => {
    let state = createSampleMatch(2);
    // Rolling 4 with all pieces in yard skips turn cleanly
    state = applyDiceRoll(state, 0, 4);
    expect(state.activeSeatIndex).toBe(1);
    expect(state.phase).toBe('WAITING_ROLL');

    // Player 2 rolls 6 -> unlocks 4 legal deployment moves
    state = applyDiceRoll(state, 1, 6);
    expect(state.phase).toBe('WAITING_MOVE');
    expect(state.legalMoves).toHaveLength(4);

    const { nextState } = applyPieceMove(state, 1, 0);
    expect(nextState.players[1].pieces[0].progress).toBe(0);
    // Bonus turn retained on rolling 6
    expect(nextState.activeSeatIndex).toBe(1);
    expect(nextState.phase).toBe('WAITING_ROLL');
  });

  it('forfeits turn on three consecutive sixes when enabled', () => {
    let state = createSampleMatch(2);
    state = applyDiceRoll(state, 0, 6);
    state = applyPieceMove(state, 0, 0).nextState;
    state = applyDiceRoll(state, 0, 6);
    state = applyPieceMove(state, 0, 1).nextState;
    // Third consecutive 6 forfeits to seat 1
    state = applyDiceRoll(state, 0, 6);
    expect(state.activeSeatIndex).toBe(1);
    expect(state.phase).toBe('WAITING_ROLL');
    expect(state.consecutiveSixes).toBe(0);
  });

  it('captures unprotected opponent piece and respects star safe zones', () => {
    const state = createSampleMatch(2);
    // Red seat 0 at progress 10 (global 10, not a star tile)
    state.players[0].pieces[0].progress = 10;
    // Yellow seat 1 starts at global 26; progress 32 => (26 + 32) % 52 = 6; wait let's put yellow at progress 30 -> (26+30)%52 = 4!
    // Place yellow at progress 36 -> (26 + 36) % 52 = 10
    state.players[1].pieces[0].progress = 34; // (26+34)%52 = 8 (star tile!)
    state.players[1].pieces[1].progress = 36; // (26+36)%52 = 10 (unprotected!)

    // Roll 2 for Red from progress 8? Let's put Red piece 0 at progress 8, roll 2 -> lands on 10
    state.players[0].pieces[0].progress = 8;
    const rolled = applyDiceRoll(state, 0, 2);
    const { nextState, executedMove } = applyPieceMove(rolled, 0, 0);
    expect(executedMove.capturedPieces).toHaveLength(1);
    expect(nextState.players[1].pieces[1].progress).toBe(-1);
    // Bonus turn on capture!
    expect(nextState.activeSeatIndex).toBe(0);

    // Safe star tile check: if Red moves to global 8 (star), Yellow at global 8 is NOT captured
    const safeState = createSampleMatch(2);
    safeState.players[0].pieces[0].progress = 6; // +2 = 8 (star)
    safeState.players[1].pieces[0].progress = 34; // global 8 (star)
    const safeRoll = applyDiceRoll(safeState, 0, 2);
    const safeRes = applyPieceMove(safeRoll, 0, 0);
    expect(safeRes.executedMove.capturedPieces).toHaveLength(0);
    expect(safeRes.nextState.players[1].pieces[0].progress).toBe(34);
  });

  it('requires exact roll to enter home sanctuary and detects victory', () => {
    const state = createSampleMatch(2);
    state.players[0].pieces[0].progress = 56;
    state.players[0].pieces[1].progress = 56;
    state.players[0].pieces[2].progress = 56;
    state.players[0].pieces[3].progress = 54; // Needs 2 to reach 56

    // Rolling 3 overshoots and cannot move piece 3
    const overshoot = applyDiceRoll(state, 0, 3);
    expect(overshoot.activeSeatIndex).toBe(1);

    // Rolling 2 wins match
    const winningRoll = applyDiceRoll(state, 0, 2);
    const { nextState } = applyPieceMove(winningRoll, 0, 3);
    expect(nextState.phase).toBe('GAME_OVER');
    expect(nextState.winners[0]).toBe('red');
  });

  it('advances turn or auto-moves cleanly on turn timeout', () => {
    const waitingRollState = createSampleMatch(2);
    const passed = forceTurnTimeout(waitingRollState);
    expect(passed.activeSeatIndex).toBe(1);
    expect(passed.phase).toBe('WAITING_ROLL');

    const rolledMoveState = applyDiceRoll(createSampleMatch(2), 0, 6);
    const autoMoved = forceTurnTimeout(rolledMoveState);
    expect(autoMoved.players[0].pieces[0].progress).toBe(0);
    expect(autoMoved.phase).toBe('WAITING_ROLL');
  });
});
