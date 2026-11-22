import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Board2DFallback } from '../src/components/game/Board2DFallback';
import { ActiveGameView } from '../src/components/views/ActiveGameView';
import { HomeHub } from '../src/components/views/HomeHub';
import { HelpAndAboutView } from '../src/components/views/SettingsAndHelpView';
import { APP_CONFIG } from '../src/config/appConfig';
import { createInitialMatchState, RULE_PRESETS } from '../src/engine/ludoEngine';
import { useGameStore } from '../src/store/gameStore';

describe('React UI & Fallback Board Components', () => {
  it('exposes official KingdomLudo 0.1.0-alpha.0 branding config and About view', () => {
    expect(APP_CONFIG.appName).toBe('KingdomLudo');
    expect(APP_CONFIG.version).toBe('0.1.0-alpha.0');
    expect(APP_CONFIG.releaseChannel).toBe('Alpha');
    expect(APP_CONFIG.packageId).toBe('com.kingdomludo.app');

    render(<HelpAndAboutView />);
    expect(screen.getByText(/About KingdomLudo & Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Version 0\.1\.0-alpha\.0/i)).toBeInTheDocument();
  });

  it('renders HomeHub with all core play entry points', () => {
    render(<HomeHub />);
    expect(screen.getByText(/Command Your Kingdom in 3D Ludo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Play vs Computer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Pass & Play/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Practice Skirmish Challenges/i)).toBeInTheDocument();
  });

  it('renders ActiveGameView with 4 corner cards, identity badges and corner dice controls', () => {
    const match = createInitialMatchState({
      matchId: 'ui_active_match',
      mode: 'vs_ai',
      boardThemeId: 'royal-enchanted-courtyard',
      rules: { ...RULE_PRESETS.classic_kingdom },
      seats: [
        { color: 'red', name: 'Royal Commander', type: 'human', characterId: 'ignis-drake' },
        { color: 'blue', name: 'Fenris Bot', type: 'ai', aiDifficulty: 'hard', characterId: 'glacier-lupus' },
        { color: 'yellow', name: 'Leander Bot', type: 'ai', aiDifficulty: 'medium', characterId: 'auric-leo' },
        { color: 'green', name: 'Bambooz Bot', type: 'ai', aiDifficulty: 'easy', characterId: 'bamboo-warden' },
      ],
    });

    useGameStore.setState({
      activeMatch: match,
      settings: { ...useGameStore.getState().settings, prefer2DFallback: true },
    });

    render(<ActiveGameView />);

    // Verify 4 corner player identification badges
    expect(screen.getByText(/\[HUMAN\] \[YOUR PLAYER\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[COMPUTER\] \[HARD AI\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[COMPUTER\] \[MEDIUM AI\]/i)).toBeInTheDocument();
    expect(screen.getByText(/\[COMPUTER\] \[EASY AI\]/i)).toBeInTheDocument();

    // Verify active turn banner and corner ROLL button
    expect(screen.getByText(/👑 YOUR TURN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ROLL/i })).toBeInTheDocument();
  });

  it('renders Board2DFallback and dispatches dice click callback', () => {
    const match = createInitialMatchState({
      matchId: 'ui_test_1',
      mode: 'vs_ai',
      boardThemeId: 'royal-enchanted-courtyard',
      rules: { ...RULE_PRESETS.classic_kingdom },
      seats: [
        { color: 'red', name: 'Tester', type: 'human', characterId: 'ignis-drake' },
        { color: 'blue', name: 'Bot', type: 'ai', characterId: 'glacier-lupus' },
      ],
    });
    const onDice = vi.fn();
    const onPiece = vi.fn();

    const { container } = render(
      <Board2DFallback matchState={match} onDiceClick={onDice} onPieceClick={onPiece} />,
    );

    const diceCircle = container.querySelector('circle.cursor-pointer');
    expect(diceCircle).toBeTruthy();
    if (diceCircle) fireEvent.click(diceCircle);
    expect(onDice).toHaveBeenCalledTimes(1);
  });
});
