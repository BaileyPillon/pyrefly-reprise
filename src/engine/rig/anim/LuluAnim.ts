/**
 * Lulu's authored animation data for the prototype (`?anim=proto`; FFX only: Lulu is an FFX figure; erasable TS, no `three`): the bone deltas that sit on the procedural clips
 * (`AnimLibrary.ts`), her breath and weight shift, and her secondary motion. Bones are the rig's (`D:/pyrefly-art-rigs/lulu-v2`, 21 bones): `upperarm`, `forearm`, `hand` are the NEAR arm (the one
 * that holds the doll up in `ready` and the vial in `item`), `...F` the far arm; the braid is `braid0` to `braid3`; `doll` is the moogle doll (a bone of its own, moved by hundreds of px between keys).
 *
 * Angles are RADIANS in the deltas (clockwise on screen: a lean forward for a figure facing right is positive, a nod is positive), offsets are painting px of the 970 x 2330 master.
 * Every number is by eye against the rig's own renders (`D:/Tools/pyrefly-scratch/2026-10-18/anim-proto/authoring/`), not a measurement.
 */
import type { Accents, Subject } from './AnimLibrary.ts';
import type { IdleSpec } from './AnimIdle.ts';
import type { AnimStyle } from './AnimStyles.ts';
import type { SecondarySpec } from './AnimSecondary.ts';

export const LULU_ACCENTS: Accents = {
  groups: { armN: ['upperarm', 'forearm', 'hand'], armF: ['upperarmF', 'forearmF', 'handF'] },
  // the wind-up: weight back and down, the chest opens, the head tips back
  windup: { pelvis: { rot: -0.09, dy: 12 }, spine: { rot: 0.07 }, chest: { rot: 0.1 }, head: { rot: 0.08 }, root: { dx: -14 }, skirtL: { rot: -0.04 }, hand: { rot: -0.15 } },
  // the blow: the whole body leans into it
  strike: { pelvis: { rot: 0.05 }, chest: { rot: -0.07 }, head: { rot: -0.05 }, root: { dx: 12 }, hand: { rot: 0.2 } },
  follow: { chest: { rot: 0.05 }, head: { rot: 0.04 } },
  // a spell: she draws the doll in and looks down at it, rises and looks up as it gathers, throws her weight forward on the release
  gather: { upperarm: { rot: 0.45 }, forearm: { rot: 0.3 }, pelvis: { dy: 26 }, spine: { rot: 0.14 }, chest: { rot: 0.08 }, head: { rot: -0.22 } },
  channel: { pelvis: { dy: -8 }, chest: { rot: -0.06 }, head: { rot: 0.12 }, root: { dx: 6 } },
  release: { upperarm: { rot: -0.55 }, forearm: { rot: 1.4 }, hand: { rot: 0.4 }, pelvis: { rot: 0.09 }, chest: { rot: -0.16 }, head: { rot: -0.1 }, root: { dx: 26 } },
  // an item: the near arm goes back to the pouch at her hip and she glances down, the vial comes up to her shoulder, she throws with the whole arm
  reach: { upperarm: { rot: 0.3 }, forearm: { rot: -0.25 }, pelvis: { rot: 0.06, dy: 10 }, head: { rot: 0.14 } },
  draw: { chest: { rot: -0.04 }, head: { rot: -0.06 }, hand: { rot: 0.15 } },
  swing: { upperarm: { rot: 0.1 }, pelvis: { rot: 0.1 }, chest: { rot: -0.14 }, spine: { rot: -0.05 }, root: { dx: 16 }, head: { rot: -0.05 } },
  snap: { pelvis: { rot: 0.12 }, chest: { rot: -0.18 }, root: { dx: 22 }, hand: { rot: 0.3 } },
  // a hit: the head snaps back, the chest caves
  recoil: { head: { rot: 0.2 }, chest: { rot: 0.1 }, pelvis: { dy: 8 } },
  // a KO: the knees go (she sinks), the spine folds
  buckle: { pelvis: { dy: 90, rot: 0.05 }, spine: { rot: 0.18 }, head: { rot: 0.22 }, skirtL: { rot: 0.06 } },
  // a victory: she sinks a little, then the arm and head sweep up
  dip: { pelvis: { dy: 18 }, spine: { rot: 0.05 }, head: { rot: 0.1 } },
  burst: { chest: { rot: -0.1 }, head: { rot: -0.12 }, pelvis: { dy: -10 }, upperarm: { rot: 0.1 } },
};

export const LULU_IDLE: IdleSpec = {
  breath: {
    pelvis: { dy: -1.4, phase: 0.2 },
    spine: { rot: 0.5 },
    chest: { rot: 1.1, sy: 0.006, phase: -0.4 },
    head: { rot: 0.7, phase: -1.4 },
    upperarm: { rot: 0.7, phase: -1.0 },
    forearm: { rot: 0.6, phase: -1.7 },
    hand: { rot: 0.9, phase: -2.3 },
    upperarmF: { rot: 0.5, phase: -1.0 },
    forearmF: { rot: 0.4, phase: -1.7 },
    handF: { rot: 0.7, phase: -2.3 },
    skirtL: { rot: 0.15, phase: -0.8 },
    skirtR: { rot: -0.15, phase: -0.8 },
  },
  shift: {
    root: { dx: 3 },
    pelvis: { dx: 7, rot: 0.4 },
    spine: { rot: -0.45, phase: -0.3 },
    chest: { rot: -0.35, phase: -0.6 },
    head: { rot: 0.5, phase: -1.1 },
    skirtL: { rot: 0.7, phase: 0.2 },
    skirtR: { rot: -0.5, phase: 0.2 },
    train: { rot: 0.8, phase: -0.4 },
    doll: { dx: -4, dy: 9, phase: 0.8 },
  },
};

/** The springs and the braid for a style: the arms whip, the head follows a beat late, the skirt swings, the doll bobs behind her, the braid streams back in a lunge. */
export function luluSecondary(style: AnimStyle): SecondarySpec {
  const b = style.braid;
  return {
    rots: [
      { bone: 'forearm', f: 3.2, z: 0.5, gain: 0.9, limit: 24 },
      { bone: 'hand', f: 4.0, z: 0.45, gain: 1.0, limit: 32 },
      { bone: 'forearmF', f: 3.2, z: 0.5, gain: 0.8, limit: 22 },
      { bone: 'handF', f: 4.0, z: 0.45, gain: 0.9, limit: 28 },
      { bone: 'head', f: 2.8, z: 0.6, gain: 0.6, limit: 10 },
      { bone: 'chest', f: 2.2, z: 0.7, gain: 0.35, limit: 6 },
      { bone: 'skirtL', f: 1.9, z: 0.45, gain: 0.85, limit: 9, drag: 1.2 },
      { bone: 'skirtR', f: 2.1, z: 0.45, gain: 0.85, limit: 9, drag: 1.0 },
      { bone: 'train', f: 1.6, z: 0.4, gain: 1.0, limit: 12, drag: 1.8 },
    ],
    points: [{ bone: 'doll', f: 2.4, z: 0.4, gain: 1.0, limit: 160, drag: 60 }],
    chains: [{ bones: ['braid0', 'braid1', 'braid2', 'braid3'], hang: 0.3, stiffness: b.stiffness, drag: b.drag, trail: b.trail, limit: b.limit }],
  };
}

export const LULU: Subject = { accents: LULU_ACCENTS, idle: LULU_IDLE, secondary: luluSecondary, hand: 'fist', attach: { bone: 'doll', landmark: 'fist' } };
