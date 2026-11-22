import type { StoredProfile } from '../persistence/localPersistence';

export interface KingdomAchievement {
  id: string;
  title: string;
  description: string;
  category: 'Combat' | 'Mastery' | 'Progression' | 'Fortune';
  metricKey: keyof StoredProfile['stats'];
  targetValue: number;
}

export interface PracticeChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  playerCount: 2 | 3 | 4;
}

export const ACHIEVEMENTS: KingdomAchievement[] = [
  {
    id: 'first_victory',
    title: 'Crown of Initiation',
    description: 'Claim your very first match victory across any mode.',
    category: 'Progression',
    metricKey: 'wins',
    targetValue: 1,
  },
  {
    id: 'combat_veteran',
    title: 'Courtyard Veteran',
    description: 'Complete 5 full tabletop skirmishes.',
    category: 'Progression',
    metricKey: 'matchesPlayed',
    targetValue: 5,
  },
  {
    id: 'capture_specialist',
    title: 'Ruthless Tactician',
    description: 'Capture 10 opponent pieces in battle.',
    category: 'Combat',
    metricKey: 'captures',
    targetValue: 10,
  },
  {
    id: 'lucky_roller',
    title: 'Fortune’s Chosen',
    description: 'Roll a natural six 20 times across your matches.',
    category: 'Fortune',
    metricKey: 'sixesRolled',
    targetValue: 20,
  },
  {
    id: 'hard_ai_slayer',
    title: 'Grandmaster Vanquisher',
    description: 'Triumph against Hard AI in single-player or practice skirmish.',
    category: 'Mastery',
    metricKey: 'hardAiWins',
    targetValue: 1,
  },
  {
    id: 'realm_champion',
    title: 'Sovereign of the Realm',
    description: 'Achieve 10 total victories and establish your royal reign.',
    category: 'Mastery',
    metricKey: 'wins',
    targetValue: 10,
  },
];

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  {
    id: 'skirmish_duel',
    title: 'Frontline Duel',
    description: 'Fast-paced 1v1 duel against a novice AI commander.',
    difficulty: 'easy',
    playerCount: 2,
  },
  {
    id: 'royal_free_for_all',
    title: 'Royal 4-Player Melee',
    description: 'Classic 4-way kingdom brawl with balanced tactical AI opponents.',
    difficulty: 'medium',
    playerCount: 4,
  },
  {
    id: 'veteran_trial',
    title: 'Veteran’s Crucible',
    description: 'Face three relentless AI tacticians in an unforgiving high-stakes match.',
    difficulty: 'hard',
    playerCount: 4,
  },
];
