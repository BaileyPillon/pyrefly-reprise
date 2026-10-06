// Plain-words colour of each figure's strongest colour, highlights and shadows: the painting, today, figures true, whole frame true.
//   node names.mjs <chapter> <fig,fig,...>
import { readFileSync } from 'node:fs';
import { decodeRaw, buildReference, loadSource, lab } from './analyze.mjs';
const R = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs/ab3';
const [ch, idArg] = process.argv.slice(2);
const base = JSON.parse(readFileSync(`${R}/${ch}/t0/result.json`, 'utf8'));
const states = [['t0', 'today'], ['tf', 'figures true'], ['tw', 'whole frame true']];
const frames = {};
for (const [s] of states) { try { frames[s] = await decodeRaw(`${R}/${ch}/${s}/canvas.png`); } catch { /* missing */ } }
const hueName = (h, L, C) => {
  if (C < 8) return L > 80 ? 'near white' : L < 20 ? 'near black' : 'grey';
  const hh = ((h % 360) + 360) % 360;
  const light = L > 72 ? 'pale ' : L < 30 ? 'dark ' : '';
  let name;
  if (hh < 15 || hh >= 345) name = L > 55 && C < 45 ? 'pink' : 'red';
  else if (hh < 40) name = L > 58 && C < 50 ? 'salmon' : 'red-orange';
  else if (hh < 65) name = L > 70 && C < 45 ? 'peach' : 'orange';
  else if (hh < 100) name = 'yellow';
  else if (hh < 165) name = 'green';
  else if (hh < 215) name = 'teal';
  else if (hh < 265) name = 'blue';
  else if (hh < 300) name = 'violet';
  else name = 'magenta';
  return `${light}${name}`;
};
const describe = (px) => {
  const m = [0, 0, 0]; for (const p of px) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; }
  const L = m[0] / px.length, a = m[1] / px.length, b = m[2] / px.length; const C = Math.hypot(a, b); const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L: Math.round(L), C: Math.round(C), name: hueName(h, L, C) };
};
for (const id of idArg.split(',')) {
  const f = base.figures.find((x) => x.id === id); if (!f || !f.quad) continue;
  const src = await loadSource(f.url, { diskRoot: 'D:/pyrefly-r39-color/public' });
  const ref = buildReference(src, f.quad, 2560, 1440);
  const idx = []; for (let i = 0; i < ref.cov.length; i++) if (ref.cov[i] >= 0.98) idx.push(i);
  const get = (frame, i) => { const x = ref.bx0 + (i % ref.bw), y = ref.by0 + Math.floor(i / ref.bw); const p = (y * frame.w + x) * 4; return lab(frame.data[p], frame.data[p + 1], frame.data[p + 2]); };
  const refLab = idx.map((i) => lab(ref.rgb[i * 3], ref.rgb[i * 3 + 1], ref.rgb[i * 3 + 2]));
  // the groups are chosen on the PAINTING (the same pixels in every state): its 15 percent most chromatic, lightest and darkest pixels
  const byC = idx.map((_, k) => k).sort((p, q) => Math.hypot(refLab[q][1], refLab[q][2]) - Math.hypot(refLab[p][1], refLab[p][2]));
  const byL = idx.map((_, k) => k).sort((p, q) => refLab[q][0] - refLab[p][0]);
  const take = Math.max(50, Math.floor(idx.length * 0.15));
  const groups = { 'strongest colour': byC.slice(0, take), highlights: byL.slice(0, take), shadows: byL.slice(-take) };
  console.log(`\n${ch} / ${id}`);
  for (const [gname, ks] of Object.entries(groups)) {
    const parts = [`  ${gname.padEnd(16)} painting ${fmt(describe(ks.map((k) => refLab[k])))}`];
    for (const [s, label] of states) if (frames[s]) parts.push(`${label} ${fmt(describe(ks.map((k) => get(frames[s], idx[k]))))}`);
    console.log(parts.join(' | '));
  }
}
function fmt(d) { return `${d.name} (L*${d.L} C*${d.C})`; }
