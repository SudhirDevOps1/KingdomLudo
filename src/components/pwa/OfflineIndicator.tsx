import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../services/pwa/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-[#D97706]/50 bg-[#1A2130] px-3 py-2 text-xs font-medium text-[#E7E2D8] shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#E6A93C]" />
      <span>Offline Mode — Local saves active</span>
    </div>
  );
};
