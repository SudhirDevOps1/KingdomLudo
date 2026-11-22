import React, { useEffect, useState } from 'react';
import { ChevronRight, Crown, Dice6, ShieldCheck, Users } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { useGameStore } from '../../store/gameStore';

export const SplashScreen: React.FC = () => {
  const initialized = useGameStore((s) => s.initialized);
  const onboardingCompleted = useGameStore((s) => s.profile.onboardingCompleted);
  const pendingDeepLinkRoom = useGameStore((s) => s.pendingDeepLinkRoom);
  const navigate = useGameStore((s) => s.navigate);

  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      if (pendingDeepLinkRoom) {
        navigate('multiplayer');
      } else if (!onboardingCompleted) {
        navigate('onboarding');
      } else {
        navigate('home');
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [initialized, onboardingCompleted, pendingDeepLinkRoom, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#10141E] px-6 text-center">
      <img
        src={APP_CONFIG.assets.courtyardBackdrop}
        alt="Royal Enchanted Courtyard"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#10141E] via-[#10141E]/75 to-[#10141E]/60" />

      <div className="relative z-10 flex max-w-lg flex-col items-center">
        <div className="h-24 w-24 overflow-hidden rounded-2xl border border-[#E6A93C]/65 bg-[#10141E] shadow-2xl">
          <img
            src={APP_CONFIG.assets.appEmblem}
            alt={`${APP_CONFIG.appName} Emblem`}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-wider text-[#E7E2D8] sm:text-5xl">
          {APP_CONFIG.appName}
        </h1>
        <p className="mt-3 text-sm tracking-wide text-[#E7E2D8]/80 sm:text-base">
          3D Fantasy Island Ludo · v{APP_CONFIG.version} ({APP_CONFIG.releaseChannel})
        </p>

        <div className="mt-8 w-56 overflow-hidden rounded-md border border-[#E6A93C]/30 bg-[#1A2130] p-1">
          <div className="h-2 w-full rounded-sm bg-gradient-to-r from-[#D97706] via-[#E6A93C] to-[#FDE047]" />
        </div>
        <p className="mt-3 font-mono-num text-xs uppercase tracking-widest text-[#E6A93C]">
          {initialized ? 'Entering Island Sanctuary...' : 'Preparing 3D Island...'}
        </p>

        <button
          type="button"
          onClick={() => navigate(onboardingCompleted ? 'home' : 'onboarding')}
          className="mt-6 min-h-[44px] rounded-lg border border-[#E6A93C]/40 bg-[#1A2130]/90 px-5 py-2.5 text-sm font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C] hover:text-[#E6A93C]"
        >
          Play KingdomLudo
        </button>
      </div>
    </div>
  );
};

const ONBOARDING_STEPS = [
  {
    icon: Crown,
    title: 'Four Stylized Kingdoms',
    body: 'Choose from 12 original heroes across Crimson Spire, Cobalt Bastion, Emerald Grove, and Sovereign Sun with live 3D customization.',
  },
  {
    icon: Dice6,
    title: 'Tactile 3D Board & Classic Rules',
    body: 'Roll a 3D die across safe stars, capture rivals back to base, and race into the Royal Crown Sanctuary with Easy, Medium, or Hard AI.',
  },
  {
    icon: Users,
    title: 'Play Anywhere — Offline or Online',
    body: 'Start instantly in Guest Mode with offline Pass & Play, save mid-match progress locally, or host 6-character private rooms and public matches.',
  },
];

export const OnboardingView: React.FC = () => {
  const [step, setStep] = useState(0);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const current = ONBOARDING_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#10141E] p-6">
      <img
        src={APP_CONFIG.assets.courtyardBackdrop}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#E6A93C]/35 bg-[#1A2130] p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="font-mono-num text-xs font-semibold uppercase tracking-widest text-[#E6A93C]">
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </span>
          <button
            type="button"
            onClick={() => void completeOnboarding()}
            className="min-h-[36px] rounded-md px-3 text-xs font-medium text-[#E7E2D8]/70 transition hover:bg-[#10141E] hover:text-[#E7E2D8]"
          >
            Skip Intro
          </button>
        </div>

        <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-xl border border-[#E6A93C]/40 bg-[#10141E] text-[#E6A93C]">
          <Icon className="h-7 w-7" />
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold text-[#E7E2D8]">
          {current.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#E7E2D8]/80 sm:text-base">
          {current.body}
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#E7E2D8]/10 bg-[#10141E]/70 px-3.5 py-2.5 text-xs text-[#E7E2D8]/75">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#16A34A]" />
          <span>No account required to play. Optional Google sign-in syncs your crown stats.</span>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {ONBOARDING_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Step ${idx + 1}`}
                onClick={() => setStep(idx)}
                className={`h-2.5 rounded-sm transition-all ${
                  idx === step ? 'w-8 bg-[#E6A93C]' : 'w-2.5 bg-[#E7E2D8]/25'
                }`}
              />
            ))}
          </div>

          {step < ONBOARDING_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E6A93C] px-5 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void completeOnboarding()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E6A93C] px-6 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
            >
              <span>Enter Courtyard Hub</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
