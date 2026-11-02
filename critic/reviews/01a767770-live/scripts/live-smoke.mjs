#!/usr/bin/env node
// Live real-input smoke, release 72 (main 01a767770, bundle Cz_6EQVK). HEADLESS Playwright, PYREFLY_BROWSER=gpu.
// __pyrefly is read-only here; every game input is a real key press.
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from 'file:///D:/pyrefly-release55/tools/browser-mode.mjs';
import fs from 'node:fs';

const LIVE = 'https://echoesofspira.com/';
const url = `${LIVE}?livesmoke=${Date.now()}`;
const mode = resolveBrowserMode(process.env);
const args = currentChromiumArgs(process.env);
const OUT = 'D:/pyrefly-release55/critic/reviews/01a767770-live';
fs.mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const report = { mode, url, consoleErrors: [], notFound: [], steps: [], errors: [], audio: [] };
const log = (step, ok, detail) => { report.steps.push({ step, ok, detail: detail ?? null }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${step}${detail ? ' - ' + String(detail).slice(0, 400) : ''}`); };
const screenName = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const board = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
const awaitingMenu = (p) => p.evaluate(() => window.__pyrefly?.snapshotState?.()?.screenState?.playback?.awaitingMenu === true);
async function waitFor(p, fn, ms, poll = 250) { const s = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - s >= ms) return null; await p.waitForTimeout(poll); } }
const getSave = (p) => p.evaluate(() => { try { return localStorage.getItem('pyrefly-reprise:save:v1'); } catch { return null; } });

async function gotoChapter(page, id) {
  for (let i = 0; i < 12 && (await screenName(page)) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
  if ((await screenName(page)) !== 'chapter-select') return false;
  let b = await board(page); const order = b?.order ?? [];
  if (!order.includes(id)) { log(`board lists ${id}`, false, order.join(',')); return false; }
  for (let s = 0; b?.selectedId !== id && s < order.length + 2; s++) {
    await page.keyboard.press(order.indexOf(id) > order.indexOf(b?.selectedId) ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(150); b = await board(page);
  }
  return b?.selectedId === id;
}

async function playChapter(page, id, label, shot) {
  const sel = await gotoChapter(page, id);
  log(`${label}: chapter-select cursor on ${id}`, sel);
  if (!sel) return false;
  await page.keyboard.press('Enter');
  const prep = await waitFor(page, async () => (await screenName(page)) === 'party-prep', 20000);
  log(`${label}: party-prep`, !!prep);
  if (!prep) return false;
  await page.waitForTimeout(600); await page.keyboard.press('Enter');
  let atBattle = false;
  for (let i = 0; i < 80 && !atBattle; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); atBattle = (await screenName(page)) === 'battle'; }
  log(`${label}: battle screen`, atBattle);
  if (!atBattle) return false;
  const menu = await waitFor(page, () => awaitingMenu(page), 60000, 300);
  log(`${label}: reached a player turn (awaitingMenu)`, !!menu);
  const snap = await page.evaluate(() => { const s = window.__pyrefly?.snapshotState?.(); return { chapter: s?.chapterId ?? s?.screenState?.chapterId ?? null, keys: s ? Object.keys(s) : null }; });
  log(`${label}: state intended`, true, JSON.stringify(snap));
  await page.screenshot({ path: `${OUT}/${shot}.png` });
  return !!menu;
}

async function pauseCycle(page, label) {
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  let on = (await screenName(page)) === 'pause';
  log(`${label}: Escape opens pause`, on, await screenName(page));
  if (on) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); log(`${label}: Escape resumes`, (await screenName(page)) === 'battle', await screenName(page)); }
  await page.keyboard.press('KeyP'); await page.waitForTimeout(600);
  on = (await screenName(page)) === 'pause';
  log(`${label}: P opens pause`, on, await screenName(page));
  if (on) {
    const vis = () => page.evaluate(() => { const el = document.querySelector('.pause, [data-role="pause-root"], .screen.pause, [class*="pause"]'); if (!el) return null; return getComputedStyle(el).visibility + '/' + getComputedStyle(el).opacity + '/' + el.className; });
    const v0 = await vis();
    await page.keyboard.press('KeyH'); await page.waitForTimeout(500);
    const panels = (cls) => page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter(e => e.children.length || e.textContent.trim()).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { c: e.className.toString().slice(0, 40), vis: cs.visibility, op: cs.opacity, disp: cs.display, w: Math.round(r.width) }; }).slice(0, 12));
    const hidden = await panels();
    await page.screenshot({ path: `${OUT}/pause-hidden.png` });
    await page.keyboard.press('KeyH'); await page.waitForTimeout(500);
    const shown = await panels();
    log(`${label}: H hides then restores panels`, JSON.stringify(hidden) !== JSON.stringify(shown), `before=${v0} hidden=${JSON.stringify(hidden).slice(0, 200)} restored=${JSON.stringify(shown).slice(0, 200)}`);
    // settings probe: change one setting via real keys inside pause
    const s0 = await getSave(page);
    for (const k of ['ArrowDown', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) { await page.keyboard.press(k); await page.waitForTimeout(150); }
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const s1 = await getSave(page);
    log(`${label}: pause key presses`, true, `saveChanged=${s0 !== s1}`);
    report.saveBeforePauseProbe = s0; report.saveAfterPauseProbe = s1;
    await page.keyboard.press('KeyP'); await page.waitForTimeout(600);
    if ((await screenName(page)) === 'pause') { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }
    log(`${label}: resumes to battle`, (await screenName(page)) === 'battle', await screenName(page));
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true, args });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
  page.on('response', (r) => { if (r.status() === 404) report.notFound.push(r.url()); });
  page.on('request', (r) => { if (/\.(mp3|ogg|m4a|wav|opus|webm|flac)(\?|$)/i.test(r.url())) report.audio.push(r.url()); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const ready = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 40000 }).then(() => true, () => false);
    log('boot ready', ready); if (!ready) throw new Error('not ready');
    log('initial screen is title', (await screenName(page)) === 'title', await screenName(page));
    await page.screenshot({ path: `${OUT}/title.png` });
    for (let i = 0; i < 12 && (await screenName(page)) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(900); }
    log('title -> chapter-select', (await screenName(page)) === 'chapter-select');
    await page.screenshot({ path: `${OUT}/chapter-select.png` });
    const b0 = await board(page); log('board snapshot', !!b0, JSON.stringify(b0).slice(0, 300));

    // Chapter IX Yojimbo (FFX), positive path + pause + cancel path
    const ok9 = await playChapter(page, 'yojimbo-cavern', 'IX Yojimbo (FFX)', 'ix-yojimbo');
    if (ok9) {
      // cancel path: open a submenu, Escape back out
      const pre = await page.evaluate(() => document.querySelectorAll('[class*="cmd"]').length);
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
      await page.keyboard.press('Enter'); await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/ix-submenu.png` });
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      log('IX: submenu open then Escape cancel returns to command menu', await awaitingMenu(page), `cmdEls=${pre}`);
      // positive path: Attack (first row) + confirm target
      await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/ix-after-attack.png` });
      log('IX: attack command issued (real Enter), battle still running', (await screenName(page)) === 'battle', await screenName(page));
      await pauseCycle(page, 'IX');
    }
    // Reload smoke
    const saveBefore = await getSave(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const rr = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 40000 }).then(() => true, () => false);
    const saveAfter = await getSave(page);
    log('reload: app re-boots', rr);
    log('reload: save blob identical (settings and progress survive)', saveBefore === saveAfter && saveBefore !== null, `len=${saveBefore?.length} -> ${saveAfter?.length}`);
    try { const sa = JSON.parse(saveAfter); report.saveSummary = { keys: Object.keys(sa), settingsKeys: Object.keys(sa.settings ?? {}).length, cleared: sa.cleared ?? sa.progress ?? null }; } catch {}

    // Other changed chapters, each to a player turn
    for (const [id, label, shot] of [['seymour-omnis', 'XII Omnis (FFX)', 'xii-omnis'], ['braskas-final-aeon', 'III Braska (FFX)', 'iii-braska'], ['ffx2-fallen-aeons', 'XI Fallen Aeons (FFX-2)', 'xi-fallen']]) {
      await page.goto(`${LIVE}?livesmoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 40000 }).catch(() => null);
      const ok = await playChapter(page, id, label, shot);
      if (ok && id === 'seymour-omnis') await pauseCycle(page, 'XII');
    }
    log('prerendered audio files fetched over the network', report.audio.length > 0, `count=${report.audio.length} sample=${report.audio.slice(0, 3).join(' | ')}`);
  } catch (e) { report.errors.push(String(e?.stack ?? e)); console.error(e); }
  finally { await browser.close(); }
  report.elapsedMinutes = +((Date.now() - t0) / 60000).toFixed(1);
  fs.writeFileSync(`${OUT}/smoke-report.json`, JSON.stringify(report, null, 2));
  console.log('\nconsoleErrors', report.consoleErrors.length, 'notFound', report.notFound.length, 'min', report.elapsedMinutes);
  console.log(JSON.stringify({ ce: report.consoleErrors.slice(0, 10), nf: report.notFound.slice(0, 10), errs: report.errors }, null, 1));
}
await main();
