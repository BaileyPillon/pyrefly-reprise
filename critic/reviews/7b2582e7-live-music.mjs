// PR-0373 on the live build 7b2582e7: is the chapter's scene cue already playing when the first line of the opening scene appears,
// after a card confirm made by a real Enter press? Fresh headless Chromium (PYREFLY_BROWSER=gpu) per run, 1600x900, a cache-busting URL,
// board -> pick the card with arrow keys -> Enter (time zero) -> party prep (1.8 s) -> Enter -> the first spoken line. Run on an idle link.
//   REPS=3 node critic/reviews/7b2582e7-live-music.mjs        (CHAPTERS=seymour-flux,yunalesca,ffx2-bahamut by default)
import fs from 'node:fs';

import { assertScreen, MODE, open, waitFor } from '../runner/lib/lib.mjs';

const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const REPS = Number(process.env.REPS || 3);
// How long the player lingers: on the board with the card selected before pressing Enter, and on party prep before the second Enter (a fast, robot-like route by default).
const BOARD_DWELL_MS = Number(process.env.BOARD_DWELL_MS || 0);
const PREP_DWELL_MS = Number(process.env.PREP_DWELL_MS || 1800);
const RESULT = process.env.MUSIC_JSON || 'D:/Tools/pyrefly-scratch/live-music-7b2582e7.json';
const CHAPTERS = (process.env.CHAPTERS || 'seymour-flux,yunalesca,ffx2-bahamut').split(',');
const SCENE = { 'seymour-flux': 'scene-gagazet', yunalesca: 'scene-zanarkand-dome', 'ffx2-bahamut': 'scene-bevelle-underground' };
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const selId = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);

async function selectCard(page, id) {
  for (const [key, n] of [['ArrowRight', 60], ['ArrowLeft', 80]]) {
    for (let i = 0; i <= n; i++) {
      if ((await selId(page)) === id) return;
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
  }
  throw new Error(`ASSERT-FAIL card ${id} not reached`);
}

const R = { review: 'live-music', sha: '7b2582e7', browserMode: MODE, viewport: '1600x900', startedAt: new Date().toISOString(), runs: [] };
for (const id of CHAPTERS) {
  for (let rep = 1; rep <= REPS; rep++) {
    const run = { id, rep };
    R.runs.push(run);
    const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
    const { page } = c;
    const audio = [];
    const byReq = new Map();
    page.on('request', (r) => {
      const u = r.url();
      if (/\/audio\/.*\.(mp3|ogg|m4a|wav)/i.test(u)) { const rec = { url: u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), reqAt: Date.now() }; byReq.set(r, rec); audio.push(rec); }
    });
    page.on('requestfinished', (r) => { const rec = byReq.get(r); if (rec) rec.doneAt = Date.now(); });
    try {
      await assertScreen(page, 'title', 60000);
      await page.waitForTimeout(900);
      await page.keyboard.press('Enter');
      for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) { await page.waitForTimeout(500); if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter'); }
      await assertScreen(page, 'chapter-select', 15000);
      await page.waitForTimeout(600);
      await selectCard(page, id);
      run.selected = await selId(page);
      run.boardDwellMs = BOARD_DWELL_MS;
      run.prepDwellMs = PREP_DWELL_MS;
      if (BOARD_DWELL_MS) await page.waitForTimeout(BOARD_DWELL_MS);
      const t0 = Date.now();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(PREP_DWELL_MS);
      await assertScreen(page, 'party-prep', 20000);
      const tPrep = Date.now();
      await page.keyboard.press('Enter');
      await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && (await page.evaluate(() => { const t = document.querySelector('.dbox.dbox--visible .dbox__text'); return !!t && t.textContent.trim().length > 0; })), { ms: 60000, pollMs: 30 });
      const tLine = Date.now();
      const snap = await page.evaluate(() => {
        const d = window.__pyrefly.audioDebug();
        return { playing: d.playing, current: d.music.current, fading: d.music.fading.length, manifest: d.prerendered.manifest, cached: d.tracks.filter((t) => t.cached).map((t) => `${t.name}:${t.source}`), speaker: document.querySelector('.dbox__speaker')?.textContent?.trim() ?? null };
      });
      const sceneName = SCENE[id];
      const scene = audio.find((a) => /\/audio\/music\/scene-/.test(a.url));
      Object.assign(run, {
        status: 'ran',
        msInPrep: tPrep - t0,
        msConfirmToFirstLine: tLine - t0,
        speaker: snap.speaker,
        playingAtFirstLine: snap.playing,
        currentTrack: snap.current,
        sceneCueRequested: scene?.url ?? null,
        sceneRequestMsAfterConfirm: scene ? scene.reqAt - t0 : null,
        sceneFinishedMsAfterConfirm: scene?.doneAt ? scene.doneAt - t0 : null,
        sceneFinishedMsBeforeFirstLine: scene?.doneAt ? tLine - scene.doneAt : null,
        prerendered: snap.cached.some((x) => x.startsWith(`${snap.playing}:prerendered`)),
        scenePlaying: !!snap.playing && /^scene-/.test(snap.playing) && (!sceneName || snap.playing === sceneName),
        expectedSceneGuess: sceneName,
        audioAfterConfirm: audio.filter((a) => a.reqAt >= t0).map((a) => `${a.url} req+${a.reqAt - t0}ms${a.doneAt ? ` done+${a.doneAt - t0}ms` : ' (unfinished)'}`),
      });
      log(id, 'rep', rep, 'first line at', run.msConfirmToFirstLine, 'ms; playing', snap.playing, 'gain', snap.current?.gain?.toFixed?.(3), '; scene req +' + run.sceneRequestMsAfterConfirm, 'done +' + run.sceneFinishedMsAfterConfirm);
    } catch (e) {
      run.status = 'error';
      run.error = String(e && e.message ? e.message : e).slice(0, 300);
      log(id, 'rep', rep, '!! error', run.error);
    } finally {
      run.consoleErrors = c.consoleErrors.slice();
      run.notFound = c.notFound.slice();
      await c.browser.close();
    }
  }
}
// The cancel path of the changed flow: confirm a card, back out of party prep with Escape, pick another chapter. The first chapter's warm hold must end
// with its run (`held` empty on the board), and the second chapter's scene cue must be the one playing at its first line.
if (!process.env.NO_CANCEL) {
  const run = { id: 'cancel: seymour-flux -> prep -> Escape -> ffx2-bahamut', rep: 1, cancelPath: true };
  R.runs.push(run);
  const c = await open({ base: BASE, width: 1600, height: 900, fresh: true });
  const { page } = c;
  const held = () => page.evaluate(() => window.__pyrefly.audioDebug().music.held);
  try {
    await assertScreen(page, 'title', 60000);
    await page.waitForTimeout(900);
    await page.keyboard.press('Enter');
    for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) { await page.waitForTimeout(500); if ((await scr(page)) !== 'chapter-select') await page.keyboard.press('Enter'); }
    await assertScreen(page, 'chapter-select', 15000);
    await page.waitForTimeout(600);
    await selectCard(page, 'seymour-flux');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 20000);
    run.heldInPrep = await held();
    // On a fresh profile the first Escape only skips the first-run guide ("ESC SKIP THE GUIDE"); a further Escape backs out of prep.
    run.escapesToBoard = 0;
    for (let i = 0; i < 5 && (await scr(page)) !== 'chapter-select'; i++) {
      await page.keyboard.press('Escape');
      run.escapesToBoard++;
      await page.waitForTimeout(900);
    }
    await assertScreen(page, 'chapter-select', 15000);
    await page.waitForTimeout(800);
    run.heldAfterCancelOnBoard = await held();
    run.backOnBoard = (await scr(page)) === 'chapter-select';
    await selectCard(page, 'ffx2-bahamut');
    const t0 = Date.now();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 20000);
    run.heldInSecondPrep = await held();
    await page.keyboard.press('Enter');
    await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && (await page.evaluate(() => { const t = document.querySelector('.dbox.dbox--visible .dbox__text'); return !!t && t.textContent.trim().length > 0; })), { ms: 60000, pollMs: 30 });
    run.msConfirmToFirstLine = Date.now() - t0;
    const snap = await page.evaluate(() => { const d = window.__pyrefly.audioDebug(); return { playing: d.playing, gain: d.music.current?.gain ?? null, held: d.music.held }; });
    run.playingAtFirstLine = snap.playing;
    run.heldAtFirstLine = snap.held;
    run.status = 'ran';
    run.scenePlaying = snap.playing === 'scene-bevelle-underground';
    run.holdEndedOnCancel = Array.isArray(run.heldAfterCancelOnBoard) && run.heldAfterCancelOnBoard.length === 0;
    log('cancel path: held in prep', JSON.stringify(run.heldInPrep), '| after Escape on the board', JSON.stringify(run.heldAfterCancelOnBoard), '| second prep', JSON.stringify(run.heldInSecondPrep), '| first line', run.msConfirmToFirstLine, 'ms playing', snap.playing, 'held', JSON.stringify(snap.held));
  } catch (e) {
    run.status = 'error';
    run.error = String(e && e.message ? e.message : e).slice(0, 300);
    log('cancel path !! error', run.error);
  } finally {
    run.consoleErrors = c.consoleErrors.slice();
    run.notFound = c.notFound.slice();
    await c.browser.close();
  }
}
R.finishedAt = new Date().toISOString();
R.consoleErrorsTotal = R.runs.reduce((n, r) => n + (r.consoleErrors?.length ?? 0), 0);
R.notFoundTotal = R.runs.reduce((n, r) => n + (r.notFound?.length ?? 0), 0);
R.summary =Object.fromEntries(CHAPTERS.map((id) => { const rs = R.runs.filter((r) => r.id === id); return [id, { runs: rs.length, ran: rs.filter((r) => r.status === 'ran').length, scenePlayingAtFirstLine: rs.filter((r) => r.scenePlaying).length, msToFirstLine: rs.map((r) => r.msConfirmToFirstLine) }]; }));
const cp = R.runs.find((r) => r.cancelPath);
if (cp) R.summary.cancelPath = { status: cp.status, holdEndedOnCancel: cp.holdEndedOnCancel, heldInPrep: cp.heldInPrep, heldAfterCancelOnBoard: cp.heldAfterCancelOnBoard, scenePlayingAtFirstLine: cp.scenePlaying, playingAtFirstLine: cp.playingAtFirstLine, error: cp.error };
R.summary.consoleErrors = R.consoleErrorsTotal;
R.summary.notFound = R.notFoundTotal;
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.summary));
