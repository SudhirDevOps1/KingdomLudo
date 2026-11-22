import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Database,
  Download,
  Globe,
  HelpCircle,
  Monitor,
  Shield,
  Sliders,
  Upload,
  Volume2,
} from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { LANGUAGE_LABELS, type SupportedLanguage } from '../../data/i18n';
import { localPersistence } from '../../persistence/localPersistence';
import { useGameStore, type SettingsTab } from '../../store/gameStore';
import { HowToPlayModal } from '../game/HowToPlayModal';

interface ProviderCapItem {
  provider: string;
  engineKind: 'sql' | 'nosql';
  supportsSqlQueries: boolean;
  supportsTransactions: boolean;
  supportsAuth: boolean;
  supportsRealtime: boolean;
  supportsStorage: boolean;
  supportsOfflineLocal: boolean;
  notes: string;
}

interface CapabilitiesResponse {
  activeProvider: ProviderCapItem;
  validation: {
    valid: boolean;
    selectedProvider: string;
    missingVars: string[];
    warnings: string[];
  };
  supportedProviders: ProviderCapItem[];
}

export const SettingsView: React.FC = () => {
  const settings = useGameStore((s) => s.settings);
  const settingsTab = useGameStore((s) => s.settingsTab);
  const setSettingsTab = useGameStore((s) => s.setSettingsTab);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const setLanguage = useGameStore((s) => s.setLanguage);
  const setGraphicsQuality = useGameStore((s) => s.setGraphicsQuality);
  const resetLocalData = useGameStore((s) => s.resetLocalData);
  const reloadStoreState = useGameStore((s) => s.reloadStoreState);
  const showToast = useGameStore((s) => s.showToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleExportBackup = async () => {
    try {
      const jsonStr = await localPersistence.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kingdomludo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Backup exported successfully!');
      showToast('Backup saved to JSON file');
    } catch (err) {
      setBackupStatus('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const res = await localPersistence.restoreBackupJSON(text);
        if (res.success) {
          await reloadStoreState();
          setBackupStatus(res.message);
          showToast(res.message);
        } else {
          setBackupStatus('Restore failed: ' + res.message);
        }
      } catch (err) {
        setBackupStatus('Import error: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [capabilities, setCapabilities] = useState<CapabilitiesResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');

  useEffect(() => {
    if (settingsTab !== 'database') return;
    fetch('/api/config/capabilities')
      .then((r) => r.json() as Promise<CapabilitiesResponse>)
      .then((data) => setCapabilities(data))
      .catch(() => {});

    fetch('/api/health')
      .then((r) => r.json() as Promise<{ status: string; provider: string; dbHealth?: { latencyMs?: number } }>)
      .then((data) => {
        setHealthStatus(
          `${data.status.toUpperCase()} (${data.provider}, ${data.dbHealth?.latencyMs ?? 0}ms)`,
        );
      })
      .catch(() => setHealthStatus('Unavailable offline'));
  }, [settingsTab]);

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'audio', label: 'Audio & Haptics', icon: Volume2 },
    { id: 'graphics', label: '3D Graphics', icon: Monitor },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'database', label: 'Database Config', icon: Database },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
          Game Settings & Platform Config
        </h1>
        <p className="mt-1 text-sm text-[#E7E2D8]/75">
          Configure audio synthesis, WebGL rendering quality, localization, and inspect backend database capabilities.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-1.5 rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = settingsTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsTab(tab.id)}
                className={`flex min-h-[42px] items-center gap-2.5 rounded-lg px-3.5 text-left text-xs font-semibold transition ${
                  active
                    ? 'bg-[#E6A93C] text-[#10141E]'
                    : 'text-[#E7E2D8]/80 hover:bg-[#10141E]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <section className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          {settingsTab === 'general' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">General Preferences</h2>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4 text-sm">
                <span>Reduced Motion Animations</span>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => void updateSettings({ reducedMotion: e.target.checked })}
                  className="h-4 w-4 accent-[#E6A93C]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4 text-sm">
                <span>Prefer 2D Board Fallback Mode</span>
                <input
                  type="checkbox"
                  checked={settings.prefer2DFallback}
                  onChange={(e) => void updateSettings({ prefer2DFallback: e.target.checked })}
                  className="h-4 w-4 accent-[#E6A93C]"
                />
              </label>
            </div>
          )}

          {settingsTab === 'audio' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">Audio & Haptics</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] px-4 py-3 text-sm">
                  <span>Enable Audio Engine</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => void updateSettings({ soundEnabled: e.target.checked })}
                    className="h-4 w-4 accent-[#E6A93C]"
                  />
                </label>
                <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] px-4 py-3 text-sm">
                  <span>Master Mute</span>
                  <input
                    type="checkbox"
                    checked={settings.masterMuted}
                    onChange={(e) => void updateSettings({ masterMuted: e.target.checked })}
                    className="h-4 w-4 accent-[#E6A93C]"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
                <div className="flex justify-between text-xs font-semibold text-[#E7E2D8]/80">
                  <span>Effects (SFX) Volume</span>
                  <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => void updateSettings({ sfxVolume: Number(e.target.value) })}
                  className="mt-2 w-full accent-[#E6A93C]"
                />
              </div>

              <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
                <div className="flex justify-between text-xs font-semibold text-[#E7E2D8]/80">
                  <span>Royal Music Volume</span>
                  <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => void updateSettings({ musicVolume: Number(e.target.value) })}
                  className="mt-2 w-full accent-[#E6A93C]"
                />
              </div>

              <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
                <div className="flex justify-between text-xs font-semibold text-[#E7E2D8]/80">
                  <span>Island Environment (Ocean, Wind & Birds)</span>
                  <span className="font-mono-num">{Math.round(settings.ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.ambientVolume}
                  onChange={(e) => void updateSettings({ ambientVolume: Number(e.target.value) })}
                  className="mt-2 w-full accent-[#E6A93C]"
                />
              </div>

              <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4 text-sm">
                <span>Touch Vibration & Haptics</span>
                <input
                  type="checkbox"
                  checked={settings.hapticsEnabled}
                  onChange={(e) => void updateSettings({ hapticsEnabled: e.target.checked })}
                  className="h-4 w-4 accent-[#E6A93C]"
                />
              </label>
            </div>
          )}

          {settingsTab === 'graphics' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">3D Graphics & Camera</h2>
              <p className="text-xs text-[#E7E2D8]/75">
                Adjust pixel ratio cap, shadow map resolution, island foliage density, and camera responsiveness.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['low', 'medium', 'high'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => void setGraphicsQuality(tier)}
                    className={`rounded-xl border p-4 text-left transition ${
                      settings.graphicsQuality === tier
                        ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                        : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]'
                    }`}
                  >
                    <div className="font-display text-base font-bold capitalize">{tier}</div>
                    <div className="mt-1 text-xs opacity-75">
                      {tier === 'low'
                        ? 'DPR 1x, Shadows off, Light foliage'
                        : tier === 'medium'
                          ? 'DPR 1.5x, 1024px Shadows, Balanced island'
                          : 'DPR 2x, 2048px Shadows, Full island & VFX'}
                    </div>
                  </button>
                ))}
              </div>

              <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4 text-sm">
                <span>Cinematic Capture & Victory Camera Focus</span>
                <input
                  type="checkbox"
                  checked={settings.cinematicCamera}
                  onChange={(e) => void updateSettings({ cinematicCamera: e.target.checked })}
                  className="h-4 w-4 accent-[#E6A93C]"
                />
              </label>

              <div className="rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
                <div className="flex justify-between text-xs font-semibold text-[#E7E2D8]/80">
                  <span>Camera Orbit & Zoom Sensitivity</span>
                  <span className="font-mono-num">{settings.cameraSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.1}
                  value={settings.cameraSensitivity}
                  onChange={(e) => void updateSettings({ cameraSensitivity: Number(e.target.value) })}
                  className="mt-2 w-full accent-[#E6A93C]"
                />
              </div>
            </div>
          )}

          {settingsTab === 'language' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-[#E7E2D8]">Interface Language</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => void setLanguage(lang)}
                    className={`min-h-[46px] rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      settings.language === lang
                        ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                        : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]'
                    }`}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {settingsTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#E7E2D8]">Privacy & Local Data</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#E7E2D8]/75">
                  Matches, player profiles, unlocks, and settings are saved locally on your device in offline IndexedDB and native SQLite. No telemetry is collected without consent.
                </p>
              </div>

              {/* Data Backup & Restore */}
              <div className="space-y-3 rounded-xl border border-[#E7E2D8]/10 bg-[#10141E] p-4">
                <h3 className="font-display text-sm font-bold text-[#E6A93C]">Offline Data Backup & Restore</h3>
                <p className="text-xs text-[#E7E2D8]/70">
                  Export all your achievements, match history, and profile data to a single JSON backup file, or restore from a previously exported backup.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E6A93C]/50 bg-[#E6A93C]/10 px-4 py-2 text-xs font-bold text-[#E6A93C] transition hover:bg-[#E6A93C]/20"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export JSON Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] px-4 py-2 text-xs font-bold text-[#E7E2D8] transition hover:border-[#E6A93C]"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Restore From Backup</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </div>

                {backupStatus && (
                  <div className="rounded-lg border border-[#E6A93C]/30 bg-[#1A2130] px-3 py-2 text-xs text-[#E6A93C]">
                    {backupStatus}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-950/10 p-4">
                <h3 className="font-display text-sm font-bold text-red-400">Reset Local Saves</h3>
                <p className="text-xs text-[#E7E2D8]/65">
                  Wipes local cached game saves, profile customizations, and resets all settings to original defaults.
                </p>
                <button
                  type="button"
                  onClick={() => void resetLocalData()}
                  className="min-h-[42px] rounded-lg border border-[#DC2626]/50 bg-[#DC2626]/15 px-5 py-2.5 text-xs font-bold text-[#FCA5A5] transition hover:bg-[#DC2626]/25"
                >
                  Reset Local Saves & Preferences
                </button>
              </div>
            </div>
          )}

          {settingsTab === 'database' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-[#E7E2D8]">
                  Database Provider Capabilities
                </h2>
                <span className="font-mono-num rounded-md border border-[#E6A93C]/40 bg-[#10141E] px-2.5 py-1 text-xs text-[#E6A93C]">
                  {healthStatus}
                </span>
              </div>
              <p className="text-xs text-[#E7E2D8]/75">
                Runtime server configuration selected via <code className="text-[#E6A93C]">DATABASE_PROVIDER</code> environment variable (read-only status view; secrets never leave the server).
              </p>

              {capabilities && (
                <div className="space-y-3">
                  {capabilities.supportedProviders.map((prov) => {
                    const isActive = prov.provider === capabilities.activeProvider.provider;
                    return (
                      <div
                        key={prov.provider}
                        className={`rounded-xl border p-4 ${
                          isActive
                            ? 'border-[#E6A93C] bg-[#10141E]'
                            : 'border-[#E7E2D8]/10 bg-[#10141E]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold uppercase text-[#E7E2D8]">
                            {prov.provider}
                          </span>
                          <span className="font-mono-num text-xs text-[#E6A93C]">
                            {isActive ? 'ACTIVE' : prov.engineKind.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#E7E2D8]/70">{prov.notes}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export const HelpAndAboutView: React.FC = () => {
  const navigate = useGameStore((s) => s.navigate);
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={APP_CONFIG.assets.appEmblem}
            alt={`${APP_CONFIG.appName} Icon`}
            referrerPolicy="no-referrer"
            className="h-14 w-14 rounded-xl border border-[#E6A93C]/50 object-cover"
          />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
              About {APP_CONFIG.appName} & Rules
            </h1>
            <p className="mt-1 font-mono-num text-xs text-[#E7E2D8]/75 sm:text-sm">
              Version {APP_CONFIG.version} · {APP_CONFIG.releaseChannel} · {APP_CONFIG.packageId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E6A93C]/60 bg-[#E6A93C] px-3.5 text-xs font-bold text-[#10141E] transition hover:bg-[#FDE047]"
          >
            <BookOpen className="h-4 w-4" />
            <span>Interactive Guide</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="min-h-[40px] whitespace-nowrap rounded-lg border border-[#E7E2D8]/15 bg-[#1A2130] px-4 text-xs font-semibold text-[#E7E2D8] transition hover:border-[#E6A93C]/50"
          >
            Back to Hub
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[#E6A93C]/30 bg-[#1A2130] p-5">
        <h2 className="font-display text-base font-bold text-[#E6A93C]">
          Release Channel & Stability
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#E7E2D8]/85 sm:text-sm">
          {APP_CONFIG.stabilityNotice}
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div className="flex items-center gap-2 text-[#E6A93C]">
            <BookOpen className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-[#E7E2D8]">Official Ludo Rules</h2>
          </div>
          <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-[#E7E2D8]/80">
            <li>• Roll a <strong>6</strong> to deploy a character from your Kingdom Yard onto your starting star tile.</li>
            <li>• Rolling a <strong>6</strong>, capturing an opponent, or guiding a hero into the central Royal Crown awards a bonus roll.</li>
            <li>• Rolling three consecutive <strong>6</strong>s forfeits the turn (configurable in Match Setup).</li>
            <li>• Eight Star Sanctuary tiles shield pieces from capture; landing on an opponent on an unprotected tile sends them back to their yard.</li>
            <li>• An exact roll is required to enter the central Royal Crown Sanctuary. First kingdom to place all 4 heroes wins.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-[#E7E2D8]/12 bg-[#1A2130] p-6">
          <div className="flex items-center gap-2 text-[#E6A93C]">
            <HelpCircle className="h-5 w-5" />
            <h2 className="font-display text-lg font-bold text-[#E7E2D8]">Controls & Licensing</h2>
          </div>
          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-[#E7E2D8]/80">
            <li>• <strong>Orbit Camera:</strong> Drag with mouse or one finger; scroll or pinch to zoom.</li>
            <li>• <strong>Keyboard:</strong> Press <kbd className="rounded bg-[#10141E] px-1.5 py-0.5 font-mono-num">Space</kbd> to roll, <kbd className="rounded bg-[#10141E] px-1.5 py-0.5 font-mono-num">1-4</kbd> to move a highlighted piece, <kbd className="rounded bg-[#10141E] px-1.5 py-0.5 font-mono-num">C</kbd> to cycle camera, <kbd className="rounded bg-[#10141E] px-1.5 py-0.5 font-mono-num">H</kbd> to reset view, and <kbd className="rounded bg-[#10141E] px-1.5 py-0.5 font-mono-num">Esc</kbd> to pause.</li>
            <li>• <strong>Originality & Assets:</strong> All 12 procedural 3D heroes, living island scenery, canvas PBR textures, Web Audio sound effects, and KingdomLudo emblem artwork are original to this project (MIT licensed; see <code className="text-[#E6A93C]">docs/ASSET_LICENSES.md</code>).</li>
          </ul>
        </section>
      </div>

      <HowToPlayModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </main>
  );
};
