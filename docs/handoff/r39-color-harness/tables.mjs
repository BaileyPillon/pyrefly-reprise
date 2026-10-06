// Markdown tables from the runs.   node tables.mjs <kind> ...
//   builds <chapter> <fig,fig,...>                         live38 and r39 base, per figure
//   attr   <tag> <chapter> <fig> <variant,variant,...>     one figure, one row per variant
//   opts   <tag> <chapter> <fig,fig,...> <variant:label,...>  the options, per figure
import { readFileSync, existsSync } from 'node:fs';
const ROOT = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color/runs';
const get = (tag, ch, v) => { const p = `${ROOT}/${tag}/${ch}/${v}/result.json`; return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const fig = (d, id) => d && (d.figures ?? []).find((f) => f.id === id);
const f1 = (v) => (v === undefined || v === null || Number.isNaN(v) ? '-' : (Math.round(v * 10) / 10).toString());
const [kind, ...a] = process.argv.slice(2);
const cols = (f) => (f && f.render ? [f.de00.median, f.render.meanL, f.source.meanL, f.render.chroma, f.source.chroma, f.shift.dA, f.shift.dB, f.clip.renderMax250, f.clip.sourceMax250, f.render.p2, f.render.p98, f.render.std, f.halo.excess, f.ring?.meanAddedL] : []);
if (kind === 'builds') {
  const [ch, ids] = a;
  console.log(`| figure | build | dE00 median | mean L* (painting) | chroma C* (painting) | da* | db* | clip >=250 % (painting) | p2 | p98 | std L* (painting) | halo excess | ring |`);
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const id of ids.split(',')) for (const tag of ['live38', 'r39']) {
    const d = get(tag, ch, 'base'); const f = fig(d, id); if (!f || !f.render) continue;
    console.log(`| ${id} | ${tag === 'live38' ? 'live 38' : 'r39-int'} | ${f1(f.de00.median)} | ${f1(f.render.meanL)} (${f1(f.source.meanL)}) | ${f1(f.render.chroma)} (${f1(f.source.chroma)}) | ${f1(f.shift.dA)} | ${f1(f.shift.dB)} | ${f1(f.clip.renderMax250)} (${f1(f.clip.sourceMax250)}) | ${f1(f.render.p2)} | ${f1(f.render.p98)} | ${f1(f.render.std)} (${f1(f.source.std)}) | ${f1(f.halo.excess)} | ${f1(f.ring?.meanAddedL)} |`);
  }
} else if (kind === 'attr' || kind === 'opts') {
  const [tag, ch, idArg, varArg] = a;
  const variants = varArg.split(',').map((s) => { const [v, l] = s.split(':'); return { v, l: l ?? v }; });
  for (const id of idArg.split(',')) {
    console.log(`\n**${ch} / ${id}**\n`);
    console.log('| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |');
    console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const { v, l } of variants) {
      const d = get(tag, ch, v); const f = fig(d, id);
      if (!f || !f.render) { console.log(`| ${l} | - |`); continue; }
      const c = f.curve ?? []; const lo = c.find((x) => x && x.srcL.startsWith('0-')) ?? c.find((x) => x); const hi = c[c.length - 1];
      console.log(`| ${l} | ${f1(f.de00.median)} | ${f1(f.render.meanL)} | ${f1(f.render.chroma)} | ${f1(f.shift.dA)} | ${f1(f.shift.dB)} | ${f1(f.clip.renderMax250)} | ${f1(f.render.p2)} | ${f1(f.render.p98)} | ${f1(f.render.std)} | ${f1(f.halo.excess)} | ${f1(f.ring?.meanAddedL)} | ${lo ? `${f1(lo.renderL)} (${f1(lo.sourceL)})` : '-'} | ${hi ? `${f1(hi.renderL)} (${f1(hi.sourceL)})` : '-'} |`);
    }
    const d0 = get(tag, ch, variants[0].v); const f0 = fig(d0, id);
    if (f0 && f0.source) console.log(`| (painting) | 0 | ${f1(f0.source.meanL)} | ${f1(f0.source.chroma)} | 0 | 0 | ${f1(f0.clip.sourceMax250)} | ${f1(f0.source.p2)} | ${f1(f0.source.p98)} | ${f1(f0.source.std)} | 0 | - | | |`);
  }
}
