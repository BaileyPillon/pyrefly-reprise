// Render the Sin concept frames and the phone sheet with one headless Chromium run.
// No dev server, no game build. Run from the repo root:
//   node docs/concepts/chapters/sin-2026-09-27/src/render.mjs frames|sheets|all
// Writes into docs/concepts/chapters/sin-2026-09-27/ (JPEG, each part under 1 MB).
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..');
const what = process.argv[2] || 'all';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const url = pathToFileURL(join(here, 'page.html')).href;
const ready = async () => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
};
const report = (p) => console.log(p, Math.round(statSync(p).size / 1024) + ' KB');
try {
  if (what === 'frames' || what === 'all') {
    for (const id of ['A', 'B', 'C']) {
      await page.goto(url);
      await page.evaluate((i) => window.buildFrame(i), id);
      await ready();
      const p = join(out, `frame-${id}-1600.jpg`);
      await page.locator('#frame').screenshot({ path: p, type: 'jpeg', quality: 86 });
      report(p);
    }
  }
  if (what === 'sheets' || what === 'all') {
    await page.setViewportSize({ width: 1080, height: 1200 });
    const parts = await (async () => { await page.goto(url); return page.evaluate(() => window.sheetParts()); })();
    for (const name of parts) {
      await page.goto(url);
      await page.evaluate((n) => window.buildSheet(n), name);
      await ready();
      const p = join(out, `${name}.jpg`);
      await page.locator('#sheet').screenshot({ path: p, type: 'jpeg', quality: 84 });
      report(p);
    }
  }
} finally {
  await browser.close();
}
