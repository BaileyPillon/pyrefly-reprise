/**
 * **A normalised rig (`rig-format.mjs#normaliseRig`) as the animation prototype's clip compiler reads it** (`src/engine/rig/anim/AnimClip.ts#ClipRig`): the bone names, the root bones and every key
 * compiled to a channel array, the way `src/engine/rig/RigKeys.ts#compileKey` does for the engine (`tests/unit/rig/anim-library.test.ts` pins the two to each other on Lulu's real rig).
 */
import { CH } from '../../../src/engine/rig/anim/AnimClip.ts';

/** `bend` (pass 3): one pseudo-bone `@bend` after the real ones, whose `rot` is the knee's bend, as `RigAnimLayer` does for a figure the prototype's P3 style is on. */
export function clipRigOf(rt, bend = false) {
  const boneIndex = new Map(rt.bones.map((b, i) => [b.name, i]));
  if (bend) boneIndex.set('@bend', rt.bones.length);
  const roots = rt.bones.flatMap((b, i) => (b.parent < 0 ? [i] : []));
  const keys = new Map();
  const total = rt.bones.length + (bend ? 1 : 0);
  for (const [name, k] of Object.entries(rt.keys)) {
    const a = new Float64Array(total * CH);
    for (let i = 0; i < total; i++) { a[i * CH + 3] = 1; a[i * CH + 4] = 1; }
    for (const [bn, c] of Object.entries(k.bones)) a.set([c.rot, c.dx, c.dy, c.sx, c.sy], boneIndex.get(bn) * CH);
    for (const r of roots) { a[r * CH] += k.root.rot; a[r * CH + 1] += k.root.dx; a[r * CH + 2] += k.root.dy; }
    keys.set(name, a);
  }
  return { boneIndex, roots, keys, channels: total * CH, bones: rt.bones };
}

