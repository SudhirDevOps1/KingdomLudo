# Official Ludo Game Rules (`src/engine/ludoEngine.ts`)

1. **Board Topology**: 15×15 grid with a 52-cell clockwise outer track (`0..51`), four 6×6 kingdom yards, four 5-cell colored home lanes (`51..55`), and the central Royal Crown Sanctuary (`56`).
2. **Deploying Pieces**: Rolling a **6** allows deploying any hero from the yard (`progress = -1`) onto the kingdom's starting tile (`progress = 0`).
3. **Extra Turns**: Rolling a **6**, capturing an opponent piece, or landing a hero in the central crown (`progress = 56`) grants a bonus roll (configurable via `RuleConfig`).
4. **Three Consecutive Sixes**: Rolling three consecutive **6**s forfeits the turn and passes play to the next active seat (`threeSixesForfeitTurn`).
5. **Safe Star Zones**: 8 cells on the 52-cell ring (`[0, 8, 13, 21, 26, 34, 39, 47]`) are Star Sanctuary tiles where pieces cannot be captured when `safeZonesEnabled` is enabled.
6. **Captures**: Landing on an unprotected tile occupied by one or more opposing pieces sends those opponent pieces back to their base yard (`progress = -1`).
7. **Exact Home Entry**: Pieces must land exactly on `progress = 56` when `exactHomeRequired` is enabled. First player to move all 4 pieces to `56` wins.
