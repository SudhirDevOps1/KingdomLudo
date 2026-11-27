/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastBanner } from './components/common/ToastBanner';
import { Footer } from './components/layout/Footer';
import { TopNav } from './components/layout/TopNav';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { ActiveGameView } from './components/views/ActiveGameView';
import { BoardsView } from './components/views/BoardsView';
import { CharactersView } from './components/views/CharactersView';
import { ChronicleView } from './components/views/ChronicleView';
import { HomeHub } from './components/views/HomeHub';
import { LegalView } from './components/views/LegalView';
import { MatchSetupView } from './components/views/MatchSetupView';
import { MultiplayerView } from './components/views/MultiplayerView';
import { ProfileView } from './components/views/ProfileView';
import { HelpAndAboutView, SettingsView } from './components/views/SettingsAndHelpView';
import { OnboardingView, SplashScreen } from './components/views/SplashAndOnboarding';
import { initCapacitorLifecycle } from './platform/capacitorBridge';
import { useGameStore } from './store/gameStore';

function AppShell() {
  const screen = useGameStore((s) => s.screen);
  const bootstrap = useGameStore((s) => s.bootstrap);
  const setPendingDeepLinkRoom = useGameStore((s) => s.setPendingDeepLinkRoom);
  const navigate = useGameStore((s) => s.navigate);
  const flushActiveMatchSave = useGameStore((s) => s.flushActiveMatchSave);
  const showToast = useGameStore((s) => s.showToast);

  useEffect(() => {
    void bootstrap();
    const cleanup = initCapacitorLifecycle({
      onBackButton: () => {
        const curr = useGameStore.getState();
        if (curr.screen === 'play') {
          curr.togglePause(true);
          return true;
        }
        if (curr.screen !== 'home' && curr.screen !== 'splash') {
          curr.navigate('home');
          return true;
        }
        return false;
      },
      onNetworkChange: (connected) => {
        if (!connected) {
          showToast('Offline detected — local saves remain active.');
        }
      },
      onBackgroundPause: () => {
        void flushActiveMatchSave();
      },
      onDeepLinkRoom: (roomCode) => {
        setPendingDeepLinkRoom(roomCode);
        if (useGameStore.getState().initialized) {
          navigate('multiplayer');
        }
      },
    });
    return cleanup;
  }, [bootstrap, flushActiveMatchSave, navigate, setPendingDeepLinkRoom, showToast]);

  return (
    <div className="flex min-h-screen flex-col bg-[#10141E] text-[#E7E2D8]">
      <TopNav />
      <div className="flex-1">
        {screen === 'splash' && <SplashScreen />}
        {screen === 'onboarding' && <OnboardingView />}
        {screen === 'home' && <HomeHub />}
        {screen === 'setup' && <MatchSetupView />}
        {screen === 'characters' && <CharactersView />}
        {screen === 'boards' && <BoardsView />}
        {screen === 'multiplayer' && <MultiplayerView />}
        {screen === 'play' && <ActiveGameView />}
        {screen === 'chronicle' && <ChronicleView />}
        {screen === 'profile' && <ProfileView />}
        {screen === 'settings' && <SettingsView />}
        {screen === 'help' && <HelpAndAboutView />}
        {screen === 'legal' && <LegalView />}
      </div>
      <Footer />
      <OfflineIndicator />
      <ToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
