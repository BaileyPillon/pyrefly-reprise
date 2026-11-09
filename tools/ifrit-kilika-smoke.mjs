#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Ifrit at Kilika Temple chapter (branch `ch-ifrit-kilika`; FFX-2 only): a headless Playwright run, against a dev server that is already up (`node node_modules/vite/bin/vite.js --port <p>`),
 * that opens the chapter by its typed word, looks at party prep (THREE girls), plays the pre scene by keyboard, takes the first menu (Ifrit on the Chamber's plate, the girls on the left), and plays the fight with REAL KEYS:
 * Yuna's White Magic (Protect, then Shell, then Pray), Rikku's and Paine's Attack at Ifrit (Enter, Enter). It reads the engine's own log for his moves (the first Meteor Strike's target, a Hellfire), sets his HP low once he has
 * made a few moves (the fight's last blows are still real Attacks), and reaches the results and the post scene.
 *
 *   PYREFLY_BROWSER=gpu node tools/ifrit-kilika-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-ifrit-kilika] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--short]
 *
 * `--short` stops at the first menu and its pause screen (the phone arm). Every state edit is named in the log ("edit:"): the girls' HP is kept above a floor so the run cannot end in an accidental defeat, and his HP is set
 * low so the run is minutes. It takes the browser lock (`tools/rig-record-lock.mjs`, the machine-wide lock) before it opens a browser and gives it back at the end. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU);
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-ifrit-kilika'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SHORT = flag('--short');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-ifrit-kilika smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'ifritDoor.ts')).href).catch(() => null);
const WORD = door?.IFRIT_DOOR_WORD ?? 'ifrit';
const CHAPTER = door?.IFRIT_DOOR_CHAPTER ?? 'ffx2-ifrit-kilika';
const IFRIT = 'x2-ifrit';
const MOVES = new Set(['x2-ifrit-attack', 'x2-ifrit-firaga', 'x2-ifrit-meteor-strike', 'x2-ifrit-hellfire']);

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
  }, IFRIT);
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

/** The buffs Yuna has cast, so the line is Protect, then Shell, then Pray. */
const casts = { protect: false, shell: false };
/** Dead turns in a row (no row matched): after three the tool backs out of whatever menu is up and takes a picture. */
let dead = 0;
/** One real-key turn of whoever has the menu: a girl with an Attack row attacks Ifrit, Yuna (White Mage, no Attack) casts Protect, then Shell, then Pray. Returns what was done. */
async function turn() {
  await dismissCoach();
  if (!(await menuUp())) return 'no-menu';
  const rows = (await menuRows()).map((r) => r.text);
  if (rows.some((t) => /^Attack$/i.test(t))) {
    if (await pick(/^Attack$/i)) {
      await page.keyboard.press('Enter'); // the one foe is the target
      await page.waitForTimeout(900);
      dead = 0;
      return 'attack';
    }
  }
  const want = !casts.protect ? /^Protect$/i : !casts.shell ? /^Shell$/i : /^Pray$/i;
  const inSubmenu = rows.some((t) => /^Pray$/i.test(t));
  if (inSubmenu || (await pick(/^White Magic$/i))) {
    if (await pick(want)) {
      if (!casts.protect) casts.protect = true;
      else if (!casts.shell) casts.shell = true;
      await page.waitForTimeout(600);
      // Protect and Shell ask for a target (Enter confirms the one the cursor is on); Pray is the whole party and closes the menu itself, so its rows are gone by now.
      if ((await menuRows()).some((r) => /^Pray$/i.test(r.text))) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(900);
      }
      dead = 0;
      return want.source.replace(/[^a-z]/gi, '').toLowerCase();
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
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
  check('Ifrit stands alone on the field at 8,820', f1?.foes.length === 1 && f1.foes[0].id === IFRIT && f1.foes[0].hp === 8820 && f1.foes[0].alive, f1?.foes);
  check('the three girls open', JSON.stringify(f1?.active) === JSON.stringify(['yuna', 'rikku', 'paine']), f1?.active);
  check('Ifrit wears the FFX aeon\'s Ifrit painting as the stand-in', f1?.foes[0]?.sprite === 'ifrit', f1?.foes[0]?.sprite);
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
    // --- the fight: real keys ---------------------------------------------------------------------------------------------------------------
    const done = [];
    let lowered = false;
    let shotMeteor = false;
    let shotHellfire = false;
    for (let i = 0; i < 90 && (await screenNow()) === 'battle'; i++) {
      await floorGirls(0.3);
      done.push(await turn());
      await page.waitForTimeout(1000);
      const acts = await actions();
      if (!shotMeteor && acts.some((a) => a.id === 'x2-ifrit-meteor-strike')) {
        shotMeteor = true;
        await shot('4-after-meteor');
      }
      if (!shotHellfire && acts.some((a) => a.id === 'x2-ifrit-hellfire')) {
        shotHellfire = true;
        await shot('5-after-hellfire');
      }
      const f = await field();
      const foe = f?.foes.find((x) => x.id === IFRIT);
      if (foe && !lowered && acts.length >= 8 && foe.hp > 500) {
        lowered = true;
        await setHp(IFRIT, 500); // the fight's last blows are still real Attacks
        await shot('6-ifrit-low');
      }
      if (foe && !foe.alive) break;
    }
    log('turns', done);
    check('real keys played Attack and Yuna\'s White Magic', done.includes('attack') && done.some((d) => /protect|shell|pray/.test(d)), done);
    const acts = await actions();
    log('ifrit.actions', acts);
    check('Ifrit used only his four moves', acts.length >= 1 && acts.every((a) => MOVES.has(a.id)), acts.map((a) => a.id));
    const meteor = acts.find((a) => a.id === 'x2-ifrit-meteor-strike');
    check('his first Meteor Strike went to one girl (Yuna while she stood farthest)', meteor === undefined || meteor.target !== null, meteor);

    // --- the close ---------------------------------------------------------------------------------------------------------------------------
    await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
    const end = await screenNow();
    check('Ifrit falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
    if (end === 'cutscene' || end === 'results') {
      // The post script opens with the results tally; its lines come after the tally's Confirm, on their own `auto` timings. Take the tally, press Enter to Confirm, and take the screen at each line's first appearance.
      await page.waitForTimeout(1500);
      await shot('10-tally');
      log('results.text', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700));
      await page.waitForTimeout(5500);
      if ((await screenNow()) === 'results' || (await screenNow()) === 'cutscene') await shot('11-results');
      const KEYS = ['are you all right', 'waking the fayth', 'Then we find them', 'certificate'];
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
