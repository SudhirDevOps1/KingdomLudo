import { createAvatar } from '@dicebear/core';
import {
  adventurer,
  avataaars,
  bottts,
  lorelei,
  pixelArt,
  shapes,
} from '@dicebear/collection';

export type DiceBearStyleId =
  | 'adventurer'
  | 'bottts'
  | 'lorelei'
  | 'avataaars'
  | 'pixelArt'
  | 'shapes';

export const DICEBEAR_STYLES: Array<{ id: DiceBearStyleId; label: string }> = [
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'bottts', label: 'Mecha Bot' },
  { id: 'lorelei', label: 'Royal Portrait' },
  { id: 'avataaars', label: 'Commander' },
  { id: 'pixelArt', label: 'Pixel Knight' },
  { id: 'shapes', label: 'Kingdom Crest' },
];

export function generateDiceBearAvatarUri(
  styleId: DiceBearStyleId = 'adventurer',
  seed = 'Royal Commander',
  size = 128,
): string {
  const cleanSeed = (seed || 'Royal Commander').trim();
  const options = {
    seed: cleanSeed,
    size,
    radius: 16,
  };

  switch (styleId) {
    case 'bottts':
      return createAvatar(bottts, options).toDataUri();
    case 'lorelei':
      return createAvatar(lorelei, options).toDataUri();
    case 'avataaars':
      return createAvatar(avataaars, options).toDataUri();
    case 'pixelArt':
      return createAvatar(pixelArt, options).toDataUri();
    case 'shapes':
      return createAvatar(shapes, options).toDataUri();
    case 'adventurer':
    default:
      return createAvatar(adventurer, options).toDataUri();
  }
}

export function createRandomAvatarSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return `cmd-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return `cmd-${Math.random().toString(36).slice(2, 10)}`;
}
