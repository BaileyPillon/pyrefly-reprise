import { readFileSync } from 'node:fs';
const f = process.argv[2];
const r = JSON.parse(readFileSync(f, 'utf8'));
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)]; };
const out = { chapter: r.chapter, size: r.size.join('x'), crisp: r.crisp };
for (const k of Object.keys(r.looks)) {
  const g = r.looks[k].map((m) => m.gpuMedian).filter((x) => x !== null);
  const fr = r.looks[k].map((m) => m.frameMedian);
  out[`look${k}`] = { rounds: g.length, gpuMedianMs: +q(g, 0.5).toFixed(3), gpuP25: +q(g, 0.25).toFixed(3), gpuP75: +q(g, 0.75).toFixed(3), frameIntervalMedianMs: +q(fr, 0.5).toFixed(2) };
}
const base = out.look0.gpuMedianMs;
for (const k of [1, 2, 3]) out[`look${k}`].deltaVsOffMs = +(out[`look${k}`].gpuMedianMs - base).toFixed(3);
console.log(JSON.stringify(out));
