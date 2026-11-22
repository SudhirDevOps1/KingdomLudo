import type { KingdomColor } from '../engine/types';

export interface KingdomCharacterSkin {
  id: string;
  name: string;
  primaryHex: string;
  secondaryHex: string;
  trimHex: string;
  unlockRequirement: 'default' | 'wins_3' | 'captures_10' | 'unlocked_achievement';
}

export interface KingdomCharacterOutfit {
  id: string;
  name: string;
  accessory: 'crown' | 'scarf' | 'pauldrons' | 'cloak' | 'orb';
  accentColor: string;
  metalness: number;
}

export interface KingdomCharacter {
  id: string;
  name: string;
  title: string;
  lore: string;
  kingdom: KingdomColor;
  archetype:
    | 'dragon'
    | 'fox'
    | 'wolf'
    | 'phoenix'
    | 'ice_sprite'
    | 'panda'
    | 'turtle'
    | 'forest_guardian'
    | 'lion'
    | 'tiger'
    | 'royal_griffin'
    | 'penguin';
  unlockCostWins: number;
  skins: KingdomCharacterSkin[];
  outfits: KingdomCharacterOutfit[];
}

export const CHARACTERS: KingdomCharacter[] = [
  // RED KINGDOM: Crimson Spire
  {
    id: 'ignis-drake',
    name: 'Ignis',
    title: 'The Drake Sovereign',
    lore: 'Born from molten caldera magma, Ignis leads the Crimson Spire with blazing resolve and ancient draconic fury.',
    kingdom: 'red',
    archetype: 'dragon',
    unlockCostWins: 0,
    skins: [
      { id: 'classic', name: 'Caldera Crimson', primaryHex: '#DC2626', secondaryHex: '#F97316', trimHex: '#E6A93C', unlockRequirement: 'default' },
      { id: 'obsidian-flame', name: 'Obsidian Flame', primaryHex: '#1E293B', secondaryHex: '#EF4444', trimHex: '#F59E0B', unlockRequirement: 'wins_3' },
      { id: 'sunburst', name: 'Solar Apex', primaryHex: '#EA580C', secondaryHex: '#FBBF24', trimHex: '#FFFFFF', unlockRequirement: 'captures_10' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Crimson Pauldrons', accessory: 'pauldrons', accentColor: '#E6A93C', metalness: 0.8 },
      { id: 'dragon-crown', name: 'Crown of Cinders', accessory: 'crown', accentColor: '#F59E0B', metalness: 0.9 },
      { id: 'fire-cloak', name: 'Mantle of Ash', accessory: 'cloak', accentColor: '#991B1B', metalness: 0.2 },
    ],
  },
  {
    id: 'ember-vulpis',
    name: 'Vulpis',
    title: 'Cinder Trickster',
    lore: 'A cunning kitsune spirit darting between embers, outmaneuvering adversaries across the enchanted courtyard.',
    kingdom: 'red',
    archetype: 'fox',
    unlockCostWins: 1,
    skins: [
      { id: 'classic', name: 'Ember Rust', primaryHex: '#EA580C', secondaryHex: '#FDBA74', trimHex: '#DC2626', unlockRequirement: 'default' },
      { id: 'midnight-ember', name: 'Shadow Fox', primaryHex: '#334155', secondaryHex: '#FB923C', trimHex: '#E2E8F0', unlockRequirement: 'wins_3' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Nomad Scarf', accessory: 'scarf', accentColor: '#DC2626', metalness: 0.2 },
      { id: 'solar-crown', name: 'Fox Crest', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.85 },
    ],
  },
  {
    id: 'pyra-phoenix',
    name: 'Pyra',
    title: 'Immortal Pyre',
    lore: 'Reborn in golden incandescent flame, Pyra heralds turning tides and unstoppable comebacks.',
    kingdom: 'red',
    archetype: 'phoenix',
    unlockCostWins: 3,
    skins: [
      { id: 'classic', name: 'Sunburst Crimson', primaryHex: '#EF4444', secondaryHex: '#FCD34D', trimHex: '#D97706', unlockRequirement: 'default' },
      { id: 'rose-gold', name: 'Dawn Feathers', primaryHex: '#F43F5E', secondaryHex: '#FED7AA', trimHex: '#E6A93C', unlockRequirement: 'captures_10' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Solar Crown', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.9 },
      { id: 'feather-cloak', name: 'Sky Mantle', accessory: 'cloak', accentColor: '#B91C1C', metalness: 0.3 },
    ],
  },

  // BLUE KINGDOM: Cobalt Bastion
  {
    id: 'glacier-lupus',
    name: 'Fenris',
    title: 'Glacier Vanguard',
    lore: 'Alpha hunter of the permafrost peaks, Fenris guards Cobalt Bastion with disciplined pack tactics.',
    kingdom: 'blue',
    archetype: 'wolf',
    unlockCostWins: 0,
    skins: [
      { id: 'classic', name: 'Cobalt Frost', primaryHex: '#2563EB', secondaryHex: '#93C5FD', trimHex: '#E0F2FE', unlockRequirement: 'default' },
      { id: 'arctic-white', name: 'Polar Blizzard', primaryHex: '#F1F5F9', secondaryHex: '#60A5FA', trimHex: '#1E40AF', unlockRequirement: 'wins_3' },
      { id: 'deep-trench', name: 'Abyssal Depth', primaryHex: '#1E1B4B', secondaryHex: '#38BDF8', trimHex: '#F8FAFC', unlockRequirement: 'unlocked_achievement' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Bastion Pauldrons', accessory: 'pauldrons', accentColor: '#93C5FD', metalness: 0.85 },
      { id: 'frost-crown', name: 'Diadem of Rime', accessory: 'crown', accentColor: '#E0F2FE', metalness: 0.9 },
      { id: 'winter-scarf', name: 'Northern Scarf', accessory: 'scarf', accentColor: '#1D4ED8', metalness: 0.2 },
    ],
  },
  {
    id: 'cryo-penguin',
    name: 'Tuxedo',
    title: 'Frost Cavalier',
    lore: 'Dignified yet surprisingly agile, Tuxedo slides past enemy defenses on icy tabletop tracks.',
    kingdom: 'blue',
    archetype: 'penguin',
    unlockCostWins: 1,
    skins: [
      { id: 'classic', name: 'Emperor Royal', primaryHex: '#1E293B', secondaryHex: '#F8FAFC', trimHex: '#F59E0B', unlockRequirement: 'default' },
      { id: 'cobalt-tux', name: 'Glacial Blue', primaryHex: '#1D4ED8', secondaryHex: '#E0F2FE', trimHex: '#FBBF24', unlockRequirement: 'wins_3' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Honor Scarf', accessory: 'scarf', accentColor: '#2563EB', metalness: 0.15 },
      { id: 'ice-crown', name: 'Miniature Coronet', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.9 },
    ],
  },
  {
    id: 'frost-golem',
    name: 'Kragor',
    title: 'Glacier Sprite Monolith',
    lore: 'Carved from living cobalt glacier crystal, Kragor is an unyielding fortress of the northern front.',
    kingdom: 'blue',
    archetype: 'ice_sprite',
    unlockCostWins: 2,
    skins: [
      { id: 'classic', name: 'Cobalt Quartz', primaryHex: '#3B82F6', secondaryHex: '#DBEAFE', trimHex: '#60A5FA', unlockRequirement: 'default' },
      { id: 'dark-ice', name: 'Black Ice', primaryHex: '#0F172A', secondaryHex: '#0284C7', trimHex: '#38BDF8', unlockRequirement: 'captures_10' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Runic Orb', accessory: 'orb', accentColor: '#67E8F9', metalness: 0.7 },
      { id: 'golem-pauldrons', name: 'Spike Pauldrons', accessory: 'pauldrons', accentColor: '#93C5FD', metalness: 0.85 },
    ],
  },

  // GREEN KINGDOM: Emerald Grove
  {
    id: 'bamboo-warden',
    name: 'Bao',
    title: 'The Grove Warden',
    lore: 'Master of patient defense and peaceful balance, Bao harnesses ancient emerald currents to protect his kingdom.',
    kingdom: 'green',
    archetype: 'panda',
    unlockCostWins: 0,
    skins: [
      { id: 'classic', name: 'Emerald Panda', primaryHex: '#16A34A', secondaryHex: '#F8FAFC', trimHex: '#E6A93C', unlockRequirement: 'default' },
      { id: 'jade-spirit', name: 'Jade Harmony', primaryHex: '#15803D', secondaryHex: '#86EFAC', trimHex: '#D97706', unlockRequirement: 'wins_3' },
      { id: 'shadow-bamboo', name: 'Night Stalker', primaryHex: '#064E3B', secondaryHex: '#34D399', trimHex: '#FDE047', unlockRequirement: 'unlocked_achievement' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Grove Scarf', accessory: 'scarf', accentColor: '#15803D', metalness: 0.2 },
      { id: 'monk-pauldrons', name: 'Bamboo Pauldrons', accessory: 'pauldrons', accentColor: '#4ADE80', metalness: 0.5 },
      { id: 'jade-crown', name: 'Lotus Coronet', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.85 },
    ],
  },
  {
    id: 'jade-tortoise',
    name: 'Genbu',
    title: 'Ancient Carapace',
    lore: 'Immovable as the rooted mountains, Genbu weathers every ambush and outlasts all competition.',
    kingdom: 'green',
    archetype: 'turtle',
    unlockCostWins: 1,
    skins: [
      { id: 'classic', name: 'Moss Shell', primaryHex: '#15803D', secondaryHex: '#A3E635', trimHex: '#E6A93C', unlockRequirement: 'default' },
      { id: 'stone-shell', name: 'Granite Moss', primaryHex: '#3F6212', secondaryHex: '#D9F99D', trimHex: '#65A30D', unlockRequirement: 'wins_3' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Grove Mantle', accessory: 'cloak', accentColor: '#166534', metalness: 0.25 },
      { id: 'sage-crown', name: 'Elder Circlet', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.9 },
    ],
  },
  {
    id: 'sylvan-treant',
    name: 'Rowan',
    title: 'Heart of the Woods',
    lore: 'Ancient arboreal spirit whose gentle footfalls bring verdant growth and steadfast resilience.',
    kingdom: 'green',
    archetype: 'forest_guardian',
    unlockCostWins: 2,
    skins: [
      { id: 'classic', name: 'Deep Evergreen', primaryHex: '#166534', secondaryHex: '#86EFAC', trimHex: '#CA8A04', unlockRequirement: 'default' },
      { id: 'autumn-gold', name: 'Autumn Birch', primaryHex: '#B45309', secondaryHex: '#FEF08A', trimHex: '#E6A93C', unlockRequirement: 'captures_10' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Life Orb', accessory: 'orb', accentColor: '#4ADE80', metalness: 0.6 },
      { id: 'forest-pauldrons', name: 'Bark Guard', accessory: 'pauldrons', accentColor: '#15803D', metalness: 0.4 },
    ],
  },

  // YELLOW KINGDOM: Sovereign Sun
  {
    id: 'auric-leo',
    name: 'Leander',
    title: 'The Sun King',
    lore: 'Radiating golden majesty, Leander commands the board with unshakeable dignity and decisive momentum.',
    kingdom: 'yellow',
    archetype: 'lion',
    unlockCostWins: 0,
    skins: [
      { id: 'classic', name: 'Sovereign Gold', primaryHex: '#D97706', secondaryHex: '#FDE047', trimHex: '#FFFFFF', unlockRequirement: 'default' },
      { id: 'radiant-sun', name: 'Solar Flare', primaryHex: '#F59E0B', secondaryHex: '#FEF08A', trimHex: '#B45309', unlockRequirement: 'wins_3' },
      { id: 'regal-white', name: 'White Lion', primaryHex: '#F8FAFC', secondaryHex: '#FBBF24', trimHex: '#D97706', unlockRequirement: 'unlocked_achievement' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Sovereign Pauldrons', accessory: 'pauldrons', accentColor: '#FDE047', metalness: 0.9 },
      { id: 'sun-crown', name: 'Crown of Radiance', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.95 },
      { id: 'imperial-cloak', name: 'Cloth of Gold', accessory: 'cloak', accentColor: '#B45309', metalness: 0.4 },
    ],
  },
  {
    id: 'solar-tigris',
    name: 'Tigris',
    title: 'Striped Thunder',
    lore: 'Swift as sunlight breaking through dawn clouds, Tigris pounces with unmatched ferocity.',
    kingdom: 'yellow',
    archetype: 'tiger',
    unlockCostWins: 1,
    skins: [
      { id: 'classic', name: 'Amber Stripes', primaryHex: '#D97706', secondaryHex: '#1E293B', trimHex: '#FDE047', unlockRequirement: 'default' },
      { id: 'golden-shadow', name: 'Golden Shadow', primaryHex: '#CA8A04', secondaryHex: '#475569', trimHex: '#FEF08A', unlockRequirement: 'wins_3' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Hunter Scarf', accessory: 'scarf', accentColor: '#D97706', metalness: 0.2 },
      { id: 'warrior-crown', name: 'Apex Circlet', accessory: 'crown', accentColor: '#FBBF24', metalness: 0.85 },
    ],
  },
  {
    id: 'sun-griffin',
    name: 'Gryphos',
    title: 'Sky Sovereign',
    lore: 'High monarch of the cloud spires, Gryphos surveys the battlefield and strikes with unerring accuracy.',
    kingdom: 'yellow',
    archetype: 'royal_griffin',
    unlockCostWins: 3,
    skins: [
      { id: 'classic', name: 'Imperial Plume', primaryHex: '#F59E0B', secondaryHex: '#FEF3C7', trimHex: '#D97706', unlockRequirement: 'default' },
      { id: 'celestial-white', name: 'Dawn Falcon', primaryHex: '#F1F5F9', secondaryHex: '#FDE047', trimHex: '#B45309', unlockRequirement: 'captures_10' },
    ],
    outfits: [
      { id: 'royal-guard', name: 'Imperial Coronet', accessory: 'crown', accentColor: '#E6A93C', metalness: 0.95 },
      { id: 'wind-pauldrons', name: 'Aegis Pauldrons', accessory: 'pauldrons', accentColor: '#F59E0B', metalness: 0.8 },
    ],
  },
];

export function getCharacterById(id: string): KingdomCharacter {
  const char = CHARACTERS.find((c) => c.id === id);
  if (!char) {
    return CHARACTERS[0];
  }
  return char;
}

export function getCharactersForKingdom(kingdom: KingdomColor): KingdomCharacter[] {
  return CHARACTERS.filter((c) => c.kingdom === kingdom);
}
