import React from 'react';
import { Check, Layers } from 'lucide-react';
import { BOARD_THEMES } from '../../data/boardThemes';
import { useGameStore } from '../../store/gameStore';

export const BoardsView: React.FC = () => {
  const selectedThemeId = useGameStore((s) => s.settings.selectedBoardThemeId);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const showToast = useGameStore((s) => s.showToast);

  const selectTheme = async (themeId: string, name: string) => {
    await updateSettings({ selectedBoardThemeId: themeId });
    showToast(`Active board theme set to ${name}`);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
          3D Courtyard & Board Themes
        </h1>
        <p className="mt-1 text-sm text-[#E7E2D8]/75">
          Select an atmospheric 3D lighting, stone, and tabletop environment. Royal Enchanted Courtyard is the flagship default.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {BOARD_THEMES.map((theme) => {
          const active = theme.id === selectedThemeId;
          return (
            <div
              key={theme.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                active
                  ? 'border-[#E6A93C] bg-[#1A2130] shadow-xl'
                  : 'border-[#E7E2D8]/12 bg-[#1A2130]/80 hover:border-[#E6A93C]/45'
              }`}
            >
              <div>
                {/* Color Swatch Preview */}
                <div
                  className="relative flex h-28 items-end justify-between overflow-hidden rounded-xl border border-[#E7E2D8]/15 p-3"
                  style={{
                    background: `linear-gradient(135deg, ${theme.skyHex} 0%, ${theme.tabletopHex} 60%, ${theme.plinthHex} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-5 w-5 rounded-sm border border-white/30"
                      style={{ backgroundColor: theme.plinthHex }}
                      title="Plinth Stone"
                    />
                    <span
                      className="h-5 w-5 rounded-sm border border-white/30"
                      style={{ backgroundColor: theme.trackLightHex }}
                      title="Track Tile"
                    />
                    <span
                      className="h-5 w-5 rounded-sm border border-white/30"
                      style={{ backgroundColor: theme.goldTrimHex }}
                      title="Gold Trim"
                    />
                  </div>
                  {theme.isDefault && (
                    <span className="rounded-sm bg-[#10141E]/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E6A93C]">
                      Flagship Default
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#E6A93C]" />
                  <h2 className="font-display text-lg font-bold text-[#E7E2D8]">
                    {theme.name}
                  </h2>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/75">
                  {theme.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void selectTheme(theme.id, theme.name)}
                className={`mt-5 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${
                  active
                    ? 'bg-[#E6A93C] text-[#10141E]'
                    : 'border border-[#E7E2D8]/20 bg-[#10141E] text-[#E7E2D8] hover:border-[#E6A93C]/60'
                }`}
              >
                {active && <Check className="h-4 w-4" />}
                <span>{active ? 'Active Environment' : 'Select Environment'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
};
