// Sin's head, round 3 (FFX only): render the rough battle frames (1600x900 and a 390x844 phone at 2x) for each mouth
// stage, from the rig's stage composites in D:/Tools/pyrefly-art-backup, and the phone-readable sheet parts.
// Headless Chromium (PYREFLY_BROWSER=gpu honoured), file:// only: no dev server, no game build. From the repo root:
//   node docs/concepts/chapters/sin-2026-09-27/head-round3/src/render.mjs frames
//   node docs/concepts/chapters/sin-2026-09-27/head-round3/src/render.mjs sheets
//   node docs/concepts/chapters/sin-2026-09-27/head-round3/src/render.mjs all      (both, one browser run)
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'frames');
mkdirSync(out, { recursive: true });
const C = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-sin/round3/final';
const what = process.argv[2] || 'frames';
const args = process.env.PYREFLY_BROWSER === 'gpu' ? ['--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args });
const report = (p) => console.log(p, Math.round(statSync(p).size / 1024) + ' KB');
const ready = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
};
try {
  if (what === 'frames' || what === 'all') {
    for (let stage = 0; stage < 5; stage++) {
      const q = new URLSearchParams({ stage: String(stage), img: pathToFileURL(`${C}/stage-${stage}.jpg`).href });
      for (const mode of ['desk', 'phone']) {
        const phone = mode === 'phone';
        const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
        q.set('mode', mode);
        await page.goto(pathToFileURL(join(here, 'frame.html')).href + '?' + q);
        await ready(page);
        const file = join(out, `frame-s${stage}-${phone ? '390' : '1600'}.jpg`);
        await page.locator('#f').screenshot({ path: file, type: 'jpeg', quality: phone ? 80 : 84 });
        report(file);
        await page.close();
      }
    }
  }
  if (what === 'sheets' || what === 'all') {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1200 } });
    for (let part = 1; ; part++) {
      await page.goto(pathToFileURL(join(here, 'sheet.html')).href + '?part=' + part);
      await ready(page);
      for (const q of [84, 76, 68, 60, 52]) {
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
