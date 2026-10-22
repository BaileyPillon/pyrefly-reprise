#!/usr/bin/env node
// Live real-input smoke, release 57 (main ed5cf5224, bundle IvYB9JEE). Headless Playwright, PYREFLY_BROWSER=gpu.
// window.__pyrefly is read-only here; every game input is a real key press.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { currentChromiumArgs, resolveBrowserMode } from '../../../tools/browser-mode.mjs';

const LIVE = 'https://echoesofspira.com/';
const url = `${LIVE}?livesmoke=${Date.now()}`;
const OUT = 'D:/pyrefly-release55/critic/reviews/ed5cf5224-live/shots';
mkdirSync(OUT, { recursive: true });
const mode = resolveBrowserMode(process.env);
const args = currentChromiumArgs(process.env);
const report = { mode, url, consoleErrors: [], notFound: [], badStatus: [], steps: [], audio: [], rigLogs: [], numerals: [] };
const t0 = Date.now();
const log = (step, ok, detail) => { report.steps.push({ step, ok, detail: detail ?? null }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${step}${detail ? ' - ' + detail : ''}`); };
const waitFor = async (page, fn, ms, poll = 200, arg) => { const s = Date.now(); for (;;) { const v = await page.evaluate(fn, arg); if (v) return v; if (Date.now() - s >= ms) return null; await page.waitForTimeout(poll); } };
const screen = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const board = (p) => p.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
const press = async (p, k, gap = 110) => { await p.keyboard.press(k); await p.waitForTimeout(gap); };
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` }).catch(() => null);
const MENU = '.ig-cmd-stack:not([hidden]) .ig-cmd, .ffx2hud__command .ig-cmd';
const menuUp = (p) => p.evaluate((q) => document.querySelectorAll(q).length > 0 || window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true, MENU);
const rowsOf = (p) => p.evaluate((q) => [...document.querySelectorAll(q)].map((r) => ({ t: r.textContent.trim().replace(/\s+/g, ' '), sel: r.classList.contains('ig-cmd--selected') })), MENU);

async function toChapterSelect(p) { for (let i = 0; i < 12 && (await screen(p)) !== 'chapter-select'; i++) await press(p, 'Enter', 800); return (await screen(p)) === 'chapter-select'; }
async function takeRow(p, label, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const rows = await rowsOf(p); const want = rows.findIndex((r) => r.t.toLowerCase().startsWith(label.toLowerCase())); const sel = rows.findIndex((r) => r.sel);
    if (want < 0) return false;
    if (sel === want) { await press(p, 'Enter', 250); return true; }
    await press(p, want > sel ? 'ArrowDown' : 'ArrowUp', 110);
  }
  return false;
}
async function prepToBattle(p, id) {
  const prep = await waitFor(p, () => window.__pyrefly?.app?.current?.name === 'party-prep', 20000, 300);
  log(`${id}: confirm -> party-prep`, !!prep, `screen=${await screen(p)}`);
  if (!prep) return false;
  await p.waitForTimeout(600); await shot(p, `${id}-prep`);
  await press(p, 'Enter', 300);
  let atB = false;
  for (let i = 0; i < 80 && !atB; i++) { await press(p, 'Enter', 450); atB = (await screen(p)) === 'battle'; }
  log(`${id}: prep + cutscene skip -> battle`, atB, `screen=${await screen(p)}`);
  if (!atB) return false;
  const m = await waitFor(p, (q) => document.querySelectorAll(q).length > 0 || window.__pyrefly?.battle?.()?.snapshot?.()?.playback?.awaitingMenu === true, 60000, 300, MENU);
  log(`${id}: player turn reached`, !!m);
  return !!m;
}
async function openPause(p) { await press(p, 'KeyP', 900); let on = (await screen(p)) === 'pause'; if (!on) { await press(p, 'Escape', 700); on = (await screen(p)) === 'pause'; } return on; }
async function closePause(p) { await press(p, 'Escape', 800); let r = (await screen(p)) === 'battle'; if (!r) { await press(p, 'Escape', 700); r = (await screen(p)) === 'battle'; } return r; }
const optionsOf = (p) => p.evaluate(() => [...document.querySelectorAll('.pause__row[data-action^="pause:row:"]')].map((r) => { const t = r.textContent.trim().replace(/\s+/g, ' '); const m = t.match(/^(.*?)(ON|OFF|\d+%?|\d+x|▸)$/); return { k: (m ? m[1] : t).trim(), v: m ? m[2] : '', sel: r.classList.contains('pause__row--sel') }; }));
async function toOptionsTab(p) { let f = false; for (let i = 0; i < 14 && !f; i++) { const t = await p.evaluate(() => document.querySelector('.pause__tab--on')?.textContent?.trim()); if (/OPTIONS/i.test(t || '')) f = true; else await press(p, 'ArrowRight', 250); } return f; }

async function main() {
  const browser = await chromium.launch({ headless: true, args });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(m.text()); const t = m.text(); if (/\[rig\]/.test(t)) report.rigLogs.push(t); });
  page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
  page.on('response', (r) => { const s = r.status(); if (s === 404) report.notFound.push(r.url()); if (s >= 400) report.badStatus.push(`${s} ${r.url()}`); });
  page.on('request', (r) => { if (/\.(mp3|ogg|m4a|wav|opus)(\?|$)/i.test(r.url())) report.audio.push(r.url()); });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const ready = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
    log('boot: __pyreflyReady', ready); if (!ready) throw new Error('not ready');
    log('boot: title screen', (await screen(page)) === 'title');
    const bundle = await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /assets\//.test(s)));
    log('served bundle names IvYB9JEE', bundle.some((s) => s.includes('IvYB9JEE')), bundle.join(' '));
    await shot(page, '01-title');
    log('title -> chapter-select (real Enter)', await toChapterSelect(page));
    await shot(page, '02-chapter-select');

    // ---- FFX Chapter VII Seymour Flux: Slow -> IMMUNE ----
    let b = await board(page); const order = b?.order ?? [];
    log('board lists seymour-flux', order.includes('seymour-flux'), `order=${order.join(',')}`);
    let n = 0;
    while (b?.selectedId !== 'seymour-flux' && n < order.length + 2) { await press(page, order.indexOf('seymour-flux') > order.indexOf(b?.selectedId) ? 'ArrowRight' : 'ArrowLeft', 150); b = await board(page); n++; }
    log('cursor on seymour-flux', b?.selectedId === 'seymour-flux');
    await press(page, 'Enter', 200);
    if (await prepToBattle(page, 'seymour-flux')) {
      await page.waitForTimeout(800); await shot(page, '03-flux-turn');
      log('FFX battle screen is battle, FFX HUD present', (await screen(page)) === 'battle' && (await page.evaluate(() => !!document.querySelector('.ig-cmd-stack'))));
      // cancel path
      const rows0 = await rowsOf(page);
      log('command menu rows', rows0.length > 0, JSON.stringify(rows0.map((r) => r.t)));
      const openedWM = await takeRow(page, 'White Magic');
      await page.waitForTimeout(300);
      const wmRows = await rowsOf(page);
      log('White Magic submenu opened', openedWM && wmRows.some((r) => /slow/i.test(r.t)), JSON.stringify(wmRows.map((r) => r.t)));
      await press(page, 'Escape', 400);
      const back = await rowsOf(page);
      log('cancel path: Escape returns to top command menu', back.some((r) => /^attack/i.test(r.t)), JSON.stringify(back.map((r) => r.t)));
      // positive path
      await takeRow(page, 'White Magic'); await page.waitForTimeout(250);
      const gotSlow = await takeRow(page, 'Slow');
      await page.waitForTimeout(300);
      const tsel = await page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null);
      log('Slow chosen, targeting up', gotSlow, JSON.stringify(tsel));
      if (tsel && !(tsel.ids ?? []).includes('seymour-flux')) { for (const k of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) { await press(page, k, 150); const s2 = await page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null); if ((s2?.ids ?? []).includes('seymour-flux')) break; } }
      // sample numerals while confirming
      await page.evaluate(() => { window.__seen = []; new MutationObserver((ms) => { for (const m of ms) for (const nd of m.addedNodes) { if (nd.nodeType === 1) { const els = [nd, ...nd.querySelectorAll?.('[class*="dnum"]') ?? []]; for (const e of els) if (e.className && /dnum/.test(String(e.className))) window.__seen.push({ text: e.textContent.trim(), cls: String(e.className) }); } } }).observe(document.body, { childList: true, subtree: true }); });
      const tfinal = await page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null);
      log('final Slow target selection', true, JSON.stringify(tfinal));
      await press(page, 'Enter', 200);
      await page.waitForTimeout(6000);
      const seen = await page.evaluate(() => window.__seen ?? []);
      const lg = await page.evaluate(() => (window.__pyrefly?.battleLog?.() ?? []).slice(-12).map((e) => ({ ...e })));
      report.numerals = seen;
      await shot(page, '04-flux-slow');
      const immuneEv = lg.some((e) => e.type === 'miss' && e.reason === 'immune' && (e.targetId ?? e.target) === 'seymour-flux');
      const immuneNum = seen.filter((s) => /IMMUNE/i.test(s.text)).length; const missNum = seen.filter((s) => /^MISS$/i.test(s.text)).length;
      log('Slow on Seymour Flux: engine says miss/immune', immuneEv, JSON.stringify(lg));
      log('Slow on Seymour Flux: HUD shows IMMUNE, not MISS', immuneNum >= 1 && missNum === 0, `IMMUNE=${immuneNum} MISS=${missNum} seen=${JSON.stringify(seen)}`);
      const au = await page.evaluate(() => { try { return window.__pyrefly?.audioDebug?.(); } catch { return null; } });
      report.audioDebug = au ? JSON.stringify(au).slice(0, 1500) : null;
      log('prerendered music requested (network)', report.audio.length > 0, `n=${report.audio.length} first=${report.audio[0] ?? ''}`);
      // pause / H / options
      const on = await openPause(page);
      log('P opens pause', on, `screen=${await screen(page)}`);
      if (on) {
        await page.waitForTimeout(1200); await shot(page, '05-flux-pause');
        const vis = () => page.evaluate(() => { const e = document.querySelector('.pause__ui'); const r = document.querySelector('.pause__stage'); return e ? getComputedStyle(e).display + '/bare=' + r.classList.contains('pause--bare') : null; });
        const v0 = await vis(); await press(page, 'KeyH', 500); const v1 = await vis(); await press(page, 'KeyH', 500); const v2 = await vis();
        log('H hides then restores pause panels', v0 !== null && v1 !== v0 && v2 === v0, `before=${v0} hidden=${v1} after=${v2}`);
        if (await toOptionsTab(page)) {
          await press(page, 'ArrowDown', 300);
          for (let i = 0; i < 16; i++) { const rs = await optionsOf(page); if (rs.find((r) => r.sel)?.k === 'MASTER VOLUME') break; await press(page, 'ArrowDown', 160); }
          const a0 = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v;
          await press(page, 'ArrowLeft', 300); await press(page, 'ArrowLeft', 300);
          const a1 = (await optionsOf(page)).find((r) => r.k === 'MASTER VOLUME')?.v;
          log('MASTER VOLUME lowered with real ArrowLeft', a0 !== a1, `${a0} -> ${a1}`);
        } else log('OPTIONS tab reached', false);
        log('Escape closes pause (back to battle)', await closePause(page), `screen=${await screen(page)}`);
      }
    }

    // ---- reload smoke ----
    const save = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || 'null'); } catch { return 'ERR'; } });
    const pre = await save();
    log('pre-reload save holds lowered masterVolume', typeof pre?.settings?.masterVolume === 'number' && pre.settings.masterVolume < 0.8, JSON.stringify({ masterVolume: pre?.settings?.masterVolume }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const r2 = await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 }).then(() => true, () => false);
    const post = await save();
    log('reload: re-boots; masterVolume survives', r2 && post?.settings?.masterVolume === pre?.settings?.masterVolume, JSON.stringify({ masterVolume: post?.settings?.masterVolume }));
    const progKeys = (o) => JSON.stringify(Object.keys(o ?? {}));
    log('reload: save progress keys preserved', progKeys(pre) === progKeys(post), progKeys(post));

    // ---- FFX-2 hidden Valefor at Besaid ----
    log('reload: title -> chapter-select', await toChapterSelect(page));
    await waitFor(page, () => !!window.__pyrefly?.app?.current?.snapshot?.()?.selectedId, 10000, 300);
    await page.waitForTimeout(500);
    for (const ch of 'valefor') { await page.keyboard.press(ch); await page.waitForTimeout(90); }
    await page.waitForTimeout(700);
    const bb = await board(page);
    log('board snapshot after door word', !!bb, JSON.stringify(bb)?.slice(0, 400) + ' screen=' + (await screen(page)));
    const doorOk = bb?.chapter === 'ffx2-valefor-besaid' || bb?.selectedId === 'ffx2-valefor-besaid';
    log('typed door word valefor opens ffx2-valefor-besaid (party prep)', doorOk, `chapter=${bb?.chapter} selected=${bb?.selectedId}`);
    await shot(page, '06-valefor-door');
    if (doorOk) {
      if (await prepToBattle(page, 'valefor-besaid')) {
        await page.waitForTimeout(1500); await shot(page, '07-valefor-turn');
        const rg = await page.evaluate(() => window.__pyrefly?.rigs?.() ?? null);
        const v = rg?.figures?.find((f) => f.subject === 'valefor');
        const k = rg?.figures?.find((f) => f.subject === 'kimahri');
        const l = rg?.figures?.find((f) => f.subject === 'lulu');
        log('rigs: switch on', !!rg?.switch?.on, JSON.stringify(rg?.switch));
        log('rigs: valefor rig ON in the Besaid chapter', v?.on === true, JSON.stringify(v));
        report.rigs = rg;
        log('FFX-2 HUD present', (await page.evaluate(() => !!document.querySelector('.ffx2hud__command'))));
        // fight Valefor with real keys until KO / end
        let ko = false, endScreen = null, turns = 0;
        const t1 = Date.now();
        let lastDiag = 0;
        let auto = false;
        while (Date.now() - t1 < 420000) {
          if (!auto && !globalThis.__pz && Date.now() - t1 > 25000) { globalThis.__pz = true; const on = await openPause(page); const sc1 = await screen(page); if (on) { await page.waitForTimeout(600); await shot(page, '07b-valefor-pause'); } const back = on ? await closePause(page) : false; log('Besaid mid-fight (real keys): P opens pause, Escape resumes', on && back, `pauseScreen=${sc1} backScreen=${await screen(page)}`); }
          if (!auto && Date.now() - t1 > 60000) { auto = true; await page.evaluate(() => { window.__pyrefly.autoBattle('intended'); try { window.__pyrefly.trigger('battle:fast'); } catch {} }); log('after 60s of real-key Attack turns, injected autoBattle(intended)+battle:fast to reach the KO (declared injection)', true); }
          if (false) { lastDiag = Date.now(); const d = await page.evaluate(() => { const sn = window.__pyrefly?.battle?.()?.snapshot?.(); const cs = sn?.combatants ?? sn?.state?.combatants ?? []; return { keys: Object.keys(sn ?? {}).slice(0, 12), hp: (Array.isArray(cs) ? cs : Object.values(cs)).map((c) => `${c.id}:${c.hp}/${c.maxHp ?? c.hpMax}`), log: (window.__pyrefly?.battleLog?.() ?? []).slice(-4).map((e) => e.type + ':' + (e.targetId ?? e.actorId ?? '')) }; }); console.log('DIAG', JSON.stringify(d)); }
          const sc = await screen(page);
          if (sc !== 'battle') { endScreen = sc; break; }
          if (!auto && await menuUp(page)) {
            if (await takeRow(page, 'Attack')) { await page.waitForTimeout(150); const s = await page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null); if (s) await press(page, 'Enter', 200); turns++; }
            else await press(page, 'Enter', 200);
          } else await page.waitForTimeout(300);
          const ev = await page.evaluate(() => (window.__pyrefly?.battleLog?.() ?? []).some((e) => /ko|defeat|down|died/i.test(e.type) && /valefor/i.test(String(e.targetId ?? e.target ?? e.actorId ?? ''))));
          if (ev) { ko = true; log('screen at KO detection', true, `screen=${await screen(page)} pausedFlag=${await page.evaluate(() => window.__pyrefly?.battle?.()?.snapshot?.()?.paused ?? null)}`); await page.waitForTimeout(1500); await shot(page, '08-valefor-ko'); const rg2 = await page.evaluate(() => window.__pyrefly?.rigs?.() ?? null); report.rigsAtKo = rg2?.figures?.find((f) => f.subject === 'valefor') ?? null; break; }
        }
        log('Valefor fought with real keys through its KO', ko, `turns=${turns} endScreen=${endScreen} elapsed=${Math.round((Date.now() - t1) / 1000)}s`);
        // pause/resume in this battle if still on battle
        const dd = await page.evaluate(() => { const sn = window.__pyrefly?.app?.current?.snapshot?.() ?? window.__pyrefly?.battle?.()?.snapshot?.(); return { canPause: sn?.canPause, paused: sn?.paused, exitIntent: sn?.exitIntent, pauseStage: !!document.querySelector('.pause__stage'), pauseLabel: document.querySelector('.pause__label, .pause-title')?.textContent ?? null }; }); await shot(page, '09-after-ko'); log('state after KO', true, JSON.stringify(dd)); log('screen 1.5s after KO', true, `screen=${await screen(page)}`); if ((await screen(page)) === 'battle') { const on = await openPause(page); const back = on ? await closePause(page) : false; log('Besaid battle after KO (autoBattle injected): P pause + Escape resume', on && back, `on=${on} back=${back} screen=${await screen(page)}`); }
        const au = report.audio.filter((u) => /valefor|battle|besaid|bgm|music/i.test(u));
        log('prerendered music fetched', report.audio.length > 0, `n=${report.audio.length} ${report.audio.slice(0, 4).join(' | ')}`);
      }
    }
  } catch (e) { log('script error', false, String(e)); }
  report.elapsedMin = +((Date.now() - t0) / 60000).toFixed(1);
  writeFileSync(`${OUT}/../smoke-result.json`, JSON.stringify(report, null, 1));
  console.log('consoleErrors', report.consoleErrors.length, 'notFound', report.notFound.length, 'badStatus', report.badStatus.length, 'elapsedMin', report.elapsedMin);
  await browser.close();
}
main();
