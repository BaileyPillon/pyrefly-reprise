/**
 * Lulu's data for pass 3 of the animation prototype (`?anim=proto&style=P3`; FFX only: Lulu is an FFX figure; erasable TS, no `three`): the knee of her skirt and the KO that folds.
 */
import type { BendSpec } from './AnimBend.ts';
import type { P3Poses } from './AnimLibrary3.ts';

/**
 * The knee (`AnimBend.ts`): the skirt and its train are bent below the knee, about a hinge under the pelvis. Bind-pose numbers read off the rig (`D:/pyrefly-art-rigs/lulu-v2`, painting px of the 970 x 2330
 * master): the skirt's waist is at y 1240, the floor at 2284; a leg from the hip to the floor is about 1040 long, so the knee is at 1740 (500 below the waist, 544 above the floor: a pelvis that drops 544 puts
 * the knee on the floor). The skirt at that height spans x 424 to 883: the hinge sits at its middle (650). The bend begins above the knee (y 1560) and is whole 200 px below it.
 */
export const LULU_KNEE: BendSpec = { parts: ['skirt', 'train'], carrier: 'pelvis', y0: 1560, y1: 1760, hx: 650, hy: 1740, whole: 0.5, flat: 0.3, lift: 0 };

/**
 * The KO that folds. Bones are the rig's; angles radians (clockwise on screen: a lean forward for a figure facing right is positive); offsets painting px; `@bend` is the knee's bend (`AnimBend.ts`, radians, 0 none).
 * `pelvis.dy` is the drop of the hips: 544 is the knee on the floor. By eye against the rig's own renders (`tools/rig/lane/anim-preview.mjs --bend`), not measured, but the feet and the floor are measured
 * (`tools/rig/lane/anim-measure.mjs`; `tests/unit/rig/anim-pass3-ko.test.ts` re-measures them).
 */
export const LULU_P3: P3Poses = {
  ko: {
    struck: { base: 'hurt', to: 'idle', mix: -0.15, add: { pelvis: { dy: 50 }, '@bend': { rot: 0.1 } }, root: { dx: -60, dy: 20 } },
    knees: { base: 'hurt', add: { pelvis: { dy: 330, rot: 0.1 }, spine: { rot: 0.25 }, chest: { rot: 0.2 }, head: { rot: 0.3 }, upperarm: { rot: 0.3 }, forearm: { rot: 0.4 }, '@bend': { rot: 0.9 } }, root: { dx: -300, dy: 64 } },
    kneel: { base: 'hurt', add: { pelvis: { dy: 520, rot: 0.1 }, spine: { rot: 0.5 }, chest: { rot: 0.45 }, head: { rot: 0.45 }, upperarm: { rot: 0.4 }, forearm: { rot: 0.6 }, '@bend': { rot: 1.45 } }, root: { dx: -496, dy: 7 } },
    slump: { base: 'hurt', add: { pelvis: { dy: 520, rot: 0.25 }, spine: { rot: 1.0 }, chest: { rot: 0.7 }, head: { rot: 0.6 }, upperarm: { rot: 0.7 }, forearm: { rot: 0.5 }, '@bend': { rot: 1.5 } }, root: { dx: -496, rot: 0.1, dy: 42 } },
    tipA: { base: 'ko', to: 'hurt', mix: 0.35, add: { '@bend': { rot: 0.9 }, spine: { rot: 0.3 } }, root: { dx: -140, dy: 158 } },
    tip: { base: 'ko' },
  },
};
