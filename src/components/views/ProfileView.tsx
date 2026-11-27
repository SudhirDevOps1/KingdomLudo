import React, { useMemo, useState } from 'react';
import { Cloud, KeyRound, Lock, LogIn, LogOut, Mail, RefreshCw, Save, ShieldCheck, Shuffle, Sparkles, UserPlus } from 'lucide-react';
import { getCharacterById } from '../../data/characters';
import {
  createRandomAvatarSeed,
  DICEBEAR_STYLES,
  generateDiceBearAvatarUri,
  type DiceBearStyleId,
} from '../../services/avatar/dicebearService';
import { useGameStore } from '../../store/gameStore';
import { AltchaWidget } from '../common/AltchaWidget';

export const ProfileView: React.FC = () => {
  const profile = useGameStore((s) => s.profile);
  const guestSession = useGameStore((s) => s.guestSession);
  const supabaseReady = useGameStore((s) => s.supabaseReady);
  const authBusy = useGameStore((s) => s.authBusy);
  const authError = useGameStore((s) => s.authError);
  const updateDisplayName = useGameStore((s) => s.updateDisplayName);
  const updateAvatar = useGameStore((s) => s.updateAvatar);
  const signInGoogle = useGameStore((s) => s.signInGoogle);
  const signInEmail = useGameStore((s) => s.signInEmail);
  const signUpEmail = useGameStore((s) => s.signUpEmail);
  const resendEmailConfirmation = useGameStore((s) => s.resendEmailConfirmation);
  const signOutGoogle = useGameStore((s) => s.signOutGoogle);
  const showToast = useGameStore((s) => s.showToast);

  const [nameInput, setNameInput] = useState(profile.displayName);
  const [avatarStyle, setAvatarStyle] = useState<DiceBearStyleId>(profile.avatarStyle ?? 'adventurer');
  const [avatarSeed, setAvatarSeed] = useState<string>(profile.avatarSeed ?? profile.displayName ?? 'Royal Commander');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [altchaToken, setAltchaToken] = useState<string | null>(null);

  const hero = getCharacterById(profile.selectedCharacterId);
  const avatarUri = useMemo(
    () => generateDiceBearAvatarUri(avatarStyle, avatarSeed, 128),
    [avatarStyle, avatarSeed],
  );

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDisplayName(nameInput);
    showToast('Commander display name updated.');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!altchaToken) {
      showToast('Please complete the "I am not a robot" verification first.');
      return;
    }
    if (!emailInput || !passwordInput) {
      showToast('Please provide both email and password.');
      return;
    }
    if (authTab === 'login') {
      await signInEmail(emailInput, passwordInput);
    } else {
      await signUpEmail(emailInput, passwordInput, profile.displayName);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
          {profile.isGuest ? 'Guest Commander Profile' : 'Verified Commander Account'}
        </h1>
        <p className="mt-1 text-sm text-[#E7E2D8]/75">
          Play instantly with zero registration in Guest Mode, or link a Supabase account for cross-device cloud persistence.
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* Left: Commander Identity Card */}
        <div className="space-y-5 rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <img
              src={avatarUri}
              alt={`${profile.displayName} Avatar`}
              className="h-16 w-16 rounded-xl border border-[#E6A93C]/55 bg-[#10141E] object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E6A93C]">
                  {profile.isGuest ? 'Guest Champion' : 'Supabase Verified'}
                </span>
                {profile.isGuest && (
                  <span className="rounded bg-[#E6A93C]/20 px-1.5 py-0.5 text-[9px] font-mono text-[#E6A93C]">
                    {guestSession?.guestId?.slice(0, 10)}...
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">
                {profile.displayName}
              </h2>
              {profile.email ? (
                <p className="text-xs text-[#E7E2D8]/70">{profile.email}</p>
              ) : (
                <p className="text-[11px] text-[#E7E2D8]/50">Offline Guest Mode (Local saves active)</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveName} className="space-y-3">
            <label
              htmlFor="display-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70"
            >
              Commander Name
            </label>
            <div className="flex gap-2">
              <input
                id="display-name-input"
                type="text"
                maxLength={48}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="min-h-[44px] flex-1 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-3.5 text-sm text-[#E7E2D8] focus:border-[#E6A93C] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E6A93C] px-4 py-2 text-xs font-bold text-[#10141E] hover:bg-[#D97706]"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </form>

          <div className="space-y-3 rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E6A93C]">
                DiceBear Avatar Studio
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#4ADE80]">
                <Lock className="h-3 w-3" />
                <span>AES-256 Encrypted</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DICEBEAR_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setAvatarStyle(st.id);
                    void updateAvatar(st.id, avatarSeed);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                    avatarStyle === st.id
                      ? 'border-[#E6A93C] bg-[#E6A93C]/20 text-[#E6A93C]'
                      : 'border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8]/75 hover:border-[#E6A93C]/40'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={32}
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
                onBlur={() => void updateAvatar(avatarStyle, avatarSeed)}
                placeholder="Custom avatar seed..."
                className="min-h-[36px] flex-1 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 text-xs text-[#E7E2D8] focus:border-[#E6A93C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const nextSeed = createRandomAvatarSeed();
                  setAvatarSeed(nextSeed);
                  void updateAvatar(avatarStyle, nextSeed);
                }}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#E6A93C]/45 bg-[#1A2130] px-3 text-xs font-semibold text-[#E6A93C] transition hover:bg-[#E6A93C]/15"
              >
                <Shuffle className="h-3.5 w-3.5" />
                <span>Randomize</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4 text-xs text-[#E7E2D8]/80">
            Active Champion: <strong className="text-[#E6A93C]">{hero.name}</strong> ({hero.title})
          </div>
        </div>

        {/* Right: Supabase Cloud Sync & Account Hub */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2.5 text-[#E6A93C]">
              <Cloud className="h-5 w-5" />
              <h2 className="font-display text-lg font-bold text-[#E7E2D8]">
                Supabase Cloud Sync
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#E7E2D8]/75">
              {profile.isGuest
                ? 'Guest Mode saves stay private on your device for 30 days. Sign in to unlock:'
                : 'Supabase PostgreSQL cloud sync active. Your verified Commander benefits:'}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#E7E2D8]/70">
              <li>• Global Royal Leaderboard ranking (Wins & Captures)</li>
              <li>• Cross-device sync for Avatar, Hero & Match Stats</li>
              <li>• Verified Commander badge in online multiplayer</li>
            </ul>
          </div>

          <div className="mt-5 space-y-4">
            {profile.isGuest ? (
              <div className="space-y-3">
                {/* Email Sign-In / Sign-Up Form */}
                <div className="rounded-xl border border-[#E7E2D8]/15 bg-[#10141E]/90 p-4">
                  <div className="flex border-b border-[#E7E2D8]/15 pb-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`flex-1 py-1 text-center transition ${
                        authTab === 'login' ? 'border-b-2 border-[#E6A93C] text-[#E6A93C]' : 'text-[#E7E2D8]/60'
                      }`}
                    >
                      Email Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`flex-1 py-1 text-center transition ${
                        authTab === 'register' ? 'border-b-2 border-[#E6A93C] text-[#E6A93C]' : 'text-[#E7E2D8]/60'
                      }`}
                    >
                      New Account
                    </button>
                  </div>

                  <form onSubmit={handleEmailAuth} className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-2 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 py-1.5">
                      <Mail className="h-4 w-4 text-[#E7E2D8]/50" />
                      <input
                        type="email"
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#E7E2D8] placeholder-[#E7E2D8]/40 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-3 py-1.5">
                      <KeyRound className="h-4 w-4 text-[#E7E2D8]/50" />
                      <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#E7E2D8] placeholder-[#E7E2D8]/40 focus:outline-none"
                      />
                    </div>
                    <AltchaWidget
                      onVerify={(token) => setAltchaToken(token)}
                      onError={(msg) => showToast(msg)}
                    />
                    {authError && authError.toLowerCase().includes('confirm') && (
                      <div className="rounded-lg border border-[#D97706]/40 bg-[#D97706]/10 p-2.5 text-[11px] text-[#FBBF24]">
                        <p>Your email is not confirmed yet. Check your inbox/spam, or resend the link:</p>
                        <button
                          type="button"
                          disabled={authBusy}
                          onClick={() => void resendEmailConfirmation(emailInput)}
                          className="mt-1.5 inline-flex items-center gap-1 font-bold text-[#E6A93C] underline hover:text-[#FDE047]"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Resend Confirmation Email</span>
                        </button>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={authBusy}
                      className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg bg-[#E6A93C] px-3 py-1.5 text-xs font-bold text-[#10141E] transition hover:bg-[#D97706] disabled:opacity-50"
                    >
                      {authTab === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      <span>{authBusy ? 'Processing...' : authTab === 'login' ? 'Sign In with Email' : 'Register Account'}</span>
                    </button>
                  </form>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="h-[1px] w-full bg-[#E7E2D8]/10" />
                  <span className="absolute bg-[#1A2130] px-2 text-[10px] uppercase tracking-wider text-[#E7E2D8]/50">or OAuth</span>
                </div>

                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    if (!altchaToken) {
                      showToast('Please check "I am not a robot" above first.');
                      return;
                    }
                    void signInGoogle();
                  }}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-4 py-2 text-xs font-bold text-[#E7E2D8] transition hover:border-[#E6A93C] disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 text-[#E6A93C]" />
                  <span>Single-Click Google OAuth</span>
                </button>

                <p className="text-center text-[11px] leading-relaxed text-[#E7E2D8]/55">
                  By signing in or creating an account, you agree to our{' '}
                  <button
                    type="button"
                    onClick={() => useGameStore.getState().openLegal('terms')}
                    className="text-[#E6A93C] underline hover:text-[#FDE047]"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => useGameStore.getState().openLegal('privacy')}
                    className="text-[#E6A93C] underline hover:text-[#FDE047]"
                  >
                    Privacy Policy
                  </button>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-[#16A34A]/40 bg-[#16A34A]/10 px-3 py-2 text-xs text-[#4ADE80]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Authenticated with Supabase</span>
                </div>

                <button
                  type="button"
                  onClick={() => void signOutGoogle()}
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-[#E7E2D8]/20 bg-[#10141E] px-4 py-2 text-xs font-semibold text-[#E7E2D8] hover:border-[#E6A93C]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Return to Guest Mode</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
