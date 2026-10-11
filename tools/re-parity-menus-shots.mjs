#!/usr/bin/env node
/**
 * Before / after captures of the two re-parity menu changes (FFX only; re-parity lane MENUS, Bailey 2026-10-09 "Yes, match the game").
 *
 *   PYREFLY_BROWSER=gpu node tools/re-parity-menus-shots.mjs --tag=before --url=http://127.0.0.1:5291/
 *   PYREFLY_BROWSER=gpu node tools/re-parity-menus-shots.mjs --tag=after  --url=http://127.0.0.1:5291/
 *   node tools/re-parity-menus-shots.mjs --compose            (joins every before/after pair into one picture; needs both sets)
 *
 * What it shows, all by real key presses on the live menus (headless Chromium, from node; never the browser pane):
 *
 *  - **Chapter VIII, Evrae on the airship: Cid's Trigger Command.** Tidus's first turn (the ship NEAR, no order standing), Rikku's
 *    next turn (Pull back is standing, Cid has not flown it), and Rikku's turn once the ship is FAR. The game offers one order at a
 *    time: Pull back at NEAR, Move in (our "Close in") at FAR, Cancel while one is standing.
 *  - **Chapter III, Braska's Final Aeon: the Talk row.** The game greys Talk until his next turn once it is used, and offers the third
 *    Talk (it only speaks). Tidus is Hasted first, so he gets a menu while his first Talk is still waiting on the boss's turn (without
 *    Haste the boss acts a few ticks after the Talk and the window never reaches Tidus's menu).
 *
 * The same inputs are given on the two builds (the engine's draws do not depend on which rows a menu offers), so each pair is the same
 * moment. `--tag=after` also takes the frames that exist only with the change (Cancel, and the Talk row after the third Talk).
 *
 * Output: `<out>/<name>-<tag>.jpg` (default `docs/screenshots/re-parity-menus/`), `capture-<tag>.json` (the state behind each frame),
 * and with `--compose` `<name>-before-after.jpg` (the menu column of each pair, side by side, labelled).
 *
 * Flags: --tag=before|after  --url=<dev server>  --out=<dir>  --scenario=airship|braska|all  --seed=1  --width=1600  --height=900
 *        --compose  --debug (prints every decision)
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
const OUT = resolve(String(args.out ?? 'docs/screenshots/re-parity-menus'));
const TAG = String(args.tag ?? '');
const URL = String(args.url ?? 'http://127.0.0.1:5173/');
const SCENARIO = String(args.scenario ?? 'all');
const SEED = Number(args.seed ?? 1);
const WIDTH = Number(args.width ?? 1600);
const HEIGHT = Number(args.height ?? 900);
const DEBUG = args.debug === true;

/** Frames the camera needs to settle after a menu opens (the same count the e2e specs use). */
const SETTLE_FRAMES = 45;

// ---------------------------------------------------------------------------------------------------------------------------------
// Browser plumbing
// ---------------------------------------------------------------------------------------------------------------------------------

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

async function boot(page, chapter) {
  await page.goto(`${URL}?coach=off`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180_000 });
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

/** Wait for a NEW decision (the engine log grew and the presenter awaits a menu), let the camera settle, and read it. */
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
    // The visible stack only: the hidden order widget is also an `.ig-cmd-stack`.
    const rows = [...document.querySelectorAll('.ig-cmd-stack')]
      .filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order'))
      .flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd')])
      .map((r) => ({
        label: (r.querySelector('.ffx-cmd__label') ?? r.querySelector('.ffx-cmd--trigger__label') ?? r).textContent.trim(),
        disabled: r.classList.contains('ig-cmd--disabled'),
        selected: r.classList.contains('ig-cmd--selected'),
      }));
    const widgetEl = document.querySelector('.ffx-airship-order:not([hidden])');
    const widget = widgetEl
      ? [...widgetEl.querySelectorAll('.ig-cmd')].map((r) => ({
          label: r.querySelector('.ffx-cmd--trigger__label')?.textContent.trim() ?? r.textContent.trim(),
          // `__already` is the greyed reason the build before the change drew ("Already near"); the changed build has only the tag.
          tag: r.querySelector('.ffx-airship-order__tag, .ffx-airship-order__already')?.textContent.trim() ?? '',
          disabled: r.classList.contains('ig-cmd--disabled'),
          selected: r.classList.contains('ig-cmd--selected'),
        }))
      : null;
    const flags = st.flags;
    return {
      actor: (pb?.phase ?? '').replace('command:', ''),
      ticks: st.ticks,
      range: flags['airship.range'] ?? null,
      order: flags['airship.order'] ?? null,
      missiles: flags['airship.missilesLeft'] ?? null,
      talkUsed: flags['bfa.talkUsed'] ?? 0,
      talkPending: flags['bfa.talkPending'] === true,
      tidusStatuses: st.combatants['tidus']?.statuses ? Object.keys(st.combatants['tidus'].statuses) : [],
      ctb: [...document.querySelectorAll('.ig-ctb__row[data-actor]')].map((r) => r.getAttribute('data-actor')),
      rows,
      widget,
      help: document.querySelector('.ffx-cmd-info')?.textContent?.trim().replace(/\s+/g, ' ') ?? null,
    };
  });
}

const selectedLabel = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('.ig-cmd-stack')]
      .filter((el) => !el.hidden && !el.classList.contains('ffx-airship-order'))
      .flatMap((el) => [...el.querySelectorAll(':scope > .ig-cmd--selected')]);
    const r = rows.pop();
    return r ? (r.querySelector('.ffx-cmd__label') ?? r).textContent.trim() : null;
  });

/** Move the cursor to the row with this label (greyed rows are skipped by the keyboard, as in play). */
async function pickRow(page, label) {
  for (let k = 0; k < 16; k++) {
    if ((await selectedLabel(page)) === label) return true;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(120);
  }
  return (await selectedLabel(page)) === label;
}

async function press(page, key, ms = 700) {
  await page.keyboard.press(key);
  await page.waitForTimeout(ms);
}

/** Defend, the quick pass of a turn. */
const defend = (page) => press(page, 'q', 600);

async function shoot(page, name, log, note) {
  await mkdir(OUT, { recursive: true });
  const file = `${name}-${TAG}.jpg`;
  await page.screenshot({ path: resolve(OUT, file), type: 'jpeg', quality: 90 });
  const state = await readState(page);
  log.push({ shot: file, note, ...state });
  console.log(`  shot ${file} (${note})`);
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Chapter VIII: Cid's Trigger Command
// ---------------------------------------------------------------------------------------------------------------------------------

const OWNERS = new Set(['tidus', 'rikku']);
const hasRow = (s, label) => s.rows.find((r) => r.label === label);

/** Open the cascade's Orders row (Enter), and wait for the widget. */
async function openOrders(page) {
  if (!(await pickRow(page, 'Orders'))) throw new Error('the Orders row is not reachable');
  await press(page, 'Enter', 500);
  await page.waitForSelector('.ffx-airship-order:not([hidden])', { timeout: 10_000 });
  await page.evaluate(async () => {
    for (let i = 0; i < 20; i++) await window.__pyrefly.frame();
  });
  await page.waitForTimeout(400);
}

async function airship(browser, log) {
  console.log('Chapter VIII (Evrae): Cid\'s orders');
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'evrae-airship');

  // 1. Tidus, the ship NEAR, nothing standing.
  let s = await nextMenu(page);
  if (DEBUG) console.log('  D0', s.actor, s.range, s.order, s.rows.map((r) => r.label).join('|'));
  if (s.actor !== 'tidus') throw new Error(`expected Tidus first, got ${s.actor}`);
  await openOrders(page);
  await shoot(page, 'airship-1-near-widget', log, 'Tidus, ship NEAR, no order standing: the Orders list');
  await press(page, 'Enter', 900); // the highlighted order: Pull back

  // 2. The next owner's turn while Pull back is standing (Cid has not flown it yet).
  let pendingShot = false;
  let farShot = false;
  for (let i = 1; i <= 14 && !(pendingShot && farShot); i++) {
    s = await nextMenu(page);
    if (DEBUG) console.log(`  D${i}`, s.actor, s.range, s.order || '-', s.rows.map((r) => (r.disabled ? `(${r.label})` : r.label)).join('|'));
    const orders = hasRow(s, 'Orders');
    if (!pendingShot && OWNERS.has(s.actor) && s.order === 'far' && orders) {
      await shoot(page, 'airship-2-pending-menu', log, 'Pull back is standing: the command menu (the Orders row)');
      if (!orders.disabled) {
        await openOrders(page);
        await shoot(page, 'airship-2-pending-widget', log, 'Pull back is standing: the Orders list');
        await press(page, 'Escape', 700);
      }
      pendingShot = true;
    } else if (!farShot && OWNERS.has(s.actor) && s.range === 'far' && !s.order && orders && !orders.disabled) {
      await openOrders(page);
      await shoot(page, 'airship-3-far-widget', log, 'ship FAR, no order standing: the Orders list');
      await press(page, 'Escape', 700);
      farShot = true;
    }
    await defend(page);
  }
  if (!pendingShot || !farShot) throw new Error(`airship states not reached (pending ${pendingShot}, far ${farShot})`);
  await page.context().close();

  if (TAG !== 'after') return;

  // 3. Only with the change: Cancel, and the order offered again afterwards.
  console.log('Chapter VIII (Evrae): Cancel');
  const p2 = await newPage(browser);
  lastLog = 0;
  await boot(p2, 'evrae-airship');
  s = await nextMenu(p2);
  await openOrders(p2);
  await press(p2, 'Enter', 900); // Pull back
  let cancelled = false;
  for (let i = 1; i <= 14; i++) {
    s = await nextMenu(p2);
    if (!cancelled && OWNERS.has(s.actor) && s.order === 'far' && hasRow(s, 'Orders') && !hasRow(s, 'Orders').disabled) {
      await openOrders(p2);
      await shoot(p2, 'airship-4-cancel-widget', log, 'Pull back is standing: Cancel is the one order on offer');
      await press(p2, 'Enter', 900); // Cancel
      cancelled = true;
      continue;
    }
    if (cancelled && OWNERS.has(s.actor) && !s.order && hasRow(s, 'Orders') && !hasRow(s, 'Orders').disabled) {
      await openOrders(p2);
      await shoot(p2, 'airship-5-after-cancel-widget', log, 'after Cancel: nothing is standing and Pull back is on offer again');
      await press(p2, 'Escape', 700);
      break;
    }
    await defend(p2);
  }
  if (!cancelled) throw new Error('Cancel was never offered');
  await p2.context().close();
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Chapter III: the Talk row
// ---------------------------------------------------------------------------------------------------------------------------------

/**
 * With Talk highlighted the turn list previews where Tidus would stand next: is it before the boss's next turn? (Then a Talk now
 * leaves Tidus a menu while the Talk is still waiting on the boss.)
 */
function talkLeavesAWindow(s) {
  const j = s.ctb.indexOf('tidus', 1);
  const k = s.ctb.indexOf('braskas-final-aeon');
  return j > 0 && (k < 0 || j < k);
}

async function braska(browser, log) {
  console.log("Chapter III (Braska's Final Aeon): Talk");
  const page = await newPage(browser);
  lastLog = 0;
  await boot(page, 'braskas-final-aeon');

  let s = await nextMenu(page);
  if (s.actor !== 'tidus') throw new Error(`expected Tidus first, got ${s.actor}`);
  await shoot(page, 'braska-0-first-menu', log, 'Tidus, first turn: Talk is offered (the same on both builds)');
  // Haste on Tidus (White Magic, Haste, the aimed target): his turns come twice as often as the boss's.
  if (!(await pickRow(page, 'White Magic'))) throw new Error('White Magic missing');
  await press(page, 'Enter', 400);
  if (!(await pickRow(page, 'Haste'))) throw new Error('Haste missing');
  await press(page, 'Enter', 500);
  await press(page, 'Enter', 900);

  let firstTalkTaken = false;
  let pendingShot = false;
  let thirdShot = false;
  let afterThirdShot = false;
  for (let i = 1; i <= 60; i++) {
    s = await nextMenu(page);
    const talk = hasRow(s, 'Talk');
    if (DEBUG) console.log(`  D${i} t=${s.ticks} ${s.actor} used=${s.talkUsed} pending=${s.talkPending} talk=${talk ? (talk.disabled ? 'GREYED' : 'on') : '-'} ctb=${s.ctb.join(',')}`);
    if (s.actor !== 'tidus' || !talk) {
      await defend(page);
      continue;
    }
    // Tidus's first menu after the first Talk: it is still waiting on the boss's turn.
    if (firstTalkTaken && !pendingShot) {
      if (!s.talkPending || s.talkUsed !== 1) throw new Error(`the window closed anyway (used ${s.talkUsed}, pending ${s.talkPending})`);
      await shoot(page, 'braska-1-talk-pending', log, 'Talk is waiting on his next turn (1 of 2 used); Tidus has a menu first');
      pendingShot = true;
      await defend(page);
      continue;
    }
    // The first Talk, at a turn where it leaves Tidus a menu before the boss acts.
    if (!firstTalkTaken && s.talkUsed === 0 && !s.talkPending && !talk.disabled) {
      await pickRow(page, 'Talk');
      await page.waitForTimeout(400);
      const preview = await readState(page);
      if (talkLeavesAWindow(preview)) {
        await press(page, 'Enter', 900);
        firstTalkTaken = true;
        continue;
      }
      await defend(page);
      continue;
    }
    // The second Talk, any time it is open.
    if (pendingShot && s.talkUsed === 1 && !s.talkPending && !talk.disabled) {
      await pickRow(page, 'Talk');
      await press(page, 'Enter', 900);
      continue;
    }
    // Two used and nothing waiting: the third Talk (the game offers it and it only speaks).
    if (pendingShot && s.talkUsed === 2 && !s.talkPending && !thirdShot) {
      await shoot(page, 'braska-2-third-talk', log, 'two Talks used, none waiting: the third Talk');
      thirdShot = true;
      if (!talk.disabled) {
        await pickRow(page, 'Talk');
        await press(page, 'Enter', 900);
        continue;
      }
      if (TAG === 'before') break;
    }
    if (thirdShot && s.talkUsed >= 3 && !afterThirdShot) {
      await shoot(page, 'braska-3-after-third-talk', log, 'after the third Talk');
      afterThirdShot = true;
      break;
    }
    await defend(page);
  }
  if (!pendingShot || !thirdShot) throw new Error(`Talk states not reached (pending ${pendingShot}, third ${thirdShot})`);
  await page.context().close();
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Compose the before/after pairs
// ---------------------------------------------------------------------------------------------------------------------------------

/**
 * The pairs, and the part of the frame each one is about: the menu column, left. `before` and `after` name the frame of each side
 * (they differ for the pending order: before, the Orders row is greyed and there is no list to open; after, it opens onto Cancel).
 */
const PAIRS = [
  { name: 'airship-1-near', before: 'airship-1-near-widget', after: 'airship-1-near-widget', title: 'Evrae, Tidus, ship NEAR, nothing ordered: the Orders list', crop: { left: 0, top: 540, width: 640, height: 330 } },
  { name: 'airship-2-pending', before: 'airship-2-pending-menu', after: 'airship-2-pending-widget', title: 'Evrae, Rikku, Pull back is standing: the Orders row (before it is greyed; after it opens onto Cancel)', crop: { left: 0, top: 420, width: 640, height: 450 } },
  { name: 'airship-3-far', before: 'airship-3-far-widget', after: 'airship-3-far-widget', title: 'Evrae, Rikku, ship FAR, nothing ordered: the Orders list', crop: { left: 0, top: 540, width: 640, height: 330 } },
  { name: 'braska-1-talk-pending', before: 'braska-1-talk-pending', after: 'braska-1-talk-pending', title: "Braska's Final Aeon, Tidus, a Talk waits on his turn: the Talk row", crop: { left: 0, top: 420, width: 640, height: 450 } },
  { name: 'braska-2-third-talk', before: 'braska-2-third-talk', after: 'braska-2-third-talk', title: "Braska's Final Aeon, Tidus, two Talks used and none waiting: the Talk row", crop: { left: 0, top: 420, width: 640, height: 450 } },
];

async function compose() {
  const sharp = (await import('sharp')).default;
  for (const p of PAIRS) {
    const before = resolve(OUT, `${p.before}-before.jpg`);
    const after = resolve(OUT, `${p.after}-after.jpg`);
    if (!existsSync(before) || !existsSync(after)) {
      console.log(`skip ${p.name}: needs ${p.before}-before.jpg and ${p.after}-after.jpg`);
      continue;
    }
    const { width, height } = p.crop;
    const gap = 16;
    const bar = 44;
    const cropOf = (file) => sharp(file).extract(p.crop).toBuffer();
    const label = (text) =>
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${bar}"><rect width="100%" height="100%" fill="#0B0A12"/><text x="14" y="30" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#E8C14A">${text}</text></svg>`,
      );
    const title = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2 + gap}" height="${bar}"><rect width="100%" height="100%" fill="#1C1A26"/><text x="14" y="30" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#F1ECDD">${p.title}</text></svg>`,
    );
    const [b, a] = await Promise.all([cropOf(before), cropOf(after)]);
    const totalH = bar + bar + height;
    await sharp({ create: { width: width * 2 + gap, height: totalH, channels: 3, background: '#000000' } })
      .composite([
        { input: title, left: 0, top: 0 },
        { input: label('BEFORE (current build)'), left: 0, top: bar },
        { input: label('AFTER (match the game)'), left: width + gap, top: bar },
        { input: b, left: 0, top: bar * 2 },
        { input: a, left: width + gap, top: bar * 2 },
      ])
      .jpeg({ quality: 90 })
      .toFile(resolve(OUT, `${p.name}-before-after.jpg`));
    console.log(`composed ${p.name}-before-after.jpg`);
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------

async function main() {
  if (args.compose === true) return compose();
  if (TAG !== 'before' && TAG !== 'after') throw new Error('give --tag=before or --tag=after (or --compose)');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const log = [];
  let failure = null;
  try {
    if (SCENARIO === 'all' || SCENARIO === 'airship') await airship(browser, log);
    if (SCENARIO === 'all' || SCENARIO === 'braska') await braska(browser, log);
  } catch (e) {
    failure = e;
  } finally {
    const file = resolve(OUT, `capture-${TAG}.json`);
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
