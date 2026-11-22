import { describe, expect, it } from 'vitest';
import { chooseBestAIMove } from '../src/engine/aiEngine';
import { applyDiceRoll, createInitialMatchState, RULE_PRESETS } from '../src/engine/ludoEngine';

describe('AI Tactical Decision Engine', () => {
  it('Hard AI prioritizes opponent capture over idle advancement', () => {
    const match = createInitialMatchState({
      matchId: 'ai_test_1',
      mode: 'vs_ai',
      boardThemeId: 'royal-enchanted-courtyard',
      rules: { ...RULE_PRESETS.classic_kingdom },
      seats: [
        { color: 'red', name: 'Human', type: 'human', characterId: 'ignis-drake' },
        {
          color: 'yellow',
          name: 'Auric Bot',
          type: 'ai',
          aiDifficulty: 'hard',
          aiPersonality: 'aggressive',
          characterId: 'auric-leo',
        },
      ],
    });

    // Red piece 0 sits at global 10 (progress 10)
    match.players[0].pieces[0].progress = 10;
    // Yellow piece 0 is at progress 33 -> global (26 + 33) % 52 = 7; rolling 3 lands on 10 (CAPTURE!)
    match.players[1].pieces[0].progress = 33;
    // Yellow piece 1 is at progress 2 -> global 28 (no capture on +3)
    match.players[1].pieces[1].progress = 2;

    match.activeSeatIndex = 1;
    const rolled = applyDiceRoll(match, 1, 3);
    const chosen = chooseBestAIMove(rolled, 1);

    expect(chosen.pieceIndex).toBe(0);
    expect(chosen.capturedPieces).toHaveLength(1);
  });

  it('Medium AI prioritizes reaching home goal when exact roll matches', () => {
    const match = createInitialMatchState({
      matchId: 'ai_test_2',
      mode: 'vs_ai',
      boardThemeId: 'royal-enchanted-courtyard',
      rules: { ...RULE_PRESETS.classic_kingdom },
      seats: [
        { color: 'red', name: 'Human', type: 'human', characterId: 'ignis-drake' },
        {
          color: 'blue',
          name: 'Fenris Bot',
          type: 'ai',
          aiDifficulty: 'medium',
          characterId: 'glacier-lupus',
        },
      ],
    });

    match.players[1].pieces[0].progress = 5;
    match.players[1].pieces[1].progress = 52; // +4 => 56 (goal!)
    match.activeSeatIndex = 1;

    const rolled = applyDiceRoll(match, 1, 4);
    const chosen = chooseBestAIMove(rolled, 1);
    expect(chosen.pieceIndex).toBe(1);
    expect(chosen.reachesHome).toBe(true);
  });

  it('Hard AI prioritizes high-value capture (denying 45 progress) over low-value capture', () => {
    const match = createInitialMatchState({
      matchId: 'ai_test_3',
      mode: 'vs_ai',
      boardThemeId: 'royal-enchanted-courtyard',
      rules: { ...RULE_PRESETS.classic_kingdom },
      seats: [
        { color: 'red', name: 'Human', type: 'human', characterId: 'ignis-drake' },
        {
          color: 'blue',
          name: 'Fenris Bot',
          type: 'ai',
          aiDifficulty: 'hard',
          characterId: 'glacier-lupus',
        },
      ],
    });

    // Red has piece 0 at progress 45 (global 45) and piece 1 at progress 5 (global 5)
    match.players[0].pieces[0].progress = 45;
    match.players[0].pieces[1].progress = 5;

    // Blue starts at global 13.
    // Piece 0 at progress 29 -> global (13 + 29) % 52 = 42. Rolling 3 lands on 45 (captures lead piece!)
    match.players[1].pieces[0].progress = 29;
    // Piece 1 at progress 41 -> global (13 + 41) % 52 = 2. Rolling 3 lands on 5 (captures fresh piece!)
    match.players[1].pieces[1].progress = 41;

    match.activeSeatIndex = 1;
    const rolled = applyDiceRoll(match, 1, 3);
    const chosen = chooseBestAIMove(rolled, 1);

    // AI should capture piece 0 (denies 45 progress) rather than piece 1 (denies only 5 progress)
    expect(chosen.pieceIndex).toBe(0);
    expect(chosen.capturedPieces[0].pieceIndex).toBe(0);
  });
});
