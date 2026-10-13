// Live build 7b2582e7: do the chapter board's images (the card art and the party portraits) load on an idle link?
// A contended smoke shot of the FFX-2 Chapter IV card showed the party's portraits still on their silhouettes with alt text; this reads every <img>
// on the board 3 s and 6 s after it opens (complete, naturalWidth) and shoots it. Fresh headless Chromium, PYREFLY_BROWSER=gpu, 1600x900, real keys.
import fs from 'node:fs';

import { assertScreen, MODE, open } from '../runner/lib/lib.mjs';

const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const OUT = 'D:/Tools/pyrefly-scratch/shots-7b2582e7';
const RESULT = process.env.BOARD_JSON || 'D:/Tools/pyrefly-scratch/live-board-7b2582e7.json';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const selId = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
const imgs = (p) => p.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.getBoundingClientRect().width > 0).map((i) => ({ alt: i.alt.slice(0, 20), src: (i.currentSrc || i.src).split('/').slice(-2).join('/').slice(0, 60), complete: i.complete, w: i.naturalWidth })));
const R = { review: 'live-board', sha: '7b2582e7', browserMode: MODE, viewport: '1600x900', startedAt: new Date().toISOString(), cards: {} };
const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
const { page } = c;
try {
  await assertScreen(page, 'title', 60000);
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) { await page.waitForTimeout(500); if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter'); }
  await assertScreen(page, 'chapter-select', 15000);
  const t0 = Date.now();
  for (const id of ['seymour-flux', 'ffx2-bahamut']) {
    for (const [key, n] of [['ArrowRight', 60], ['ArrowLeft', 80]]) {
      let hit = false;
      for (let i = 0; i <= n; i++) { if ((await selId(page)) === id) { hit = true; break; } await page.keyboard.press(key); await page.waitForTimeout(150); }
      if (hit) break;
    }
    if ((await selId(page)) !== id) throw new Error(`ASSERT-FAIL card ${id} not reached`);
    await page.waitForTimeout(3000);
    const at3 = await imgs(page);
    await page.waitForTimeout(3000);
    const at6 = await imgs(page);
    await page.screenshot({ path: `${OUT}/board-idle-${id}.jpg`, type: 'jpeg', quality: 85 });
    R.cards[id] = {
      screen: await scr(page),
      selected: await selId(page),
      msSinceBoardOpened: Date.now() - t0,
      imgsAt3s: { n: at3.length, notLoaded: at3.filter((i) => !i.complete || i.w === 0) },
      imgsAt6s: { n: at6.length, notLoaded: at6.filter((i) => !i.complete || i.w === 0), sample: at6.slice(0, 8) },
    };
    log(id, 'images', at6.length, 'not loaded at 3 s:', R.cards[id].imgsAt3s.notLoaded.length, 'at 6 s:', R.cards[id].imgsAt6s.notLoaded.length);
  }
  R.status = 'ran';
} catch (e) {
  R.status = 'error';
  R.error = String(e && e.message ? e.message : e).slice(0, 300);
  log('!! error', R.error);
} finally {
  R.consoleErrors = c.consoleErrors.slice();
  R.notFound = c.notFound.slice();
  fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
  await c.browser.close();
}
console.log(JSON.stringify({ status: R.status, error: R.error, cards: Object.fromEntries(Object.entries(R.cards).map(([k, v]) => [k, { n: v.imgsAt6s.n, notLoadedAt3s: v.imgsAt3s.notLoaded, notLoadedAt6s: v.imgsAt6s.notLoaded }])), consoleErrors: R.consoleErrors.length, notFound: R.notFound.length }, null, 1));
