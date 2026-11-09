#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Oblitzerator chapter (branch `ch-oblitzerator`; FFX only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word (`blitz`), looks at
 * party prep, plays the pre scene by keyboard, takes the first menu (the machine and the crane on the coast road's plate, Tidus, Lulu and Kimahri in front, Use crane the first row), and then plays the CRANE LINE with REAL
 * KEYS to a result: Tidus's Use crane before the crane has power (a line, nothing else), Lulu's Black Magic menu with Thunder aimed at the Crane three times (the target cursor walked to the Crane), Tidus's Use crane on the
 * powered crane (the machine falls to 375), and the finishing blows (the post scene and the results).
 *
 *   PYREFLY_BROWSER=gpu node tools/oblitzerator-smoke.mjs [--base http://127.0.0.1:5452/] [--out docs/screenshots/ch-oblitzerator] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--until first-menu]
 *
 * The party is kept alive by editing the battle state through the debug API (`window.__pyrefly.battleState()`: everybody's HP to 99,999 between turns, said so); the crane's state is READ through the same API to check
 * that the lines on screen agree with it (the checks only). Every command the party gives is a real key press. It takes the review-browser lock (`tools/rig-record-lock.mjs`, the machine-wide browser lock) before it opens a
 * browser and gives it back at the end. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(name);

const BASE = arg('--base', 'http://127.0.0.1:5452/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-oblitzerator'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
/** `--until first-menu` stops after the first menu's pictures (the staging check); the default plays on to the results. */
const UNTIL = arg('--until', 'results');
class StopEarly extends Error {}
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-oblitzerator smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'blitzDoor.ts')).href).catch(() => null);
const WORD = door?.BLITZ_DOOR_WORD ?? 'blitz';
const CHAPTER = door?.BLITZ_DOOR_CHAPTER ?? 'oblitzerator';
const BOSS = 'oblitzerator';
const CRANE = 'luca-crane';

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
} catch (e) {
  release();
  throw e;
}
const { page, browser } = ctx;
const errors = [];
const missing = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
page.on('response', (r) => {
  if (r.status() >= 400) missing.push(`${r.status()} ${r.url().slice(0, 160)}`);
});
const shot = async (name) => {
  const p = join(OUT, `${TAG}-${name}.jpg`);
  await page.screenshot({ path: p, type: 'jpeg', quality: 88 });
  log(`shot.${name}`, p);
};
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
const dismissCoach = async () => {
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
};
/** What the engine says about the field now (the battle layer's own state through the debug API). */
const field = () =>
  page.evaluate(
    ([boss, crane]) => {
      const st = window.__pyrefly?.battleState?.();
      if (!st) return null;
      const c = (i) => st.combatants[i];
      return {
        boss: { hp: c(boss).hp, maxHp: c(boss).stats.maxHp, alive: c(boss).alive, agi: c(boss).stats.agi, flags: c(boss).immunityFlags },
        crane: { hp: c(crane).hp, untargetable: !!c(crane).flags?.untargetable },
        active: st.activeIds,
        party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, alive: c(i).alive })),
        craneState: st.flags['oblitzerator.crane'],
        thunders: st.flags['oblitzerator.thunders'],
        ended: st.flags['oblitzerator.ended'],
        turn: st.turn,
      };
    },
    [BOSS, CRANE],
  );
/** The machine's actions so far, from the engine's own log (kept across the results screen, which has no battle to ask). */
let lastActions = [];
const bossActions = async () => {
  const got = await page.evaluate((id) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === id).map((x) => x.abilityId ?? x.command?.kind) : null;
  }, BOSS);
  if (got) lastActions = got;
  return lastActions;
};
/** The `script-trigger` names raised so far (the banners). */
const callouts = () => page.evaluate(() => { const st = window.__pyrefly?.battleState?.(); return st ? st.log.filter((x) => x.type === 'script-trigger').map((x) => x.name) : []; });
/** Keep the party up for the smoke (HP): a state edit, said so. */
const warding = async () => {
  await bossActions();
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
    }
  });
};
const ready = async (ms = 60000) => {
  await dismissCoach();
  const ok = await waitBattleMenu(page, ms).then(() => true).catch(() => false);
  if (!ok) await dismissCoach();
  return ok || (await waitBattleMenu(page, 30000).then(() => true).catch(() => false));
};
/** The command rows the player sees, as their texts. */
const rowTexts = async () => (await commandRows(page)).rows.map((r) => ({ text: r.text, selected: r.selected, disabled: r.disabled }));
/** Whose menu this is, read from the rows: Lulu has Black Magic, Tidus has Use crane (until it is spent), Kimahri neither. */
const whoseMenu = async () => {
  const rows = (await rowTexts()).map((r) => r.text);
  if (rows.some((t) => /black magic/i.test(t))) return 'lulu';
  if (rows.some((t) => /use crane/i.test(t)) || rows.some((t) => /^cheer|haste/i.test(t))) return 'tidus';
  return rows.length > 0 ? 'other' : null;
};
/** Real keys: Defend (the Triangle control, Q on the keyboard, not a row of the root menu). */
async function defendWithKeys() {
  if (!(await ready())) return false;
  await page.keyboard.press('q');
  await page.waitForTimeout(900);
  return true;
}
/** The name the target cursor stands on (the `ffx-target__name` chip), or null when there is no target step. */
const targetName = () => page.evaluate(() => document.querySelector('.ffx-target__name')?.textContent?.trim() ?? null);
/** Real keys: walk the target cursor (arrows) until it names `wanted`, then Enter. Returns the name it confirmed, or null. */
async function confirmTarget(wanted) {
  for (let g = 0; g < 6; g++) {
    const name = await targetName();
    if (name === wanted) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(900);
      return name;
    }
    await page.keyboard.press(g % 2 === 0 ? 'ArrowRight' : 'ArrowDown');
    await page.waitForTimeout(450);
  }
  log('confirmTarget.notFound', { wanted, last: await targetName() });
  return null;
}
/**
 * Real keys: walk the open list with the arrow keys until a row whose text starts with one of `names` is the cursor, then Enter. Returns the name it pressed, or null when the whole list was walked and none was there.
 */
async function pickFrom(names) {
  const seen = new Set();
  for (let guard = 0; guard < 40; guard++) {
    const rows = (await commandRows(page)).rows;
    if (rows.length === 0) return null;
    for (const r of rows) seen.add(r.text);
    const wanted = names.find((n) => rows.some((r) => r.text.toLowerCase().startsWith(n.toLowerCase()) && !r.disabled));
    const sel = rows.findIndex((r) => r.selected);
    if (wanted !== undefined) {
      const at = rows.findIndex((r) => r.text.toLowerCase().startsWith(wanted.toLowerCase()));
      if (at === sel) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        return wanted;
      }
      await page.keyboard.press(at > sel ? 'ArrowDown' : 'ArrowUp');
    } else {
      if (guard > 24) break;
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(170);
  }
  log('pickFrom.notFound', { names, seen: [...seen] });
  return null;
}
/** Real keys: Tidus's Use crane (the first row of his root menu), then the target step on the crane. */
async function useCraneWithKeys() {
  if (!(await ready())) return false;
  const row = await pickFrom(['Use crane']);
  if (row === null) return false;
  await page.waitForTimeout(500);
  const target = await confirmTarget('Crane');
  return target !== null;
}
/** Real keys: Lulu's Black Magic, Thunder, the target cursor walked to the Crane, Enter. */
async function thunderAtCraneWithKeys() {
  if (!(await ready())) return false;
  if ((await pickFrom(['Black Magic'])) === null) return false;
  await page.waitForTimeout(400);
  if ((await pickFrom(['Thunder'])) === null) {
    await page.keyboard.press('Escape');
    return false;
  }
  await page.waitForTimeout(600);
  return (await confirmTarget('Crane')) !== null;
}
/** Real keys: Attack (the first row once the key is spent), then the one target. */
async function attackWithKeys() {
  if (!(await ready())) return false;
  if ((await pickFrom(['Attack'])) === null) return false;
  await page.waitForTimeout(500);
  const target = await confirmTarget('Oblitzerator');
  return target !== null;
}
/** Wait until it is somebody's turn again after an action: the party is kept up and the engine is given a moment. */
const settle = async (ms = 1800) => {
  await page.waitForTimeout(ms);
  await warding();
};

try {
  // --- title and the board ------------------------------------------------------------------------------------------------------------------
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  const board = await page.evaluate((id) => ({ cards: document.querySelectorAll('.fe-card').length, hasCard: !!document.querySelector(`[data-card="${id}"]`) }), CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter', board.hasCard === false, board);
  await shot('0-board');

  // --- the typed word -----------------------------------------------------------------------------------------------------------------------
  log('door', { word: WORD, chapter: CHAPTER });
  for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
    if (attempt > 0 && (await guideUp())) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
    }
    await page.keyboard.type(WORD, { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.waitForTimeout(1500);
  check('party prep holds after the word (the last letter, a confirm, started nothing)', (await screenNow()) === 'party-prep', await screenNow());
  await shot('1-party-prep');

  // --- prep to the first menu ---------------------------------------------------------------------------------------------------------------
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await screenNow();
  log('after Enter on prep', s);
  if (s === 'cutscene') {
    await shot('2-pre-scene');
    for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      s = await screenNow();
    }
  }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  const f1 = await field();
  log('field.1', f1);
  check('the machine stands on its 6,000 and the crane on its 65,535', f1?.boss.hp === 6000 && f1.boss.alive && f1.crane.hp === 65535, f1);
  check('Tidus, Lulu and Kimahri open', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'lulu', 'kimahri']), f1.active);
  check('the crane is dark and the machine is not yet lifted', f1.craneState === 0 && f1.ended === false, { craneState: f1.craneState, ended: f1.ended });
  await shot('3-first-menu');
  const calls0 = await callouts();
  check('Tidus pointed out the crane on his first turn (the banner line)', calls0.includes('oblitzerator-point'), calls0);
  await dismissCoach();
  await page.waitForTimeout(2600);
  await shot('3a-first-menu-clear');
  const menu1 = await rowTexts();
  log('menu.tidus', menu1);
  check('the first menu is Tidus\'s: Use crane is the first row, Attack and Special follow, Escape is a greyed row', menu1.length > 3 && /use crane/i.test(menu1[0].text) && menu1.some((r) => /^attack/i.test(r.text)) && menu1.filter((r) => /^escape/i.test(r.text)).every((r) => r.disabled), menu1);
  if (UNTIL === 'first-menu') throw new StopEarly();

  // --- Use crane before the crane has power: a line and nothing else -------------------------------------------------------------------------
  const used0 = await useCraneWithKeys();
  check('Use crane by real keys (the first row, the target step on the Crane)', used0, await targetName());
  await settle(3200);
  const f2 = await field();
  const calls1 = await callouts();
  check('the unpowered crane did nothing: the machine\'s HP is untouched, the crane is still dark, and the line "still dark" was raised', f2.boss.hp === 6000 && f2.craneState === 0 && calls1.includes('oblitzerator-no-power'), { f2, calls1 });
  await shot('4-use-crane-dark');

  // --- Lulu's Thunder at the Crane, three times ------------------------------------------------------------------------------------------------
  let casts = 0;
  for (let guard = 0; guard < 40 && casts < 3; guard++) {
    await warding();
    if (!(await ready(30000))) {
      await page.waitForTimeout(1000);
      continue;
    }
    const who = await whoseMenu();
    if (who === 'lulu') {
      if (casts === 0) await shot('5-lulu-menu');
      const ok = await thunderAtCraneWithKeys();
      log('lulu.cast', { n: casts + 1, ok });
      if (ok) {
        casts += 1;
        await settle(3200);
        const f = await field();
        log(`field.cast${casts}`, { thunders: f.thunders, craneState: f.craneState, craneHp: f.crane.hp });
        if (casts === 1) await shot('6-first-answer');
      }
    } else {
      await defendWithKeys();
      await page.waitForTimeout(1200);
    }
  }
  check('three Thunders at the Crane by real keys', casts === 3, casts);
  const f3 = await field();
  const calls2 = await callouts();
  check('the crane answered twice and woke on the third: its state is powered, and the two answers and the waking were raised in order', f3.craneState === 1 && f3.thunders === 2 && calls2.filter((n) => /responds|powered/.test(n)).join() === 'oblitzerator-responds-1,oblitzerator-responds-2,oblitzerator-powered', { f3, calls2 });
  check('the crane swallowed every cast (65,535 still) and drew no ball back', f3.crane.hp === 65535 && !(await bossActions()).some((a) => /-ball$/.test(a)), { hp: f3.crane.hp, actions: await bossActions() });
  await shot('7-powered');

  // --- Use crane on the powered crane --------------------------------------------------------------------------------------------------------------
  let lifted = false;
  for (let guard = 0; guard < 40 && !lifted; guard++) {
    await warding();
    if (!(await ready(30000))) {
      await page.waitForTimeout(1000);
      continue;
    }
    const who = await whoseMenu();
    if (who === 'tidus') {
      lifted = await useCraneWithKeys();
      await page.waitForTimeout(600);
    } else {
      await defendWithKeys();
      await page.waitForTimeout(1200);
    }
  }
  check('Use crane on the powered crane by real keys', lifted, lifted);
  await page.waitForTimeout(1800);
  await shot('8-the-lift');
  await settle(4500);
  const f4 = await field();
  const calls3 = await callouts();
  check('the Crane row took 5,625 off 6,000: the machine stands on 375, lifted, and the key is spent', f4.boss.hp === 375 && f4.ended === true && f4.craneState === 2 && f4.crane.untargetable === true, f4);
  check('the "lifted" line was raised', calls3.includes('oblitzerator-lifted'), calls3);
  await shot('9-lifted');
  const rowsAfter = (await rowTexts()).map((r) => r.text);
  check('Tidus\'s Use crane is gone from his menu', !rowsAfter.some((t) => /use crane/i.test(t)) || (await whoseMenu()) !== 'tidus', rowsAfter);

  // --- the finish, by real keys ------------------------------------------------------------------------------------------------------------------
  for (let i = 0; i < 24 && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await ready(20000)) await attackWithKeys();
    await page.waitForTimeout(1800);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  const end = await screenNow();
  check('the machine falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
  const acts = await bossActions();
  check('the machine threw at most two Rushes in the whole fight and never a ball (no blow was struck before the lift)', acts.filter((a) => a === 'blitzball-rush').length <= 2 && !acts.some((a) => /-ball$/.test(a)), acts);
  if (end === 'cutscene') {
    await page.waitForTimeout(1500);
    await shot('10-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 200; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
  }
  await waitFor('the results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
  const resultsText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700);
  log('results.text', resultsText);
  check('the results read 580 gil, 36 AP and an Elixir', /580/.test(resultsText) && /\b36\b/.test(resultsText) && /Elixir/i.test(resultsText), resultsText.slice(0, 300));
  await page.waitForTimeout(7000);
  if ((await screenNow()) === 'results') await shot('11-results');
} catch (e) {
  if (e instanceof StopEarly) log('stopped', 'after the first menu (--until first-menu)');
  else {
    failures.push(`threw: ${String(e).slice(0, 300)}`);
    log('threw', String(e).slice(0, 600));
    try {
      await shot('zz-failure');
    } catch {
      /* the page may be gone */
    }
  }
}

check('no console errors', errors.length === 0, errors.slice(0, 8));
check('no 4xx or 5xx responses other than the missing paintings', missing.filter((m) => !/oblitzerator|luca-crane|luca-dock|chapter-oblitzerator|ch50/.test(m)).length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
