import React from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const ToastBanner: React.FC = () => {
  const message = useGameStore((s) => s.toastMessage);
  const clearToast = useGameStore((s) => s.clearToast);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-[#E6A93C]/45 bg-[#1A2130] px-4 py-3 text-sm text-[#E7E2D8] shadow-2xl"
    >
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={clearToast}
        aria-label="Dismiss notification"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#E7E2D8]/70 transition hover:bg-[#10141E] hover:text-[#E7E2D8]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
