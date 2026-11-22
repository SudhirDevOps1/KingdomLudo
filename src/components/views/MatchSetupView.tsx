import React from 'react';
import { ArrowLeft, Bot, Play, ShieldCheck, Users } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { BOARD_THEMES } from '../../data/boardThemes';
import { CHARACTERS, getCharactersForKingdom } from '../../data/characters';
import { RULE_PRESETS } from '../../engine/ludoEngine';
import type { AIDifficulty, KingdomColor } from '../../engine/types';
import { useGameStore } from '../../store/gameStore';

const SEAT_ORDER: KingdomColor[] = ['red', 'blue', 'yellow', 'green'];

export const MatchSetupView: React.FC = () => {
  const setupDraft = useGameStore((s) => s.setupDraft);
  const updateSetupDraft = useGameStore((s) => s.updateSetupDraft);
  const startOfflineMatch = useGameStore((s) => s.startOfflineMatch);
  const navigate = useGameStore((s) => s.navigate);

  const setPlayerCount = (count: 2 | 3 | 4) => {
    updateSetupDraft({ playerCount: count });
  };

  const setRulePreset = (preset: 'classic_kingdom' | 'standard') => {
    updateSetupDraft({
      rulePreset: preset,
      rules: { ...RULE_PRESETS[preset] },
    });
  };

  const updateSeat = (
    idx: number,
    patch: Partial<(typeof setupDraft.seats)[number]>,
  ) => {
    const nextSeats = setupDraft.seats.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateSetupDraft({ seats: nextSeats });
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8] hover:border-[#E6A93C]/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#E7E2D8]">
              Match Setup
            </h1>
            <p className="text-xs text-[#E7E2D8]/70">
              Configure kingdoms, AI difficulty, board theme, and rule variations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void startOfflineMatch()}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[#E6A93C] px-6 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
        >
          <Play className="h-4 w-4" />
          <span>Launch 3D Match</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: Mode, Player Count, Seats */}
        <div className="space-y-6 rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              Game Mode
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateSetupDraft({ mode: 'vs_ai' })}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  setupDraft.mode === 'vs_ai'
                    ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/80'
                }`}
              >
                <Bot className="h-4 w-4" />
                <span>Play vs Computer</span>
              </button>
              <button
                type="button"
                onClick={() => updateSetupDraft({ mode: 'pass_and_play' })}
                className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  setupDraft.mode === 'pass_and_play'
                    ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/80'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Pass & Play</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                Player Count
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPlayerCount(cnt)}
                    className={`min-h-[42px] rounded-lg border text-sm font-bold transition ${
                      setupDraft.playerCount === cnt
                        ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                        : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]'
                    }`}
                  >
                    {cnt}P
                  </button>
                ))}
              </div>
            </div>

            {setupDraft.mode !== 'pass_and_play' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                  AI Difficulty
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => updateSetupDraft({ aiDifficulty: diff })}
                      className={`min-h-[42px] rounded-lg border text-xs font-bold capitalize transition ${
                        setupDraft.aiDifficulty === diff
                          ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                          : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seat Assignments */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              Kingdom Seats & Hero Roster
            </h2>
            <div className="mt-3 space-y-3">
              {SEAT_ORDER.slice(0, setupDraft.playerCount).map((color, idx) => {
                const seat = setupDraft.seats[idx];
                const kingdomMeta = APP_CONFIG.kingdoms[color];
                const heroes = getCharactersForKingdom(color);
                const fallbackHeroes = heroes.length > 0 ? heroes : CHARACTERS;
                const isBot = setupDraft.mode !== 'pass_and_play' && idx > 0;

                return (
                  <div
                    key={color}
                    className="grid gap-3 rounded-xl border border-[#E7E2D8]/12 bg-[#10141E] p-3.5 sm:grid-cols-[auto_1fr_1fr]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: kingdomMeta.hex }}
                      />
                      <span className="w-20 text-xs font-bold uppercase text-[#E7E2D8]">
                        {isBot ? `AI (${color})` : `P${idx + 1} (${color})`}
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={24}
                      value={seat.name}
                      onChange={(e) => updateSeat(idx, { name: e.target.value })}
                      aria-label={`Player ${idx + 1} Name`}
                      className="min-h-[40px] rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 text-sm text-[#E7E2D8] focus:border-[#E6A93C] focus:outline-none"
                    />

                    <select
                      value={seat.characterId}
                      onChange={(e) => updateSeat(idx, { characterId: e.target.value })}
                      aria-label={`Player ${idx + 1} Character`}
                      className="min-h-[40px] rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 text-sm text-[#E7E2D8] focus:border-[#E6A93C] focus:outline-none"
                    >
                      {fallbackHeroes.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} — {h.title}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Board Theme & Rules */}
        <div className="space-y-6 rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              3D Board Environment
            </label>
            <select
              value={setupDraft.boardThemeId}
              onChange={(e) => updateSetupDraft({ boardThemeId: e.target.value })}
              className="mt-2 min-h-[44px] w-full rounded-xl border border-[#E7E2D8]/15 bg-[#10141E] px-3.5 text-sm text-[#E7E2D8] focus:border-[#E6A93C] focus:outline-none"
            >
              {BOARD_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} {theme.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              Rule Preset
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRulePreset('classic_kingdom')}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  setupDraft.rulePreset === 'classic_kingdom'
                    ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/75'
                }`}
              >
                Classic Kingdom
              </button>
              <button
                type="button"
                onClick={() => setRulePreset('standard')}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  setupDraft.rulePreset === 'standard'
                    ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/75'
                }`}
              >
                Standard Quick
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              <ShieldCheck className="h-4 w-4" />
              <span>Custom Rule Toggles</span>
            </div>

            {(
              [
                ['extraTurnOnSix', 'Bonus roll when rolling a 6'],
                ['extraTurnOnCapture', 'Bonus roll on opponent capture'],
                ['extraTurnOnHome', 'Bonus roll when reaching center crown'],
                ['safeZonesEnabled', '8 Safe Star Sanctuary tiles'],
                ['threeSixesForfeitTurn', 'Forfeit turn after three consecutive 6s'],
                ['exactHomeRequired', 'Require exact dice roll to enter center'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center justify-between gap-3 py-1 text-sm text-[#E7E2D8]/85">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={setupDraft.rules[key]}
                  onChange={(e) =>
                    updateSetupDraft({
                      rules: { ...setupDraft.rules, [key]: e.target.checked },
                    })
                  }
                  className="h-4 w-4 accent-[#E6A93C]"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};
