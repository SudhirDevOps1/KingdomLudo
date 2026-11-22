import * as THREE from 'three';
import type { BoardTheme } from '../data/boardThemes';
import { createCourtyardGroundTexture, createStonePathTexture } from './proceduralTextures';

export type IslandQuality = 'low' | 'medium' | 'high';

interface IslandPalette {
  oceanHex: string;
  shallowHex: string;
  sandHex: string;
  grassHex: string;
  rockHex: string;
  foliagePrimaryHex: string;
  foliageSecondaryHex: string;
  flowerHex: string;
  waterfallHex: string;
  castleStoneHex: string;
  bannerHex: string;
  magicHex: string;
}

function getIslandPalette(theme: BoardTheme): IslandPalette {
  switch (theme.id) {
    case 'celestial-sky-citadel':
      return {
        oceanHex: '#0EA5E9',
        shallowHex: '#67E8F9',
        sandHex: '#E2E8F0',
        grassHex: '#334155',
        rockHex: '#64748B',
        foliagePrimaryHex: '#93C5FD',
        foliageSecondaryHex: '#E0F2FE',
        flowerHex: '#FDE047',
        waterfallHex: '#BAE6FD',
        castleStoneHex: '#F1F5F9',
        bannerHex: '#2563EB',
        magicHex: '#7DD3FC',
      };
    case 'twilight-arcane-sanctuary':
      return {
        oceanHex: '#1E1B4B',
        shallowHex: '#312E81',
        sandHex: '#334155',
        grassHex: '#1F2937',
        rockHex: '#0F172A',
        foliagePrimaryHex: '#4F46E5',
        foliageSecondaryHex: '#7C3AED',
        flowerHex: '#FBBF24',
        waterfallHex: '#818CF8',
        castleStoneHex: '#334155',
        bannerHex: '#E6A93C',
        magicHex: '#A78BFA',
      };
    case 'jungle-kingdom':
      return {
        oceanHex: '#0D9488',
        shallowHex: '#2DD4BF',
        sandHex: '#E7D3A8',
        grassHex: '#1E4620',
        rockHex: '#57534E',
        foliagePrimaryHex: '#15803D',
        foliageSecondaryHex: '#22C55E',
        flowerHex: '#FB923C',
        waterfallHex: '#99F6E4',
        castleStoneHex: '#78716C',
        bannerHex: '#16A34A',
        magicHex: '#86EFAC',
      };
    case 'artisan-tabletop-miniature':
      return {
        oceanHex: '#1D4ED8',
        shallowHex: '#38BDF8',
        sandHex: '#E7D5B8',
        grassHex: '#2F4B26',
        rockHex: '#6B5B4B',
        foliagePrimaryHex: '#166534',
        foliageSecondaryHex: '#4D7C0F',
        flowerHex: '#F59E0B',
        waterfallHex: '#BAE6FD',
        castleStoneHex: '#A8A29E',
        bannerHex: '#DC2626',
        magicHex: '#FDE047',
      };
    case 'classic-royal-board':
      return {
        oceanHex: '#0284C7',
        shallowHex: '#38BDF8',
        sandHex: '#F3E5AB',
        grassHex: '#2D6A4F',
        rockHex: '#6C757D',
        foliagePrimaryHex: '#2D6A4F',
        foliageSecondaryHex: '#52B788',
        flowerHex: '#FBBF24',
        waterfallHex: '#E0F2FE',
        castleStoneHex: '#E5E7EB',
        bannerHex: '#DC2626',
        magicHex: '#FEF08A',
      };
    case 'volcanic-ember-citadel':
      return {
        oceanHex: '#450A0A',
        shallowHex: '#991B1B',
        sandHex: '#292524',
        grassHex: '#1C1917',
        rockHex: '#0C0A09',
        foliagePrimaryHex: '#7F1D1D',
        foliageSecondaryHex: '#B91C1C',
        flowerHex: '#F97316',
        waterfallHex: '#EF4444',
        castleStoneHex: '#292524',
        bannerHex: '#DC2626',
        magicHex: '#F97316',
      };
    case 'frost-crystal-summit':
      return {
        oceanHex: '#0C4A6E',
        shallowHex: '#0284C7',
        sandHex: '#E2E8F0',
        grassHex: '#0369A1',
        rockHex: '#1E293B',
        foliagePrimaryHex: '#38BDF8',
        foliageSecondaryHex: '#BAE6FD',
        flowerHex: '#FDE047',
        waterfallHex: '#E0F2FE',
        castleStoneHex: '#0F172A',
        bannerHex: '#2563EB',
        magicHex: '#38BDF8',
      };
    case 'sunset-royal-bay':
      return {
        oceanHex: '#7C2D12',
        shallowHex: '#C2410C',
        sandHex: '#FDE68A',
        grassHex: '#451A03',
        rockHex: '#78350F',
        foliagePrimaryHex: '#D97706',
        foliageSecondaryHex: '#F59E0B',
        flowerHex: '#FEF08A',
        waterfallHex: '#FDBA74',
        castleStoneHex: '#9A3412',
        bannerHex: '#D97706',
        magicHex: '#FDE047',
      };
    case 'tropical-paradise-cove':
      return {
        oceanHex: '#0369A1',
        shallowHex: '#06B6D4',
        sandHex: '#FEF3C7',
        grassHex: '#059669',
        rockHex: '#57534E',
        foliagePrimaryHex: '#10B981',
        foliageSecondaryHex: '#34D399',
        flowerHex: '#F43F5E',
        waterfallHex: '#67E8F9',
        castleStoneHex: '#78716C',
        bannerHex: '#0D9488',
        magicHex: '#2DD4BF',
      };
    case 'royal-enchanted-courtyard':
    default:
      return {
        oceanHex: '#0369A1',
        shallowHex: '#22D3EE',
        sandHex: '#EAD5A7',
        grassHex: '#2B5B32',
        rockHex: '#645D53',
        foliagePrimaryHex: '#1B6B38',
        foliageSecondaryHex: '#358E49',
        flowerHex: '#FBBF24',
        waterfallHex: '#BAEBFF',
        castleStoneHex: '#D6BE97',
        bannerHex: '#DC2626',
        magicHex: '#FDE68A',
      };
  }
}

interface BirdFlight {
  radius: number;
  speed: number;
  baseY: number;
  phase: number;
}

interface CloudDrift {
  x: number;
  y: number;
  z: number;
  speed: number;
  scale: number;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class IslandWorld {
  public readonly group = new THREE.Group();
  private readonly disposables: Array<{ dispose: () => void }> = [];

  private oceanMat: THREE.MeshStandardMaterial | null = null;
  private foamRingMesh: THREE.Mesh | null = null;
  private waterfallMeshes: THREE.Mesh[] = [];
  private bannerMeshes: THREE.Mesh[] = [];
  private birdInstanced: THREE.InstancedMesh | null = null;
  private birdFlights: BirdFlight[] = [];
  private fishInstanced: THREE.InstancedMesh | null = null;
  private cloudGroup = new THREE.Group();
  private cloudDrifts: CloudDrift[] = [];
  private magicPoints: THREE.Points | null = null;
  private magicBasePos: Float32Array | null = null;
  private mistPoints: THREE.Points | null = null;
  private mistBasePos: Float32Array | null = null;

  public build(theme: BoardTheme, quality: IslandQuality, reducedMotion: boolean): void {
    this.dispose();
    const palette = getIslandPalette(theme);

    // 1. Animated PBR Ocean (MeshStandardMaterial + onBeforeCompile waves)
    const oceanSegs = quality === 'low' ? 36 : quality === 'medium' ? 56 : 72;
    const oceanGeo = new THREE.CircleGeometry(125, oceanSegs);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: palette.oceanHex,
      roughness: 0.16,
      metalness: 0.25,
      emissive: palette.oceanHex,
      emissiveIntensity: 0.08,
    });
    if (!reducedMotion) {
      oceanMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        oceanMat.userData.shader = shader;
        shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float waveA = sin(position.x * 0.28 + uTime * 1.35) * 0.14;
           float waveB = cos(position.y * 0.24 - uTime * 1.1) * 0.11;
           transformed.z += waveA + waveB;`,
        );
      };
    }
    this.oceanMat = oceanMat;
    this.disposables.push(oceanGeo, oceanMat);

    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -1.65;
    ocean.receiveShadow = true;
    this.group.add(ocean);

    // Shoreline shallow turquoise ring + gentle pulsing surf foam
    const shallowGeo = new THREE.RingGeometry(23.5, 31.5, 64);
    const shallowMat = new THREE.MeshStandardMaterial({
      color: palette.shallowHex,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45,
    });
    const foamGeo = new THREE.RingGeometry(25.2, 26.8, 64);
    const foamMat = new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
    });
    this.disposables.push(shallowGeo, shallowMat, foamGeo, foamMat);

    const shallowMesh = new THREE.Mesh(shallowGeo, shallowMat);
    shallowMesh.rotation.x = -Math.PI / 2;
    shallowMesh.position.y = -1.56;

    const foamRing = new THREE.Mesh(foamGeo, foamMat);
    foamRing.rotation.x = -Math.PI / 2;
    foamRing.position.y = -1.52;
    this.foamRingMesh = foamRing;
    this.group.add(shallowMesh, foamRing);

    // 2. Sandy Beach & Coastal Shelf
    const beachGeo = new THREE.CylinderGeometry(24.5, 27.6, 0.85, 48);
    const beachMat = new THREE.MeshStandardMaterial({
      color: palette.sandHex,
      roughness: 0.88,
      metalness: 0.02,
    });
    this.disposables.push(beachGeo, beachMat);
    const beach = new THREE.Mesh(beachGeo, beachMat);
    beach.position.y = -1.45;
    beach.receiveShadow = true;
    this.group.add(beach);

    // 3. Sculpted Lush Island Mound & Courtyard Terrace
    const groundTex = createCourtyardGroundTexture(palette.grassHex, theme.goldTrimHex);
    const islandGeo = new THREE.CylinderGeometry(16.8, 24.4, 1.35, 48, 4);
    // Subtle rolling natural edge displacement outside the central board footprint
    const posAttr = islandGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const rad = Math.hypot(x, z);
      if (rad > 12.2 && y > -0.2) {
        const undulation = Math.sin(x * 0.38) * Math.cos(z * 0.35) * 0.32;
        posAttr.setY(i, y + undulation);
      }
    }
    islandGeo.computeVertexNormals();

    const islandMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.86,
      metalness: 0.04,
    });
    this.disposables.push(groundTex, islandGeo, islandMat);

    const islandMound = new THREE.Mesh(islandGeo, islandMat);
    islandMound.position.y = -0.95;
    islandMound.receiveShadow = true;
    this.group.add(islandMound);

    // Raised Royal Courtyard Stone Terrace directly supporting the board
    const terraceGeo = new THREE.CylinderGeometry(13.6, 14.3, 0.28, 8);
    const terraceMat = new THREE.MeshStandardMaterial({
      color: theme.plinthHex,
      roughness: 0.62,
      metalness: 0.1,
    });
    this.disposables.push(terraceGeo, terraceMat);
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.rotation.y = Math.PI / 8;
    terrace.position.y = -0.39;
    terrace.receiveShadow = true;
    this.group.add(terrace);

    // 4. Royal Stone Pathways & Four Ornate Courtyard Archways/Bridges
    const pathTex = createStonePathTexture(theme.trackDarkHex, theme.plinthHex);
    const pathGeo = new THREE.BoxGeometry(2.1, 0.08, 9.2);
    const pathMat = new THREE.MeshStandardMaterial({
      map: pathTex,
      roughness: 0.7,
      metalness: 0.05,
    });
    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.42, 3.0, 12);
    const archBeamGeo = new THREE.BoxGeometry(2.7, 0.42, 0.72);
    const goldMat = new THREE.MeshStandardMaterial({
      color: theme.goldTrimHex,
      roughness: 0.25,
      metalness: 0.86,
    });
    const lanternGeo = new THREE.OctahedronGeometry(0.24, 0);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: '#FEF08A',
      emissive: '#F59E0B',
      emissiveIntensity: 0.95,
      roughness: 0.18,
    });
    this.disposables.push(
      pathTex,
      pathGeo,
      pathMat,
      pillarGeo,
      archBeamGeo,
      goldMat,
      lanternGeo,
      lanternMat,
    );

    const cardinals = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    for (const angle of cardinals) {
      const roadGroup = new THREE.Group();
      roadGroup.rotation.y = angle;

      const path = new THREE.Mesh(pathGeo, pathMat);
      path.position.set(0, -0.32, 13.6);
      path.receiveShadow = true;

      // Arched gateway framing each promenade
      const leftPillar = new THREE.Mesh(pillarGeo, terraceMat);
      leftPillar.position.set(-1.15, 1.05, 12.2);
      leftPillar.castShadow = true;
      const rightPillar = new THREE.Mesh(pillarGeo, terraceMat);
      rightPillar.position.set(1.15, 1.05, 12.2);
      rightPillar.castShadow = true;

      const lintel = new THREE.Mesh(archBeamGeo, goldMat);
      lintel.position.set(0, 2.65, 12.2);
      lintel.castShadow = true;

      const lanternL = new THREE.Mesh(lanternGeo, lanternMat);
      lanternL.position.set(-1.15, 2.95, 12.2);
      const lanternR = new THREE.Mesh(lanternGeo, lanternMat);
      lanternR.position.set(1.15, 2.95, 12.2);

      roadGroup.add(path, leftPillar, rightPillar, lintel, lanternL, lanternR);
      this.group.add(roadGroup);
    }

    // 5. Scenic Rocky Cliffs + Flowing Waterfalls & Mist
    this.buildWaterfalls(palette, quality);

    // 6. Distant Castles / Towers with Fluttering Banners & Horizon Mountains
    this.buildDistantCastlesAndMountains(palette, theme, quality);

    // 7. Instanced Trees, Shrubs, Rocks & Wildflowers
    this.buildInstancedNature(palette, quality);

    // 8. Living Sky: Clouds, Circling Birds & Floating Magic Particles
    this.buildLivingSkyAndParticles(palette, quality, reducedMotion);
  }

  private buildWaterfalls(palette: IslandPalette, quality: IslandQuality): void {
    const rockGeo = new THREE.DodecahedronGeometry(1.4, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: palette.rockHex,
      roughness: 0.9,
      metalness: 0.05,
    });
    const fallGeo = new THREE.PlaneGeometry(2.1, 2.8, 4, 8);
    const fallMat = new THREE.MeshStandardMaterial({
      color: palette.waterfallHex,
      emissive: palette.shallowHex,
      emissiveIntensity: 0.32,
      roughness: 0.15,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    this.disposables.push(rockGeo, rockMat, fallGeo, fallMat);

    const fallSpots = [
      { angle: 0.65, dist: 21.8 },
      { angle: 3.85, dist: 21.8 },
    ];

    for (const spot of fallSpots) {
      const fx = Math.cos(spot.angle) * spot.dist;
      const fz = Math.sin(spot.angle) * spot.dist;

      const cliffL = new THREE.Mesh(rockGeo, rockMat);
      cliffL.position.set(fx - Math.sin(spot.angle) * 1.4, -0.35, fz + Math.cos(spot.angle) * 1.4);
      cliffL.scale.set(1.2, 1.35, 1.0);
      const cliffR = new THREE.Mesh(rockGeo, rockMat);
      cliffR.position.set(fx + Math.sin(spot.angle) * 1.4, -0.35, fz - Math.cos(spot.angle) * 1.4);
      cliffR.scale.set(1.1, 1.25, 1.1);

      const fall = new THREE.Mesh(fallGeo, fallMat);
      fall.position.set(fx, -0.82, fz);
      fall.lookAt(fx * 2, -0.82, fz * 2);
      fall.rotation.x += 0.22;
      this.waterfallMeshes.push(fall);

      this.group.add(cliffL, cliffR, fall);
    }

    // Waterfall mist particles
    const mistCount = quality === 'low' ? 18 : quality === 'medium' ? 36 : 56;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      const spot = fallSpots[i % fallSpots.length];
      const baseX = Math.cos(spot.angle) * (spot.dist + 0.8);
      const baseZ = Math.sin(spot.angle) * (spot.dist + 0.8);
      mistPos[i * 3] = baseX + (Math.random() - 0.5) * 2.4;
      mistPos[i * 3 + 1] = -1.55 + Math.random() * 1.1;
      mistPos[i * 3 + 2] = baseZ + (Math.random() - 0.5) * 2.4;
    }
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({
      color: '#FFFFFF',
      size: 0.45,
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
    });
    this.disposables.push(mistGeo, mistMat);
    this.mistBasePos = new Float32Array(mistPos);
    this.mistPoints = new THREE.Points(mistGeo, mistMat);
    this.group.add(this.mistPoints);
  }

  private buildDistantCastlesAndMountains(
    palette: IslandPalette,
    theme: BoardTheme,
    quality: IslandQuality,
  ): void {
    const mtnGeo = new THREE.ConeGeometry(8.5, 11.5, 6);
    const mtnMat = new THREE.MeshStandardMaterial({
      color: palette.rockHex,
      roughness: 0.92,
      metalness: 0.04,
    });
    const isleGeo = new THREE.CylinderGeometry(5.5, 8.2, 2.2, 10);
    const isleMat = new THREE.MeshStandardMaterial({
      color: palette.grassHex,
      roughness: 0.88,
    });
    const towerGeo = new THREE.CylinderGeometry(0.95, 1.15, 4.6, 10);
    const roofGeo = new THREE.ConeGeometry(1.35, 2.1, 10);
    const castleMat = new THREE.MeshStandardMaterial({
      color: palette.castleStoneHex,
      roughness: 0.65,
      metalness: 0.08,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: palette.bannerHex,
      roughness: 0.45,
      metalness: 0.2,
    });
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6);
    const flagGeo = new THREE.PlaneGeometry(0.95, 0.48);
    const flagMat = new THREE.MeshStandardMaterial({
      color: theme.goldTrimHex,
      emissive: theme.goldTrimHex,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
    this.disposables.push(
      mtnGeo,
      mtnMat,
      isleGeo,
      isleMat,
      towerGeo,
      roofGeo,
      castleMat,
      roofMat,
      poleGeo,
      flagGeo,
      flagMat,
    );

    // Distant scenic mountain silhouettes across the horizon
    const mtnCount = quality === 'low' ? 6 : 10;
    for (let i = 0; i < mtnCount; i++) {
      const ang = (i / mtnCount) * Math.PI * 2 + 0.3;
      const r = 64 + (i % 3) * 14;
      const mtn = new THREE.Mesh(mtnGeo, mtnMat);
      const s = 0.9 + (i % 4) * 0.35;
      mtn.scale.set(s * 1.2, s, s);
      mtn.position.set(Math.cos(ang) * r, -1.5 + s * 2.5, Math.sin(ang) * r);
      mtn.rotation.y = ang;
      this.group.add(mtn);
    }

    // 3 Royal Castle Citadel Islets framing the main island
    const castleAngles = [2.25, 4.45, 5.65];
    for (const ang of castleAngles) {
      const dist = 39;
      const cx = Math.cos(ang) * dist;
      const cz = Math.sin(ang) * dist;

      const cIsle = new THREE.Mesh(isleGeo, isleMat);
      cIsle.position.set(cx, -1.6, cz);

      const keep = new THREE.Mesh(towerGeo, castleMat);
      keep.position.set(cx, 1.4, cz);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(cx, 4.6, cz);

      const sideTower = new THREE.Mesh(towerGeo, castleMat);
      sideTower.scale.set(0.68, 0.72, 0.68);
      sideTower.position.set(cx + 1.4, 0.75, cz - 0.8);
      const sideRoof = new THREE.Mesh(roofGeo, roofMat);
      sideRoof.scale.set(0.68, 0.72, 0.68);
      sideRoof.position.set(cx + 1.4, 3.1, cz - 0.8);

      const pole = new THREE.Mesh(poleGeo, castleMat);
      pole.position.set(cx, 6.0, cz);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(cx + 0.45, 6.42, cz);
      this.bannerMeshes.push(flag);

      this.group.add(cIsle, keep, roof, sideTower, sideRoof, pole, flag);
    }
  }

  private buildInstancedNature(palette: IslandPalette, quality: IslandQuality): void {
    const treeCount = quality === 'low' ? 18 : quality === 'medium' ? 30 : 42;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 1.35, 7);
    const canopyGeo = new THREE.ConeGeometry(0.95, 2.0, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#6B4226', roughness: 0.9 });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: palette.foliagePrimaryHex,
      roughness: 0.76,
      metalness: 0.04,
    });
    this.disposables.push(trunkGeo, canopyGeo, trunkMat, canopyMat);

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    canopies.castShadow = quality !== 'low';
    canopies.receiveShadow = true;

    for (let i = 0; i < treeCount; i++) {
      // Avoid cardinal road corridors
      const rawAng = (i / treeCount) * Math.PI * 2 + 0.17;
      const mod = ((rawAng % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
      const angle = mod < 0.22 ? rawAng + 0.24 : mod > Math.PI / 2 - 0.22 ? rawAng - 0.24 : rawAng;
      const radius = 15.2 + (i % 4) * 1.35;
      const scale = 0.85 + ((i * 7) % 9) * 0.06;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      _dummy.position.set(tx, 0.15, tz);
      _dummy.scale.set(scale, scale, scale);
      _dummy.rotation.set(0, angle, 0);
      _dummy.updateMatrix();
      trunks.setMatrixAt(i, _dummy.matrix);

      _dummy.position.set(tx, 1.25 * scale, tz);
      _dummy.scale.set(scale * 1.05, scale * 1.15, scale * 1.05);
      _dummy.updateMatrix();
      canopies.setMatrixAt(i, _dummy.matrix);

      _color
        .set(i % 2 === 0 ? palette.foliagePrimaryHex : palette.foliageSecondaryHex)
        .offsetHSL(((i % 3) - 1) * 0.015, 0, ((i % 4) - 1.5) * 0.03);
      canopies.setColorAt(i, _color);
    }
    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
    this.group.add(trunks, canopies);

    // Coastal boulders & wildflowers
    const flowerCount = quality === 'low' ? 28 : quality === 'medium' ? 54 : 84;
    const flowerGeo = new THREE.DodecahedronGeometry(0.16, 0);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: palette.flowerHex,
      emissive: palette.flowerHex,
      emissiveIntensity: 0.15,
      roughness: 0.5,
    });
    this.disposables.push(flowerGeo, flowerMat);

    const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    for (let i = 0; i < flowerCount; i++) {
      const ang = (i / flowerCount) * Math.PI * 2 + (i % 5) * 0.2;
      const rad = 13.8 + ((i * 13) % 70) * 0.1;
      _dummy.position.set(Math.cos(ang) * rad, -0.22, Math.sin(ang) * rad);
      const s = 0.7 + (i % 4) * 0.25;
      _dummy.scale.set(s, s * 0.8, s);
      _dummy.rotation.set(0, ang, 0);
      _dummy.updateMatrix();
      flowers.setMatrixAt(i, _dummy.matrix);
    }
    flowers.instanceMatrix.needsUpdate = true;
    this.group.add(flowers);
  }

  private buildLivingSkyAndParticles(
    palette: IslandPalette,
    quality: IslandQuality,
    reducedMotion: boolean,
  ): void {
    // Drifting sky clouds
    const cloudGeo = new THREE.DodecahedronGeometry(1.7, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#F8FAFC',
      roughness: 0.95,
      transparent: true,
      opacity: 0.78,
    });
    this.disposables.push(cloudGeo, cloudMat);

    const cloudCount = quality === 'low' ? 6 : 12;
    for (let i = 0; i < cloudCount; i++) {
      const cluster = new THREE.Group();
      const puffA = new THREE.Mesh(cloudGeo, cloudMat);
      const puffB = new THREE.Mesh(cloudGeo, cloudMat);
      puffB.scale.set(0.75, 0.7, 0.75);
      puffB.position.set(1.6, -0.25, 0.2);
      const puffC = new THREE.Mesh(cloudGeo, cloudMat);
      puffC.scale.set(0.68, 0.65, 0.68);
      puffC.position.set(-1.5, -0.3, -0.2);
      cluster.add(puffA, puffB, puffC);

      const x = -55 + i * 10;
      const y = 16 + (i % 4) * 2.5;
      const z = -42 + ((i * 19) % 75);
      const scale = 0.8 + (i % 3) * 0.35;
      cluster.position.set(x, y, z);
      cluster.scale.setScalar(scale);
      this.cloudGroup.add(cluster);
      this.cloudDrifts.push({
        x,
        y,
        z,
        speed: reducedMotion ? 0 : 0.45 + (i % 3) * 0.18,
        scale,
      });
    }
    this.group.add(this.cloudGroup);

    // Circling seabirds (InstancedMesh)
    const birdCount = quality === 'low' ? 6 : 12;
    const birdGeo = new THREE.ConeGeometry(0.18, 0.65, 4);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.6 });
    this.disposables.push(birdGeo, birdMat);

    const birds = new THREE.InstancedMesh(birdGeo, birdMat, birdCount);
    for (let i = 0; i < birdCount; i++) {
      this.birdFlights.push({
        radius: 22 + (i % 4) * 5,
        speed: reducedMotion ? 0 : 0.18 + (i % 3) * 0.05,
        baseY: 6.5 + (i % 3) * 1.8,
        phase: (i / birdCount) * Math.PI * 2,
      });
    }
    this.birdInstanced = birds;
    this.group.add(birds);

    // Shallow water schools of fish
    const fishCount = quality === 'low' ? 8 : 16;
    const fishGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
    const fishMat = new THREE.MeshBasicMaterial({ color: '#F97316', transparent: true, opacity: 0.8 });
    this.disposables.push(fishGeo, fishMat);
    const fishMesh = new THREE.InstancedMesh(fishGeo, fishMat, fishCount);
    this.fishInstanced = fishMesh;
    this.group.add(fishMesh);

    // Floating fireflies & magical pollen motes
    const moteCount = quality === 'low' ? 24 : quality === 'medium' ? 54 : 90;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 8.5 + Math.random() * 14;
      motePos[i * 3] = Math.cos(ang) * rad;
      motePos[i * 3 + 1] = 0.4 + Math.random() * 3.4;
      motePos[i * 3 + 2] = Math.sin(ang) * rad;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: palette.magicHex,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.disposables.push(moteGeo, moteMat);
    this.magicBasePos = new Float32Array(motePos);
    this.magicPoints = new THREE.Points(moteGeo, moteMat);
    this.group.add(this.magicPoints);
  }

  public update(elapsed: number, reducedMotion: boolean): void {
    if (this.oceanMat?.userData.shader) {
      this.oceanMat.userData.shader.uniforms.uTime.value = elapsed;
    }

    if (this.foamRingMesh && !reducedMotion) {
      const s = 1 + Math.sin(elapsed * 1.6) * 0.014;
      this.foamRingMesh.scale.set(s, s, 1);
    }

    if (!reducedMotion) {
      for (let i = 0; i < this.waterfallMeshes.length; i++) {
        const wf = this.waterfallMeshes[i];
        const mat = wf.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.28 + Math.sin(elapsed * 5.2 + i) * 0.1;
      }

      for (let i = 0; i < this.bannerMeshes.length; i++) {
        this.bannerMeshes[i].rotation.y = Math.sin(elapsed * 3.8 + i) * 0.24;
      }

      for (let i = 0; i < this.cloudGroup.children.length; i++) {
        const cloud = this.cloudGroup.children[i];
        const drift = this.cloudDrifts[i];
        if (!drift) continue;
        let nextX = drift.x + elapsed * drift.speed;
        if (nextX > 65) nextX = ((nextX + 65) % 130) - 65;
        cloud.position.x = nextX;
      }

      if (this.birdInstanced) {
        for (let i = 0; i < this.birdFlights.length; i++) {
          const b = this.birdFlights[i];
          const ang = elapsed * b.speed + b.phase;
          const bx = Math.cos(ang) * b.radius;
          const bz = Math.sin(ang) * b.radius;
          const by = b.baseY + Math.sin(elapsed * 2.2 + b.phase) * 0.45;
          _dummy.position.set(bx, by, bz);
          _dummy.rotation.set(0, -ang, Math.sin(elapsed * 7 + i) * 0.2);
          _dummy.scale.set(1, 0.45, 1);
          _dummy.updateMatrix();
          this.birdInstanced.setMatrixAt(i, _dummy.matrix);
        }
        this.birdInstanced.instanceMatrix.needsUpdate = true;
      }

      if (this.fishInstanced) {
        const count = this.fishInstanced.count;
        for (let i = 0; i < count; i++) {
          const speed = 0.38 + (i % 3) * 0.12;
          const radius = 22.5 + (i % 4) * 1.2;
          const ang = elapsed * speed * 0.22 + (i / count) * Math.PI * 2;
          const fx = Math.cos(ang) * radius;
          const fz = Math.sin(ang) * radius;
          const fy = -1.48 + Math.sin(elapsed * 2.2 + i) * 0.04;
          _dummy.position.set(fx, fy, fz);
          _dummy.rotation.set(Math.PI / 2, -ang + Math.PI / 2, 0);
          _dummy.scale.setScalar(0.9);
          _dummy.updateMatrix();
          this.fishInstanced.setMatrixAt(i, _dummy.matrix);
        }
        this.fishInstanced.instanceMatrix.needsUpdate = true;
      }

      if (this.magicPoints && this.magicBasePos) {
        const pos = this.magicPoints.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const bx = this.magicBasePos[i * 3];
          const by = this.magicBasePos[i * 3 + 1];
          const bz = this.magicBasePos[i * 3 + 2];
          pos.setXYZ(
            i,
            bx + Math.sin(elapsed * 0.9 + i) * 0.35,
            by + Math.sin(elapsed * 1.4 + i * 0.7) * 0.28,
            bz + Math.cos(elapsed * 0.8 + i) * 0.35,
          );
        }
        pos.needsUpdate = true;
      }

      if (this.mistPoints && this.mistBasePos) {
        const pos = this.mistPoints.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const by = this.mistBasePos[i * 3 + 1];
          const lift = ((elapsed * 0.55 + i * 0.13) % 1.0) * 0.85;
          pos.setY(i, by + lift);
        }
        pos.needsUpdate = true;
      }
    }
  }

  public dispose(): void {
    this.group.clear();
    this.cloudGroup.clear();
    this.waterfallMeshes = [];
    this.bannerMeshes = [];
    this.birdFlights = [];
    this.cloudDrifts = [];
    this.birdInstanced = null;
    this.foamRingMesh = null;
    this.oceanMat = null;
    this.magicPoints = null;
    this.magicBasePos = null;
    this.mistPoints = null;
    this.mistBasePos = null;
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
  }
}
