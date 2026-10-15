// LIVE smoke 4 (390x844): 'gagazet' to Kimahri's first menu, the same cancel path, a real click on START BATTLE. Desktop browser at a phone-sized viewport (not a real phone).
import { launch, toBoard, typeDoor, prepToFirstMenu, readState, commandRows, shot, sleep, audioNow, startAudioSampler, note, finish, assertScreen } from './h.mjs';

const TAG = process.env.TAG || 's4-phone';
const { browser, page, rec } = await launch(TAG, { width: 390, height: 844 });
rec.checks = {};
const ok = (k, v, detail) => { rec.checks[k] = { ok: !!v, detail: detail ?? null }; note(rec, v ? 'CHECK-OK  ' : 'CHECK-FAIL', k, detail ?? ''); return !!v; };
const setStage = (n) => { rec.stage = n; stage = n; };
let stage = 'start';
const CH = 'biran-yenke';
const MENU = { screen: 'battle', chapter: CH, game: 'ffx', awaitingMenu: true, phase: 'command:kimahri' };
const rowsText = async () => (await commandRows(page)).rows.map((x) => x.text + (x.selected ? '*' : ''));
const layout = () => page.evaluate(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const rows = [...document.querySelectorAll('.ig-cmd')].map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 14), x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((r) => r.w > 4 && r.h > 4);
  const inside = rows.every((r) => r.x >= 0 && r.y >= 0 && r.r <= vw + 1 && r.b <= vh + 1);
  const norm = (t) => (t ?? '').replace(/\s+/g, ' ').trim();
  const leaf = (re) => [...document.querySelectorAll('button, [role=button], div, span, a')].filter((e) => e.children.length <= 2 && re.test(norm(e.textContent))).map((e) => { const r = e.getBoundingClientRect(); return { text: norm(e.textContent).slice(0, 40), x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), inside: r.width > 0 && r.height > 0 && r.x >= 0 && r.right <= vw + 1 && r.y >= 0 && r.bottom <= vh + 1 }; }).filter((x) => x.w > 4 && x.h > 4);
  const confirm = leaf(/^special\s*(→|->)\s*biran ronso$/i)[0] ?? null;
  const back = leaf(/^back$/i)[0] ?? null;
  return { vw, vh, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, bodyScrollW: document.body.scrollWidth, rows, rowsInside: inside, target: confirm ? { text: confirm.text, inside: confirm.inside, rect: confirm, back } : null };
});
const stopAudio = startAudioSampler(page, rec);
try {
  ok('build is f939b87f / index-4LVgaz0l.js', rec.build?.sha === 'f939b87f' && /4LVgaz0l/.test(rec.build?.bundle ?? ''), JSON.stringify(rec.build));
  setStage('board');
  await toBoard(page, rec);
  await sleep(1200);
  const board = await page.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' '), ss: window.__pyrefly.snapshotState()?.screenState }));
  ok('board still counts 18 at 390x844 (the compact "0/18" form of the progress line)', /\b0\s*(\/|OF)\s*18\b/i.test(board.text) && board.ss?.tiles === 18 && board.ss?.total === 18, `tiles=${board.ss?.tiles} total=${board.ss?.total} text=${(board.text.match(/\b0\s*(\/|OF)\s*18\S*/i) ?? [''])[0]}`);
  await shot(page, rec, '01-board', { screen: 'chapter-select' });
  setStage('door');
  const prep = await typeDoor(page, 'gagazet', CH);
  ok("typing 'gagazet' opens party prep for biran-yenke (FFX)", prep.chapter === CH && prep.game === 'ffx', JSON.stringify({ chapter: prep.chapter, game: prep.game }));
  await sleep(1200);
  await shot(page, rec, '02-prep', { screen: 'party-prep', chapter: CH, game: 'ffx' });
  const sbRect = await page.evaluate(() => { const e = document.querySelector('.prep__start'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), inside: r.x >= 0 && r.right <= window.innerWidth + 1 && r.y >= 0 && r.bottom <= window.innerHeight + 1 }; });
  ok('START BATTLE button is inside the 390x844 viewport', !!sbRect && sbRect.inside, JSON.stringify(sbRect));
  setStage('to-first-menu');
  const first = await prepToFirstMenu(page, CH, { clickStart: true, onCutscene: async () => { await shot(page, rec, '03-cutscene', { screen: 'cutscene' }); } });
  note(rec, 'prep Enters after click', first.prepEnters, 'cutscene taps', first.taps);
  ok('a real click on START BATTLE started the chapter at 390x844 (no Enter needed)', first.prepEnters === 1, `prepEnters=${first.prepEnters}`);
  const rows0 = await rowsText();
  ok("Kimahri's first player turn at 390x844: menu waiting", first.st.awaitingMenu && first.st.phase === 'command:kimahri' && rows0.join() === 'Attack*,Special,Items', JSON.stringify({ phase: first.st.phase, rows: rows0 }));
  const lay0 = await layout();
  note(rec, 'layout at first menu', lay0);
  ok('no horizontal page scroll and the command rows sit inside the viewport', lay0.scrollW <= lay0.vw && lay0.bodyScrollW <= lay0.vw && lay0.rowsInside, JSON.stringify({ vw: lay0.vw, scrollW: lay0.scrollW, rowsInside: lay0.rowsInside }));
  await shot(page, rec, '04-first-menu', MENU, { rows: rows0, layout: lay0 });
  setStage('cancel-path');
  await page.keyboard.press('ArrowDown');
  await sleep(450);
  await page.keyboard.press('Enter');
  await sleep(900);
  const lay1 = await layout();
  ok('Enter on Special opens target selection on Biran (SPECIAL -> BIRAN RONSO and BACK buttons), inside the viewport', /biran/i.test(lay1.target?.text ?? '') && lay1.target?.inside === true && lay1.target?.back?.inside === true, JSON.stringify(lay1.target));
  await shot(page, rec, '05-target', MENU, { layout: lay1 });
  await page.keyboard.press('Escape');
  await sleep(900);
  const back = await readState(page);
  const rows1 = await rowsText();
  const lay2 = await layout();
  ok('Escape cancels back to the top menu (not the pause)', back.screen === 'battle' && back.awaitingMenu && lay2.target === null && rows1.join() === 'Attack,Special*,Items', JSON.stringify({ screen: back.screen, rows: rows1 }));
  await shot(page, rec, '06-after-cancel', MENU, { rows: rows1 });
  setStage('done');
} catch (e) {
  note(rec, 'RUN-ABORTED at stage', stage, String(e).slice(0, 600));
  rec.aborted = { stage, err: String(e).slice(0, 600) };
  try { await page.screenshot({ path: `D:/pyrefly-r49/.live-f939-tmp/shots/${TAG}-abort-${stage}.png` }); } catch { /* none */ }
}
rec.audioSampled = await stopAudio();
finish(rec);
const fails = Object.entries(rec.checks).filter(([, v]) => !v.ok).map(([k]) => k);
console.log(JSON.stringify({ tag: TAG, checks: Object.keys(rec.checks).length, failedChecks: fails, aborted: rec.aborted ?? null, shotFails: rec.fails, consoleErrors: rec.consoleErrors, pageErrors: rec.pageErrors, notFound: rec.notFound, htmlMedia: rec.htmlMedia, failedRequests: rec.failed.map((f) => `${f.url} @${f.stage}`) }, null, 1));
await browser.close();
