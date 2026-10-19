/**
 * **Measure a posed rig with no browser** (the animation prototype's authoring and test tool; both games; `docs/handoff/anim-proto.md`): where the body is in painting px for a pose or a moment of a
 * clip, by the gate's own skinning (`rig-pose.mjs`): the LOWEST point of any part (y grows down; the floor is `baselineY`), the left and right edges, the feet landmark and the bounding box. "Does she
 * float, sink, or slide" is a number here, not an opinion.
 *
 *   import { measurer } from './anim-measure.mjs';  const m = await measurer('D:/pyrefly-art-rigs/lulu-v2');  m.pose(channels) -> { low, left, right, top, feet: [x, y] }
 *
 * CLI: `node tools/rig/lane/anim-measure.mjs --rig D:/pyrefly-art-rigs/lulu-v2 --keys idle,ko`  (a table of the named keys).
 */
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { skinPart, solve, through } from '../rig-pose.mjs';
import { carrySkeleton, toGatePose } from './anim-draw.mjs';
import { clipRigOf } from './anim-rig.mjs';

/** A measurer of one rig: `pose(ch)` reads a channel array, `rig` is the clip rig, `rt` the normalised rig, `baselineY` the floor. */
export async function measurer(rigDir) {
  const { raw, dir } = readRigFile(rigDir);
  const { rt, problems } = normaliseRig(raw, { dir });
  if (!rt) throw new Error(problems.map((p) => p.message).join('; '));
  const rig = clipRigOf(rt);
  const sk = carrySkeleton(rt);
  const parts = rt.parts.filter((p) => !p.hidden);
  const scratch = parts.map((p) => new Float64Array(p.verts.length));
  return {
    rt,
    rig,
    baselineY: rt.baselineY,
    pose(ch) {
      const { k } = solve(rt, toGatePose(ch));
      let low = -Infinity, left = Infinity, right = -Infinity, top = Infinity;
      parts.forEach((p, i) => {
        skinPart(p, k, scratch[i]);
        const a = scratch[i];
        for (let j = 0; j < a.length; j += 2) {
          if (a[j] < left) left = a[j];
          if (a[j] > right) right = a[j];
          if (a[j + 1] > low) low = a[j + 1];
          if (a[j + 1] < top) top = a[j + 1];
        }
      });
      sk.solve(ch);
      const f = sk.landmark('feet');
      return { low, left, right, top, feet: f ? [f.x, f.y] : null };
    },
    landmark(ch, name) {
      sk.solve(ch);
      const p = sk.landmark(name);
      return p ? [p.x, p.y] : null;
    },
  };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('anim-measure.mjs')) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
  const m = await measurer(args.rig);
  console.log('baselineY', m.baselineY);
  for (const name of String(args.keys ?? 'idle').split(',')) {
    const r = m.pose(m.rig.keys.get(name));
    console.log(name.padEnd(10), 'low', r.low.toFixed(0), 'top', r.top.toFixed(0), 'left', r.left.toFixed(0), 'right', r.right.toFixed(0), 'feet', r.feet?.map((v) => v.toFixed(0)).join(','));
  }
  void through;
}
