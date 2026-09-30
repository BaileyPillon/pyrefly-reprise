// Renders every overlay page from gen.mjs headless, at its real resolution, to
// JPEG in the parent folder, plus close-up crops of the HP plates.
//   node render.mjs   (Playwright from the main checkout's node_modules)
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..');
// Plate close-ups: [x, y, w, h] in frame pixels; phone crops are rendered at 2x.
const CROPS = {
  'ffx-desktop': [985, 600, 590, 285],
  'ffx-phone': [0, 462, 390, 100],
  'x2-desktop': [1110, 630, 480, 260],
  'x2-phone': [0, 462, 390, 100],
};
const pages = readdirSync(HERE).filter((f) => /^o\d-.*\.html$/.test(f));
const browser = await chromium.launch({ headless: true });
for (const f of pages) {
  const name = f.replace(/\.html$/, '');
  const kind = name.slice(3);
  const phone = kind.endsWith('phone');
  const [W, H] = phone ? [390, 844] : [1600, 900];
  for (const scale of phone ? [1, 2] : [1]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: scale });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(HERE, f)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    if (scale === 1) await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 88 });
    const [x, y, w, h] = CROPS[kind];
    if (scale === (phone ? 2 : 1)) await page.screenshot({ path: join(OUT, `${name}-plates.jpg`), type: 'jpeg', quality: 90, clip: { x, y, width: w, height: h } });
    await ctx.close();
  }
  console.log('rendered', name);
}
// The "today" plate crops, from the frames themselves.
for (const kind of Object.keys(CROPS)) {
  const phone = kind.endsWith('phone');
  const [W, H] = phone ? [390, 844] : [1600, 900];
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1 });
  const page = await ctx.newPage();
  await page.setContent(`<style>html,body{margin:0}</style><img src="${pathToFileURL(join(OUT, 'frames', `${kind}-today.jpg`)).href}" style="display:block;width:${W}px;height:${H}px">`);
  await page.waitForTimeout(200);
  const [x, y, w, h] = CROPS[kind];
  await page.screenshot({ path: join(OUT, `today-${kind}-plates.jpg`), type: 'jpeg', quality: 90, clip: { x, y, width: w, height: h } });
  await ctx.close();
}
await browser.close();
