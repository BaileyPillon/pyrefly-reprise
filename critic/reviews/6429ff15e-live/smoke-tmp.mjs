import { chromium } from 'playwright';
import { currentChromiumArgs } from 'file:///D:/pyrefly-release55/tools/browser-mode.mjs';
import fs from 'node:fs';
const OUT = 'D:/pyrefly-release55/critic/reviews/6429ff15e-live';
const LIVE = 'https://echoesofspira.com/';
const b = await chromium.launch({ headless: true, args: currentChromiumArgs(process.env) });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const errs = [], nf = [], logs = [], aud = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (/\[rig\]/.test(m.text())) logs.push(m.text()); });
page.on('pageerror', (e) => errs.push(String(e)));
page.on('response', (r) => { if (r.status() === 404) nf.push(r.url()); if (/\/audio\//.test(r.url())) aud.push(r.status() + ' ' + r.url().split('/audio/')[1]); });
const sn = () => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const out = [];
const L = (s, o, d) => { out.push({ s, o, d }); console.log(o ? '[OK]' : '[FAIL]', s, d ?? ''); };
const boot = async (q) => {
  await page.goto(LIVE + '?livesmoke=' + Date.now() + (q ?? ''));
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  for (let i = 0; i < 12 && (await sn()) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
};
const snap = () => page.evaluate(() => window.__pyrefly.app.current.snapshot());
const gotoCh = async (id) => {
  let bd = await snap();
  for (let s = 0; bd.selectedId !== id && s < 40; s++) { await page.keyboard.press(bd.order.indexOf(id) > bd.order.indexOf(bd.selectedId) ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(150); bd = await snap(); }
  return bd.selectedId === id;
};
const toTurn = async () => {
  await page.keyboard.press('Enter');
  for (let i = 0; i < 40 && (await sn()) !== 'party-prep'; i++) await page.waitForTimeout(500);
  await page.waitForTimeout(600); await page.keyboard.press('Enter');
  for (let i = 0; i < 100 && (await sn()) !== 'battle'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  for (let i = 0; i < 300; i++) { if (await page.evaluate(() => window.__pyrefly?.snapshotState?.()?.screenState?.playback?.awaitingMenu === true)) return true; await page.waitForTimeout(300); }
  return false;
};
const phase = process.argv[2] ?? 'all';
try {
  if (phase === 'all' || phase === 'ch1') {
    await boot();
    L('title -> chapter select', (await sn()) === 'chapter-select');
    L('cursor on Chapter I (seymour-flux)', await gotoCh('seymour-flux'));
    const turn = await toTurn();
    L('Chapter I at player turn', (await sn()) === 'battle' && turn, 'awaitingMenu=' + turn);
    await page.waitForTimeout(3000);
    L('[rig] tidus on', logs.some((l) => /tidus on/.test(l)), logs.join(' | '));
    await page.screenshot({ path: OUT + '/ch1-turn.png' });
    // cone marker: open attack, aim at a target
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    const t = await page.evaluate(() => { try { const x = window.__pyrefly.targeting(); return x ? { sel: x.selectedIds, has: !!x.selection } : null; } catch (e) { return String(e); } });
    L('targeting active', !!(t && t.sel && t.sel.length), JSON.stringify(t));
    await page.screenshot({ path: OUT + '/ch1-target-cone.png' });
    await page.keyboard.press('Escape'); await page.waitForTimeout(700); // cancel path
    const t2 = await page.evaluate(() => { const x = window.__pyrefly.targeting(); return x && x.selectedIds ? x.selectedIds.length : 0; });
    L('cancel leaves targeting, stays in battle', t2 === 0 && (await sn()) === 'battle', 'sel=' + t2 + ' screen=' + (await sn()));
    await page.screenshot({ path: OUT + '/ch1-after-cancel.png' });
    // pause
    await page.keyboard.press('KeyP'); await page.waitForTimeout(900);
    let s1 = await sn();
    if (s1 !== 'pause') { await page.keyboard.press('KeyP'); await page.waitForTimeout(900); s1 = await sn(); }
    L('P pauses', s1 === 'pause', s1);
    await page.screenshot({ path: OUT + '/ch1-pause.png' });
    const hid = () => page.evaluate(() => /SHOW PANELS/i.test(document.body.innerText));
    const vis0 = await hid();
    await page.keyboard.press('KeyH'); await page.waitForTimeout(700);
    const vis1 = await hid();
    await page.screenshot({ path: OUT + '/ch1-pause-hidden.png' });
    await page.keyboard.press('KeyH'); await page.waitForTimeout(700);
    const vis2 = await hid();
    L('H hides and restores pause panels', vis0 === false && vis1 === true && vis2 === false, [vis0, vis1, vis2].join(' -> '));
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    let s2 = await sn(); if (s2 === 'pause') { await page.keyboard.press('KeyP'); await page.waitForTimeout(900); s2 = await sn(); }
    L('Escape/P resumes to battle', s2 === 'battle', s2);
    // second pause via Escape
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    const s3 = await sn(); L('Escape pauses', s3 === 'pause', s3);
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    L('Escape resumes', (await sn()) === 'battle', await sn());
    // music
    const ad = await page.evaluate(() => JSON.stringify(window.__pyrefly.audioDebug()).slice(0, 700));
    L('audio debug', true, ad);
    L('prerendered music fetched', aud.some((a) => /^200 .*\.(ogg|mp3|m4a|opus|wav)/.test(a)), aud.slice(0, 6).join(' | '));
    // settings change + reload
    const save0 = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
    await page.keyboard.press('KeyP'); await page.waitForTimeout(800);
    for (let i = 0; i < 12; i++) { const tx = await page.evaluate(() => document.querySelector('.pause [aria-selected="true"]')?.textContent?.trim() ?? null); if (tx && /^guide/i.test(tx)) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(300); }
    for (const k of ['ArrowDown', 'ArrowLeft', 'Enter']) { await page.keyboard.press(k); await page.waitForTimeout(300); }
    await page.keyboard.press('KeyP'); await page.waitForTimeout(800);
    const save1 = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
    L('setting change written to save', save0 !== save1, `${save0?.length}->${save1?.length}`);
    await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
    const save2 = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
    L('reload keeps save', save2 === save1 && !!save2, `${save1?.length} vs ${save2?.length}`);
  }
  if (phase === 'all' || phase === 'ch4') {
    await boot();
    L('Chapter IV cursor', await gotoCh('ffx2-bahamut'));
    const turn = await toTurn();
    L('Chapter IV at player turn', (await sn()) === 'battle' && turn);
    await page.waitForTimeout(1500);
    L('[rig] rikku-dark-knight on', logs.some((l) => /rikku-dark-knight on/.test(l)), logs.join(' | '));
    await page.screenshot({ path: OUT + '/ch4-turn.png' });
  }
  if (phase === 'all' || phase === 'words') {
    for (const [w, id] of [['spherimorph', 'spherimorph'], ['youth', 'ffx2-youth-league'], ['weapon', 'omega-ruins']]) {
      await boot();
      for (const ch of w) { await page.keyboard.press(ch); await page.waitForTimeout(70); }
      await page.waitForTimeout(800);
      const bd = await snap();
      L(`word ${w} settles on ${id}`, bd.selectedId === id, bd.selectedId);
      await page.screenshot({ path: OUT + `/word-${w}.png` });
      await page.keyboard.press('Enter');
      for (let i = 0; i < 40 && (await sn()) !== 'party-prep'; i++) await page.waitForTimeout(500);
      L(`word ${w} opens party-prep`, (await sn()) === 'party-prep', await sn());
      await page.screenshot({ path: OUT + `/prep-${w}.png` });
      if (true) {
        await page.waitForTimeout(500); await page.keyboard.press('Enter');
        for (let i = 0; i < 100 && (await sn()) !== 'battle'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
        let turn = false;
        for (let i = 0; i < 300; i++) { if (await page.evaluate(() => window.__pyrefly?.snapshotState?.()?.screenState?.playback?.awaitingMenu === true)) { turn = true; break; } await page.waitForTimeout(300); }
        L(`${w} reaches player turn`, (await sn()) === 'battle' && turn);
        await page.screenshot({ path: OUT + `/turn-${w}.png` });
      }
    }
  }
} catch (e) { L('script exception', false, String(e)); }
console.log('errs', errs.length, errs.slice(0, 8), 'nf', nf.length, nf.slice(0, 8));
console.log('rig logs', logs);
console.log('audio', aud.slice(0, 15));
fs.writeFileSync(OUT + `/smoke-${phase}.json`, JSON.stringify({ out, errs, nf, logs, aud }, null, 1));
await b.close();
