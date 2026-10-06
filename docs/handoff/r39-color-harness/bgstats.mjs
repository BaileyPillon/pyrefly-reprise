// What the three states do to the backdrop (the frame without figures): lightness percentiles, chroma, share of near-black floor.   node bgstats.mjs <chapter>
import { decodeRaw, lab, pct } from './analyze.mjs';
const R = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs/ab3';
const ch = process.argv[2];
for (const [s, label] of [['t0', 'today'], ['tf', 'figures true'], ['tw', 'whole frame true']]) {
  let img; try { img = await decodeRaw(`${R}/${ch}/${s}/empty.png`); } catch { continue; }
  const L = [], C = []; let dark = 0, n = 0;
  for (let y = 0; y < img.h; y += 4) for (let x = 0; x < img.w; x += 4) {
    const p = (y * img.w + x) * 4; const q = lab(img.data[p], img.data[p + 1], img.data[p + 2]);
    L.push(q[0]); C.push(Math.hypot(q[1], q[2])); n++; if (q[0] < 8) dark++;
  }
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  console.log(`${ch.padEnd(20)} ${label.padEnd(17)} backdrop L* p2 ${pct(L, 2).toFixed(1).padStart(5)} p50 ${pct(L, 50).toFixed(1).padStart(5)} p98 ${pct(L, 98).toFixed(1).padStart(5)} | mean chroma ${mean(C).toFixed(1).padStart(5)} | below L* 8: ${(100 * dark / n).toFixed(1)} %`);
}
