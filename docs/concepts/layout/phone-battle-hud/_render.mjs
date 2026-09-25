// Render every option frame of mock.html at native phone pixels, run the CHK-003 walk on each
// (fails if any text is under 14 px), then build sheet.html -> sheet.jpg.
//   node docs/concepts/layout/phone-battle-hud/_render.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const DIR = 'docs/concepts/layout/phone-battle-hud';
const FR = `${DIR}/frames`;
fs.mkdirSync(FR, { recursive: true });
const jobs = [];
for (const opt of ['A', 'B', 'C']) for (const game of ['ffx', 'ffx2']) for (const step of ['menu', 'target']) jobs.push({ opt, game, step });
for (const game of ['ffx', 'ffx2']) jobs.push({ opt: 'R', game, step: 'rotate' });
const browser = await chromium.launch();
const report = [];
let bad = 0;
for (const j of jobs) {
  const land = j.opt === 'C';
  const page = await browser.newPage({ viewport: { width: land ? 844 : 390, height: land ? 390 : 844 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  const url = pathToFileURL(path.resolve(`${DIR}/mock.html`)).href + `?opt=${j.opt}&game=${j.game}&step=${j.step}`;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
  const bgs = await page.evaluate(async () => {
    const urls = [...new Set([...document.querySelectorAll('.face')].map((e) => getComputedStyle(e).backgroundImage.replace(/^url\("?|"?\)$/g, '')))];
    const res = await Promise.all(urls.map((u) => new Promise((r) => { const im = new Image(); im.onload = () => r(null); im.onerror = () => r(u); im.src = u; })));
    return res.filter(Boolean);
  });
  const leg = await page.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      const t = n.textContent.trim(); if (!t) continue;
      const el = n.parentElement; if (el.closest('script,style,title')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 1) continue;
      out.push({ t: t.slice(0, 30), px: parseFloat(getComputedStyle(el).fontSize), clip: el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible' });
    }
    out.sort((a, b) => a.px - b.px);
    return { count: out.length, min: out[0]?.px, under14: out.filter((o) => o.px < 14), clipped: out.filter((o) => o.clip) };
  });
  const name = `${j.opt}-${j.game}-${j.step}`;
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${FR}/${name}.jpg`, type: 'jpeg', quality: 90 });
  const ok = !errs.length && !broken.length && !bgs.length && !leg.under14.length;
  if (!ok) bad++;
  report.push({ name, texts: leg.count, minPx: leg.min, under14: leg.under14.length, clipped: leg.clipped.length, errs, broken, badFaces: bgs });
  await page.close();
}
fs.writeFileSync(`${DIR}/frames/legibility.json`, JSON.stringify(report, null, 2));
console.table(report.map((r) => ({ name: r.name, texts: r.texts, minPx: r.minPx, under14: r.under14, clipped: r.clipped, errs: r.errs.length + r.broken.length + r.badFaces.length })));
await browser.close();
process.exit(bad ? 1 : 0);
