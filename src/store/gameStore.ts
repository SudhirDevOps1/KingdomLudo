import { create } from 'zustand';
import { soundEngine } from '../audio/soundEngine';
import { APP_CONFIG } from '../config/appConfig';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHARACTERS, getCharacterById } from '../data/characters';
import type { SupportedLanguage } from '../data/i18n';
import { chooseBestAIMove } from '../engine/aiEngine';
import {
  applyDiceRoll,
  applyPieceMove,
  createInitialMatchState,
  rollCryptoDie,
  RULE_PRESETS,
  type SeatSetupInput,
} from '../engine/ludoEngine';
import type {
  AIDifficulty,
  KingdomColor,
  MatchState,
  RuleConfig,
} from '../engine/types';
import {
  localPersistence,
  type StoredMatchHistoryItem,
  type StoredProfile,
  type StoredSettings,
} from '../persistence/localPersistence';
import { triggerHapticImpact } from '../platform/capacitorBridge';
import {
  getCurrentSupabaseUser,
  getOrCreateGuestSession,
  onSupabaseAuthStateChange,
  signInWithEmail,
  signInWithGoogle,
  signOutSupabase,
  signUpWithEmail,
  updateGuestDisplayName,
  type GuestSession,
} from '../services/auth/authService';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase/supabaseClient';
import type {
  ClientToServerMessage,
  RoomSnapshot,
  ServerToClientMessage,
} from '../shared/protocol';
import type { GraphicsQuality } from '../three/boardScene';

export type AppScreen =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'setup'
  | 'characters'
  | 'boards'
  | 'multiplayer'
  | 'play'
  | 'chronicle'
  | 'profile'
  | 'settings'
  | 'help';

export type ChronicleTab = 'history' | 'stats' | 'achievements' | 'collection';
export type SettingsTab = 'general' | 'audio' | 'graphics' | 'language' | 'privacy' | 'database';

export interface SetupDraft {
  mode: 'pass_and_play' | 'vs_ai' | 'practice';
  playerCount: 2 | 3 | 4;
  aiDifficulty: AIDifficulty;
  rulePreset: 'classic_kingdom' | 'standard';
  rules: RuleConfig;
  boardThemeId: string;
  seats: SeatSetupInput[];
}

function createClientId(): string {
  const existing = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ck_client_id') : null;
  if (existing) return existing;
  const fresh =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    sessionStorage.setItem('ck_client_id', fresh);
  } catch {
    // ignore
  }
  return fresh;
}

const DEFAULT_PROFILE: StoredProfile = {
  profileId: 'guest_local',
  isGuest: true,
  displayName: 'Royal Commander',
  email: null,
  selectedCharacterId: 'ignis-drake',
  equippedCustomizations: {
    'ignis-drake': { outfitId: 'royal-guard', skinId: 'classic' },
  },
  stats: {
    wins: 0,
    matchesPlayed: 0,
    captures: 0,
    sixesRolled: 0,
    hardAiWins: 0,
  },
  unlockedAchievements: [],
  onboardingCompleted: false,
};

const DEFAULT_SETTINGS: StoredSettings = {
  soundEnabled: true,
  masterMuted: false,
  sfxVolume: 0.75,
  musicVolume: 0.45,
  ambientVolume: 0.55,
  hapticsEnabled: true,
  graphicsQuality: 'medium',
  prefer2DFallback: false,
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  cinematicCamera: true,
  cameraSensitivity: 1.0,
  language: APP_CONFIG.defaultLanguage,
  selectedBoardThemeId: APP_CONFIG.defaultThemeId,
  analyticsOptIn: false,
  fullscreenPreferred: false,
};

const DEFAULT_SETUP: SetupDraft = {
  mode: 'vs_ai',
  playerCount: 4,
  aiDifficulty: 'medium',
  rulePreset: 'classic_kingdom',
  rules: { ...RULE_PRESETS.classic_kingdom },
  boardThemeId: APP_CONFIG.defaultThemeId,
  seats: [
    { color: 'red', name: 'Royal Commander', type: 'human', characterId: 'ignis-drake', outfitId: 'royal-guard', skinId: 'classic' },
    { color: 'blue', name: 'Fenris Bot', type: 'ai', aiDifficulty: 'medium', aiPersonality: 'tactician', characterId: 'glacier-lupus', outfitId: 'royal-guard', skinId: 'classic' },
    { color: 'yellow', name: 'Leander Bot', type: 'ai', aiDifficulty: 'medium', aiPersonality: 'aggressive', characterId: 'auric-leo', outfitId: 'royal-guard', skinId: 'classic' },
    { color: 'green', name: 'Bambooz Bot', type: 'ai', aiDifficulty: 'medium', aiPersonality: 'guardian', characterId: 'bamboo-warden', outfitId: 'royal-guard', skinId: 'classic' },
  ],
};

interface GameStore {
  initialized: boolean;
  screen: AppScreen;
  chronicleTab: ChronicleTab;
  settingsTab: SettingsTab;
  profile: StoredProfile;
  settings: StoredSettings;
  setupDraft: SetupDraft;
  savedMatchPreview: MatchState | null;
  activeMatch: MatchState | null;
  matchHistory: StoredMatchHistoryItem[];
  isPaused: boolean;
  supabaseReady: boolean;
  guestSession: GuestSession;
  authBusy: boolean;
  authError: string | null;
  toastMessage: string | null;

  // Online Multiplayer State
  wsConnected: boolean;
  wsConnecting: boolean;
  clientId: string;
  onlineRoom: RoomSnapshot | null;
  queueStatus: { inQueue: boolean; position: number; preferredPlayers: 2 | 4; queuedCount: number } | null;
  pendingDeepLinkRoom: string | null;

  // Actions
  bootstrap: () => Promise<void>;
  navigate: (screen: AppScreen) => void;
  setChronicleTab: (tab: ChronicleTab) => void;
  setSettingsTab: (tab: SettingsTab) => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
  completeOnboarding: () => Promise<void>;

  // Profile & Auth
  updateDisplayName: (name: string) => Promise<void>;
  equipCharacter: (characterId: string, outfitId: string, skinId: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<boolean>;
  signUpEmail: (email: string, pass: string, displayName: string) => Promise<boolean>;
  signOutGoogle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetLocalData: () => Promise<void>;
  reloadStoreState: () => Promise<void>;

  // Settings
  updateSettings: (patch: Partial<StoredSettings>) => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  setGraphicsQuality: (quality: GraphicsQuality) => Promise<void>;

  // Setup & Offline Match
  updateSetupDraft: (patch: Partial<SetupDraft>) => void;
  startOfflineMatch: (overrideDraft?: SetupDraft) => Promise<void>;
  resumeSavedMatch: () => void;
  discardSavedMatch: () => Promise<void>;
  rollDice: () => Promise<void>;
  selectPieceMove: (seatIndex: number, pieceIndex: 0 | 1 | 2 | 3) => Promise<void>;
  togglePause: (paused?: boolean) => void;
  exitActiveMatch: () => void;
  flushActiveMatchSave: () => Promise<void>;

  // Online Multiplayer
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  createPrivateRoom: (maxPlayers: 2 | 3 | 4, rules: RuleConfig) => void;
  joinPrivateRoom: (roomCode: string) => void;
  setRoomReady: (ready: boolean) => void;
  startPrivateRoom: () => void;
  leavePrivateRoom: () => void;
  joinPublicQueue: (preferredPlayers: 2 | 4) => void;
  leavePublicQueue: () => void;
  setPendingDeepLinkRoom: (code: string | null) => void;
}

let wsInstance: WebSocket | null = null;
let aiTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function clearAiTimer() {
  if (aiTimeoutHandle) {
    clearTimeout(aiTimeoutHandle);
    aiTimeoutHandle = null;
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const sendWs = (msg: ClientToServerMessage) => {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      get().connectWebSocket();
      setTimeout(() => {
        if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
          wsInstance.send(JSON.stringify(msg));
        } else {
          get().showToast('Unable to reach multiplayer server. Check connection.');
        }
      }, 450);
      return;
    }
    wsInstance.send(JSON.stringify(msg));
  };

  const finalizeCompletedMatch = async (match: MatchState) => {
    await localPersistence.clearActiveMatch();

    const firstSeat = match.players[0];
    const winnerColor = match.winners[0] ?? 'red';
    const winnerSeat = match.players.find((p) => p.color === winnerColor);
    const humanWon =
      match.mode === 'vs_ai' || match.mode === 'practice'
        ? firstSeat?.color === winnerColor
        : true;
    const hardAiBeaten =
      (match.mode === 'vs_ai' || match.mode === 'practice') &&
      humanWon &&
      match.players.some((p) => p.type === 'ai' && p.aiDifficulty === 'hard');

    const totalCaptures = match.players
      .filter((p) => p.type === 'human')
      .reduce((acc, p) => acc + p.stats.capturesMade, 0);
    const totalSixes = match.players
      .filter((p) => p.type === 'human')
      .reduce((acc, p) => acc + p.stats.sixesRolled, 0);

    const item: StoredMatchHistoryItem = {
      matchId: match.matchId,
      mode: match.mode,
      boardThemeId: match.boardThemeId,
      winnerColor,
      winnerName: winnerSeat?.name ?? winnerColor.toUpperCase(),
      playerCount: match.players.length,
      capturesMade: totalCaptures,
      sixesRolled: totalSixes,
      durationMs: (match.finishedAt ?? Date.now()) - match.startedAt,
      completedAt: match.finishedAt ?? Date.now(),
      humanWon,
      hardAiBeaten,
    };

    await localPersistence.saveMatchHistory(item);
    const history = await localPersistence.listMatchHistory(30);

    const prevProfile = get().profile;
    const nextStats = {
      wins: prevProfile.stats.wins + (humanWon ? 1 : 0),
      matchesPlayed: prevProfile.stats.matchesPlayed + 1,
      captures: prevProfile.stats.captures + totalCaptures,
      sixesRolled: prevProfile.stats.sixesRolled + totalSixes,
      hardAiWins: prevProfile.stats.hardAiWins + (hardAiBeaten ? 1 : 0),
    };

    const unlocked = new Set(prevProfile.unlockedAchievements);
    for (const ach of ACHIEVEMENTS) {
      if (nextStats[ach.metricKey] >= ach.targetValue) {
        unlocked.add(ach.id);
      }
    }

    const updatedProfile: StoredProfile = {
      ...prevProfile,
      stats: nextStats,
      unlockedAchievements: Array.from(unlocked),
    };

    await localPersistence.saveProfile(updatedProfile);
    set({
      savedMatchPreview: null,
      matchHistory: history,
      profile: updatedProfile,
    });

    if (!updatedProfile.isGuest && updatedProfile.uid && isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        void Promise.resolve(
          supabase.from('matches').insert({
            room_code: null,
            mode: item.mode,
            board_theme_id: item.boardThemeId,
            winner_color: item.winnerColor,
            player_count: item.playerCount,
            duration_ms: item.durationMs,
          }),
        ).catch(() => {});
      }
    }
  };

  const scheduleAiIfNeeded = (match: MatchState) => {
    clearAiTimer();
    if (match.mode === 'online_private' || match.mode === 'online_public') return;
    if (match.phase === 'GAME_OVER') return;

    const activeSeat = match.players[match.activeSeatIndex];
    if (!activeSeat || activeSeat.type !== 'ai') return;

    aiTimeoutHandle = setTimeout(() => {
      const current = get().activeMatch;
      if (!current || current.phase === 'GAME_OVER' || get().isPaused) return;
      const seat = current.players[current.activeSeatIndex];
      if (!seat || seat.type !== 'ai') return;

      if (current.phase === 'WAITING_ROLL') {
        const dice = rollCryptoDie();
        soundEngine.playDiceRoll();
        if (dice === 6) {
          setTimeout(() => soundEngine.playSixCelebration(), 360);
        }
        const rolled = applyDiceRoll(current, current.activeSeatIndex, dice);
        set({ activeMatch: rolled });
        void localPersistence.saveActiveMatch(rolled);
        scheduleAiIfNeeded(rolled);
      } else if (current.phase === 'WAITING_MOVE' && current.legalMoves.length > 0) {
        const chosen = chooseBestAIMove(current, current.activeSeatIndex);
        const { nextState, executedMove } = applyPieceMove(
          current,
          current.activeSeatIndex,
          chosen.pieceIndex,
        );
        if (executedMove.capturedPieces.length > 0) soundEngine.playCapture();
        else if (executedMove.reachesHome) soundEngine.playHomeEntry();
        else if (executedMove.landsOnSafeZone) soundEngine.playSafeZone();
        else soundEngine.playHop(executedMove.toProgress);

        if (nextState.phase === 'GAME_OVER') {
          soundEngine.playVictory();
          void finalizeCompletedMatch(nextState);
        } else {
          void localPersistence.saveActiveMatch(nextState);
          if (nextState.phase === 'WAITING_ROLL' && nextState.players[nextState.activeSeatIndex]?.type === 'human') {
            soundEngine.playTurnAlert();
          }
          scheduleAiIfNeeded(nextState);
        }
        set({ activeMatch: nextState });
      }
    }, 620);
  };

  return {
    initialized: false,
    screen: 'splash',
    chronicleTab: 'history',
    settingsTab: 'general',
    profile: DEFAULT_PROFILE,
    settings: DEFAULT_SETTINGS,
    setupDraft: DEFAULT_SETUP,
    savedMatchPreview: null,
    activeMatch: null,
    matchHistory: [],
    isPaused: false,
    supabaseReady: isSupabaseConfigured(),
    guestSession: getOrCreateGuestSession(),
    authBusy: false,
    authError: null,
    toastMessage: null,

    wsConnected: false,
    wsConnecting: false,
    clientId: createClientId(),
    onlineRoom: null,
    queueStatus: null,
    pendingDeepLinkRoom: null,

    bootstrap: async () => {
      if (get().initialized) return;
      await localPersistence.init();

      const guest = getOrCreateGuestSession();
      const [savedProfile, savedSettings, savedActiveMatch, history] = await Promise.all([
        localPersistence.loadProfile(),
        localPersistence.loadSettings(),
        localPersistence.loadActiveMatch(),
        localPersistence.listMatchHistory(30),
      ]);

      const profile = savedProfile ?? DEFAULT_PROFILE;
      const settings: StoredSettings = { ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) };
      soundEngine.configure({
        enabled: settings.soundEnabled,
        masterMuted: settings.masterMuted,
        sfxVolume: settings.sfxVolume,
        musicVolume: settings.musicVolume,
        ambientVolume: settings.ambientVolume,
      });

      set({
        initialized: true,
        guestSession: guest,
        supabaseReady: isSupabaseConfigured(),
        profile,
        settings,
        savedMatchPreview: savedActiveMatch,
        matchHistory: history,
        setupDraft: {
          ...get().setupDraft,
          boardThemeId: settings.selectedBoardThemeId,
          seats: get().setupDraft.seats.map((s, idx) =>
            idx === 0
              ? {
                  ...s,
                  name: profile.displayName,
                  characterId: profile.selectedCharacterId,
                  outfitId:
                    profile.equippedCustomizations[profile.selectedCharacterId]?.outfitId ??
                    'royal-guard',
                  skinId:
                    profile.equippedCustomizations[profile.selectedCharacterId]?.skinId ??
                    'classic',
                }
              : s,
          ),
        },
      });

      onSupabaseAuthStateChange(async (_event, session) => {
        if (!session?.user) return;
        const u = session.user;
        const curr = get().profile;
        const merged: StoredProfile = {
          ...curr,
          isGuest: false,
          uid: u.id,
          displayName: u.user_metadata?.display_name || curr.displayName,
          email: u.email || null,
        };
        await localPersistence.saveProfile(merged);
        set({ profile: merged });
      });
    },

    navigate: (screen) => {
      soundEngine.playUiClick();
      set({ screen });
    },

    setChronicleTab: (chronicleTab) => set({ chronicleTab }),
    setSettingsTab: (settingsTab) => set({ settingsTab }),

    showToast: (toastMessage) => {
      set({ toastMessage });
      setTimeout(() => {
        if (get().toastMessage === toastMessage) {
          set({ toastMessage: null });
        }
      }, 3600);
    },

    clearToast: () => set({ toastMessage: null }),

    completeOnboarding: async () => {
      const next = { ...get().profile, onboardingCompleted: true };
      await localPersistence.saveProfile(next);
      set({ profile: next, screen: 'home' });
    },

    reloadStoreState: async () => {
      const [savedProfile, savedSettings, savedActiveMatch, history] = await Promise.all([
        localPersistence.loadProfile(),
        localPersistence.loadSettings(),
        localPersistence.loadActiveMatch(),
        localPersistence.listMatchHistory(30),
      ]);

      const profile = savedProfile ?? DEFAULT_PROFILE;
      const settings: StoredSettings = { ...DEFAULT_SETTINGS, ...(savedSettings ?? {}) };
      soundEngine.configure({
        enabled: settings.soundEnabled,
        masterMuted: settings.masterMuted,
        sfxVolume: settings.sfxVolume,
        musicVolume: settings.musicVolume,
        ambientVolume: settings.ambientVolume,
      });

      set({
        profile,
        settings,
        savedMatchPreview: savedActiveMatch,
        matchHistory: history,
      });
    },

    updateDisplayName: async (rawName) => {
      const displayName = rawName.trim().slice(0, 48) || 'Royal Commander';
      const next: StoredProfile = { ...get().profile, displayName };
      await localPersistence.saveProfile(next);
      updateGuestDisplayName(displayName);
      set({ profile: next });

      if (!next.isGuest && next.uid && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void Promise.resolve(
            supabase
              .from('profiles')
              .update({ display_name: displayName, updated_at: new Date().toISOString() })
              .eq('id', next.uid),
          ).catch(() => {});
        }
      }
    },

    equipCharacter: async (characterId, outfitId, skinId) => {
      const char = getCharacterById(characterId);
      const curr = get().profile;
      const next: StoredProfile = {
        ...curr,
        selectedCharacterId: char.id,
        equippedCustomizations: {
          ...curr.equippedCustomizations,
          [char.id]: { outfitId, skinId },
        },
      };
      await localPersistence.saveProfile(next);

      const updatedSeats = get().setupDraft.seats.map((seat, idx) =>
        idx === 0 ? { ...seat, characterId: char.id, outfitId, skinId } : seat,
      );

      set({
        profile: next,
        setupDraft: { ...get().setupDraft, seats: updatedSeats },
      });
      get().showToast(`Equipped ${char.name} (${char.title})`);

      if (!next.isGuest && next.uid && isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          void Promise.resolve(
            supabase
              .from('profiles')
              .update({ selected_character_id: char.id, updated_at: new Date().toISOString() })
              .eq('id', next.uid),
          ).catch(() => {});
        }
      }
    },

    signInGoogle: async () => {
      set({ authBusy: true, authError: null });
      try {
        const { url, error } = await signInWithGoogle();
        if (error) throw error;
        if (url && typeof window !== 'undefined') {
          window.location.href = url;
        }
        set({ authBusy: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google sign-in failed';
        set({ authBusy: false, authError: message });
        get().showToast(message);
      }
    },

    signInEmail: async (email: string, pass: string): Promise<boolean> => {
      set({ authBusy: true, authError: null });
      try {
        const { user, error } = await signInWithEmail(email, pass);
        if (error) throw error;
        if (user) {
          const curr = get().profile;
          const next: StoredProfile = {
            ...curr,
            isGuest: false,
            uid: user.id,
            displayName: user.user_metadata?.display_name || curr.displayName,
            email: user.email || null,
          };
          await localPersistence.saveProfile(next);
          set({ profile: next, authBusy: false });
          get().showToast(`Welcome back, ${next.displayName}!`);
          return true;
        }
        set({ authBusy: false });
        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-in failed';
        set({ authBusy: false, authError: message });
        get().showToast(message);
        return false;
      }
    },

    signUpEmail: async (email: string, pass: string, displayName: string): Promise<boolean> => {
      set({ authBusy: true, authError: null });
      try {
        const { user, error } = await signUpWithEmail(email, pass, displayName);
        if (error) throw error;
        if (user) {
          const curr = get().profile;
          const next: StoredProfile = {
            ...curr,
            isGuest: false,
            uid: user.id,
            displayName,
            email: user.email || null,
          };
          await localPersistence.saveProfile(next);
          set({ profile: next, authBusy: false });
          get().showToast(`Account registered for ${displayName}! Check email to confirm.`);
          return true;
        }
        set({ authBusy: false });
        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-up failed';
        set({ authBusy: false, authError: message });
        get().showToast(message);
        return false;
      }
    },

    signOutGoogle: async () => {
      await signOutSupabase();
      const curr = get().profile;
      const next: StoredProfile = {
        ...curr,
        isGuest: true,
        uid: undefined,
        email: null,
      };
      await localPersistence.saveProfile(next);
      set({ profile: next });
      get().showToast('Returned to Guest Mode');
    },

    deleteAccount: async () => {
      await signOutSupabase();
      const resetProfile = { ...DEFAULT_PROFILE, onboardingCompleted: true };
      await localPersistence.saveProfile(resetProfile);
      set({ profile: resetProfile });
      get().showToast('Signed out and guest profile restored.');
    },

    resetLocalData: async () => {
      await localPersistence.clearActiveMatch();
      const freshProfile = { ...DEFAULT_PROFILE, onboardingCompleted: true };
      await localPersistence.saveProfile(freshProfile);
      await localPersistence.saveSettings(DEFAULT_SETTINGS);
      set({
        profile: freshProfile,
        settings: DEFAULT_SETTINGS,
        savedMatchPreview: null,
        matchHistory: [],
      });
      get().showToast('Local saves and preferences cleared.');
    },

    updateSettings: async (patch) => {
      const next = { ...get().settings, ...patch };
      soundEngine.configure({
        enabled: next.soundEnabled,
        masterMuted: next.masterMuted,
        sfxVolume: next.sfxVolume,
        musicVolume: next.musicVolume,
        ambientVolume: next.ambientVolume,
      });
      await localPersistence.saveSettings(next);
      set({
        settings: next,
        setupDraft: {
          ...get().setupDraft,
          boardThemeId: next.selectedBoardThemeId,
        },
      });
    },

    setLanguage: async (language) => {
      await get().updateSettings({ language });
    },

    setGraphicsQuality: async (graphicsQuality) => {
      await get().updateSettings({ graphicsQuality });
    },

    updateSetupDraft: (patch) => {
      set({ setupDraft: { ...get().setupDraft, ...patch } });
    },

    startOfflineMatch: async (overrideDraft) => {
      clearAiTimer();
      const draft = overrideDraft ?? get().setupDraft;
      const seats = draft.seats.slice(0, draft.playerCount).map((seat, idx) => {
        if (draft.mode === 'pass_and_play') {
          return {
            ...seat,
            type: 'human' as const,
            name: seat.name.replace(' Bot', '') || `Player ${idx + 1}`,
          };
        }
        return {
          ...seat,
          type: idx === 0 ? ('human' as const) : ('ai' as const),
          aiDifficulty: draft.aiDifficulty,
        };
      });

      const match = createInitialMatchState({
        matchId: `match_${Date.now()}`,
        mode: draft.mode,
        boardThemeId: draft.boardThemeId,
        rules: draft.rules,
        seats,
      });

      await localPersistence.saveActiveMatch(match);
      set({
        activeMatch: match,
        savedMatchPreview: match,
        isPaused: false,
        screen: 'play',
      });
      scheduleAiIfNeeded(match);
    },

    resumeSavedMatch: () => {
      const saved = get().savedMatchPreview;
      if (!saved) return;
      set({ activeMatch: saved, isPaused: false, screen: 'play' });
      scheduleAiIfNeeded(saved);
    },

    discardSavedMatch: async () => {
      await localPersistence.clearActiveMatch();
      set({ savedMatchPreview: null });
    },

    rollDice: async () => {
      const match = get().activeMatch;
      if (!match || match.phase !== 'WAITING_ROLL' || get().isPaused) return;

      if (match.mode === 'online_private' || match.mode === 'online_public') {
        const room = get().onlineRoom;
        if (!room) return;
        soundEngine.playDiceRoll();
        void triggerHapticImpact('light', get().settings.hapticsEnabled);
        sendWs({
          type: 'match:roll',
          roomCode: room.roomCode,
          clientId: get().clientId,
          expectedSeq: match.moveSeq,
        });
        return;
      }

      const activeSeat = match.players[match.activeSeatIndex];
      if (!activeSeat || activeSeat.type !== 'human') return;

      const dice = rollCryptoDie();
      soundEngine.playDiceRoll();
      if (dice === 6) {
        setTimeout(() => soundEngine.playSixCelebration(), 360);
      }
      void triggerHapticImpact('medium', get().settings.hapticsEnabled);

      const next = applyDiceRoll(match, match.activeSeatIndex, dice);
      set({ activeMatch: next });
      await localPersistence.saveActiveMatch(next);
      scheduleAiIfNeeded(next);
    },

    selectPieceMove: async (seatIndex, pieceIndex) => {
      const match = get().activeMatch;
      if (!match || match.phase !== 'WAITING_MOVE' || get().isPaused) return;
      if (seatIndex !== match.activeSeatIndex) return;
      if (!match.legalMoves.some((m) => m.pieceIndex === pieceIndex)) return;

      if (match.mode === 'online_private' || match.mode === 'online_public') {
        const room = get().onlineRoom;
        if (!room) return;
        sendWs({
          type: 'match:move',
          roomCode: room.roomCode,
          clientId: get().clientId,
          pieceIndex,
          expectedSeq: match.moveSeq,
        });
        return;
      }

      const activeSeat = match.players[seatIndex];
      if (!activeSeat || activeSeat.type !== 'human') return;

      const { nextState, executedMove } = applyPieceMove(match, seatIndex, pieceIndex);

      if (executedMove.capturedPieces.length > 0) {
        soundEngine.playCapture();
        void triggerHapticImpact('heavy', get().settings.hapticsEnabled);
      } else if (executedMove.reachesHome) {
        soundEngine.playHomeEntry();
        void triggerHapticImpact('medium', get().settings.hapticsEnabled);
      } else if (executedMove.landsOnSafeZone) {
        soundEngine.playSafeZone();
      } else {
        soundEngine.playHop(executedMove.toProgress);
      }

      set({ activeMatch: nextState });

      if (nextState.phase === 'GAME_OVER') {
        soundEngine.playVictory();
        await finalizeCompletedMatch(nextState);
      } else {
        await localPersistence.saveActiveMatch(nextState);
        if (nextState.phase === 'WAITING_ROLL' && nextState.players[nextState.activeSeatIndex]?.type === 'human') {
          soundEngine.playTurnAlert();
        }
        scheduleAiIfNeeded(nextState);
      }
    },

    togglePause: (paused) => {
      const nextPaused = typeof paused === 'boolean' ? paused : !get().isPaused;
      set({ isPaused: nextPaused });
      if (!nextPaused && get().activeMatch) {
        scheduleAiIfNeeded(get().activeMatch!);
      } else {
        clearAiTimer();
      }
    },

    exitActiveMatch: () => {
      clearAiTimer();
      const curr = get().activeMatch;
      if (
        curr &&
        curr.phase !== 'GAME_OVER' &&
        curr.mode !== 'online_private' &&
        curr.mode !== 'online_public'
      ) {
        void localPersistence.saveActiveMatch(curr);
        set({ savedMatchPreview: curr });
      }
      set({ activeMatch: null, isPaused: false, screen: 'home' });
    },

    flushActiveMatchSave: async () => {
      const curr = get().activeMatch;
      if (
        curr &&
        curr.phase !== 'GAME_OVER' &&
        curr.mode !== 'online_private' &&
        curr.mode !== 'online_public'
      ) {
        await localPersistence.saveActiveMatch(curr);
      }
    },

    connectWebSocket: () => {
      if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
        return;
      }
      set({ wsConnecting: true });

      const customUrl = import.meta.env.VITE_WS_URL;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = customUrl || `${proto}//${window.location.host}/ws`;

      const ws = new WebSocket(url);
      wsInstance = ws;

      ws.onopen = () => {
        set({ wsConnected: true, wsConnecting: false });
        const room = get().onlineRoom;
        if (room) {
          sendWs({
            type: 'match:reconnect',
            roomCode: room.roomCode,
            clientId: get().clientId,
          });
        }
      };

      ws.onclose = () => {
        set({ wsConnected: false, wsConnecting: false });
      };

      ws.onerror = () => {
        set({ wsConnected: false, wsConnecting: false });
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as ServerToClientMessage;
          if (msg.type === 'error') {
            get().showToast(msg.message);
            return;
          }
          if (msg.type === 'queue:status') {
            set({
              queueStatus: {
                inQueue: msg.inQueue,
                position: msg.position,
                preferredPlayers: msg.preferredPlayers,
                queuedCount: msg.queuedCount,
              },
            });
            return;
          }
          if (msg.type === 'queue:matched') {
            set({ queueStatus: null });
            get().showToast(`Match found! Room ${msg.roomCode}`);
            return;
          }
          if (msg.type === 'room:snapshot' || msg.type === 'match:event') {
            const room = msg.room;
            const prevScreen = get().screen;
            const nextState: Partial<GameStore> = { onlineRoom: room };

            if (room.matchState) {
              // Mark remote vs local seats accurately for the viewer
              const myClientId = get().clientId;
              const hydratedMatch: MatchState = {
                ...room.matchState,
                players: room.matchState.players.map((p, idx) => ({
                  ...p,
                  type: room.seats[idx]?.clientId === myClientId ? 'human' : 'remote',
                })),
              };
              nextState.activeMatch = hydratedMatch;
              if (room.status === 'playing' && prevScreen === 'multiplayer') {
                nextState.screen = 'play';
              }
              if (hydratedMatch.phase === 'GAME_OVER') {
                soundEngine.playVictory();
                void finalizeCompletedMatch(hydratedMatch);
              } else if (msg.type === 'match:event' && msg.event === 'dice_rolled') {
                soundEngine.playDiceRoll();
              } else if (msg.type === 'match:event' && msg.event === 'piece_moved') {
                soundEngine.playHop(0);
              }
            }
            set(nextState);
          }
        } catch {
          // ignore malformed packet
        }
      };
    },

    disconnectWebSocket: () => {
      if (wsInstance) {
        wsInstance.close();
        wsInstance = null;
      }
      set({ wsConnected: false, wsConnecting: false });
    },

    createPrivateRoom: (maxPlayers, rules) => {
      get().connectWebSocket();
      const { profile, settings, clientId } = get();
      const eq = profile.equippedCustomizations[profile.selectedCharacterId] ?? {
        outfitId: 'royal-guard',
        skinId: 'classic',
      };
      sendWs({
        type: 'room:create',
        clientId,
        playerName: profile.displayName,
        userId: profile.uid,
        characterId: profile.selectedCharacterId,
        outfitId: eq.outfitId,
        skinId: eq.skinId,
        boardThemeId: settings.selectedBoardThemeId,
        maxPlayers,
        rules,
      });
    },

    joinPrivateRoom: (roomCode) => {
      get().connectWebSocket();
      const { profile, clientId } = get();
      const eq = profile.equippedCustomizations[profile.selectedCharacterId] ?? {
        outfitId: 'royal-guard',
        skinId: 'classic',
      };
      sendWs({
        type: 'room:join',
        roomCode: roomCode.trim().toUpperCase(),
        clientId,
        playerName: profile.displayName,
        userId: profile.uid,
        characterId: profile.selectedCharacterId,
        outfitId: eq.outfitId,
        skinId: eq.skinId,
      });
    },

    setRoomReady: (ready) => {
      const room = get().onlineRoom;
      if (!room) return;
      sendWs({
        type: 'room:ready',
        roomCode: room.roomCode,
        clientId: get().clientId,
        ready,
      });
    },

    startPrivateRoom: () => {
      const room = get().onlineRoom;
      if (!room) return;
      sendWs({
        type: 'room:start',
        roomCode: room.roomCode,
        clientId: get().clientId,
      });
    },

    leavePrivateRoom: () => {
      const room = get().onlineRoom;
      if (!room) return;
      sendWs({
        type: 'room:leave',
        roomCode: room.roomCode,
        clientId: get().clientId,
      });
      set({ onlineRoom: null });
    },

    joinPublicQueue: (preferredPlayers) => {
      get().connectWebSocket();
      const { profile, clientId } = get();
      const eq = profile.equippedCustomizations[profile.selectedCharacterId] ?? {
        outfitId: 'royal-guard',
        skinId: 'classic',
      };
      sendWs({
        type: 'queue:join',
        clientId,
        playerName: profile.displayName,
        userId: profile.uid,
        characterId: profile.selectedCharacterId,
        outfitId: eq.outfitId,
        skinId: eq.skinId,
        preferredPlayers,
      });
    },

    leavePublicQueue: () => {
      sendWs({
        type: 'queue:leave',
        clientId: get().clientId,
      });
      set({ queueStatus: null });
    },

    setPendingDeepLinkRoom: (pendingDeepLinkRoom) => set({ pendingDeepLinkRoom }),
  };
});

// Helper export for UI cards showing character summary
export function getAllCharacterIds(): string[] {
  return CHARACTERS.map((c) => c.id);
}
