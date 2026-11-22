export const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  es: 'Español',
  fr: 'Français',
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_LABELS;

export interface AppTranslations {
  home: string;
  characters: string;
  history: string;
  settings: string;
  selectPiece: string;
  rollDice: string;
  backToHub: string;
  victory: string;
  playAgain: string;
  playAI: string;
  playOffline: string;
  guestMode: string;
  resumeMatch: string;
  privateRoom: string;
  boards: string;
}

const TRANSLATIONS: Record<SupportedLanguage, AppTranslations> = {
  en: {
    home: 'Home',
    characters: 'Heroes',
    history: 'Chronicle',
    settings: 'Settings',
    selectPiece: 'Select a hero to move',
    rollDice: 'Roll Dice',
    backToHub: 'Return to Hub',
    victory: 'Victory Achieved!',
    playAgain: 'Play Again',
    playAI: 'Play vs Computer',
    playOffline: 'Pass & Play',
    guestMode: 'Offline Guest',
    resumeMatch: 'Resume Match',
    privateRoom: 'Private Room',
    boards: 'Board Themes',
  },
  hi: {
    home: 'मुख्य पृष्ठ',
    characters: 'वीर पात्र',
    history: 'इतिहास',
    settings: 'सेटिंग्स',
    selectPiece: 'चाल चलने के लिए पात्र चुनें',
    rollDice: 'पासा फेंकें',
    backToHub: 'हब पर लौटें',
    victory: 'शानदार विजय!',
    playAgain: 'पुनः खेलें',
    playAI: 'कंप्यूटर के विरुद्ध खेलें',
    playOffline: 'पास एंड प्ले (ऑफ़लाइन)',
    guestMode: 'ऑफ़लाइन अतिथि',
    resumeMatch: 'खेल जारी रखें',
    privateRoom: 'निजी कक्ष',
    boards: 'बोर्ड थीम',
  },
  es: {
    home: 'Inicio',
    characters: 'Héroes',
    history: 'Crónica',
    settings: 'Ajustes',
    selectPiece: 'Selecciona un héroe para mover',
    rollDice: 'Lanzar Dado',
    backToHub: 'Volver al Inicio',
    victory: '¡Victoria Real!',
    playAgain: 'Jugar de Nuevo',
    playAI: 'Jugar vs Computadora',
    playOffline: 'Pasa y Juega',
    guestMode: 'Invitado Offline',
    resumeMatch: 'Reanudar Partida',
    privateRoom: 'Sala Privada',
    boards: 'Temas de Tablero',
  },
  fr: {
    home: 'Accueil',
    characters: 'Héros',
    history: 'Chronique',
    settings: 'Paramètres',
    selectPiece: 'Sélectionnez un héros',
    rollDice: 'Lancer le Dé',
    backToHub: 'Retour au Menu',
    victory: 'Victoire Royale !',
    playAgain: 'Rejouer',
    playAI: 'Jouer contre IA',
    playOffline: 'Passe & Joue',
    guestMode: 'Invité Hors-Ligne',
    resumeMatch: 'Reprendre la Partie',
    privateRoom: 'Salon Privé',
    boards: 'Thèmes de Plateau',
  },
};

export function getTranslations(lang: SupportedLanguage = 'en'): AppTranslations {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
