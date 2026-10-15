// LIVE smoke 2 (1600x900): title -> board -> 'angra' -> the first menu of Angra Mainyu (FFX-2), the cancel path of its menu, the pause. Not a fight to win.
import { launch, toBoard, typeDoor, prepToFirstMenu, readState, commandRows, shot, sleep, audioNow, startAudioSampler, note, finish, assertScreen, waitBattleMenu } from './h.mjs';

const TAG = process.env.TAG || 's2-angra';
const { browser, page, rec } = await launch(TAG, { width: 1600, height: 900 });
rec.checks = {};
const ok = (k, v, detail) => { rec.checks[k] = { ok: !!v, detail: detail ?? null }; note(rec, v ? 'CHECK-OK  ' : 'CHECK-FAIL', k, detail ?? ''); return !!v; };
const rowsText = async () => (await commandRows(page)).rows.map((x) => x.text + (x.selected ? '*' : ''));
const setStage = (n) => { rec.stage = n; stage = n; };
const actorName = () => page.evaluate(() => document.querySelector('.mad__actor')?.textContent?.trim() ?? null);
let stage = 'start';
const CH = 'ffx2-angra-mainyu';
const stopAudio = startAudioSampler(page, rec);
try {
  ok('build is f939b87f / index-4LVgaz0l.js', rec.build?.sha === 'f939b87f' && /4LVgaz0l/.test(rec.build?.bundle ?? ''), JSON.stringify(rec.build));
  setStage('board');
  await toBoard(page, rec);
  await sleep(1200);
  const board = await page.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' '), ss: window.__pyrefly.snapshotState()?.screenState }));
  ok('board still says "0 OF 18 BEATEN" with 18 tiles', /\b0 OF 18 BEATEN\b/i.test(board.text) && board.ss?.tiles === 18, `tiles=${board.ss?.tiles}`);
  setStage('door');
  const prep = await typeDoor(page, 'angra', CH);
  ok("typing 'angra' opens party prep for ffx2-angra-mainyu (FFX-2)", prep.chapter === CH && prep.game === 'ffx2', JSON.stringify({ chapter: prep.chapter, game: prep.game }));
  await sleep(1000);
  await shot(page, rec, '01-prep', { screen: 'party-prep', chapter: CH, game: 'ffx2' });
  setStage('to-first-menu');
  const t0 = Date.now();
  const first = await prepToFirstMenu(page, CH, { onCutscene: async () => { await shot(page, rec, '02-cutscene', { screen: 'cutscene' }); } });
  rec.firstMenuAfterMs = Date.now() - t0;
  const bs = await page.evaluate(() => Object.values(window.__pyrefly.battleState().combatants).map((c) => ({ id: c.id, side: c.side, hp: c.hp, mp: c.mp })));
  note(rec, 'combatants', bs);
  const who0 = await actorName();
  ok('first menu: FFX-2 battle, a party member is up and the menu is waiting', first.st.screen === 'battle' && first.st.game === 'ffx2' && first.st.awaitingMenu && ['yuna', 'rikku', 'paine'].includes((who0 ?? '').toLowerCase()), JSON.stringify({ actor: who0, phase: first.st.phase, scene: first.st.scene, game: first.st.game }));
  ok('Yuna, Rikku and Paine against Angra Mainyu, Tawrich and Zarich', ['yuna', 'rikku', 'paine'].every((id) => bs.find((c) => c.id === id && c.side === 'party')) && ['x2-angra-mainyu', 'x2-tawrich', 'x2-zarich'].every((id) => bs.find((c) => c.id === id && c.side === 'enemy')), JSON.stringify(bs.map((c) => c.id)));
  const rows0 = await rowsText();
  note(rec, 'rows at first menu', rows0);
  ok('the command menu lists real rows (Change and Item among them)', rows0.length >= 3 && rows0.some((r) => /^Change/.test(r)) && rows0.some((r) => /^Item/.test(r)), rows0.join());
  await shot(page, rec, '03-first-menu', { screen: 'battle', chapter: CH, game: 'ffx2', awaitingMenu: true }, { rows: rows0, phase: first.st.phase });

  setStage('cancel-path');
  const actor0 = await actorName();
  const rowsBefore = await rowsText();
  const dom0 = await page.evaluate(() => ({ targetEls: document.querySelectorAll('[data-target-id]').length, tplate: !!document.querySelector('[class*="tplate"], [class*="target"]'), sel: window.__pyrefly.targeting?.()?.selection ?? null }));
  await page.keyboard.press('Enter');
  await sleep(1000);
  const mid = await readState(page);
  const dom1 = await page.evaluate(() => ({ targetEls: document.querySelectorAll('[data-target-id]').length, sel: window.__pyrefly.targeting?.()?.selection ?? null, selected: window.__pyrefly.targeting?.()?.selectedIds ?? null, text: [...document.querySelectorAll('[class*="target"],[class*="tplate"]')].map((e) => e.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 4) }));
  note(rec, 'after Enter on the first row', mid.phase, dom0, dom1);
  await shot(page, rec, '04-target-step', { screen: 'battle', chapter: CH, game: 'ffx2', awaitingMenu: true }, { dom1 });
  await page.keyboard.press('Escape');
  await sleep(1000);
  const back = await readState(page);
  const rows1 = await rowsText();
  const who1 = await actorName();
  ok('Escape returns to the same menu (still the battle, same actor, same rows, menu waiting)', back.screen === 'battle' && back.awaitingMenu && who1 === actor0 && rows1.join() === rowsBefore.join(), JSON.stringify({ screen: back.screen, awaiting: back.awaitingMenu, actor: [actor0, who1], rows: [rowsBefore, rows1] }));
  await shot(page, rec, '05-after-cancel', { screen: 'battle', chapter: CH, game: 'ffx2', awaitingMenu: true }, { rows: rows1 });

  setStage('pause');
  await page.keyboard.press('Escape');
  await sleep(1500);
  const p1 = await readState(page);
  ok('Escape at the top menu opens the pause', p1.screen === 'pause' && JSON.stringify(p1.stack) === '["battle","pause"]', JSON.stringify({ screen: p1.screen, stack: p1.stack, chapter: p1.chapter }));
  await shot(page, rec, '06-pause', { screen: 'pause', chapter: CH });
  await page.keyboard.press('p');
  await sleep(1500);
  const p2 = await readState(page);
  const who2 = await actorName();
  const rows2 = await rowsText();
  ok('P resumes to the same menu (same actor, same rows, menu waiting)', p2.screen === 'battle' && p2.awaitingMenu && who2 === actor0 && rows2.join() === rowsBefore.join(), JSON.stringify({ screen: p2.screen, awaiting: p2.awaitingMenu, actor: [actor0, who2], rows: [rowsBefore, rows2] }));
  await shot(page, rec, '07-resumed', { screen: 'battle', chapter: CH, game: 'ffx2', awaitingMenu: true });
  const a = await audioNow(page);
  note(rec, 'audio', { playing: a.playing, muted: a.muted, gain: a.currentGain });
  setStage('done');
} catch (e) {
  note(rec, 'RUN-ABORTED at stage', stage, String(e).slice(0, 600));
  rec.aborted = { stage, err: String(e).slice(0, 600) };
  try { await page.screenshot({ path: `D:/pyrefly-r49/.live-f939-tmp/shots/${TAG}-abort-${stage}.png` }); } catch { /* none */ }
}
rec.audioSampled = await stopAudio();
rec.audioFinal = await audioNow(page).catch(() => null);
finish(rec);
const fails = Object.entries(rec.checks).filter(([, v]) => !v.ok).map(([k]) => k);
console.log(JSON.stringify({ tag: TAG, checks: Object.keys(rec.checks).length, failedChecks: fails, aborted: rec.aborted ?? null, shotFails: rec.fails, consoleErrors: rec.consoleErrors, pageErrors: rec.pageErrors, notFound: rec.notFound, htmlMedia: rec.htmlMedia, failedRequests: rec.failed, audioSampled: rec.audioSampled, audioNet: rec.audio.map((x) => `${x.url} ${x.status} ${x.ct}`) }, null, 1));
await browser.close();
