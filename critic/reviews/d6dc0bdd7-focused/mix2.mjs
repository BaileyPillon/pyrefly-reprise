import { open, waitBattleMenu, commandRows, assertScreen, shoot } from '../../runner/lib/lib.mjs';
import fs from 'node:fs';
const BASE = 'http://127.0.0.1:5612/';
const EV = 'M:/pyrefly-ch-angra-mainyu/critic/reviews/d6dc0bdd7-focused';
const out = {};
for (const [w, h, touch] of [[1600, 900, false]]) {
  const key = `${w}x${h}`;
  const { browser, page, consoleErrors, notFound } = await open({ base: BASE, width: w, height: h, touch });
  try {
    await page.evaluate(() => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); void p.gotoChapter('ffx2-trema', { skipCutscenes: true, skipPrep: true, seed: 1 }); });
    let found = null;
    for (let turn = 0; turn < 12 && !found; turn++) {
      await waitBattleMenu(page, 150000);
      await page.waitForTimeout(1500);
      await assertScreen(page, 'battle');
      const { rows } = await commandRows(page);
      const mix = rows.find((r) => /mix/i.test(r.text));
      if (mix) { found = { rows, turn }; break; }
      await page.keyboard.press('Enter'); // Attack
      await page.waitForTimeout(400);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    if (!found) { out[key] = { error: 'no Mix row reached in 12 turns' }; continue; }
    await page.waitForTimeout(1600); const l0 = await page.evaluate(() => window.__pyrefly.battleLog().length); await page.waitForTimeout(1600); const l1 = await page.evaluate(() => window.__pyrefly.battleLog().length); out.control = l1-l0; const logBefore = l1;
    // select Mix by arrow keys (desktop) and read help
    const idx = found.rows.findIndex((r) => /mix/i.test(r.text));
    const cur = found.rows.findIndex((r) => r.selected);
    if (!touch) for (let i = 0; i < Math.abs(idx - cur); i++) await page.keyboard.press(idx > cur ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.ig-cmd')].find((e) => /mix/i.test(e.textContent));
      const r = el.getBoundingClientRect();
      const reason = el.querySelector('[class*="reason"]');
      const rr = reason?.getBoundingClientRect();
      return { text: el.textContent.trim(), cls: el.className, disabled: el.classList.contains('ig-cmd--disabled'), clipped: reason ? reason.scrollWidth > reason.clientWidth : null, reasonW: rr?.width, reasonSW: reason?.scrollWidth, box: [r.x, r.y, r.width, r.height], help: document.body.innerText.match(/Not built[^\n]*/i)?.[0] ?? null };
    });
    await shoot(page, EV, `mix-${key}-selected2.png`, { asserted: `ffx2-trema battle, Mix row shown, rows=${found.rows.map((r) => r.text).join('|')}`, check: 'mix row' });
    if (touch) { const b = info.box; await page.touchscreen.tap(b[0] + b[2] / 2, b[1] + b[3] / 2); } else await page.keyboard.press('Enter');
    await page.waitForTimeout(800);
    if (!touch) { await page.mouse.click(info.box[0] + info.box[2] / 2, info.box[1] + info.box[3] / 2); await page.waitForTimeout(800); }
    const after = await commandRows(page);
    const evs = await page.evaluate((n)=>window.__pyrefly.battleLog().slice(n).map(e=>e.type+':'+(e.actor??e.source??'')+':'+(e.command??e.ability??'')), logBefore); out.evs=evs; const logAfter = await page.evaluate(() => window.__pyrefly.battleLog().length);
    out[key] = { info, rowsBefore: found.rows.map((r) => `${r.text}${r.disabled ? '(dis)' : ''}`), menuStillOpen: after.rows.length > 0, logDelta: logAfter - logBefore, turn: found.turn };
  } catch (e) { out[key] = { error: String(e) }; }
  out[key + '-net'] = { consoleErrors: consoleErrors.slice(0, 5), notFound: notFound.slice(0, 5) };
  await browser.close();
}
fs.writeFileSync(EV + '/mix2.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
