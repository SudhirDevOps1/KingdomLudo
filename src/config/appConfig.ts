import courtyardBackdrop from '@/src/assets/images/courtyard_hero_backdrop_1795356726033.jpg';
import appEmblem from '@/src/assets/images/kingdomludo_app_icon_1795360671319.jpg';
import crestRed from '@/src/assets/images/crest_red_kingdom_1795356727768.jpg';
import crestBlue from '@/src/assets/images/crest_blue_kingdom_1795356726471.jpg';
import crestGreen from '@/src/assets/images/crest_green_kingdom_1795356726368.jpg';
import crestYellow from '@/src/assets/images/crest_yellow_kingdom_1795356726466.jpg';
import type { KingdomColor } from '../engine/types';
import {
  APP_VERSION,
  APP_RELEASE_CHANNEL,
  APP_RELEASE_TAG,
  ANDROID_VERSION_CODE,
} from './version';

export interface AppFeatureFlags {
  enableOnlineMultiplayer: boolean;
  enablePublicMatchmaking: boolean;
  enableFirebaseSync: boolean;
  enableCustomGlbLoader: boolean;
  enablePwaInstallPrompt: boolean;
  enableAudioSynthesis: boolean;
  enable2DFallback: boolean;
}

export interface KingdomMeta {
  id: KingdomColor;
  name: string;
  motto: string;
  hex: string;
  accentHex: string;
  crestUrl: string;
}

export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'KingdomLudo',
  shortName: 'KingdomLudo',
  packageId: import.meta.env.VITE_APP_PACKAGE_ID || 'com.kingdomludo.app',
  version: APP_VERSION,
  releaseChannel: APP_RELEASE_CHANNEL,
  releaseTag: APP_RELEASE_TAG,
  stabilityNotice: 'Early development alpha — core 2D/3D gameplay, AI, offline saves, and live WebSocket rooms are playable; native Android binaries build in CI.',
  androidVersionCode: ANDROID_VERSION_CODE,
  defaultThemeId: 'royal-enchanted-courtyard',
  defaultLanguage: 'en' as const,
  colors: {
    obsidian: '#10141E',
    slate: '#1A2130',
    ivory: '#E7E2D8',
    royalGold: '#E6A93C',
    sovereignGold: '#D97706',
    crimson: '#DC2626',
    cobalt: '#2563EB',
    emerald: '#16A34A',
    amber: '#D97706',
  },
  assets: {
    appEmblem,
    courtyardBackdrop,
    crests: {
      red: crestRed,
      blue: crestBlue,
      green: crestGreen,
      yellow: crestYellow,
    },
  },
  kingdoms: {
    red: {
      id: 'red',
      name: 'Crimson Spire',
      motto: 'Forged in Dragonfire',
      hex: '#DC2626',
      accentHex: '#F97316',
      crestUrl: crestRed,
    },
    blue: {
      id: 'blue',
      name: 'Cobalt Bastion',
      motto: 'Steadfast as the Glacier',
      hex: '#2563EB',
      accentHex: '#38BDF8',
      crestUrl: crestBlue,
    },
    green: {
      id: 'green',
      name: 'Emerald Grove',
      motto: 'Rooted in Ancient Wisdom',
      hex: '#16A34A',
      accentHex: '#4ADE80',
      crestUrl: crestGreen,
    },
    yellow: {
      id: 'yellow',
      name: 'Sovereign Sun',
      motto: 'Crowned in Eternal Gold',
      hex: '#D97706',
      accentHex: '#FBBF24',
      crestUrl: crestYellow,
    },
  } satisfies Record<KingdomColor, KingdomMeta>,
  featureFlags: {
    enableOnlineMultiplayer: true,
    enablePublicMatchmaking: true,
    enableFirebaseSync: true,
    enableCustomGlbLoader: true,
    enablePwaInstallPrompt: true,
    enableAudioSynthesis: true,
    enable2DFallback: true,
  } satisfies AppFeatureFlags,
} as const;
