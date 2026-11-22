import * as THREE from 'three';
import { createDiceFaceTexture } from './proceduralTextures';

/**
 * BoxGeometry material face order:
 * 0: +X (right)  -> 3
 * 1: -X (left)   -> 4
 * 2: +Y (top)    -> 1
 * 3: -Y (bottom) -> 6
 * 4: +Z (front)  -> 2
 * 5: -Z (back)   -> 5
 */
const FACE_EULER_TO_TOP: Record<number, THREE.Euler> = {
  1: new THREE.Euler(0, 0, 0),
  2: new THREE.Euler(-Math.PI / 2, 0, 0),
  3: new THREE.Euler(0, 0, Math.PI / 2),
  4: new THREE.Euler(0, 0, -Math.PI / 2),
  5: new THREE.Euler(Math.PI / 2, 0, 0),
  6: new THREE.Euler(Math.PI, 0, 0),
};

export class Dice3D {
  public readonly group: THREE.Group;
  public readonly mesh: THREE.Mesh;
  private readonly glowRing: THREE.Mesh;
  private readonly textures: THREE.CanvasTexture[] = [];
  private readonly materials: THREE.MeshStandardMaterial[] = [];
  private readonly extraDisposables: Array<{ dispose: () => void }> = [];
  private readonly geometry: THREE.BufferGeometry;
  private readonly baseY = 0.68;

  private rolling = false;
  private rollElapsed = 0;
  private readonly rollDuration = 0.72;
  private lastRolledValue = 1;
  private startQuat = new THREE.Quaternion();
  private targetQuat = new THREE.Quaternion();
  private spinAxis = new THREE.Vector3(1, 1, 0.5).normalize();
  private onLanded?: (value: number) => void;

  constructor(anisotropy = 4, onLanded?: (value: number) => void) {
    this.onLanded = onLanded;
    this.group = new THREE.Group();
    this.geometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);

    const faceOrder = [3, 4, 1, 6, 2, 5];
    for (const pip of faceOrder) {
      const tex = createDiceFaceTexture(pip, anisotropy);
      this.textures.push(tex);
      this.materials.push(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.22,
          metalness: 0.12,
        }),
      );
    }

    this.mesh = new THREE.Mesh(this.geometry, this.materials);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.y = this.baseY;
    this.mesh.userData.isDice = true;

    // Sculpted gold corner stud accents framing the die
    const cornerGeo = new THREE.SphereGeometry(0.085, 8, 8);
    const cornerMat = new THREE.MeshStandardMaterial({
      color: '#E6A93C',
      roughness: 0.22,
      metalness: 0.88,
    });
    this.extraDisposables.push(cornerGeo, cornerMat);
    const cOff = 0.435;
    for (const cx of [-cOff, cOff]) {
      for (const cy of [-cOff, cOff]) {
        for (const cz of [-cOff, cOff]) {
          const stud = new THREE.Mesh(cornerGeo, cornerMat);
          stud.position.set(cx, cy, cz);
          this.mesh.add(stud);
        }
      }
    }

    // Active turn sanctuary halo ring beneath the die
    const ringGeo = new THREE.RingGeometry(0.68, 0.82, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#FDE047',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    });
    this.extraDisposables.push(ringGeo, ringMat);
    this.glowRing = new THREE.Mesh(ringGeo, ringMat);
    this.glowRing.rotation.x = -Math.PI / 2;
    this.glowRing.position.y = 0.02;

    this.group.add(this.mesh, this.glowRing);
  }

  public triggerRoll(value: number): void {
    const clamped = Math.max(1, Math.min(6, Math.round(value)));
    this.lastRolledValue = clamped;
    this.rolling = true;
    this.rollElapsed = 0;
    this.startQuat.copy(this.mesh.quaternion);
    const euler = FACE_EULER_TO_TOP[clamped] ?? FACE_EULER_TO_TOP[1];
    this.targetQuat.setFromEuler(euler);
    this.spinAxis
      .set(
        (clamped % 2 === 0 ? 1 : -1) * 0.85,
        1.15,
        (clamped % 3 === 0 ? 1 : -1) * 0.65,
      )
      .normalize();
  }

  public snapToValue(value: number): void {
    const clamped = Math.max(1, Math.min(6, Math.round(value)));
    this.lastRolledValue = clamped;
    this.rolling = false;
    this.mesh.quaternion.setFromEuler(FACE_EULER_TO_TOP[clamped] ?? FACE_EULER_TO_TOP[1]);
    this.mesh.position.set(0, this.baseY, 0);
    this.mesh.scale.set(1, 1, 1);
  }

  public update(delta: number, elapsed: number, interactiveGlow: boolean): void {
    const ringMat = this.glowRing.material as THREE.MeshBasicMaterial;
    if (interactiveGlow && !this.rolling) {
      ringMat.opacity = 0.55 + Math.sin(elapsed * 4) * 0.25;
      const pulse = 1 + Math.sin(elapsed * 4) * 0.06;
      this.glowRing.scale.set(pulse, pulse, 1);
    } else {
      ringMat.opacity = Math.max(0, ringMat.opacity - delta * 4);
    }

    if (this.rolling) {
      this.rollElapsed += delta;
      const t = Math.min(1, this.rollElapsed / this.rollDuration);

      // Realistic two-phase bounce: main arc (0..0.76) + secondary settle hop (0.76..1.0)
      let bounceY = 0;
      if (t < 0.76) {
        const bt = t / 0.76;
        bounceY = Math.sin(bt * Math.PI) * 1.55;
      } else {
        const st = (t - 0.76) / 0.24;
        bounceY = Math.sin(st * Math.PI) * 0.24;
      }
      this.mesh.position.y = this.baseY + bounceY;

      // Subtle lateral jitter during main spin settling cleanly to center
      const jitterFade = Math.max(0, 1 - t / 0.76);
      this.mesh.position.x = Math.sin(t * 22) * 0.14 * jitterFade;
      this.mesh.position.z = Math.cos(t * 18) * 0.14 * jitterFade;

      if (t < 0.68) {
        this.mesh.rotateOnWorldAxis(this.spinAxis, delta * 19);
      } else {
        const settleT = (t - 0.68) / 0.32;
        this.mesh.quaternion.slerp(this.targetQuat, Math.min(1, settleT * 0.38 + delta * 12));
      }

      if (t >= 1) {
        this.rolling = false;
        this.mesh.quaternion.copy(this.targetQuat);
        this.mesh.position.set(0, this.baseY, 0);
        this.onLanded?.(this.lastRolledValue);
      }
      return;
    }

    // Subtle royal hover pulse when waiting for player roll
    this.mesh.position.set(
      0,
      interactiveGlow ? this.baseY + Math.sin(elapsed * 3.5) * 0.06 + 0.09 : this.baseY,
      0,
    );
  }

  public dispose(): void {
    this.geometry.dispose();
    this.textures.forEach((t) => t.dispose());
    this.materials.forEach((m) => m.dispose());
    this.extraDisposables.forEach((d) => d.dispose());
  }
}
