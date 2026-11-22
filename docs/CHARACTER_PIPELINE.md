# 3D Character Pipeline

## Procedural Multi-Part Architecture (`src/three/characterBuilder.ts`)
Each of the 12 Kingdom heroes (`src/data/characters.ts`) is constructed at runtime as an original multi-part `THREE.Group` with distinct hierarchical pivots:
- `root` → base pedestal + glowing `selectionRing`
- `hips` → torso + kingdom outfit attachment (`cloak`, `crown`, `pauldrons`, `scarf`, `orb`)
- `head` → archetype-specific silhouette (dragon horns & snout, fox ears & dual tails, phoenix crest & wings, wolf ears, penguin tuxedo/beak, ice-sprite antlers/crystals, panda ears/patches, turtle shell, forest guardian antlers, lion mane, tiger stripes, griffin beak & wings)
- `leftArm`, `rightArm`, `leftLeg`, `rightLeg`, `tail`

## Honest Animation & GLB Loader Status
- **Active Default**: All 12 heroes use `animationType: 'procedural-multipart'`, animating limbs, head, wings/tail, and squash-and-stretch procedurally.
- **External GLB Hook**: `tryAttachOptionalGlb()` supports loading optional external `.glb` models via Three.js `GLTFLoader` when `optionalGlbPath` is configured on a character entry, automatically falling back to the procedural multi-part model if unavailable.
- **Memory Management**: `disposeCharacterRig()` explicitly disposes geometries and materials when characters leave the preview or match viewport.
