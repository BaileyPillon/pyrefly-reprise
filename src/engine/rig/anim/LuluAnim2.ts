/**
 * Lulu's authored poses for pass 2 of the animation prototype (`?anim=proto&style=P2`; FFX only: Lulu is an FFX figure; erasable TS, no `three`): the cast's hold and release, the item's raise, cock and
 * toss, the sweep over the user, bent knees for a hurt and for a KO. Bones are the rig's (`D:/pyrefly-art-rigs/lulu-v2`, 21 bones, see `LuluAnim.ts`); angles are radians (clockwise on screen: a lean
 * forward is positive), offsets are painting px of the 970 x 2330 master.
 *
 * Every number is by eye against the rig's own renders (`tools/rig/lane/anim-preview.mjs --specfile`), except the KO's `root.dy`: those are CALCULATED (`tools/rig/lane/anim-measure.mjs`: the lowest point
 * of any part of the posed rig is put on the floor, `baselineY` 2284) so the body never floats above the floor nor sinks through it as it folds; `tests/unit/rig/anim-pass2.test.ts` re-measures them.
 * A knee bend has no leg bones to bend (the rig is a long skirt over one mesh): the pelvis sinks while the skirt bunches (a wider, shorter bell) and the spine folds over it.
 */
import type { PoseSpec } from './AnimClip.ts';
import type { P2Poses } from './AnimLibrary2.ts';

/** The knee bend of a skirt-length figure: the skirt bones widen and shorten by `k` (1 = the KO's kneel) and swing out a little. */
const bunch = (k: number): Record<string, { sx: number; sy: number; rot: number }> => ({
  skirtL: { sx: 0.16 * k, sy: -0.08 * k, rot: 0.1 * k },
  skirtR: { sx: 0.16 * k, sy: -0.08 * k, rot: -0.1 * k },
});

/** The folded body of a collapse at depth `d` (painting px of pelvis drop, 380 = kneeling). */
const folded = (d: number): PoseSpec['add'] => {
  const k = d / 380;
  return { pelvis: { dy: d, rot: 0.12 * k }, spine: { rot: 0.5 * k }, chest: { rot: 0.35 * k }, head: { rot: 0.4 * k }, upperarm: { rot: 0.3 * k }, forearm: { rot: 0.5 * k }, ...bunch(k) };
};

export const LULU_P2: P2Poses = {
  // a cast: the doll offered low and looked at (pass 1's gather), the arms rise to the cast key, a held pose that breathes and lifts (the robe and the hair follow through the springs), the draw in,
  // a thrust
  castGather: { base: 'cast', add: { upperarm: { rot: 0.54 }, forearm: { rot: 0.36 }, pelvis: { dy: 31 }, spine: { rot: 0.17 }, chest: { rot: 0.1 }, head: { rot: -0.26 } } },
  castHold: { base: 'cast', add: { pelvis: { dy: -6 } } },
  castHoldB: { base: 'cast', add: { upperarm: { rot: -0.2 }, forearm: { rot: -0.16 }, hand: { rot: 0.14 }, upperarmF: { rot: -0.22 }, forearmF: { rot: -0.1 }, pelvis: { dy: -52 }, spine: { rot: -0.04 }, chest: { rot: -0.09 }, head: { rot: 0.13 }, skirtL: { sx: 0.09, rot: 0.09 }, skirtR: { sx: 0.09, rot: -0.09 }, train: { rot: 0.1 } }, root: { dy: -28 } },
  castPull: { base: 'cast', add: { upperarm: { rot: 0.34 }, forearm: { rot: -0.3 }, hand: { rot: -0.2 }, upperarmF: { rot: 0.25 }, pelvis: { dy: 36, rot: -0.06 }, spine: { rot: 0.13 }, chest: { rot: 0.12 }, head: { rot: 0.12 } }, root: { dx: -24 } },
  castThrust: { base: 'cast', to: 'idle', mix: -0.74, cap: { rot: 0.35, px: 80, scale: 0.12 }, add: { upperarm: { rot: -0.55 }, forearm: { rot: 1.4 }, hand: { rot: 0.4 }, pelvis: { rot: 0.09 }, chest: { rot: -0.16 }, head: { rot: -0.1 } }, root: { dx: 26, sx: 0.05, sy: -0.025 } },
  // an item: the hand lifts (no pouch, no bottle: the game shows none), the held pose breathes, the arm draws back overhand and tosses
  itemReach: { base: 'idle', to: 'item', mix: 0.3, only: ['upperarm', 'forearm', 'hand'], add: { upperarm: { rot: 0.3 }, forearm: { rot: -0.25 }, pelvis: { rot: 0.06, dy: 10 }, head: { rot: 0.14 } } },
  itemRaise: { base: 'item' },
  itemHoldB: { base: 'item', add: { upperarm: { rot: -0.1 }, hand: { rot: 0.2 }, head: { rot: -0.06 }, pelvis: { dy: -10 }, chest: { rot: -0.04 } } },
  itemCock: { base: 'item', add: { upperarm: { rot: -0.6 }, forearm: { rot: 0.5 }, hand: { rot: -0.5 }, chest: { rot: -0.12 }, spine: { rot: -0.05 }, pelvis: { rot: -0.08, dy: 14 }, head: { rot: 0.1 } }, root: { dx: -18 } },
  itemToss: { base: 'item', to: 'attack', mix: 0.78, only: ['upperarm', 'forearm', 'hand'], add: { upperarm: { rot: 0.1 }, pelvis: { rot: 0.1 }, chest: { rot: -0.14 }, spine: { rot: -0.05 }, head: { rot: -0.05 } }, root: { dx: 16, sx: 0.04, sy: -0.02 } },
  itemTossFollow: { base: 'item', to: 'attack', mix: 0.95, only: ['upperarm', 'forearm', 'hand'], add: { pelvis: { rot: 0.12 }, chest: { rot: -0.18 }, hand: { rot: 0.3 } }, root: { dx: 22 } },
  // an item on the user: the hand draws in toward the face, then sweeps down the front of her
  selfIn: { base: 'item', add: { upperarm: { rot: 0.35 }, forearm: { rot: -0.35 }, hand: { rot: 0.5 }, head: { rot: 0.1 }, chest: { rot: 0.06 } } },
  selfDown: { base: 'idle', to: 'item', mix: 0.22, only: ['upperarm', 'forearm', 'hand'], add: { upperarm: { rot: 0.4 }, forearm: { rot: -0.55 }, head: { rot: 0.12 }, pelvis: { dy: 8 } } },
  // a hit: the knees give (the pelvis sinks, the skirt bunches), the head snaps back, the chest caves
  hurtStruck: { base: 'hurt', to: 'idle', mix: -0.5, cap: { rot: 0.4, px: 70, scale: 0.12 }, add: { pelvis: { dy: 70 }, spine: { rot: 0.08 }, head: { rot: 0.1 }, ...bunch(0.25) } },
  hurtBent: { base: 'hurt', add: { pelvis: { dy: 100 }, spine: { rot: 0.14 }, chest: { rot: 0.1 }, ...bunch(0.35) } },
  // a KO: struck (knocked back a step), the knees go, kneeling, then the fall into the KO key with the lowest point of the body kept on the floor (root.dy calculated; see the file's head)
  ko: {
    struck: { base: 'hurt', to: 'idle', mix: -0.15, add: { pelvis: { dy: 60 } }, root: { dx: -60 } },
    knees: { base: 'hurt', add: folded(200), root: { dx: -60 } },
    kneel: { base: 'hurt', add: folded(380), root: { dx: -60 } },
    tipA: { base: 'hurt', add: folded(380), root: { dx: -260, rot: 0.5, dy: -96 } },
    tipB: { base: 'ko', to: 'hurt', mix: 0.35, root: { dx: -420, dy: 40 } },
  },
  victoryB: { base: 'victory', add: { chest: { rot: -0.03 }, head: { rot: -0.05 }, pelvis: { dy: -6 }, upperarm: { rot: 0.06 } } },
};
