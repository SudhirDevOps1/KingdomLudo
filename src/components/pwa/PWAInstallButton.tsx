import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../services/pwa/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-lg border border-[#E6A93C]/50 bg-[#E6A93C]/15 px-3.5 py-2 text-xs font-semibold text-[#E6A93C] transition hover:bg-[#E6A93C]/25 focus-visible:outline-2 focus-visible:outline-[#E6A93C]"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-3 py-2 text-xs font-medium text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-[#E6A93C]/30 bg-[#1A2130] p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-[#E7E2D8]">
                Install on iPhone or iPad
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#E7E2D8]/80">
                1. Tap the <strong>Share</strong> button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#E6A93C] py-2.5 text-sm font-semibold text-[#10141E] transition hover:bg-[#D97706]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
