import React from 'react';
import { ArrowLeft, Cookie, FileText, Scale, ShieldCheck } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { useGameStore, type LegalTab } from '../../store/gameStore';

const TABS: Array<{ id: LegalTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'terms', label: 'Terms of Service', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'cookies', label: 'Cookies & Storage', icon: Cookie },
  { id: 'fair-play', label: 'Fair Play & Conduct', icon: Scale },
];

export const LegalView: React.FC = () => {
  const legalTab = useGameStore((s) => s.legalTab);
  const openLegal = useGameStore((s) => s.openLegal);
  const navigate = useGameStore((s) => s.navigate);

  const effectiveDate = 'November 27, 2026';

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#E6A93C]">
            Legal & Compliance · {APP_CONFIG.appName}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
            {TABS.find((t) => t.id === legalTab)?.label ?? 'Legal Information'}
          </h1>
          <p className="mt-1 text-xs text-[#E7E2D8]/65">
            Effective Date: {effectiveDate} · Version {APP_CONFIG.version}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('home')}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-4 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Hub</span>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E7E2D8]/12 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = legalTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => openLegal(tab.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-[#E6A93C]/60 bg-[#E6A93C]/15 text-[#E6A93C]'
                  : 'border-[#E7E2D8]/12 bg-[#1A2130] text-[#E7E2D8]/75 hover:border-[#E6A93C]/35 hover:text-[#E7E2D8]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Document Content */}
      <article className="space-y-6 rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6 text-sm leading-relaxed text-[#E7E2D8]/85 sm:p-8">
        {legalTab === 'terms' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">1. Acceptance of Terms</h2>
              <p>
                By accessing, installing, or playing <strong>{APP_CONFIG.appName}</strong> (Web, PWA, or Android application), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, please discontinue use of the service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">2. Eligibility & Accounts</h2>
              <p>
                You may play offline or in Guest Mode without registration. To use optional cloud synchronization via Supabase or Google OAuth, you must be at least 13 years of age (or the minimum legal age in your jurisdiction) and provide accurate account information. You are responsible for maintaining the security of your account credentials.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">3. Intellectual Property & Open-Source License</h2>
              <p>
                {APP_CONFIG.appName} is distributed under the MIT License for its source code and original procedural 3D assets, textures, and synthesized audio effects. You may not misrepresent the official brand, impersonate other players, or redistribute modified versions as the official {APP_CONFIG.appName} release.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">4. Online Multiplayer & Virtual Items</h2>
              <p>
                Online multiplayer rooms are hosted via real-time WebSocket servers (including Cloudflare Durable Objects). All heroes, board themes, achievements, and match statistics have no real-world monetary value, cannot be bought or sold for real currency, and are provided solely for entertainment.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">5. Prohibited Conduct</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>Attempting to manipulate dice rolls, turn timers, or WebSocket packets.</li>
                <li>Using automated bots, scripts, or exploits in live multiplayer rooms.</li>
                <li>Choosing offensive, abusive, or impersonating Commander names.</li>
                <li>Disrupting server availability through denial-of-service or excessive automated requests.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">6. Disclaimer of Warranties & Limitation of Liability</h2>
              <p>
                The service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, express or implied. To the maximum extent permitted by applicable law, the developers and contributors of {APP_CONFIG.appName} shall not be liable for any indirect, incidental, or consequential damages, including loss of local save data or temporary multiplayer downtime.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">7. Changes & Contact</h2>
              <p>
                We may update these Terms from time to time. Continued use after updates constitutes acceptance of the revised Terms. Questions or legal notices can be submitted via the official project repository at{' '}
                <a
                  href="https://github.com/SudhirDevOps1/KingdomLudo"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#E6A93C] underline hover:text-[#FDE047]"
                >
                  github.com/SudhirDevOps1/KingdomLudo
                </a>.
              </p>
            </section>
          </>
        )}

        {legalTab === 'privacy' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">1. Overview & Privacy-First Design</h2>
              <p>
                {APP_CONFIG.appName} is designed to work offline-first. You can play full matches against AI or local friends in Guest Mode without creating an account or sharing personal information.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">2. Data We Collect</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>Local Device Data (Guest Mode):</strong> Your Commander display name, selected hero, board theme, audio/graphics settings, match history, and achievements are stored locally on your device using browser IndexedDB / localStorage (or native SQLite on Android).
                </li>
                <li>
                  <strong>Optional Cloud Sync (Supabase & Google OAuth):</strong> If you choose to sign in with Email or Google OAuth, we process your email address, unique user ID, and display name through Supabase Authentication solely to sync your profile across devices.
                </li>
                <li>
                  <strong>Online Multiplayer Data:</strong> When joining an online room, your chosen Commander name, selected hero, and in-match moves are broadcast in real time to other players in the same room. Ephemeral room state is discarded after matches conclude.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">3. What We Do Not Collect</h2>
              <p>
                We do <strong>not</strong> sell your personal data, run third-party behavioral advertising trackers, or access your contacts, camera, microphone, or precise GPS location.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">4. Third-Party Infrastructure</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li><strong>Cloudflare Workers & Durable Objects:</strong> Hosts the web application and real-time multiplayer WebSocket rooms.</li>
                <li><strong>Supabase:</strong> Provides optional user authentication (Email/Password & Google OAuth) and cloud profile storage when enabled.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">5. Your Rights & Data Controls</h2>
              <p>
                You can export your complete local profile and match history as a JSON file, or permanently erase all local saves at any time from{' '}
                <button
                  type="button"
                  onClick={() => {
                    useGameStore.getState().setSettingsTab('privacy');
                    navigate('settings');
                  }}
                  className="text-[#E6A93C] underline hover:text-[#FDE047]"
                >
                  Settings → Privacy & Data
                </button>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">6. Children&apos;s Privacy</h2>
              <p>
                {APP_CONFIG.appName} does not knowingly collect personal information from children under 13. Offline Guest Mode requires zero personal data entry. If a parent believes a child has provided personal data via cloud registration, please contact us via GitHub to have it removed.
              </p>
            </section>
          </>
        )}

        {legalTab === 'cookies' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">1. Strictly Necessary Browser Storage</h2>
              <p>
                {APP_CONFIG.appName} does not use third-party advertising cookies. We use essential browser storage mechanisms strictly required for gameplay and offline functionality:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li><strong>IndexedDB & localStorage:</strong> Persists your Guest Commander profile, match saves, unlocked achievements, and audio/graphics preferences.</li>
                <li><strong>sessionStorage:</strong> Holds your temporary multiplayer client ID (`ck_client_id`) during an active browser session so you can reconnect to your seat if a tab refreshes.</li>
                <li><strong>Service Worker Cache (PWA):</strong> Caches 3D assets, stylesheets, and application scripts so the game loads reliably even without an internet connection.</li>
                <li><strong>Supabase Auth Tokens:</strong> Stored locally only if you explicitly sign in with Email or Google OAuth to keep your session active.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">2. Managing Storage</h2>
              <p>
                You can clear all locally stored game data using the <strong>Reset Local Saves & Preferences</strong> button in Settings → Privacy & Data, or by clearing site data in your browser settings.
              </p>
            </section>
          </>
        )}

        {legalTab === 'fair-play' && (
          <>
            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">1. Respectful Commander Identity</h2>
              <p>
                Choose a Commander name that is respectful and appropriate for all players. Names containing hate speech, harassment, or offensive language are prohibited in public matchmaking and private rooms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">2. Server-Authoritative Fairness</h2>
              <p>
                In online multiplayer matches, dice rolls, legal move validation, captures, and turn timers are enforced authoritatively by the server. Attempting to tamper with client state or WebSocket messages will be rejected.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-lg font-bold text-[#E6A93C]">3. Turn Timers & Disconnections</h2>
              <p>
                Each turn in an online match has a countdown timer to keep matches flowing smoothly. If a player disconnects temporarily, they may rejoin the same room code before the match ends.
              </p>
            </section>
          </>
        )}
      </article>
    </main>
  );
};
