import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Camera,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  Dice6,
  Eye,
  HelpCircle,
  History,
  Home,
  Lock,
  MapPin,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Swords,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { APP_CONFIG } from '../../config/appConfig';
import { getCharacterById } from '../../data/characters';
import { getTranslations } from '../../data/i18n';
import { useGameStore } from '../../store/gameStore';
import {
  detectSoftwareWebGL,
  LudoBoardViewport,
  type CameraViewMode,
} from '../../three/boardScene';
import { Board2DFallback } from '../game/Board2DFallback';
import { HowToPlayModal } from '../game/HowToPlayModal';
import { RoomChatVoicePanel } from '../game/RoomChatVoicePanel';

export const ActiveGameView: React.FC = () => {
  const match = useGameStore((s) => s.activeMatch);
  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const settings = useGameStore((s) => s.settings);
  const isPaused = useGameStore((s) => s.isPaused);
  const rollDice = useGameStore((s) => s.rollDice);
  const selectPieceMove = useGameStore((s) => s.selectPieceMove);
  const togglePause = useGameStore((s) => s.togglePause);
  const exitActiveMatch = useGameStore((s) => s.exitActiveMatch);
  const startOfflineMatch = useGameStore((s) => s.startOfflineMatch);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const navigate = useGameStore((s) => s.navigate);

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<LudoBoardViewport | null>(null);

  const [webglAvailable] = useState(() => detectSoftwareWebGL().supported);
  const [contextLost, setContextLost] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('isometric');
  const [cameraLocked, setCameraLocked] = useState(false);
  const [showMoveLog, setShowMoveLog] = useState(false);
  const [showRoomChat, setShowRoomChat] = useState(false);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState<number | null>(null);
  const [exploreMode, setExploreMode] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const toggleExploreMode = () => {
    const next = !exploreMode;
    setExploreMode(next);
    viewportRef.current?.setExploreMode(next);
    if (!next) {
      setZenMode(false);
    }
  };

  const flyTo = (landmark: 'cascades' | 'citadel' | 'forest' | 'overview') => {
    viewportRef.current?.flyToLandmark(landmark);
  };

  const t = getTranslations(settings.language);
  const use2D = settings.prefer2DFallback || !webglAvailable || contextLost;

  // Ambient island & music lifecycle while inside active game view
  useEffect(() => {
    const startIfAllowed = () => {
      if (settings.soundEnabled && !settings.masterMuted) {
        soundEngine.startAmbience();
      }
    };
    startIfAllowed();
    window.addEventListener('pointerdown', startIfAllowed, { once: true });
    return () => {
      window.removeEventListener('pointerdown', startIfAllowed);
      soundEngine.stopAmbience();
    };
  }, [settings.soundEnabled, settings.masterMuted]);

  // Mount Three.js viewport inside dedicated ref container
  useEffect(() => {
    if (use2D || !match) return;
    const container = canvasMountRef.current;
    if (!container) return;

    const viewport = new LudoBoardViewport(
      container,
      match.boardThemeId,
      settings.graphicsQuality,
      settings.reducedMotion,
      {
        onDiceClick: () => void useGameStore.getState().rollDice(),
        onPieceClick: (seatIdx, pieceIdx) =>
          void useGameStore.getState().selectPieceMove(seatIdx, pieceIdx),
        onContextLost: () => setContextLost(true),
        onContextRestored: () => setContextLost(false),
      },
      settings.cinematicCamera,
      settings.cameraSensitivity,
    );
    viewportRef.current = viewport;
    viewport.syncMatchState(match);

    return () => {
      viewport.dispose();
      viewportRef.current = null;
    };
    // Intentionally recreate only when toggling 2D/3D or matchId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use2D, match?.matchId]);

  // Sync game state changes to active 3D scene
  useEffect(() => {
    if (match && viewportRef.current) {
      viewportRef.current.syncMatchState(match);
    }
  }, [match]);

  // Update quality, cinematic camera & sensitivity dynamically
  useEffect(() => {
    viewportRef.current?.setQuality(settings.graphicsQuality);
  }, [settings.graphicsQuality]);

  useEffect(() => {
    viewportRef.current?.setCinematicEnabled(settings.cinematicCamera);
    viewportRef.current?.setCameraSensitivity(settings.cameraSensitivity);
  }, [settings.cinematicCamera, settings.cameraSensitivity]);

  // Online turn countdown ticker
  useEffect(() => {
    const deadline = onlineRoom?.turnDeadlineAt;
    if (!deadline || !match || match.phase === 'GAME_OVER') {
      setTurnSecondsLeft(null);
      return;
    }
    const updateTimer = () => {
      const diff = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTurnSecondsLeft(diff);
    };
    updateTimer();
    const id = setInterval(updateTimer, 500);
    return () => clearInterval(id);
  }, [onlineRoom?.turnDeadlineAt, match?.phase, match]);

  // Keyboard shortcuts: Space=Roll, 1-4=Select legal piece, C=Cycle Camera, H=Reset Camera, Esc=Pause
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!match) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        togglePause();
        return;
      }
      if (e.code === 'Space' && match.phase === 'WAITING_ROLL' && !isPaused) {
        e.preventDefault();
        void rollDice();
        return;
      }
      if (['1', '2', '3', '4'].includes(e.key) && match.phase === 'WAITING_MOVE' && !isPaused) {
        const pieceIdx = (Number(e.key) - 1) as 0 | 1 | 2 | 3;
        void selectPieceMove(match.activeSeatIndex, pieceIdx);
        return;
      }
      if (e.key.toLowerCase() === 'c') {
        const order: CameraViewMode[] = ['isometric', 'top-down', 'follow'];
        const next = order[(order.indexOf(cameraMode) + 1) % order.length];
        setCameraMode(next);
        viewportRef.current?.setCameraMode(next);
      }
      if (e.key.toLowerCase() === 'h') {
        setCameraMode('isometric');
        viewportRef.current?.resetCamera();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [match, isPaused, cameraMode, rollDice, selectPieceMove, togglePause]);

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#10141E] p-6 text-center">
        <p className="text-sm text-[#E7E2D8]/80">No active match loaded.</p>
        <button
          type="button"
          onClick={() => navigate('home')}
          className="mt-4 min-h-[44px] rounded-lg bg-[#E6A93C] px-5 py-2.5 text-sm font-bold text-[#10141E]"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const activeSeat = match.players[match.activeSeatIndex];
  const activeHero = getCharacterById(activeSeat.characterId);
  const canRoll = match.phase === 'WAITING_ROLL' && activeSeat.type === 'human' && !isPaused;
  const canPickMove = match.phase === 'WAITING_MOVE' && activeSeat.type === 'human' && !isPaused;

  const cycleCamera = () => {
    const order: CameraViewMode[] = ['isometric', 'top-down', 'follow'];
    const next = order[(order.indexOf(cameraMode) + 1) % order.length];
    setCameraMode(next);
    viewportRef.current?.setCameraMode(next);
  };

  const toggleLock = () => {
    const next = !cameraLocked;
    setCameraLocked(next);
    viewportRef.current?.setCameraLocked(next);
  };

  const winnerSeat =
    match.winners.length > 0
      ? match.players.find((p) => p.color === match.winners[0])
      : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#10141E] select-none">
      {/* Full-bleed 3D Living Fantasy Island or 2D Fallback */}
      {use2D ? (
        <div className="h-full w-full p-4 pt-14">
          <Board2DFallback
            matchState={match}
            onDiceClick={() => void rollDice()}
            onPieceClick={(seatIdx, pieceIdx) => void selectPieceMove(seatIdx, pieceIdx)}
          />
        </div>
      ) : (
        <div
          ref={canvasMountRef}
          className="h-full w-full touch-none"
          aria-label="3D Living Fantasy Island Ludo Viewport"
        />
      )}

      {/* 4 Responsive Corner Player Cards with Embedded Dice Rollers (hidden in Zen Explore Mode) */}
      {!(exploreMode && zenMode) && match.players.map((player) => {
        const isCornerActive = player.seatIndex === match.activeSeatIndex;
        const isLocalHuman = player.type === 'human';
        const isRemoteHuman = player.type === 'remote';
        const hero = getCharacterById(player.characterId);
        const homePieces = player.pieces.filter((pc) => pc.progress === 56).length;
        const kMeta = APP_CONFIG.kingdoms[player.color];

        const cornerClasses: Record<string, string> = {
          red: 'top-14 left-2 sm:top-16 sm:left-4',
          blue: 'top-14 right-2 sm:top-16 sm:right-4',
          green: 'bottom-4 left-2 sm:bottom-4 sm:left-4',
          yellow: 'bottom-4 right-2 sm:bottom-4 sm:right-4',
        };

        return (
          <div
            key={player.seatIndex}
            className={`pointer-events-auto absolute ${
              cornerClasses[player.color]
            } z-20 flex w-[148px] flex-col rounded-2xl border p-2.5 transition-all duration-300 sm:w-[178px] sm:p-3 ${
              isCornerActive
                ? 'border-[#E6A93C] bg-[#1A2130]/95 shadow-[0_0_24px_rgba(230,169,60,0.75)] ring-2 ring-[#E6A93C]'
                : 'border-[#E7E2D8]/15 bg-[#10141E]/90 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: kMeta.hex }}
                />
                <span className="truncate text-xs font-bold text-[#E7E2D8]">{player.name}</span>
              </div>
              {isLocalHuman ? (
                <span className="shrink-0 rounded border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-300">
                  {match.mode === 'pass_and_play' ? `[P${player.seatIndex + 1}]` : '[HUMAN] [YOUR PLAYER]'}
                </span>
              ) : isRemoteHuman ? (
                <span className="shrink-0 rounded border border-purple-500/40 bg-purple-500/20 px-1.5 py-0.5 text-[8.5px] font-bold text-purple-300">
                  [ONLINE RIVAL]
                </span>
              ) : (
                <span className="shrink-0 rounded border border-blue-500/40 bg-blue-500/20 px-1.5 py-0.5 text-[8.5px] font-bold text-blue-300">
                  [COMPUTER] [{(player.aiDifficulty || 'medium').toUpperCase()} AI]
                </span>
              )}
            </div>

            <div className="mt-0.5 truncate text-[11px] text-[#E6A93C]">
              {hero.name} <span className="text-[10px] text-[#E7E2D8]/60">({hero.title})</span>
            </div>

            {isCornerActive && (
              <div
                className={`mt-1 flex items-center justify-center rounded py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse ${
                  isLocalHuman
                    ? 'bg-[#E6A93C]/20 text-[#E6A93C]'
                    : isRemoteHuman
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {isLocalHuman ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <Crown className="h-3 w-3" />
                    <span>YOUR TURN</span>
                  </span>
                ) : isRemoteHuman ? (
                  <span className="inline-flex items-center justify-center gap-1">
                    <Swords className="h-3 w-3" />
                    <span>RIVAL TURN</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-1">
                    <Bot className="h-3 w-3" />
                    <span>BOT THINKING</span>
                  </span>
                )}
              </div>
            )}

            {/* Progress dots & Embedded Corner Dice */}
            <div className="mt-2 flex items-center justify-between gap-1 border-t border-[#E7E2D8]/10 pt-1.5">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={`h-2 w-2 rounded-full border border-black/40 ${
                      idx < homePieces ? 'bg-[#E6A93C]' : 'bg-[#10141E]/80'
                    }`}
                    title={`Hero ${idx + 1} ${idx < homePieces ? 'Crowned' : 'In Field'}`}
                  />
                ))}
                <span className="font-mono-num ml-0.5 text-[10px] text-[#E6A93C]">{homePieces}/4</span>
              </div>

              {/* Interactive Corner Dice Roller */}
              {isCornerActive ? (
                match.phase === 'WAITING_ROLL' ? (
                  isLocalHuman ? (
                    <button
                      type="button"
                      onClick={() => void rollDice()}
                      className="flex animate-bounce items-center gap-1 rounded-lg border border-[#E6A93C] bg-[#E6A93C] px-2 py-0.5 text-[11px] font-bold text-[#10141E] shadow-md transition hover:bg-[#D97706]"
                      title="Roll Dice (or press Space)"
                    >
                      <Dice6 className="h-3.5 w-3.5" />
                      <span>ROLL</span>
                    </button>
                  ) : isRemoteHuman ? (
                    <div className="flex items-center gap-1 rounded-lg border border-purple-400/40 bg-purple-950/60 px-2 py-0.5 text-[10px] font-semibold text-purple-200">
                      <Dice6 className="h-3 w-3 animate-spin text-purple-300" />
                      <span>Rolling...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 rounded-lg border border-blue-400/40 bg-blue-950/60 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                      <Dice6 className="h-3 w-3 animate-spin text-blue-300" />
                      <span>Thinking...</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1 rounded-lg border border-[#E6A93C]/60 bg-[#10141E] px-2 py-0.5 font-mono-num text-xs font-bold text-[#E6A93C]">
                    <Dice6 className="h-3.5 w-3.5" />
                    <span>{match.currentDice ?? '—'}</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[#E7E2D8]/45">
                  <Dice6 className="h-3 w-3 opacity-40" />
                  <span>Idle</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Minimal Top HUD Strip (Solid dark slate — no backdrop-blur over WebGL) */}
      <div className="safe-top pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2.5 sm:p-3.5">
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[#E7E2D8]/15 bg-[#10141E]/95 px-3 py-1.5 shadow-xl">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-sm"
            style={{ backgroundColor: APP_CONFIG.kingdoms[activeSeat.color].hex }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate text-xs font-bold text-[#E7E2D8]">
              <span>{activeSeat.name}</span>
              <span className="font-normal text-[#E6A93C]">({activeHero.name})</span>
              {activeSeat.type === 'human' ? (
                <span className="rounded bg-emerald-500/20 px-1 text-[9px] text-emerald-400">YOU</span>
              ) : activeSeat.type === 'remote' ? (
                <span className="rounded bg-purple-500/20 px-1 text-[9px] text-purple-300">RIVAL</span>
              ) : (
                <span className="rounded bg-blue-500/20 px-1 text-[9px] text-blue-300">BOT</span>
              )}
            </div>
            <div className="truncate text-[11px] text-[#E7E2D8]/70">
              {match.phase === 'WAITING_ROLL'
                ? activeSeat.type === 'human'
                  ? 'Tap corner dice or central 3D dice (Space)'
                  : activeSeat.type === 'remote'
                  ? `Waiting for ${activeSeat.name} to roll...`
                  : 'AI Bot is thinking...'
                : match.phase === 'WAITING_MOVE'
                  ? activeSeat.type === 'human'
                    ? t.selectPiece
                    : activeSeat.type === 'remote'
                    ? `${activeSeat.name} is choosing a piece to move...`
                    : 'AI Bot is choosing move...'
                  : 'Match Complete'}
            </div>
          </div>
          {turnSecondsLeft !== null && (
            <span className="font-mono-num ml-1 rounded-md border border-[#E6A93C]/40 bg-[#1A2130] px-2 py-0.5 text-xs font-bold text-[#E6A93C]">
              {turnSecondsLeft}s
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
          {!use2D && (
            <>
              <button
                type="button"
                onClick={toggleExploreMode}
                title={exploreMode ? 'Return to Board Play' : 'Explore Living Island (360°)'}
                aria-label="Explore Living Island"
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition ${
                  exploreMode
                    ? 'border-[#E6A93C] bg-[#E6A93C]/20 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]'
                }`}
              >
                <Compass className="h-4 w-4 text-[#E6A93C]" />
                <span className="hidden sm:inline">{exploreMode ? 'Exit Explore' : 'Explore'}</span>
              </button>
              <button
                type="button"
                onClick={() => void updateSettings({ cinematicCamera: !settings.cinematicCamera })}
                title="Toggle Cinematic Focus"
                aria-label="Toggle Cinematic Focus"
                className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition ${
                  settings.cinematicCamera
                    ? 'border-[#E6A93C]/60 bg-[#10141E]/95 text-[#E6A93C]'
                    : 'border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8]/60'
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cycleCamera}
                title="Cycle Camera (C)"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 px-2.5 text-xs font-semibold text-[#E7E2D8] hover:border-[#E6A93C]"
              >
                <Camera className="h-4 w-4 text-[#E6A93C]" />
                <span className="hidden capitalize sm:inline">{cameraMode}</span>
              </button>
              <button
                type="button"
                onClick={() => viewportRef.current?.zoomIn()}
                title="Zoom In"
                aria-label="Zoom In"
                className="hidden min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C] sm:flex"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => viewportRef.current?.zoomOut()}
                title="Zoom Out"
                aria-label="Zoom Out"
                className="hidden min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C] sm:flex"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraMode('isometric');
                  viewportRef.current?.resetCamera();
                }}
                title="Reset Camera (H)"
                aria-label="Reset Camera"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleLock}
                title={cameraLocked ? 'Unlock Camera' : 'Lock Camera'}
                aria-label={cameraLocked ? 'Unlock Camera' : 'Lock Camera'}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
              >
                {cameraLocked ? <Lock className="h-4 w-4 text-[#E6A93C]" /> : <Unlock className="h-4 w-4" />}
              </button>
            </>
          )}

          {webglAvailable && (
            <button
              type="button"
              onClick={() => void updateSettings({ prefer2DFallback: !settings.prefer2DFallback })}
              title="Toggle 2D / 3D Board View"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 px-2.5 text-xs font-semibold text-[#E7E2D8] hover:border-[#E6A93C]"
            >
              <Eye className="h-4 w-4 text-[#E6A93C]" />
              <span>{use2D ? '3D' : '2D'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) {
                void document.exitFullscreen();
              } else {
                void document.documentElement.requestFullscreen();
              }
            }}
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {onlineRoom && (
            <button
              type="button"
              onClick={() => setShowRoomChat(!showRoomChat)}
              title="Room Chat & Voice"
              aria-label="Toggle Room Chat and Voice"
              className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition ${
                showRoomChat
                  ? 'border-[#E6A93C] bg-[#E6A93C]/20 text-[#E6A93C]'
                  : 'border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMoveLog(!showMoveLog)}
            aria-label="Toggle Move Log"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
          >
            <History className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            title="How to Play & Rules Guide"
            aria-label="How to Play"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
          >
            <HelpCircle className="h-4 w-4 text-[#E6A93C]" />
          </button>

          <button
            type="button"
            onClick={() => togglePause(true)}
            aria-label="Pause Match"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/95 text-[#E7E2D8] hover:border-[#E6A93C]"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Living Island 360° Explorer Landmark Toolbar */}
      {exploreMode && (
        <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center p-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#E6A93C] bg-[#10141E]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E6A93C]">
              <Compass className="h-4 w-4 animate-spin text-[#E6A93C]" />
              <span>Explore Island:</span>
            </span>
            <button
              type="button"
              onClick={() => flyTo('cascades')}
              className="rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-3 py-1 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:bg-[#E6A93C] hover:text-[#10141E]"
            >
              🌊 Cascades & Shore
            </button>
            <button
              type="button"
              onClick={() => flyTo('citadel')}
              className="rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-3 py-1 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:bg-[#E6A93C] hover:text-[#10141E]"
            >
              🏰 Royal Citadel
            </button>
            <button
              type="button"
              onClick={() => flyTo('forest')}
              className="rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-3 py-1 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:bg-[#E6A93C] hover:text-[#10141E]"
            >
              🌲 Whispering Pines
            </button>
            <button
              type="button"
              onClick={() => flyTo('overview')}
              className="rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-3 py-1 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:bg-[#E6A93C] hover:text-[#10141E]"
            >
              🌐 Full Island
            </button>
            <div className="mx-1 hidden h-4 w-[1px] bg-white/20 sm:block" />
            <button
              type="button"
              onClick={() => setZenMode(!zenMode)}
              className={`rounded-lg border px-3 py-1 text-xs font-bold transition ${
                zenMode
                  ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                  : 'border-[#E7E2D8]/25 bg-[#1A2130] text-[#E7E2D8] hover:border-[#E6A93C]'
              }`}
            >
              {zenMode ? 'Show HUD' : 'Zen View (Full Screen)'}
            </button>
            <button
              type="button"
              onClick={toggleExploreMode}
              className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500 hover:text-white"
            >
              ✕ Exit
            </button>
          </div>
        </div>
      )}

      {/* Non-intrusive Floating Move Selection Bar (appears only when human has legal moves to pick) */}
      {!exploreMode && canPickMove && (
        <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center p-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-[#E6A93C] bg-[#10141E]/95 px-5 py-2.5 shadow-2xl backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E6A93C]">
              {t.selectPiece}:
            </span>
            <div className="flex flex-wrap gap-2">
              {match.legalMoves.map((mv) => (
                <button
                  key={mv.pieceIndex}
                  type="button"
                  onClick={() => void selectPieceMove(match.activeSeatIndex, mv.pieceIndex)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#E6A93C]/60 bg-[#1A2130] px-4 text-xs font-bold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:bg-[#E6A93C] hover:text-[#10141E]"
                >
                  <span>Hero #{mv.pieceIndex + 1}</span>
                  {mv.capturedPieces.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-extrabold text-amber-400">
                      (<Swords className="h-3 w-3" /> Capture!)
                    </span>
                  )}
                  {mv.reachesHome && (
                    <span className="inline-flex items-center gap-1 font-extrabold text-yellow-400">
                      (<Crown className="h-3 w-3" /> Crown!)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Online Room Chat & Voice Drawer */}
      {onlineRoom && showRoomChat && (
        <aside className="absolute right-4 top-16 z-30 w-80 max-w-[calc(100vw-2rem)] shadow-2xl">
          <RoomChatVoicePanel compact />
        </aside>
      )}

      {/* Move Log Drawer */}
      {showMoveLog && (
        <aside className="absolute right-4 top-16 z-30 max-h-[60vh] w-80 overflow-y-auto rounded-2xl border border-[#E7E2D8]/15 bg-[#1A2130] p-4 shadow-2xl">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-[#E6A93C]">
            Courtyard Move Chronicle
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-[#E7E2D8]/80">
            {[...match.moveLog].reverse().map((entry) => (
              <li
                key={entry.seq}
                className="rounded-lg border border-[#E7E2D8]/10 bg-[#10141E] px-3 py-2"
              >
                <span className="font-mono-num mr-1.5 text-[#E6A93C]">#{entry.seq}</span>
                <strong>{entry.playerName}</strong> rolled {entry.diceValue} —{' '}
                {entry.action === 'move'
                  ? `moved Hero #${(entry.pieceIndex ?? 0) + 1}${entry.capturedCount ? ` (captured ${entry.capturedCount})` : ''}${entry.reachedHome ? ' (Crown!)' : ''}`
                  : entry.action.replace(/_/g, ' ')}
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#E6A93C]/40 bg-[#1A2130] p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-[#E7E2D8]">
              Match Paused
            </h2>
            <p className="mt-2 text-xs text-[#E7E2D8]/75">
              Offline matches auto-save locally so you can resume anytime from the Courtyard Hub.
            </p>
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => togglePause(false)}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#E6A93C] text-sm font-bold text-[#10141E] hover:bg-[#D97706]"
              >
                <Play className="h-4 w-4" />
                <span>Resume Match</span>
              </button>
              <button
                type="button"
                onClick={exitActiveMatch}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] text-sm font-semibold text-[#E7E2D8] hover:border-[#E6A93C]/50"
              >
                <Home className="h-4 w-4" />
                <span>{t.backToHub}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Celebration Overlay */}
      {match.phase === 'GAME_OVER' && winnerSeat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#E6A93C]/60 bg-[#1A2130] p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E6A93C]/60 bg-[#10141E] text-[#E6A93C]">
              <Crown className="h-9 w-9" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#E6A93C]">
              {t.victory}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-[#E7E2D8]">
              {winnerSeat.name} Claims the Crown!
            </h2>
            <p className="mt-2 text-sm text-[#E7E2D8]/75">
              {APP_CONFIG.kingdoms[winnerSeat.color].name} —{' '}
              {getCharacterById(winnerSeat.characterId).name}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#10141E] p-3">
                <div className="font-mono-num text-lg font-bold text-[#E6A93C]">
                  {winnerSeat.stats.capturesMade}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/65">Captures</div>
              </div>
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#10141E] p-3">
                <div className="font-mono-num text-lg font-bold text-[#E7E2D8]">
                  {winnerSeat.stats.sixesRolled}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/65">Sixes</div>
              </div>
              <div className="rounded-lg border border-[#E7E2D8]/10 bg-[#10141E] p-3">
                <div className="font-mono-num text-lg font-bold text-[#16A34A]">
                  {winnerSeat.stats.turnsTaken}
                </div>
                <div className="text-[11px] text-[#E7E2D8]/65">Turns</div>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={exitActiveMatch}
                className="min-h-[44px] flex-1 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] text-sm font-semibold text-[#E7E2D8] hover:border-[#E6A93C]"
              >
                {t.backToHub}
              </button>
              {match.mode !== 'online_private' && match.mode !== 'online_public' && (
                <button
                  type="button"
                  onClick={() => void startOfflineMatch()}
                  className="min-h-[44px] flex-1 rounded-lg bg-[#E6A93C] text-sm font-bold text-[#10141E] hover:bg-[#D97706]"
                >
                  {t.playAgain}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Island Exploration Mode POI Overlay Banner */}
      {exploreMode && !use2D && (
        <div className="safe-top pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center p-2">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#E6A93C]/60 bg-[#10141E]/95 px-5 py-2.5 text-xs shadow-2xl">
            <span className="flex items-center gap-1 font-bold text-[#E6A93C]">
              <Compass className="h-4 w-4" />
              <span>Living Island Exploration</span>
            </span>
            <span className="hidden text-[#E7E2D8]/40 sm:inline">|</span>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#E7E2D8]/80">
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-300">🌊 Cascades & Shore</span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">🏰 Royal Citadel</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">🌲 Whispering Pines</span>
            </div>
            <button
              type="button"
              onClick={toggleExploreMode}
              className="ml-1 rounded-md border border-[#E6A93C]/50 bg-[#E6A93C] px-2.5 py-1 text-[11px] font-bold text-[#10141E] hover:bg-[#FDE047]"
            >
              Back to Game
            </button>
          </div>
        </div>
      )}

      {/* Interactive Step-by-Step How To Play Modal */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
