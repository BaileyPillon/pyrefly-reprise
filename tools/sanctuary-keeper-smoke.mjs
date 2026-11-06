#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Sanctuary Keeper chapter (branch `ch-sanctuary-keeper`; FFX only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word (`beast`),
 * looks at party prep, plays the pre scene by keyboard, takes the first menu (the Keeper alone on Chapter I's Mt. Gagazet plate, Tidus, Yuna and Auron in front), and then plays the fight with REAL KEYS to a result: an
 * Attack at the Keeper, Photon Wings on the whole line (Curse on everyone it hits), the Tail Sweep counter after enough blows, and the win (the Keeper falls, the post scene, the results).
 *
 *   PYREFLY_BROWSER=gpu node tools/sanctuary-keeper-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-sanctuary-keeper] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7]
 *
 * The party is kept alive by editing the battle state through the debug API (`window.__pyrefly.battleState()`: HP, and the Keeper's HP set to 1 for the last blow); every command the party gives is a real key press
 * (Enter on Attack, Enter on the one target). It takes the review-browser lock (`tools/rig-record-lock.mjs`, the machine-wide browser lock) before it opens a browser and gives it back at the end. Headless only
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-sanctuary-keeper'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-sanctuary-keeper smoke (desk)', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'beastDoor.ts')).href).catch(() => null);
const WORD = door?.BEAST_DOOR_WORD ?? 'beast';
const CHAPTER = door?.BEAST_DOOR_CHAPTER ?? 'sanctuary-keeper';
const KEEPER = 'sanctuary-keeper';

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
  page.evaluate((id) => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (i) => st.combatants[i];
    const k = c(id);
    return {
      keeper: { hp: k.hp, alive: k.alive, sprite: k.spriteKey, statuses: Object.keys(k.statuses) },
      active: st.activeIds,
      party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, alive: c(i).alive, statuses: Object.keys(c(i).statuses) })),
      flags: { cycle: st.flags['sk.cycle'], phase: st.flags['sk.phase'], count: st.flags['sk.count'] },
      turn: st.turn,
      log: st.log.length,
    };
  }, KEEPER);
/** The Keeper's actions so far, from the engine's own log (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = [];
const keeperActions = async () => {
  const got = await page.evaluate((id) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === id).map((x) => x.abilityId ?? x.command?.kind) : null;
  }, KEEPER);
  if (got) lastActions = got;
  return lastActions;
};
/** Keep the party up for the smoke (HP, and the statuses that would end a moment about something else); a state edit, said so. */
const warding = async () => {
  await keeperActions();
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
      for (const s of ['petrify', 'doom', 'sleep', 'confuse']) {
        c.immunities[s] = 255;
        delete c.statuses[s];
      }
    }
  });
};
const setHp = (id, hp) => page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
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
  await page.keyboard.press('Enter'); // the Keeper is the only target
  await page.waitForTimeout(900);
  return true;
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
  const f1 = await field();
  log('field.1', f1);
  check('the Keeper stands alone on the field at 40,000', f1?.keeper.hp === 40000 && f1.keeper.alive, f1?.keeper);
  check('Tidus, Yuna and Auron open', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'auron']), f1.active);
  check('no cycle state yet: the first Keeper turn is Photon Wings', (f1.flags.cycle ?? 0) === 0, f1.flags);
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

  // --- the first blow and Photon Wings, by real keys --------------------------------------------------------------------------------------------
  const before = (await field()).keeper.hp;
  await attackWithKeys();
  await page.waitForTimeout(1800);
  const after = (await field()).keeper.hp;
  check('a real Attack takes HP off the Keeper', after < before, { before, after });
  let acts = await keeperActions();
  for (let i = 0; i < 12 && acts.length === 0; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
    acts = await keeperActions();
  }
  check('the Keeper\'s first action is Photon Wings', acts[0] === 'sanctuary-photon-wings', acts);
  await page.waitForTimeout(600);
  await shot('4-after-photon-wings');
  const f2 = await field();
  check('Curse is on the party (Photon Wings, always)', f2.party.every((m) => !m.alive || m.statuses.includes('curse')), f2.party);

  // --- the cycle runs, and the counter comes (Tail Sweep), by real keys ----------------------------------------------------------------------------
  let swept = false;
  for (let i = 0; i < 24 && !swept; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
    swept = (await keeperActions()).includes('sanctuary-tail-sweep');
  }
  check('the sweep answers the blows (Tail Sweep, within 24 attacks)', swept, await keeperActions());
  await page.waitForTimeout(1500);
  await shot('5-after-tail-sweep');
  // The sweep can come before the Keeper's second turn (three to seven blows set it off), so play on until it has taken its first four turns of the cycle.
  const turns = async () => (await keeperActions()).filter((a) => a !== 'sanctuary-tail-sweep');
  for (let i = 0; i < 30 && (await turns()).length < 6; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
  }
  const cycle = await keeperActions();
  log('keeper.actions', cycle);
  check('the cycle is the game\'s order: Wings, Attack, Attack, Mana Breath, then the support turns (the counter between)', JSON.stringify((await turns()).slice(0, 4)) === JSON.stringify(['sanctuary-photon-wings', 'attack', 'attack', 'sanctuary-mana-breath']), cycle);
  await shot('5b-after-the-breath');

  // --- the win, by real keys ---------------------------------------------------------------------------------------------------------------------
  await setHp(KEEPER, 1);
  for (let i = 0; i < 20 && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  const end = await screenNow();
  check('the Keeper falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
  if (end === 'cutscene') {
    await page.waitForTimeout(1500);
    await shot('6-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 200; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
  }
  await waitFor('the results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
  log('results.text', (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700));
  await page.waitForTimeout(7000);
  if ((await screenNow()) === 'results') await shot('7-results');
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
check('no 4xx or 5xx responses other than the missing paintings', missing.filter((m) => !/sanctuary-keeper|chapter-sanctuary/.test(m)).length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
