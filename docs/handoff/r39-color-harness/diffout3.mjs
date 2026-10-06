// What a variant changes OUTSIDE the figures' boxes (backdrop, floor, effects), against the base frame of the same chapter.
//   node diffout.mjs <tag> <chapter> <variant,variant,...>
import { readFileSync } from 'node:fs';
import { decodeRaw } from './analyze.mjs';
const [tag, chapter, vs] = process.argv.slice(2);
const root = `D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs/${tag}/${chapter}`;
const base = JSON.parse(readFileSync(`${root}/t0/result.json`, 'utf8'));
const A = await decodeRaw(`${root}/t0/canvas.png`);
const boxes = base.figures.filter((f) => f.box).map((f) => ({ x0: f.box.x - 4, y0: f.box.y - 4, x1: f.box.x + f.box.w + 4, y1: f.box.y + f.box.h + 4 }));
const inBox = (x, y) => boxes.some((b) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1);
for (const v of vs.split(',')) {
  const B = await decodeRaw(`${root}/${v}/canvas.png`);
  let n = 0, nd = 0, big = 0, sum = 0, max = 0;
  for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
    if (inBox(x, y)) continue;
    const i = (y * A.w + x) * 4; n++;
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    if (d) { nd++; sum += d; if (d > max) max = d; if (d > 4) big++; }
  }
  console.log(`${chapter} ${v.padEnd(8)} outside the figure boxes: ${nd} of ${n} pixels differ (${(100 * nd / n).toFixed(2)} %), ${big} by more than 4 levels, mean ${(nd ? sum / nd : 0).toFixed(2)}, max ${max}`);
}
