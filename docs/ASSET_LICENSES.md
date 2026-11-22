# Asset Attribution & License Register

All assets in **KingdomLudo** are original or permissively licensed. No third-party copyrighted Ludo game assets, meshes, textures, or sounds are used.

| Asset / Group | Source / Author | Format | License | Path |
| :--- | :--- | :--- | :--- | :--- |
| 12 Multi-Part 3D Kingdom Heroes | Original procedural `THREE.Group` geometry | TypeScript / Three.js | MIT (Project Original) | `src/three/characterBuilder.ts` |
| 3D Dice, Living Island & Board Architecture | Original procedural Three.js meshes & shaders | TypeScript / Three.js | MIT (Project Original) | `src/three/dice3d.ts`, `src/three/boardScene.ts`, `src/three/islandWorld.ts` |
| Stone, Ocean & Courtyard Canvas Textures | Original procedural HTML5 Canvas generators | Runtime CanvasTexture | MIT (Project Original) | `src/three/proceduralTextures.ts` |
| KingdomLudo 3D Emblem, Courtyard & Kingdom Crests | AI-generated original artwork via `generate_image` | JPEG | Project Original | `src/assets/images/*.jpg` |
| Web Favicons, PWA Icons & Android Launcher Icons | Derived from original KingdomLudo emblem + SVG | SVG / PNG / ICO | MIT (Project Original) | `public/*`, `android/app/src/main/res/mipmap-*` |
| UI & Game Sound Effects | Original Web Audio API oscillator synthesis | Runtime Web Audio | MIT (Project Original) | `src/audio/soundEngine.ts` |
| UI Icons | `lucide-react` | SVG React Components | ISC License | `node_modules/lucide-react` |
| Fonts (`Cinzel`, `Plus Jakarta Sans`, `JetBrains Mono`) | Google Fonts (with system fallbacks) | WOFF2 / CSS | SIL Open Font License 1.1 | `index.html`, `src/index.css` |
