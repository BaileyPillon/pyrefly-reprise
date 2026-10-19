#!/usr/bin/env node
/**
 * Before / after captures of the FFX target-step parity (re-parity RC11, lane "FFX target parity", `TARGET_STEP_PARITY`; FFX only; the switch is OFF in the build, this tool turns it on in the page).
 *
 *   PYREFLY_BROWSER=gpu node tools/re-parity-target-parity-shots.mjs --tag=before --url=http://127.0.0.1:5197/ --work=<dir>
 *   PYREFLY_BROWSER=gpu node tools/re-parity-target-parity-shots.mjs --tag=after  --url=http://127.0.0.1:5197/ --work=<dir>
 *   node tools/re-parity-target-parity-shots.mjs --compose --work=<dir> --out=docs/screenshots/re-parity-rc11-target-parity
 *
 * All by real key presses on the live menus (headless Chromium from node; never the browser pane). `--tag=after` flips the switch in the page before the battle starts (a dynamic import of the
 * dev server's own module, so it is the app's instance). A state a scene needs (two allies knocked out) is set on the live engine by the page after the first menu opens, as the engine tests set
 * it. Output: the full 1600x900 captures in `--work`, and with `--compose` a crop of each before/after pair side by side in `--out` (small jpgs).
 *
 * Scenarios: j (Chapter II, Auron's Guard: the self cursor), k (Tidus and Yuna down, Auron's Phoenix Down: the revive cursor), l (nobody down, Tidus's Phoenix Down: a revive with nobody
 * KO'd), m (Tidus's Potion: the cursor on the caster). On this stage Yuna stands left of Tidus, so the old rule's "leftmost on screen" is not the caster or the first KO'd ally in party order.
 *
 * Flags: --tag=before|after  --url=<dev server>  --work=<dir>  --out=<dir>  --scenario=j|k|l|m|all  --seed=1  --width=1600  --height=900  --compose  --debug
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { currentChromiumArgs } from './browser-mode.mjs';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    out[k] = v === undefined ? true : v;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const WORK = resolve(String(args.work ?? 'D:/Tools/ffx-parity/tmp/target-parity/shots'));
const OUT = resolve(String(args.out ?? 'docs/screenshots/re-parity-rc11-target-parity'));
const TAG = String(args.tag ?? '');
const URL = String(args.url ?? 'http://127.0.0.1:5197/');
const SCENARIO = String(args.scenario ?? 'all');
const SEED = Number(args.seed ?? 1);
const WIDTH = Number(args.width ?? 1600);
const HEIGHT = Number(args.height ?? 900);
const DEBUG = args.debug === true;
const SETTLE_FRAMES = 45;

// ------------------------------------------------------------------------------------------------------------------------------ plumbing

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${String(e)}`));
  page.on('console', (m) => {
    if (m.type() === 'error') page.errors.push(`console.error: ${m.text().slice(0, 300)}`);
  });
  // Pin the page to the build it loaded with: another agent saving a file must not reload it under the frame pump.
  await page.addInitScript(() => {
    const Real = window.WebSocket;
    const isHmr = (p) => p === 'vite-hmr' || (Array.isArray(p) && p.includes('vite-hmr'));
    const Stub = function (url, protocols) {
      if (!isHmr(protocols)) return new Real(url, protocols);
      return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false, send() {}, close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
    };
    Stub.prototype = Real.prototype;
    for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Stub[k] = Real[k];
    window.WebSocket = Stub;
  });
  return page;
}

/** Boot, optionally turn the switch on in the page, and start the chapter (cutscenes and prep skipped). */
async function boot(page, chapter) {
  await page.goto(`${URL}?coach=off`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180_000 });
  if (TAG === 'after') {
    await page.evaluate(async () => {
      const m = await import('/src/battle/ffx/target-step-parity.ts');
      m.setTargetStepParity(true);
    });
  }
  await page.evaluate(
    ({ id, seed }) => {
      const api = window.__pyrefly;
      api.markCoachSeen();
      api.setSeed(seed);
      api.setBattleSpeed('fast');
      void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true });
    },
    { id: chapter, seed: SEED },
  );
}

let lastLog = 0;

/** Wait for a NEW decision, let the camera settle, and read it. */
async function nextMenu(page) {
  await page.waitForFunction(
    (n) => {
      const api = window.__pyrefly;
      const pb = api.snapshotState().screenState?.playback;
      return pb?.awaitingMenu === true && api.battleLog().length > n && document.querySelector('.ig-cmd-stack [data-ui-action]') !== null;
    },
    lastLog,
    { timeout: 240_000, polling: 100 },
  );
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await window.__pyrefly.frame();
  }, SETTLE_FRAMES);
  await page.waitForTimeout(700);
  lastLog = await page.evaluate(() => window.__pyrefly.battleLog().length);
  return readState(page);
}

function readState(page) {
  return page.evaluate(() => {
    const api = window.__pyrefly;
    const pb = api.snapshotState().screenState?.playback;
    const rows = [...document.querySelectorAll('.ig-cmd-stack')]
      .filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order'))
      .flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd')])
      .map((r) => ({
        label: (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim(),
        disabled: r.classList.contains('ig-cmd--disabled'),
        selected: r.classList.contains('ig-cmd--selected'),
      }));
    const sel = api.targeting?.()?.selection ?? null;
    return {
      actor: (pb?.phase ?? '').replace('command:', ''),
      rows,
      awaitingMenu: pb?.awaitingMenu === true,
      cursorOn: sel?.activeId ?? null,
      breadcrumb: [...document.querySelectorAll('.ffx-cmd-breadcrumb')].map((e) => e.textContent.trim()).filter(Boolean),
    };
  });
}

const selectedLabel = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ig-cmd-stack')].filter((el) => !el.hidden).flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd--selected')]);
    const r = rows.pop();
    return r ? (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim() : null;
  });

async function pickRow(page, label) {
  for (let k = 0; k < 24; k++) {
    if ((await selectedLabel(page)) === label) return true;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
  }
  return (await selectedLabel(page)) === label;
}

async function press(page, key, ms = 600) {
  await page.keyboard.press(key);
  await page.waitForTimeout(ms);
}
const defend = (page) => press(page, 'q', 600);

async function shoot(page, name, log, note) {
  await mkdir(WORK, { recursive: true });
  const file = `${name}-${TAG}.jpg`;
  await page.screenshot({ path: resolve(WORK, file), type: 'jpeg', quality: 92 });
  const state = await readState(page);
  log.push({ shot: file, note, errors: page.errors.slice(0, 5), ...state });
  console.log(`  shot ${file} (${note}) cursorOn=${state.cursorOn}`);
}

const onEngine = (page, fn, arg) => page.evaluate(`(${fn.toString()})(window.__pyrefly.battle().engine, ${JSON.stringify(arg ?? null)})`);

/** Defend until it is `who`'s menu; returns the state. */
async function untilActor(page, who, max = 24) {
  for (let i = 0; i < max; i++) {
    const s = await nextMenu(page);
    if (DEBUG) console.log(`  menu ${s.actor}: ${s.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join('|')}`);
    if (s.actor === who) return s;
    await defend(page);
  }
  throw new Error(`never reached ${who}'s menu`);
}

// ------------------------------------------------------------------------------------------------------------------------------ scenarios

/** j: Chapter II, Auron's Guard: Special -> Guard -> Enter. Before: the turn is spent at once. After: a cursor on Auron waits for the confirm. */
async function scenarioJ(browser, log) {
  console.log("j: Chapter II, Auron's Guard");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'yunalesca');
  const s = await untilActor(page, 'auron');
  if (!(await pickRow(page, 'Special'))) throw new Error(`Special missing: ${s.rows.map((r) => r.label).join(',')}`);
  await press(page, 'Enter', 500);
  if (!(await pickRow(page, 'Guard'))) throw new Error('Guard missing');
  await press(page, 'Enter', 700);
  await shoot(page, 'j-1-auron-guard', log, 'Enter on Guard');
  await page.context().close();
}

/** k: Chapter II, Tidus and Yuna down, Auron's Phoenix Down: where the cursor opens. On this stage Yuna stands left of Tidus, so the old "leftmost on screen" rule opens on Yuna; the game opens on the first KO'd ally in party order, Tidus. */
async function scenarioK(browser, log) {
  console.log("k: Chapter II, Tidus and Yuna down: Auron's Phoenix Down");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'yunalesca');
  const first = await nextMenu(page);
  await onEngine(page, (e) => {
    for (const id of ['tidus', 'yuna']) {
      const c = e.state().combatants[id];
      c.hp = 0;
      c.alive = false;
      c.statuses.ko = { id: 'ko', turnsRemaining: 254 };
    }
  });
  if (first.actor === 'tidus') await defend(page);
  await untilActor(page, 'auron');
  if (!(await pickRow(page, 'Items'))) throw new Error('Items missing');
  await press(page, 'Enter', 500);
  if (!(await pickRow(page, 'Phoenix Down'))) throw new Error('Phoenix Down missing');
  await press(page, 'Enter', 700);
  await shoot(page, 'k-1-revive-cursor', log, 'Auron: Phoenix Down with Tidus and Yuna down');
  await page.context().close();
}

/** l: Chapter II, nobody down, Tidus's Phoenix Down: a revive with nobody KO'd. Old: the leftmost ally (Yuna); the game: the caster. */
async function scenarioL(browser, log) {
  console.log("l: Chapter II, nobody down: Tidus's Phoenix Down");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'yunalesca');
  await untilActor(page, 'tidus');
  if (!(await pickRow(page, 'Items'))) throw new Error('Items missing');
  await press(page, 'Enter', 500);
  if (!(await pickRow(page, 'Phoenix Down'))) throw new Error('Phoenix Down missing');
  await press(page, 'Enter', 700);
  await shoot(page, 'l-1-phoenix-nobody-down', log, 'Tidus: Phoenix Down with nobody KO\x27d');
  await page.context().close();
}

/** m: Chapter II, Tidus's Potion: an ally-first command opens on the caster, not on the leftmost ally. */
async function scenarioM(browser, log) {
  console.log("m: Chapter II: Tidus's Potion");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'yunalesca');
  await untilActor(page, 'tidus');
  if (!(await pickRow(page, 'Items'))) throw new Error('Items missing');
  await press(page, 'Enter', 500);
  if (!(await pickRow(page, 'Potion'))) throw new Error('Potion missing');
  await press(page, 'Enter', 700);
  await shoot(page, 'm-1-potion-cursor', log, 'Tidus: Potion');
  await page.context().close();
}

// ------------------------------------------------------------------------------------------------------------------------------ compose

const PAIRS = [
  { name: 'j-guard-self-cursor', shot: 'j-1-auron-guard', title: "j (t1). Chapter II, Auron's Guard: Enter on Guard", crop: { left: 0, top: 250, width: 1250, height: 620 } },
  { name: 'k-revive-first-ko', shot: 'k-1-revive-cursor', title: "k (t3). Chapter II, Tidus and Yuna down: Auron's Phoenix Down", crop: { left: 0, top: 250, width: 1250, height: 620 } },
  { name: 'l-revive-nobody-down', shot: 'l-1-phoenix-nobody-down', title: "l (t4). Chapter II, nobody down: Tidus's Phoenix Down", crop: { left: 0, top: 250, width: 1250, height: 620 } },
  { name: 'm-potion-cursor-on-caster', shot: 'm-1-potion-cursor', title: "m (t3). Chapter II: Tidus's Potion", crop: { left: 0, top: 250, width: 1250, height: 620 } },
];

async function compose() {
  const sharp = (await import('sharp')).default;
  await mkdir(OUT, { recursive: true });
  for (const p of PAIRS) {
    const before = resolve(WORK, `${p.shot}-before.jpg`);
    const after = resolve(WORK, `${p.shot}-after.jpg`);
    if (!existsSync(before) || !existsSync(after)) {
      console.log(`skip ${p.name}: needs ${p.shot}-before.jpg and ${p.shot}-after.jpg`);
      continue;
    }
    const { width, height } = p.crop;
    const gap = 12;
    const bar = 40;
    const cropOf = (file) => sharp(file).extract(p.crop).toBuffer();
    const svg = (w, fill, text, size, color, x = 12) =>
      Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${bar}"><rect width="100%" height="100%" fill="${fill}"/><text x="${x}" y="27" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="700" fill="${color}">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`);
    const [b, a] = await Promise.all([cropOf(before), cropOf(after)]);
    const full = await sharp({ create: { width: width * 2 + gap, height: bar * 2 + height, channels: 3, background: '#000000' } })
      .composite([
        { input: svg(width * 2 + gap, '#1C1A26', p.title, 21, '#F1ECDD'), left: 0, top: 0 },
        { input: svg(width, '#0B0A12', 'BEFORE (switch off)', 22, '#C9A24B'), left: 0, top: bar },
        { input: svg(width, '#0B0A12', 'AFTER (switch on)', 22, '#C9A24B'), left: width + gap, top: bar },
        { input: b, left: 0, top: bar * 2 },
        { input: a, left: width + gap, top: bar * 2 },
      ])
      .png()
      .toBuffer();
    await sharp(full)
      .resize({ width: Math.round((width * 2 + gap) * 0.6) })
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(resolve(OUT, `${p.name}-before-after.jpg`));
    console.log(`composed ${p.name}-before-after.jpg`);
  }
}

// ------------------------------------------------------------------------------------------------------------------------------

async function main() {
  if (args.compose === true) return compose();
  if (TAG !== 'before' && TAG !== 'after') throw new Error('give --tag=before or --tag=after (or --compose)');
  await mkdir(WORK, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const log = [];
  let failure = null;
  try {
    const want = (k) => SCENARIO === 'all' || SCENARIO === k;
    if (want('j')) await scenarioJ(browser, log);
    if (want('k')) await scenarioK(browser, log);
    if (want('l')) await scenarioL(browser, log);
    if (want('m')) await scenarioM(browser, log);
  } catch (e) {
    failure = e;
  } finally {
    const file = resolve(WORK, `capture-${TAG}.json`);
    let prior = [];
    if (SCENARIO !== 'all' && existsSync(file)) prior = JSON.parse(await readFile(file, 'utf8')).frames ?? [];
    await writeFile(file, JSON.stringify({ tag: TAG, url: URL, seed: SEED, viewport: `${WIDTH}x${HEIGHT}`, frames: [...prior, ...log] }, null, 1));
    await browser.close();
  }
  if (failure) throw failure;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
