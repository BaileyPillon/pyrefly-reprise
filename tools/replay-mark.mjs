#!/usr/bin/env node
/**
 * Replay a marked moment (N1, release 39.1; both games).
 *
 * The game's hidden mark key (the backtick, pressed in a battle) saves the chapter, the engine's seed, every input since the battle began with its time,
 * the build, the window and the settings (`src/app/markMoment.ts`, `markRecorder.ts`). This tool takes that record and plays the battle again in headless
 * Chromium, by real keys, to that moment, at a window size of your choice, and saves a frame.
 *
 *   node tools/replay-mark.mjs <code | record.json | localStorage-export.json | -> [options]
 *
 *   --url=<address>        the build to replay on: a dev server or a deployed address (default http://127.0.0.1:5173/)
 *   --size=WxH             the window (default: the recorded one)
 *   --out=<file.png>       where the frame goes (default replay-mark-frame.png)
 *   --compare=<file.png>   also say how much of that picture the frame differs from (needs `sharp`)
 *   --json=<file.json>     write the report there too
 *   --reduce-motion        emulate REDUCE MOTION (the camera sway stops, so frames repeat better)
 *   --hold-ms=<n>          wait this long at the moment before the frame (default 300)
 *   --timeout=<seconds>    give up after (default 600)
 *   --log=<file.json>      write the engine's event log at the moment (to see which event a replay parts from a record on)
 *   --trace=<file.json>    write the replay's clock, engine event count, screen and presenter phase every 250 ms (to see where a replay parts from a record)
 *
 * The code is the string the mark key copied; `-` reads it from the standard input; a JSON file may be the record, the `localStorage` value of
 * `pyrefly-reprise:mark:v1`, an export of the whole of `localStorage`, or Playwright's storage state: the newest mark in it is replayed.
 *
 * Every input is sent at its recorded time and no earlier than the engine event count it was pressed at, so a slower machine waits for the fight to
 * catch up. At the moment the report says whether the engine's event log matches the recorded hash (the engines are deterministic under their seed, so
 * a mismatch is a finding: the sources of non-determinism are listed at the top of `src/app/markMoment.ts`), how far the replay's clock was from the
 * recorded one, whether the party and the seed were the same, and which build the replay ran on. The presentation is not seeded (the idle sway, the
 * particles), so the frame is the same moment, not the same pixels, except under --reduce-motion where the sway is off.
 *
 * Browser: headless Chromium from node, never an extension or a browser pane. `PYREFLY_BROWSER=gpu` picks the real GPU (`tools/browser-mode.mjs`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { currentChromiumArgs } from './browser-mode.mjs';
import { fightEventCount, logHash, parseMarkInput, sequenceHash } from '../src/app/markMoment.ts';

/** Playwright key names for the codes the game records. They are the same strings; this is the one place to change if a layout needs another. */
export function keyForPlaywright(code) {
  return code;
}

/** `--name=value` and `--flag` into an object; the first plain argument is `input`. */
export function parseArgs(argv) {
  const out = { input: null, flags: {} };
  for (const a of argv) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq < 0) out.flags[a.slice(2)] = true;
      else out.flags[a.slice(2, eq)] = a.slice(eq + 1);
    } else if (out.input === null) out.input = a;
  }
  return out;
}

/** `1600x900` into `[1600, 900]`, or null. */
export function windowFromSize(text) {
  const m = /^(\d{2,5})x(\d{2,5})$/.exec(String(text ?? '').trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/**
 * Is this input (or the mark itself) due? Its time has come (a few ms early is fine) and the engine has played at least as many events as when it was
 * pressed. Pure: the whole of the replay's pacing.
 */
export function isDue(want, now, slackMs = 15) {
  return now.elapsed >= want.t - slackMs && now.seq >= want.s && (!want.m || now.menu !== false);
}

/** Inputs in the order they were made (the record keeps them in that order; a defensive stable sort). */
export function orderedInputs(record) {
  return record.inputs.map((x, i) => ({ x, i })).sort((a, b) => a.x.t - b.x.t || a.i - b.i).map((e) => e.x);
}

function readInput(arg) {
  if (arg === '-') return fs.readFileSync(0, 'utf8');
  if (fs.existsSync(arg)) return fs.readFileSync(arg, 'utf8');
  return arg;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { input, flags } = parseArgs(process.argv.slice(2));
  if (!input || flags.help) {
    console.error('usage: node tools/replay-mark.mjs <code | record.json | localStorage-export.json | -> [--url= --size=WxH --out= --compare= --json= --reduce-motion --hold-ms= --timeout=]');
    process.exit(input ? 0 : 2);
  }
  const record = parseMarkInput(readInput(input));
  if (!record) {
    console.error('replay-mark: that is not a mark (a PM1. code, a record, or an export of localStorage holding one)');
    process.exit(2);
  }
  const url = String(flags.url ?? 'http://127.0.0.1:5173/');
  const size = windowFromSize(flags.size) ?? record.win;
  const outFile = String(flags.out ?? 'replay-mark-frame.png');
  const holdMs = Number(flags['hold-ms'] ?? 300);
  const deadline = Date.now() + Number(flags.timeout ?? 600) * 1000;
  const reduce = flags['reduce-motion'] === true || flags['reduce-motion'] === 'true';
  const touch = record.inputs.some((i) => i.k === 'click' && i.p === 1);
  const usesPad = record.inputs.some((i) => i.k === 'pad');

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const report = { ok: false, input: { chapter: record.chapter, game: record.game, seed: record.seed, build: `${record.sha} ${record.bundle}`, window: record.win, inputs: record.inputs.length, mark: record.at }, replay: { url, size, reduceMotion: reduce }, notes: [] };
  try {
    const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch, reducedMotion: reduce ? 'reduce' : 'no-preference' });
    // the player's settings and the coaching already seen: both change what a key does (a fresh profile otherwise)
    await ctx.addInitScript(([k, v]) => { try { if (!localStorage.getItem(k)) localStorage.setItem(k, v); } catch { /* blocked storage */ } }, ['pyrefly-reprise:save:v1', JSON.stringify({ version: 1, settings: record.settings, seenCoach: record.seenCoach })]);
    if (usesPad) {
      await ctx.addInitScript(() => {
        const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
        const pad = { id: 'replay virtual pad (standard mapping)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };
        Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
        window.__replayPad = { set(i, down) { buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 }; pad.timestamp = performance.now(); } };
      });
    }
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
    const screen = () => page.evaluate(() => window.__pyrefly.screen());
    const want = async (name, ms = 60000) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        if ((await screen()) === name) return true;
        await sleep(100);
      }
      return false;
    };
    const press = async (k) => page.keyboard.press(k);

    // ---- to the battle, by real keys: the pre-battle part is not in the record, so the walk is the harness's (a held Enter when the opening ran hurried)
    if (record.seed !== null) await page.evaluate((n) => window.__pyrefly.setSeed(n), record.seed);
    if (!(await want('title'))) throw new Error('no title screen');
    await sleep(800);
    await press('Enter');
    for (let i = 0; i < 30 && (await screen()) !== 'chapter-select'; i++) {
      await sleep(300);
      if (i % 4 === 3) await press('Enter');
    }
    if (!(await want('chapter-select'))) throw new Error('chapter select not reached');
    const selected = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
    for (const k of [...Array(30).fill('ArrowRight'), ...Array(30).fill('ArrowLeft')]) {
      if ((await selected()) === record.chapter) break;
      await press(k);
      await sleep(160);
    }
    if ((await selected()) !== record.chapter) throw new Error(`chapter ${record.chapter} not found on the board`);
    await press('Enter');
    await sleep(2000);
    if ((await screen()) === 'party-prep') {
      await press('Enter');
      await sleep(2200);
    }
    if (record.hurried) {
      for (let holds = 0; holds < 16 && (await screen()) === 'cutscene'; holds++) {
        await page.keyboard.down('Enter');
        await sleep(3500);
        await page.keyboard.up('Enter');
        await sleep(200);
      }
    } else {
      const t0 = Date.now();
      while ((await screen()) === 'cutscene' && Date.now() - t0 < 240000) {
        await press('Enter');
        await sleep(900);
      }
    }
    if (!(await want('battle', 120000))) throw new Error('battle not reached');
    let t0Page = 0;
    for (let i = 0; i < 100 && !(t0Page > 0); i++) {
      t0Page = await page.evaluate(() => window.__pyrefly.battle()?.startedAt ?? 0);
      if (!(t0Page > 0)) await sleep(50);
    }
    if (!(t0Page > 0)) throw new Error('the battle screen has no start time');
    report.replay.party = await page.evaluate(() => [...(window.__pyrefly.battleState()?.activeIds ?? [])]);
    report.replay.seed = await page.evaluate(() => window.__pyrefly.battleState()?.seed ?? null);
    report.replay.build = await page.evaluate(() => window.__pyrefly.build?.() ?? null);

    // ---- the inputs, each when it is due
    const probe = () => page.evaluate((t0) => ({ elapsed: performance.now() - t0, seq: window.__pyrefly.battleLog().length, screen: window.__pyrefly.screen(), menu: window.__pyrefly.battle()?.battlePresenter?.snapshot?.()?.awaitingMenu === true }), t0Page);
    let late = 0;
    let forced = 0;
    const trace = [];
    let tracing = !!flags.trace;
    const sampler = (async () => {
      while (tracing) {
        try {
          const t = await page.evaluate((t0) => ({ e: Math.round(performance.now() - t0), s: window.__pyrefly.battleLog().length, screen: window.__pyrefly.screen(), phase: String(window.__pyrefly.battle()?.battlePresenter?.snapshot?.()?.phase ?? '') }), t0Page);
          trace.push(t);
        } catch { /* a page between screens */ }
        await sleep(250);
      }
    })();
    const waitDue = async (w, label) => {
      let first = null;
      for (;;) {
        const now = await probe();
        if (isDue(w, now)) {
          if (now.elapsed - w.t > 250) late++;
          return now;
        }
        if (now.elapsed >= w.t - 15) {
          first ??= Date.now();
          if (Date.now() - first > 15000) { // the engine never reached the recorded event count: send it anyway and say so
            forced++;
            report.notes.push(`${label}: the engine had ${now.seq} events when the record had ${w.s}${w.m && !now.menu ? ' and a menu waiting' : ''}; sent anyway after 15 s`);
            return now;
          }
        }
        if (Date.now() > deadline) throw new Error('timed out replaying the inputs');
        await sleep(20);
      }
    };
    for (const i of orderedInputs(record)) {
      await waitDue(i, `${i.k} at ${i.t} ms`);
      if (i.k === 'kd') await page.keyboard.down(keyForPlaywright(i.c));
      else if (i.k === 'ku') await page.keyboard.up(keyForPlaywright(i.c));
      else if (i.k === 'click') {
        if (i.p === 1) await page.touchscreen.tap(i.x, i.y);
        else await page.mouse.click(i.x, i.y);
      } else if (i.k === 'wheel') {
        await page.mouse.move(i.x, i.y);
        await page.mouse.wheel(i.dx, i.dy);
      } else if (i.k === 'pad') await page.evaluate(([b, d]) => window.__replayPad?.set(b, d === 1), [i.b, i.d]);
    }
    const reached = await waitDue(record.at, 'the mark');
    // the engine is at the moment; the presenter plays what the engine did a little behind it, so wait (up to 10 s) for it to be where the player's screen was
    const phaseNow = () => page.evaluate(() => String(window.__pyrefly.battle()?.battlePresenter?.snapshot?.()?.phase ?? ''));
    let phase = await phaseNow();
    for (let i = 0; i < 200 && record.at.phase && phase !== record.at.phase; i++) {
      await sleep(50);
      phase = await phaseNow();
    }
    await sleep(holdMs);
    tracing = false;
    await sampler;
    if (flags.trace) fs.writeFileSync(String(flags.trace), JSON.stringify(trace));

    // ---- the moment
    const log = await page.evaluate(() => JSON.parse(JSON.stringify(window.__pyrefly.battleLog())));
    const hash = logHash(log, record.at.s);
    if (flags.log) fs.writeFileSync(String(flags.log), JSON.stringify(log));
    const frame = await page.screenshot({ path: outFile });
    report.replay.reachedMs = Math.round(reached.elapsed);
    report.replay.phase = phase;
    report.phaseMatch = phase === record.at.phase;
    report.replay.clockDriftMs = Math.round(reached.elapsed - record.at.t);
    report.replay.events = log.length;
    report.replay.logHash = hash;
    report.logMatch = log.length >= record.at.s && hash === record.at.h;
    // the same fight with the engine's clock left out: FFX-2's ATB runs by real time, so the exact hash can differ by the few tens of ms the keys came at
    report.sequenceHash = sequenceHash(log, record.at.n);
    report.sequenceMatch = !!record.at.hs && fightEventCount(log) >= record.at.n && report.sequenceHash === record.at.hs;
    report.partyMatch = JSON.stringify(report.replay.party) === JSON.stringify(record.party);
    report.seedMatch = record.seed === null || report.replay.seed === record.seed;
    report.lateInputs = late;
    report.forcedInputs = forced;
    report.buildMatch = !!report.replay.build && report.replay.build.sha === record.sha;
    if (record.truncated) report.notes.push('the record is truncated (more inputs than it keeps): the replay cannot be faithful');
    if (!report.logMatch && report.sequenceMatch) report.notes.push('the engine log is the same fight on a slightly different clock (FFX-2 ATB runs by real time): the same actions, targets, damage and statuses in the same order');
    else if (!report.logMatch) report.notes.push('the engine log at the mark does not match the recorded hash, even with the clock left out: a different build, party, seed, setting or input timing (see the sources of non-determinism in src/app/markMoment.ts)');
    if (!report.partyMatch) report.notes.push(`the party differs: recorded ${record.party.join(',')}, replayed ${report.replay.party.join(',')} (the prep screen is not part of the record)`);
    if (!report.buildMatch) report.notes.push(`the replay ran on ${JSON.stringify(report.replay.build)}, the record is from ${record.sha} ${record.bundle}`);
    report.replay.consoleErrors = errors.length;
    report.frame = path.resolve(outFile);
    report.ok = true;
    if (flags.compare) {
      try {
        const sharp = (await import('sharp')).default;
        const a = await sharp(fs.readFileSync(String(flags.compare))).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const b = await sharp(frame).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        if (a.info.width !== b.info.width || a.info.height !== b.info.height) report.compare = { error: `sizes differ: ${a.info.width}x${a.info.height} against ${b.info.width}x${b.info.height}` };
        else {
          let n = 0;
          let big = 0;
          for (let p = 0; p < a.data.length; p += 3) {
            const d = Math.max(Math.abs(a.data[p] - b.data[p]), Math.abs(a.data[p + 1] - b.data[p + 1]), Math.abs(a.data[p + 2] - b.data[p + 2]));
            if (d > 8) n++;
            if (d > 48) big++;
          }
          const total = a.info.width * a.info.height;
          report.compare = { file: String(flags.compare), differsShare: +(n / total).toFixed(4), strongShare: +(big / total).toFixed(4) };
        }
      } catch (e) {
        report.compare = { error: String(e.message ?? e) };
      }
    }
  } catch (e) {
    report.error = String(e.stack ?? e);
  } finally {
    await browser.close().catch(() => undefined);
  }
  console.log(JSON.stringify(report, null, 2));
  if (flags.json) fs.writeFileSync(String(flags.json), JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
