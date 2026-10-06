// Lighting mockups (branch lighting-mockups, never merged): the reviewed head boxes of docs/target/pose-measure.json, as a compact
// table for the face guard of the figure light. Key "<art id>/<pose file>", value [u0, v0, u1, v1] in the painting's own uv
// (x right, v UP from the bottom, as the texture is sampled). Poses with no real box (a whole-canvas placeholder, a foe, a
// dressphere-change key) are left out and the shader falls back to the top of the figure.
//   node tools/lighting/heads.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const m = JSON.parse(readFileSync(new URL('../../docs/target/pose-measure.json', import.meta.url), 'utf8'));
const out = {};
let n = 0;
for (const [id, s] of Object.entries(m.subjects)) {
  for (const [pose, p] of Object.entries(s.poses)) {
    const h = p.head;
    const [w, hh] = p.size ?? [];
    if (!h || !w || !hh) continue;
    if (h[0] <= 1 && h[1] <= 1 && h[2] <= 1 && h[3] <= 1) continue; // the whole-canvas placeholder of a foe
    const r = (v) => Math.round(v * 10000) / 10000;
    out[`${id}/${pose}`] = [r(h[0] / w), r(1 - h[3] / hh), r(h[2] / w), r(1 - h[1] / hh)];
    n++;
  }
}
writeFileSync(new URL('../../src/engine/fx/light/headBoxes.json', import.meta.url), JSON.stringify(out));
console.log('head boxes:', n);
