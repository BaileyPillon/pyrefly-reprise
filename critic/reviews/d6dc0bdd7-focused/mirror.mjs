import { open, waitBattleMenu, commandRows, assertScreen, shoot, state } from '../../runner/lib/lib.mjs';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:5612/';
const EV = 'M:/pyrefly-ch-angra-mainyu/critic/reviews/d6dc0bdd7-focused';
const out = {};
for (const [w, h, touch] of [[1600, 900, false], [2000, 1012, false], [390, 844, true]]) {
  const key = `${w}x${h}`;
  const { browser, page, consoleErrors, notFound, net } = await open({ base: BASE, width: w, height: h, touch });
  const o = out[key] = {};
  try {
    await page.evaluate(() => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); void p.gotoChapter('mirror-aeons', { skipCutscenes: true, skipPrep: true, seed: 1 }); });
    await waitBattleMenu(page, 180000);
    await page.waitForTimeout(2500);
    await assertScreen(page, 'battle');
    o.rows = (await commandRows(page)).rows.map((r) => r.text);
    o.foes = await page.evaluate(() => { const s = window.__pyrefly.battleState?.(); return s ? JSON.stringify(s).match(/"name":"[^"]+"/g)?.slice(0, 12) : null; });
    await shoot(page, EV, `mirror-${key}-menu.png`, { asserted: 'mirror-aeons battle, command menu awaiting', check: 'CHK-016' });
    // real input: attack a few turns
    for (let t = 0; t < 4; t++) {
      await waitBattleMenu(page, 120000); await page.waitForTimeout(800);
      if (touch) { const rs = (await commandRows(page)).rows; await page.touchscreen.tap(60, 610); } else await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      if (!touch) await page.keyboard.press('Enter');
      await page.waitForTimeout(3500);
    }
    o.log = await page.evaluate(() => window.__pyrefly.battleLog().length);
    await shoot(page, EV, `mirror-${key}-after4.png`, { asserted: 'mirror-aeons after 4 real-input turns', check: 'CHK-016' });
    o.guideHasInGameDescription = await page.evaluate(() => /In Game Description/i.test(document.body.innerText));
  } catch (e) { o.error = String(e).slice(0, 400); try { await page.screenshot({ path: `${EV}/mirror-${key}-error.png` }); } catch {} }
  o.consoleErrors = consoleErrors.slice(0, 6); o.notFound = notFound.slice(0, 6); o.mirrorBackdropReq = net.filter((u) => /mirror|dark|backdrop/i.test(u)).slice(0, 12);
  await browser.close();
}
fs.writeFileSync(EV + '/mirror.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
