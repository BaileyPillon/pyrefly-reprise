// Screenshot the fb-0929 Sphere Grid option mockups at real resolution (JPEG).
// Needs the dev server from the repo root: `npx vite --port 8130 --host 127.0.0.1`,
// because the pages load the game's own tokens, fonts and portraits from it.
// Run: node docs/concepts/fb-0929/sphere/capture.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.env.MOCK_BASE ?? 'http://127.0.0.1:8130/docs/concepts/fb-0929/sphere/';
const pages = [
  ['option-a-explainer', 1600, 900, 1],
  ['option-b-layout', 1600, 900, 1],
  ['option-c-autolearn', 1600, 900, 1],
  ['option-b-phone', 390, 844, 3],
];
const browser = await chromium.launch({ headless: true });
for (const [name, width, height, dpr] of pages) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto(`${base}${name}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${here}/${name}.jpg`, type: 'jpeg', quality: 88 });
  await ctx.close();
  console.log('wrote', name);
}
await browser.close();
