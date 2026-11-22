import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface PlatformBridgeCallbacks {
  onBackButton: () => boolean;
  onNetworkChange: (connected: boolean) => void;
  onBackgroundPause: () => void;
  onDeepLinkRoom: (roomCode: string) => void;
}

export async function triggerHapticImpact(
  style: 'light' | 'medium' | 'heavy' = 'medium',
  enabled = true,
): Promise<void> {
  if (!enabled) return;
  if (Capacitor.isNativePlatform()) {
    try {
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: map[style] });
      return;
    } catch {
      // Fallback to web vibrate below
    }
  }
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(style === 'heavy' ? 40 : style === 'medium' ? 20 : 10);
    } catch {
      // ignore
    }
  }
}

export function extractRoomCodeFromUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl, 'https://kingdomludo.local');
    const queryRoom = parsed.searchParams.get('room');
    if (queryRoom && /^[A-Z0-9]{6}$/i.test(queryRoom)) {
      return queryRoom.toUpperCase();
    }
    const match = parsed.pathname.match(/\/room\/([A-Z0-9]{6})/i);
    return match ? match[1].toUpperCase() : null;
  } catch {
    return null;
  }
}

export function initCapacitorLifecycle(callbacks: PlatformBridgeCallbacks): () => void {
  const cleanups: Array<() => void> = [];

  if (typeof window !== 'undefined') {
    const initialRoom = extractRoomCodeFromUrl(window.location.href);
    if (initialRoom) {
      callbacks.onDeepLinkRoom(initialRoom);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        callbacks.onBackgroundPause();
      }
    };
    const onPageHide = () => callbacks.onBackgroundPause();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    cleanups.push(() => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    });
  }

  if (Capacitor.isNativePlatform()) {
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: '#10141E' }).catch(() => {});
    void SplashScreen.hide().catch(() => {});

    const backSub = CapApp.addListener('backButton', ({ canGoBack }) => {
      const handled = callbacks.onBackButton();
      if (!handled && !canGoBack) {
        void CapApp.exitApp();
      }
    });

    const stateSub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        callbacks.onBackgroundPause();
      }
    });

    const urlSub = CapApp.addListener('appUrlOpen', ({ url }) => {
      const code = extractRoomCodeFromUrl(url);
      if (code) callbacks.onDeepLinkRoom(code);
    });

    const netSub = Network.addListener('networkStatusChange', (status) => {
      callbacks.onNetworkChange(status.connected);
    });

    cleanups.push(() => {
      void backSub.then((h) => h.remove());
      void stateSub.then((h) => h.remove());
      void urlSub.then((h) => h.remove());
      void netSub.then((h) => h.remove());
    });
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
