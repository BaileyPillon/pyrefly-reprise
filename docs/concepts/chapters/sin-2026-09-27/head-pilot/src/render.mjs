// Sin head pilot (FFX only): render the rough battle frames (1600x900 and a 390x844 phone at 2x) for each
// option listed in picks.json, from the candidate paintings in D:/Tools/pyrefly-art-backup. Headless
// Chromium, file:// only: no dev server, no game build. Run from the repo root:
//   node docs/concepts/chapters/sin-2026-09-27/head-pilot/src/render.mjs [A B C D]   (frames)
//   node docs/concepts/chapters/sin-2026-09-27/head-pilot/src/render.mjs sheets      (the phone sheet, 1080 wide)
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'frames');
const picks = JSON.parse(readFileSync(join(here, 'picks.json'), 'utf8'));
const sheets = process.argv[2] === 'sheets';
const want = sheets ? [] : process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(picks);
const browser = await chromium.launch();
const report = (p) => console.log(p, Math.round(statSync(p).size / 1024) + ' KB');
try {
  for (const opt of want) {
    const p = picks[opt];
    const q = new URLSearchParams({ opt, img: pathToFileURL(p.img).href, label: p.label, ix: p.ix, iy: p.iy, iz: p.iz, ox: p.ox });
    for (const mode of ['desk', 'phone']) {
      const phone = mode === 'phone';
      const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
      q.set('mode', mode);
      await page.goto(pathToFileURL(join(here, 'frame.html')).href + '?' + q);
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
      const file = join(out, `frame-${opt}-${phone ? '390' : '1600'}.jpg`);
      await page.locator('#f').screenshot({ path: file, type: 'jpeg', quality: phone ? 80 : 84 });
      report(file);
      await page.close();
    }
  }
  if (sheets) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1200 } });
    for (let part = 1; ; part++) {
      await page.goto(pathToFileURL(join(here, 'sheet.html')).href + '?part=' + part);
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
      for (const q of [84, 76, 68, 60]) {
        const file = join(here, '..', `part-${part}.jpg`);
        await page.locator('#sheet').screenshot({ path: file, type: 'jpeg', quality: q });
        if (statSync(file).size < 1_000_000) { report(file); break; }
      }
      if (part >= await page.evaluate(() => window.partCount)) break;
    }
    await page.close();
  }
} finally {
  await browser.close();
}
