import React from 'react';
import { Award, BarChart3, Clock, Shield } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { ACHIEVEMENTS } from '../../data/achievements';
import { CHARACTERS } from '../../data/characters';
import { useGameStore, type ChronicleTab } from '../../store/gameStore';

export const ChronicleView: React.FC = () => {
  const chronicleTab = useGameStore((s) => s.chronicleTab);
  const setChronicleTab = useGameStore((s) => s.setChronicleTab);
  const profile = useGameStore((s) => s.profile);
  const matchHistory = useGameStore((s) => s.matchHistory);
  const navigate = useGameStore((s) => s.navigate);

  const tabs: Array<{ id: ChronicleTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'history', label: 'Match History', icon: Clock },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'collection', label: 'Character Collection', icon: Shield },
  ];

  const winRate =
    profile.stats.matchesPlayed > 0
      ? Math.round((profile.stats.wins / profile.stats.matchesPlayed) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
            Royal Chronicle
          </h1>
          <p className="mt-1 text-sm text-[#E7E2D8]/75">
            Track completed matches, combat statistics, kingdom achievements, and champion collection
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = chronicleTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChronicleTab(tab.id)}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                    : 'border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8]/80 hover:border-[#E6A93C]/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {chronicleTab === 'history' && (
        <section className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          {matchHistory.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#E7E2D8]/75">
                No completed matches recorded yet. Finish a Courtyard match to log your chronicle!
              </p>
              <button
                type="button"
                onClick={() => navigate('setup')}
                className="mt-4 min-h-[42px] rounded-lg bg-[#E6A93C] px-5 py-2 text-xs font-bold text-[#10141E]"
              >
                Start a Match
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((item) => (
                <div
                  key={item.matchId}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E7E2D8]/12 bg-[#10141E] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: APP_CONFIG.kingdoms[item.winnerColor].hex }}
                    />
                    <div>
                      <div className="font-display text-sm font-bold text-[#E7E2D8]">
                        Winner: {item.winnerName} ({item.playerCount}P {item.mode.replace('_', ' ')})
                      </div>
                      <div className="text-xs text-[#E7E2D8]/65">
                        {new Date(item.completedAt).toLocaleString()} — {Math.round(item.durationMs / 1000)}s
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 font-mono-num text-xs">
                    <span className="text-[#E6A93C]">{item.capturesMade} Captures</span>
                    <span className="text-[#E7E2D8]/80">{item.sixesRolled} Sixes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {chronicleTab === 'stats' && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Wins', value: profile.stats.wins, color: 'text-[#E6A93C]' },
            { label: 'Matches Played', value: profile.stats.matchesPlayed, color: 'text-[#E7E2D8]' },
            { label: 'Win Rate', value: `${winRate}%`, color: 'text-[#4ADE80]' },
            { label: 'Total Captures', value: profile.stats.captures, color: 'text-[#F87171]' },
            { label: 'Sixes Rolled', value: profile.stats.sixesRolled, color: 'text-[#60A5FA]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6"
            >
              <div className={`font-mono-num text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70">
                {stat.label}
              </div>
            </div>
          ))}
        </section>
      )}

      {chronicleTab === 'achievements' && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((ach) => {
            const currentVal = profile.stats[ach.metricKey];
            const unlocked = profile.unlockedAchievements.includes(ach.id) || currentVal >= ach.targetValue;
            const pct = Math.min(100, Math.round((currentVal / ach.targetValue) * 100));
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-5 ${
                  unlocked
                    ? 'border-[#E6A93C] bg-[#1A2130]'
                    : 'border-[#E7E2D8]/12 bg-[#1A2130]/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase">
                  <span className="text-[#E6A93C]">{ach.category}</span>
                  <span className={unlocked ? 'text-[#4ADE80]' : 'text-[#E7E2D8]/50'}>
                    {unlocked ? 'Unlocked' : `${currentVal}/${ach.targetValue}`}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-bold text-[#E7E2D8]">
                  {ach.title}
                </h2>
                <p className="mt-1 text-xs text-[#E7E2D8]/75">{ach.description}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-sm bg-[#10141E]">
                  <div
                    className="h-full bg-[#E6A93C] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {chronicleTab === 'collection' && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHARACTERS.map((char) => {
            const unlocked = profile.stats.wins >= char.unlockCostWins;
            const kMeta = APP_CONFIG.kingdoms[char.kingdom];
            return (
              <div
                key={char.id}
                className="rounded-xl border border-[#E7E2D8]/12 bg-[#1A2130] p-4"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="h-3.5 w-3.5 rounded-sm"
                    style={{ backgroundColor: kMeta.hex }}
                  />
                  <span className={`text-[11px] font-bold ${unlocked ? 'text-[#4ADE80]' : 'text-[#E6A93C]'}`}>
                    {unlocked ? 'Unlocked' : `${char.unlockCostWins} Wins`}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-[#E7E2D8]">
                  {char.name}
                </h3>
                <p className="text-xs text-[#E6A93C]">{char.title}</p>
                <button
                  type="button"
                  onClick={() => navigate('characters')}
                  className="mt-4 min-h-[36px] w-full rounded-md border border-[#E7E2D8]/15 bg-[#10141E] text-xs font-semibold text-[#E7E2D8] hover:border-[#E6A93C]/50"
                >
                  Inspect in Wardrobe
                </button>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
};
