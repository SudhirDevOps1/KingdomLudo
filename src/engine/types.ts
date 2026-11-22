export type KingdomColor = 'red' | 'blue' | 'yellow' | 'green';

export type RulePreset = 'classic_kingdom' | 'standard';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type AIPersonality = 'aggressive' | 'guardian' | 'balanced' | 'tactician';

export type PlayerSeatType = 'human' | 'ai' | 'remote';

export type MatchPhase = 'WAITING_ROLL' | 'WAITING_MOVE' | 'GAME_OVER';

export interface RuleConfig {
  preset: RulePreset;
  extraTurnOnSix: boolean;
  extraTurnOnCapture: boolean;
  extraTurnOnHome: boolean;
  safeZonesEnabled: boolean;
  threeSixesForfeitTurn: boolean;
  exactHomeRequired: boolean;
  turnTimerSeconds: number;
}

export interface PieceState {
  pieceIndex: 0 | 1 | 2 | 3;
  /**
   * -1 = In base yard
   * 0..50 = Relative steps on main 52-cell track (0 is player's start cell)
   * 51..55 = Player's colored home lane (5 cells)
   * 56 = Reached final central sanctuary (completed)
   */
  progress: number;
}

export interface PlayerSeat {
  seatIndex: number;
  color: KingdomColor;
  name: string;
  type: PlayerSeatType;
  aiDifficulty?: AIDifficulty;
  aiPersonality?: AIPersonality;
  characterId: string;
  outfitId: string;
  skinId: string;
  connected: boolean;
  ready: boolean;
  userId?: string;
  pieces: [PieceState, PieceState, PieceState, PieceState];
  finishedOrder: number | null;
  stats: {
    capturesMade: number;
    timesCaptured: number;
    sixesRolled: number;
    turnsTaken: number;
  };
}

export interface MoveOption {
  pieceIndex: 0 | 1 | 2 | 3;
  fromProgress: number;
  toProgress: number;
  entersBoard: boolean;
  reachesHome: boolean;
  landsOnSafeZone: boolean;
  capturedPieces: Array<{ seatIndex: number; color: KingdomColor; pieceIndex: 0 | 1 | 2 | 3 }>;
}

export interface MoveLogEntry {
  seq: number;
  timestamp: number;
  seatIndex: number;
  color: KingdomColor;
  playerName: string;
  diceValue: number;
  action: 'roll_no_move' | 'forfeit_three_sixes' | 'move' | 'pass';
  pieceIndex?: 0 | 1 | 2 | 3;
  fromProgress?: number;
  toProgress?: number;
  capturedCount?: number;
  reachedHome?: boolean;
  awardedExtraTurn?: boolean;
}

export interface MatchState {
  matchId: string;
  mode: 'pass_and_play' | 'vs_ai' | 'practice' | 'online_private' | 'online_public';
  boardThemeId: string;
  rules: RuleConfig;
  players: PlayerSeat[];
  activeSeatIndex: number;
  phase: MatchPhase;
  currentDice: number | null;
  consecutiveSixes: number;
  legalMoves: MoveOption[];
  moveSeq: number;
  moveLog: MoveLogEntry[];
  winners: KingdomColor[];
  startedAt: number;
  updatedAt: number;
  finishedAt: number | null;
}
