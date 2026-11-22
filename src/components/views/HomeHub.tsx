import React from 'react';
import {
  Bot,
  Compass,
  Crown,
  Globe,
  Layers,
  Play,
  Shield,
  Swords,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { PRACTICE_CHALLENGES } from '../../data/achievements';
import { getBoardThemeById } from '../../data/boardThemes';
import { getCharacterById } from '../../data/characters';
import { getTranslations } from '../../data/i18n';
import { RULE_PRESETS } from '../../engine/ludoEngine';
import { useGameStore } from '../../store/gameStore';

export const HomeHub: React.FC = () => {
  const profile = useGameStore((s) => s.profile);
  const settings = useGameStore((s) => s.settings);
  const savedMatchPreview = useGameStore((s) => s.savedMatchPreview);
  const setupDraft = useGameStore((s) => s.setupDraft);
  const navigate = useGameStore((s) => s.navigate);
  const updateSetupDraft = useGameStore((s) => s.updateSetupDraft);
  const startOfflineMatch = useGameStore((s) => s.startOfflineMatch);
  const resumeSavedMatch = useGameStore((s) => s.resumeSavedMatch);
  const discardSavedMatch = useGameStore((s) => s.discardSavedMatch);

  const t = getTranslations(settings.language);
  const activeHero = getCharacterById(profile.selectedCharacterId);
  const activeTheme = getBoardThemeById(settings.selectedBoardThemeId);

  const launchMode = (mode: 'pass_and_play' | 'vs_ai') => {
    updateSetupDraft({ mode });
    navigate('setup');
  };

  const launchPracticeChallenge = (challengeId: string) => {
    const ch = PRACTICE_CHALLENGES.find((c) => c.id === challengeId);
    if (!ch) return;
    void startOfflineMatch({
      ...setupDraft,
      mode: 'practice',
      playerCount: ch.playerCount,
      aiDifficulty: ch.difficulty,
      rulePreset: 'classic_kingdom',
      rules: { ...RULE_PRESETS.classic_kingdom },
      boardThemeId: settings.selectedBoardThemeId,
    });
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      {/* Hero Courtyard Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-[#E6A93C]/35 bg-[#1A2130] shadow-2xl">
        <img
          src={APP_CONFIG.assets.courtyardBackdrop}
          alt="Royal Enchanted Courtyard 3D Tabletop Backdrop"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#10141E] via-[#10141E]/85 to-[#10141E]/40" />

        <div className="relative z-10 grid gap-6 p-6 sm:p-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#E6A93C]/40 bg-[#10141E]/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              <Crown className="h-3.5 w-3.5" />
              <span>{activeTheme.name}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-[#E7E2D8] sm:text-4xl lg:text-5xl">
              Command Your Kingdom in 3D Ludo
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#E7E2D8]/80 sm:text-base">
              Lead four stylized 3D heroes from your courtyard bastion to the Royal Crown Sanctuary. Play instant offline matches against tactical AI or challenge players worldwide in live rooms.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => launchMode('vs_ai')}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[#E6A93C] px-5 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
              >
                <Bot className="h-4 w-4" />
                <span>{t.playAI}</span>
              </button>
              <button
                type="button"
                onClick={() => launchMode('pass_and_play')}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-lg border border-[#E7E2D8]/25 bg-[#10141E]/80 px-5 py-2.5 text-sm font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/60"
              >
                <Users className="h-4 w-4 text-[#E6A93C]" />
                <span>{t.playOffline}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('multiplayer')}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-lg border border-[#2563EB]/50 bg-[#2563EB]/20 px-5 py-2.5 text-sm font-semibold text-[#E7E2D8] transition hover:bg-[#2563EB]/35"
              >
                <Globe className="h-4 w-4 text-[#60A5FA]" />
                <span>Online Rooms</span>
              </button>
            </div>
          </div>

          {/* Active Commander & Crest Card */}
          <div className="rounded-xl border border-[#E7E2D8]/15 bg-[#10141E]/85 p-5">
            <div className="flex items-center gap-4">
              <img
                src={APP_CONFIG.kingdoms[activeHero.kingdom].crestUrl}
                alt={APP_CONFIG.kingdoms[activeHero.kingdom].name}
                className="h-16 w-16 rounded-xl border border-[#E6A93C]/40 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                  {profile.isGuest ? t.guestMode : 'Signed-in Commander'}
                </p>
                <h2 className="truncate font-display text-xl font-bold text-[#E7E2D8]">
                  {profile.displayName}
                </h2>
                <p className="truncate text-xs text-[#E7E2D8]/75">
                  Champion: {activeHero.name} ({activeHero.title})
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#1A2130] p-2.5">
                <div className="font-mono-num text-lg font-bold text-[#E6A93C]">
                  {profile.stats.wins}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/70">Wins</div>
              </div>
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#1A2130] p-2.5">
                <div className="font-mono-num text-lg font-bold text-[#E7E2D8]">
                  {profile.stats.matchesPlayed}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/70">Matches</div>
              </div>
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#1A2130] p-2.5">
                <div className="font-mono-num text-lg font-bold text-[#16A34A]">
                  {profile.stats.captures}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/70">Captures</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate('characters')}
                className="min-h-[40px] flex-1 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 py-2 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
              >
                Customize Hero
              </button>
              <button
                type="button"
                onClick={() => navigate('profile')}
                className="min-h-[40px] flex-1 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 py-2 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
              >
                {profile.isGuest ? 'Profile / Sign In' : 'View Profile'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Saved Match Banner (when offline match in progress) */}
      {savedMatchPreview && savedMatchPreview.phase !== 'GAME_OVER' && (
        <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#E6A93C]/50 bg-[#1A2130] p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
              Saved Match Ready
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-[#E7E2D8]">
              {savedMatchPreview.players.length}-Player{' '}
              {savedMatchPreview.mode === 'pass_and_play' ? 'Pass & Play' : 'Courtyard Skirmish'}
            </h2>
            <p className="mt-0.5 text-xs text-[#E7E2D8]/75">
              Turn #{savedMatchPreview.moveSeq + 1} — Active:{' '}
              {savedMatchPreview.players[savedMatchPreview.activeSeatIndex]?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void discardSavedMatch()}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 px-4 py-2 text-xs font-semibold text-[#FCA5A5] transition hover:bg-[#DC2626]/20"
            >
              <Trash2 className="h-4 w-4" />
              <span>Discard</span>
            </button>
            <button
              type="button"
              onClick={resumeSavedMatch}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#E6A93C] px-5 py-2 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
            >
              <Play className="h-4 w-4" />
              <span>{t.resumeMatch}</span>
            </button>
          </div>
        </section>
      )}

      {/* Primary Feature Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => launchMode('pass_and_play')}
          className="group rounded-xl border border-[#E7E2D8]/12 bg-[#1A2130] p-5 text-left transition hover:border-[#E6A93C]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#DC2626]/15 text-[#F87171]">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#E7E2D8] group-hover:text-[#E6A93C]">
            {t.playOffline}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/70">
            2 to 4 local players sharing one screen with full 3D camera rotation.
          </p>
        </button>

        <button
          type="button"
          onClick={() => launchMode('vs_ai')}
          className="group rounded-xl border border-[#E7E2D8]/12 bg-[#1A2130] p-5 text-left transition hover:border-[#E6A93C]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#60A5FA]">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#E7E2D8] group-hover:text-[#E6A93C]">
            {t.playAI}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/70">
            Challenge Easy, Medium, or Hard tactical bots offline anytime.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('multiplayer')}
          className="group rounded-xl border border-[#E7E2D8]/12 bg-[#1A2130] p-5 text-left transition hover:border-[#E6A93C]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#16A34A]/15 text-[#4ADE80]">
            <Swords className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#E7E2D8] group-hover:text-[#E6A93C]">
            {t.privateRoom} & Match
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/70">
            Host 6-character invite rooms or queue for live 2P / 4P matchmaking.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('boards')}
          className="group rounded-xl border border-[#E7E2D8]/12 bg-[#1A2130] p-5 text-left transition hover:border-[#E6A93C]/50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6A93C]/15 text-[#E6A93C]">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-[#E7E2D8] group-hover:text-[#E6A93C]">
            {t.boards}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/70">
            Switch between 6 handcrafted 3D environments including Sky Citadel.
          </p>
        </button>
      </section>

      {/* Practice Challenges & Quick Links */}
      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass className="h-5 w-5 text-[#E6A93C]" />
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">
                Practice Skirmish Challenges
              </h2>
            </div>
            <span className="text-xs font-medium text-[#E7E2D8]/60">Instant Launch</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PRACTICE_CHALLENGES.map((ch) => (
              <div
                key={ch.id}
                className="flex flex-col justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase text-[#E6A93C]">
                    <span>{ch.difficulty}</span>
                    <span>{ch.playerCount}P</span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-[#E7E2D8]">
                    {ch.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/70">
                    {ch.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => launchPracticeChallenge(ch.id)}
                  className="mt-4 min-h-[40px] w-full rounded-lg border border-[#E6A93C]/45 bg-[#1A2130] py-2 text-xs font-semibold text-[#E6A93C] transition hover:bg-[#E6A93C] hover:text-[#10141E]"
                >
                  Start Challenge
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Trophy className="h-5 w-5 text-[#E6A93C]" />
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">
                Royal Chronicle
              </h2>
            </div>
            <p className="mt-2 text-sm text-[#E7E2D8]/75">
              Inspect past match logs, capture counts, unlocked achievements, and your 12-hero collection.
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-3.5">
              <Shield className="h-5 w-5 text-[#16A34A]" />
              <div className="text-xs text-[#E7E2D8]/80">
                <strong className="text-[#E7E2D8]">
                  {profile.unlockedAchievements.length} / 6
                </strong>{' '}
                Kingdom Achievements Unlocked
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('chronicle')}
              className="min-h-[42px] rounded-lg border border-[#E7E2D8]/15 bg-[#10141E] px-4 py-2 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
            >
              View Chronicle
            </button>
            <button
              type="button"
              onClick={() => navigate('help')}
              className="min-h-[42px] rounded-lg border border-[#E7E2D8]/15 bg-[#10141E] px-4 py-2 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
            >
              Game Rules & Guide
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
