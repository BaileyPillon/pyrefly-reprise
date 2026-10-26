#!/usr/bin/env node
/**
 * THE FIGHT-START TIMELINE (post-conference lane "post-fight-start", PR-0481; both games: Chapter I Seymour Flux is FFX, Chapter IV Bahamut is FFX-2; measurement only).
 *
 * From the press that picks a fight to the first command menu, on a served PRODUCTION build, split into its parts: the press, the waits before anything is drawn, the party prep and the pre-battle
 * scene (select path) or the voiced intro (demo, Chapter I), the entry transition and the loading card on it, the battle's boss card, the opening sweep, the arrival, and the first menu. Every
 * run is one real-input session (a simulated gamepad: A, the d-pad, nothing else), read by the in-page instrument (`fight-start-instrument.mjs`) on the page's own clock, then cut into parts
 * by `fight-start-split.mjs`.
 *
 *   node tools/fight-start-timeline.mjs --base=http://127.0.0.1:5604/ --path=demo|select --chapter=seymour-flux|ffx2-bahamut --out=<file.json>
 *        [--cache=cold|both] [--dwell=fast|human] [--size=2560x1440] [--scene=taps|hold] [--label=x] [--query=a=b] [--headed] [--frames=<dir>] [--lock=<file>|none]
 *   node tools/fight-start-timeline.mjs --plan=<jobs.json> [--budgetMin=7] [--skippedPlan=<file>]     a list of jobs ([{base, path, chapter, dwell, cache, out, label, ...}], the flags above by name), one browser each, one after the other under ONE lock
 *
 *   --path=demo     `?demo=1`: title -> A -> the two-card picker -> (the cursor goes to the fight) -> A. The press is the A on the card.
 *   --path=select   the ordinary game (`?coach=off`): title -> A -> the chapter board -> (the cursor goes to the chapter) -> A -> party prep -> A -> the pre-battle scene (`--scene=taps`: A every
 *                   650 ms, a scene played through, so the opening is the full one; `--scene=hold`: Confirm held, the scene skipped, the opening hurried) -> the battle.
 *   --cache=cold    a fresh browser context (nothing cached, no shader cache of its own): the first visit.   both: then the same page is loaded again in the same context (HTTP cache, GPU shader cache) and played
 *                   once more: the return visit ("warm"). The two runs of a pair share one browser launch.
 *   --dwell=fast    the press is made the moment the picker is up (the deep review's "fastest possible press"); human: 3 s on the title and 2.5 s on the board before the press (a visitor looking);
 *                   long: 9 s and 9 s (a visitor who waits for the booth: the demo's warm has had its time).
 *   --frames=<dir>  adds screenshots at the same MOMENTS of every run, named by what the page is doing (the prep menu +0.7 s, the pre-battle scene or the voiced intro +2.5 s, the loading card +0.5 s, the boss card +0.8 s, the sweep +2 s,
 *                   the first menu +0.5 s): `<route>-<chapter>-<cold|warm>-<moment>.png`, for a before/after comparison (`tools/fight-start-frames.mjs`). A screenshot stops the page for 100 ms or more:
 *                   a run with frames is for the pictures, never for the numbers.
 *   --profile       adds a CPU profile (CDP, 0.5 ms sampling) of the press to the first menu, written beside the output as <out>-<cold|warm>.cpuprofile; its sample times are put on the page's clock by
 *                   `profileOffsetMs` in the output. A profile slows the page a little: its timings are for finding the work, never for the before/after numbers.
 *
 * HEADLESS Playwright only (PYREFLY_BROWSER=gpu for the real GPU, as every timing run here). It takes the review-browser lock (`D:/Tools/pyrefly-scratch/RIG-RECORD`, JSON {who, pid, at, maxMinutes})
 * for the whole invocation (`tools/rig-record-lock.mjs`: it waits while another lane holds it and removes a lock only when it is its own or older than 15 minutes; keep a plan under 10 minutes). `--lock=none`
 * skips it (a run with no lock is for a test). One browser per job; nothing is written but the output files (and the shots).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';
import { INSTRUMENT } from './fight-start-instrument.mjs';
import { splitTimeline } from './fight-start-split.mjs';
import { RIG_RECORD, takeRigRecord } from './rig-record-lock.mjs';

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BTN = { A: 0, B: 1, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
/** [ms on the title, ms on the board] before the press, by dwell: fast = the moment the screen is up (the deep review's "fastest possible press"), human = a visitor looking, long = a visitor who waits for the booth (the demo's warm has had its time). */
const DWELL = { fast: [500, 300], human: [3000, 2500], long: [9000, 9000] };
const SEEDS = { 'seymour-flux': 7, 'ffx2-bahamut': 56 }; // the demo's own seeds: the party's first menu opens before any enemy acts, so "first command" is the opening's end

/** [name, mark key, value ('*' = any truthy value, 'any' = the mark at all), ms after the mark] */
const MOMENTS = [
  ['a-prep', 'screen', 'party-prep', 700],
  ['b-scene', 'screen', 'cutscene', 2500],
  ['c-loadcard', 'loadcard-add', 'any', 500],
  ['d-bosscard', 'bosscard-add', 'any', 800],
  ['d2-cardgone', 'bosscard-add', 'any', 1400],
  ['e-sweep', 'phase', 'moment:battle-start', 2000],
  ['f-menu', 'menu', '*', 500],
];

// ---- the simulated pad -------------------------------------------------------------------------------------------------------------------------------------------------------
const SHIM = () => {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0, vibrationActuator: null };
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
  window.__routePad = { set(i, d) { buttons[i] = { pressed: d, touched: d, value: d ? 1 : 0 }; pad.timestamp = performance.now(); } };
};

function cpuSample() {
  return os.cpus().reduce((a, c) => { for (const k of Object.keys(c.times)) a[k] = (a[k] ?? 0) + c.times[k]; return a; }, {});
}
function cpuBusy(a, b) {
  const d = (k) => (b[k] ?? 0) - (a[k] ?? 0);
  const total = ['user', 'nice', 'sys', 'idle', 'irq'].reduce((s, k) => s + d(k), 0);
  return total > 0 ? Math.round(((total - d('idle')) / total) * 1000) / 10 : null;
}

// ---- one session from the page's first load to the first command menu -------------------------------------------------------------------------------------------------------
async function session(page, job, which) {
  const { base, route, chapter, dwell, sceneMode } = job;
  const q = route === 'demo' ? `?demo=1${job.query ? `&${job.query}` : ''}` : `?coach=off${job.query ? `&${job.query}` : ''}`;
  const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
  const padSet = (i, d) => page.evaluate(([b, v]) => window.__routePad.set(b, v), [i, d]);
  const tap = async (b, down = 90, up = 90) => { await padSet(b, true); await sleep(down); await padSet(b, false); await sleep(up); };
  const want = async (name, ms = 90000) => { const t = Date.now(); while ((await scr()) !== name) { if (Date.now() - t > ms) throw new Error(`wanted screen ${name}, got ${await scr()}`); await sleep(60); } };
  const selected = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
  const cpu0 = cpuSample();
  const navStart = Date.now();
  await page.goto(`${base}${q}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await want('title');
  const titleReadyMs = Date.now() - navStart;
  if (route !== 'demo') await page.evaluate((s) => window.__pyrefly.setSeed(s), SEEDS[chapter] ?? 1);
  await sleep((DWELL[dwell] ?? DWELL.fast)[0]);
  await page.evaluate(() => window.__ft.mark('title-press'));
  await tap(BTN.A, 90, 60);
  await want('chapter-select');
  await page.evaluate(() => window.__ft.mark('board-up'));
  const boardAt = Date.now();
  await sleep((DWELL[dwell] ?? DWELL.fast)[1]);
  for (let i = 0; i < 40 && (await selected()) !== chapter; i++) {
    await tap(route === 'demo' ? BTN.RIGHT : BTN.DOWN, 70, 220);
    if ((await selected()) !== chapter && route !== 'demo' && i % 3 === 2) await tap(BTN.RIGHT, 70, 220);
  }
  if ((await selected()) !== chapter) throw new Error(`the cursor is on ${await selected()}, not ${chapter}`);
  const dwellLeft = (DWELL[dwell] ?? DWELL.fast)[1] - (Date.now() - boardAt);
  if (dwellLeft > 0) await sleep(dwellLeft);
  let cdp = null;
  let profileStartedAt = 0;
  if (job.profile) {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
    await cdp.send('Profiler.start');
    profileStartedAt = await page.evaluate(() => performance.now());
  }
  // THE PRESS: the page's clock, then the button goes down.
  await page.evaluate(() => { window.__ft.mark('press'); window.__routePad.set(0, true); });
  await sleep(90);
  await padSet(BTN.A, false);
  const t1 = Date.now();
  let prepDone = false;
  const framed = new Set();
  const frameDir = job.frames ? String(job.frames) : null;
  if (frameDir) fs.mkdirSync(frameDir, { recursive: true });
  const captureDue = async () => {
    const due = await page.evaluate((ms) => {
      const now = performance.now();
      return ms.filter(([, k, v, off]) => { const m = window.__ft.marks.find((x) => x.k === k && (v === 'any' ? true : v === '*' ? Boolean(x.v) : x.v === v)); return m && now >= m.t + off; }).map((m) => m[0]);
    }, MOMENTS);
    for (const name of due) {
      if (framed.has(name)) continue;
      framed.add(name);
      await page.screenshot({ path: path.join(frameDir, `${route}-${chapter}-${which}-${name}.png`) });
    }
  };
  let menuSeen = false;
  for (;;) {
    if (Date.now() - t1 > 150000) throw new Error(`no first menu after 150 s (screen ${await scr()})`);
    if (frameDir) await captureDue();
    if (menuSeen && (!frameDir || framed.has('f-menu'))) break;
    const s = await scr();
    if (s === 'party-prep' && !prepDone) {
      await sleep(dwell === 'fast' ? 250 : 1500);
      await page.evaluate(() => window.__ft.mark('prep-press'));
      await tap(BTN.A, 90, 60);
      prepDone = true;
    } else if (s === 'cutscene' && route === 'select') {
      if (sceneMode === 'hold') { await padSet(BTN.A, true); await sleep(900); await padSet(BTN.A, false); } else await tap(BTN.A, 70, 580);
    }
    if (!menuSeen) menuSeen = await page.evaluate(() => window.__ft.marks.some((x) => x.k === 'menu' && x.v));
    if (menuSeen && !frameDir) break;
    await sleep(s === 'cutscene' ? 20 : 80);
  }
  let profileFile = null;
  if (cdp) {
    const { profile } = await cdp.send('Profiler.stop');
    profileFile = job.out.replace(/\.json$/, `-${which}.cpuprofile`);
    fs.writeFileSync(profileFile, JSON.stringify(profile));
    await cdp.detach().catch(() => undefined);
  }
  await sleep(1500);
  const ft = await page.evaluate(() => ({ marks: window.__ft.marks, gaps: window.__ft.gaps, frames: window.__ft.frames, long: window.__ft.long, loaf: window.__ft.loaf, res: window.__ft.res, warm: window.__demoWarmLog ?? null }));
  const cpu1 = cpuSample();
  const split = splitTimeline(ft);
  log(`${route} ${chapter} ${which}: press -> first menu ${split.totalMs} ms; ${split.parts.map((p) => `${p.name} ${p.ms}`).join(', ')}; worst gap ${split.worstGapMs} ms; cpu ${cpuBusy(cpu0, cpu1)}%`);
  return { which, titleReadyMs, dwell, split, cpuBusyPct: cpuBusy(cpu0, cpu1), ...(profileFile ? { profileFile, profileOffsetMs: profileStartedAt } : {}), ...ft };
}

// ---- one job: one browser, a cold session and (cache=both) a warm one ---------------------------------------------------------------------------------------------------------
async function runJob(job) {
  let browser;
  try {
    browser = await chromium.launch({ headless: !job.headed, args: [...currentChromiumArgs()] });
    const [W, H] = job.size.split('x').map(Number);
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await ctx.addInitScript(SHIM);
    await ctx.addInitScript(INSTRUMENT);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror ${String(e).slice(0, 200)}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    const result = { label: job.label ?? null, base: job.base, route: job.route, chapter: job.chapter, cache: job.cache, dwell: job.dwell, sceneMode: job.sceneMode, size: job.size, mode: resolveBrowserMode(), seed: SEEDS[job.chapter] ?? 1, at: new Date().toISOString(), runs: [], errors };
    try {
      result.runs.push(await session(page, job, 'cold'));
      if (job.cache === 'both') result.runs.push(await session(page, job, 'warm'));
    } catch (err) {
      result.failed = String(err).slice(0, 300);
      log(`FAILED ${job.route} ${job.chapter}: ${result.failed}`);
      try { await page.screenshot({ path: job.out.replace(/\.json$/, '-failed.png') }); } catch { /* page gone */ }
    }
    result.errors = errors.slice(0, 10);
    fs.mkdirSync(path.dirname(job.out), { recursive: true });
    fs.writeFileSync(job.out, JSON.stringify(result, null, 1));
    log(`wrote ${job.out}`);
  } finally {
    try { await browser?.close(); } catch { /* gone */ }
  }
}

// ---- main --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const defaults = (o) => ({
  base: String(o.base ?? 'http://127.0.0.1:5604/').replace(/\/?$/, '/'),
  route: String(o.path ?? o.route ?? 'demo'),
  chapter: String(o.chapter ?? 'seymour-flux'),
  cache: String(o.cache ?? 'both'),
  dwell: String(o.dwell ?? 'fast'),
  sceneMode: String(o.scene ?? o.sceneMode ?? 'taps'),
  size: String(o.size ?? '2560x1440'),
  out: String(o.out ?? `D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/runs/timeline-${Date.now()}.json`),
  label: o.label ?? null,
  query: o.query ?? null,
  frames: o.frames ?? null,
  headed: o.headed === true,
  profile: o.profile === true || o.profile === 'true',
});
const jobs = args.plan ? JSON.parse(fs.readFileSync(String(args.plan), 'utf8')).map(defaults) : [defaults(args)];
const release = args.lock === 'none' ? () => undefined : await takeRigRecord(`post-fight-start timeline ${jobs.length} job(s) ${args.label ?? jobs[0].label ?? ''}`.trim(), { file: args.lock ? String(args.lock) : RIG_RECORD, ownPrefix: 'post-fight-start', log });
const budgetMs = Number(args.budgetMin ?? 7) * 60000; // the lock is promised for 10 minutes at most: no job starts after this much of them is used
const started = Date.now();
const skipped = [];
try {
  for (const job of jobs) {
    if (Date.now() - started > budgetMs) { skipped.push(job); log(`SKIPPED (the lock's ${Math.round(budgetMs / 60000 * 10) / 10}-minute budget is spent): ${job.route} ${job.chapter} -> ${job.out}`); continue; }
    await runJob(job);
  }
} finally {
  release();
}
if (skipped.length && args.skippedPlan) fs.writeFileSync(String(args.skippedPlan), JSON.stringify(skipped.map((j) => ({ ...j, path: j.route })), null, 1));
