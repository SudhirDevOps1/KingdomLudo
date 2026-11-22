import * as THREE from 'three';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'land'
  | 'turn'
  | 'anticipate'
  | 'celebrate_six'
  | 'celebrate'
  | 'capture'
  | 'safe_zone'
  | 'home_entry'
  | 'victory'
  | 'defeat'
  | 'defeat_sad';

export interface AnimPoseTargets {
  bodyY: number;
  bodyScaleY: number;
  bodyScaleXZ: number;
  bodyRotX: number;
  bodyRotY: number;
  bodyRotZ: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  leftArmRotX: number;
  leftArmRotZ: number;
  rightArmRotX: number;
  rightArmRotZ: number;
  leftLegRotX: number;
  rightLegRotX: number;
  tailRotY: number;
  tailRotX: number;
  leftWingRotZ: number;
  rightWingRotZ: number;
  wingRotY: number;
  eyelidScaleY: number;
}

export function computeAnimPoseTargets(
  state: CharacterAnimState,
  elapsed: number,
  phaseOffset = 0,
  lookBiasYaw = 0,
): AnimPoseTargets {
  const t = elapsed + phaseOffset;

  // Natural periodic eye blink (~every 3.4s)
  const blinkCycle = (t * 0.31) % 1;
  const eyelidScaleY =
    state === 'defeat' || state === 'defeat_sad'
      ? 0.72 + Math.sin(t * 8) * 0.1
      : blinkCycle > 0.94 && blinkCycle < 0.985
        ? Math.sin(((blinkCycle - 0.94) / 0.045) * Math.PI)
        : 0.04;

  // Organic idle breathing cycle & animal micro-movements
  const breathFreq = 2.4;
  const breathBob = Math.sin(t * breathFreq) * 0.016;
  const breathScaleY = 1 + Math.sin(t * breathFreq) * 0.032;
  const breathScaleXZ = 1 - Math.sin(t * breathFreq) * 0.016;
  const naturalHeadYaw = Math.sin(t * 0.9) * 0.2 + Math.cos(t * 0.45) * 0.08 + lookBiasYaw;
  const naturalHeadPitch = Math.sin(t * breathFreq) * 0.045 + 0.02;
  const naturalTailSwish = Math.sin(t * 2.8) * 0.3 + Math.sin(t * 5.6) * 0.08;

  const base: AnimPoseTargets = {
    bodyY: breathBob,
    bodyScaleY: breathScaleY,
    bodyScaleXZ: breathScaleXZ,
    bodyRotX: 0,
    bodyRotY: 0,
    bodyRotZ: Math.sin(t * 0.8) * 0.02,
    headRotX: naturalHeadPitch,
    headRotY: naturalHeadYaw,
    headRotZ: Math.sin(t * 0.6) * 0.035,
    leftArmRotX: Math.sin(t * breathFreq) * 0.06,
    leftArmRotZ: 0.22 + Math.sin(t * breathFreq) * 0.03,
    rightArmRotX: -Math.sin(t * breathFreq) * 0.06,
    rightArmRotZ: -0.22 - Math.sin(t * breathFreq) * 0.03,
    leftLegRotX: 0,
    rightLegRotX: 0,
    tailRotY: naturalTailSwish,
    tailRotX: 0.05 + Math.sin(t * 1.8) * 0.06,
    leftWingRotZ: 0.2 + Math.sin(t * breathFreq) * 0.08,
    rightWingRotZ: -0.2 - Math.sin(t * breathFreq) * 0.08,
    wingRotY: 0.2,
    eyelidScaleY,
  };

  switch (state) {
    case 'idle':
      return base;

    case 'walk':
    case 'run': {
      const freq = state === 'run' ? 14 : 8.5;
      const stride = state === 'run' ? 0.78 : 0.48;
      const bounce = state === 'run' ? 0.07 : 0.038;
      return {
        ...base,
        bodyY: Math.abs(Math.sin(t * freq)) * bounce,
        bodyScaleY: 1,
        bodyScaleXZ: 1,
        bodyRotX: state === 'run' ? 0.16 : 0.08,
        bodyRotZ: Math.sin(t * freq) * 0.06,
        headRotX: -0.06,
        headRotY: Math.sin(t * freq * 0.5) * 0.08 + lookBiasYaw * 0.3,
        leftArmRotX: Math.sin(t * freq) * stride,
        rightArmRotX: -Math.sin(t * freq) * stride,
        leftLegRotX: -Math.sin(t * freq) * stride,
        rightLegRotX: Math.sin(t * freq) * stride,
        tailRotY: Math.sin(t * freq) * 0.3,
        leftWingRotZ: 0.35 + Math.sin(t * freq) * 0.18,
        rightWingRotZ: -0.35 - Math.sin(t * freq) * 0.18,
      };
    }

    case 'jump':
      return {
        ...base,
        bodyY: 0.04 + Math.abs(Math.sin(t * 6)) * 0.08,
        bodyScaleY: 1.08,
        bodyScaleXZ: 0.94,
        bodyRotX: -0.08,
        headRotX: -0.1,
        leftArmRotX: -0.6,
        leftArmRotZ: 0.85,
        rightArmRotX: -0.6,
        rightArmRotZ: -0.85,
        leftLegRotX: 0.42,
        rightLegRotX: -0.35,
        leftWingRotZ: 0.65 + Math.sin(t * 16) * 0.35,
        rightWingRotZ: -0.65 - Math.sin(t * 16) * 0.35,
      };

    case 'land':
      return {
        ...base,
        bodyY: -0.03,
        bodyScaleY: 0.84,
        bodyScaleXZ: 1.12,
        bodyRotX: 0.14,
        leftArmRotZ: 0.52,
        rightArmRotZ: -0.52,
        leftLegRotX: -0.25,
        rightLegRotX: 0.25,
      };

    case 'turn':
      return {
        ...base,
        bodyRotZ: 0.1,
        headRotY: Math.sin(t * 7) * 0.35,
        leftArmRotX: 0.35,
        rightArmRotX: -0.35,
      };

    case 'anticipate':
      return {
        ...base,
        bodyY: -0.02 + Math.sin(t * 5.2) * 0.015,
        bodyScaleY: 0.94,
        bodyScaleXZ: 1.05,
        bodyRotX: 0.1,
        headRotX: -0.16,
        headRotY: lookBiasYaw * 0.8,
        leftArmRotX: -0.45,
        leftArmRotZ: 0.4,
        rightArmRotX: -0.45,
        rightArmRotZ: -0.4,
        tailRotY: Math.sin(t * 8) * 0.35,
      };

    case 'celebrate_six':
    case 'celebrate':
    case 'home_entry':
    case 'victory': {
      const jumpAmp = state === 'victory' ? 0.22 : state === 'home_entry' ? 0.18 : 0.14;
      const speed = state === 'victory' ? 7.2 : 6.2;
      return {
        ...base,
        bodyY: Math.abs(Math.sin(t * speed)) * jumpAmp,
        bodyScaleY: 1 + Math.sin(t * speed * 2) * 0.06,
        bodyRotY: Math.sin(t * speed * 0.5) * (state === 'victory' ? 0.55 : 0.32),
        headRotX: -0.14,
        headRotY: Math.sin(t * 3.5) * 0.15,
        leftArmRotX: -0.9,
        leftArmRotZ: 1.1 + Math.sin(t * 10) * 0.25,
        rightArmRotX: -0.9,
        rightArmRotZ: -1.1 - Math.sin(t * 10) * 0.25,
        leftLegRotX: Math.sin(t * speed) * 0.35,
        rightLegRotX: -Math.sin(t * speed) * 0.35,
        tailRotY: Math.sin(t * 10) * 0.45,
        leftWingRotZ: 0.75 + Math.sin(t * 11) * 0.35,
        rightWingRotZ: -0.75 - Math.sin(t * 11) * 0.35,
      };
    }

    case 'safe_zone':
      return {
        ...base,
        bodyY: 0.02 + Math.sin(t * 3.8) * 0.025,
        headRotY: Math.sin(t * 2.4) * 0.25,
        leftArmRotZ: 0.55,
        rightArmRotZ: -0.55,
        leftWingRotZ: 0.45,
        rightWingRotZ: -0.45,
      };

    case 'capture':
      return {
        ...base,
        bodyY: Math.abs(Math.sin(t * 11)) * 0.1,
        bodyRotX: Math.sin(t * 14) * 0.24,
        bodyRotY: Math.sin(t * 9) * 0.4,
        headRotX: 0.22,
        leftArmRotX: -1.1,
        leftArmRotZ: 0.75,
        rightArmRotX: -1.1,
        rightArmRotZ: -0.75,
        leftLegRotX: Math.sin(t * 14) * 0.65,
        rightLegRotX: -Math.sin(t * 14) * 0.65,
      };

    case 'defeat':
    case 'defeat_sad': {
      // Emotional sobbing and trembling reaction with drooped posture
      const sobSpeed = 10;
      const sobHiccup = Math.sin(t * sobSpeed) > 0.65 ? 0.035 : 0;
      return {
        ...base,
        bodyY: -0.03 + sobHiccup,
        bodyScaleY: 0.91 + sobHiccup * 0.8,
        bodyScaleXZ: 1.04,
        bodyRotX: 0.26,
        bodyRotZ: Math.sin(t * 3.5) * 0.04,
        headRotX: 0.42 + Math.sin(t * sobSpeed) * 0.05,
        headRotY: Math.sin(t * 1.8) * 0.16,
        headRotZ: Math.sin(t * 2.2) * 0.08,
        leftArmRotX: -0.45,
        leftArmRotZ: 0.15,
        rightArmRotX: -0.45,
        rightArmRotZ: -0.15,
        tailRotX: -0.42,
        tailRotY: Math.sin(t * 2.5) * 0.1,
        leftWingRotZ: -0.15,
        rightWingRotZ: 0.15,
      };
    }
  }
}

export interface AnimatableRigParts {
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  tailGroup: THREE.Group;
  leftWing: THREE.Group;
  rightWing: THREE.Group;
  eyelids: THREE.Mesh[];
}

export function applyPoseToRig(
  rig: AnimatableRigParts,
  pose: AnimPoseTargets,
  delta: number,
  blendSpeed = 14,
): void {
  const dt = Math.max(0.001, Math.min(0.1, delta));
  const d = THREE.MathUtils.damp;

  rig.bodyPivot.position.y = d(rig.bodyPivot.position.y, pose.bodyY, blendSpeed, dt);
  rig.bodyPivot.scale.y = d(rig.bodyPivot.scale.y, pose.bodyScaleY, blendSpeed, dt);
  const xz = d(rig.bodyPivot.scale.x, pose.bodyScaleXZ, blendSpeed, dt);
  rig.bodyPivot.scale.x = xz;
  rig.bodyPivot.scale.z = xz;
  rig.bodyPivot.rotation.x = d(rig.bodyPivot.rotation.x, pose.bodyRotX, blendSpeed, dt);
  rig.bodyPivot.rotation.y = d(rig.bodyPivot.rotation.y, pose.bodyRotY, blendSpeed, dt);
  rig.bodyPivot.rotation.z = d(rig.bodyPivot.rotation.z, pose.bodyRotZ, blendSpeed, dt);

  rig.headGroup.rotation.x = d(rig.headGroup.rotation.x, pose.headRotX, blendSpeed, dt);
  rig.headGroup.rotation.y = d(rig.headGroup.rotation.y, pose.headRotY, blendSpeed, dt);
  rig.headGroup.rotation.z = d(rig.headGroup.rotation.z, pose.headRotZ, blendSpeed, dt);

  rig.leftArm.rotation.x = d(rig.leftArm.rotation.x, pose.leftArmRotX, blendSpeed, dt);
  rig.leftArm.rotation.z = d(rig.leftArm.rotation.z, pose.leftArmRotZ, blendSpeed, dt);
  rig.rightArm.rotation.x = d(rig.rightArm.rotation.x, pose.rightArmRotX, blendSpeed, dt);
  rig.rightArm.rotation.z = d(rig.rightArm.rotation.z, pose.rightArmRotZ, blendSpeed, dt);

  rig.leftLeg.rotation.x = d(rig.leftLeg.rotation.x, pose.leftLegRotX, blendSpeed, dt);
  rig.rightLeg.rotation.x = d(rig.rightLeg.rotation.x, pose.rightLegRotX, blendSpeed, dt);

  rig.tailGroup.rotation.y = d(rig.tailGroup.rotation.y, pose.tailRotY, blendSpeed, dt);
  rig.tailGroup.rotation.x = d(rig.tailGroup.rotation.x, pose.tailRotX, blendSpeed, dt);

  rig.leftWing.rotation.z = d(rig.leftWing.rotation.z, pose.leftWingRotZ, blendSpeed, dt);
  rig.rightWing.rotation.z = d(rig.rightWing.rotation.z, pose.rightWingRotZ, blendSpeed, dt);

  for (const lid of rig.eyelids) {
    lid.scale.y = pose.eyelidScaleY;
  }
}
