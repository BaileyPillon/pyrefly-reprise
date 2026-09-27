// Render every <section> of mock.html to <out>/<id>.png with one short headless
// browser run (no dev server, no game). Desk frames at 1x, phone frames at 2x.
// Usage: node render.mjs <out>
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const out = process.argv[2];
const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
try {
  for (const [dpr, kind] of [[1, 'desk'], [2, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: dpr });
    await page.goto(pathToFileURL(join(here, 'mock.html')).href);
    await page.evaluate(() => document.fonts.ready);
    for (const id of await page.$$eval(`section.${kind}`, (s) => s.map((e) => e.id))) {
      await page.locator(`#${id}`).screenshot({ path: `${out}/${id}.png` });
    }
    await page.close();
  }
} finally { await browser.close(); }
console.log('rendered');
