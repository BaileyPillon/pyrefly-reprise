// Render every <section> of mock.html to <out>/<id>.png with ONE short headless Chromium run
// (no dev server, no game build). Desk frames at 1x, phone frames at 2x. Also writes
// <out>/metrics.json (window rectangles, font metrics, anything spilling out of a window).
// Usage: node render.mjs <out>
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
const out = process.argv[2];
const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
try {
  for (const [dpr, kind] of [[1, 'desk'], [2, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: dpr });
    await page.goto(pathToFileURL(join(here, 'mock.html')).href);
    const m = await page.evaluate(async () => {
      for (const f of ["500 20px 'M PLUS Rounded 1c'", '600 20px Rajdhani', '700 20px Rajdhani', "600 20px 'Exo 2'", "800 20px 'Exo 2'", '500 20px Chakra', '700 20px Chakra'])
        await document.fonts.load(f, 'LimitAttack0123456789/“');
      build();
      await document.fonts.ready;
      return metrics();
    });
    if (dpr === 1) writeFileSync(join(out, 'metrics.json'), JSON.stringify(m, null, 1));
    for (const id of await page.$$eval(`section.${kind}`, (s) => s.map((e) => e.id))) {
      await page.locator(`#${id}`).screenshot({ path: `${out}/${id}.png` });
    }
    await page.close();
  }
} finally { await browser.close(); }
console.log('rendered');
