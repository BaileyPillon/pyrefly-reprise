// Hi-fi round: put the A+ HUD over each composed scene with ONE headless Chromium run (no dev server).
// Desk at 1x (1600x900), phone at 2x (390x844 CSS = 780x1688). Usage:
//   node render-frames.mjs <sceneDir> <outPrefix> [<sceneDir> <outPrefix> ...]
// Each sceneDir holds scene-1600.png, scene-390@2x.png and marks.json (compose.py).
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const browser = await chromium.launch();
try {
  for (let i = 0; i < args.length; i += 2) {
    const [dir, prefix] = [args[i], args[i + 1]];
    const m = JSON.parse(readFileSync(join(dir, 'marks.json'), 'utf8'));
    for (const [mode, dpr, file, mk, k] of [['desk', 1, 'scene-1600.png', m.desk, 1], ['phone', 2, 'scene-390@2x.png', m.phone, 0.5]]) {
      const page = await browser.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: dpr });
      await page.goto(pathToFileURL(join(here, 'frame.html')).href);
      const c = mk.cloud; // [x0, y0, w, h] in scene pixels
      const tri = [(c[0] + c[2] * 0.5) * k, (c[1] - 6) * k];
      await page.evaluate(async ([u, md, t]) => { await build(u, md, t); }, [pathToFileURL(join(dir, file)).href, mode, tri]);
      await page.locator('#s').screenshot({ path: `${prefix}-${mode === 'desk' ? '1600' : '390'}.png` });
      await page.close();
    }
    console.log('rendered', prefix);
  }
} finally { await browser.close(); }
