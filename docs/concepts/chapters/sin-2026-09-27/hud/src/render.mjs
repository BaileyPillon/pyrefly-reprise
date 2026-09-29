// Sin HUD mockups (FFX only): render every scene at 1600x900 and 390x844 (the phone at 2x) with headless Chromium from
// file:// (PYREFLY_BROWSER=gpu honoured), no dev server and no game build. From the repo root:
//   node docs/concepts/chapters/sin-2026-09-27/hud/src/render.mjs              (all scenes)
//   node docs/concepts/chapters/sin-2026-09-27/hud/src/render.mjs m1a-t8 m2a   (some)
// Then:  python docs/concepts/chapters/sin-2026-09-27/hud/src/build_sheet.py   (writes ../sheet.html)
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'frames');
mkdirSync(out, { recursive: true });
const args = process.env.PYREFLY_BROWSER === 'gpu' ? ['--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args });
const page0 = await browser.newPage();
await page0.goto(pathToFileURL(join(here, 'hud.html')).href + '?id=m1a-t8');
const all = await page0.evaluate(() => window.SCENE_IDS);
await page0.close();
const want = process.argv.slice(2);
const ids = want.length ? want : all;
try {
  for (const id of ids) {
    for (const mode of ['desk', 'phone']) {
      const phone = mode === 'phone';
      const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(pathToFileURL(join(here, 'hud.html')).href + `?id=${id}&mode=${mode}`);
      await page.evaluate(async () => { await document.fonts.ready; });
      await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
      const file = join(out, `${id}-${phone ? '390' : '1600'}.jpg`);
      await page.locator('#root').screenshot({ path: file, type: 'jpeg', quality: phone ? 80 : 84 });
      console.log(id, mode, Math.round(statSync(file).size / 1024) + ' KB', errors.join(' | '));
      await page.close();
    }
  }
} finally {
  await browser.close();
}
