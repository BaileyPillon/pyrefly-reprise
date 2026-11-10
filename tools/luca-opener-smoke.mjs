#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Luca Opener chapter (branch `ch-luca-opener`; FFX-2 only): a headless Playwright run, against a dev server that is already up (`node node_modules/vite/bin/vite.js --port <p>`), that opens
 * the chapter by its typed word, looks at party prep (THREE girls), plays the pre scene by keyboard, takes the first menu (Logos and Ormi on the Leblanc stage, the girls on the left), and plays the first fight with REAL KEYS:
 * Rikku's Steal, then everyone's Attack at the first foe (Enter, Enter). It reads the engine's own log for Ormi's and Logos' moves, reaches act 1's fall (the seam), and, unless `--first` is given, plays act 2 too (Yuna the
 * Songstress: her one Dance; Rikku's Steal; Paine's Attack) to the results and the post scene.
 *
 *   PYREFLY_BROWSER=gpu node tools/luca-opener-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-luca-opener] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--first] [--short]
 *
 * `--first` stops once act 1 has fallen and act 2's first menu is up; `--short` stops at the first menu and its pause screen (the phone arm). There is NO state edit: the shipped Lv 2 / 2 / 3 party wins unaided and the fights are short (on the fixed stat table of 2026-11-09,
 * 200 of 200 bench runs win with nobody knocked out, and Yuna's lowest HP is 63 of 138; the enemies do hurt, a Leblanc swing is 10 to 11 percent of Yuna's HP). It takes the browser lock (`tools/rig-record-lock.mjs`, the machine-wide lock) before it opens a browser and gives it back at the end. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU);
 * never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-luca-opener'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SHORT = flag('--short');
const FIRST = flag('--first');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-luca-opener smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'debutDoor.ts')).href).catch(() => null);
const WORD = door?.DEBUT_DOOR_WORD ?? 'debut';
const CHAPTER = door?.DEBUT_DOOR_CHAPTER ?? 'ffx2-luca-opener';
const LOGOS = 'x2-luca-logos';
const ORMI = 'x2-luca-ormi';
const LEBLANC = 'x2-luca-leblanc';
const MOVES = new Set(['x2-luca-ormi-attack', 'x2-luca-ormi-pirouette-pitch', 'x2-luca-logos-pistol', 'x2-luca-logos-potion', 'x2-luca-leblanc-attack', 'x2-luca-leblanc-thunder']);

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
/** The enemies' actions so far, from the engine's own log, with the first target of each (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = [];
const actions = async () => {
  const got = await page.evaluate((who) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && who.includes(x.actorId)).map((x) => ({ who: x.actorId, id: x.abilityId ?? x.command?.kind, target: (x.targets ?? [])[0] ?? null })) : null;
  }, [LOGOS, ORMI, LEBLANC]);
  if (got) lastActions = got;
  return lastActions;
};
/** Rikku's steals so far, by the log. */
const stealsSoFar = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === 'rikku' && x.abilityId === 'x2-thief-steal').length : 0;
  });

/** The pause screen is up: its legend (`Esc` and Resume) and its rows carry the `pause__` classes (the visible text reads "EscResume", so no word boundary is tried). */
const pauseUp = () => page.evaluate(() => [...document.querySelectorAll('.pause__key, .pause__row')].some((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'));
/** Close the pause with Escape, and again if it is still up. */
async function closePause() {
  for (let i = 0; i < 3 && (await pauseUp()); i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
}

/** The pause screen's chapter tab: three presses of E reach it from Yuna's page (the pause must already be open and on that page); reads the objective rows. */
async function chapterObjectives() {
  if (!(await pauseUp())) return []; // the pause is not up (an Escape that only backed out of a submenu): press nothing else into the battle
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('e');
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(600);
  // The pause's chapter tab prints each objective as a row: the key reads "1. Get past Logos and Ormi", the value "Done" or a dash, and a ticked row carries the class `pause__row--done`.
  return page.evaluate(() => [...document.querySelectorAll('.pause__row--obj')].map((e) => ({ label: (e.querySelector('.pause__k')?.textContent ?? '').trim(), done: e.classList.contains('pause__row--done') })));
}

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
/** One real-key turn of whoever has the menu: Rikku steals (twice in the fight, by the log), a girl with an Attack row attacks the first foe, the Songstress dances. Returns what was done. */
async function turn() {
  await dismissCoach();
  if (!(await menuUp())) return 'no-menu';
  const rows = (await menuRows()).map((r) => r.text);
  if (rows.some((t) => /^Steal$/i.test(t)) && (await stealsSoFar()) < 2) {
    if (await pick(/^Steal$/i)) {
      await page.keyboard.press('Enter'); // the first foe is the target
      await page.waitForTimeout(900);
      dead = 0;
      return 'steal';
    }
  }
  if (rows.some((t) => /^Attack$/i.test(t))) {
    if (await pick(/^Attack$/i)) {
      await page.keyboard.press('Enter'); // the first foe is the target
      await page.waitForTimeout(900);
      dead = 0;
      return 'attack';
    }
  }
  const inDance = rows.some((t) => /^Darkness Dance$/i.test(t));
  if (inDance || rows.some((t) => /^Dance$/i.test(t))) {
    if (inDance || (await pick(/^Dance$/i))) {
      if (await pick(/^Darkness Dance$/i)) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(900);
        dead = 0;
        return 'dance';
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
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
  check('Logos (86) and Ormi (97) stand on the field', f1?.foes.length === 2 && f1.foes.some((x) => x.id === LOGOS && x.hp === 86) && f1.foes.some((x) => x.id === ORMI && x.hp === 97), f1?.foes);
  check('the three girls open, Yuna a Gunner', JSON.stringify(f1?.active) === JSON.stringify(['yuna', 'rikku', 'paine']) && f1?.party[0]?.dress === 'gunner', f1?.party);
  check('the Syndicate wear the Chateau trio\'s paintings as the stand-ins', f1?.foes.every((x) => ['ormi', 'logos'].includes(x.sprite)), f1?.foes.map((x) => x.sprite));
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
  // The chapter tab (E, E, E from Yuna's page): the three objectives, none done in act 1 (the link is not reached, Leblanc is not on the field).
  // (The phone arm leaves its pause screen alone, as it always did: the desktop arm reads the tab.)
  if (!TOUCH) {
    const obj1 = await chapterObjectives();
    log('objectives.act1', obj1);
    check(
      'the pause lists the three objectives, the middle one Leblanc\'s first swing, none done in act 1',
      obj1.length === 3 && /first swing/i.test(obj1[1]?.label ?? '') && obj1.every((o) => !o.done),
      obj1,
    );
    await shot('3d-pause-chapter');
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  if (!SHORT) {
    // --- act 1: real keys ----------------------------------------------------------------------------------------------------------------------
    const done = [];
    let acted = false;
    for (let i = 0; i < 60 && (await screenNow()) === 'battle'; i++) {
      const f = await field();
      if (f && !f.foes.some((x) => x.id === LOGOS || x.id === ORMI)) break; // act 2 has opened
      if (f && f.foes.every((x) => !x.alive)) break;
      done.push(await turn());
      await page.waitForTimeout(1000);
      const acts = await actions();
      if (!acted && acts.length >= 3) {
        acted = true;
        await shot('4-mid-act-1');
      }
    }
    log('turns.act1', done);
    check('real keys played Steal and Attack', done.includes('steal') && done.includes('attack'), done);
    const acts1 = await actions();
    log('act1.actions', acts1);
    check('Logos and Ormi used only their own moves', acts1.length >= 1 && acts1.every((a) => MOVES.has(a.id)), acts1.map((a) => a.id));

    // --- the seam and act 2 --------------------------------------------------------------------------------------------------------------------
    // The link-entry reading is taken at the first poll that sees Leblanc, not seconds later: by the first menu she may already have struck (the review's run, on the stat table before the 2026-11-09 fix: Paine at 479 of 488; the plates now read 263 for her), which is the product working.
    let entry = null;
    await waitFor('act 2 (Leblanc on the field)', async () => {
      const f = await field();
      if (f === null || !f.foes.some((x) => x.id === LEBLANC)) return false;
      entry = { f, struck: (await actions()).filter((a) => a.who === LEBLANC).length };
      return true;
    }, { ms: 120_000, pollMs: 500 });
    log('entry.2', entry);
    check('act 2 opens with Yuna in the Songstress', entry?.f.party[0]?.dress === 'songstress', entry?.f.party);
    // Whole on entry: every girl at her full HP, unless Leblanc had already swung when the first poll came (then every girl must at least stand, and none may be above her maximum).
    check(
      'the girls are whole at link entry (or, if Leblanc had already struck, all standing)',
      entry !== null && entry.f.party.length === 3 && (entry.struck > 0 ? entry.f.party.every((g) => g.alive && g.hp <= g.max) : entry.f.party.every((g) => g.alive && g.hp === g.max)),
      entry,
    );
    await shot('5-act-2-opens');
    await waitBattleMenu(page, 120000);
    await dismissCoach();
    await page.waitForTimeout(1000);
    const f2 = await field();
    log('field.2', f2);
    check('act 2: Leblanc alone at 130', f2?.foes.length === 1 && f2.foes[0].id === LEBLANC && f2.foes[0].hp === 130, f2?.foes);
    check('at the first menu Yuna still wears the Songstress and Rikku, Paine and she are standing', f2?.party[0]?.dress === 'songstress' && f2.party.every((g) => g.alive), f2?.party);
    await shot('5a-act-2-first-menu');
    log('menu.rows.act2', (await menuRows()).map((r) => r.text));

    if (!FIRST) {
      const done2 = [];
      let objAct2 = null;
      for (let i = 0; i < 60 && (await screenNow()) === 'battle'; i++) {
        const f = await field();
        if (f && f.foes.every((x) => !x.alive)) break;
        done2.push(await turn());
        await page.waitForTimeout(1000);
        // Once Leblanc has begun a second action her first has ended: the pause's middle objective reads done, the link objective too, the win not yet.
        if (!objAct2 && (await actions()).filter((a) => a.who === LEBLANC).length >= 2 && f && f.foes.some((x) => x.alive)) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(1500);
          objAct2 = await chapterObjectives();
          log('objectives.act2', objAct2);
          if (objAct2.length === 0) {
            objAct2 = null; // the pause did not open (the Escape went to a submenu): ask again after the next turn
            log('objectives.act2', 'pause not up; will ask again');
          } else {
            check('in act 2 after Leblanc has swung: the second link and her first swing read done, the win does not', objAct2.length === 3 && objAct2[0].done && objAct2[1].done && !objAct2[2].done, objAct2);
            await shot('7-pause-chapter-act-2');
            await closePause();
          }
        }
      }
      log('turns.act2', done2);
      check('Yuna danced', done2.includes('dance'), done2);
      const acts2 = await actions();
      log('act2.actions', acts2);
      check('Leblanc used only her own moves', acts2.length >= 1 && acts2.every((a) => MOVES.has(a.id)), acts2.map((a) => a.id));

      // --- the close -------------------------------------------------------------------------------------------------------------------------
      await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
      const end = await screenNow();
      check('Leblanc falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
      if (end === 'cutscene' || end === 'results') {
        await page.waitForTimeout(1500);
        await shot('10-tally');
        log('results.text', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700));
        await page.waitForTimeout(5500);
        if ((await screenNow()) === 'results' || (await screenNow()) === 'cutscene') await shot('11-results');
        const KEYS = ['dignity', 'last time', 'only wanted to sing', 'So did she'];
        const seen = [];
        let lastChange = Date.now();
        let lastPress = 0;
        for (let guard = 0; guard < 240 && seen.length < KEYS.length; guard++) {
          const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
          for (const k of KEYS.filter((x) => text.includes(x) && !seen.includes(x))) {
            seen.push(k);
            lastChange = Date.now();
            await shot(`12-post-${seen.length}`);
          }
          const confirmUp = /CONFIRM/.test(text);
          if ((confirmUp && Date.now() - lastPress > 1500) || Date.now() - lastChange > 5000) {
            await page.keyboard.press('Enter');
            lastPress = Date.now();
            if (!confirmUp) lastChange = Date.now();
          }
          await page.waitForTimeout(250);
        }
        log('post.lines', seen);
        check('the post scene shows its lines after the results are confirmed', seen.length >= 3, seen);
      }
    }
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
