// Focused review f91ff81d0, job B: layout of the two hidden chapters and chapter I at other sizes; real key / touch input after a gotoChapter set-up (named debug aid).
import fs from 'node:fs';
import { open, waitBattleMenu, commandRows } from '../../runner/lib/lib.mjs';

const E = 'D:/pyrefly-release55/critic/reviews/f91ff81d0-focused/shots';
const base = 'http://127.0.0.1:5871/';
const out = [];
for (const [chapter, W, H, touch] of [['spectral-keeper', 390, 844, true], ['ffx2-fallen-maesters', 390, 844, true], ['spectral-keeper', 2000, 1012, false], ['ffx2-fallen-maesters', 2000, 1012, false], ['seymour-omnis', 1600, 900, false]]) {
  const r = await open({ base, width: W, height: H, touch });
  const { page } = r;
  const scr = () => page.evaluate(() => window.__pyrefly.screen());
  await page.evaluate((c) => { window.__pyrefly.setSeed(7); window.__run = window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, seed: 7 }); }, chapter);
  const t0 = Date.now();
  while (Date.now() - t0 < 60000 && (await scr()) !== 'battle') await page.waitForTimeout(400);
  const rec = { chapter, W, H, screen: await scr() };
  if (rec.screen === 'battle') {
    let menu = null;
    for (let i = 0; i < 12 && !menu; i++) { try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); } }
    rec.menu = !!menu;
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${E}/${chapter}-${W}-layout-menu.png` });
    rec.overflowX = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    rec.rows = (await commandRows(page)).rows.map((x) => x.text);
    rec.intentCards = await page.evaluate(() => [...document.querySelectorAll('.eint__dmg')].map((e) => e.textContent.trim().slice(0, 60)).slice(0, 8));
  }
  rec.consoleErrors = r.consoleErrors; rec.notFound = r.notFound;
  console.log(JSON.stringify(rec));
  out.push(rec);
  await r.browser.close();
}
fs.writeFileSync(`${E}/layout.json`, JSON.stringify(out, null, 1));
