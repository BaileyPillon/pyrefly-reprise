// each B word loads and plays to the first menu with 0 console errors. usage: node words-probe.mjs <base> <out> <chapter> <set>
import { openRoute } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const [base, out, ch, set] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const ALL = ['', 'stance=v1a', 'stance=v1b', 'stance=v3', 'swapcause=cut', 'swapcause=blend3', 'swapcause=pick', 'swapcause=cut&swapclass=hit,contact', 'swapcause=cut&swapscope=all', 'hit=ramp', 'hit=knock', 'run=smooth', 'run=flow', 'run=pace', 'rigko=whole', 'kotopple=eased', 'hurtstring=hold', 'summon=leap', 'ramps=smooth', 'shakeband=band', 'strikeshape=travel', 'fluidui=on', 'stance=v3&swapcause=pick&swapscope=all&hit=knock&run=pace&rigko=whole&kotopple=eased&hurtstring=hold&summon=leap&ramps=smooth&shakeband=band&fluidui=on'];
const qs = set === 'z' ? [ALL[0], ALL.at(-1)] : set === 'a' ? ALL.slice(0, 12) : ALL.slice(12);
const res = [];
for (const q of qs) {
  process.env.PYREFLY_QUERY = q ? '?' + q : '';
  const { browser, page, consoleErrors } = await openRoute({ base, width: 1600, height: 900 });
  const r = { q, ch };
  try {
    await page.evaluate((c) => { window.__pyrefly.setSeed(1); window.__pyrefly.gotoChapter(c, { skipCutscenes: true }); }, ch);
    let ok = false;
    for (let i = 0; i < 80 && !ok; i++) { await page.waitForTimeout(500); ok = await page.evaluate(() => window.__pyrefly.screen() === 'battle' && window.__pyrefly.snapshotState?.()?.screenState?.playback?.awaitingMenu === true).catch(() => false); }
    r.firstMenu = ok; r.screen = await page.evaluate(() => window.__pyrefly.screen());
    if (ok) { // press Enter (Attack) real key then wait a few seconds: the first action plays
      await page.waitForTimeout(600);
      await page.keyboard.press('Enter'); await page.waitForTimeout(400); await page.keyboard.press('Enter'); await page.waitForTimeout(4500);
      r.afterAction = await page.evaluate(() => ({ scr: window.__pyrefly.screen(), aw: window.__pyrefly.snapshotState?.()?.screenState?.playback?.awaitingMenu }));
    }
    const name = (q || 'default').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    await page.screenshot({ path: `${out}/${ch}-${name}.jpg`, type: 'jpeg', quality: 60 });
  } catch (e) { r.error = String(e).slice(0, 200); }
  r.errors = consoleErrors.length; r.errs = consoleErrors.slice(0, 2).map(String).map((s) => s.slice(0, 160));
  res.push(r); console.log(JSON.stringify(r)); await browser.close();
}
fs.writeFileSync(`${out}/words-${ch}-${set}.json`, JSON.stringify(res, null, 1));
