// Render the eye-candy frames with ONE short headless Chromium run (no dev server, no game build).
// Usage: PYREFLY_BROWSER=gpu node render.mjs <workdir> f1 f2 f3 p2
// Reads <workdir>/scene-<id>.png + .json from frames.py, writes <workdir>/frame-<id>.png.
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { currentChromiumArgs } from '../../../../tools/browser-mode.mjs';
const [work, ...ids] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ args: currentChromiumArgs() });
try {
  for (const id of ids) {
    const phone = id.startsWith('p');
    const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
    await page.goto(pathToFileURL(join(here, 'page.html')).href);
    const an = JSON.parse(readFileSync(join(work, `scene-${id}.json`), 'utf8'));
    const cfg = { id: phone ? 'f' + id.slice(1) : id, mode: phone ? 'phone' : 'desk', k: phone ? 0.5 : 1, an,
      scene: pathToFileURL(join(work, `scene-${id}.png`)).href };
    await page.evaluate(async (c) => { await document.fonts.load('700 12px Chakra'); build(c); await document.fonts.ready; }, cfg);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    await page.locator('#shot').screenshot({ path: join(work, `frame-${id}.png`) });
    await page.close();
  }
} finally { await browser.close(); }
console.log('rendered', ids.join(' '));
