import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ZoomIn,
  ZoomOut,
  Compass,
  RefreshCw,
} from 'lucide-react';
import {
  buildProceduralCharacter,
  disposeCharacterRig,
  updateCharacterRigAnimation,
  type CharacterAnimState,
  type CharacterRig,
} from '../../three/characterBuilder';
import { detectSoftwareWebGL } from '../../three/boardScene';

interface CharacterPreviewCanvasProps {
  characterId: string;
  outfitId: string;
  skinId: string;
  animState: CharacterAnimState;
}

const SPEED_OPTIONS = [0.25, 0.5, 1.0, 1.5, 2.0];

export const CharacterPreviewCanvas: React.FC<CharacterPreviewCanvasProps> = ({
  characterId,
  outfitId,
  skinId,
  animState,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<CharacterAnimState>(animState);
  const rigRef = useRef<CharacterRig | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Animation Studio playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isLooping, setIsLooping] = useState(true);
  const [autoOrbit, setAutoOrbit] = useState(true);

  // Mutable refs for animation loop
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(playbackSpeed);
  const isLoopingRef = useRef(isLooping);
  const animTimeRef = useRef(0);

  useEffect(() => {
    animRef.current = animState;
    animTimeRef.current = 0; // reset phase when animation changes
  }, [animState]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoOrbit;
    }
  }, [autoOrbit]);

  const handleReplay = () => {
    animTimeRef.current = 0;
    setIsPlaying(true);
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 1.15, 2.55);
    controlsRef.current.target.set(0, 0.45, 0);
    controlsRef.current.update();
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3().subVectors(cameraRef.current.position, controlsRef.current.target);
    const currDist = dir.length();
    const newDist = Math.max(1.4, Math.min(4.4, currDist + delta));
    dir.normalize().multiplyScalar(newDist);
    cameraRef.current.position.addVectors(controlsRef.current.target, dir);
    controlsRef.current.update();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const probe = detectSoftwareWebGL();
    if (!probe.supported) return;

    const width = Math.max(container.clientWidth, 260);
    const height = Math.max(container.clientHeight, 260);

    const renderer = new THREE.WebGLRenderer({
      antialias: !probe.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(probe.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 1.15, 2.55);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !probe.isSoftwareGl;
    controls.enablePan = false;
    controls.minDistance = 1.4;
    controls.maxDistance = 4.4;
    controls.target.set(0, 0.45, 0);
    controls.autoRotate = autoOrbit && !probe.isSoftwareGl;
    controls.autoRotateSpeed = 1.4;
    controlsRef.current = controls;

    const hemi = new THREE.HemisphereLight(0xcbd5e1, 0x334155, 1.0);
    const key = new THREE.DirectionalLight(0xffe4b5, 2.2);
    key.position.set(2.5, 4.2, 3);
    const rim = new THREE.DirectionalLight(0x93c5fd, 0.9);
    rim.position.set(-2.5, 2.2, -2.5);
    scene.add(hemi, key, rim);

    // Sculpted Royal Plinth
    const plinthGeo = new THREE.CylinderGeometry(0.68, 0.75, 0.14, 28);
    const plinthRingGeo = new THREE.TorusGeometry(0.72, 0.022, 8, 28);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: '#1A2130',
      roughness: 0.38,
      metalness: 0.45,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: '#D7A64B',
      roughness: 0.22,
      metalness: 0.88,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.07;
    const trim = new THREE.Mesh(plinthRingGeo, goldTrimMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = -0.01;
    scene.add(plinth, trim);

    const rig = buildProceduralCharacter(characterId, outfitId, skinId);
    rigRef.current = rig;
    scene.add(rig.root);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const realDt = Math.min(0.1, clock.getDelta());
      
      if (isPlayingRef.current) {
        animTimeRef.current += realDt * speedRef.current;
        if (!isLoopingRef.current && animTimeRef.current > 3.0) {
          animTimeRef.current = 3.0; // clamp end of single-play
        }
      }

      if (rigRef.current) {
        updateCharacterRigAnimation(
          rigRef.current,
          animRef.current,
          animTimeRef.current,
          realDt * speedRef.current,
        );
      }
      controls.update();
      renderer.render(scene, camera);

      if (probe.isSoftwareGl) {
        frameId = window.setTimeout(tick, 80);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };
    tick();

    const onResize = () => {
      if (disposed) return;
      const w = Math.max(container.clientWidth, 260);
      const h = Math.max(container.clientHeight, 260);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      if (rigRef.current) {
        scene.remove(rigRef.current.root);
        disposeCharacterRig(rigRef.current);
      }
      plinthGeo.dispose();
      plinthRingGeo.dispose();
      plinthMat.dispose();
      goldTrimMat.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (rigRef.current) {
      scene.remove(rigRef.current.root);
      disposeCharacterRig(rigRef.current);
    }
    const nextRig = buildProceduralCharacter(characterId, outfitId, skinId);
    rigRef.current = nextRig;
    scene.add(nextRig.root);
  }, [characterId, outfitId, skinId]);

  return (
    <div className="relative h-full min-h-[300px] w-full overflow-hidden rounded-2xl border border-[#E7E2D8]/15 bg-gradient-to-b from-[#1A2130] to-[#10141E] shadow-inner">
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        className="h-full w-full"
        aria-label="Live 360 degree 3D character animation studio canvas"
      />

      {/* Top Floating Camera Controls */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#E7E2D8]/15 bg-[#10141E]/80 p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setAutoOrbit(!autoOrbit)}
          aria-label="Toggle auto orbit"
          title="Toggle 360° Auto-Orbit"
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            autoOrbit ? 'bg-[#E6A93C] text-[#10141E]' : 'text-[#E7E2D8]/75 hover:bg-white/10'
          }`}
        >
          <Compass className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-0.35)}
          aria-label="Zoom in"
          title="Zoom In"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#E7E2D8]/75 transition hover:bg-white/10"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.35)}
          aria-label="Zoom out"
          title="Zoom Out"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#E7E2D8]/75 transition hover:bg-white/10"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          aria-label="Reset camera"
          title="Center Camera View"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#E7E2D8]/75 transition hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Bottom Floating Studio Timeline Toolbar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7E2D8]/20 bg-[#10141E]/90 px-3 py-2 backdrop-blur-md">
        {/* Play / Pause & Replay */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6A93C] text-[#10141E] shadow transition hover:bg-[#D97706]"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={handleReplay}
            aria-label="Replay animation"
            title="Replay from start"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E7E2D8]/20 bg-[#1A2130] text-[#E7E2D8] transition hover:border-[#E6A93C]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            aria-label="Toggle loop"
            title={isLooping ? 'Loop Mode: ON' : 'Loop Mode: OFF (Play Once)'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isLooping
                ? 'border-[#E6A93C]/60 bg-[#E6A93C]/20 text-[#E6A93C]'
                : 'border-[#E7E2D8]/20 bg-[#1A2130] text-[#E7E2D8]/50 hover:text-[#E7E2D8]'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Speed multiplier selector */}
        <div className="flex items-center gap-1">
          <span className="hidden text-[11px] font-medium text-[#E7E2D8]/60 sm:inline">Speed:</span>
          {SPEED_OPTIONS.map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition ${
                playbackSpeed === spd
                  ? 'bg-[#E6A93C] text-[#10141E]'
                  : 'bg-[#1A2130] text-[#E7E2D8]/70 hover:text-[#E7E2D8]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
