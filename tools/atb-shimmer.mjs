#!/usr/bin/env node
/**
 * Does the FFX-2 ready shimmer restart with every rebuild of the party column? (T-05 of the motion-fluidity pass, lane L5; FFX-2 only; tooling.)
 *
 *   PYREFLY_BROWSER=gpu node tools/atb-shimmer.mjs --dist <built folder> [--windows 3] [--window-ms 3000] [--out <dir>]
 *
 * TB-03 of the timebase audit: under an open FFX-2 command menu the party and enemy columns are rebuilt with innerHTML about 16 times a second, so every CSS animation inside a rebuilt row restarts. The audit
 * measured the rebuild rate and the stepping of the bars, but its job for the shimmer's half never got the rig. This is that job, ported from the timebase lane's atb-job2.mjs and made repeatable: it opens
 * Chapter IV (`ffx2-bahamut`, seed 1, no auto strategy, so the game waits at the first command menu), then for `--windows` windows of `--window-ms` ms, on every drawn frame, stamps each element that carries an
 * `ffx2-shimmer` animation with a uid and logs which element each animation belongs to; a MutationObserver counts the party column's rebuilds. `shimmerVerdict` (critic/runner/lib/atb-pure.mjs) reads
 * each window: `persists` (one element kept its shimmer), `restarts-with-rebuild` (replaced about as often as the column was rebuilt) or `inconclusive` (no gauge was ready). Real time, real GPU, the real
 * display: this is the game as the booth plays it, not a virtual clock. One RIG-RECORD hold (3 minutes at most). Output: `atb-shimmer.json` (the windows, the verdicts, the stamp) and a screenshot.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { shimmerVerdict } from '../critic/runner/lib/atb-pure.mjs';
import { takeBrowserLock } from './measure/lock.mjs';
import { serveDist } from './measure/serve.mjs';
import { launchBrowser } from './measure/session.mjs';
import { describeStamp, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[atb-shimmer]', ...m);
const dist = path.resolve(String(val('dist', path.join(ROOT, 'dist-gate'))));
const windows = Number(val('windows', 3));
const windowMs = Number(val('window-ms', 3000));
const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'atb-shimmer'))));
fs.mkdirSync(outDir, { recursive: true });
process.env.PYREFLY_BROWSER ??= 'gpu';

/** In the page: for `ms`, every drawn frame, which element carries each `ffx2-shimmer` animation, and how many times the party column's children were replaced. */
const WATCH = async (ms) => {
  const party = document.querySelector('.ffx2hud__party');
  const log = [];
  let muts = 0;
  const mo = new MutationObserver((list) => { for (const m of list) if (m.type === 'childList') muts++; });
  if (party) mo.observe(party, { childList: true });
  let uid = window.__shimmerUid ?? 0;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      for (const a of document.getAnimations().filter((x) => x.animationName === 'ffx2-shimmer')) {
        const el = a.effect && a.effect.target;
        if (el && !el.dataset.uid) el.dataset.uid = String(++uid);
        log.push({ t: Math.round(now - t0), uid: el ? el.dataset.uid : null, cls: el ? el.className : null, connected: el ? el.isConnected : null, cur: Math.round(Number(a.currentTime)) });
      }
      if (now - t0 < ms) requestAnimationFrame(tick); else resolve(undefined);
    };
    requestAnimationFrame(tick);
  });
  mo.disconnect();
  window.__shimmerUid = uid;
  const by = {};
  for (const r of log) { const u = (by[r.uid] ??= { uid: r.uid, cls: r.cls, firstT: r.t, lastT: r.t, maxCur: 0, frames: 0 }); u.lastT = r.t; u.maxCur = Math.max(u.maxCur, r.cur); u.frames++; }
  return { frameRecords: log.length, mutations: muts, lives: Object.values(by).slice(0, 60), partyFound: Boolean(party) };
};

const stamp = toolStamp('atb-shimmer', 'tools/atb-shimmer.mjs', ROOT);
log(describeStamp(stamp));
const server = await serveDist(dist);
const release = await takeBrowserLock({ who: 'mf-l5-atb', what: 'atb-shimmer ffx2-bahamut', maxMinutes: 5, log });
let browser = null, out = null;
try {
  browser = await launchBrowser(ROOT);
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.goto(server.base, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${server.base}?coach=off`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(() => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter('ffx2-bahamut', { skipCutscenes: true }); });
  const t0 = Date.now();
  await page.waitForFunction(() => { const c = document.querySelector('.ffx2hud__command'); return !!c && !c.hidden && c.querySelector('.ig-cmd-stack, .ig-cmd, li, button') !== null; }, null, { timeout: 150000, polling: 100 });
  log(`the first command menu opened after ${(Date.now() - t0) / 1000} s`);
  await page.waitForTimeout(800);
  const results = [];
  for (let w = 0; w < windows; w++) {
    const raw = await page.evaluate(`(${WATCH.toString()})(${windowMs})`);
    const v = shimmerVerdict({ lives: raw.lives, mutations: raw.mutations, windowMs });
    results.push({ window: w + 1, ...raw, ...v });
    log(`window ${w + 1}: ${v.verdict}; ${v.distinctElements} element(s) carried the shimmer, longest ${v.longestLifeMs} ms; the column was rebuilt ${raw.mutations} times (${v.rebuildsPerSecond} a second); ${v.why}`);
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(outDir, 'atb-shimmer.png') });
  const verdicts = results.map((r) => r.verdict);
  const overall = verdicts.every((x) => x === verdicts[0]) ? verdicts[0] : 'mixed';
  out = { stamp, dist, chapter: 'ffx2-bahamut', windows, windowMs, overall, results, consoleErrors: errors.slice(0, 10) };
  fs.writeFileSync(path.join(outDir, 'atb-shimmer.json'), JSON.stringify(out, null, 1));
  log(`overall: ${overall}; written to ${path.join(outDir, 'atb-shimmer.json')}`);
} catch (e) {
  log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600));
  process.exitCode = 1;
} finally {
  try { await browser?.close(); } catch { /* gone */ }
  release();
  await server.close();
}
process.exit(process.exitCode ?? 0);
