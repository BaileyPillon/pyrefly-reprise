// Opening probe (focused review eaf599d0c): boss card / HUD timeline under real or set-up start. usage: node opening-probe.mjs <base> <outdir> <name> <chapter|demoN> <w> <h> [query]
import { openRoute } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const [base, out, name, ch, W, H, q = ''] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
process.env.PYREFLY_QUERY = q;
const { browser, page, consoleErrors } = await openRoute({ base, width: +W, height: +H });
const r = { name, ch, size: `${W}x${H}`, query: q };
const sampler = () => {
  window.__tl = []; const t0 = performance.now();
  const hudVis = () => { const e = document.querySelector('.f1-ribbon, .ig-bosshp, .ffx2hud__enemies, .ctb, [class*=party]'); if (!e) return null; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !e.closest('[hidden]'); };
  const tick = () => { const b = document.querySelector('.bstart'); const ld = document.querySelector('[class*=loadingcard], [class*=lcard], .fe-loading');
    const s = window.__pyrefly; let aw = null; try { aw = s.battle?.()?.awaitingMenu ?? null; } catch {}
    window.__tl.push({ t: Math.round(performance.now() - t0), card: b ? (b.classList.contains('bstart--leaving') ? 'leaving' : 'up') : 'none', ld: !!ld, hud: hudVis(), aw, scr: s.screen?.() });
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
try {
  await page.evaluate(sampler);
  if (ch.startsWith('demo')) {
    // booth path: title -> picker by real keys, then the card by a real press
    await page.waitForFunction(() => window.__pyrefly.screen() === 'title', null, { timeout: 30000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => /chapter|select|board/i.test(window.__pyrefly.screen()), null, { timeout: 30000 });
    r.pickerScreen = await page.evaluate(() => window.__pyrefly.screen());
    await page.waitForTimeout(+(process.env.PICKER_WAIT ?? 1000));
    if (ch === 'demo4') await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${name}-picker.jpg`, type: 'jpeg', quality: 70 });
    await page.keyboard.press('Enter');
    r.pressAt = await page.evaluate(() => window.__tl.at(-1).t);
  } else {
    await page.evaluate((c) => { window.__pyrefly.setSeed(1); window.__pyrefly.gotoChapter(c, { skipCutscenes: true }); }, ch);
  }
  // shots as the card leaves
  let shots = 0; const t0 = Date.now(); let left = false;
  while (Date.now() - t0 < 40000) {
    const st = await page.evaluate(() => ({ c: window.__tl.at(-1), up: !!document.querySelector('.bstart'), lv: !!document.querySelector('.bstart--leaving'), aw: window.__pyrefly.battle?.()?.awaitingMenu === true, scr: window.__pyrefly.screen() }));
    if (st.lv && shots < 3) { await page.screenshot({ path: `${out}/${name}-leave${shots}.jpg`, type: 'jpeg', quality: 70 }); shots++; left = true; }
    if (st.aw && st.scr === 'battle') { r.awaitingMenu = true; break; }
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-menu.jpg`, type: 'jpeg', quality: 80 });
  const tl = await page.evaluate(() => window.__tl);
  fs.writeFileSync(`${out}/${name}-timeline.json`, JSON.stringify(tl));
  const first = (f) => tl.find(f)?.t ?? null;
  const cardUp = first((x) => x.card === 'up'), leaving = first((x) => x.card === 'leaving'), gone = tl.find((x, i) => x.card === 'none' && i > 0 && tl[i - 1].card !== 'none')?.t ?? null;
  const ldUp = first((x) => x.ld), ldGone = tl.find((x, i) => i > 0 && !x.ld && tl[i - 1].ld)?.t ?? null;
  const hudDownAt = tl.find((x, i) => x.hud === false && i > 0 && tl[i - 1].hud === true)?.t ?? null;
  const hudUpAgain = hudDownAt === null ? null : tl.find((x) => x.t > hudDownAt && x.hud === true)?.t ?? null;
  Object.assign(r, { cardUp, leaving, gone, holdMs: cardUp !== null && leaving !== null ? leaving - cardUp : null, loadingCardMs: ldUp !== null && ldGone !== null ? ldGone - ldUp : null, hudDownAt, hudUpAgain, hudDownRelativeToLeaving: hudDownAt !== null && leaving !== null ? hudDownAt - leaving : null, shots, left, awaitingMenu: r.awaitingMenu ?? false, samples: tl.length, hudNullAlways: tl.every((x) => x.hud === null) });
} catch (e) { r.error = String(e).slice(0, 300); }
r.consoleErrors = consoleErrors.length; r.errs = consoleErrors.slice(0, 3);
fs.appendFileSync(`${out}/opening.ndjson`, JSON.stringify(r) + '\n'); console.log(JSON.stringify(r));
await browser.close();
