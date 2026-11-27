import React, { useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

interface AltchaChallengeResponse {
  algorithm: 'SHA-256';
  challenge: string;
  maxnumber: number;
  salt: string;
  signature: string;
}

interface AltchaWidgetProps {
  onVerify: (token: string) => void;
  onError?: (message: string) => void;
  label?: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function solveChallenge(challenge: AltchaChallengeResponse): Promise<string> {
  const max = Math.min(challenge.maxnumber || 50000, 100000);
  for (let n = 0; n <= max; n += 1) {
    const hash = await sha256Hex(`${challenge.salt}${n}`);
    if (hash === challenge.challenge) {
      const payload = {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        number: n,
        salt: challenge.salt,
        signature: challenge.signature,
      };
      return btoa(JSON.stringify(payload));
    }
    // Yield to main thread periodically so UI stays 60fps
    if (n % 250 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  throw new Error('Could not solve verification challenge.');
}

export const AltchaWidget: React.FC<AltchaWidgetProps> = ({
  onVerify,
  onError,
  label = 'I am not a robot',
}) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');

  const handleVerifyClick = async () => {
    if (status === 'verifying' || status === 'verified') return;
    setStatus('verifying');

    try {
      const res = await fetch('/api/altcha/challenge', {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Verification service busy. Please retry.');
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        // Local Vite dev fallback when Worker API isn't running
        const fallbackToken = btoa(
          JSON.stringify({ algorithm: 'SHA-256', localDev: true, ts: Date.now() }),
        );
        setStatus('verified');
        onVerify(fallbackToken);
        return;
      }

      const challenge = (await res.json()) as AltchaChallengeResponse;
      const token = await solveChallenge(challenge);
      setStatus('verified');
      onVerify(token);
    } catch (err) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Verification failed. Try again.';
      onError?.(msg);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${
        status === 'verified'
          ? 'border-[#16A34A]/50 bg-[#16A34A]/10'
          : status === 'error'
            ? 'border-[#DC2626]/50 bg-[#DC2626]/10'
            : 'border-[#E7E2D8]/15 bg-[#10141E]'
      }`}
    >
      <button
        type="button"
        onClick={() => void handleVerifyClick()}
        disabled={status === 'verifying' || status === 'verified'}
        aria-pressed={status === 'verified'}
        className="flex flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[#E6A93C]"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
            status === 'verified'
              ? 'border-[#16A34A] bg-[#16A34A] text-white'
              : status === 'verifying'
                ? 'border-[#E6A93C] bg-[#1A2130]'
                : 'border-[#E7E2D8]/40 bg-[#1A2130] hover:border-[#E6A93C]'
          }`}
        >
          {status === 'verifying' && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#E6A93C]" />}
          {status === 'verified' && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
        </span>
        <span className="text-xs font-semibold text-[#E7E2D8]">
          {status === 'verifying'
            ? 'Verifying human...'
            : status === 'verified'
              ? 'Verified'
              : status === 'error'
                ? 'Verification failed — Click to retry'
                : label}
        </span>
      </button>

      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#E7E2D8]/50">
        <ShieldCheck className="h-3.5 w-3.5 text-[#E6A93C]" />
        <span>ALTCHA</span>
      </div>
    </div>
  );
};
