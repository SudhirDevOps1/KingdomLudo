# Accessibility Guide

- **2D Accessible Fallback Board**: `Board2DFallback.tsx` provides a high-contrast 2D SVG representation of the full 15×15 track, star safe zones, home lanes, central dice trigger, and selectable character tokens—activated automatically when WebGL is unavailable, on WebGL context loss, or via **Settings → Prefer 2D Board Fallback Mode**.
- **Keyboard Navigation**:
  - `Space`: Roll dice when it is the active human player's turn.
  - `1`–`4`: Select highlighted legal piece #1–#4 to move.
  - `C`: Cycle camera view (`isometric` → `top-down` → `follow`).
  - `H`: Reset camera to default isometric courtyard view.
  - `Esc`: Open or close the Pause menu.
- **Reduced Motion**: Honors `prefers-reduced-motion: reduce` media query and provides an explicit toggle in Settings, shortening piece hop arcs and disabling celebration confetti.
- **Color + Shape Redundancy**: Kingdoms pair color with distinct character names, starting home corners, and star safe icons (`★`), never relying on color alone.
