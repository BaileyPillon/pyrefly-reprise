#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Gullwings, Chapter 1 chapter (branch `ch-gullwings-ch1`; FFX-2 only): a headless Playwright run, against a dev server that is already up (`node node_modules/vite/bin/vite.js --port <p>`),
 * that opens the chapter by its typed word, looks at party prep (THREE girls: Yuna a Gunner, Rikku a Thief, Paine a Warrior), plays the pre scene by keyboard, takes the first menu (Boris on the Zanarkand Dome's plate, the
 * girls on the left), and plays act 1 to its RESULT with REAL KEYS: each girl's Attack at Boris (Enter, Enter). It reads the engine's own log for his moves, and then waits for the first seam (the Celsius mends the girls) and the
 * first menu of act 2: the Flame Dragon at 980 HP and the three girls whole.
 *
 *   PYREFLY_BROWSER=gpu node tools/gullwings-ch1-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-gullwings-ch1] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--short]
 *
 * `--short` stops at the first menu and its pause screen (the phone arm). Every state edit is named in the log ("edit:"): the girls' HP is kept above a floor so the run cannot end in an accidental defeat; Boris is not
 * edited at all (he falls to real blows). It takes the browser lock (`tools/rig-record-lock.mjs`, the machine-wide lock) before it opens a browser and gives it back at the end. Headless only (`PYREFLY_BROWSER=gpu` for the
 * real GPU); never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
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

const BASE = arg('--base', 'http://127.0.0.1:5391/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-gullwings-ch1'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SHORT = flag('--short');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-gullwings-ch1 smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'dragonDoor.ts')).href).catch(() => null);
const WORD = door?.DRAGON_DOOR_WORD ?? 'dragon';
const CHAPTER = door?.DRAGON_DOOR_CHAPTER ?? 'ffx2-gullwings-ch1';
const BORIS = 'x2-boris';
const BORIS_MOVES = new Set(['x2-boris-spider-attack', 'x2-boris-sticky-end', 'x2-boris-spider-bite']);

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
  await page.screenshot({ path: p, type: 'jpeg', quality: 90 });
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

/** What the engine says about the field now. */
const field = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (i) => st.combatants[i];
    const foes = st.enemyIds.map((id) => ({ id, hp: c(id).hp, max: c(id).stats.maxHp, alive: c(id).alive, sprite: c(id).spriteKey, statuses: Object.keys(c(id).statuses) }));
    return {
      foes,
      active: st.activeIds,
      party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, max: c(i).stats.maxHp, mp: c(i).mp, alive: c(i).alive, dress: c(i).dresspheres?.current ?? null, statuses: Object.keys(c(i).statuses) })),
      turn: st.turn,
      log: st.log.length,
    };
  });
/** His actions so far, from the engine's own log, with the first target of each (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = [];
const actions = async () => {
  const got = await page.evaluate((who) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === who).map((x) => ({ id: x.abilityId ?? x.command?.kind, target: (x.targets ?? [])[0] ?? null })) : null;
  }, BORIS);
  if (got) lastActions = got;
  return lastActions;
};
/** A state edit, said so: every girl's HP kept above a floor (the run must not end in an accidental defeat). */
async function floorGirls(fraction = 0.3) {
  const edited = await page.evaluate((f) => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const out = [];
    for (const id of st.activeIds) {
      const g = st.combatants[id];
      if (g.alive && g.hp < g.stats.maxHp * f) {
        g.hp = Math.ceil(g.stats.maxHp * f);
        out.push(`${id}:${g.hp}`);
      }
    }
    return out.length ? out : null;
  }, fraction);
  if (edited !== null) log('edit:', `girls' HP raised to the floor ${Math.round(fraction * 100)} percent (${edited.join(', ')})`);
}
const setHp = async (id, hp) => {
  await page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
  log('edit:', `${id} HP set to ${hp}`);
};

/** The rows of the command window now, with the selected one. */
const menuRows = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.ffx2hud__command .ig-cmd')].map((e, i) => ({
      i,
      text: (e.querySelector('.ffx2cmd__label')?.textContent ?? e.textContent ?? '').replace(/\s+/g, ' ').trim(),
      sel: e.classList.contains('ig-cmd--selected'),
      off: e.classList.contains('ig-cmd--disabled'),
    })),
  );
/** Real keys: move the cursor to the first row whose label matches, then Enter. False when no row matches. */
async function pick(re) {
  for (let tries = 0; tries < 3; tries++) {
    const rows = await menuRows();
    const want = rows.findIndex((r) => re.test(r.text) && !r.off);
    if (want < 0) return false;
    const at = Math.max(0, rows.findIndex((r) => r.sel));
    const key = want >= at ? 'ArrowDown' : 'ArrowUp';
    for (let n = 0; n < Math.abs(want - at); n++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(120);
    }
    const after = await menuRows();
    if (after.findIndex((r) => r.sel) !== want) continue;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}
const menuUp = () => waitBattleMenu(page, 60000).then(() => true).catch(() => false);

/** Dead turns in a row (no row matched): after three the tool backs out of whatever menu is up and takes a picture. */
let dead = 0;
/** One real-key turn of whoever has the menu in act 1: every girl (a Gunner, a Thief, a Warrior) has an Attack row and attacks Boris (Enter on the command, Enter on the one foe). Returns what was done. */
async function turn() {
  await dismissCoach();
  if (!(await menuUp())) return 'no-menu';
  const rows = (await menuRows()).map((r) => r.text);
  if (await pick(/^Attack$/i)) {
    await page.keyboard.press('Enter'); // the one foe is the target
    await page.waitForTimeout(900);
    dead = 0;
    return 'attack';
  }
  dead += 1;
  if (dead >= 3) {
    await shot(`zz-dead-${dead}`);
    log('dead.turn', { rows, text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 400) });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    dead = 0;
  }
  return `no-row:${rows.join('|')}`;
}

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
  check('party prep holds after the word', (await screenNow()) === 'party-prep', await screenNow());
  const roster = await page.evaluate(() => [...document.querySelectorAll('[data-role="roster"] .prep__member')].map((m) => m.querySelector('.prep__member-name')?.textContent ?? ''));
  check('party prep shows the three girls', JSON.stringify(roster) === JSON.stringify(['Yuna', 'Rikku', 'Paine']), roster);
  log('prep.text', await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 600)));
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
  check('Boris stands alone on the field at 480', f1?.foes.length === 1 && f1.foes[0].id === BORIS && f1.foes[0].hp === 480 && f1.foes[0].alive, f1?.foes);
  check('the three girls open', JSON.stringify(f1?.active) === JSON.stringify(['yuna', 'rikku', 'paine']), f1?.active);
  check('Boris wears his own sprite key (no painting yet: the presenter\'s placeholder stands)', f1?.foes[0]?.sprite === 'x2-boris', f1?.foes[0]?.sprite);
  check('the girls are Lv 12 / 13 / 14 on the Gunner, Thief and Warrior', JSON.stringify(f1?.party.map((p) => p.dress)) === JSON.stringify(['gunner', 'thief', 'warrior']), f1?.party.map((p) => p.dress));
  const plates = await page.evaluate(() => document.querySelectorAll('.ffx2hud__party .ig-stat').length);
  check('the party panel holds three plates', plates === 3, plates);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');
  log('menu.rows', (await menuRows()).map((r) => r.text));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3c-pause');
  log('pause.text', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 500));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  if (!SHORT) {
    // --- act 1: real keys ----------------------------------------------------------------------------------------------------------------------
    const done = [];
    for (let i = 0; i < 60 && (await screenNow()) === 'battle'; i++) {
      await floorGirls(0.3);
      done.push(await turn());
      await page.waitForTimeout(1000);
      const f = await field();
      const foe = f?.foes.find((x) => x.id === BORIS);
      if (!foe || !foe.alive) break;
    }
    log('turns', done);
    check('real keys played Attack for every girl', done.filter((d) => d === 'attack').length >= 3, done);
    const acts = await actions();
    log('boris.actions', acts);
    check('Boris used only his own three moves', acts.every((a) => BORIS_MOVES.has(a.id)), acts.map((a) => a.id));
    check('his first three moves, if he got that far, are Spider Attacks', acts.slice(0, 3).every((a) => a.id === 'x2-boris-spider-attack'), acts.map((a) => a.id));

    // --- the result: Boris falls, the seam plays, act 2 opens whole -----------------------------------------------------------------------------
    await shot('4-boris-down');
    let seamSeen = false;
    for (let guard = 0; guard < 120; guard++) {
      const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      if (/Celsius/.test(text) && !seamSeen) {
        seamSeen = true;
        await shot('5-seam');
      }
      const f = await field();
      if (f?.foes.some((x) => x.id === 'x2-flame-dragon') && (await menuUp())) break;
      await page.waitForTimeout(500);
    }
    await dismissCoach();
    await page.waitForTimeout(800);
    const f2 = await field();
    log('field.2', f2);
    check('the seam named the Celsius', seamSeen, seamSeen);
    check('act 2 opens: the Flame Dragon alone at 980', f2?.foes.length === 1 && f2.foes[0].id === 'x2-flame-dragon' && f2.foes[0].hp === 980, f2?.foes);
    check('the girls are whole again (full HP and MP, nobody down)', !!f2 && f2.party.every((p) => p.hp === p.max && p.alive), f2?.party);
    await shot('6-act-2-first-menu');
  }
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 600));
  try {
    await shot('zz-failure');
  } catch {
    /* the page may be gone */
  }
}

check('no console errors', errors.length === 0, errors.slice(0, 8));
check('no 4xx or 5xx responses', missing.length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
