// LIVE smoke 1 (1600x900): title -> board -> 'gagazet' -> Kimahri's first turn -> cancel path -> Lancet on a brother -> pause/hide/resume -> one setting -> reload.
// Real keyboard input only. The debug API is read-only here (state reads), never the actor.
import { launch, toBoard, typeDoor, prepToFirstMenu, readState, commandRows, shot, sleep, audioNow, startAudioSampler, note, finish, assertScreen, waitBattleMenu, waitFor } from './h.mjs';

const TAG = process.env.TAG || 's1-gagazet';
const { browser, page, rec } = await launch(TAG, { width: 1600, height: 900 });
rec.checks = {};
const ok = (k, v, detail) => { rec.checks[k] = { ok: !!v, detail: detail ?? null }; note(rec, v ? 'CHECK-OK  ' : 'CHECK-FAIL', k, detail ?? ''); return !!v; };
const rowsText = async () => (await commandRows(page)).rows.map((x) => x.text + (x.selected ? '*' : ''));
const targetUi = () => page.evaluate(() => {
  const vis = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
  const n = document.querySelector('.ffx-tplate__name');
  return { name: n?.textContent?.trim() ?? null, visible: vis(n) };
});
const settings = () => page.evaluate(() => { try { const r = JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); return r ? r.settings : null; } catch (e) { return { error: String(e) }; } });
const pauseVis = () => page.evaluate(() => {
  const vis = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, visibility: cs.visibility, display: cs.display }; };
  const shown = (v) => !!v && v.display !== 'none' && v.visibility !== 'hidden' && parseFloat(v.opacity) > 0.05 && v.w > 0 && v.h > 0;
  const tabs = vis('.pause__tabs');
  const body = vis('.pause__body');
  return { rootClass: document.querySelector('.pause')?.className ?? null, bare: !!document.querySelector('.pause--bare'), bareEl: document.querySelector('.pause--bare')?.className?.toString().slice(0, 60) ?? null, tabs, body, tabsShown: shown(tabs), bodyShown: shown(body), tab: document.querySelector('.pause__body')?.getAttribute('data-tab') ?? null };
});
const stopAudio = startAudioSampler(page, rec);
const CH = 'biran-yenke';
const MENU = { screen: 'battle', chapter: CH, game: 'ffx', awaitingMenu: true, phase: 'command:kimahri' };
let stage = 'start';
const setStage = (n) => { stage = n; rec.stage = n; };
const CLICKS = process.env.CLICKS === '1';
rec.clicks = CLICKS;
const clickAt = async (sel, label) => {
  const c = await page.evaluate((s) => { const e = [...document.querySelectorAll(s.sel)].find((x) => !s.re || new RegExp(s.re, 'i').test(x.textContent ?? '')); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, sel);
  if (!c) throw new Error(`ASSERT-FAIL nothing to click for ${label}`);
  await page.mouse.move(c.x, c.y);
  await sleep(250);
  await page.mouse.click(c.x, c.y);
  note(rec, 'REAL CLICK', label, c);
  return c;
};
try {
  ok('build is f939b87f / index-4LVgaz0l.js', rec.build?.sha === 'f939b87f' && /4LVgaz0l/.test(rec.build?.bundle ?? ''), JSON.stringify(rec.build));
  ok('GPU renderer (not SwiftShader)', /NVIDIA|Direct3D11/i.test(rec.renderer) && !/swiftshader/i.test(rec.renderer), rec.renderer);
  const scripts = await page.evaluate(() => [...document.scripts].map((s) => s.src.split('/').slice(-2).join('/')));
  ok('served page loads assets/index-4LVgaz0l.js', scripts.some((s) => /index-4LVgaz0l\.js/.test(s)), scripts.join(','));

  setStage('title');
  await assertScreen(page, 'title', 30000);
  await sleep(1500);
  await shot(page, rec, '01-title', { screen: 'title' });

  setStage('board');
  await toBoard(page, rec);
  note(rec, 'title presses', rec.titlePresses);
  await sleep(1200);
  const board = await page.evaluate(() => ({ text: document.body.innerText.replace(/\s+/g, ' '), ss: window.__pyrefly.snapshotState()?.screenState }));
  ok('board says "0 OF 18 BEATEN"', /\b0 OF 18 BEATEN\b/i.test(board.text), (board.text.match(/\d+ OF \d+ BEATEN/i) ?? [''])[0]);
  ok('board has 18 tiles and total 18', board.ss?.tiles === 18 && board.ss?.total === 18, `tiles=${board.ss?.tiles} total=${board.ss?.total}`);
  ok('hidden chapters are not on the board', !board.ss.order.includes('biran-yenke') && !board.ss.order.includes('ffx2-angra-mainyu') && !/Biran|Angra|Yenke/i.test(board.text), `order has ${board.ss.order.length}`);
  await shot(page, rec, '02-board', { screen: 'chapter-select' }, { order: board.ss.order.length });

  setStage('door');
  const prep = await typeDoor(page, 'gagazet', CH);
  ok("typing 'gagazet' opens party prep for biran-yenke (FFX)", prep.screen === 'party-prep' && prep.chapter === CH && prep.game === 'ffx', JSON.stringify({ chapter: prep.chapter, game: prep.game }));
  await sleep(1000);
  await shot(page, rec, '03-prep', { screen: 'party-prep', chapter: CH, game: 'ffx' });

  setStage('to-first-menu');
  const first = await prepToFirstMenu(page, CH, { clickStart: CLICKS, onCutscene: async () => { await shot(page, rec, '04-cutscene', { screen: 'cutscene' }); } });
  note(rec, 'prep Enters', first.prepEnters, 'cutscene taps', first.taps);
  const rows0 = await rowsText();
  ok("Kimahri's first player turn: menu waiting, phase command:kimahri", first.st.awaitingMenu && first.st.phase === 'command:kimahri', JSON.stringify({ phase: first.st.phase, scene: first.st.scene }));
  ok('first menu rows are Attack / Special / Items', rows0.join() === 'Attack*,Special,Items', rows0.join());
  const bs = await page.evaluate(() => Object.values(window.__pyrefly.battleState().combatants).map((c) => ({ id: c.id, side: c.side, hp: c.hp, mp: c.mp })));
  note(rec, 'combatants at first menu', bs);
  ok('Kimahri alone vs Biran 3208 and Yenke 2406 HP', bs.filter((c) => c.side === 'party').length === 1 && bs.find((c) => c.id === 'biran-ronso')?.hp === 3208 && bs.find((c) => c.id === 'yenke-ronso')?.hp === 2406, JSON.stringify(bs));
  await shot(page, rec, '05-first-menu', MENU, { rows: rows0 });

  setStage('cancel-path');
  await page.keyboard.press('ArrowDown');
  await sleep(450);
  const rows1 = await rowsText();
  ok('ArrowDown moves the cursor to Special', rows1.join() === 'Attack,Special*,Items', rows1.join());
  await page.keyboard.press('Enter');
  await sleep(900);
  const t1 = await targetUi();
  ok('Enter on Special (one special, Lancet) opens target selection on Biran', t1.visible && /biran/i.test(t1.name ?? ''), JSON.stringify(t1));
  await shot(page, rec, '06-target', MENU, { target: t1 });
  let sw = null;
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.press(key);
    await sleep(500);
    const t2 = await targetUi();
    if (t2.name && t2.name !== t1.name) { sw = { key, from: t1.name, to: t2.name }; break; }
  }
  note(rec, 'target switch', sw);
  rec.targetSwitch = sw;
  await page.keyboard.press('Escape');
  await sleep(900);
  const afterCancel = await readState(page);
  const t3 = await targetUi();
  const rows2 = await rowsText();
  ok('Escape cancels target selection: back to the top menu, still the battle (not the pause)', afterCancel.screen === 'battle' && afterCancel.awaitingMenu && !t3.visible && rows2.join() === 'Attack,Special*,Items', JSON.stringify({ screen: afterCancel.screen, awaiting: afterCancel.awaitingMenu, target: t3, rows: rows2 }));
  await shot(page, rec, '07-after-cancel', MENU, { rows: rows2 });

  setStage('lancet');
  if (CLICKS) await clickAt({ sel: '.ig-cmd', re: 'Special' }, 'the Special row'); else await page.keyboard.press('Enter');
  await sleep(900);
  const t4 = await targetUi();
  ok((CLICKS ? 'A real mouse click on the Special row' : 'Enter on Special again') + ' opens target selection', t4.visible, JSON.stringify(t4));
  const wantRage = /yenke/i.test(t4.name ?? '') ? 'Fire Breath' : 'Thrust Kick';
  note(rec, 'confirming Lancet on', t4.name, 'expecting', wantRage);
  const logBefore = await page.evaluate(() => window.__pyrefly.battleLog().length);
  await page.keyboard.press('Enter');
  let banner = null;
  for (let i = 0; i < 160 && !banner; i++) {
    await sleep(100);
    banner = await page.evaluate(() => {
      const hit = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^\s*learns\s+\S/i.test(e.textContent ?? ''));
      if (!hit.length) return null;
      const e = hit[0];
      const r = e.getBoundingClientRect();
      return { text: e.textContent.trim(), cls: e.className.toString().slice(0, 80), parentCls: e.parentElement?.className?.toString().slice(0, 80) ?? null, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), opacity: getComputedStyle(e).opacity };
    });
  }
  ok('the "learns" banner draws on screen', !!banner && new RegExp(`learns\\s+${wantRage}`, 'i').test(banner.text), JSON.stringify(banner));
  if (banner) await shot(page, rec, '08-learns-banner', { screen: 'battle', chapter: CH, game: 'ffx' }, { banner });
  const msgs = await page.evaluate((n) => window.__pyrefly.battleLog().slice(n).filter((e) => e.type === 'message').map((e) => e.text), logBefore);
  ok('battle log carries the message "Kimahri learns ' + wantRage + '"', msgs.some((m) => new RegExp(`Kimahri learns ${wantRage}`).test(m)), JSON.stringify(msgs));
  const evs = await page.evaluate((n) => window.__pyrefly.battleLog().slice(n).map((e) => e.type), logBefore);
  note(rec, 'events since Lancet', evs.join(','));
  setStage('second-menu');
  await waitBattleMenu(page, 120000);
  await sleep(1200);
  const k = await page.evaluate(() => { const c = window.__pyrefly.battleState().combatants.kimahri; return { hp: c.hp, mp: c.mp, gauge: c.overdrive?.gauge, rages: c.overdrive?.unlockedOverdriveIds }; });
  ok('learning the Rage filled the Overdrive gauge (100) and put it on his list', k.gauge === 100 && (k.rages ?? []).some((r) => r === wantRage.toLowerCase().replace(' ', '-')), JSON.stringify(k));
  const rows3 = await rowsText();
  note(rec, 'rows at second menu', rows3);
  const st2 = await readState(page);
  await shot(page, rec, '09-second-menu', MENU, { rows: rows3, kimahri: k });

  setStage('pause-esc');
  const f0 = (await readState(page)).frameCount;
  await page.keyboard.press('Escape');
  await sleep(1500);
  const p1 = await readState(page);
  ok('Escape at the menu opens the pause (stack battle,pause)', p1.screen === 'pause' && JSON.stringify(p1.stack) === '["battle","pause"]', JSON.stringify({ screen: p1.screen, stack: p1.stack, chapter: p1.chapter }));
  const pv1 = await pauseVis();
  ok('pause panels are up (tabs and body shown)', pv1.tabsShown && pv1.bodyShown && !pv1.bare, JSON.stringify(pv1));
  await shot(page, rec, '10-pause-esc', { screen: 'pause', chapter: CH }, { pv: pv1 });
  const aPause = await audioNow(page);
  note(rec, 'audio in pause', { playing: aPause.playing, gain: aPause.currentGain, muted: aPause.muted });
  setStage('pause-hide');
  await page.keyboard.press('h');
  await sleep(1000);
  const p2 = await readState(page);
  const pv2 = await pauseVis();
  const s2 = await settings();
  ok('H hides the pause panels (pause--bare, panelsHidden, tabs/body not shown)', p2.screen === 'pause' && pv2.bare === true && p2.panelsHidden === true && !pv2.tabsShown && !pv2.bodyShown, JSON.stringify({ bare: pv2.bare, panelsHidden: p2.panelsHidden, tabsShown: pv2.tabsShown, bodyShown: pv2.bodyShown, stored: s2?.pausePanelsHidden }));
  await shot(page, rec, '11-pause-hidden', { screen: 'pause', chapter: CH }, { pv: pv2 });
  await page.keyboard.press('h');
  await sleep(1000);
  const p3 = await readState(page);
  const pv3 = await pauseVis();
  const s3 = await settings();
  ok('H again restores the pause panels', p3.screen === 'pause' && pv3.bare === false && p3.panelsHidden === false && pv3.tabsShown && pv3.bodyShown && s3?.pausePanelsHidden === false, JSON.stringify({ bare: pv3.bare, panelsHidden: p3.panelsHidden, tabsShown: pv3.tabsShown, bodyShown: pv3.bodyShown, stored: s3?.pausePanelsHidden }));
  await shot(page, rec, '12-pause-restored', { screen: 'pause', chapter: CH }, { pv: pv3 });
  setStage('pause-resume-esc');
  await page.keyboard.press('Escape');
  await sleep(1500);
  const r1 = await readState(page);
  await sleep(600);
  const r1b = await readState(page);
  ok('Escape resumes: back on the battle menu, same actor, clock running', r1.screen === 'battle' && r1.awaitingMenu && r1.phase === 'command:kimahri' && JSON.stringify(r1.roots) === '["battle"]' && r1b.frameCount > r1.frameCount, JSON.stringify({ screen: r1.screen, awaiting: r1.awaitingMenu, phase: r1.phase, roots: r1.roots, frames: [f0, r1.frameCount, r1b.frameCount] }));
  await shot(page, rec, '13-resumed-esc', MENU);
  setStage('pause-p');
  await page.keyboard.press('p');
  await sleep(1500);
  const q1 = await readState(page);
  ok('P opens the pause', q1.screen === 'pause' && JSON.stringify(q1.stack) === '["battle","pause"]', JSON.stringify({ screen: q1.screen, stack: q1.stack }));
  await shot(page, rec, '14-pause-p', { screen: 'pause', chapter: CH });
  await page.keyboard.press('p');
  await sleep(1500);
  const q2 = await readState(page);
  ok('P resumes', q2.screen === 'battle' && q2.awaitingMenu && q2.phase === 'command:kimahri', JSON.stringify({ screen: q2.screen, awaiting: q2.awaitingMenu, phase: q2.phase }));
  await shot(page, rec, '15-resumed-p', MENU);
  if (CLICKS) {
    setStage('pause-chip');
    await clickAt({ sel: '.battle-pause-chip' }, 'the PAUSE chip');
    await sleep(1500);
    const c1 = await readState(page);
    ok('A real click on the PAUSE chip opens the pause', c1.screen === 'pause' && JSON.stringify(c1.stack) === '["battle","pause"]', JSON.stringify({ screen: c1.screen, stack: c1.stack }));
    await shot(page, rec, '15b-pause-chip', { screen: 'pause', chapter: CH });
    await page.keyboard.press('Escape');
    await sleep(1500);
    const c2 = await readState(page);
    ok('Escape resumes after the chip-opened pause', c2.screen === 'battle' && c2.awaitingMenu && c2.phase === 'command:kimahri', JSON.stringify({ screen: c2.screen, awaiting: c2.awaitingMenu, phase: c2.phase }));
  }
  const aBattle = await audioNow(page);
  note(rec, 'audio after resume', { playing: aBattle.playing, gain: aBattle.currentGain, muted: aBattle.muted, volumes: aBattle.volumes });

  setStage('settings');
  const sBefore = await settings();
  await page.keyboard.press('Escape');
  await sleep(1400);
  let tabNow = (await pauseVis()).tab;
  if (CLICKS) { await clickAt({ sel: '.pause__tab', re: 'Options' }, 'the Options tab'); await sleep(900); tabNow = (await pauseVis()).tab; }
  for (let i = 0; i < 6 && tabNow !== 'options'; i++) { await page.keyboard.press('Tab'); await sleep(700); tabNow = (await pauseVis()).tab; }
  ok((CLICKS ? 'A real click on the Options tab' : 'Tab walks the pause strip') + ' reaches OPTIONS', tabNow === 'options', String(tabNow));
  await page.keyboard.press('ArrowDown');
  await sleep(500);
  const sel = await page.evaluate(() => [...document.querySelectorAll('.pause__body [class*="row"]')].filter((e) => /sel/.test(e.className.toString()) || e.getAttribute('aria-selected') === 'true').map((e) => e.textContent.trim().replace(/\s+/g, ' ')));
  note(rec, 'selected options row', sel);
  await page.keyboard.press('ArrowLeft');
  await sleep(700);
  const sChanged = await settings();
  ok('ArrowLeft on MASTER VOLUME lowers it 0.8 -> 0.7 and stores it', /MASTER VOLUME/i.test(sel[0] ?? '') && sBefore.masterVolume === 0.8 && sChanged.masterVolume === 0.7, JSON.stringify({ sel, before: sBefore.masterVolume, after: sChanged.masterVolume }));
  await shot(page, rec, '16-options-changed', { screen: 'pause', chapter: CH });
  await page.keyboard.press('Escape');
  await sleep(1200);

  setStage('reload');
  const lsKeysBefore = await page.evaluate(() => Object.keys(localStorage));
  await page.reload();
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await sleep(1000);
  const sAfter = await settings();
  const volsAfter = await page.evaluate(() => window.__pyrefly.audioDebug().volumes);
  const lsKeysAfter = await page.evaluate(() => Object.keys(localStorage));
  const diff = Object.keys({ ...sBefore, ...sAfter }).filter((x) => JSON.stringify(sBefore[x]) !== JSON.stringify(sAfter?.[x]));
  ok('after reload the changed setting survived in storage (masterVolume 0.7)', sAfter?.masterVolume === 0.7, JSON.stringify({ stored: sAfter?.masterVolume }));
  ok('after reload the game applied it (audio master volume 0.7 at boot)', volsAfter?.master === 0.7, JSON.stringify(volsAfter));
  ok('after reload every other setting is unchanged', diff.length === 1 && diff[0] === 'masterVolume', JSON.stringify({ diff, keysBefore: lsKeysBefore, keysAfter: lsKeysAfter }));
  await assertScreen(page, 'title', 30000);
  await sleep(1200);
  await shot(page, rec, '17-reload-title', { screen: 'title' });
  setStage('done');
} catch (e) {
  note(rec, 'RUN-ABORTED at stage', stage, String(e).slice(0, 600));
  rec.aborted = { stage, err: String(e).slice(0, 600) };
  try { await page.screenshot({ path: `D:/pyrefly-r49/.live-f939-tmp/shots/${TAG}-abort-${stage}.png` }); } catch { /* none */ }
}
rec.audioSampled = await stopAudio();
rec.audioFinal = await audioNow(page).catch(() => null);
const out = finish(rec);
const fails = Object.entries(rec.checks).filter(([, v]) => !v.ok).map(([k]) => k);
console.log(JSON.stringify({ tag: TAG, checks: Object.keys(rec.checks).length, failedChecks: fails, aborted: rec.aborted ?? null, shotFails: rec.fails, consoleErrors: rec.consoleErrors, pageErrors: rec.pageErrors, notFound: rec.notFound, htmlMedia: rec.htmlMedia, failedRequests: rec.failed.length, audioSampled: rec.audioSampled }, null, 1));
await browser.close();
