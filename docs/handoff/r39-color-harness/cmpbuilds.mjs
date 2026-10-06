// live 38 against r39 (both still, one frozen frame each): the figure numbers side by side.   node cmpbuilds.mjs <chapter> [ids]
import { readFileSync, existsSync } from 'node:fs';
const [ch, idArg] = process.argv.slice(2);
const R = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs';
const a = JSON.parse(readFileSync(`${R}/ab38/${ch}/t0/result.json`, 'utf8'));
const b = JSON.parse(readFileSync(`${R}/ab/${ch}/t0/result.json`, 'utf8'));
const c = existsSync(`${R}/ab/${ch}/t2/result.json`) ? JSON.parse(readFileSync(`${R}/ab/${ch}/t2/result.json`, 'utf8')) : null;
const ids = idArg ? idArg.split(',') : b.figures.map((f) => f.id);
const g = (d, id) => d && d.figures.find((f) => f.id === id);
for (const id of ids) {
  const x = g(a, id), y = g(b, id), z = g(c, id);
  if (!y || !y.render) continue;
  const f = (q) => (q && q.render ? `dE ${String(q.de00.median).padStart(5)} C* ${String(q.render.chroma).padStart(5)} L ${String(q.render.meanL).padStart(5)} clip ${String(q.clip.renderMax250).padStart(5)} halo ${String(q.halo.excess).padStart(5)} ring ${String(q.ring?.meanAddedL).padStart(5)}` : '(not in this frame)');
  console.log(id.padEnd(14), '| painting C* ' + String(y.source.chroma).padStart(5), 'L ' + String(y.source.meanL).padStart(5), 'clip ' + String(y.clip.sourceMax250).padStart(5));
  console.log('   live 38 ', f(x)); console.log('   r39-int ', f(y)); if (z) console.log('   r39 fix ', f(z));
}
