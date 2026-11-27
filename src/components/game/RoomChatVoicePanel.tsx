import React, { useState } from 'react';
import { MessageSquare, Mic, MicOff, PhoneOff, Send } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { useGameStore } from '../../store/gameStore';

const QUICK_PHRASES = ['Good luck!', 'Nice move!', 'Watch out!', 'Well played!'];

export const RoomChatVoicePanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const chatMessages = useGameStore((s) => s.chatMessages);
  const sendChatMessage = useGameStore((s) => s.sendChatMessage);
  const voiceEnabled = useGameStore((s) => s.voiceEnabled);
  const voiceMuted = useGameStore((s) => s.voiceMuted);
  const toggleVoice = useGameStore((s) => s.toggleVoice);
  const toggleVoiceMute = useGameStore((s) => s.toggleVoiceMute);
  const clientId = useGameStore((s) => s.clientId);

  const [draft, setDraft] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(draft);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E7E2D8]/12 bg-[#10141E] p-3.5">
      {/* Header + Consent-First P2P Voice Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E2D8]/10 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E6A93C]">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Room Chat (Ephemeral)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {voiceEnabled ? (
            <>
              <button
                type="button"
                onClick={toggleVoiceMute}
                className={`inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold transition ${
                  voiceMuted
                    ? 'border-[#D97706]/50 bg-[#D97706]/15 text-[#FBBF24]'
                    : 'border-[#16A34A]/50 bg-[#16A34A]/15 text-[#4ADE80]'
                }`}
                title="Mute or unmute microphone"
              >
                {voiceMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span>{voiceMuted ? 'Muted' : 'Mic On'}</span>
              </button>
              <button
                type="button"
                onClick={() => void toggleVoice()}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[#DC2626]/45 bg-[#DC2626]/10 px-2.5 text-[11px] font-semibold text-[#FCA5A5] hover:bg-[#DC2626]/20"
                title="Leave voice chat"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>Leave</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void toggleVoice()}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-[#E6A93C]/45 bg-[#1A2130] px-2.5 text-[11px] font-semibold text-[#E6A93C] transition hover:bg-[#E6A93C]/15"
              title="Uses microphone only for live peer-to-peer room audio; never recorded"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Join Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className={`${compact ? 'max-h-40' : 'max-h-48'} space-y-1.5 overflow-y-auto pr-1 text-xs`}>
        {chatMessages.length === 0 ? (
          <p className="py-3 text-center text-[11px] text-[#E7E2D8]/50">
            No messages yet. Chat is memory-only and cleared when the room closes.
          </p>
        ) : (
          chatMessages.map((m) => {
            const isMe = m.senderClientId === clientId;
            const colorHex = APP_CONFIG.kingdoms[m.senderColor]?.hex ?? '#E6A93C';
            return (
              <div
                key={m.id}
                className={`rounded-lg px-2.5 py-1.5 ${
                  isMe ? 'bg-[#1A2130] text-[#E7E2D8]' : 'bg-[#161B26] text-[#E7E2D8]/90'
                }`}
              >
                <span className="font-bold" style={{ color: colorHex }}>
                  {isMe ? 'You' : m.senderName}:{' '}
                </span>
                <span className="break-words">{m.text}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tactical Phrases */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => sendChatMessage(phrase)}
            className="rounded-md border border-[#E7E2D8]/12 bg-[#1A2130] px-2 py-1 text-[10px] font-semibold text-[#E7E2D8]/80 transition hover:border-[#E6A93C]/50 hover:text-[#E6A93C]"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Text Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          maxLength={200}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message room..."
          className="min-h-[36px] flex-1 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 text-xs text-[#E7E2D8] placeholder-[#E7E2D8]/40 focus:border-[#E6A93C] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-[#E6A93C] px-3 text-xs font-bold text-[#10141E] transition hover:bg-[#D97706] disabled:opacity-45"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
