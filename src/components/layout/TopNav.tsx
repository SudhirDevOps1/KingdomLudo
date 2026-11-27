import React from 'react';
import { HelpCircle } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { getTranslations } from '../../data/i18n';
import { generateDiceBearAvatarUri } from '../../services/avatar/dicebearService';
import { useGameStore, type AppScreen } from '../../store/gameStore';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export const TopNav: React.FC = () => {
  const screen = useGameStore((s) => s.screen);
  const navigate = useGameStore((s) => s.navigate);
  const profile = useGameStore((s) => s.profile);
  const language = useGameStore((s) => s.settings.language);
  const t = getTranslations(language);

  if (screen === 'splash' || screen === 'onboarding' || screen === 'play') {
    return null;
  }

  const navItems: Array<{ id: AppScreen; label: string }> = [
    { id: 'home', label: t.home },
    { id: 'characters', label: t.characters },
    { id: 'boards', label: t.boards },
    { id: 'chronicle', label: t.history },
    { id: 'settings', label: t.settings },
  ];

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-[#E7E2D8]/12 bg-[#10141E]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex min-h-[40px] shrink-0 items-center gap-2.5 whitespace-nowrap text-left focus-visible:outline-2 focus-visible:outline-[#E6A93C]"
        >
          <span className="flex h-9 w-9 overflow-hidden rounded-lg border border-[#E6A93C]/50 bg-[#10141E]">
            <img
              src={APP_CONFIG.assets.appEmblem}
              alt={APP_CONFIG.shortName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="font-display text-base font-bold tracking-wide text-[#E7E2D8] sm:text-lg">
            {APP_CONFIG.shortName}
          </span>
        </button>

        <nav aria-label="Primary Navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`min-h-[40px] whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[#E6A93C] ${
                  active
                    ? 'bg-[#1A2130] text-[#E6A93C] border border-[#E6A93C]/35'
                    : 'text-[#E7E2D8]/80 hover:bg-[#1A2130]/70 hover:text-[#E7E2D8]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={() => navigate('help')}
            aria-label="Help and Rules"
            className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-[#E6A93C] ${
              screen === 'help'
                ? 'border-[#E6A93C]/50 bg-[#1A2130] text-[#E6A93C]'
                : 'border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8]/80 hover:border-[#E6A93C]/40 hover:text-[#E7E2D8]'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('profile')}
            className={`flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-[#E6A93C] ${
              screen === 'profile'
                ? 'border-[#E6A93C]/60 bg-[#1A2130] text-[#E6A93C]'
                : 'border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8] hover:border-[#E6A93C]/45'
            }`}
          >
            <img
              src={generateDiceBearAvatarUri(profile.avatarStyle ?? 'adventurer', profile.avatarSeed ?? profile.displayName, 40)}
              alt={profile.displayName}
              className="h-5 w-5 rounded-full border border-[#E6A93C]/50 bg-[#10141E]"
            />
            <span className="max-w-[110px] truncate">{profile.displayName}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('setup')}
            className="min-h-[40px] whitespace-nowrap rounded-lg bg-[#E6A93C] px-4 py-2 text-xs font-bold text-[#10141E] transition hover:bg-[#D97706] focus-visible:outline-2 focus-visible:outline-[#E7E2D8]"
          >
            Play Now
          </button>
        </div>
      </div>

      {/* Mobile bottom-strip navigation row */}
      <nav
        aria-label="Mobile Navigation"
        className="flex items-center justify-around border-t border-[#E7E2D8]/10 px-2 py-1.5 md:hidden"
      >
        {navItems.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`min-h-[38px] whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                active ? 'bg-[#1A2130] text-[#E6A93C]' : 'text-[#E7E2D8]/75'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
