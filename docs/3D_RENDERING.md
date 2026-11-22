# 3D Rendering Pipeline (`src/three/`)

- **Renderer**: `THREE.WebGLRenderer` with `SRGBColorSpace`, `ACESFilmicToneMapping`, adaptive DPR cap (`low: 1`, `medium: 1.5`, `high: 2`), and `PCFSoftShadowMap` (`medium`/`high`).
- **Environment Lighting**: Procedural `PMREMGenerator` over `RoomEnvironment` plus 3-point lighting (Hemisphere sky/ground fill, key sun `DirectionalLight` with tight `[-12, 12]` shadow frustum, and cool rim light).
- **Procedural PBR Materials**: `src/three/proceduralTextures.ts` generates stone grain, royal trim, dice pip faces, and courtyard ground maps onto `CanvasTexture` without external image fetches.
- **Instancing & Performance**: Perimeter courtyard props (>20 instances) are batched in a single `THREE.InstancedMesh`; raycast hover checks are throttled to 60ms intervals; `detectSoftwareWebGL()` disables heavy MSAA/shadows and throttles frame pacing on software WebGL renderers.
- **Lifecycle & Disposal**: `LudoBoardViewport.dispose()` cleans up geometries, materials, textures, event listeners, and the WebGL context.
