import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getCharacterById, type KingdomCharacter } from '../data/characters';
import {
  applyPoseToRig,
  computeAnimPoseTargets,
  type CharacterAnimState,
} from './characterAnimController';
import { createSoftShadowTexture } from './proceduralTextures';

export type { CharacterAnimState };

export interface CharacterRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tailGroup: THREE.Group;
  wingsGroup: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  eyelids: THREE.Mesh[];
  selectionRing: THREE.Mesh;
  disposables: Array<{ dispose: () => void }>;
  animationMode: 'procedural-multipart' | 'gltf-model';
  mixer?: THREE.AnimationMixer;
  gltfActions?: Record<string, THREE.AnimationAction>;
  activeGltfAction?: THREE.AnimationAction;
}

const sharedShadowGeo = new THREE.PlaneGeometry(0.92, 0.92);
let sharedShadowTex: THREE.CanvasTexture | null = null;
const gltfLoader = new GLTFLoader();

function getShadowTexture(): THREE.CanvasTexture {
  if (!sharedShadowTex) {
    sharedShadowTex = createSoftShadowTexture();
  }
  return sharedShadowTex;
}

function makeMat(
  colorHex: string,
  roughness: number,
  metalness: number,
  emissiveHex?: string,
  emissiveIntensity = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness,
    metalness,
    emissive: emissiveHex ? new THREE.Color(emissiveHex) : new THREE.Color(0x000000),
    emissiveIntensity,
  });
}

function addExpressiveEyes(
  headGroup: THREE.Group,
  eyeY: number,
  eyeZ: number,
  spreadX: number,
  eyeColorHex: string,
  eyelidHex: string,
  eyelidsOut: THREE.Mesh[],
  disposables: Array<{ dispose: () => void }>,
) {
  const scleraGeo = new THREE.SphereGeometry(0.044, 12, 10);
  const irisGeo = new THREE.SphereGeometry(0.029, 10, 10);
  const pupilGeo = new THREE.SphereGeometry(0.017, 8, 8);
  const lidGeo = new THREE.BoxGeometry(0.095, 0.085, 0.055);
  const whiteMat = makeMat('#F8FAFC', 0.16, 0.0);
  const irisMat = makeMat(eyeColorHex, 0.14, 0.1, eyeColorHex, 0.2);
  const pupilMat = makeMat('#090D16', 0.1, 0.05);
  const lidMat = makeMat(eyelidHex, 0.55, 0.08);
  disposables.push(scleraGeo, irisGeo, pupilGeo, lidGeo, whiteMat, irisMat, pupilMat, lidMat);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(scleraGeo, whiteMat);
    eye.scale.set(1, 1.1, 0.72);
    eye.position.set(side * spreadX, eyeY, eyeZ);

    const iris = new THREE.Mesh(irisGeo, irisMat);
    iris.position.set(side * spreadX, eyeY, eyeZ + 0.02);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(side * spreadX, eyeY, eyeZ + 0.032);

    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.set(side * spreadX, eyeY + 0.025, eyeZ + 0.014);
    lid.scale.y = 0.04;
    eyelidsOut.push(lid);

    headGroup.add(eye, iris, pupil, lid);
  }
}

function buildLegs(
  bodyPivot: THREE.Group,
  leftLeg: THREE.Group,
  rightLeg: THREE.Group,
  primaryMat: THREE.Material,
  footMat: THREE.Material,
  legSpread: number,
  legHeight: number,
  footScale: number,
  disposables: Array<{ dispose: () => void }>,
) {
  const thighGeo = new THREE.CapsuleGeometry(0.058, legHeight * 0.55, 6, 10);
  const footGeo = new THREE.BoxGeometry(0.11 * footScale, 0.055, 0.16 * footScale);
  const toeGeo = new THREE.SphereGeometry(0.032 * footScale, 8, 6);
  disposables.push(thighGeo, footGeo, toeGeo);

  const hipY = legHeight + 0.06;
  [
    { group: leftLeg, side: -1 },
    { group: rightLeg, side: 1 },
  ].forEach(({ group, side }) => {
    group.position.set(side * legSpread, hipY, 0);

    const limb = new THREE.Mesh(thighGeo, primaryMat);
    limb.position.y = -legHeight * 0.48;
    limb.castShadow = true;

    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(0, -hipY + 0.028, 0.035);
    foot.castShadow = true;

    const toeL = new THREE.Mesh(toeGeo, footMat);
    toeL.position.set(-0.028 * footScale, -hipY + 0.022, 0.11 * footScale);
    const toeR = new THREE.Mesh(toeGeo, footMat);
    toeR.position.set(0.028 * footScale, -hipY + 0.022, 0.11 * footScale);

    group.add(limb, foot, toeL, toeR);
    bodyPivot.add(group);
  });
}

function addOutfitAccessory(
  bodyPivot: THREE.Group,
  headGroup: THREE.Group,
  torsoTopY: number,
  headTopY: number,
  outfitId: string,
  character: KingdomCharacter,
  disposables: Array<{ dispose: () => void }>,
) {
  const outfit = character.outfits.find((o) => o.id === outfitId) ?? character.outfits[0];
  const goldTrimMat = makeMat('#D7A64B', 0.22, 0.88);
  const armorMat = makeMat(outfit.accentColor, Math.max(0.18, 1 - outfit.metalness * 0.72), Math.min(0.92, outfit.metalness + 0.15));
  disposables.push(goldTrimMat, armorMat);

  if (outfit.accessory === 'crown') {
    // Royal Coronet: Faceted ring base + 5 crenellated crown spikes + glowing royal gem
    const crownBaseGeo = new THREE.CylinderGeometry(0.118, 0.096, 0.075, 12, 1, true);
    const spikeGeo = new THREE.ConeGeometry(0.024, 0.075, 4);
    const gemGeo = new THREE.OctahedronGeometry(0.046, 0);
    const gemMat = makeMat('#EF4444', 0.1, 0.35, '#F87171', 0.8);
    disposables.push(crownBaseGeo, spikeGeo, gemGeo, gemMat);

    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, headTopY + 0.035, 0);

    const baseMesh = new THREE.Mesh(crownBaseGeo, goldTrimMat);
    baseMesh.castShadow = true;
    crownGroup.add(baseMesh);

    // 5 royal spikes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeo, goldTrimMat);
      spike.position.set(Math.sin(angle) * 0.108, 0.055, Math.cos(angle) * 0.108);
      spike.rotation.y = angle;
      spike.rotation.z = -Math.sin(angle) * 0.12;
      spike.rotation.x = -Math.cos(angle) * 0.12;
      crownGroup.add(spike);
    }

    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 0.07, 0.105);
    crownGroup.add(gem);
    headGroup.add(crownGroup);

  } else if (outfit.accessory === 'pauldrons') {
    // Crimson Pauldrons: Multi-layered articulated segmented shoulder armor with gold rivets
    const plateUpperGeo = new THREE.SphereGeometry(0.112, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const plateLowerGeo = new THREE.SphereGeometry(0.098, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const rivetGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.016, 6);
    disposables.push(plateUpperGeo, plateLowerGeo, rivetGeo);

    for (const side of [-1, 1]) {
      const pGroup = new THREE.Group();
      pGroup.position.set(side * 0.225, torsoTopY - 0.015, 0);
      pGroup.rotation.z = -side * 0.42;

      const upper = new THREE.Mesh(plateUpperGeo, armorMat);
      upper.castShadow = true;
      const lower = new THREE.Mesh(plateLowerGeo, goldTrimMat);
      lower.position.set(0, -0.045, 0.01);
      lower.scale.set(0.95, 0.95, 0.95);
      lower.castShadow = true;

      // Gold rivet studs along the rim
      for (let r = 0; r < 3; r++) {
        const rivet = new THREE.Mesh(rivetGeo, goldTrimMat);
        rivet.position.set((r - 1) * 0.05, 0.065, 0.06);
        rivet.rotation.x = Math.PI / 4;
        pGroup.add(rivet);
      }

      pGroup.add(upper, lower);
      bodyPivot.add(pGroup);
    }

  } else if (outfit.accessory === 'cloak') {
    // Mantle of Ash: Dual-layered draped royal cloak with embroidered gold clasps
    const cloakOuterGeo = new THREE.ConeGeometry(0.28, 0.46, 14, 2, true, Math.PI * 0.62, Math.PI * 0.76);
    const cloakInnerGeo = new THREE.ConeGeometry(0.265, 0.44, 14, 2, true, Math.PI * 0.64, Math.PI * 0.72);
    const claspGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 12);
    disposables.push(cloakOuterGeo, cloakInnerGeo, claspGeo);

    const cloakOuter = new THREE.Mesh(cloakOuterGeo, armorMat);
    cloakOuter.material.side = THREE.DoubleSide;
    cloakOuter.position.set(0, torsoTopY - 0.18, -0.075);
    cloakOuter.castShadow = true;

    const cloakInner = new THREE.Mesh(cloakInnerGeo, goldTrimMat);
    cloakInner.material.side = THREE.DoubleSide;
    cloakInner.position.set(0, torsoTopY - 0.18, -0.07);

    // Collar clasps
    for (const side of [-1, 1]) {
      const clasp = new THREE.Mesh(claspGeo, goldTrimMat);
      clasp.position.set(side * 0.09, torsoTopY + 0.02, 0.08);
      clasp.rotation.x = Math.PI / 3;
      bodyPivot.add(clasp);
    }

    bodyPivot.add(cloakOuter, cloakInner);

  } else if (outfit.accessory === 'scarf') {
    // Royal Cowl Scarf: Layered folded collar + tail flap
    const scarfGeo = new THREE.TorusGeometry(0.175, 0.046, 10, 20);
    const tailGeo = new THREE.BoxGeometry(0.082, 0.22, 0.038);
    disposables.push(scarfGeo, tailGeo);

    const scarf = new THREE.Mesh(scarfGeo, armorMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, torsoTopY + 0.012, 0);

    const tail = new THREE.Mesh(tailGeo, goldTrimMat);
    tail.position.set(0.095, torsoTopY - 0.08, -0.155);
    tail.rotation.x = 0.42;

    bodyPivot.add(scarf, tail);

  } else if (outfit.accessory === 'orb') {
    // Celestial Relic Orb: Floating crystal core + planetary gold orbital ring
    const orbGeo = new THREE.OctahedronGeometry(0.075, 2);
    const ringGeo = new THREE.TorusGeometry(0.12, 0.014, 8, 24);
    const orbMat = makeMat(outfit.accentColor, 0.12, 0.35, outfit.accentColor, 0.75);
    disposables.push(orbGeo, ringGeo, orbMat);

    const orbHolder = new THREE.Group();
    orbHolder.position.set(0.31, torsoTopY + 0.14, 0.12);

    const orb = new THREE.Mesh(orbGeo, orbMat);
    const ring = new THREE.Mesh(ringGeo, goldTrimMat);
    ring.rotation.x = Math.PI / 3.2;
    ring.rotation.y = Math.PI / 6;

    orbHolder.add(orb, ring);
    bodyPivot.add(orbHolder);
  }
}

export function buildProceduralCharacter(
  characterId: string,
  outfitId = 'royal-guard',
  skinId = 'classic',
): CharacterRig {
  const character = getCharacterById(characterId);
  const skin = character.skins.find((s) => s.id === skinId) ?? character.skins[0];
  const disposables: Array<{ dispose: () => void }> = [];

  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  const headGroup = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const tailGroup = new THREE.Group();
  const wingsGroup = new THREE.Group();
  const leftWing = new THREE.Group();
  const rightWing = new THREE.Group();
  const eyelids: THREE.Mesh[] = [];

  // Subtle soft radial contact shadow grounded flush at y = 0.008 (NO white pawn pedestal)
  const shadowMat = new THREE.MeshBasicMaterial({
    map: getShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.62,
  });
  disposables.push(shadowMat);
  const shadowPlane = new THREE.Mesh(sharedShadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.008;
  root.add(shadowPlane);

  // Selection glow ring (visible only when hero has a legal move)
  const ringGeo = new THREE.RingGeometry(0.38, 0.48, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FDE047'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });
  disposables.push(ringGeo, ringMat);
  const selectionRing = new THREE.Mesh(ringGeo, ringMat);
  selectionRing.rotation.x = -Math.PI / 2;
  selectionRing.position.y = 0.014;
  selectionRing.visible = false;
  root.add(selectionRing);

  // Materials with deliberate roughness/metalness contrast
  const primaryMat = makeMat(skin.primaryHex, 0.46, 0.14);
  const secondaryMat = makeMat(skin.secondaryHex, 0.72, 0.06);
  const trimMat = makeMat(skin.trimHex, 0.24, 0.84);
  const clawMat = makeMat('#E7E2D8', 0.35, 0.2);
  disposables.push(primaryMat, secondaryMat, trimMat, clawMat);

  const arch = character.archetype;
  const legHeight = arch === 'penguin' || arch === 'turtle' ? 0.16 : 0.22;
  const torsoBaseY = legHeight + 0.17;
  const torsoTopY = torsoBaseY + 0.18;

  // Articulated Legs & Feet seated flush at y = 0
  buildLegs(
    bodyPivot,
    leftLeg,
    rightLeg,
    primaryMat,
    arch === 'penguin' || arch === 'phoenix' || arch === 'royal_griffin' ? trimMat : secondaryMat,
    arch === 'turtle' ? 0.13 : 0.105,
    legHeight,
    arch === 'penguin' ? 1.15 : 1.0,
    disposables,
  );

  // Sculpted Pelvis & Chest Torso
  const pelvisGeo = new THREE.SphereGeometry(0.155, 14, 10);
  const torsoGeo = new THREE.CapsuleGeometry(0.155, 0.18, 8, 14);
  const bellyGeo = new THREE.SphereGeometry(0.132, 12, 10);
  disposables.push(pelvisGeo, torsoGeo, bellyGeo);

  const pelvis = new THREE.Mesh(pelvisGeo, primaryMat);
  pelvis.scale.set(1.05, 0.72, 0.95);
  pelvis.position.y = legHeight + 0.04;
  pelvis.castShadow = true;

  const torso = new THREE.Mesh(torsoGeo, primaryMat);
  torso.position.y = torsoBaseY;
  torso.castShadow = true;
  torso.receiveShadow = true;

  const belly = new THREE.Mesh(bellyGeo, secondaryMat);
  belly.scale.set(0.92, 1.18, 0.72);
  belly.position.set(0, torsoBaseY - 0.01, 0.085);
  bodyPivot.add(pelvis, torso, belly);

  // Sculpted Upper/Fore Arms & Paws/Flippers
  const armGeo = new THREE.CapsuleGeometry(0.048, 0.15, 6, 8);
  const pawGeo = new THREE.SphereGeometry(0.055, 8, 8);
  disposables.push(armGeo, pawGeo);

  [
    { group: leftArm, side: -1 },
    { group: rightArm, side: 1 },
  ].forEach(({ group, side }) => {
    group.position.set(side * 0.2, torsoTopY - 0.04, 0.02);
    const armMesh = new THREE.Mesh(armGeo, primaryMat);
    armMesh.position.set(0, -0.075, 0);
    armMesh.castShadow = true;
    const pawMesh = new THREE.Mesh(pawGeo, arch === 'penguin' ? primaryMat : secondaryMat);
    pawMesh.scale.set(1, 0.78, 1.18);
    pawMesh.position.set(0, -0.17, 0.02);
    group.add(armMesh, pawMesh);
    bodyPivot.add(group);
  });

  // Neck & Head Assembly
  const neckGeo = new THREE.CylinderGeometry(0.075, 0.095, 0.09, 10);
  const headGeo = new THREE.SphereGeometry(0.172, 18, 16);
  disposables.push(neckGeo, headGeo);

  const neck = new THREE.Mesh(neckGeo, primaryMat);
  neck.position.set(0, torsoTopY + 0.03, 0.01);
  bodyPivot.add(neck);

  headGroup.position.set(0, torsoTopY + 0.16, 0.02);
  const headMesh = new THREE.Mesh(headGeo, primaryMat);
  headMesh.scale.set(1.02, 0.96, 1.05);
  headMesh.castShadow = true;
  headGroup.add(headMesh);
  addExpressiveEyes(
    headGroup,
    0.032,
    0.135,
    0.068,
    skin.trimHex,
    skin.primaryHex,
    eyelids,
    disposables,
  );

  // Separate Left / Right Wing Pivots for winged species
  if (arch === 'dragon' || arch === 'phoenix' || arch === 'royal_griffin') {
    const wingBladeGeo = new THREE.BoxGeometry(0.3, 0.21, 0.03);
    const wingTipGeo = new THREE.ConeGeometry(0.085, 0.22, 6);
    disposables.push(wingBladeGeo, wingTipGeo);

    [
      { wingPivot: leftWing, side: -1 },
      { wingPivot: rightWing, side: 1 },
    ].forEach(({ wingPivot, side }) => {
      wingPivot.position.set(side * 0.13, torsoTopY - 0.02, -0.11);
      const blade = new THREE.Mesh(
        wingBladeGeo,
        arch === 'royal_griffin' ? trimMat : secondaryMat,
      );
      blade.position.set(side * 0.15, 0.04, -0.02);
      blade.rotation.y = side * 0.35;
      blade.castShadow = true;

      const featherTip = new THREE.Mesh(wingTipGeo, trimMat);
      featherTip.position.set(side * 0.29, 0.08, -0.05);
      featherTip.rotation.z = -side * 1.1;

      wingPivot.add(blade, featherTip);
      wingsGroup.add(wingPivot);
    });
    bodyPivot.add(wingsGroup);
  }

  // Tail pivot anchor
  tailGroup.position.set(0, legHeight + 0.07, -0.13);

  // Rich archetype-specific creature silhouettes
  if (arch === 'dragon') {
    const snoutGeo = new THREE.BoxGeometry(0.125, 0.095, 0.16);
    const hornGeo = new THREE.ConeGeometry(0.038, 0.19, 8);
    const spineGeo = new THREE.ConeGeometry(0.03, 0.085, 5);
    const tailSegGeo = new THREE.ConeGeometry(0.072, 0.36, 8);
    disposables.push(snoutGeo, hornGeo, spineGeo, tailSegGeo);

    const snout = new THREE.Mesh(snoutGeo, primaryMat);
    snout.position.set(0, -0.02, 0.17);
    headGroup.add(snout);
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(hornGeo, trimMat);
      horn.position.set(side * 0.085, 0.165, -0.03);
      horn.rotation.x = -0.38;
      horn.rotation.z = -side * 0.28;
      headGroup.add(horn);
    }
    for (let s = 0; s < 3; s++) {
      const spike = new THREE.Mesh(spineGeo, trimMat);
      spike.position.set(0, torsoTopY - 0.03 - s * 0.085, -0.15);
      spike.rotation.x = -1.2;
      bodyPivot.add(spike);
    }
    const tail = new THREE.Mesh(tailSegGeo, primaryMat);
    tail.rotation.x = -Math.PI / 2.5;
    tail.position.set(0, 0.04, -0.15);
    tailGroup.add(tail);
  } else if (arch === 'fox' || arch === 'wolf') {
    const earGeo = new THREE.ConeGeometry(0.062, 0.17, 4);
    const innerEarGeo = new THREE.ConeGeometry(0.035, 0.11, 4);
    const muzzleGeo = new THREE.ConeGeometry(0.075, 0.18, 10);
    const noseGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const tailGeo = new THREE.CapsuleGeometry(0.072, 0.24, 6, 10);
    disposables.push(earGeo, innerEarGeo, muzzleGeo, noseGeo, tailGeo);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, primaryMat);
      ear.position.set(side * 0.095, 0.175, 0);
      ear.rotation.z = -side * 0.2;
      const inner = new THREE.Mesh(innerEarGeo, secondaryMat);
      inner.position.set(side * 0.095, 0.165, 0.022);
      inner.rotation.z = -side * 0.2;
      headGroup.add(ear, inner);
    }
    const muzzle = new THREE.Mesh(muzzleGeo, secondaryMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, -0.03, 0.175);
    const nose = new THREE.Mesh(noseGeo, clawMat);
    nose.position.set(0, -0.015, 0.26);
    headGroup.add(muzzle, nose);

    const tail = new THREE.Mesh(tailGeo, secondaryMat);
    tail.rotation.x = -0.75;
    tail.position.set(0, 0.07, -0.14);
    tailGroup.add(tail);
    if (arch === 'wolf') {
      const ruffGeo = new THREE.TorusGeometry(0.155, 0.055, 8, 16);
      disposables.push(ruffGeo);
      const ruff = new THREE.Mesh(ruffGeo, secondaryMat);
      ruff.rotation.x = Math.PI / 2;
      ruff.position.set(0, torsoTopY - 0.02, 0.02);
      bodyPivot.add(ruff);
    }
  } else if (arch === 'phoenix') {
    const beakGeo = new THREE.ConeGeometry(0.052, 0.16, 6);
    const crestGeo = new THREE.ConeGeometry(0.042, 0.22, 6);
    const tailPlumeGeo = new THREE.ConeGeometry(0.045, 0.34, 6);
    disposables.push(beakGeo, crestGeo, tailPlumeGeo);

    const beak = new THREE.Mesh(beakGeo, trimMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.015, 0.2);
    headGroup.add(beak);

    for (let i = -1; i <= 1; i++) {
      const plume = new THREE.Mesh(crestGeo, trimMat);
      plume.position.set(i * 0.048, 0.185, -0.02);
      plume.rotation.x = -0.34;
      headGroup.add(plume);

      const tailPlume = new THREE.Mesh(tailPlumeGeo, i === 0 ? trimMat : secondaryMat);
      tailPlume.position.set(i * 0.055, 0.03, -0.16);
      tailPlume.rotation.x = -1.25;
      tailGroup.add(tailPlume);
    }
  } else if (arch === 'penguin') {
    const beakGeo = new THREE.ConeGeometry(0.055, 0.13, 8);
    const tuftGeo = new THREE.ConeGeometry(0.028, 0.12, 6);
    const tailGeo = new THREE.ConeGeometry(0.05, 0.14, 8);
    disposables.push(beakGeo, tuftGeo, tailGeo);

    const beak = new THREE.Mesh(beakGeo, trimMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.02, 0.19);
    headGroup.add(beak);
    for (const side of [-1, 1]) {
      const tuft = new THREE.Mesh(tuftGeo, trimMat);
      tuft.position.set(side * 0.115, 0.125, 0.035);
      tuft.rotation.z = -side * 0.6;
      headGroup.add(tuft);
    }
    const tail = new THREE.Mesh(tailGeo, primaryMat);
    tail.rotation.x = -1.1;
    tail.position.set(0, 0.02, -0.08);
    tailGroup.add(tail);
  } else if (arch === 'ice_sprite') {
    const crystalGeo = new THREE.OctahedronGeometry(0.075, 0);
    const antlerGeo = new THREE.CylinderGeometry(0.016, 0.026, 0.24, 6);
    const crystalMat = makeMat('#BAE6FD', 0.12, 0.3, '#38BDF8', 0.55);
    disposables.push(crystalGeo, antlerGeo, crystalMat);

    for (const side of [-1, 1]) {
      const antler = new THREE.Mesh(antlerGeo, crystalMat);
      antler.position.set(side * 0.095, 0.2, 0);
      antler.rotation.z = -side * 0.36;
      const tip = new THREE.Mesh(crystalGeo, crystalMat);
      tip.scale.setScalar(0.65);
      tip.position.set(side * 0.145, 0.31, 0);
      headGroup.add(antler, tip);
    }
    const core = new THREE.Mesh(crystalGeo, crystalMat);
    core.scale.setScalar(0.8);
    core.position.set(0, torsoBaseY + 0.02, 0.14);
    bodyPivot.add(core);
  } else if (arch === 'panda') {
    const earGeo = new THREE.SphereGeometry(0.064, 10, 10);
    const patchGeo = new THREE.SphereGeometry(0.056, 8, 8);
    const muzzleGeo = new THREE.SphereGeometry(0.072, 10, 8);
    const darkMat = makeMat('#1E293B', 0.8, 0.05);
    disposables.push(earGeo, patchGeo, muzzleGeo, darkMat);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, darkMat);
      ear.position.set(side * 0.125, 0.145, 0);
      const patch = new THREE.Mesh(patchGeo, darkMat);
      patch.scale.set(1.05, 1.2, 0.45);
      patch.position.set(side * 0.068, 0.032, 0.125);
      headGroup.add(ear, patch);
    }
    const muzzle = new THREE.Mesh(muzzleGeo, secondaryMat);
    muzzle.position.set(0, -0.045, 0.13);
    headGroup.add(muzzle);
  } else if (arch === 'turtle') {
    const shellGeo = new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const rimGeo = new THREE.TorusGeometry(0.225, 0.032, 8, 20);
    disposables.push(shellGeo, rimGeo);

    const shell = new THREE.Mesh(shellGeo, secondaryMat);
    shell.rotation.x = -Math.PI / 2;
    shell.position.set(0, torsoBaseY, -0.06);
    shell.castShadow = true;

    const rim = new THREE.Mesh(rimGeo, trimMat);
    rim.position.set(0, torsoBaseY, -0.06);
    bodyPivot.add(shell, rim);
  } else if (arch === 'forest_guardian') {
    const branchGeo = new THREE.CylinderGeometry(0.018, 0.032, 0.26, 6);
    const leafGeo = new THREE.DodecahedronGeometry(0.075, 0);
    const woodMat = makeMat('#78350F', 0.85, 0.05);
    const leafMat = makeMat('#4ADE80', 0.65, 0.05);
    disposables.push(branchGeo, leafGeo, woodMat, leafMat);

    for (const side of [-1, 1]) {
      const branch = new THREE.Mesh(branchGeo, woodMat);
      branch.position.set(side * 0.095, 0.2, 0);
      branch.rotation.z = -side * 0.36;
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(side * 0.15, 0.3, 0);
      headGroup.add(branch, leaf);
    }
  } else if (arch === 'lion' || arch === 'tiger') {
    const earGeo = new THREE.SphereGeometry(0.052, 8, 8);
    const muzzleGeo = new THREE.SphereGeometry(0.08, 10, 8);
    const tailGeo = new THREE.CapsuleGeometry(0.03, 0.26, 6, 8);
    disposables.push(earGeo, muzzleGeo, tailGeo);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, primaryMat);
      ear.position.set(side * 0.115, 0.145, 0);
      headGroup.add(ear);
    }
    const muzzle = new THREE.Mesh(muzzleGeo, secondaryMat);
    muzzle.position.set(0, -0.04, 0.14);
    headGroup.add(muzzle);

    if (arch === 'lion') {
      const maneGeo = new THREE.TorusGeometry(0.175, 0.068, 8, 18);
      disposables.push(maneGeo);
      const mane = new THREE.Mesh(maneGeo, secondaryMat);
      mane.position.set(0, 0.01, -0.02);
      mane.castShadow = true;
      headGroup.add(mane);
    } else {
      const stripeGeo = new THREE.TorusGeometry(0.16, 0.02, 6, 16);
      disposables.push(stripeGeo);
      const stripe1 = new THREE.Mesh(stripeGeo, secondaryMat);
      stripe1.rotation.x = Math.PI / 2;
      stripe1.position.set(0, torsoBaseY + 0.04, 0);
      const stripe2 = new THREE.Mesh(stripeGeo, secondaryMat);
      stripe2.rotation.x = Math.PI / 2;
      stripe2.position.set(0, torsoBaseY - 0.06, 0);
      bodyPivot.add(stripe1, stripe2);
    }
    const tail = new THREE.Mesh(tailGeo, primaryMat);
    tail.rotation.x = -0.9;
    tail.position.set(0, 0.05, -0.12);
    tailGroup.add(tail);
  } else if (arch === 'royal_griffin') {
    const beakGeo = new THREE.ConeGeometry(0.054, 0.16, 6);
    const earGeo = new THREE.ConeGeometry(0.036, 0.15, 4);
    const tailGeo = new THREE.CapsuleGeometry(0.032, 0.25, 6, 8);
    disposables.push(beakGeo, earGeo, tailGeo);

    const beak = new THREE.Mesh(beakGeo, trimMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.015, 0.195);
    headGroup.add(beak);
    for (const side of [-1, 1]) {
      const tuft = new THREE.Mesh(earGeo, primaryMat);
      tuft.position.set(side * 0.095, 0.155, -0.02);
      tuft.rotation.z = -side * 0.25;
      headGroup.add(tuft);
    }
    const tail = new THREE.Mesh(tailGeo, secondaryMat);
    tail.rotation.x = -0.95;
    tail.position.set(0, 0.05, -0.12);
    tailGroup.add(tail);
  }

  addOutfitAccessory(
    bodyPivot,
    headGroup,
    torsoTopY,
    0.18,
    outfitId,
    character,
    disposables,
  );
  bodyPivot.add(headGroup, tailGroup);
  root.add(bodyPivot);

  return {
    root,
    bodyPivot,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    tailGroup,
    wingsGroup,
    leftWing,
    rightWing,
    eyelids,
    selectionRing,
    disposables,
    animationMode: 'procedural-multipart',
  };
}

export async function tryAttachOptionalGlb(
  rig: CharacterRig,
  glbUrl?: string,
): Promise<boolean> {
  if (!glbUrl) return false;
  try {
    const gltf = await gltfLoader.loadAsync(glbUrl);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(0.95 / maxDim);
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    rig.bodyPivot.clear();
    rig.bodyPivot.add(model);
    rig.animationMode = 'gltf-model';
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const actions: Record<string, THREE.AnimationAction> = {};
      for (const clip of gltf.animations) {
        actions[clip.name.toLowerCase()] = mixer.clipAction(clip);
      }
      const firstAction = mixer.clipAction(gltf.animations[0]);
      firstAction.play();
      rig.mixer = mixer;
      rig.gltfActions = actions;
      rig.activeGltfAction = firstAction;
    }
    return true;
  } catch {
    return false;
  }
}

export function updateCharacterRigAnimation(
  rig: CharacterRig,
  animState: CharacterAnimState,
  elapsed: number,
  delta: number,
  phaseOffset = 0,
  lookBiasYaw = 0,
): void {
  if (rig.mixer) {
    if (rig.gltfActions) {
      const candidate =
        rig.gltfActions[animState] ??
        rig.gltfActions[animState === 'celebrate_six' ? 'celebrate' : 'idle'];
      if (candidate && candidate !== rig.activeGltfAction) {
        rig.activeGltfAction?.fadeOut(0.2);
        candidate.reset().fadeIn(0.2).play();
        rig.activeGltfAction = candidate;
      }
    }
    rig.mixer.update(delta);
    return;
  }

  const pose = computeAnimPoseTargets(animState, elapsed, phaseOffset, lookBiasYaw);
  applyPoseToRig(rig, pose, delta);
}

export function disposeCharacterRig(rig: CharacterRig): void {
  for (const d of rig.disposables) {
    d.dispose();
  }
}
