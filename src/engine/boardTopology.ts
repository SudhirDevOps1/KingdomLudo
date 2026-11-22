import type { KingdomColor } from './types';

export interface GridCoord {
  col: number;
  row: number;
}

export interface WorldCoord {
  x: number;
  z: number;
}

export const TILE_SIZE = 1.0;
export const BOARD_GRID_SIZE = 15;

export function gridToWorld(coord: GridCoord): WorldCoord {
  return {
    x: (coord.col - 7) * TILE_SIZE,
    z: (coord.row - 7) * TILE_SIZE,
  };
}

/**
 * 52-cell clockwise main track on a 15x15 Ludo board (col 0..14, row 0..14).
 * Index 0 = Red start (1,6)
 * Index 13 = Blue start (8,1)
 * Index 26 = Yellow start (13,8)
 * Index 39 = Green start (6,13)
 */
export const MAIN_TRACK_COORDS: readonly GridCoord[] = [
  // 0..4 (Red arm top row moving right)
  { col: 1, row: 6 },
  { col: 2, row: 6 },
  { col: 3, row: 6 },
  { col: 4, row: 6 },
  { col: 5, row: 6 },
  // 5..10 (Top arm left column moving up)
  { col: 6, row: 5 },
  { col: 6, row: 4 },
  { col: 6, row: 3 },
  { col: 6, row: 2 },
  { col: 6, row: 1 },
  { col: 6, row: 0 },
  // 11 (Top middle)
  { col: 7, row: 0 },
  // 12..17 (Top arm right column moving down; 13 is Blue start)
  { col: 8, row: 0 },
  { col: 8, row: 1 },
  { col: 8, row: 2 },
  { col: 8, row: 3 },
  { col: 8, row: 4 },
  { col: 8, row: 5 },
  // 18..23 (Right arm top row moving right)
  { col: 9, row: 6 },
  { col: 10, row: 6 },
  { col: 11, row: 6 },
  { col: 12, row: 6 },
  { col: 13, row: 6 },
  { col: 14, row: 6 },
  // 24 (Right middle)
  { col: 14, row: 7 },
  // 25..30 (Right arm bottom row moving left; 26 is Yellow start)
  { col: 14, row: 8 },
  { col: 13, row: 8 },
  { col: 12, row: 8 },
  { col: 11, row: 8 },
  { col: 10, row: 8 },
  { col: 9, row: 8 },
  // 31..36 (Bottom arm right column moving down)
  { col: 8, row: 9 },
  { col: 8, row: 10 },
  { col: 8, row: 11 },
  { col: 8, row: 12 },
  { col: 8, row: 13 },
  { col: 8, row: 14 },
  // 37 (Bottom middle)
  { col: 7, row: 14 },
  // 38..43 (Bottom arm left column moving up; 39 is Green start)
  { col: 6, row: 14 },
  { col: 6, row: 13 },
  { col: 6, row: 12 },
  { col: 6, row: 11 },
  { col: 6, row: 10 },
  { col: 6, row: 9 },
  // 44..49 (Left arm bottom row moving left)
  { col: 5, row: 8 },
  { col: 4, row: 8 },
  { col: 3, row: 8 },
  { col: 2, row: 8 },
  { col: 1, row: 8 },
  { col: 0, row: 8 },
  // 50 (Left middle)
  { col: 0, row: 7 },
  // 51 (Top-left end before Red start)
  { col: 0, row: 6 },
] as const;

export const KINGDOM_START_INDEX: Record<KingdomColor, number> = {
  red: 0,
  blue: 13,
  yellow: 26,
  green: 39,
};

/**
 * 8 canonical safe cells on the 52-cell outer ring (4 start cells + 4 star cells).
 */
export const SAFE_TRACK_INDICES = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

export const STAR_TRACK_INDICES = new Set<number>([8, 21, 34, 47]);

export const HOME_LANE_COORDS: Record<KingdomColor, readonly GridCoord[]> = {
  red: [
    { col: 1, row: 7 },
    { col: 2, row: 7 },
    { col: 3, row: 7 },
    { col: 4, row: 7 },
    { col: 5, row: 7 },
  ],
  blue: [
    { col: 7, row: 1 },
    { col: 7, row: 2 },
    { col: 7, row: 3 },
    { col: 7, row: 4 },
    { col: 7, row: 5 },
  ],
  yellow: [
    { col: 13, row: 7 },
    { col: 12, row: 7 },
    { col: 11, row: 7 },
    { col: 10, row: 7 },
    { col: 9, row: 7 },
  ],
  green: [
    { col: 7, row: 13 },
    { col: 7, row: 12 },
    { col: 7, row: 11 },
    { col: 7, row: 10 },
    { col: 7, row: 9 },
  ],
};

export const HOME_GOAL_COORDS: Record<KingdomColor, GridCoord> = {
  red: { col: 6.25, row: 7 },
  blue: { col: 7, row: 6.25 },
  yellow: { col: 7.75, row: 7 },
  green: { col: 7, row: 7.75 },
};

export const YARD_SLOT_COORDS: Record<KingdomColor, readonly [GridCoord, GridCoord, GridCoord, GridCoord]> = {
  red: [
    { col: 1.5, row: 1.5 },
    { col: 3.5, row: 1.5 },
    { col: 1.5, row: 3.5 },
    { col: 3.5, row: 3.5 },
  ],
  blue: [
    { col: 10.5, row: 1.5 },
    { col: 12.5, row: 1.5 },
    { col: 10.5, row: 3.5 },
    { col: 12.5, row: 3.5 },
  ],
  yellow: [
    { col: 10.5, row: 10.5 },
    { col: 12.5, row: 10.5 },
    { col: 10.5, row: 12.5 },
    { col: 12.5, row: 12.5 },
  ],
  green: [
    { col: 1.5, row: 10.5 },
    { col: 3.5, row: 10.5 },
    { col: 1.5, row: 12.5 },
    { col: 3.5, row: 12.5 },
  ],
};

/**
 * Maps a piece's relative progress (-1..56) to its absolute main-track index (0..51) or null if in yard/home lane/goal.
 */
export function getAbsoluteTrackIndex(color: KingdomColor, progress: number): number | null {
  if (progress < 0 || progress > 50) return null;
  return (KINGDOM_START_INDEX[color] + progress) % 52;
}

export function getPieceGridCoord(
  color: KingdomColor,
  pieceIndex: 0 | 1 | 2 | 3,
  progress: number,
): GridCoord {
  if (progress < 0) {
    return YARD_SLOT_COORDS[color][pieceIndex];
  }
  if (progress <= 50) {
    const absIdx = getAbsoluteTrackIndex(color, progress)!;
    return MAIN_TRACK_COORDS[absIdx];
  }
  if (progress <= 55) {
    return HOME_LANE_COORDS[color][progress - 51];
  }
  return HOME_GOAL_COORDS[color];
}

export function getPieceWorldCoord(
  color: KingdomColor,
  pieceIndex: 0 | 1 | 2 | 3,
  progress: number,
): WorldCoord {
  return gridToWorld(getPieceGridCoord(color, pieceIndex, progress));
}

export function getSeatsForPlayerCount(count: 2 | 3 | 4): KingdomColor[] {
  if (count === 2) return ['red', 'yellow'];
  if (count === 3) return ['red', 'blue', 'yellow'];
  return ['red', 'blue', 'yellow', 'green'];
}
