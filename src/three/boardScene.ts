import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from '../audio/soundEngine';
import { APP_CONFIG } from '../config/appConfig';
import { getBoardThemeById, type BoardTheme } from '../data/boardThemes';
import {
  getPieceWorldCoord,
  gridToWorld,
  HOME_LANE_COORDS,
  KINGDOM_START_INDEX,
  MAIN_TRACK_COORDS,
  STAR_TRACK_INDICES,
  YARD_SLOT_COORDS,
} from '../engine/boardTopology';
import type { KingdomColor, MatchState } from '../engine/types';
import {
  buildProceduralCharacter,
  disposeCharacterRig,
  tryAttachOptionalGlb,
  updateCharacterRigAnimation,
  type CharacterAnimState,
  type CharacterRig,
} from './characterBuilder';
import { Dice3D } from './dice3d';
import { IslandWorld } from './islandWorld';
import { createCenterSanctuaryTexture, createStoneTileTexture } from './proceduralTextures';

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type CameraViewMode = 'isometric' | 'top-down' | 'follow';

export interface BoardViewportCallbacks {
  onPieceClick: (seatIndex: number, pieceIndex: 0 | 1 | 2 | 3) => void;
  onDiceClick: () => void;
  onContextLost: () => void;
  onContextRestored: () => void;
}

interface HopStep {
  from: THREE.Vector3;
  to: THREE.Vector3;
  progress: number;
  isStar: boolean;
}

interface PieceEntity {
  seatIndex: number;
  color: KingdomColor;
  pieceIndex: 0 | 1 | 2 | 3;
  rig: CharacterRig;
  proxyMesh: THREE.Mesh;
  currentProgress: number;
  animQueue: HopStep[];
  activeHop: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    elapsed: number;
    duration: number;
    targetProgress: number;
    isStar: boolean;
  } | null;
  reactionTimer: number;
  reactionState: CharacterAnimState;
  lookBiasYaw: number;
  trailAccum: number;
}

interface VfxParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  vr: number;
  gravity: number;
  life: number;
  maxLife: number;
}

const TILE_TOP_Y = 0.21;
const _vec3 = new THREE.Vector3();
const _pointer = new THREE.Vector2();
const _sparkGeo = new THREE.OctahedronGeometry(0.085, 0);
const _confettiGeo = new THREE.PlaneGeometry(0.16, 0.16);
const _tearGeo = new THREE.SphereGeometry(0.045, 8, 8);

export function detectSoftwareWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: false };
  }
}

export class LudoBoardViewport {
  private readonly container: HTMLElement;
  private readonly callbacks: BoardViewportCallbacks;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly isSoftwareGl: boolean;

  private readonly boardGroup = new THREE.Group();
  private readonly piecesGroup = new THREE.Group();
  private readonly vfxGroup = new THREE.Group();
  private readonly islandWorld = new IslandWorld();
  private readonly dice: Dice3D;

  private readonly keyLight: THREE.DirectionalLight;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly rimLight: THREE.DirectionalLight;

  private readonly pieceEntities = new Map<string, PieceEntity>();
  private readonly clickables: THREE.Object3D[] = [];
  private readonly boardDisposables: Array<{ dispose: () => void }> = [];
  private readonly particles: VfxParticle[] = [];
  private readonly yardAuras: Partial<Record<KingdomColor, THREE.Mesh>> = {};

  private activeTheme: BoardTheme;
  private quality: GraphicsQuality;
  private cameraMode: CameraViewMode = 'isometric';
  private cameraLocked = false;
  private cinematicEnabled = true;
  private cameraSensitivity = 1.0;
  private cameraTransitionActive = false;
  private desiredCamPos = new THREE.Vector3(0, 17.5, 16.5);
  private desiredCamTarget = new THREE.Vector3(0, 0, -1.25);
  private reducedMotion = false;

  private frameId = 0;
  private disposed = false;
  private lastState: MatchState | null = null;
  private lastDiceSeq = -1;
  private activeTurnInteractive = false;

  private readonly onResizeBound: () => void;
  private readonly onPointerDownBound: (e: PointerEvent) => void;
  private readonly onPointerUpBound: (e: PointerEvent) => void;
  private readonly onPointerMoveBound: (e: PointerEvent) => void;
  private readonly onContextLostBound: (e: Event) => void;
  private readonly onContextRestoredBound: () => void;
  private pointerDownPos = { x: 0, y: 0 };
  private lastHoverCheck = 0;

  constructor(
    container: HTMLElement,
    initialThemeId: string,
    initialQuality: GraphicsQuality,
    reducedMotion: boolean,
    callbacks: BoardViewportCallbacks,
    cinematicEnabled = true,
    cameraSensitivity = 1.0,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.quality = initialQuality;
    this.reducedMotion = reducedMotion;
    this.cinematicEnabled = cinematicEnabled;
    this.cameraSensitivity = cameraSensitivity;
    this.activeTheme = getBoardThemeById(initialThemeId);

    const probe = detectSoftwareWebGL();
    this.isSoftwareGl = probe.isSoftwareGl;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && initialQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.applyQualityPixelRatio();
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && initialQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(aspect < 0.85 ? 48 : 42, aspect, 0.2, 220);
    this.computeFramingForMode('isometric', aspect);
    this.camera.position.copy(this.desiredCamPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.85 * cameraSensitivity;
    this.controls.zoomSpeed = 0.9 * cameraSensitivity;
    this.controls.panSpeed = 0.85 * cameraSensitivity;
    this.controls.maxPolarAngle = Math.PI / 2.22;
    this.controls.minPolarAngle = 0.18;
    this.controls.minDistance = 8.5;
    this.controls.maxDistance = 40;
    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });

    // Golden-Hour Living Island Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xa5c4eb, 0x5c442b, 0.95);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xffe2b3, 2.25);
    this.keyLight.position.set(14, 22, 13);
    this.keyLight.castShadow = !this.isSoftwareGl && initialQuality !== 'low';
    this.applyShadowResolution();
    this.keyLight.shadow.camera.left = -15;
    this.keyLight.shadow.camera.right = 15;
    this.keyLight.shadow.camera.top = 15;
    this.keyLight.shadow.camera.bottom = -15;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 52;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
    this.rimLight.position.set(-16, 12, -14);
    this.scene.add(this.rimLight);

    this.scene.add(this.islandWorld.group, this.boardGroup, this.piecesGroup, this.vfxGroup);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.dice = new Dice3D(Math.min(4, maxAniso), (val) => {
      soundEngine.playDiceLand();
      this.spawnSparkBurst(0, 0.45, 0, val === 6 ? '#FDE047' : '#F8FAFC', val === 6 ? 20 : 10);
    });
    this.dice.group.position.set(0, 0.34, 0);
    this.scene.add(this.dice.group);
    this.clickables.push(this.dice.mesh);

    this.buildTheme(this.activeTheme);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.onResizeBound = () => this.handleResize();
    this.onPointerDownBound = (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    this.onPointerUpBound = (e) => {
      const dx = e.clientX - this.pointerDownPos.x;
      const dy = e.clientY - this.pointerDownPos.y;
      if (Math.hypot(dx, dy) < 12) {
        this.handleCanvasTap(e);
      }
    };
    this.onPointerMoveBound = (e) => this.handlePointerMove(e);
    this.onContextLostBound = (e) => {
      e.preventDefault();
      this.callbacks.onContextLost();
    };
    this.onContextRestoredBound = () => {
      this.callbacks.onContextRestored();
    };

    window.addEventListener('resize', this.onResizeBound);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUpBound);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMoveBound);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestoredBound);

    this.startLoop();
  }

  private applyQualityPixelRatio(): void {
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      return;
    }
    const maxDpr = this.quality === 'low' ? 1 : this.quality === 'medium' ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  }

  private applyShadowResolution(): void {
    const size = this.quality === 'high' ? 2048 : 1024;
    if (this.keyLight.shadow.mapSize.width !== size) {
      this.keyLight.shadow.mapSize.set(size, size);
      this.keyLight.shadow.map?.dispose();
      this.keyLight.shadow.map = null;
    }
  }

  public setQuality(quality: GraphicsQuality): void {
    this.quality = quality;
    this.applyQualityPixelRatio();
    const shadowsEnabled = !this.isSoftwareGl && quality !== 'low';
    this.renderer.shadowMap.enabled = shadowsEnabled;
    this.keyLight.castShadow = shadowsEnabled;
    this.applyShadowResolution();
    this.islandWorld.build(this.activeTheme, quality, this.reducedMotion);
    this.handleResize();
  }

  public setTheme(themeId: string): void {
    this.activeTheme = getBoardThemeById(themeId);
    this.buildTheme(this.activeTheme);
  }

  public setCinematicEnabled(enabled: boolean): void {
    this.cinematicEnabled = enabled;
  }

  public setCameraSensitivity(sens: number): void {
    this.cameraSensitivity = Math.max(0.4, Math.min(2.0, sens));
    this.controls.rotateSpeed = 0.85 * this.cameraSensitivity;
    this.controls.zoomSpeed = 0.9 * this.cameraSensitivity;
    this.controls.panSpeed = 0.85 * this.cameraSensitivity;
  }

  private computeFramingForMode(mode: CameraViewMode, aspect: number): void {
    // Dynamic aspect scaling to ensure complete board visibility (radius ~9.5)
    const portraitScale = aspect < 1 ? Math.min(1.85, 1.1 + (1 - aspect) * 1.05) : 1.0;
    if (mode === 'isometric') {
      this.desiredCamPos.set(0, 18.2 * portraitScale, 18.0 * portraitScale);
      this.desiredCamTarget.set(0, 0, 0);
    } else if (mode === 'top-down') {
      this.desiredCamPos.set(0, 26.0 * portraitScale, 0.001);
      this.desiredCamTarget.set(0, 0, 0);
    }
  }

  public fitBoardInView(): void {
    this.cameraTransitionActive = true;
    this.computeFramingForMode('isometric', this.camera.aspect);
  }

  public setExploreMode(active: boolean): void {
    this.cameraTransitionActive = true;
    if (active) {
      this.controls.enablePan = true;
      this.controls.minDistance = 3.5;
      this.controls.maxDistance = 75;
      this.controls.maxPolarAngle = Math.PI / 2.02;
      this.controls.minPolarAngle = 0.05;
      this.desiredCamPos.set(0, 14, 28);
      this.desiredCamTarget.set(0, 1.2, 0);
    } else {
      this.controls.enablePan = false;
      this.controls.minDistance = 8.5;
      this.controls.maxDistance = 40;
      this.controls.maxPolarAngle = Math.PI / 2.22;
      this.controls.minPolarAngle = 0.18;
      this.setCameraMode(this.cameraMode);
    }
  }

  public flyToLandmark(landmarkId: 'cascades' | 'citadel' | 'forest' | 'overview'): void {
    this.cameraTransitionActive = true;
    switch (landmarkId) {
      case 'cascades':
        this.desiredCamPos.set(16, 8.5, 20);
        this.desiredCamTarget.set(12, 0.5, 12);
        break;
      case 'citadel':
        this.desiredCamPos.set(0, 12.5, 17);
        this.desiredCamTarget.set(0, 0.4, 0);
        break;
      case 'forest':
        this.desiredCamPos.set(-18, 9.5, -17);
        this.desiredCamTarget.set(-11, 0.8, -8);
        break;
      case 'overview':
      default:
        this.desiredCamPos.set(0, 24, 32);
        this.desiredCamTarget.set(0, 0, 0);
        break;
    }
  }

  public setCameraMode(mode: CameraViewMode): void {
    this.cameraMode = mode;
    this.cameraTransitionActive = true;
    if (mode === 'follow') {
      this.updateFollowTarget();
    } else {
      this.computeFramingForMode(mode, this.camera.aspect);
    }
  }

  public zoomIn(): void {
    this.cameraTransitionActive = false;
    _vec3.copy(this.camera.position).sub(this.controls.target);
    const dist = Math.max(this.controls.minDistance, _vec3.length() * 0.82);
    _vec3.setLength(dist);
    this.camera.position.copy(this.controls.target).add(_vec3);
  }

  public zoomOut(): void {
    this.cameraTransitionActive = false;
    _vec3.copy(this.camera.position).sub(this.controls.target);
    const dist = Math.min(this.controls.maxDistance, _vec3.length() * 1.2);
    _vec3.setLength(dist);
    this.camera.position.copy(this.controls.target).add(_vec3);
  }

  public resetCamera(): void {
    this.setCameraMode('isometric');
  }

  public setCameraLocked(locked: boolean): void {
    this.cameraLocked = locked;
    this.controls.enabled = !locked;
  }

  private updateFollowTarget(): void {
    if (!this.lastState) return;
    const seat = this.lastState.players[this.lastState.activeSeatIndex];
    if (!seat) return;
    const activePiece =
      seat.pieces.find((p) => p.progress >= 0 && p.progress < 56) ?? seat.pieces[0];
    const world = getPieceWorldCoord(seat.color, activePiece.pieceIndex, activePiece.progress);
    this.desiredCamTarget.set(world.x * 0.55, 0.3, world.z * 0.55);
    this.desiredCamPos.set(world.x * 0.55, 11.8, world.z * 0.55 + 9.2);
    this.cameraTransitionActive = true;
  }

  private focusPointCinematic(x: number, z: number): void {
    if (!this.cinematicEnabled || this.reducedMotion || this.cameraLocked) return;
    if (this.cameraMode === 'top-down') return;
    this.desiredCamTarget.set(x * 0.45, 0.35, z * 0.45);
    this.desiredCamPos.set(x * 0.45, 12.2, z * 0.45 + 10.8);
    this.cameraTransitionActive = true;
  }

  private clearBoardGroup(): void {
    this.boardGroup.clear();
    this.islandWorld.dispose();
    for (const d of this.boardDisposables) {
      d.dispose();
    }
    this.boardDisposables.length = 0;
  }

  private buildTheme(theme: BoardTheme): void {
    this.clearBoardGroup();
    const maxAniso = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());

    this.scene.background = new THREE.Color(theme.skyHex);
    this.scene.fog = new THREE.FogExp2(theme.fogHex, theme.fogDensity * 0.68);
    this.keyLight.color.set(theme.sunHex);
    this.keyLight.intensity = theme.sunIntensity;
    this.hemiLight.color.set(theme.hemiSkyHex);
    this.hemiLight.groundColor.set(theme.hemiGroundHex);

    // Living Fantasy Island World surrounding and cradling the courtyard board
    this.islandWorld.build(theme, this.quality, this.reducedMotion);

    // Handcrafted Tiered Sandstone & Gold Royal Board Plinth
    const plinthGeo = new THREE.BoxGeometry(16.4, 0.52, 16.4);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: theme.plinthHex,
      roughness: 0.58,
      metalness: 0.08,
    });
    const trimGeo = new THREE.BoxGeometry(16.75, 0.16, 16.75);
    const upperCollarGeo = new THREE.BoxGeometry(15.65, 0.08, 15.65);
    const trimMat = new THREE.MeshStandardMaterial({
      color: theme.goldTrimHex,
      roughness: 0.24,
      metalness: 0.86,
    });
    this.boardDisposables.push(plinthGeo, plinthMat, trimGeo, upperCollarGeo, trimMat);

    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.14;
    plinth.receiveShadow = true;
    plinth.castShadow = true;

    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -0.32;

    const upperCollar = new THREE.Mesh(upperCollarGeo, trimMat);
    upperCollar.position.y = 0.09;
    upperCollar.receiveShadow = true;

    this.boardGroup.add(plinth, trim, upperCollar);

    // Corner Brass Finials
    const finialGeo = new THREE.OctahedronGeometry(0.28, 0);
    this.boardDisposables.push(finialGeo);
    for (const sx of [-7.95, 7.95]) {
      for (const sz of [-7.95, 7.95]) {
        const finial = new THREE.Mesh(finialGeo, trimMat);
        finial.position.set(sx, 0.26, sz);
        finial.castShadow = true;
        this.boardGroup.add(finial);
      }
    }

    // 52 Main Track Carved Stone Tiles + Safe Star Tiles
    // Standard tabletop Ludo styling: Warm Ivory (#F3EBDD) and Soft Cream (#E7D9BF) with Light Stone frame (#D9C9AC)
    const tileGeo = new THREE.BoxGeometry(0.92, 0.12, 0.92);
    const ivoryTex = createStoneTileTexture('#F3EBDD', '#D9C9AC', false, maxAniso);
    const creamTex = createStoneTileTexture('#E7D9BF', '#D9C9AC', false, maxAniso);
    const safeStarTex = createStoneTileTexture('#F3EBDD', '#D7A64B', true, maxAniso);
    const ivoryMat = new THREE.MeshStandardMaterial({ map: ivoryTex, roughness: 0.48, metalness: 0.05 });
    const creamMat = new THREE.MeshStandardMaterial({ map: creamTex, roughness: 0.52, metalness: 0.05 });
    const safeStarMat = new THREE.MeshStandardMaterial({
      map: safeStarTex,
      roughness: 0.38,
      metalness: 0.25,
      emissive: '#D7A64B',
      emissiveIntensity: 0.08,
    });
    this.boardDisposables.push(tileGeo, ivoryTex, creamTex, safeStarTex, ivoryMat, creamMat, safeStarMat);

    const startColorByIndex = new Map<number, KingdomColor>([
      [KINGDOM_START_INDEX.red, 'red'],
      [KINGDOM_START_INDEX.blue, 'blue'],
      [KINGDOM_START_INDEX.yellow, 'yellow'],
      [KINGDOM_START_INDEX.green, 'green'],
    ]);

    const kingdomColors: Record<KingdomColor, { hex: string; trim: string }> = {
      red: { hex: '#D83B36', trim: '#D7A64B' },
      blue: { hex: '#3267D8', trim: '#D7A64B' },
      yellow: { hex: '#E5A52E', trim: '#D7A64B' },
      green: { hex: '#229C5A', trim: '#D7A64B' },
    };

    MAIN_TRACK_COORDS.forEach((coord, idx) => {
      const w = gridToWorld(coord);
      const startColor = startColorByIndex.get(idx);
      let mat: THREE.MeshStandardMaterial = idx % 2 === 0 ? ivoryMat : creamMat;

      if (startColor) {
        // Kingdom Starting Sanctuary Tile with Kingdom Color + Star
        const kTex = createStoneTileTexture(
          kingdomColors[startColor].hex,
          kingdomColors[startColor].trim,
          true,
          maxAniso,
        );
        mat = new THREE.MeshStandardMaterial({
          map: kTex,
          roughness: 0.38,
          metalness: 0.22,
          emissive: kingdomColors[startColor].hex,
          emissiveIntensity: 0.08,
        });
        this.boardDisposables.push(kTex, mat);
      } else if (STAR_TRACK_INDICES.has(idx)) {
        mat = safeStarMat;
      }

      const tile = new THREE.Mesh(tileGeo, mat);
      tile.position.set(w.x, 0.14, w.z);
      tile.receiveShadow = true;
      this.boardGroup.add(tile);
    });

    // Four Kingdom Bastion Courtyards & Carved Standing Medallions (Flush — NOT thick pawn pads!)
    const yardGeo = new THREE.BoxGeometry(5.6, 0.14, 5.6);
    const slotGeo = new THREE.RingGeometry(0.28, 0.42, 24);
    const slotInnerGeo = new THREE.CircleGeometry(0.27, 24);
    const slotMat = new THREE.MeshStandardMaterial({
      color: theme.goldTrimHex,
      roughness: 0.28,
      metalness: 0.78,
      side: THREE.DoubleSide,
    });
    const slotInnerMat = new THREE.MeshStandardMaterial({
      color: '#F3EBDD',
      roughness: 0.65,
      metalness: 0.05,
    });
    this.boardDisposables.push(yardGeo, slotGeo, slotInnerGeo, slotMat, slotInnerMat);

    const yardCenters: Record<KingdomColor, { x: number; z: number }> = {
      red: gridToWorld({ col: 2.5, row: 2.5 }),
      blue: gridToWorld({ col: 11.5, row: 2.5 }),
      yellow: gridToWorld({ col: 11.5, row: 11.5 }),
      green: gridToWorld({ col: 2.5, row: 11.5 }),
    };

    (['red', 'blue', 'yellow', 'green'] as KingdomColor[]).forEach((color) => {
      const kHex = kingdomColors[color].hex;
      const kTex = createStoneTileTexture(kHex, '#D7A64B', false, maxAniso);
      const kMat = new THREE.MeshStandardMaterial({ map: kTex, roughness: 0.44, metalness: 0.16 });
      this.boardDisposables.push(kTex, kMat);

      const yard = new THREE.Mesh(yardGeo, kMat);
      yard.position.set(yardCenters[color].x, 0.13, yardCenters[color].z);
      yard.receiveShadow = true;
      this.boardGroup.add(yard);

      // Active Yard Turn Aura Ring
      const auraGeo = new THREE.RingGeometry(2.7, 3.08, 36);
      const auraMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(kHex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      this.boardDisposables.push(auraGeo, auraMat);
      const aura = new THREE.Mesh(auraGeo, auraMat);
      aura.rotation.x = -Math.PI / 2;
      aura.position.set(yardCenters[color].x, 0.22, yardCenters[color].z);
      this.yardAuras[color] = aura;
      this.boardGroup.add(aura);

      // Flush Royal Crest Standing Medallions (characters stand directly on tile level!)
      YARD_SLOT_COORDS[color].forEach((slot) => {
        const sw = gridToWorld(slot);
        const outerRing = new THREE.Mesh(slotGeo, slotMat);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.set(sw.x, 0.205, sw.z);
        outerRing.receiveShadow = true;

        const innerMedallion = new THREE.Mesh(slotInnerGeo, slotInnerMat);
        innerMedallion.rotation.x = -Math.PI / 2;
        innerMedallion.position.set(sw.x, 0.203, sw.z);
        innerMedallion.receiveShadow = true;

        this.boardGroup.add(outerRing, innerMedallion);
      });

      // 5 Colored Home Lane Tiles leading directly to the center
      const laneTex = createStoneTileTexture(kHex, '#D7A64B', false, maxAniso);
      const laneMat = new THREE.MeshStandardMaterial({
        map: laneTex,
        roughness: 0.42,
        metalness: 0.18,
      });
      this.boardDisposables.push(laneTex, laneMat);

      HOME_LANE_COORDS[color].forEach((laneCoord) => {
        const lw = gridToWorld(laneCoord);
        const laneTile = new THREE.Mesh(tileGeo, laneMat);
        laneTile.position.set(lw.x, 0.14, lw.z);
        laneTile.receiveShadow = true;
        this.boardGroup.add(laneTile);
      });
    });

    // Central Royal Crown Sanctuary Dais (3x3 center) with 4 Kingdom Quadrants
    const centerSanctuaryTex = createCenterSanctuaryTexture(maxAniso);
    const centerSanctuaryMat = new THREE.MeshStandardMaterial({
      map: centerSanctuaryTex,
      roughness: 0.32,
      metalness: 0.25,
    });
    this.boardDisposables.push(centerSanctuaryTex, centerSanctuaryMat);

    const centerBaseGeo = new THREE.BoxGeometry(2.92, 0.22, 2.92);
    const centerBase = new THREE.Mesh(centerBaseGeo, centerSanctuaryMat);
    centerBase.position.set(0, 0.16, 0);
    centerBase.receiveShadow = true;

    // Raised Central Obsidian & Royal Gold Dais for the 3D Dice
    const centerTopGeo = new THREE.CylinderGeometry(1.08, 1.25, 0.12, 16);
    const centerTopMat = new THREE.MeshStandardMaterial({
      color: '#252B37',
      roughness: 0.22,
      metalness: 0.75,
    });
    this.boardDisposables.push(centerBaseGeo, centerTopGeo, centerTopMat);
    const centerTop = new THREE.Mesh(centerTopGeo, centerTopMat);
    centerTop.position.set(0, 0.29, 0);
    centerTop.receiveShadow = true;
    this.boardGroup.add(centerBase, centerTop);
  }

  public syncMatchState(state: MatchState): void {
    const prevState = this.lastState;
    this.lastState = state;

    // Trigger dice roll animation when dice transitions to a rolled value
    const justRolled = state.currentDice !== null && state.moveSeq !== this.lastDiceSeq;
    if (justRolled && state.currentDice !== null) {
      this.lastDiceSeq = state.moveSeq;
      this.dice.triggerRoll(state.currentDice);
    } else if (state.currentDice === null && state.phase === 'WAITING_ROLL') {
      this.lastDiceSeq = -1;
    }

    const activeSeat = state.players[state.activeSeatIndex];
    this.activeTurnInteractive =
      state.phase === 'WAITING_ROLL' && activeSeat?.type === 'human';

    // Synchronize 3D yard auras with active player color
    const activeColor = activeSeat?.color;
    (['red', 'blue', 'yellow', 'green'] as KingdomColor[]).forEach((col) => {
      const a = this.yardAuras[col];
      if (a) {
        (a.material as THREE.MeshBasicMaterial).opacity = col === activeColor ? 0.75 : 0;
      }
    });

    const legalPieceSet = new Set<number>(
      state.phase === 'WAITING_MOVE' && activeSeat?.type === 'human'
        ? state.legalMoves.map((m) => m.pieceIndex)
        : [],
    );

    const proxyGeo = new THREE.CylinderGeometry(0.56, 0.56, 1.25, 10);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    this.boardDisposables.push(proxyGeo, proxyMat);

    for (const player of state.players) {
      for (const piece of player.pieces) {
        const key = `${player.seatIndex}:${piece.pieceIndex}`;
        let entity = this.pieceEntities.get(key);

        if (!entity) {
          const rig = buildProceduralCharacter(
            player.characterId,
            player.outfitId,
            player.skinId,
          );
          const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
          proxyMesh.position.y = 0.58;
          proxyMesh.userData = {
            seatIndex: player.seatIndex,
            pieceIndex: piece.pieceIndex,
          };
          rig.root.add(proxyMesh);
          this.clickables.push(proxyMesh);
          this.piecesGroup.add(rig.root);

          const startWorld = getPieceWorldCoord(player.color, piece.pieceIndex, piece.progress);
          rig.root.position.set(startWorld.x, TILE_TOP_Y, startWorld.z);

          entity = {
            seatIndex: player.seatIndex,
            color: player.color,
            pieceIndex: piece.pieceIndex,
            rig,
            proxyMesh,
            currentProgress: piece.progress,
            animQueue: [],
            activeHop: null,
            reactionTimer: 0,
            reactionState: 'idle',
            lookBiasYaw: 0,
            trailAccum: 0,
          };
          this.pieceEntities.set(key, entity);

          if (APP_CONFIG.featureFlags.enableCustomGlbLoader) {
            void tryAttachOptionalGlb(rig, undefined);
          }
        }

        // Six-roll team celebration
        if (justRolled && state.currentDice === 6 && player.seatIndex === state.activeSeatIndex) {
          entity.reactionState = 'celebrate_six';
          entity.reactionTimer = 1.25;
          const pos = entity.rig.root.position;
          this.spawnSparkBurst(pos.x, pos.y + 0.65, pos.z, '#FDE047', 8);
        }

        // Queue smooth step-by-step hops when progress changes
        if (entity.currentProgress !== piece.progress) {
          const oldProg = entity.currentProgress;
          const newProg = piece.progress;
          entity.currentProgress = newProg;

          if (newProg < 0) {
            const fromW = getPieceWorldCoord(player.color, piece.pieceIndex, oldProg);
            const toW = getPieceWorldCoord(player.color, piece.pieceIndex, -1);
            entity.animQueue = [
              {
                from: new THREE.Vector3(fromW.x, TILE_TOP_Y, fromW.z),
                to: new THREE.Vector3(toW.x, TILE_TOP_Y, toW.z),
                progress: -1,
                isStar: false,
              },
            ];
            entity.reactionState = 'defeat_sad';
            entity.reactionTimer = 1.8;
            this.spawnTearDroplets(fromW.x, TILE_TOP_Y + 0.58, fromW.z, 12);
            this.spawnSparkBurst(fromW.x, TILE_TOP_Y + 0.5, fromW.z, '#EF4444', 18);
            this.focusPointCinematic(fromW.x, fromW.z);
            soundEngine.playCapture();
          } else if (oldProg < 0 && newProg >= 0) {
            const fromW = getPieceWorldCoord(player.color, piece.pieceIndex, -1);
            const toW = getPieceWorldCoord(player.color, piece.pieceIndex, newProg);
            entity.animQueue.push({
              from: new THREE.Vector3(fromW.x, TILE_TOP_Y, fromW.z),
              to: new THREE.Vector3(toW.x, TILE_TOP_Y, toW.z),
              progress: newProg,
              isStar: true,
            });
            entity.reactionState = 'land';
            entity.reactionTimer = 0.25;
          } else {
            for (let step = oldProg + 1; step <= newProg; step++) {
              const fromW = getPieceWorldCoord(player.color, piece.pieceIndex, step - 1);
              const toW = getPieceWorldCoord(player.color, piece.pieceIndex, step);
              const trackIdx =
                step <= 50 ? (KINGDOM_START_INDEX[player.color] + step) % 52 : -1;
              entity.animQueue.push({
                from: new THREE.Vector3(fromW.x, TILE_TOP_Y, fromW.z),
                to: new THREE.Vector3(toW.x, TILE_TOP_Y, toW.z),
                progress: step,
                isStar: STAR_TRACK_INDICES.has(trackIdx),
              });
            }
            if (newProg === 56) {
              entity.reactionState = 'home_entry';
              entity.reactionTimer = 2.0;
              this.spawnConfetti(22);
              this.focusPointCinematic(0, 0);
            }
          }
        }

        const isLegal =
          player.seatIndex === state.activeSeatIndex && legalPieceSet.has(piece.pieceIndex);
        entity.rig.selectionRing.visible = isLegal;

        if (state.phase === 'GAME_OVER') {
          if (state.winners[0] === player.color) {
            entity.reactionState = 'victory';
            entity.reactionTimer = 12;
          } else {
            entity.reactionState = 'defeat';
            entity.reactionTimer = 12;
          }
        }
      }
    }

    if (prevState?.phase !== 'GAME_OVER' && state.phase === 'GAME_OVER') {
      const winner = state.winners[0] || 'red';
      this.launchVictoryFireworks(winner);
      this.focusPointCinematic(0, 0);
    }

    if (this.cameraMode === 'follow') {
      this.updateFollowTarget();
    }
  }

  public launchVictoryFireworks(winnerColor: KingdomColor): void {
    if (this.reducedMotion) return;
    const kingdomPalettes: Record<KingdomColor, string[]> = {
      red: ['#EF4444', '#F87171', '#FCA5A5', '#FDE047', '#FFFFFF'],
      blue: ['#3B82F6', '#60A5FA', '#93C5FD', '#FDE047', '#FFFFFF'],
      green: ['#22C55E', '#4ADE80', '#86EFAC', '#FDE047', '#FFFFFF'],
      yellow: ['#EAB308', '#FACC15', '#FEF08A', '#F97316', '#FFFFFF'],
    };
    const palette = kingdomPalettes[winnerColor] || ['#FDE047', '#FFFFFF', '#E6A93C'];

    const spawnFireworkAt = (x: number, y: number, z: number, burstColor: string, count: number) => {
      if (this.disposed) return;
      const allowed = this.quality === 'low' ? Math.min(count, 14) : count;
      for (let i = 0; i < allowed; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: burstColor });
        const mesh = new THREE.Mesh(_sparkGeo, mat);
        mesh.position.set(x, y, z);
        this.vfxGroup.add(mesh);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const spd = 2.4 + Math.random() * 3.6;

        this.particles.push({
          mesh,
          vx: Math.sin(phi) * Math.cos(theta) * spd,
          vy: Math.cos(phi) * spd + 1.2,
          vz: Math.sin(phi) * Math.sin(theta) * spd,
          vr: 8,
          gravity: 5.5,
          life: 1.2 + Math.random() * 0.6,
          maxLife: 1.8,
        });
      }
    };

    const rocketStages = [
      { delay: 100, x: -4.5, y: 5.2, z: -4.5, color: palette[0] },
      { delay: 450, x: 4.5, y: 5.6, z: -4.5, color: palette[1] },
      { delay: 850, x: -4.5, y: 5.4, z: 4.5, color: palette[2] },
      { delay: 1250, x: 4.5, y: 5.8, z: 4.5, color: palette[0] },
      { delay: 1700, x: 0, y: 6.2, z: 0, color: '#FDE047' },
    ];

    rocketStages.forEach((stage) => {
      setTimeout(() => {
        if (this.disposed) return;
        spawnFireworkAt(stage.x, stage.y, stage.z, stage.color, 28);
        this.spawnConfetti(22);
      }, stage.delay);
    });
  }

  private spawnSparkBurst(x: number, y: number, z: number, colorHex: string, count: number): void {
    if (this.reducedMotion) return;
    const allowed =
      this.quality === 'low' ? Math.min(count, 6) : this.quality === 'medium' ? Math.min(count, 12) : count;

    for (let i = 0; i < allowed; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex });
      const mesh = new THREE.Mesh(_sparkGeo, mat);
      mesh.position.set(x, y, z);
      this.vfxGroup.add(mesh);
      const ang = (i / allowed) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 1.6 + Math.random() * 2.4;
      this.particles.push({
        mesh,
        vx: Math.cos(ang) * spd,
        vy: 1.8 + Math.random() * 2.2,
        vz: Math.sin(ang) * spd,
        vr: 6,
        gravity: 7.5,
        life: 0.75,
        maxLife: 0.75,
      });
    }
  }

  private spawnTearDroplets(x: number, y: number, z: number, count: number): void {
    if (this.reducedMotion) return;
    const allowed = this.quality === 'low' ? Math.min(count, 4) : count;
    for (let i = 0; i < allowed; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: '#60A5FA',
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(_tearGeo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.16,
        y + (Math.random() - 0.5) * 0.12,
        z + (Math.random() - 0.5) * 0.16,
      );
      this.vfxGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.4 + Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.5,
        vr: 2,
        gravity: 5.8,
        life: 0.85,
        maxLife: 0.85,
      });
    }
  }

  private spawnTrailMote(x: number, y: number, z: number, colorHex: string): void {
    if (this.reducedMotion || this.quality === 'low') return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(_sparkGeo, mat);
    mesh.scale.setScalar(0.55);
    mesh.position.set(x + (Math.random() - 0.5) * 0.18, y + 0.15, z + (Math.random() - 0.5) * 0.18);
    this.vfxGroup.add(mesh);
    this.particles.push({
      mesh,
      vx: (Math.random() - 0.5) * 0.4,
      vy: 0.65,
      vz: (Math.random() - 0.5) * 0.4,
      vr: 3,
      gravity: 1.2,
      life: 0.45,
      maxLife: 0.45,
    });
  }

  private spawnConfetti(count: number): void {
    const allowed =
      this.quality === 'low' ? Math.min(count, 10) : this.quality === 'medium' ? Math.min(count, 26) : count;
    if (this.reducedMotion) return;

    const palette = ['#DC2626', '#2563EB', '#16A34A', '#E6A93C', '#FDE047'];
    for (let i = 0; i < allowed; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(_confettiGeo, mat);
      mesh.position.set((Math.random() - 0.5) * 3.5, 2.2 + Math.random() * 1.4, (Math.random() - 0.5) * 3.5);
      this.vfxGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4.8,
        vy: 3.6 + Math.random() * 4.5,
        vz: (Math.random() - 0.5) * 4.8,
        vr: (Math.random() - 0.5) * 8,
        gravity: 9.2,
        life: 2.3,
        maxLife: 2.3,
      });
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    const now = performance.now();
    if (now - this.lastHoverCheck < 60) return;
    this.lastHoverCheck = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(_pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickables, false);
    this.renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  }

  private handleCanvasTap(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(_pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickables, false);
    if (hits.length === 0) return;

    const hitObj = hits[0].object;
    if (hitObj.userData.isDice) {
      this.callbacks.onDiceClick();
      return;
    }
    if (
      typeof hitObj.userData.seatIndex === 'number' &&
      typeof hitObj.userData.pieceIndex === 'number'
    ) {
      this.callbacks.onPieceClick(
        hitObj.userData.seatIndex,
        hitObj.userData.pieceIndex as 0 | 1 | 2 | 3,
      );
    }
  }

  private handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(this.container.clientWidth, 320);
    const height = Math.max(this.container.clientHeight, 320);
    const aspect = width / height;
    this.camera.fov = aspect < 0.85 ? 48 : 42;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop(): void {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (this.disposed) return;
          const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (status === gl.UNSIGNALED) {
            this.frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            this.frameId = window.setTimeout(cb, 80);
          }
        };
        this.frameId = window.setTimeout(poll, 5);
      } else {
        this.frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (this.disposed) return;
      const delta = Math.min(0.1, this.clock.getDelta());
      const elapsed = this.clock.getElapsedTime();

      this.updateScene(delta, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private updateScene(delta: number, elapsed: number): void {
    if (this.cameraTransitionActive) {
      const lambda = this.reducedMotion ? 30 : 6;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.desiredCamPos.x, lambda, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.desiredCamPos.y, lambda, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.desiredCamPos.z, lambda, delta);
      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.desiredCamTarget.x, lambda, delta);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.desiredCamTarget.y, lambda, delta);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.desiredCamTarget.z, lambda, delta);
      if (this.camera.position.distanceTo(this.desiredCamPos) < 0.05) {
        this.cameraTransitionActive = false;
      }
    }

    if (!this.cameraLocked) {
      this.controls.update();
    }

    this.islandWorld.update(elapsed, this.reducedMotion);
    this.dice.update(delta, elapsed, this.activeTurnInteractive);

    // Find currently moving piece so nearby heroes can briefly look toward it
    let movingFocus: THREE.Vector3 | null = null;
    for (const ent of this.pieceEntities.values()) {
      if (ent.activeHop) {
        movingFocus = ent.rig.root.position;
        break;
      }
    }

    const activeSeatIdx = this.lastState?.activeSeatIndex ?? -1;
    const waitingRoll = this.lastState?.phase === 'WAITING_ROLL';

    for (const entity of this.pieceEntities.values()) {
      let anim: CharacterAnimState = 'idle';
      entity.lookBiasYaw = 0;

      if (!entity.activeHop && entity.animQueue.length > 0) {
        const next = entity.animQueue.shift()!;
        entity.activeHop = {
          from: next.from,
          to: next.to,
          elapsed: 0,
          duration: this.reducedMotion ? 0.05 : next.progress < 0 ? 0.88 : 0.17,
          targetProgress: next.progress,
          isStar: next.isStar,
        };
      }

      if (entity.activeHop) {
        const hop = entity.activeHop;
        hop.elapsed += delta;
        const t = Math.min(1, hop.elapsed / hop.duration);
        _vec3.lerpVectors(hop.from, hop.to, t);
        const arcHeight = hop.targetProgress < 0 ? 2.85 : 0.44;
        _vec3.y += Math.sin(t * Math.PI) * arcHeight;
        entity.rig.root.position.copy(_vec3);

        // Smooth facing toward travel waypoint
        const dx = hop.to.x - hop.from.x;
        const dz = hop.to.z - hop.from.z;
        if (Math.abs(dx) + Math.abs(dz) > 0.01) {
          const targetYaw = Math.atan2(dx, dz);
          const diff = Math.atan2(
            Math.sin(targetYaw - entity.rig.root.rotation.y),
            Math.cos(targetYaw - entity.rig.root.rotation.y),
          );
          entity.rig.root.rotation.y += diff * Math.min(1, delta * 18);
        }

        entity.trailAccum += delta;
        if (entity.trailAccum > 0.07) {
          entity.trailAccum = 0;
          this.spawnTrailMote(_vec3.x, _vec3.y, _vec3.z, APP_CONFIG.kingdoms[entity.color].hex);
          if (hop.targetProgress < 0) {
            this.spawnTearDroplets(_vec3.x, _vec3.y + 0.35, _vec3.z, 1);
          }
        }

        anim = hop.targetProgress < 0 ? 'defeat_sad' : 'jump';
        if (t >= 1) {
          entity.rig.root.position.copy(hop.to);
          if (entity.animQueue.length === 0) {
            // Final landing stop transition: land -> safe_zone (if star) -> idle
            if (hop.isStar && hop.targetProgress >= 0) {
              entity.reactionState = 'safe_zone';
              entity.reactionTimer = 0.75;
              this.spawnSparkBurst(hop.to.x, hop.to.y + 0.3, hop.to.z, '#FDE047', 10);
              soundEngine.playSafeZone();
            } else if (hop.targetProgress >= 0 && entity.reactionTimer <= 0) {
              entity.reactionState = 'land';
              entity.reactionTimer = 0.16;
              soundEngine.playHop(hop.targetProgress);
            } else if (hop.targetProgress < 0) {
              entity.reactionState = 'defeat_sad';
              entity.reactionTimer = 1.1;
              this.spawnSparkBurst(hop.to.x, hop.to.y + 0.25, hop.to.z, APP_CONFIG.kingdoms[entity.color].hex, 8);
              soundEngine.playTearDrop();
            }
          }
          entity.activeHop = null;
        }
      } else if (entity.reactionTimer > 0) {
        entity.reactionTimer -= delta;
        anim = entity.reactionState;
      } else if (waitingRoll && entity.seatIndex === activeSeatIdx) {
        anim = 'anticipate';
        // Look toward central dice dais
        const toDiceYaw = Math.atan2(-entity.rig.root.position.x, -entity.rig.root.position.z);
        entity.lookBiasYaw =
          Math.atan2(
            Math.sin(toDiceYaw - entity.rig.root.rotation.y),
            Math.cos(toDiceYaw - entity.rig.root.rotation.y),
          ) * 0.35;
      } else if (movingFocus) {
        const dist = entity.rig.root.position.distanceTo(movingFocus);
        if (dist > 0.3 && dist < 3.4) {
          const dx = movingFocus.x - entity.rig.root.position.x;
          const dz = movingFocus.z - entity.rig.root.position.z;
          const watchYaw = Math.atan2(dx, dz);
          entity.lookBiasYaw =
            Math.atan2(
              Math.sin(watchYaw - entity.rig.root.rotation.y),
              Math.cos(watchYaw - entity.rig.root.rotation.y),
            ) * 0.45;
        }
      }

      updateCharacterRigAnimation(
        entity.rig,
        anim,
        elapsed,
        delta,
        entity.seatIndex * 0.8 + entity.pieceIndex * 0.45,
        entity.lookBiasYaw,
      );
    }

    // Dynamic pulsing active yard aura ring
    const activeColor = this.lastState?.players[this.lastState.activeSeatIndex]?.color;
    if (activeColor && this.yardAuras[activeColor]) {
      const pulse = 0.45 + Math.sin(elapsed * 4.2) * 0.35;
      (this.yardAuras[activeColor]!.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Update burst / trail / confetti particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.vfxGroup.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.vy -= p.gravity * delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mesh.rotation.x += p.vr * delta;
      p.mesh.rotation.y += p.vr * delta;
      const fade = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      if (mat.transparent) mat.opacity = fade;
    }
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResizeBound);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUpBound);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMoveBound);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestoredBound);

    for (const p of this.particles) {
      this.vfxGroup.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles.length = 0;

    for (const entity of this.pieceEntities.values()) {
      disposeCharacterRig(entity.rig);
    }
    this.pieceEntities.clear();
    this.dice.dispose();
    this.clearBoardGroup();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
