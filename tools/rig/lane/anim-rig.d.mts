import type { ClipRig } from '../../../src/engine/rig/anim/AnimClip.ts';

/** A normalised rig as the animation prototype's clip compiler reads it (see `anim-rig.mjs`). */
export function clipRigOf(rt: unknown, bend?: boolean): ClipRig & { bones: unknown };
