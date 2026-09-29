// Sin's head options, 2026-09-29 (FFX only): the rough battle frames (1600x900, and a 390x844 phone at 2x) for each
// mouth stage of one option, from its rig's stage composites in D:/Tools/pyrefly-art-backup, and the sheet parts.
// Headless Chromium (PYREFLY_BROWSER=gpu honoured), file:// only: no dev server, no game build. From the repo root:
//   node docs/concepts/chapters/sin-2026-09-29/head/src/render.mjs frames C     (option C, repaired)
//   node docs/concepts/chapters/sin-2026-09-29/head/src/render.mjs frames A     (option A, head-on)
//   node docs/concepts/chapters/sin-2026-09-29/head/src/render.mjs sheets
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { statSync, mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'frames');
mkdirSync(out, { recursive: true });
const CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-29-sin';
const RIG = { C: `${CAND}/head-c/rig`, A: `${CAND}/head-a/rig` };
const [what = 'frames', opt = 'C'] = process.argv.slice(2);
const args = process.env.PYREFLY_BROWSER === 'gpu' ? ['--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ args });
const report = (p) => console.log(p, Math.round(statSync(p).size / 1024) + ' KB');
const ready = async (page) => {
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
};
try {
  if (what === 'frames') {
    for (let stage = 0; stage < 5; stage++) {
      const q = new URLSearchParams({ stage: String(stage), opt, img: pathToFileURL(`${RIG[opt]}/stage-${stage}.jpg`).href });
      for (const mode of ['desk', 'phone']) {
        const phone = mode === 'phone';
        const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
        q.set('mode', mode);
        await page.goto(pathToFileURL(join(here, 'frame.html')).href + '?' + q);
        await ready(page);
        const file = join(out, `${opt}-s${stage}-${phone ? '390' : '1600'}.jpg`);
        await page.locator('#f').screenshot({ path: file, type: 'jpeg', quality: phone ? 80 : 84 });
        report(file);
        await page.close();
      }
    }
  }
  if (what === 'sheets') {
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
