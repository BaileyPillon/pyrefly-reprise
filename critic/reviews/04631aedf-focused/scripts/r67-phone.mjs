import fs from 'node:fs';
import { open, waitBattleMenu } from './critic/runner/lib/lib.mjs';
const [,, label, navCsv, query=''] = process.argv;
const E = 'D:/pyrefly-release55/critic/reviews/04631aedf-focused/shots';
const r = await open({ base: (process.env.BASE||'http://127.0.0.1:5871/') + query, width: 390, height: 844, touch: true });
const { page } = r;
const scr = () => page.evaluate(() => window.__pyrefly.screen());
await page.keyboard.press('Enter'); await page.waitForTimeout(900); await page.keyboard.press('Escape');
for (const k of navCsv ? navCsv.split(',') : []) { await page.keyboard.press(k); await page.waitForTimeout(450); }
await page.keyboard.press('Enter');
let t0 = Date.now();
while (Date.now() - t0 < 120000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(450); }
await waitBattleMenu(page, 100000); await page.waitForTimeout(6000);
await page.screenshot({ path: `${E}/${label}-phone-menu.png` });
const info = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > innerWidth + 1,
  buttons: [...document.querySelectorAll('button,[role=button]')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map(b => (b.innerText||'').trim().slice(0,14) + ':' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).slice(0, 14) }));
console.log(label, JSON.stringify(info), JSON.stringify(r.consoleErrors));
// tap Attack by touch
const hit = await page.evaluate(() => { const b = [...document.querySelectorAll('button,[role=button],li,div')].find(e => /^attack/i.test((e.innerText||'').trim()) && e.getBoundingClientRect().width > 0 && e.children.length < 4); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height }; });
console.log('attack-rect', JSON.stringify(hit));
if (hit) { await page.touchscreen.tap(hit.x, hit.y); await page.waitForTimeout(800); await page.screenshot({ path: `${E}/${label}-phone-tap1.png` }); }
await r.browser.close();
