import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Globe, KeyRound, Play, Users, Wifi, WifiOff } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { CHARACTERS, getCharacterById } from '../../data/characters';
import { RULE_PRESETS } from '../../engine/ludoEngine';
import { useGameStore } from '../../store/gameStore';

export const MultiplayerView: React.FC = () => {
  const profile = useGameStore((s) => s.profile);
  const updateDisplayName = useGameStore((s) => s.updateDisplayName);
  const equipCharacter = useGameStore((s) => s.equipCharacter);
  const wsConnected = useGameStore((s) => s.wsConnected);
  const wsConnecting = useGameStore((s) => s.wsConnecting);
  const clientId = useGameStore((s) => s.clientId);
  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const queueStatus = useGameStore((s) => s.queueStatus);
  const pendingDeepLinkRoom = useGameStore((s) => s.pendingDeepLinkRoom);
  const setPendingDeepLinkRoom = useGameStore((s) => s.setPendingDeepLinkRoom);
  const createPrivateRoom = useGameStore((s) => s.createPrivateRoom);
  const joinPrivateRoom = useGameStore((s) => s.joinPrivateRoom);
  const setRoomReady = useGameStore((s) => s.setRoomReady);
  const startPrivateRoom = useGameStore((s) => s.startPrivateRoom);
  const leavePrivateRoom = useGameStore((s) => s.leavePrivateRoom);
  const joinPublicQueue = useGameStore((s) => s.joinPublicQueue);
  const leavePublicQueue = useGameStore((s) => s.leavePublicQueue);
  const showToast = useGameStore((s) => s.showToast);
  const navigate = useGameStore((s) => s.navigate);

  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [joinCode, setJoinCode] = useState(pendingDeepLinkRoom ?? '');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOnlyCode, setCopiedOnlyCode] = useState(false);
  const [nameInput, setNameInput] = useState(profile.displayName || 'Royal Commander');

  useEffect(() => {
    setNameInput(profile.displayName);
  }, [profile.displayName]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== profile.displayName) {
      void updateDisplayName(trimmed);
      showToast(`Commander name updated to "${trimmed}"`);
    }
  };

  useEffect(() => {
    if (pendingDeepLinkRoom) {
      setJoinCode(pendingDeepLinkRoom);
      setPendingDeepLinkRoom(null);
    }
  }, [pendingDeepLinkRoom, setPendingDeepLinkRoom]);

  const copyRoomCodeOnly = async (roomCode: string) => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedOnlyCode(true);
      showToast(`Room code ${roomCode} copied!`);
      setTimeout(() => setCopiedOnlyCode(false), 2000);
    } catch {
      showToast(`Room code: ${roomCode}`);
    }
  };

  const copyInviteLink = async (roomCode: string) => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(true);
      showToast(`Invite link copied for room ${roomCode}`);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast(`Share room code: ${roomCode}`);
    }
  };

  const mySeat = onlineRoom?.seats.find((s) => s.clientId === clientId);
  const isHost = onlineRoom?.hostClientId === clientId;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8] hover:border-[#E6A93C]/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#E7E2D8]">
              Online Multiplayer Rooms & Matchmaking
            </h1>
            <p className="text-xs text-[#E7E2D8]/70">
              Authoritative WebSocket server with CSPRNG dice rolls and turn validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 py-2 text-xs font-semibold">
          {wsConnected ? (
            <>
              <Wifi className="h-4 w-4 text-[#16A34A]" />
              <span className="text-[#4ADE80]">Room Connected</span>
            </>
          ) : wsConnecting ? (
            <>
              <WifiOff className="h-4 w-4 text-[#D97706]" />
              <span className="text-[#FBBF24]">Connecting...</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-[#E7E2D8]/50" />
              <span className="text-[#E7E2D8]/70">Ready (Idle)</span>
            </>
          )}
        </div>
      </div>

      {/* Commander Customization Bar (Set Name & Hero before entering matches) */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E6A93C]/35 bg-[#1A2130] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E6A93C]/50 bg-[#10141E] text-sm font-bold text-[#E6A93C]">
            {profile.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <label htmlFor="commander-name-input" className="block text-[10px] font-bold uppercase tracking-wider text-[#E6A93C]">
              Your Online Player Name
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="commander-name-input"
                type="text"
                maxLength={24}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                }}
                className="min-h-[38px] rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-3 text-sm font-bold text-[#E7E2D8] placeholder-[#E7E2D8]/40 focus:border-[#E6A93C] focus:outline-none"
                placeholder="Enter Your Name"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="min-h-[38px] rounded-lg bg-[#E6A93C] px-3.5 py-1 text-xs font-bold text-[#10141E] transition hover:bg-[#D97706]"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label htmlFor="commander-hero-select" className="text-xs font-semibold text-[#E7E2D8]/80">
            Selected Hero:
          </label>
          <select
            id="commander-hero-select"
            value={profile.selectedCharacterId}
            onChange={(e) => {
              void equipCharacter(e.target.value, 'royal-guard', 'classic');
              showToast(`Hero updated to ${getCharacterById(e.target.value).name}`);
            }}
            className="min-h-[38px] rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-3 text-xs font-bold text-[#E6A93C] focus:border-[#E6A93C] focus:outline-none"
          >
            {CHARACTERS.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name} ({char.title})
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Active Lobby View if currently in a room */}
      {onlineRoom ? (
        <section className="space-y-6 rounded-2xl border border-[#E6A93C]/45 bg-[#1A2130] p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E7E2D8]/12 pb-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                Private Courtyard Lobby
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <h2 className="font-mono-num text-3xl font-bold tracking-[0.2em] text-[#E7E2D8]">
                  {onlineRoom.roomCode}
                </h2>
                <button
                  type="button"
                  onClick={() => void copyRoomCodeOnly(onlineRoom.roomCode)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-3 py-1.5 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]"
                >
                  {copiedOnlyCode ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedOnlyCode ? 'Copied Code' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void copyInviteLink(onlineRoom.roomCode)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E6A93C]/45 bg-[#10141E] px-3 py-1.5 text-xs font-semibold text-[#E6A93C] transition hover:bg-[#E6A93C]/15"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? 'Copied Link' : 'Copy Invite Link'}</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-[#E7E2D8]/65">
                {isHost
                  ? `Share code ${onlineRoom.roomCode} or the invite link with your friend. Once at least 2 players join, click Start Match.`
                  : `Joined room ${onlineRoom.roomCode}. Waiting for the Room Host to click Start Match...`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {mySeat && (
                <button
                  type="button"
                  onClick={() => setRoomReady(!mySeat.ready)}
                  className={`min-h-[42px] rounded-lg px-4 py-2 text-xs font-bold transition ${
                    mySeat.ready
                      ? 'bg-[#16A34A] text-white'
                      : 'border border-[#E7E2D8]/20 bg-[#10141E] text-[#E7E2D8]'
                  }`}
                >
                  {mySeat.ready ? 'Ready for Battle' : 'Mark Ready'}
                </button>
              )}

              {isHost && (
                <button
                  type="button"
                  disabled={onlineRoom.seats.length < 2}
                  onClick={startPrivateRoom}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#E6A93C] px-5 py-2 text-xs font-bold text-[#10141E] transition hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Start Match ({onlineRoom.seats.length}/{onlineRoom.maxPlayers})</span>
                </button>
              )}

              <button
                type="button"
                onClick={leavePrivateRoom}
                className="min-h-[42px] rounded-lg border border-[#DC2626]/45 bg-[#DC2626]/10 px-4 py-2 text-xs font-semibold text-[#FCA5A5] transition hover:bg-[#DC2626]/20"
              >
                Leave Room
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {onlineRoom.seats.map((seat) => {
              const char = getCharacterById(seat.characterId);
              const kMeta = APP_CONFIG.kingdoms[seat.color];
              const isMe = seat.clientId === clientId;
              return (
                <div
                  key={seat.clientId}
                  className={`rounded-xl border p-4 ${
                    isMe
                      ? 'border-[#E6A93C] bg-[#1A2130] shadow-[0_0_15px_rgba(230,169,60,0.2)] ring-1 ring-[#E6A93C]'
                      : 'border-[#E7E2D8]/15 bg-[#10141E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="h-3.5 w-3.5 rounded-sm"
                      style={{ backgroundColor: kMeta.hex }}
                    />
                    <div className="flex items-center gap-1.5">
                      {isMe && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          YOU
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold uppercase ${
                          seat.ready ? 'text-[#4ADE80]' : 'text-[#E7E2D8]/50'
                        }`}
                      >
                        {seat.ready ? 'Ready' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-3 truncate font-display text-base font-bold text-[#E7E2D8]">
                    {seat.name}
                  </h3>
                  <p className="text-xs text-[#E6A93C]">
                    {char.name} ({kMeta.name})
                  </p>
                  <p className="mt-2 text-[11px] text-[#E7E2D8]/60">
                    {seat.clientId === onlineRoom.hostClientId ? 'Room Host 👑' : 'Challenger ⚔️'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Create Private Room */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E6A93C]/15 text-[#E6A93C]">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-[#E7E2D8]">
                Create Private Room
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/75">
                Generate a 6-character invite code and deep-link URL to play directly with friends.
              </p>

              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70">
                  Max Seats
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([2, 3, 4] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setMaxPlayers(cnt)}
                      className={`min-h-[40px] rounded-lg border text-xs font-bold ${
                        maxPlayers === cnt
                          ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                          : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]'
                      }`}
                    >
                      {cnt}P
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => createPrivateRoom(maxPlayers, { ...RULE_PRESETS.classic_kingdom })}
              className="mt-6 min-h-[44px] w-full rounded-lg bg-[#E6A93C] px-4 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
            >
              Host Private Room
            </button>
          </section>

          {/* Join by Invite Code */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#60A5FA]">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-[#E7E2D8]">
                Join Private Room
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/75">
                Enter a 6-character room code shared by the match host.
              </p>

              <div className="mt-5">
                <label htmlFor="room-code-input" className="text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70">
                  6-Character Room Code
                </label>
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. K7M9PQ"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="font-mono-num mt-2 min-h-[46px] w-full rounded-xl border border-[#E7E2D8]/20 bg-[#10141E] px-4 text-center text-lg font-bold tracking-[0.25em] text-[#E7E2D8] uppercase focus:border-[#E6A93C] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={joinCode.length < 4}
              onClick={() => joinPrivateRoom(joinCode)}
              className="mt-6 min-h-[44px] w-full rounded-lg border border-[#E6A93C] bg-[#E6A93C]/15 px-4 py-2.5 text-sm font-bold text-[#E6A93C] transition hover:bg-[#E6A93C] hover:text-[#10141E] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Join Room
            </button>
          </section>

          {/* Public Matchmaking Queue */}
          <section className="flex flex-col justify-between rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#16A34A]/15 text-[#4ADE80]">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-[#E7E2D8]">
                Public Matchmaking
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#E7E2D8]/75">
                Enter the live matchmaking queue to automatically pair with online challengers.
              </p>

              {queueStatus?.inQueue && (
                <div className="mt-5 rounded-xl border border-[#16A34A]/45 bg-[#10141E] p-4">
                  <div className="text-xs font-bold uppercase text-[#4ADE80]">
                    Searching ({queueStatus.preferredPlayers}P Queue)
                  </div>
                  <p className="mt-1 font-mono-num text-xs text-[#E7E2D8]/80">
                    Position #{queueStatus.position} — Waiting players: {queueStatus.queuedCount}
                  </p>
                </div>
              )}
            </div>

            {queueStatus?.inQueue ? (
              <button
                type="button"
                onClick={leavePublicQueue}
                className="mt-6 min-h-[44px] w-full rounded-lg border border-[#DC2626]/50 bg-[#DC2626]/15 px-4 py-2.5 text-sm font-bold text-[#FCA5A5] transition hover:bg-[#DC2626]/25"
              >
                Cancel Queue
              </button>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => joinPublicQueue(2)}
                  className="min-h-[44px] rounded-lg border border-[#16A34A]/50 bg-[#16A34A]/15 px-3 py-2.5 text-xs font-bold text-[#4ADE80] transition hover:bg-[#16A34A] hover:text-white"
                >
                  Find 2P Match
                </button>
                <button
                  type="button"
                  onClick={() => joinPublicQueue(4)}
                  className="min-h-[44px] rounded-lg border border-[#16A34A]/50 bg-[#16A34A]/15 px-3 py-2.5 text-xs font-bold text-[#4ADE80] transition hover:bg-[#16A34A] hover:text-white"
                >
                  Find 4P Match
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
};
