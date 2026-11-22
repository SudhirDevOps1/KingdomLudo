import { describe, expect, it } from 'vitest';
import { soundEngine } from '../src/audio/soundEngine';
import { CHARACTERS } from '../src/data/characters';
import { useGameStore } from '../src/store/gameStore';
import {
  computeAnimPoseTargets,
  type CharacterAnimState,
} from '../src/three/characterAnimController';
import {
  buildProceduralCharacter,
  disposeCharacterRig,
  updateCharacterRigAnimation,
} from '../src/three/characterBuilder';

const ALL_STATES: CharacterAnimState[] = [
  'idle',
  'walk',
  'run',
  'jump',
  'land',
  'turn',
  'anticipate',
  'celebrate_six',
  'celebrate',
  'capture',
  'safe_zone',
  'home_entry',
  'victory',
  'defeat',
  'defeat_sad',
];

describe('Articulated 3D Characters, Animation State Machine & 4-Channel Audio', () => {
  it('builds grounded non-pawn articulated rigs for all 12 kingdom characters', () => {
    expect(CHARACTERS.length).toBe(12);
    for (const hero of CHARACTERS) {
      const rig = buildProceduralCharacter(hero.id, hero.outfits[0].id, hero.skins[0].id);
      expect(rig.leftLeg.children.length).toBeGreaterThan(0);
      expect(rig.rightLeg.children.length).toBeGreaterThan(0);
      expect(rig.eyelids.length).toBe(2);
      expect(rig.animationMode).toBe('procedural-multipart');

      // Exercise smooth animation update without NaN or throwing
      updateCharacterRigAnimation(rig, 'idle', 1.2, 0.016, 0.3, 0.15);
      updateCharacterRigAnimation(rig, 'run', 2.4, 0.016, 0.3, 0);
      updateCharacterRigAnimation(rig, 'victory', 3.1, 0.016, 0.3, 0);
      expect(Number.isFinite(rig.bodyPivot.position.y)).toBe(true);
      disposeCharacterRig(rig);
    }
  });

  it('produces valid pose targets for every animation state including blink, land & defeat', () => {
    for (const state of ALL_STATES) {
      const pose = computeAnimPoseTargets(state, 1.5, 0.2, 0.25);
      expect(Number.isFinite(pose.bodyY)).toBe(true);
      expect(Number.isFinite(pose.leftLegRotX)).toBe(true);
      expect(Number.isFinite(pose.eyelidScaleY)).toBe(true);
    }

    const landPose = computeAnimPoseTargets('land', 0.5);
    expect(landPose.bodyScaleY).toBeLessThan(1);
    expect(landPose.bodyScaleXZ).toBeGreaterThan(1);

    const blinkMoment = computeAnimPoseTargets('idle', 0.96 / 0.31);
    expect(blinkMoment.eyelidScaleY).toBeGreaterThan(0.2);

    const defeatPose = computeAnimPoseTargets('defeat', 1.0);
    expect(defeatPose.headRotX).toBeGreaterThan(0.2);

    const defeatSadPose = computeAnimPoseTargets('defeat_sad', 1.0);
    expect(defeatSadPose.headRotX).toBeGreaterThan(0.3);
    expect(defeatSadPose.eyelidScaleY).toBeGreaterThan(0.5);
  });

  it('supports 4-channel SoundEngine config and exposes upgraded GameStore settings', () => {
    expect(() =>
      soundEngine.configure({
        enabled: true,
        masterMuted: false,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        ambientVolume: 0.6,
      }),
    ).not.toThrow();

    const s = useGameStore.getState().settings;
    expect(s.masterMuted).toBe(false);
    expect(s.ambientVolume).toBeGreaterThan(0);
    expect(s.cinematicCamera).toBe(true);
    expect(s.cameraSensitivity).toBeGreaterThan(0);
  });
});
