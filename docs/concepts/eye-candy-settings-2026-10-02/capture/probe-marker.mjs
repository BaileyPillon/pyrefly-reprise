// Is the OPTIONS cursor dot (.pause__row--sel::before, margin-left -13px) clipped by the settings column's overflow?
import { mkdirSync } from 'node:fs';
import { openBattle, openOptions, OUT } from './lib.mjs';
mkdirSync(OUT + 'shots', { recursive: true });
const { browser, page } = await openBattle('ffx', 'desk');
await openOptions(page);
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(500);
for (let i = 0; i < 7; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); }
await page.waitForTimeout(400);
const info = await page.evaluate(() => {
  const col = document.querySelector('.pause__col[data-col="settings"]');
  const sel = document.querySelector('.pause__row--sel');
  const cs = getComputedStyle(col);
  const before = getComputedStyle(sel, '::before');
  const r = sel.getBoundingClientRect();
  return { overflowX: cs.overflowX, overflowY: cs.overflowY, selRow: sel.dataset.row, rowBox: [r.left, r.top, r.width, r.height], before: { w: before.width, left: before.left, ml: before.marginLeft, bg: before.backgroundColor, pos: before.position } };
});
console.log(JSON.stringify(info));
await page.screenshot({ path: OUT + 'shots/_probe-marker-clipped.png', clip: { x: 30, y: 500, width: 260, height: 100 } });
await page.evaluate(() => { document.querySelector('.pause__col[data-col="settings"]').style.overflow = 'visible'; document.querySelector('.pause__col[data-col="settings"]').style.maskImage = 'none'; });
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + 'shots/_probe-marker-visible.png', clip: { x: 30, y: 500, width: 260, height: 100 } });
await browser.close();
