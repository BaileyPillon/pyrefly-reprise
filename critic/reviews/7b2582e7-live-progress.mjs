// CHK-024 (light) with real progress on the live build 7b2582e7: win Chapter I (the debug API plays the fight to its intended outcome at skip speed, the way
// tools/text-floor-sweep.mjs reaches the results screen), leave the results with a real Enter, change one setting, reload, and read the save back.
// What it proves is persistence of the game's own progress write; it does not prove a player can win by real input (the deep review's routes do that).
import fs from 'node:fs';

import { assertScreen, MODE, open, waitFor } from '../runner/lib/lib.mjs';

const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const RESULT = process.env.PROGRESS_JSON || 'D:/Tools/pyrefly-scratch/live-progress-7b2582e7.json';
const KEY = 'pyrefly-reprise:save:v1';
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const R = { review: 'live-progress', sha: '7b2582e7', browserMode: MODE, startedAt: new Date().toISOString() };
const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
const { page } = c;
const readSave = () => page.evaluate((k) => localStorage.getItem(k), KEY);
try {
  await assertScreen(page, 'title', 60000);
  R.saveBefore = await readSave();
  await page.evaluate(() => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended', skipResults: false, speed: 'skip' }); });
  await assertScreen(page, 'results', 300000);
  await page.waitForTimeout(4500);
  R.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 260));
  log('results reached:', R.resultsText.slice(0, 120));
  // leave the results with a real key (CONFIRM), as a player does
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  R.screenAfterConfirm = await scr(page);
  const afterWin = await readSave();
  const pw = JSON.parse(afterWin);
  R.savedAfterWin = { bytes: afterWin.length, topKeys: Object.keys(pw), chapterI: pw.chapters?.['seymour-flux'] ?? null, unlockedCount: Array.isArray(pw.unlocked) ? pw.unlocked.length : pw.unlocked };
  // a setting change on top of it
  const edited = await page.evaluate((k) => {
    const r = JSON.parse(localStorage.getItem(k));
    r.settings = r.settings || {};
    const old = r.settings.masterVolume;
    r.settings.masterVolume = 0.37;
    const next = JSON.stringify(r);
    localStorage.setItem(k, next);
    return { old, next };
  }, KEY);
  await page.reload();
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  const afterReload = await readSave();
  const pr = JSON.parse(afterReload);
  R.afterReload = {
    screen: await scr(page),
    chapterIAfter: pr.chapters?.['seymour-flux'] ?? null,
    progressSurvived: JSON.stringify(pr.chapters?.['seymour-flux']) === JSON.stringify(pw.chapters?.['seymour-flux']) && !!pr.chapters?.['seymour-flux'],
    volumeBefore: edited.old,
    volumeSetTo: 0.37,
    volumeAfter: pr.settings?.masterVolume,
    volumeSurvived: pr.settings?.masterVolume === 0.37,
    saveIdentical: afterReload === edited.next,
    topLevelKeysThatDiffer: [...new Set([...Object.keys(JSON.parse(edited.next)), ...Object.keys(pr)])].filter((x) => JSON.stringify(JSON.parse(edited.next)[x]) !== JSON.stringify(pr[x])),
  };
  // the board must show the clear after the reload: reach it with real keys and read the card's state through the debug surface
  await assertScreen(page, 'title', 30000);
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) { await page.waitForTimeout(500); if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter'); }
  await assertScreen(page, 'chapter-select', 15000);
  await page.waitForTimeout(1200);
  R.boardAfterReload = await page.evaluate(() => { const s = window.__pyrefly.snapshotState()?.screenState ?? {}; return { selectedId: s.selectedId ?? null, keys: Object.keys(s).slice(0, 12) }; });
  fs.mkdirSync('D:/Tools/pyrefly-scratch/shots-7b2582e7', { recursive: true });
  await page.screenshot({ path: 'D:/Tools/pyrefly-scratch/shots-7b2582e7/progress-board-after-reload.jpg', type: 'jpeg', quality: 85 });
  R.status = 'ran';
  log('after reload:', JSON.stringify({ progress: R.afterReload.progressSurvived, volume: R.afterReload.volumeAfter, identical: R.afterReload.saveIdentical, screen: R.afterReload.screen }));
} catch (e) {
  R.status = 'error';
  R.error = String(e && e.message ? e.message : e).slice(0, 400);
  log('!! error', R.error);
} finally {
  R.consoleErrors = c.consoleErrors.slice();
  R.notFound = c.notFound.slice();
  R.finishedAt = new Date().toISOString();
  fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
  await c.browser.close();
}
console.log(JSON.stringify({ status: R.status, error: R.error, savedAfterWin: R.savedAfterWin, afterReload: R.afterReload, consoleErrors: R.consoleErrors.length, notFound: R.notFound.length }, null, 1));
