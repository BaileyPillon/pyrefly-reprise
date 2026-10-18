#!/usr/bin/env node
/**
 * Before / after captures of the FFX command-menu draw parity (re-parity RC11, `MENU_DRAW_PARITY`; FFX only; the switch is OFF in the build, this tool turns it on in the page).
 *
 *   PYREFLY_BROWSER=gpu node tools/re-parity-menu-parity-shots.mjs --tag=before --url=http://127.0.0.1:5197/ --work=<dir>
 *   PYREFLY_BROWSER=gpu node tools/re-parity-menu-parity-shots.mjs --tag=after  --url=http://127.0.0.1:5197/ --work=<dir>
 *   node tools/re-parity-menu-parity-shots.mjs --compose --work=<dir> --out=docs/screenshots/re-parity-rc11-menu-parity
 *
 * All by real key presses on the live menus (headless Chromium from node; never the browser pane). `--tag=after` flips the switch in the page before the battle starts (a dynamic import of the dev
 * server's own module, so it is the app's instance). The state a scene needs that no chapter reaches without luck (a Silenced Yuna, a Cursed Tidus with a full gauge, two aeons down) is
 * set on the live engine by the page after the first menu opens, exactly as the engine tests do; the next menu of that actor then shows it. Output: the full 1600x900 captures in `--work`, and with
 * `--compose` the menu column of each before/after pair side by side in `--out` (small jpgs).
 *
 * Chapter III roster lane (re-parity RC11): scenarios g (Chapter III link 3, Yuna's Summon list: `CH3_ROSTER_REMOVAL`), h (the hidden Chapter 28's board with Valefor and Ifrit taken: the `summon` item shows no row) and i (the Grand Summon picker with
 * Valefor knocked out: `GRAND_SUMMON_KO_REFUSED`) run on `--scenario=g|h|i` (`all` runs only a to e); `--tag=after` turns those switches on as well. A link a chapter reaches only after play is entered by pointing the chapter record's `enemyGroupRef`
 * at it in the page before the battle starts (the live app's own module instance), the way the engine tests build a link.
 *
 * Flags: --tag=before|after  --url=<dev server>  --work=<dir>  --out=<dir>  --scenario=a|b|c|d|e|g|h|i|all  --seed=1  --width=1600  --height=900  --compose  --debug
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
const WORK = resolve(String(args.work ?? 'D:/Tools/ffx-parity/tmp/menu-parity/shots'));
const OUT = resolve(String(args.out ?? 'docs/screenshots/re-parity-rc11-menu-parity'));
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
async function boot(page, chapter, startGroup = null, extra = {}) {
  await page.goto(`${URL}?coach=off`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180_000 });
  if (TAG === 'after') {
    await page.evaluate(async (want) => {
      const m = await import('/src/battle/ffx/menu-draw-parity.ts');
      m.setMenuDrawParity(true);
      if (want.roster) (await import('/src/battle/ffx/roster-removal.ts')).setCh3RosterRemoval(true);
      if (want.gsko) (await import('/src/battle/ffx/grand-summon-ko.ts')).setGrandSummonKoRefused(true);
    }, extra);
  }
  if (startGroup) {
    await page.evaluate(
      async ({ id, group }) => {
        const enc = await import('/src/data/encounters.ts');
        const rec = enc.getChapter(id);
        if (group.startsWith('last-summoning:')) rec.enemyGroupRef = (await import('/src/data/ffx/enemies/last-summoning-chain.ts')).lastSummoningGroup(group);
        else rec.enemyGroupRef = (await import('/src/data/ffx/index.ts')).ENEMY_GROUPS_BY_ID[group];
      },
      { id: chapter, group: startGroup },
    );
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
    const st = api.battleState();
    const pb = api.snapshotState().screenState?.playback;
    const rows = [...document.querySelectorAll('.ig-cmd-stack')]
      .filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order'))
      .flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd')])
      .map((r) => ({
        label: (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim(),
        disabled: r.classList.contains('ig-cmd--disabled'),
        selected: r.classList.contains('ig-cmd--selected'),
      }));
    return {
      actor: (pb?.phase ?? '').replace('command:', ''),
      ticks: st.ticks,
      rows,
      help: document.querySelector('.ffx-cmd-info')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
      breadcrumb: [...document.querySelectorAll('.ffx-cmd-breadcrumb, [data-role="breadcrumb"]')].map((e) => e.textContent.trim()).filter(Boolean),
    };
  });
}

const selectedLabel = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ig-cmd-stack')].filter((el) => !el.hidden).flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd--selected')]);
    const r = rows.pop();
    return r ? (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim() : null;
  });

/** Move the cursor to the row with this label (a greyed row is unreachable by key on the old build, so this fails there; callers use `press` counts for those). */
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
  console.log(`  shot ${file} (${note})`);
}

/** Run something against the live engine of the battle screen (a private field, read from the page as the engine tests read it). */
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

/** a (and f): Chapter I, Yuna Silenced: the White Magic row. */
async function scenarioA(browser, log) {
  console.log('a: Chapter I, Yuna Silenced');
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'seymour-flux');
  const first = await nextMenu(page);
  if (DEBUG) console.log('  first', first.actor);
  await onEngine(page, (e) => {
    const yuna = e.state().combatants['yuna'];
    yuna.statuses.silence = { id: 'silence', turnsRemaining: 254 };
  });
  if (first.actor !== 'yuna') await defend(page);
  const s = first.actor === 'yuna' ? first : await untilActor(page, 'yuna');
  await shoot(page, 'a-1-silenced-yuna-menu', log, `Yuna Silenced: ${s.rows.map((r) => r.label).join(', ')}`);
  if (TAG === 'before') {
    // Talk, Attack, Special, then Down once more: the old cursor jumps over the grey White Magic row.
    for (let i = 0; i < 3; i++) await press(page, 'ArrowDown', 300);
    await shoot(page, 'f-1-cursor-rests-on-grey-spell', log, `three Downs from the top: the cursor is on ${await selectedLabel(page)}, past the grey White Magic row`);
  }
  if (TAG === 'after') {
    if (!(await pickRow(page, 'White Magic'))) throw new Error('the cursor cannot reach White Magic');
    await press(page, 'Enter', 500);
    await shoot(page, 'a-2-white-magic-opened', log, 'the opener opened: every spell is grey');
    await press(page, 'ArrowDown', 400);
    await shoot(page, 'f-1-cursor-rests-on-grey-spell', log, 'the cursor rests on a grey spell');
    await press(page, 'Enter', 500);
    await shoot(page, 'f-2-confirm-refused', log, 'Enter on a grey spell: refused, the stack shakes (and the error cue plays)');
  }
  await page.context().close();
}

/** b: Chapter I, Tidus Cursed with a full gauge: the Overdrive row. */
async function scenarioB(browser, log) {
  console.log('b: Chapter I, Tidus Cursed with a full gauge');
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'seymour-flux');
  const first = await nextMenu(page);
  await onEngine(page, (e) => {
    const tidus = e.state().combatants['tidus'];
    tidus.overdrive.gauge = 100;
    tidus.statuses.curse = { id: 'curse', turnsRemaining: 254 };
  });
  if (first.actor === 'tidus') await defend(page);
  else await defend(page);
  const s = await untilActor(page, 'tidus');
  await shoot(page, 'b-1-cursed-tidus-menu', log, `Tidus Cursed, gauge full: ${s.rows.map((r) => r.label).join(', ')}`);
  await page.context().close();
}

/** c: Chapter III, two aeons down: Yuna's Summon list. */
async function scenarioC(browser, log) {
  console.log("c: Chapter III, Valefor knocked out, Ifrit recovering: Yuna's Summon list");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'braskas-final-aeon');
  const first = await nextMenu(page);
  await onEngine(page, (e) => {
    const roster = e.ctx.rt.aeonRoster;
    roster.get('valefor').hp = 0;
    roster.get('ifrit').aeon.reviveCountdown = 5;
  });
  if (first.actor !== 'yuna') await defend(page);
  const s = first.actor === 'yuna' ? first : await untilActor(page, 'yuna');
  if (!(await pickRow(page, 'Summon'))) throw new Error('Summon missing');
  await press(page, 'Enter', 500);
  await shoot(page, 'c-1-summon-list', log, `Yuna's Summon list: ${(await readState(page)).rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')}`);
  void s;
  await page.context().close();
}

/** d and e: Chapter I, Tidus's first menu (Escape, Flee, Talk); and Chapter XXV, Kimahri's Switch. */
async function scenarioD(browser, log) {
  console.log("d, e: Chapter I, Tidus's menu");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'seymour-flux');
  const s = await untilActor(page, 'tidus');
  // One Up from the top wraps to the last row: the same key on both builds (the old build lands on the last row it lets the cursor reach).
  await press(page, 'ArrowUp', 400);
  await page.waitForTimeout(300);
  await shoot(page, 'd-1-tidus-escape-flee', log, `Tidus, the lower rows (${s.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')} at open)`);
  await page.context().close();

  console.log("d: Chapter XXV, Kimahri alone: the Switch row");
  const p2 = await newPage(browser);
  lastLog = 0;
  await boot(p2, 'biran-yenke');
  const k = await untilActor(p2, 'kimahri');
  await press(p2, 'ArrowUp', 400);
  await p2.waitForTimeout(300);
  await shoot(p2, 'd-2-kimahri-switch', log, `Kimahri alone (${k.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')} at open)`);
  await p2.context().close();

  console.log('e: Chapter II, Tidus: Talk');
  const p3 = await newPage(browser);
  lastLog = 0;
  await boot(p3, 'yunalesca');
  const y = await untilActor(p3, 'tidus');
  await shoot(p3, 'e-1-yunalesca-tidus', log, `Chapter II, Tidus: ${y.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')}`);
  await p3.context().close();
}

/** g: Chapter III link 3 (possessed Ifrit), every aeon alive: Yuna's Summon list (CH3_ROSTER_REMOVAL). */
async function scenarioG(browser, log) {
  console.log("g: Chapter III link 3: Yuna's Summon list");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'braskas-final-aeon', 'possessed-ifrit', { roster: true });
  await untilActor(page, 'yuna');
  if (!(await pickRow(page, 'Summon'))) throw new Error('Summon missing');
  await press(page, 'Enter', 500);
  await shoot(page, 'g-1-summon-list-link3', log, `link 3 Summon list: ${(await readState(page)).rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')}`);
  await page.context().close();
}

/** h: the hidden Last Summoning, the link after Valefor and Ifrit were given up: Yuna's Summon list (the parity item `summon`). */
async function scenarioH(browser, log) {
  console.log("h: Chapter 28, Valefor and Ifrit taken: Yuna's Summon list");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'last-summoning', 'last-summoning:valefor+ifrit');
  await untilActor(page, 'yuna');
  if (!(await pickRow(page, 'Summon'))) throw new Error('Summon missing');
  await press(page, 'Enter', 500);
  await shoot(page, 'h-1-chapter28-summon-list', log, `Chapter 28 Summon list: ${(await readState(page)).rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join(', ')}`);
  await page.context().close();
}

/** i: Chapter III link 2 with Valefor knocked out and Yuna's gauge full: the Grand Summon picker (GRAND_SUMMON_KO_REFUSED). */
async function scenarioI(browser, log) {
  console.log('i: the Grand Summon picker with Valefor knocked out');
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'braskas-final-aeon', 'possessed-ifrit', { gsko: true });
  const first = await nextMenu(page);
  await onEngine(page, (e) => {
    const valefor = e.ctx.rt.aeonRoster.get('valefor');
    valefor.hp = 0;
    valefor.alive = false;
    valefor.aeon.reviveCountdown = 8;
    e.state().combatants['yuna'].overdrive.gauge = 100;
  });
  if (first.actor !== 'yuna') await defend(page);
  else await defend(page);
  await untilActor(page, 'yuna');
  if (!(await pickRow(page, 'Overdrive'))) throw new Error('Overdrive missing');
  await press(page, 'Enter', 900);
  await page.waitForTimeout(900);
  console.log('  picker:', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.ffx-mg-list__row')].map((r) => { const cs = getComputedStyle(r); return { t: r.textContent.trim(), c: r.className.replace(/ffx-mg-list__row/g, '').trim(), color: cs.color, font: cs.fontFamily.slice(0, 40), size: cs.fontSize, op: cs.opacity, vis: cs.visibility }; }))));
  await shoot(page, 'i-1-grand-summon-picker', log, 'the Grand Summon picker, Valefor knocked out');
  await page.context().close();
}

// ------------------------------------------------------------------------------------------------------------------------------ compose

const PAIRS = [
  { name: 'g-chapter3-link3-summon', before: 'g-1-summon-list-link3', after: 'g-1-summon-list-link3', title: "g. Chapter III link 3 (Ifrit's): Yuna's Summon list", crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'h-chapter28-board', before: 'h-1-chapter28-summon-list', after: 'h-1-chapter28-summon-list', title: 'h. Last Summoning (Chapter 28), Valefor and Ifrit given up: the Summon list', crop: { left: 0, top: 250, width: 640, height: 620 } },
  { name: 'i-grand-summon-picker', before: 'i-1-grand-summon-picker', after: 'i-1-grand-summon-picker', title: 'i. The Grand Summon picker with Valefor knocked out', crop: { left: 20, top: 130, width: 900, height: 380 } },
  { name: 'a-opener-row', before: 'a-1-silenced-yuna-menu', after: 'a-1-silenced-yuna-menu', title: 'a. Chapter I, Yuna Silenced: the White Magic row', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'a-opener-opened', before: 'a-1-silenced-yuna-menu', after: 'a-2-white-magic-opened', title: 'a. White Magic opened (before: the row is grey and will not open)', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'b-overdrive-curse', before: 'b-1-cursed-tidus-menu', after: 'b-1-cursed-tidus-menu', title: 'b. Chapter I, Tidus Cursed, gauge full: the Overdrive row', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'c-summon-list', before: 'c-1-summon-list', after: 'c-1-summon-list', title: "c. Chapter III, Valefor down, Ifrit recovering: Yuna's Summon list", crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'd-escape-flee', before: 'd-1-tidus-escape-flee', after: 'd-1-tidus-escape-flee', title: 'd, e. Chapter I, Tidus: Escape, Flee (and Talk)', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'd-kimahri-switch', before: 'd-2-kimahri-switch', after: 'd-2-kimahri-switch', title: 'd. Chapter XXV, Kimahri alone: the Switch row', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'e-yunalesca-talk', before: 'e-1-yunalesca-tidus', after: 'e-1-yunalesca-tidus', title: 'e. Chapter II, Tidus: the Talk row', crop: { left: 0, top: 310, width: 640, height: 560 } },
  { name: 'f-cursor', before: 'f-1-cursor-rests-on-grey-spell', after: 'f-1-cursor-rests-on-grey-spell', title: 'f. the cursor (before: three Downs jump over the grey row; after: it rests on a grey spell)', crop: { left: 0, top: 310, width: 640, height: 560 } },
];

async function compose() {
  const sharp = (await import('sharp')).default;
  await mkdir(OUT, { recursive: true });
  for (const p of PAIRS) {
    const before = resolve(WORK, `${p.before}-before.jpg`);
    const after = resolve(WORK, `${p.after}-after.jpg`);
    if (!existsSync(before) || !existsSync(after)) {
      console.log(`skip ${p.name}: needs ${p.before}-before.jpg and ${p.after}-after.jpg`);
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
      .resize({ width: Math.round((width * 2 + gap) * 0.8) })
      .jpeg({ quality: 72, mozjpeg: true })
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
    if (want('a')) await scenarioA(browser, log);
    if (want('b')) await scenarioB(browser, log);
    if (want('c')) await scenarioC(browser, log);
    if (want('d') || want('e')) await scenarioD(browser, log);
    if (SCENARIO === 'g') await scenarioG(browser, log);
    if (SCENARIO === 'h') await scenarioH(browser, log);
    if (SCENARIO === 'i') await scenarioI(browser, log);
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
