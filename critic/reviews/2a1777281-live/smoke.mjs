#!/usr/bin/env node
// Live real-input smoke for release 37 (main cd9dbbb0, bundle BGBDEn_P). Headless Playwright, PYREFLY_BROWSER=gpu.
// Read-only use of window.__pyrefly (screen name, snapshots); every game input is a real key press.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { currentChromiumArgs, resolveBrowserMode } from './tools/browser-mode.mjs';

const LIVE = 'https://baileypillon.github.io/pyrefly-reprise/';
const url = `${LIVE}?livesmoke=${Date.now()}`;
const OUT = process.env.SMOKE_OUT;
mkdirSync(OUT, { recursive: true });
const mode = resolveBrowserMode(process.env);
const args = currentChromiumArgs(process.env);
const report = { mode, url, consoleErrors: [], notFound: [], badStatus: [], steps: [], errors: [], audio: [], html404img: [], living: [], partReqs: [] };
const t0 = Date.now();
const log = (step, ok, detail) => {
  report.steps.push({ step, ok, detail: detail ?? null });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${step}${detail ? ' - ' + detail : ''}`);
};
const waitFor = async (page, fn, ms, poll = 200, arg) => {
  const s = Date.now();
  for (;;) {
    const v = await page.evaluate(fn, arg);
    if (v) return v;
    if (Date.now() - s >= ms) return null;
    await page.waitForTimeout(poll);
  }
};
const screen = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const board = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
const press = async (p, k, gap = 110) => { await p.keyboard.press(k); await p.waitForTimeout(gap); };
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` }).catch(() => null);

async function menuUp(p) {
  return p.evaluate(() => document.querySelectorAll('.ffx2hud__command .ig-cmd, .ffxhud__command .ig-cmd, [data-role="ffx-command-menu"] .ig-cmd').length > 0
    || window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true);
}
async function toChapterSelect(p) {
  for (let i = 0; i < 12 && (await screen(p)) !== 'chapter-select'; i++) await press(p, 'Enter', 800);
  return (await screen(p)) === 'chapter-select';
}
async function selectChapter(p, id) {
  let b = await board(p);
  const order = b?.order ?? [];
  if (!order.includes(id)) return { ok: false, order };
  let n = 0;
  while (b?.selectedId !== id && n < order.length + 2) {
    await press(p, order.indexOf(id) > order.indexOf(b?.selectedId) ? 'ArrowRight' : 'ArrowLeft', 150);
    b = await board(p); n++;
  }
  return { ok: b?.selectedId === id, order };
}
async function enterBattle(p, id) {
  const sel = await selectChapter(p, id);
  log(`board cursor reached ${id}`, sel.ok, `order=${(sel.order || []).join(',')}`);
  if (!sel.ok) return false;
  await press(p, 'Enter', 200);
  const prep = await waitFor(p, () => window.__pyrefly?.app?.current?.name === 'party-prep', 20000, 300);
  log(`${id}: confirm -> party-prep`, !!prep, `screen=${await screen(p)}`);
  if (!prep) return false;
  await p.waitForTimeout(600);
  await shot(p, `${id}-prep`);
  await press(p, 'Enter', 300);
  let atB = false;
  for (let i = 0; i < 80 && !atB; i++) { await press(p, 'Enter', 450); atB = (await screen(p)) === 'battle'; }
  log(`${id}: prep + cutscene skip -> battle`, atB, `screen=${await screen(p)}`);
  if (!atB) return false;
  const m = await waitFor(p, () => document.querySelectorAll('.ffx2hud__command .ig-cmd, .ffxhud__command .ig-cmd, [data-role="ffx-command-menu"] .ig-cmd').length > 0 || window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true, 60000, 300);
  log(`${id}: player turn reached`, !!m);
  return !!m;
}
async function optionsOf(p) {
  return p.evaluate(() => [...document.querySelectorAll('.pause__row[data-action^="pause:row:"]')].map((r) => {
    const t = r.textContent.trim().replace(/\s+/g, ' ');
    const m = t.match(/^(.*?)(ON|OFF|\d+%?|\d+x|▸)$/);
    return { id: r.dataset.action.slice(10), k: (m ? m[1] : t).trim(), v: m ? m[2] : '', sel: r.classList.contains('pause__row--sel') };
  }));
}
async function openPauseOptions(p) {
  await press(p, 'Escape', 600);
  let on = (await screen(p)) === 'pause';
  if (!on) { await press(p, 'KeyP', 600); on = (await screen(p)) === 'pause'; }
  log('Escape/P opens pause', on, `screen=${await screen(p)}`);
  if (!on) return false;
  let found = false;
  for (let i = 0; i < 14 && !found; i++) {
    const t = await p.evaluate(() => document.querySelector('.pause__tab--on')?.textContent?.trim());
    if (/OPTIONS/i.test(t || '')) found = true; else await press(p, 'ArrowRight', 250);
  }
  log('pause: OPTIONS tab reached by real ArrowRight', found);
  if (!found) return false;
  await press(p, 'ArrowDown', 300); // enter body
  return true;
}
async function walkToRow(p, label) {
  for (let i = 0; i < 16; i++) {
    const rows = await optionsOf(p);
    const s = rows.find((r) => r.sel);
    if (s && s.k === label) return rows;
    await press(p, 'ArrowDown', 160);
  }
  return null;
}

async function livingProbe(p, label, ms = 8000) {
  // Sample the living twin of the plate: data-living plate id, data-ready, data-state (changes when the face moves) and the canvas pixel hash.
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await p.evaluate(() => {
      const w = document.querySelector('[data-living]');
      if (!w) return null;
      const c = w.querySelector('canvas');
      let h = 0, nz = 0;
      try {
        const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < d.length; i += 4) { if (d[i] > 0) { nz++; h = (h * 31 + i + d[i]) | 0; } }
      } catch (e) { h = 'ERR'; }
      return { plate: w.dataset.living, ready: w.dataset.ready, state: w.dataset.state ?? null, nz, h };
    });
    samples.push(s);
    await p.waitForTimeout(250);
  }
  const live = samples.filter(Boolean);
  const states = new Set(live.map((x) => x.state));
  const hashes = new Set(live.map((x) => x.h));
  const res = { label, n: samples.length, present: live.length, plate: live[0]?.plate ?? null, ready: live.some((x) => x.ready === 'true'), distinctStates: states.size, distinctHashes: hashes.size, maxNonZeroAlpha: Math.max(0, ...live.map((x) => x.nz)) };
  report.living.push(res);
  return res;
}
async function pauseTabs(p) { return p.evaluate(() => [...document.querySelectorAll('.pause__tab')].map((t) => t.textContent.trim().slice(0, 14) + (t.classList.contains('pause__tab--on') ? '*' : ''))); }
async function toOptionsTab(p) {
  let found = false;
  for (let i = 0; i < 14 && !found; i++) {
    const t = await p.evaluate(() => document.querySelector('.pause__tab--on')?.textContent?.trim());
    if (/OPTIONS/i.test(t || '')) found = true; else await press(p, 'ArrowRight', 250);
  }
  return found;
}
async function closePause(p) {
  await press(p, 'Escape', 800);
  let res = (await screen(p)) === 'battle';
  if (!res) { await press(p, 'Escape', 700); res = (await screen(p)) === 'battle'; }
  return res;
}
async function openPause(p) {
  await press(p, 'KeyP', 900);
  let on = (await screen(p)) === 'pause';
  if (!on) { await press(p, 'Escape', 700); on = (await screen(p)) === 'pause'; }
  return on;
}
async function main() {
  const browser = await chromium.launch({ headless: true, args });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
  page.on('response', (r) => {
    const s = r.status();
    if (s === 404) report.notFound.push(r.url());
    if (s >= 400) report.badStatus.push(`${s} ${r.url()}`);
    const ct = r.headers()['content-type'] || '';
    if (/\.(png|jpg|webp)(\?|$)/i.test(r.url()) && /text\/html/.test(ct)) report.html404img.push(r.url());
    if (/portrait-parts/.test(r.url())) report.partReqs.push(`${s} ${r.url().replace(LIVE, '')}`);
  });
  page.on('request', (r) => { if (/\.(mp3|ogg|m4a|wav|opus)(\?|$)/i.test(r.url())) report.audio.push(r.url()); });
  try {
    const tLoad = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const ready = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
    log('boot: __pyreflyReady', ready, `loadMs=${Date.now() - tLoad}`);
    if (!ready) throw new Error('not ready');
    log('boot: title screen', (await screen(page)) === 'title', `screen=${await screen(page)}`);
    const bundle = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /assets\//.test(s)));
    log('served bundle names BGBDEn_P', bundle.some((s) => s.includes('BGBDEn_P')), bundle.join(' '));
    await shot(page, '01-title');
    log('title -> chapter-select (real Enter)', await toChapterSelect(page));
    await shot(page, '02-chapter-select');

    // ---------- Chapter I (FFX) ----------
    const b1 = await enterBattle(page, 'seymour-flux');
    if (b1) {
      await page.waitForTimeout(800);
      await shot(page, '03-ch1-turn');
      await press(page, 'ArrowDown', 200); await press(page, 'Enter', 400);
      await press(page, 'Escape', 400);
      log('Ch I cancel path: submenu then Escape returns to command menu', await menuUp(page));
      await page.waitForTimeout(300);
      await press(page, 'Enter', 400);
      for (let i = 0; i < 3; i++) await press(page, 'Enter', 300);
      await page.waitForTimeout(1500);
      log('Ch I attack issued, battle still running', (await screen(page)) === 'battle');

      const on = await openPause(page);
      log('Ch I: P opens pause', on, `screen=${await screen(page)} tabs=${JSON.stringify(await pauseTabs(page))}`);
      if (on) {
        await page.waitForTimeout(1200);
        await shot(page, '04-ch1-pause');
        const r = await livingProbe(page, 'ch1-first-plate');
        log('Ch I pause: living twin present, ready, face parts move (states>1, canvas pixels change)', r.present > 0 && r.ready && r.distinctStates > 1 && r.distinctHashes > 1, JSON.stringify(r));
        await shot(page, '05-ch1-pause-later');
        await press(page, 'KeyE', 900);
        const r2 = await livingProbe(page, 'ch1-after-E', 6000);
        log('Ch I pause: E moves to next plate, living twin follows and moves', r2.present > 0 && r2.ready && r2.distinctStates > 1, `before=${r.plate} after=${r2.plate} ${JSON.stringify(r2)}`);
        await shot(page, '06-ch1-pause-E');
        const vis = () => page.evaluate(() => { const e = document.querySelector('.pause__ui'); const r = document.querySelector('.pause__stage'); return e ? getComputedStyle(e).display + '/bare=' + r.classList.contains('pause--bare') : null; });
        const v0 = await vis(); await press(page, 'KeyH', 500); const v1 = await vis(); await press(page, 'KeyH', 500); const v2 = await vis();
        log('H hides then restores pause panels', v0 !== null && v1 !== v0 && v2 === v0 && /^none/.test(v1), `before=${v0} hidden=${v1} after=${v2}`);
        const found = await toOptionsTab(page);
        log('pause: OPTIONS tab reached by real ArrowRight', found);
        if (found) {
          await press(page, 'ArrowDown', 300);
          const w = await walkToRow(page, 'MASTER VOLUME');
          const v0 = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v;
          if (w) {
            await press(page, 'ArrowLeft', 300); await press(page, 'ArrowLeft', 300);
            const v1 = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v;
            log('MASTER VOLUME lowered with real ArrowLeft', v0 !== v1, `before=${v0} after=${v1}`);
            report.volAfter = v1;
          }
        }
        log('Ch I: Escape closes the pause (back to battle)', await closePause(page), `screen=${await screen(page)}`);
        const gone = await page.evaluate(() => document.querySelectorAll('[data-living]').length);
        log('Ch I: living twin removed after close', gone === 0, `count=${gone}`);
      }
    }

    // ---------- Reload smoke ----------
    const pre = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return 'ERR'; } });
    report.preMaster = pre?.settings?.masterVolume;
    log('pre-reload save holds the lowered masterVolume', typeof pre?.settings?.masterVolume === 'number' && pre.settings.masterVolume < 0.8, JSON.stringify({ masterVolume: pre?.settings?.masterVolume }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const r2 = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
    const post = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return 'ERR'; } });
    log('reload: re-boots; lowered masterVolume survives', r2 && post?.settings?.masterVolume === pre?.settings?.masterVolume, JSON.stringify({ masterVolume: post?.settings?.masterVolume }));

    // ---------- Chapter IV (FFX-2) ----------
    log('reload: title -> chapter-select', await toChapterSelect(page));
    const b4 = await enterBattle(page, 'ffx2-bahamut');
    if (b4) {
      await page.waitForTimeout(800);
      await shot(page, '07-ch4-turn');
      const rows = await page.evaluate(() => [...document.querySelectorAll('.ffx2hud__command .ig-cmd')].map((r) => r.textContent.trim().slice(0, 20)));
      log('Ch IV (FFX-2) command menu rows', rows.length > 0, JSON.stringify(rows));
      for (let i = 0; i < 4; i++) await press(page, 'Enter', 300);
      await page.waitForTimeout(2000);
      log('Ch IV attack issued, battle still running', (await screen(page)) === 'battle');
      const on = await openPause(page);
      log('Ch IV: P opens pause', on, `screen=${await screen(page)} tabs=${JSON.stringify(await pauseTabs(page))}`);
      if (on) {
        await page.waitForTimeout(1200);
        await shot(page, '08-ch4-pause');
        const r = await livingProbe(page, 'ch4-first-plate');
        log('Ch IV pause: living twin present, ready, face parts move', r.present > 0 && r.ready && r.distinctStates > 1 && r.distinctHashes > 1, JSON.stringify(r));
        await shot(page, '09-ch4-pause-later');
        await press(page, 'KeyE', 900);
        const rb = await livingProbe(page, 'ch4-after-E', 6000);
        log('Ch IV pause: E moves to next plate, living twin follows and moves', rb.present > 0 && rb.ready && rb.distinctStates > 1, `before=${r.plate} after=${rb.plate} ${JSON.stringify(rb)}`);
        const found = await toOptionsTab(page);
        if (found) {
          await press(page, 'ArrowDown', 300);
          const w = await walkToRow(page, 'MASTER VOLUME');
          const v = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v;
          log('after reload, OPTIONS still shows the lowered MASTER VOLUME', v === report.volAfter, `value=${v} expected=${report.volAfter}`);
          if (w) { await press(page, 'ArrowRight', 300); await press(page, 'ArrowRight', 300); log('restored MASTER VOLUME', (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v === '80', `value=${(await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v}`); }
        }
        log('Ch IV: Escape closes the pause', await closePause(page), `screen=${await screen(page)}`);
        log('Ch IV: living twin removed after close', (await page.evaluate(() => document.querySelectorAll('[data-living]').length)) === 0);
      }
    }

    // ---------- Audio ----------
    const au = await page.evaluate(() => {
      const a = window.__pyrefly?.audio; try { return a ? JSON.stringify(a.debug?.() ?? a.state?.() ?? Object.keys(a)) : null; } catch (e) { return 'ERR ' + e; }
    });
    report.audioDebug = au;
    log('prerendered audio fetched over network', report.audio.length > 0, `count=${report.audio.length} sample=${report.audio.slice(0, 3).join(' | ')} dbg=${au}`);
  } catch (e) {
    report.errors.push(String(e?.stack ?? e));
    console.error(e);
  } finally {
    await browser.close();
  }
  report.elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
  console.log('\n=== REPORT ===');
  console.log(JSON.stringify(report, null, 2));
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
}
await main();
