// sheet.mjs: the before/after contact sheet for r3941-heights, rendered as a page by headless Chromium and saved as a JPEG.
//   node sheet.mjs --frames=frames --analysis=analysis.json --viewport=1600x900 --chapters=a,b,c --out=before-after-sheet.jpg [--imgw=900]
import { chromium } from 'playwright';
import { FFX_PARTY_STATURE } from '../../../../src/data/ffx/party-stature.ts'; // the table itself (Node strips the types)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const FRAMES = path.resolve(args.frames ?? 'frames');
const VP = args.viewport ?? '1600x900';
const phone = Number(VP.split('x')[0]) < 600;
const analysis = JSON.parse(fs.readFileSync(args.analysis ?? 'analysis.json', 'utf8')).filter((r) => r.viewport === VP);
const chapters = (args.chapters ?? analysis.map((r) => r.chapter).join(',')).split(',').filter(Boolean);
const IMGW = Number(args.imgw ?? (phone ? 300 : 900));
const TITLE = args.title ?? 'FFX party heights: before and after';

const CH = {
  'seymour-flux': ['I', 'Seymour Flux', 'Mt. Gagazet'],
  yunalesca: ['II', 'Yunalesca', 'Zanarkand Dome'],
  'braskas-final-aeon': ['III', "Braska's Final Aeon", "Dream's End"],
  'seymour-anima-macalania': ['VII', 'Seymour and Anima', 'Macalania Temple'],
  'evrae-airship': ['VIII', 'Evrae', 'Deck of the Fahrenheit'],
  'yojimbo-cavern': ['IX', 'Yojimbo', 'Cavern of the Stolen Fayth'],
  'seymour-natus': ['X', 'Seymour Natus', 'Highbridge of Bevelle'],
  'seymour-omnis': ['XII', 'Seymour Omnis', 'Garden of Pain'],
  'isaaru-via-purifico': ['XIV', 'Isaaru', 'Via Purifico'],
  'sin-fins-core': ['XVII', 'Sin: the Fins and the Core', 'Deck of the Fahrenheit, in flight'],
  'sin-face': ['XVIII', 'Sin: the Face', 'Deck of the Fahrenheit, above Bevelle'],
};
const RATIO = Object.fromEntries(Object.entries(FFX_PARTY_STATURE).map(([id, row]) => [id, row.ratio]));
const name = (id) => id[0].toUpperCase() + id.slice(1);
const chip = (id) => `<span class="chip"><b>${name(id)}</b> ${RATIO[id].toFixed(3)}</span>`;
const img = (tag) => pathToFileURL(path.join(FRAMES, `${tag}.png`)).href;

const bars = Object.entries(RATIO).map(([id, r]) => `<div class="bar"><div class="col" style="height:${Math.round(r * 120)}px"></div><div class="lab">${name(id)}<br>${r.toFixed(3)}</div></div>`).join('');

const cards = chapters.map((c) => {
  const row = analysis.find((r) => r.chapter === c);
  if (!row) return '';
  const [num, title, place] = CH[c] ?? ['?', c, ''];
  const heroes = row.figs.map((f) => chip(f.id)).join('');
  const worldB = row.figs.map((f) => `${name(f.id)} ${f.worldBefore}`).join(', ');
  const worldA = row.figs.map((f) => `${name(f.id)} ${f.worldAfter}`).join(', ');
  const solo = row.figs.length === 1 ? ' (alone, and named by its scene: unchanged)' : '';
  return `<section class="card ${phone ? 'ph' : ''}">
    <header><span class="num">${num}</span><span class="t">${title}</span><span class="p">${place}</span><span class="heroes">${heroes}</span></header>
    <div class="pair">
      <figure><img src="${img(`${c}-${VP}-before`)}" width="${IMGW}"><figcaption><b>BEFORE</b> (all equal): ${worldB}</figcaption></figure>
      <figure><img src="${img(`${c}-${VP}-after`)}" width="${IMGW}"><figcaption><b>AFTER</b>: ${worldA}${solo}</figcaption></figure>
    </div></section>`;
}).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #0b0a12; color: #e8e2d0; font: 14px/1.35 "Segoe UI", system-ui, sans-serif; }
  .top { padding: 18px 24px 8px; display: flex; gap: 28px; align-items: flex-end; border-bottom: 1px solid #3a3320; }
  h1 { margin: 0 0 4px; font-size: 22px; color: #f0cf92; font-weight: 600; }
  .sub { color: #b9b19a; font-size: 13px; max-width: 980px; }
  .chart { display: flex; gap: 10px; align-items: flex-end; margin-left: auto; padding-bottom: 6px; }
  .bar { text-align: center; width: 62px; font-size: 11px; color: #cfc7b0; }
  .col { background: linear-gradient(#f0cf92, #b8913f); margin: 0 10px 4px; border-radius: 3px 3px 0 0; }
  .grid { display: ${phone ? 'grid; grid-template-columns: repeat(3, auto); justify-content: start;' : 'block;'} padding: 10px 24px 24px; gap: 14px 22px; }
  .card { margin: 14px 0 ${phone ? '0' : '26px'}; }
  header { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; margin-bottom: 6px; }
  .num { color: #f0cf92; font-weight: 700; font-size: 19px; min-width: 52px; }
  .t { font-size: 17px; font-weight: 600; }
  .p { color: #a79f88; font-size: 13px; }
  .heroes { margin-left: auto; display: flex; gap: 6px; }
  .chip { background: #1b1830; border: 1px solid #3a3320; border-radius: 4px; padding: 2px 8px; font-size: 12.5px; }
  .chip b { color: #f0cf92; font-weight: 600; }
  .pair { display: flex; gap: 12px; }
  figure { margin: 0; }
  img { display: block; border: 1px solid #2a2540; }
  figcaption { font-size: 12px; color: #b9b19a; margin-top: 3px; max-width: ${IMGW}px; }
  figcaption b { color: #f0cf92; }
  .card.ph header { flex-wrap: wrap; }
  .card.ph .heroes { margin-left: 0; flex-wrap: wrap; }
</style></head><body>
<div class="top"><div><h1>${TITLE}</h1>
<div class="sub">Echoes of Spira, FFX only (r3941-heights). Same build, seed 1 and moment (the first command menu, clocks frozen), ${VP}: BEFORE is <code>?stature=off</code> (the old equal heights), AFTER is the default.
Ratios are each hero's height over Tidus's (bind-pose HD models, <code>research/ffx-character-heights.md</code>); a figure grows or shrinks about its feet. World heights in the captions are in the scene's units (Tidus = the scene's party height).</div></div>
<div class="chart">${bars}</div></div>
<div class="grid">${cards}</div></body></html>`;

const htmlPath = path.join(FRAMES, `_sheet-${VP}.html`);
fs.writeFileSync(htmlPath, html);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: phone ? 1060 : 1900, height: 900 } });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 60000 });
await page.screenshot({ path: path.resolve(args.out ?? 'before-after-sheet.jpg'), type: 'jpeg', quality: Number(args.quality ?? 86), fullPage: true });
await browser.close();
console.log('wrote', args.out ?? 'before-after-sheet.jpg');
