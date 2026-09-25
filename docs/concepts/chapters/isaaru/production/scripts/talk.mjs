// A real Chapter VII story frame at Seymour's first line, Isaaru's INSTALLED portrait served in its place by interception.
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const [portrait, out, w, h] = process.argv.slice(2);
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: +(w||1600), height: +(h||900) }, deviceScaleFactor: (+w||1600) < 600 ? 2 : 1 });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.route('**/art/portraits/seymour-macalania.png*', r => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(portrait) }));
if (process.env.PLATE) await page.route('**/art/backdrops/macalania-temple.png*', r => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(process.env.PLATE) }));
await page.goto('http://127.0.0.1:5781/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(() => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('seymour-anima-macalania'); });
let found = false;
for (let i = 0; i < 80 && !found; i++) {
  await page.waitForTimeout(1500);
  found = await page.evaluate(() => [...document.querySelectorAll('img')].some(im => im.src.includes('seymour-macalania.png') && im.getBoundingClientRect().width > 20 && getComputedStyle(im).opacity !== '0'));
  if (!found) await page.evaluate(() => window.__pyrefly.advanceCutscene());
}
await page.waitForTimeout(2500);
const swapped = await page.evaluate(() => {
  let n = 0;
  const walk = (el) => { if (el.nodeType === 3) { const t = el.textContent.trim(); if (/^Seymour$/i.test(t)) { el.textContent = el.textContent.replace(t, t === t.toUpperCase() ? 'ISAARU' : 'Isaaru'); n++; } } else for (const c of el.childNodes) walk(c); };
  walk(document.body);
  // the line itself: a stand-in (no story text is written for this round: the B17 draft comes first)
  for (const e of document.querySelectorAll('body *')) {
    if (e.children.length) continue; const t = e.textContent.trim();
    if (t === 'Guardians. You are early.') { e.textContent = '(His line comes from the story draft. None is written for this round.)'; e.style.fontStyle = 'italic'; e.style.opacity = '0.75'; n++; }
    if (/^chapter vii/i.test(t)) { e.textContent = 'Chapter XIV (provisional) · Via Purifico · beneath Bevelle'; n++; }
    if (t === 'MAESTER' || t === 'Maester') { e.textContent = t === 'MAESTER' ? 'SUMMONER' : 'Summoner'; n++; }
  }
  return n;
});
console.log('swapped', swapped);
await page.screenshot({ path: out });
console.log('found', found, out);
await browser.close();
