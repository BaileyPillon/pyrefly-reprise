// Markdown tables for the handoff.   node mdtables.mjs builds | states | halo | attr
import { readFileSync, existsSync } from 'node:fs';
const R = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs';
const load = (p) => (existsSync(`${R}/${p}/result.json`) ? JSON.parse(readFileSync(`${R}/${p}/result.json`, 'utf8')) : null);
const fig = (d, id) => d && d.figures.find((f) => f.id === id);
const n = (v, k = 1) => (v === undefined || v === null || Number.isNaN(v) ? '-' : (Math.round(v * 10 ** k) / 10 ** k).toString());
const kind = process.argv[2];
const SCENES = [
  ['seymour-flux', 'FFX Ch I', ['tidus', 'yuna', 'seymour-flux', 'kimahri']],
  ['braskas-final-aeon', 'FFX Ch III', ['auron', 'tidus', 'yuna', 'braskas-final-aeon']],
  ['ffx2-bahamut', 'FFX-2 Ch IV', ['yuna', 'bahamut', 'rikku', 'paine']],
  ['ffx2-leblanc', 'FFX-2 Ch VI', ['yuna', 'rikku', 'paine']],
];
const cell = (f) => (f && f.render ? `${n(f.de00.median)} / ${n(f.render.chroma / f.source.chroma, 2)}x / ${n(f.halo.excess)}` : '-');
if (kind === 'builds') {
  console.log('| scene | figure | painting: L*, C*, clip % | live 38: dE00 / chroma x / halo | r39-int: dE00 / chroma x / halo | switch on (r39-color): dE00 / chroma x / halo |');
  console.log('|---|---|---|---|---|---|');
  for (const [ch, name, ids] of SCENES) {
    const a = load(`ab38/${ch}/t0`), b = load(`ab/${ch}/t0`), c = load(`ab3/${ch}/tf`) ?? load(`ab/${ch}/t2d`) ?? load(`ab/${ch}/t2`);
    const cTag = load(`ab3/${ch}/tf`) ? '' : ' (proto)';
    for (const id of ids) {
      const y = fig(b, id); if (!y || !y.render) continue;
      console.log(`| ${name} | ${id} | ${n(y.source.meanL)}, ${n(y.source.chroma)}, ${n(y.clip.sourceMax250)} | ${cell(fig(a, id))} | ${cell(y)} | ${cell(fig(c, id))}${cTag} |`);
    }
  }
} else if (kind === 'states') {
  // the three states of the driver's ask, on one frozen frame: today, figures true, whole frame true
  console.log('| scene | figure | state | dE00 | chroma (painting) | mean L* (painting) | clip % (painting) | halo | ring | p2 |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const [ch, name, ids] of [['ffx2-leblanc', 'FFX-2 Ch VI', ['yuna', 'rikku', 'paine']], ['seymour-flux', 'FFX Ch I', ['tidus', 'yuna', 'seymour-flux']], ['ffx2-bahamut', 'FFX-2 Ch IV', ['yuna', 'bahamut', 'rikku', 'paine']]]) {
    for (const id of ids) for (const [v, label] of [['t0', '1 today'], ['tf', '2 figures true'], ['tw', '3 whole frame true']]) {
      const d = load(`ab3/${ch}/${v}`); const f = fig(d, id); if (!f || !f.render) continue;
      console.log(`| ${name} | ${id} | ${label} | ${n(f.de00.median)} | ${n(f.render.chroma)} (${n(f.source.chroma)}) | ${n(f.render.meanL)} (${n(f.source.meanL)}) | ${n(f.clip.renderMax250)} (${n(f.clip.sourceMax250)}) | ${n(f.halo.excess)} | ${n(f.ring?.meanAddedL)} | ${n(f.render.p2)} |`);
    }
  }
}
