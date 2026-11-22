import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { getCharacterById } from '../../data/characters';
import {
  getPieceGridCoord,
  HOME_LANE_COORDS,
  KINGDOM_START_INDEX,
  MAIN_TRACK_COORDS,
  STAR_TRACK_INDICES,
} from '../../engine/boardTopology';
import type { KingdomColor, MatchState } from '../../engine/types';

interface Board2DFallbackProps {
  matchState: MatchState;
  onPieceClick: (seatIndex: number, pieceIndex: 0 | 1 | 2 | 3) => void;
  onDiceClick: () => void;
}

export const Board2DFallback: React.FC<Board2DFallbackProps> = ({
  matchState,
  onPieceClick,
  onDiceClick,
}) => {
  const activeSeat = matchState.players[matchState.activeSeatIndex];
  const legalPieceSet = new Set<number>(
    matchState.phase === 'WAITING_MOVE' && activeSeat?.type === 'human'
      ? matchState.legalMoves.map((m) => m.pieceIndex)
      : [],
  );

  const cellKey = (col: number, row: number) => `${col},${row}`;
  const startCellByColor = new Map<string, KingdomColor>();
  (['red', 'blue', 'yellow', 'green'] as KingdomColor[]).forEach((color) => {
    const c = MAIN_TRACK_COORDS[KINGDOM_START_INDEX[color]];
    startCellByColor.set(cellKey(c.col, c.row), color);
  });

  const starCellKeys = new Set<string>();
  STAR_TRACK_INDICES.forEach((idx) => {
    const c = MAIN_TRACK_COORDS[idx];
    starCellKeys.add(cellKey(c.col, c.row));
  });

  const homeLaneColorMap = new Map<string, KingdomColor>();
  (['red', 'blue', 'yellow', 'green'] as KingdomColor[]).forEach((color) => {
    HOME_LANE_COORDS[color].forEach((c) => {
      homeLaneColorMap.set(cellKey(c.col, c.row), color);
    });
  });

  const renderTile = (col: number, row: number) => {
    // Skip 6x6 quadrants & 3x3 center (drawn as dedicated SVG blocks)
    const inCorner =
      (col < 6 && row < 6) ||
      (col > 8 && row < 6) ||
      (col < 6 && row > 8) ||
      (col > 8 && row > 8);
    const inCenter = col >= 6 && col <= 8 && row >= 6 && row <= 8;
    if (inCorner || inCenter) return null;

    const k = cellKey(col, row);
    const startColor = startCellByColor.get(k);
    const laneColor = homeLaneColorMap.get(k);
    const isStar = starCellKeys.has(k);

    let fill = '#F3EBDD';
    if (startColor) fill = APP_CONFIG.kingdoms[startColor].hex;
    else if (laneColor) fill = APP_CONFIG.kingdoms[laneColor].hex;
    else if ((col + row) % 2 === 1) fill = '#E7D9BF';

    return (
      <g key={k}>
        <rect
          x={col * 40 + 1}
          y={row * 40 + 1}
          width={38}
          height={38}
          rx={4}
          fill={fill}
          stroke="#10141E"
          strokeWidth={1.2}
        />
        {(isStar || startColor) && (
          <text
            x={col * 40 + 20}
            y={row * 40 + 25}
            textAnchor="middle"
            fontSize="16"
            fill={startColor ? '#FFFFFF' : '#D7A64B'}
          >
            ★
          </text>
        )}
      </g>
    );
  };

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 15; col++) {
      const node = renderTile(col, row);
      if (node) tiles.push(node);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="relative aspect-square w-full max-w-[580px] rounded-2xl border border-[#E6A93C]/40 bg-[#1A2130] p-3 shadow-2xl">
        <svg viewBox="0 0 600 600" className="h-full w-full rounded-xl bg-[#D6BE97]">
          {/* Four Kingdom Yards */}
          <rect x={0} y={0} width={240} height={240} fill="#DC2626" rx={8} />
          <rect x={360} y={0} width={240} height={240} fill="#2563EB" rx={8} />
          <rect x={0} y={360} width={240} height={240} fill="#16A34A" rx={8} />
          <rect x={360} y={360} width={240} height={240} fill="#D97706" rx={8} />

          {/* Inner Courtyard Pads */}
          <rect x={28} y={28} width={184} height={184} rx={12} fill="#10141E" fillOpacity={0.22} />
          <rect x={388} y={28} width={184} height={184} rx={12} fill="#10141E" fillOpacity={0.22} />
          <rect x={28} y={388} width={184} height={184} rx={12} fill="#10141E" fillOpacity={0.22} />
          <rect x={388} y={388} width={184} height={184} rx={12} fill="#10141E" fillOpacity={0.22} />

          {/* Track Tiles */}
          {tiles}

          {/* Central Royal Sanctuary */}
          <polygon points="240,240 300,300 240,360" fill="#DC2626" stroke="#E6A93C" strokeWidth={2} />
          <polygon points="240,240 360,240 300,300" fill="#2563EB" stroke="#E6A93C" strokeWidth={2} />
          <polygon points="360,240 360,360 300,300" fill="#D97706" stroke="#E6A93C" strokeWidth={2} />
          <polygon points="240,360 300,300 360,360" fill="#16A34A" stroke="#E6A93C" strokeWidth={2} />
          <circle
            cx={300}
            cy={300}
            r={28}
            fill="#10141E"
            stroke="#E6A93C"
            strokeWidth={3}
            className="cursor-pointer"
            onClick={onDiceClick}
          />
          <text
            x={300}
            y={306}
            textAnchor="middle"
            fill="#E6A93C"
            fontSize="18"
            fontWeight="bold"
            className="pointer-events-none select-none font-mono"
          >
            {matchState.currentDice ?? 'ROLL'}
          </text>

          {/* Character Pieces */}
          {matchState.players.map((player) =>
            player.pieces.map((piece) => {
              const coord = getPieceGridCoord(player.color, piece.pieceIndex, piece.progress);
              const cx = coord.col * 40 + 20;
              const cy = coord.row * 40 + 20;
              const isLegal =
                player.seatIndex === matchState.activeSeatIndex && legalPieceSet.has(piece.pieceIndex);
              const char = getCharacterById(player.characterId);
              return (
                <g
                  key={`${player.seatIndex}-${piece.pieceIndex}`}
                  onClick={() => onPieceClick(player.seatIndex, piece.pieceIndex)}
                  className={isLegal ? 'cursor-pointer' : 'cursor-default'}
                >
                  {isLegal && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={18}
                      fill="none"
                      stroke="#FDE047"
                      strokeWidth={3}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={14}
                    fill={APP_CONFIG.kingdoms[player.color].hex}
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill="#FFFFFF"
                    className="pointer-events-none select-none"
                  >
                    {char.name.slice(0, 2).toUpperCase()}
                  </text>
                </g>
              );
            }),
          )}
        </svg>
      </div>
    </div>
  );
};
