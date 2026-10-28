// B-switch probe (focused review 2b48cee95): load a chapter with an address word, read the switches the page reports, play to the first command menu with the menu flag snapshotState().screenState.playback.awaitingMenu, count console errors. usage: node bprobe.mjs <base> <outdir> <tag> <chapter> <w> <h> <query>
import { openRoute } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const [base, out, tag, ch, W, H, q = ''] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
process.env.PYREFLY_QUERY = q;
const { browser, page, consoleErrors } = await openRoute({ base, width: +W, height: +H });
const r = { tag, ch, query: q, size: `${W}x${H}` };
try {
  await page.evaluate((c) => { window.__pyrefly.setSeed(1); window.__pyrefly.gotoChapter(c, { skipCutscenes: true }); }, ch);
  const t0 = Date.now(); let menu = false;
  while (Date.now() - t0 < 60000) {
    const st = await page.evaluate(() => { const s = window.__pyrefly; let aw = null; try { aw = s.snapshotState()?.screenState?.playback?.awaitingMenu ?? null; } catch {} return { aw, scr: s.screen() }; });
    if (st.aw === true && st.scr === 'battle') { menu = true; r.screen = st.scr; break; }
    await page.waitForTimeout(100);
  }
  r.menu = menu; r.msToMenu = Date.now() - t0;
  await page.waitForTimeout(700);
  r.switches = await page.evaluate(() => { const p = window.__pyrefly; const o = {}; try { o.move = p.move?.(); } catch (e) { o.moveErr = String(e).slice(0, 80); } try { o.swap = p.swapSwitch?.(); } catch (e) { o.swapErr = String(e).slice(0, 80); } return o; });
  r.asserted = await page.evaluate(() => ({ screen: window.__pyrefly.screen(), chapter: window.__pyrefly.snapshotState()?.chapter ?? window.__pyrefly.snapshotState()?.chapterId ?? null }));
  await page.screenshot({ path: `${out}/${tag}.jpg`, type: 'jpeg', quality: 78 });
} catch (e) { r.error = String(e).slice(0, 300); }
r.consoleErrors = consoleErrors.length; r.errs = consoleErrors.slice(0, 3).map(String).map((s) => s.slice(0, 160));
fs.appendFileSync(`${out}/bprobe.ndjson`, JSON.stringify(r) + '\n'); console.log(JSON.stringify(r));
await browser.close();
