// Sin art options, 2026-09-29 (FFX only): render the rough 1600x900 battle frames listed in a jobs file, and the
// phone-readable sheet parts. Headless Chromium from node (PYREFLY_BROWSER=gpu honoured), file:// only: no dev
// server, no game build. From the repo root:
//   node docs/concepts/chapters/sin-2026-09-29/src/render.mjs frames <jobs.json>
//   node docs/concepts/chapters/sin-2026-09-29/src/render.mjs sheets
// jobs.json: [{ "out": "frames/<name>.jpg", "q": { "kind": "fin", "img": "<abs path>", ... } }, ...]
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, statSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const what = process.argv[2] || 'frames';
const args = process.env.PYREFLY_BROWSER === 'gpu' ? ['--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args });
const report = (p) => console.log(p, Math.round(statSync(p).size / 1024) + ' KB');
const ready = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
};
try {
  if (what === 'frames') {
    const jobs = JSON.parse(readFileSync(resolve(process.argv[3]), 'utf8'));
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    for (const j of jobs) {
      const q = new URLSearchParams({ ...j.q, img: pathToFileURL(j.q.img).href });
      await page.goto(pathToFileURL(join(here, 'frame.html')).href + '?' + q);
      await ready(page);
      const file = join(root, j.out);
      mkdirSync(dirname(file), { recursive: true });
      await page.locator('#f').screenshot({ path: file, type: 'jpeg', quality: 84 });
      report(file);
    }
    await page.close();
  }
  if (what === 'sheets') {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1200 } });
    for (let part = 1; ; part++) {
      await page.goto(pathToFileURL(join(root, 'options.html')).href + '?part=' + part);
      await ready(page);
      for (const q of [84, 76, 68, 60, 52]) {
        const file = join(root, `part-${part}.jpg`);
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
