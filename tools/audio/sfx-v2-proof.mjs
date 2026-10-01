#!/usr/bin/env node
/**
 * SFX v2 (D-302) proof on a production build: play a chapter by real input, then let the rest of the
 * fight run, and record every sound the game started with the battle event it belongs to.
 *
 *   node tools/audio/sfx-v2-proof.mjs --url=http://127.0.0.1:4391/pyrefly-reprise/ --chapter=seymour-flux --out=<dir>
 *
 * HEADLESS Playwright only (PYREFLY_BROWSER=gpu for the GPU args), launched from this script. Every
 * game input in the real-input half is a key press or a tap: title, board, prep, the scene skip, the
 * pause menu, a cancelled submenu and the first turn or two (see below). Then
 * `__pyrefly.autoBattle('intended')` plays the rest of the fight (its route wins; a player's guesses
 * lost Chapter I in 50 s on the first try) so KOs, revives, statuses, Overdrives, summons and the
 * boss's charges happen on the same build.
 *
 * Reads, never writes, the game state: `audioDebug().sfxLog` (what was asked, what played, from which
 * sprite, at what volume), the presenter trace (which event was on screen), the battle log, and every
 * AudioBufferSourceNode.start (for the music under the fight, which tools/audio/sfx-v2-levels.py mixes).
 * Writes <out>/<chapter>.json and prints a summary; exits non-zero on a console error or a 404.
 * Agents cannot hear (AGENTS.md rule 13): this proves what plays, not how it sounds.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { currentChromiumArgs } from '../browser-mode.mjs';

const arg = (name, dflt) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? dflt;
const URL_BASE = arg('url', 'http://127.0.0.1:4391/pyrefly-reprise/');
const CHAPTER = arg('chapter', 'seymour-flux');
const OUT = arg('out', 'D:/Tools/pyrefly-scratch/sfx-v2-work/proof');
const MAX_MS = Number(arg('max-ms', '600000'));
/** `--auto-only`: no real input; the whole chapter by `gotoChapter(..., { auto: 'intended' })`, for a won fight's events. */
const AUTO_ONLY = process.argv.includes('--auto-only');
mkdirSync(OUT, { recursive: true });

const report = { chapter: CHAPTER, url: URL_BASE, steps: [], consoleErrors: [], notFound: [] };
const step = (name, ok, detail) => {
  report.steps.push({ name, ok, detail: detail ?? null });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail ? ' - ' + detail : ''}`);
};

const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs(process.env), '--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, hasTouch: true });
const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && report.consoleErrors.push(m.text()));
page.on('pageerror', (e) => report.consoleErrors.push(String(e)));
page.on('response', (r) => r.status() === 404 && report.notFound.push(r.url()));

await page.addInitScript(() => {
  const cap = (window.__sfxcap = { starts: [], trace: [] });
  const start = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when = 0, offset, duration) {
    cap.starts.push({ perf: performance.now(), ctxNow: this.context.currentTime, when, offset: offset ?? null, duration: duration ?? null, bufDur: this.buffer?.duration ?? null, loop: this.loop });
    return start.call(this, when, offset, duration);
  };
  // The battle log, kept as it grows: the screen after a won fight no longer has it.
  setInterval(() => {
    try {
      const log = window.__pyrefly?.battleLog?.();
      if (log && log.length >= (cap.log?.length ?? 0)) cap.log = log;
    } catch {
      /* not in a battle */
    }
  }, 500);
  setInterval(() => {
    try {
      const t = window.__pyrefly?.battle?.()?.presenter?.trace;
      if (t && !t.__sfxHooked) {
        t.__sfxHooked = true;
        const push = t.push;
        t.push = function (...items) {
          const ctx = window.__pyrefly.audioDebug();
          for (const x of items) cap.trace.push({ perf: performance.now(), seq: x.seq, type: x.type, sampleRate: ctx.sampleRate });
          return push.apply(this, items);
        };
      }
    } catch {
      /* not in a battle yet */
    }
  }, 4);
});

const screen = () => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);
const until = async (fn, ms, poll = 250) => {
  const t0 = Date.now();
  for (;;) {
    const v = await page.evaluate(fn).catch(() => null);
    if (v) return v;
    if (Date.now() - t0 > ms) return null;
    await page.waitForTimeout(poll);
  }
};
const rows = () =>
  page.evaluate(() => {
    const els = [...document.querySelectorAll('.ig-cmd-stack .ig-cmd, .ffx2hud__command .ig-cmd')].filter((e) => e.getBoundingClientRect().width > 0);
    return { labels: els.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()), sel: els.findIndex((e) => e.classList.contains('ig-cmd--selected')) };
  });
const targeting = () => page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null);
const menuUp = () => until(() => [...document.querySelectorAll('.ig-cmd-stack .ig-cmd, .ffx2hud__command .ig-cmd')].some((e) => e.getBoundingClientRect().width > 0), 60_000, 200);

/** Light the row matching `re` by arrows and take it with Enter, or tap it. */
async function take(re, how = 'keys') {
  for (let i = 0; i < 30; i++) {
    const r = await rows();
    const want = r.labels.findIndex((l) => re.test(l));
    if (want < 0) return null;
    if (how === 'tap') {
      const loc = page.locator('.ig-cmd-stack .ig-cmd, .ffx2hud__command .ig-cmd').filter({ hasText: r.labels[want] }).first();
      const box = await loc.boundingBox().catch(() => null);
      if (!box) return null;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(250);
      return r.labels[want];
    }
    if (r.sel === want) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      return r.labels[want];
    }
    await page.keyboard.press(want > r.sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(110);
  }
  return null;
}
/** Confirm the target the cursor offers (Enter), if targeting opened. */
async function aim() {
  for (let i = 0; i < 6 && !(await targeting()); i++) await page.waitForTimeout(150);
  if (await targeting()) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
}
/** The first submenu row (an item, a spell). */
async function takeFirstSub(how = 'keys') {
  await page.waitForTimeout(400);
  const r = await rows();
  if (!r.labels.length) return null;
  const label = r.labels[Math.max(0, r.sel)];
  if (how === 'tap') return take(new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'tap');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  return label;
}

const t0 = Date.now();
await page.goto(`${URL_BASE}?coach=off&sfxproof=${Date.now()}`, { waitUntil: 'domcontentloaded' });
step('boot', !!(await until(() => window.__pyreflyReady === true, 90_000)));
await page.evaluate((s) => window.__pyrefly.setSeed(s), Number(arg('seed', '1')));

let autoOutcome = null;
if (AUTO_ONLY) {
  await page.keyboard.press('Shift'); // a real gesture unlocks audio
  await page.waitForTimeout(800);
  const o = await page.evaluate(
    async ({ chapter, maxMs }) => {
      const run = window.__pyrefly.gotoChapter(chapter, { skipCutscenes: true, auto: 'intended', speed: 'normal' });
      const timeout = new Promise((r) => setTimeout(() => r({ outcome: 'timeout' }), maxMs));
      return (await Promise.race([run, timeout]))?.outcome ?? null;
    },
    { chapter: CHAPTER, maxMs: MAX_MS },
  );
  autoOutcome = o;
  step('whole chapter by the intended route', o === 'victory', String(o));
} else {
// Title -> board by Enter; the board to the chapter by arrows; confirm -> prep.
for (let i = 0; i < 10 && (await screen()) !== 'chapter-select'; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
}
step('title -> chapter select (Enter)', (await screen()) === 'chapter-select');
await page.waitForTimeout(1500);
const boardSel = () => page.evaluate(() => window.__pyrefly.app.current?.snapshot?.()?.selectedId ?? null);
for (let i = 0; i < 30 && (await boardSel()) !== CHAPTER; i++) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
}
step('board cursor on the chapter (arrows)', (await boardSel()) === CHAPTER);
await page.keyboard.press('Enter');
step('party prep', !!(await until(() => window.__pyrefly.app.current?.name === 'party-prep', 30_000)));
await page.waitForTimeout(1500);
for (const k of ['ArrowDown', 'ArrowUp']) {
  await page.keyboard.press(k);
  await page.waitForTimeout(300);
}
await page.keyboard.press('Enter'); // begin
await until(() => ['cutscene', 'battle'].includes(window.__pyrefly.app.current?.name ?? ''), 30_000);
for (let i = 0; i < 8 && (await screen()) !== 'battle'; i++) {
  await page.keyboard.down('Enter');
  await page.waitForTimeout(2500);
  await page.keyboard.up('Enter');
  await page.waitForTimeout(1200);
}
step('scene skipped -> battle (Enter held)', !!(await until(() => window.__pyrefly.app.current?.name === 'battle' && window.__pyrefly.battleState() !== null, 60_000)));
step('first command menu', !!(await menuUp()));
await page.waitForTimeout(1200);

// Real input, before the intended route takes over (so the fight is still won): the pause menu opened
// and closed (P), a submenu opened and cancelled (Escape), then one or two turns: FFX takes Attack by a
// tap and Enter on the target; FFX-2 takes an Item by keys and Attack by a tap.
await page.keyboard.press('KeyP');
await page.waitForTimeout(900);
const paused = (await screen()) === 'pause';
await page.keyboard.press('ArrowDown');
await page.waitForTimeout(300);
await page.keyboard.press('Escape');
await page.waitForTimeout(1200);
if ((await screen()) === 'pause') {
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(1200);
}
step('pause opened and closed (P, Escape)', paused && (await screen()) === 'battle');
await menuUp();
await page.waitForTimeout(500);
const opened = await take(/^item/i);
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
step('a submenu opened and cancelled (Enter, Escape)', !!opened);
const turns = [];
const ffx2 = CHAPTER.startsWith('ffx2');
const plan = ffx2
  ? [async () => (await take(/^item/i)) && (await takeFirstSub()) && (await aim(), 'item (keys)'), async () => (await take(/^attack/i, 'tap')) && (await aim(), 'attack (tap)')]
  : [async () => (await take(/^attack/i, 'tap')) && (await aim(), 'attack (tap)')];
for (const move of plan) {
  if (!(await menuUp())) break;
  await page.waitForTimeout(500);
  turns.push((await move().catch((e) => `error ${e}`)) || 'no row');
}
step('real-input turns', turns.length === plan.length && turns.every((t) => !/no row|error/.test(t)), turns.join(', '));

// The rest of the fight: the intended strategy, on the same build and the same battle.
await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
}
const outcome = AUTO_ONLY ? autoOutcome : await until(() => {
  const s = window.__pyrefly.battleState();
  const log = window.__pyrefly.battleLog();
  const end = log.find((e) => e.type === 'victory' || e.type === 'defeat');
  return s?.result?.outcome ?? (end ? end.type : null) ?? (window.__pyrefly.app.current?.name !== 'battle' ? 'left-battle' : null);
}, MAX_MS, 1000);
step('fight finished', !!outcome, String(outcome));
await page.waitForTimeout(4000);

const data = await page.evaluate(() => ({
  audio: window.__pyrefly.audioDebug(),
  log: window.__pyrefly.battleLog(),
  cap: window.__sfxcap,
  manifest: null,
}));
data.manifest = await page.evaluate(async () => (await fetch('audio/manifest.json')).json());
report.outcome = outcome;
report.wallMs = Date.now() - t0;
report.sfxLog = data.audio.sfxLog;
report.prerendered = data.audio.prerendered;
report.volumes = data.audio.volumes;
report.sfxMix = data.audio.sfxMix;
report.log = data.log.length ? data.log : (data.cap.log ?? []);
report.cap = data.cap;
report.manifestSfxV2Cues = Object.keys(data.manifest.sfxV2?.cues ?? {}).length;
report.musicManifest = data.manifest.music;
step('no console errors', report.consoleErrors.length === 0, report.consoleErrors.slice(0, 5).join(' | '));
step('no 404s', report.notFound.length === 0, report.notFound.slice(0, 5).join(' | '));
writeFileSync(`${OUT}/${CHAPTER}.json`, JSON.stringify(report));
console.log(`wrote ${OUT}/${CHAPTER}.json: ${report.sfxLog.length} plays, ${report.log.length} events, ${Math.round(report.wallMs / 1000)} s`);
await browser.close();
process.exit(report.steps.every((s) => s.ok) ? 0 : 1);
