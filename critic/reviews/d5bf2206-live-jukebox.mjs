// The pause menu's jukebox on the live build d5bf2206: src/ui/common/MusicPlayer.ts changed in this build so that the three retired compositions are no longer listed
// (their titles: 'The Unsent Hymn' = boss-dread, 'Rite Without End' = boss-yunalesca, 'Static Coronation' = boss-ffx2-aeon). Headless Chromium (PYREFLY_BROWSER=gpu), 1600x900, real keys
// for the pause and the tab walk; the battle is entered through the debug API (skipCutscenes, skipPrep) and labelled as such. Read-only: the rows are read from the DOM, one row is
// played with a real Enter to see what it requests.   node critic/reviews/d5bf2206-live-jukebox.mjs
import fs from 'node:fs';

import { assertScreen, MODE, open, waitBattleMenu } from '../runner/lib/lib.mjs';

const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const OUT = 'D:/Tools/pyrefly-scratch/2026-10-13/live-d5bf2206/jukebox.json';
const RETIRED = ['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca'];
const TITLES = ['The Unsent Hymn', 'Rite Without End', 'Static Coronation'];
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const R = { review: 'live-jukebox', sha: 'd5bf2206', browserMode: MODE, startedAt: new Date().toISOString(), debugAssisted: 'the battle is entered through gotoChapter (skipCutscenes, skipPrep); the pause and the tab walk are real key presses' };
const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
const { page } = c;
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const panel = () => page.evaluate((titles) => {
  const el = document.querySelector('.pause__music');
  if (!el) return { present: false };
  const t = el.textContent.replace(/\s+/g, ' ');
  const rows = [...el.querySelectorAll('[class*="row"]')].map((r) => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 60));
  return { present: true, chars: t.length, rowCount: rows.length, retiredTitlesListed: titles.filter((x) => t.includes(x)), first6: rows.slice(0, 6) };
}, TITLES);
try {
  await assertScreen(page, 'title', 90000);
  await page.evaluate(() => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true, seed: 1 }); });
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 150000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  R.screenAfterEscape = await scr();
  R.pauseState = await page.evaluate(() => { const s = window.__pyrefly.snapshotState()?.screenState ?? null; return s ? JSON.parse(JSON.stringify(s, (k, v) => (typeof v === 'string' && v.length > 80 ? v.slice(0, 80) : v))) : null; });
  log('pause state', JSON.stringify(R.pauseState).slice(0, 400));
  // walk the tabs with the arrow keys until the jukebox panel is in the DOM
  R.walk = [];
  for (let i = 0; i < 16; i++) {
    const p = await panel();
    R.walk.push({ i, present: p.present, tab: await page.evaluate(() => { const s = window.__pyrefly.snapshotState()?.screenState; return s?.tab ?? s?.tabId ?? s?.activeTab ?? null; }) });
    if (p.present) { R.panel = p; break; }
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(350);
  }
  if (!R.panel) {
    for (let i = 0; i < 16 && !R.panel; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(350);
      const p = await panel();
      if (p.present) R.panel = p;
    }
  }
  if (R.panel) {
    R.shot = 'jukebox.jpg';
    fs.writeFileSync('D:/Tools/pyrefly-scratch/2026-10-13/live-d5bf2206/shots/jukebox.jpg', await page.screenshot({ type: 'jpeg', quality: 85 }));
    // play the selected row with a real Enter and read what the mixer and the network did
    const before = c.net.length;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    R.played = await page.evaluate(() => { const d = window.__pyrefly.audioDebug(); return { playing: d.playing, gain: d.music.current?.gain ?? null }; });
    R.requestedByThePress = c.net.slice(before).filter((u) => /\/audio\//.test(u)).map((u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''));
  }
  R.status = R.panel ? 'ran' : 'jukebox panel not reached';
} catch (e) {
  R.status = 'error';
  R.error = String(e && e.message ? e.message : e).slice(0, 300);
  log('error', R.error);
} finally {
  R.audioRequests = [...new Set(c.net.filter((u) => /\/audio\//.test(u)).map((u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')))];
  R.retiredRequested = R.audioRequests.filter((u) => RETIRED.some((r) => u.includes(r)));
  R.consoleErrors = c.consoleErrors.length;
  R.notFound = c.notFound.length;
  R.finishedAt = new Date().toISOString();
  await c.browser.close();
  fs.writeFileSync(OUT, JSON.stringify(R, null, 1));
  log('wrote', OUT, 'status', R.status, 'panel', JSON.stringify(R.panel), 'retiredRequested', R.retiredRequested.length, 'consoleErrors', R.consoleErrors, 'notFound', R.notFound);
}
