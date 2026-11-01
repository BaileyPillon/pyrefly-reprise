import fs from 'node:fs';
const f = process.argv[2];
const c = JSON.parse(fs.readFileSync(f));
const sw = c.swaps;
const rows = c.jerks.filter((j) => j.px > 80).map((j) => {
  const s = Array.isArray(sw) ? sw.find((x) => x.n === (j.smeared?.swap ?? -1) || x.id === j.smeared?.swap) : null;
  return j;
});
const by = (arr) => arr.reduce((a, j) => { const k = `${j.figure}|${j.kind}|${j.atSwap ? 'swap' : 'move'}|${j.smeared ? 'smear' : 'raw'}`; a[k] = (a[k] || 0) + 1; return a; }, {});
console.log('jerks>80:', rows.length, ' >100:', rows.filter((j) => j.px > 100).length, ' >100 raw (unsmeared):', rows.filter((j) => j.px > 100 && !j.smeared).length);
console.log('kinds>100 raw:', JSON.stringify(by(rows.filter((j) => j.px > 100 && !j.smeared))));
const raw = rows.filter((j) => !j.smeared).sort((a, b) => b.px - a.px).slice(0, 6).map((j) => `${j.px}px ${j.figure} ${j.kind} atSwap=${j.atSwap} part=${j.part} cause=${j.cause?.type} frameMs=${j.frameMs} long=${j.longFrame}`);
console.log(raw.join('\n'));
if (sw && sw[0]) console.log('swap sample', JSON.stringify(sw[0]).slice(0, 300));
