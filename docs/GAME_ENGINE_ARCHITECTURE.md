# Game Engine Architecture

## Pure Functional State Machine (`src/engine/`)
All game logic is completely decoupled from React and Three.js so identical deterministic rules run in the browser (offline/AI) and on Node.js (`server/gameServer.ts`).

- `src/engine/boardTopology.ts`: Maps `(color, pieceIndex, progress)` to exact 15×15 grid coordinates and 3D world `(x, z)` positions.
- `src/engine/ludoEngine.ts`:
  - `createInitialMatchState()`
  - `rollCryptoDie()` (rejection sampling over `crypto.getRandomValues` for modulo-bias-free 1..6 rolls)
  - `computeLegalMoves(state, seatIndex, diceValue)`
  - `applyDiceRoll(state, seatIndex, diceValue)`
  - `applyPieceMove(state, seatIndex, pieceIndex)`
  - `forceTurnTimeout(state)`
- `src/engine/aiEngine.ts`: Evaluates legal moves across `easy`, `medium`, and `hard` heuristics (capture weight, home goal priority, yard deployment, safe-tile preference, danger avoidance behind opponents).
