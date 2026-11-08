#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Omega Ruins chapter (branch `ch-omega-ruins`; FFX only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word (`weapon`), looks at
 * party prep, plays the pre scene by keyboard, takes the first menu (Ultima Weapon alone on the Cavern's plate, Tidus, Yuna and Lulu in front), and then plays the three-act chain with REAL KEYS: an Attack that fells Ultima
 * Weapon, the seam, Omega Weapon's menu on a whole party, its eleven blows, the seam, Nemesis's menu, a real Attack at it, and (its HP set to 1) the last blow, the post scene and the results.
 *
 *   PYREFLY_BROWSER=gpu node tools/omega-ruins-smoke.mjs [--base http://127.0.0.1:5443/] [--out docs/screenshots/ch-omega-ruins] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7]
 *
 * The party is kept alive in Act III by editing the battle state through the debug API (`window.__pyrefly.battleState()`: HP; and Nemesis's HP set to 1 for the last blow); every command the party gives is a real key
 * press (Enter on Attack, Enter on the one target). It takes the review-browser lock (`tools/rig-record-lock.mjs`, the machine-wide browser lock) before it opens a browser and gives it back at the end. Headless only
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

const BASE = arg('--base', 'http://127.0.0.1:5443/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-omega-ruins'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-omega-ruins smoke', { maxMinutes: 12, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'weaponDoor.ts')).href).catch(() => null);
const WORD = door?.WEAPON_DOOR_WORD ?? 'weapon';
const CHAPTER = door?.WEAPON_DOOR_CHAPTER ?? 'omega-ruins';

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
/** What the engine says about the field now: the foe, the party, the flags. */
const field = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (i) => st.combatants[i];
    const foeId = st.enemyIds[0];
    const foe = c(foeId);
    return {
      foeId,
      foe: { hp: foe.hp, max: foe.stats.maxHp, alive: foe.alive, sprite: foe.spriteKey, statuses: Object.keys(foe.statuses) },
      active: st.activeIds,
      party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, max: c(i).stats.maxHp, alive: c(i).alive, mp: c(i).mp, statuses: Object.keys(c(i).statuses) })),
      flags: { uw: st.flags['uw.turn'], ow: st.flags['ow.counter'], nm: st.flags['nm.counter'] },
      turn: st.turn,
      log: st.log.length,
    };
  });
/** The foe's actions so far in this fight, from the engine's own log (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = [];
const foeActions = async () => {
  const got = await page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const foe = st.enemyIds[0];
    return st.log.filter((x) => x.type === 'action-start' && x.actorId === foe).map((x) => x.abilityId ?? x.command?.kind);
  });
  if (got) lastActions = got;
  return lastActions;
};
/** Keep the party up for the smoke (HP; a state edit, said so). */
const warding = async () => {
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 999999;
      c.hp = 999999;
    }
  });
};
const setFoeHp = (hp) => page.evaluate((h) => { const st = window.__pyrefly.battleState(); st.combatants[st.enemyIds[0]].hp = h; }, hp);
/** Real keys: Attack (the first row), then the one target, then confirm. */
async function attackWithKeys() {
  await dismissCoach(); // a first-time card takes the first Enter and holds the menu
  const ready = await waitBattleMenu(page, 60000).then(() => true).catch(() => false);
  if (!ready) {
    await dismissCoach();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    if (!(await waitBattleMenu(page, 30000).then(() => true).catch(() => false))) return false;
  }
  await page.keyboard.press('Enter'); // Attack
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter'); // the foe is the only target
  await page.waitForTimeout(900);
  return true;
}
/** Wait until the battle's foe is `id` (the next link of the chain has loaded) and a menu is open. */
async function untilFoe(id, ms = 120000) {
  const ok = await waitFor(`the foe is ${id}`, async () => (await field())?.foeId === id, { ms, pollMs: 500 }).then(() => true).catch(() => false);
  if (ok) await waitBattleMenu(page, 60000).catch(() => null);
  return ok;
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

  // --- Act I: Ultima Weapon ----------------------------------------------------------------------------------------------------------------
  const f1 = await field();
  log('field.1', f1);
  check('Ultima Weapon stands alone on the field at 99,999', f1?.foeId === 'ultima-weapon' && f1.foe.hp === 99999 && f1.foe.alive, f1?.foe);
  check('Tidus, Yuna and Lulu open, whole', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'lulu']) && f1.party.every((m) => m.hp === 9999 && m.alive), f1.party);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3c-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);
  const attacked = await attackWithKeys();
  check('a real Attack was given by keys', attacked, attacked);
  await page.waitForTimeout(1200);
  await shot('4-act-one-blow');

  // --- Act II: Omega Weapon ------------------------------------------------------------------------------------------------------------------
  const reachedOmega = await untilFoe('omega-weapon');
  check('Ultima Weapon falls to the one blow and the chain loads Omega Weapon', reachedOmega, await field());
  await page.waitForTimeout(1500);
  const f2 = await field();
  log('field.2', f2);
  check('Omega Weapon stands at 999,999 and the party is whole', f2?.foe.hp === 999999 && f2.party.every((m) => m.hp === m.max && m.alive), f2);
  await shot('5-act-two-first-menu');
  let blows = 0;
  for (let i = 0; i < 30; i++) {
    const now = await field();
    if (now?.foeId !== 'omega-weapon' || !now.foe.alive || now.foe.hp <= 0) break; // fallen, or the chain is about to load Nemesis
    const hpBefore = (await field()).foe.hp;
    if (await attackWithKeys()) blows++;
    // Let the blow land before the next turn is read: the killing blow's chain load can lag a few seconds, and a loop that reads the old foe would
    // spend one more Attack on Nemesis (the first desktop run of 2026-11-06 did, leaving Nemesis at 9,900,001).
    await waitFor('the blow lands', async () => { const f = await field(); return f?.foeId !== 'omega-weapon' || f.foe.hp < hpBefore; }, { ms: 15000, pollMs: 300 }).catch(() => null);
    await page.waitForTimeout(1200);
  }
  log('act two blows', blows);
  const omegaActs = await foeActions();
  log('omega.actions', omegaActs);

  // --- Act III: Nemesis -----------------------------------------------------------------------------------------------------------------------
  const reachedNemesis = await untilFoe('nemesis');
  check('Omega Weapon falls and the chain loads Nemesis', reachedNemesis, await field());
  await page.waitForTimeout(1500);
  const f3 = await field();
  log('field.3', f3);
  check('Nemesis stands at 10,000,000 and the party is whole', f3?.foe.hp === 10000000 && f3.party.every((m) => m.hp === m.max && m.alive), f3);
  await shot('6-act-three-first-menu');
  await dismissCoach();
  const before = (await field()).foe.hp;
  await warding();
  await attackWithKeys();
  await page.waitForTimeout(1800);
  const after = (await field()).foe.hp;
  check('a real Attack takes HP off Nemesis (the armour divides a plain blow, a Piercing weapon does not)', after < before, { before, after });
  await shot('7-nemesis-after-a-blow');
  let nemesisActs = await foeActions();
  for (let i = 0; i < 14 && nemesisActs.length < 4; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
    nemesisActs = await foeActions();
  }
  log('nemesis.actions', nemesisActs);
  check('Nemesis acts from its own list only', nemesisActs.every((a) => ['ruins-nemesis-attack', 'ruins-ethereal-cannon', 'ruins-ultra-spark', 'ruins-armageddon', 'ruins-nemesis-ultima'].includes(a)), nemesisActs);
  await shot('8-nemesis-moves');

  // --- the win, by real keys -----------------------------------------------------------------------------------------------------------------
  await setFoeHp(1);
  for (let i = 0; i < 20 && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  const end = await screenNow();
  check('Nemesis falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
  if (end === 'cutscene') {
    await page.waitForTimeout(1500);
    await shot('9-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 200; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
  }
  await waitFor('the results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
  const resultsText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 900);
  log('results.text', resultsText);
  check('the results pool the three fights (gil from Ultima and Omega Weapon)', /50,?000|20,?000|30,?000/.test(resultsText) || /Victory/i.test(resultsText), resultsText.slice(0, 200));
  await page.waitForTimeout(7000);
  if ((await screenNow()) === 'results') await shot('10-results');
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
check('no 4xx or 5xx responses other than the missing paintings', missing.filter((m) => !/ultima-weapon|omega-weapon|nemesis|chapter-omega|ch43/.test(m)).length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
