import { open, assertScreen, waitBattleMenu } from 'file:///D:/pyrefly-release55/critic/runner/lib/lib.mjs';
import fs from 'node:fs';
const OUT = 'D:/Tools/pyrefly-scratch/shots-eaf599d0c';
fs.mkdirSync(OUT, { recursive: true });
const base = `https://echoesofspira.com/?cb=${Date.now()}`;
const R = {};
const allErr = [];
const allNF = [];
const ev = (page, f, a) => page.evaluate(f, a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const snap = async (p, n) => { await p.screenshot({ path: `${OUT}/${n}.png` }); };
const audio = (p) => p.evaluate(() => {
  const d = window.__pyrefly.audioDebug();
  return { playing: d.playing, muted: d.muted, music: d.music, prerendered: d.prerendered, cachedTracks: d.tracks.filter((t) => t.cached).map((t) => [t.name, t.source]).slice(0, 8) };
});
const audioNet = (c) => c.net.filter((u) => /\.(mp3|ogg|m4a|wav)/i.test(u)).slice(0, 12);

async function toChapterSelect(page) {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await assertScreen(page, 'chapter-select');
}
async function chapterToBattle(page, id) {
  if (id) {
    let g2 = 0;
    while (g2++ < 60) {
      const sel = await ev(page, () => window.__pyrefly.snapshotState()?.screenState?.selectedId);
      if (sel === id) break;
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
    }
    console.log('selected after', g2, 'arrows', id);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
  await assertScreen(page, 'party-prep');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  let s = await scr(page);
  let g = 0;
  if (s === 'cutscene') {
    await page.keyboard.down('Enter');
    await page.waitForTimeout(6000);
    await page.keyboard.up('Enter');
    await page.waitForTimeout(500);
  }
  while ((s = await scr(page)) === 'cutscene' && g++ < 250) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  await assertScreen(page, 'battle', 90000);
  await waitBattleMenu(page, 90000);
}
const fin = (c) => { allErr.push(...c.consoleErrors); allNF.push(...c.notFound); };

if (!process.env.SKIPA) {
{
  const c = await open({ base, fresh: true });
  const { page } = c;
  R.build = await ev(page, () => window.__pyrefly.build());
  await toChapterSelect(page);
  await chapterToBattle(page, null);
  R.ffxEnemies = await ev(page, () => window.__pyrefly.battleState().enemyIds);
  R.ffxAudio = await audio(page);
  R.ffxNetAudio = audioNet(c);
  await snap(page, 'ffx-menu');
  const b = await ev(page, () => ({ f: window.__pyrefly.snapshotState()?.frame, l: window.__pyrefly.battleLog().length }));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  const a = await ev(page, () => ({ f: window.__pyrefly.snapshotState()?.frame, l: window.__pyrefly.battleLog().length }));
  R.ffxAction = { b, a };
  await waitBattleMenu(page, 90000);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  R.ffxCancel = await scr(page);
  await ev(page, () => { const c = window.__pyrefly.battleState().combatants; c['yuna'].hp = 1; c['kimahri'].hp = 1; });
  let koSeen = 0;
  let turns = 0;
  while (!koSeen && turns++ < 40) {
    await waitBattleMenu(page, 20000).catch(async (e) => { await snap(page, 'stuck-' + turns); console.log('stuck', turns, await scr(page), JSON.stringify(await ev(page, () => window.__pyrefly.battleState().log.slice(-6)))); await page.keyboard.press('Escape'); await page.waitForTimeout(500); });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.keyboard.press('Enter');
    for (let i = 0; i < 12 && !koSeen; i++) {
      await page.waitForTimeout(400);
      koSeen = await ev(page, () => window.__pyrefly.battleLog().filter((e) => e.type === 'ko' && ['yuna', 'kimahri'].includes(e.targetId)).length);
    }
  }
  R.koTurns = turns;
  R.koEvents = koSeen;
  console.log('ko seen', koSeen, 'turns', turns);
  for (let i = 0; i < 6; i++) { await snap(page, `ko-${i}`); await page.waitForTimeout(250); }
  const victim = await ev(page, () => { const c = window.__pyrefly.battleState().combatants; return ['yuna', 'kimahri'].find((id) => c[id].hp <= 0 || !c[id].alive) ?? null; });
  R.koVictim = victim;
  await waitBattleMenu(page, 90000).catch((e) => { R.koWaitMenu = String(e).slice(0, 200); });
  const rev = await ev(page, (v) => {
    const r = window.__pyrefly.forceCommand({ kind: 'item', id: 'phoenix-down', targets: [v] });
    const y = window.__pyrefly.battleState().combatants[v];
    return { events: (r ?? []).map((e) => e.type), hp: y.hp, alive: y.alive };
  }, victim);
  R.revive = rev;
  console.log('revive', JSON.stringify(rev));
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(300); await snap(page, `revive-${i}`); }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  R.pauseEsc = await scr(page);
  await snap(page, 'pause-esc');
  console.log("pre-len"); const len0 = await page.evaluate(() => document.body.innerText.length);
  console.log('press h'); await page.keyboard.press('h');
  await page.waitForTimeout(500);
  const lenH = await page.evaluate(() => document.body.innerText.length);
  console.log('press h'); await page.keyboard.press('h');
  await page.waitForTimeout(500);
  const lenR = await page.evaluate(() => document.body.innerText.length);
  R.hide = { len0, lenH, lenR, scr: await scr(page) };
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  R.afterEsc = await scr(page);
  await page.keyboard.press('p');
  await page.waitForTimeout(900);
  R.pauseP = await scr(page);
  await page.keyboard.press('p');
  await page.waitForTimeout(900);
  R.afterP = await scr(page);
  R.ffxAudioLater = await audio(page);
  R.lsKeys = await ev(page, () => Object.keys(localStorage));
  const before = await ev(page, () => {
    const k = 'pyrefly-reprise:save:v1';
    try { const r = JSON.parse(localStorage.getItem(k) || '{}'); r.settings = r.settings || {}; r.settings.masterVolume = 0.42; localStorage.setItem(k, JSON.stringify(r)); return r; } catch (e) { return String(e); }
  });
  R.reloadBefore = { vol: before?.settings?.masterVolume, keys: Object.keys(before ?? {}) };
  await page.reload();
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  const after = await ev(page, () => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return null; } });
  R.reloadAfter = { vol: after?.settings?.masterVolume, keys: Object.keys(after ?? {}) };
  fin(c);
  await c.browser.close();
}
}
// B/C. FFX-2 Fallen Aeons and Ixion
for (const [tag, id] of [['fa', 'ffx2-fallen-aeons'], ['ix', 'ffx2-ixion-djose']]) {
  const c = await open({ base, fresh: true });
  const { page } = c;
  await toChapterSelect(page);
  await chapterToBattle(page, id);
  R[tag + 'Enemies'] = await ev(page, () => window.__pyrefly.battleState().enemyIds);
  await page.waitForTimeout(2500);
  R[tag + 'Audio'] = await audio(page);
  R[tag + 'Net'] = audioNet(c);
  await snap(page, tag);
  if (tag === 'fa') {
    await waitBattleMenu(page, 90000);
    const l0 = await ev(page, () => window.__pyrefly.battleLog().length);
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    R.faCancel = await scr(page);
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
    R.faAttack = { l0, l1: await ev(page, () => window.__pyrefly.battleLog().length) };
    await snap(page, 'fa-attack');
  }
  fin(c);
  await c.browser.close();
}
// D. hidden limit chapter
{
  const c = await open({ base, fresh: true });
  const { page } = c;
  await toChapterSelect(page);
  for (const ch of 'limit') { await page.keyboard.press(ch); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  let s = await scr(page);
  R.limitAfterWord = s;
  let g = 0;
  while (s !== 'battle' && g++ < 80) { await page.keyboard.press('Enter'); await page.waitForTimeout(400); s = await scr(page); }
  R.limitScreen = { s, g };
  if (s === 'battle') {
    await page.waitForTimeout(4000);
    R.limitAudio = await audio(page);
    R.limitNet = audioNet(c);
    await snap(page, 'limit');
    await waitBattleMenu(page, 90000).catch((e) => { R.limitMenu = String(e).slice(0, 200); });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await snap(page, 'limit-action');
  }
  fin(c);
  await c.browser.close();
}
R.consoleErrors = allErr;
R.notFound = allNF;
fs.writeFileSync('D:/Tools/pyrefly-scratch/eaf599d0c-live-smoke.json', JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
