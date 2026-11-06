#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Yuna's Ballad chapter (branch `ch-yunas-ballad`; FFX-2 only): a headless Playwright run, against a dev server that is already up (`node node_modules/vite/bin/vite.js --port <p>`), that
 * opens the chapter by its typed word, looks at party prep (ONE girl), plays the pre scene by keyboard, takes the first menu (the possessed Rikku on the Den of Woe's plate, Yuna alone), and plays duel 1 with REAL KEYS: Change
 * to Warrior (Change, then the row), Attack at Rikku (Enter, Enter), an X-Potion when Yuna is under half (Item, X-Potion, Enter). When Rikku has acted a few times her HP is set low through the debug API (the fight's
 * last blow is still a real Attack), the seam plays, duel 2 opens with the HP Yuna left with, Paine falls the same way, and the post scene and the results are reached.
 *
 *   PYREFLY_BROWSER=gpu node tools/yunas-ballad-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-yunas-ballad] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--short]
 *
 * `--short` stops at the first menu of duel 1 and its pause screen (the phone arm). Every state edit is named in the log ("edit:"): Yuna's HP is kept above a floor so the run cannot end in a defeat by accident, and the
 * fighter's HP is set low so the run is minutes, not an hour. It takes the browser lock (`tools/rig-record-lock.mjs`, the machine-wide lock) before it opens a browser and gives it back at the end. Headless only
 * (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-yunas-ballad'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SHORT = flag('--short');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-yunas-ballad smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'wraithDoor.ts')).href).catch(() => null);
const WORD = door?.WRAITH_DOOR_WORD ?? 'wraith';
const CHAPTER = door?.WRAITH_DOOR_CHAPTER ?? 'ffx2-yunas-ballad';
const RIKKU = 'x2-possessed-rikku';
const PAINE = 'x2-possessed-paine';

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
/** The fighter's actions so far, from the engine's own log (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = { [RIKKU]: [], [PAINE]: [] };
const actionsOf = async (id) => {
  const got = await page.evaluate((who) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === who).map((x) => x.abilityId ?? x.command?.kind) : null;
  }, id);
  if (got) lastActions[id] = got;
  return lastActions[id];
};
/** A state edit, said so: Yuna's HP kept above a floor (the run must not end in an accidental defeat). */
async function floorYuna(fraction = 0.3) {
  const edited = await page.evaluate((f) => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const y = st.combatants['yuna'];
    if (y.hp < y.stats.maxHp * f) {
      y.hp = Math.ceil(y.stats.maxHp * f);
      return y.hp;
    }
    return null;
  }, fraction);
  if (edited !== null) log('edit:', `Yuna's HP raised to ${edited} (floor ${Math.round(fraction * 100)} percent)`);
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

/** One real-key turn of Yuna's: heal under half, Change to Warrior once, else Attack the one foe. Returns what was done. */
async function turn(foeId) {
  await dismissCoach();
  if (!(await menuUp())) return 'no-menu';
  const f = await field();
  const y = f.party[0];
  if (y.hp < y.max * 0.5 && (await pick(/^Item$/i))) {
    if (await pick(/X-Potion/i)) {
      await page.keyboard.press('Enter'); // the target: Yuna
      await page.waitForTimeout(900);
      return 'x-potion';
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  if (y.dress !== 'warrior' && (await pick(/^Change$/i))) {
    if (await pick(/warrior/i)) {
      await page.waitForTimeout(1800);
      return 'change-warrior';
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  if (await pick(/^Attack$/i)) {
    await page.keyboard.press('Enter'); // the one foe is the target
    await page.waitForTimeout(900);
    return 'attack';
  }
  return `no-row:${(await menuRows()).map((r) => r.text).join('|')}`;
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
  check('party prep shows ONE girl: Yuna', JSON.stringify(roster) === JSON.stringify(['Yuna']), roster);
  const slots = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 600));
  log('prep.text', slots);
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
  check('Rikku stands alone on the field at 7,800', f1?.foes.length === 1 && f1.foes[0].id === RIKKU && f1.foes[0].hp === 7800 && f1.foes[0].alive, f1?.foes);
  check('Yuna alone opens', JSON.stringify(f1?.active) === JSON.stringify(['yuna']), f1?.active);
  check('Rikku wears the party\'s Rikku painting as the stand-in', f1?.foes[0]?.sprite === 'rikku', f1?.foes[0]?.sprite);
  const plates = await page.evaluate(() => document.querySelectorAll('.ffx2hud__party .ig-stat').length);
  check('the party panel holds ONE plate', plates === 1, plates);
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
    // --- duel 1: real keys --------------------------------------------------------------------------------------------------------------------
    const done = [];
    for (let i = 0; i < 40 && (await screenNow()) === 'battle'; i++) {
      await floorYuna(0.3);
      const did = await turn(RIKKU);
      done.push(did);
      await page.waitForTimeout(1200);
      const acts = await actionsOf(RIKKU);
      if (i === 2) await shot('4-after-rikku-acts');
      const f = await field();
      const foe = f?.foes.find((x) => x.id === RIKKU);
      if (foe && acts.length >= 4 && foe.hp > 400) {
        await setHp(RIKKU, 400); // the fight's last blows are still real Attacks
        await shot('5-rikku-low');
      }
      if (foe && !foe.alive) break;
      const nowF = await field();
      if (nowF && nowF.foes.some((x) => x.id === PAINE)) break;
    }
    log('turns.duel1', done);
    check('Yuna changed to Warrior by real keys and attacked by real keys', done.includes('change-warrior') && done.includes('attack'), done);
    const acts1 = await actionsOf(RIKKU);
    log('rikku.actions', acts1);
    const allowed = new Set(['x2-possessed-rikku-spider-attack', 'x2-possessed-rikku-grenade', 'x2-possessed-rikku-bomb-core', 'x2-possessed-rikku-arctic-wind', 'x2-possessed-rikku-lightning-marble', 'x2-possessed-rikku-dragon-scale']);
    check('Rikku used only her own moves', acts1.length >= 1 && acts1.every((a) => allowed.has(a)), acts1);

    // --- the seam and duel 2 -----------------------------------------------------------------------------------------------------------------
    let seam = false;
    for (let i = 0; i < 80; i++) {
      const sc = await screenNow();
      const f = await field();
      if (sc === 'battle' && f?.foes.some((x) => x.id === PAINE)) break;
      if (sc === 'cutscene' || sc === 'battle') {
        if (!seam && (await page.evaluate(() => /pyreflies|Rikku drops/i.test(document.body.innerText)))) {
          seam = true;
          await shot('6-seam');
        }
        if (sc === 'battle' && (await waitBattleMenu(page, 1500).then(() => true).catch(() => false))) {
          await floorYuna(0.3);
          await turn(RIKKU);
        } else {
          await page.keyboard.press('Enter');
        }
      }
      await page.waitForTimeout(700);
    }
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(1500);
    const f2 = await field();
    log('field.2', f2);
    check('duel 2 opens on Paine, Yuna alone', f2?.foes.length === 1 && f2.foes[0].id === PAINE && JSON.stringify(f2.active) === JSON.stringify(['yuna']), { foes: f2?.foes, active: f2?.active });
    check('Yuna was not healed on the way in (HP carried): below her maximum', f2 && f2.party[0].hp < f2.party[0].max, f2?.party[0]);
    check('Paine wears the party\'s Paine painting as the stand-in', f2?.foes[0]?.sprite === 'paine-warrior', f2?.foes[0]?.sprite);
    await shot('7-duel2-first-menu');

    for (let i = 0; i < 40 && (await screenNow()) === 'battle'; i++) {
      await floorYuna(0.3);
      await turn(PAINE);
      await page.waitForTimeout(1200);
      const acts = await actionsOf(PAINE);
      if (i === 1) await shot('8-after-paine-acts');
      const f = await field();
      const foe = f?.foes.find((x) => x.id === PAINE);
      if (foe && acts.length >= 2 && foe.hp > 400) {
        await setHp(PAINE, 400);
        await shot('9-paine-low');
      }
      if (foe && !foe.alive) break;
    }
    const acts2 = await actionsOf(PAINE);
    log('paine.actions', acts2);
    check('Paine used only her Attack', acts2.length >= 1 && acts2.every((a) => a === 'x2-possessed-paine-attack'), acts2);

    // --- the close ---------------------------------------------------------------------------------------------------------------------------
    await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
    const end = await screenNow();
    check('Paine falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
    if (end === 'cutscene' || end === 'results') {
      // The post script opens with the results tally (`results()`): the first thing on screen is the tally (the app's own results screen, played inside the script), and the lines come after its Confirm, on their own
      // `auto` timings. Take the tally, take the results screen once it has settled, then press Enter to Confirm and take the screen at each line's first appearance (the script's own words, searched in the page text).
      // If nothing new shows for five seconds, Enter nudges the scene on.
      await page.waitForTimeout(1500);
      await shot('10-tally');
      log('results.text', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700));
      await page.waitForTimeout(5500);
      if ((await screenNow()) === 'results' || (await screenNow()) === 'cutscene') await shot('11-results');
      const KEYS = ['What did I do', 'Nothing you meant', 'not quiet', 'my everything hurt', 'three more lights'];
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
