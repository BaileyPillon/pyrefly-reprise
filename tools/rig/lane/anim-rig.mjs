/**
 * **A normalised rig (`rig-format.mjs#normaliseRig`) as the animation prototype's clip compiler reads it** (`src/engine/rig/anim/AnimClip.ts#ClipRig`): the bone names, the root bones and every key
 * compiled to a channel array, the way `src/engine/rig/RigKeys.ts#compileKey` does for the engine (`tests/unit/rig/anim-library.test.ts` pins the two to each other on Lulu's real rig).
 */
import { CH } from '../../../src/engine/rig/anim/AnimClip.ts';

export function clipRigOf(rt) {
  const boneIndex = new Map(rt.bones.map((b, i) => [b.name, i]));
  const roots = rt.bones.flatMap((b, i) => (b.parent < 0 ? [i] : []));
  const keys = new Map();
  for (const [name, k] of Object.entries(rt.keys)) {
    const a = new Float64Array(rt.bones.length * CH);
    for (let i = 0; i < rt.bones.length; i++) { a[i * CH + 3] = 1; a[i * CH + 4] = 1; }
    for (const [bn, c] of Object.entries(k.bones)) a.set([c.rot, c.dx, c.dy, c.sx, c.sy], boneIndex.get(bn) * CH);
    for (const r of roots) { a[r * CH] += k.root.rot; a[r * CH + 1] += k.root.dx; a[r * CH + 2] += k.root.dy; }
    keys.set(name, a);
  }
  return { boneIndex, roots, keys, channels: rt.bones.length * CH, bones: rt.bones };
}

