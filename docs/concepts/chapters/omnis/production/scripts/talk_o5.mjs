// Production dialogue frame (FFX only): Chapter VII's pre-battle dialogue with Seymour's portrait served as the
// INSTALLED Omnis portrait and the backdrop as the INSTALLED Garden of Pain plate (request interception only).
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const [out] = process.argv.slice(2);
const A = 'D:/Final Fantasy/public/art/';
const VW = +(process.env.VW || 1600), VH = +(process.env.VH || 900);
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: VW < 600 ? 2 : 1 });
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
const png = (p) => ({ status: 200, contentType: 'image/png', body: readFileSync(p) });
await page.route('**/art/backdrops/macalania-temple.png*', (r) => r.fulfill(png(A + 'backdrops/garden-of-pain.png')));
await page.route('**/art/portraits/seymour-macalania.png*', (r) => r.fulfill(png(process.env.PORTRAIT)));
await page.goto('http://127.0.0.1:5741/', { waitUntil: 'commit', timeout: 180000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
await page.evaluate(() => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('seymour-anima-macalania'); });
let found = false;
for (let i = 0; i < 80 && !found; i++) {
  await page.waitForTimeout(1500);
  found = await page.evaluate(() => [...document.querySelectorAll('img')].some((im) => im.src.includes('seymour-macalania.png') && im.getBoundingClientRect().width > 20 && getComputedStyle(im).opacity !== '0'));
  if (!found) await page.keyboard.press('Enter');
}
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const map = { Seymour: 'Seymour' };
  const walk = (n) => { if (n.nodeType === 3) { const t = n.textContent.trim(); if (map[t]) n.textContent = n.textContent.replace(t, map[t]); } else for (const c of n.childNodes) walk(c); };
  walk(document.body);
});
await page.screenshot({ path: out });
console.log('talk found', found, out);
await browser.close();
