import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { useGameStore, type LegalTab } from '../../store/gameStore';

export const Footer: React.FC = () => {
  const screen = useGameStore((s) => s.screen);
  const openLegal = useGameStore((s) => s.openLegal);
  const navigate = useGameStore((s) => s.navigate);

  if (screen === 'splash' || screen === 'onboarding' || screen === 'play') {
    return null;
  }

  const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, tab: LegalTab) => {
    e.preventDefault();
    openLegal(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-12 border-t border-[#E7E2D8]/10 bg-[#0B0F17]/90 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-[#E7E2D8]/60 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="font-display font-bold text-[#E7E2D8]/85">{APP_CONFIG.appName}</span>
          <span>·</span>
          <span className="font-mono-num">v{APP_CONFIG.version}</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} {APP_CONFIG.shortName}</span>
        </div>

        <nav aria-label="Legal and Footer Links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a
            href="/terms"
            onClick={(e) => handleLegalClick(e, 'terms')}
            className="transition hover:text-[#E6A93C]"
          >
            Terms of Service
          </a>
          <a
            href="/privacy"
            onClick={(e) => handleLegalClick(e, 'privacy')}
            className="transition hover:text-[#E6A93C]"
          >
            Privacy Policy
          </a>
          <a
            href="/cookies"
            onClick={(e) => handleLegalClick(e, 'cookies')}
            className="transition hover:text-[#E6A93C]"
          >
            Cookies & Storage
          </a>
          <a
            href="/fair-play"
            onClick={(e) => handleLegalClick(e, 'fair-play')}
            className="transition hover:text-[#E6A93C]"
          >
            Fair Play
          </a>
          <button
            type="button"
            onClick={() => navigate('help')}
            className="transition hover:text-[#E6A93C]"
          >
            Rules & Help
          </button>
        </nav>
      </div>
    </footer>
  );
};
