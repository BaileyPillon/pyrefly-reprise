// LIVE smoke 5 (1600x900): the older door words still open what they opened (the shared door table gained two rows in this build).
// Expected chapters are what the focused review of this candidate recorded (doors.json, same words on the production candidate).
import { launch, toBoard, readState, shot, sleep, note, finish, assertScreen } from './h.mjs';

const CASES = [
  { word: 'leblanc', screen: 'party-prep', chapter: 'exp-leblanc', game: 'ffx2' },
  { word: 'experiment', screen: 'party-prep', chapter: 'ffx2-masterpiece-theatre', game: 'ffx2' },
  { word: 'mushroom', screen: 'party-prep', chapter: 'sinspawn-gui', game: 'ffx' },
  { word: 'valefor', screen: 'party-prep', chapter: 'ffx2-valefor-besaid', game: 'ffx2' },
  { word: 'limit', screen: 'battle', chapter: undefined, game: undefined },
  { word: 'wrongword', screen: 'chapter-select', chapter: undefined, game: undefined },
];
const out = [];
for (const c of CASES) {
  const TAG = `s5-${c.word}`;
  const { browser, page, rec } = await launch(TAG, { width: 1600, height: 900 });
  rec.checks = {};
  const ok = (k, v, detail) => { rec.checks[k] = { ok: !!v, detail: detail ?? null }; note(rec, v ? 'CHECK-OK  ' : 'CHECK-FAIL', k, detail ?? ''); return !!v; };
  rec.stage = 'board';
  try {
    await toBoard(page, rec);
    await sleep(1000);
    const before = await readState(page);
    const selBefore = before.selectedId;
    rec.stage = 'door';
    for (const ch of c.word) { await page.keyboard.press(ch); await sleep(130); }
    let s = null;
    const t0 = Date.now();
    while (Date.now() - t0 < (c.screen === 'chapter-select' ? 4000 : 15000)) {
      s = await page.evaluate(() => window.__pyrefly.screen());
      if (s !== 'chapter-select') break;
      await sleep(250);
    }
    await sleep(1200);
    const st = await readState(page);
    if (c.screen === 'chapter-select') {
      ok(`'${c.word}' (not a door word) opens nothing: still the board`, st.screen === 'chapter-select', JSON.stringify({ screen: st.screen, selectedBefore: selBefore, selectedAfter: st.selectedId }));
      await shot(page, rec, '01-board-after-wrong-word', { screen: 'chapter-select' });
    } else if (c.screen === 'battle') {
      ok(`'${c.word}' opens the hidden FF7 experiment straight into its battle screen`, st.screen === 'battle', JSON.stringify({ screen: st.screen, scene: st.scene, game: st.game }));
      await shot(page, rec, '01-battle', { screen: 'battle' });
    } else {
      ok(`'${c.word}' opens party prep for ${c.chapter} (${c.game})`, st.screen === 'party-prep' && st.chapter === c.chapter && st.game === c.game, JSON.stringify({ screen: st.screen, chapter: st.chapter, game: st.game }));
      await shot(page, rec, '01-prep', { screen: 'party-prep', chapter: c.chapter, game: c.game });
    }
    const save = await page.evaluate(() => { try { const r = JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); return r ? Object.keys(r.chapters ?? {}) : null; } catch { return 'unreadable'; } });
    rec.saveChapterKeysAfter = save;
  } catch (e) {
    rec.aborted = { stage: rec.stage, err: String(e).slice(0, 400) };
    note(rec, 'RUN-ABORTED', rec.stage, String(e).slice(0, 400));
  }
  finish(rec);
  out.push({ tag: TAG, checks: rec.checks, aborted: rec.aborted ?? null, shotFails: rec.fails, consoleErrors: rec.consoleErrors, pageErrors: rec.pageErrors, notFound: rec.notFound, htmlMedia: rec.htmlMedia, saveChapterKeys: rec.saveChapterKeysAfter });
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
