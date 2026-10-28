import { openRoute } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const [base, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const cases = [
  ['ch1-390-phone', 'seymour-flux', 390, 844, '', true],
  ['ch4-390-phone', 'ffx2-bahamut', 390, 844, '', true],
  ['ch1-1600', 'seymour-flux', 1600, 900, '', false],
  ['ch1-390-wide', 'seymour-flux', 390, 844, '', false],
];
const res = [];
for (const [name, ch, w, h, q, touch] of cases) {
  process.env.PYREFLY_QUERY = q;
  const { browser, page, consoleErrors } = await openRoute({ base, width: w, height: h, touch });
  const r = { name, ch, size: `${w}x${h}`, q };
  try {
    await page.evaluate((c) => { window.__pyrefly.setSeed(1); window.__pyrefly.gotoChapter(c, { skipCutscenes: true }); }, ch);
    let ok = false;
    for (let i = 0; i < 60 && !ok; i++) { await page.waitForTimeout(500); ok = await page.evaluate(() => window.__pyrefly.screen() === 'battle' && window.__pyrefly.snapshotState?.()?.screenState?.playback?.awaitingMenu === true).catch(() => false); }
    r.awaitingMenu = ok;
    if (!ok) r.screen = await page.evaluate(() => window.__pyrefly.screen());
    await page.waitForTimeout(1500);
    Object.assign(r, await page.evaluate(() => {
      const vis = (el) => { if (!el) return false; const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && b.width > 0 && b.height > 0; };
      const q = (s) => [...document.querySelectorAll(s)];
      return {
        screen: window.__pyrefly.screen(),
        f1: !!document.querySelector('.hud-f1'),
        ribbons: q('.f1-ribbon').filter(vis).length,
        bossBars: q('.ig-bosshp, .ig-bosshp__track').filter(vis).length,
        ffx2Strip: q('.ffx2hud__enemies').filter(vis).length,
        guide: q('.sgd').filter(vis).length, intent: q('.mad').filter(vis).length,
        coachCards: q('[class*="coach"]').filter(vis).map((e) => (e.className + '').slice(0, 60) + ' | ' + (e.textContent || '').trim().slice(0, 50)),
        hscroll: document.documentElement.scrollWidth > innerWidth + 1,
      };
    }));
    await page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 82 });
  } catch (e) { r.error = String(e).slice(0, 200); }
  r.consoleErrors = consoleErrors.length; r.errs = consoleErrors.slice(0, 2);
  res.push(r); console.log(JSON.stringify(r));
  await browser.close();
}
fs.writeFileSync(`${out}/first-menu-2.json`, JSON.stringify(res, null, 1));
