# Animation System

- **Character Rig States** (`updateCharacterRigAnimation` in `src/three/characterBuilder.ts`):
  - `idle`: Gentle breathing bob and slight head scan.
  - `walk` / `run`: Opposing arm and leg swing cycles synchronized with vertical bounce.
  - `jump`: Parabolic hop arc along each cell transition (`animQueue` in `LudoBoardViewport`) facing the movement vector via `Math.atan2(dx, dz)`.
  - `capture`: High recoil spin and return arc back to the home yard.
  - `celebrate` / `victory`: Raised arms, joyous bounce, and burst confetti particles (`spawnConfetti`).
- **3D Dice Tumble** (`src/three/dice3d.ts`): Smooth multi-axis tumble interpolation landing cleanly on the face quaternion matching the authoritative roll value (`1..6`), plus a subtle idle hover pulse when awaiting human input.
- **Camera Transitions**: Exponential damping (`THREE.MathUtils.damp`) for `isometric`, `top-down`, and `follow` presets, immediately yielding if the user drags `OrbitControls`.
