import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';
import { CHARACTERS, getCharacterById } from '../../data/characters';
import type { KingdomColor } from '../../engine/types';
import { useGameStore } from '../../store/gameStore';
import type { CharacterAnimState } from '../../three/characterBuilder';
import { CharacterPreviewCanvas } from '../three/CharacterPreviewCanvas';

const ANIM_OPTIONS: Array<{ id: CharacterAnimState; label: string }> = [
  { id: 'idle', label: 'Idle' },
  { id: 'walk', label: 'Walk' },
  { id: 'run', label: 'Run' },
  { id: 'jump', label: 'Jump' },
  { id: 'land', label: 'Land' },
  { id: 'anticipate', label: 'Anticipate' },
  { id: 'celebrate', label: 'Celebrate' },
  { id: 'capture', label: 'Capture' },
  { id: 'victory', label: 'Victory' },
  { id: 'defeat_sad', label: 'Crying / Defeat' },
];

export const CharactersView: React.FC = () => {
  const profile = useGameStore((s) => s.profile);
  const equipCharacter = useGameStore((s) => s.equipCharacter);

  const [filterKingdom, setFilterKingdom] = useState<KingdomColor | 'all'>('all');
  const [selectedId, setSelectedId] = useState(profile.selectedCharacterId);
  const activeHero = getCharacterById(selectedId);

  const savedCust = profile.equippedCustomizations[activeHero.id] ?? {
    outfitId: activeHero.outfits[1]?.id ?? activeHero.outfits[0].id,
    skinId: activeHero.skins[0].id,
  };

  const [outfitId, setOutfitId] = useState(savedCust.outfitId);
  const [skinId, setSkinId] = useState(savedCust.skinId);
  const [animState, setAnimState] = useState<CharacterAnimState>('idle');

  const handleSelectCharacter = (id: string) => {
    setSelectedId(id);
    const char = getCharacterById(id);
    const eq = profile.equippedCustomizations[char.id];
    setOutfitId(eq?.outfitId ?? char.outfits[1]?.id ?? char.outfits[0].id);
    setSkinId(eq?.skinId ?? char.skins[0].id);
  };

  const filtered =
    filterKingdom === 'all'
      ? CHARACTERS
      : CHARACTERS.filter((c) => c.kingdom === filterKingdom);

  const isSkinUnlocked = (req: string) => {
    if (req === 'default') return true;
    if (req === 'wins_3') return profile.stats.wins >= 3;
    if (req === 'captures_10') return profile.stats.captures >= 10;
    if (req === 'unlocked_achievement') return profile.unlockedAchievements.length > 0;
    return true;
  };

  const isEquipped =
    profile.selectedCharacterId === activeHero.id &&
    profile.equippedCustomizations[activeHero.id]?.outfitId === outfitId &&
    profile.equippedCustomizations[activeHero.id]?.skinId === skinId;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#E7E2D8] sm:text-3xl">
            Kingdom Champions & Wardrobe
          </h1>
          <p className="mt-1 text-sm text-[#E7E2D8]/75">
            12 original procedural 3D characters across all 4 kingdoms with live 360° preview
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'red', 'blue', 'green', 'yellow'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilterKingdom(k)}
              className={`min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                filterKingdom === k
                  ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                  : 'border-[#E7E2D8]/15 bg-[#1A2130] text-[#E7E2D8]/80 hover:border-[#E6A93C]/45'
              }`}
            >
              {k === 'all' ? 'All Kingdoms' : APP_CONFIG.kingdoms[k].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Left: Character Cards Roster */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((char) => {
            const kMeta = APP_CONFIG.kingdoms[char.kingdom];
            const selected = char.id === activeHero.id;
            const equipped = profile.selectedCharacterId === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleSelectCharacter(char.id)}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-[#E6A93C] bg-[#1A2130] shadow-lg'
                    : 'border-[#E7E2D8]/12 bg-[#1A2130]/75 hover:border-[#E6A93C]/45'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: kMeta.hex }}
                    />
                    {equipped && (
                      <span className="rounded-sm bg-[#E6A93C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#E6A93C]">
                        Equipped
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold text-[#E7E2D8]">
                    {char.name}
                  </h2>
                  <p className="text-xs font-medium text-[#E6A93C]">{char.title}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-[#E7E2D8]/70">{char.lore}</p>
                </div>
                <div className="mt-3 text-[11px] font-medium text-[#E7E2D8]/55">
                  {kMeta.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Live 360° 3D Preview & Customization */}
        <div className="space-y-4 rounded-2xl border border-[#E7E2D8]/15 bg-[#1A2130] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                {APP_CONFIG.kingdoms[activeHero.kingdom].name}
              </span>
              <h2 className="font-display text-2xl font-bold text-[#E7E2D8]">
                {activeHero.name} — {activeHero.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#E7E2D8]/75">
                {activeHero.lore}
              </p>
            </div>
          </div>

          <div className="h-[340px]">
            <CharacterPreviewCanvas
              characterId={activeHero.id}
              outfitId={outfitId}
              skinId={skinId}
              animState={animState}
            />
          </div>

          {/* Animation Preview Controls */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E6A93C]">
                Animation Studio & Poses
              </span>
              <span className="text-[11px] text-[#E7E2D8]/50">360° Orbit • Zoom • Playback Speed</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ANIM_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAnimState(opt.id)}
                  className={`min-h-[34px] rounded-md border px-2.5 text-xs font-semibold transition ${
                    animState === opt.id
                      ? 'border-[#E6A93C] bg-[#E6A93C] text-[#10141E]'
                      : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outfits */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70">
              Outfit & Armor
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeHero.outfits.map((outfit) => (
                <button
                  key={outfit.id}
                  type="button"
                  onClick={() => setOutfitId(outfit.id)}
                  className={`min-h-[42px] rounded-lg border p-2 text-left text-xs transition ${
                    outfitId === outfit.id
                      ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                      : 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/80'
                  }`}
                >
                  <div className="font-semibold">{outfit.name}</div>
                  <div className="text-[10px] capitalize opacity-70">{outfit.accessory}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Skins */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#E7E2D8]/70">
              Royal Colorway
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeHero.skins.map((skin) => {
                const unlocked = isSkinUnlocked(skin.unlockRequirement);
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => unlocked && setSkinId(skin.id)}
                    disabled={!unlocked}
                    className={`min-h-[44px] rounded-lg border p-2 text-left text-xs transition ${
                      skinId === skin.id
                        ? 'border-[#E6A93C] bg-[#E6A93C]/15 text-[#E6A93C]'
                        : unlocked
                          ? 'border-[#E7E2D8]/15 bg-[#10141E] text-[#E7E2D8]/80'
                          : 'cursor-not-allowed border-[#E7E2D8]/10 bg-[#10141E]/50 text-[#E7E2D8]/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm border border-white/25"
                        style={{ backgroundColor: skin.primaryHex }}
                      />
                      <span className="truncate font-semibold">{skin.name}</span>
                    </div>
                    {!unlocked && (
                      <div className="mt-1 text-[10px] text-[#E6A93C]/70">
                        {skin.unlockRequirement === 'wins_3'
                          ? '3 Wins'
                          : skin.unlockRequirement === 'captures_10'
                            ? '10 Captures'
                            : '1 Achievement'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void equipCharacter(activeHero.id, outfitId, skinId)}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#E6A93C] px-5 py-2.5 text-sm font-bold text-[#10141E] transition hover:bg-[#D97706]"
          >
            {isEquipped ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            <span>{isEquipped ? 'Equipped as Active Champion' : `Equip ${activeHero.name}`}</span>
          </button>
        </div>
      </div>
    </main>
  );
};
