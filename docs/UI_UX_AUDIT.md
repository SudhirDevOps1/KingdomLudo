# UI/UX Audit & Gameplay Flow

## Usability Principles Applied
- **Board-First Viewport**: During active gameplay (`ActiveGameView`), top/bottom HUD controls stay compact and collapsible so the 3D courtyard occupies >= 80% of the viewport.
- **Zero Static Backdrop Blur Over WebGL**: HUD overlays use crisp high-opacity Royal Obsidian (`#10141E/95`) borders rather than `backdrop-filter` over the WebGL canvas, preserving GPU performance on mobile WebViews.
- **Instant Entry**: First launch progresses smoothly from Splash -> 3-step Skippable Onboarding -> Courtyard Hub in Guest Mode with zero forced registration gates.
- **Touch Target Compliance**: Primary buttons, dice roll triggers, navigation actions, and piece selection chips meet >= 40-44px height for reliable mobile touch input.
- **Error Recovery**: `ErrorBoundary` catches runtime render issues with a one-click reload; WebGL context loss automatically falls back to the 2D SVG board (`Board2DFallback`).
