import { open, waitBattleMenu } from './critic/runner/lib/lib.mjs';
const E = 'D:/pyrefly-release55/critic/reviews/04631aedf-focused/shots';
const r = await open({ base: 'http://127.0.0.1:5871/', width: 390, height: 844, touch: true });
const { page } = r; const scr = () => page.evaluate(() => window.__pyrefly.screen());
await page.keyboard.press('Enter'); await page.waitForTimeout(900); await page.keyboard.press('Escape'); await page.keyboard.press('Enter');
let t0 = Date.now(); while (Date.now()-t0 < 120000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(450); }
await waitBattleMenu(page, 100000);
let best = null, shots = 0;
const t1 = Date.now();
while (Date.now()-t1 < 150000 && (await scr()) === 'battle') {
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  const m = await page.evaluate(() => { const e = document.querySelector('.eint__body'); if (!e || !e.getBoundingClientRect().height) return null; const cs = getComputedStyle(e); const h = e.getBoundingClientRect().height; return { text: e.innerText.slice(0,80), h, lh: parseFloat(cs.lineHeight)||0, lines: cs.lineHeight==='normal'?null:Math.round(h/parseFloat(cs.lineHeight)), clamp: cs.webkitLineClamp, overflowX: document.documentElement.scrollWidth > innerWidth+1 }; });
  if (m && (!best || m.text.length > best.text.length)) { best = m; await page.screenshot({ path: `${E}/phone-enemymove.png` }); }
  await page.waitForTimeout(300);
}
console.log(JSON.stringify(best), JSON.stringify(r.consoleErrors));
await r.browser.close();
