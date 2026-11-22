# Performance & WebGL Optimization

- **Adaptive Quality Tiers**: Settings offers `low` (DPR 1x, shadows off), `medium` (DPR <= 1.5x, 1024px PCFSoftShadowMap), and `high` (DPR <= 2x, 2048px shadows).
- **Software WebGL Safeguard**: `detectSoftwareWebGL()` detects SwiftShader / llvmpipe software renderers, disables AA/shadows, and paces frames cleanly so software-rendered headless environments never stall.
- **Draw Call & GC Discipline**: Courtyard perimeter props (>20 meshes) use a single `THREE.InstancedMesh`; loop vector math reuses module-scoped `_vec3`, `_pointer`, and `_dummy` objects; hover raycasting throttles to 60ms.
- **2D Fallback**: Users on ultra-low-end devices or experiencing WebGL context loss can switch seamlessly to the zero-WebGL `Board2DFallback`.
