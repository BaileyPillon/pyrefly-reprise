#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Wendigo chapter (branch `ch-wendigo`; FFX only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word on the chapter-select board
 * (a desktop window, so the desktop-only gate is open), looks at party prep, plays the pre scene (silent: it fades in by itself), takes the first menu (Wendigo and its two Guardians on the Macalania Temple's painted
 * stage, Tidus, Yuna and Rikku in front), and then plays the fight with REAL KEYS to a result: Attack at a Guardian, the Guardians' Berserk on Wendigo, Wendigo's Berserk blows, the first Guardian to fall casting its last
 * shield from the dead (Protect for the first, Shell for the second), and the win (Wendigo falls, the post scene, the results). The stage is today's STAND-IN; the Meshy 3D stage replaces it, and this tool is the one to run
 * again then.
 *
 *   PYREFLY_BROWSER=gpu node tools/wendigo-smoke.mjs [--base http://127.0.0.1:5391/] [--out docs/screenshots/ch-wendigo] [--tag desk] [--w 1600 --h 900] [--seed 7]
 *
 * The party is kept alive by editing the battle state through the debug API (`window.__pyrefly.battleState()`: HP, and the enemies' HP set to 1 for the last blows; said so); every command the party gives is a real key
 * press (Enter on Attack, Enter on the target). It takes the review-browser lock (`tools/rig-record-lock.mjs`, the machine-wide browser lock) before it opens a browser and gives it back at the end. Headless only
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

const BASE = arg('--base', 'http://127.0.0.1:5391/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-wendigo'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-wendigo smoke (desk)', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const WORD = 'wendigo';
const CHAPTER = 'wendigo';
const WENDIGO = 'wendigo';
const GUARDIANS = ['lake-guardian-a', 'lake-guardian-b'];

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: false });
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
  page.evaluate(([w, gs]) => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (i) => st.combatants[i];
    const mon = (i) => ({ hp: c(i).hp, alive: c(i).alive, sprite: c(i).enemy?.spriteKey ?? null, statuses: Object.keys(c(i).statuses) });
    return {
      wendigo: mon(w),
      guardians: gs.map((g) => mon(g)),
      active: st.activeIds,
      party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, alive: c(i).alive, statuses: Object.keys(c(i).statuses) })),
      flags: { arms: st.flags['wendigo.arms'], armTurns: st.flags['wendigo.armTurns'], cycle: st.flags['wendigo.cycle'] },
      log: st.log.length,
    };
  }, [WENDIGO, GUARDIANS]);
/** The battle's actions so far (`who:ability`), from the engine's own log; the results screen has no battle to ask, so the last reading is kept. */
let lastActions = [];
const actions = async () => {
  const got = await page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start').map((x) => `${x.actorId}:${x.abilityId ?? x.command?.kind}`) : null;
  });
  if (got) lastActions = got;
  return lastActions;
};
/** Keep the party up for the smoke (HP, and the statuses that would end a moment about something else); a state edit, said so. */
const warding = async () => {
  await actions();
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
      for (const s of ['petrify', 'doom', 'sleep', 'confuse', 'berserk']) {
        c.immunities[s] = 255;
        delete c.statuses[s];
      }
    }
  });
};
const setHp = (id, hp) => page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
/** Real keys: Attack (the first row), then the target the cursor starts on, then confirm. */
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
  await page.keyboard.press('Enter'); // the target the cursor starts on
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
  check('party prep holds after the word (the door is open on a desktop window)', (await screenNow()) === 'party-prep', await screenNow());
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
  check('Wendigo stands at 18,000 between its two Guardians at 1,200', f1?.wendigo.hp === 18000 && f1.guardians.every((g) => g.hp === 1200 && g.alive), f1);
  check('Tidus, Yuna and Rikku open', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'rikku']), f1.active);
  check('no stance yet', f1.flags.arms === undefined || f1.flags.arms === false, f1.flags);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');

  // --- the first blows, by real keys: the Guardians Berserk it, Berserk Wendigo punches ---------------------------------------------------------
  await warding();
  await attackWithKeys();
  await page.waitForTimeout(1800);
  let acts = await actions();
  for (let i = 0; i < 14 && !(acts.some((a) => a.endsWith(':lake-berserk')) && acts.some((a) => a.startsWith('wendigo:'))); i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
    acts = await actions();
  }
  log('actions.opening', acts.slice(0, 14));
  const firstBerserk = acts.find((a) => a.endsWith(':lake-berserk'));
  check('a Guardian\'s first spell is Berserk on Wendigo', firstBerserk !== undefined, acts);
  const f2 = await field();
  check('Wendigo is Berserk (the Guardians put it there)', f2.wendigo.statuses.includes('berserk'), f2.wendigo);
  check('Wendigo\'s first action is the plain Attack (a Berserk Wendigo runs no script)', acts.find((a) => a.startsWith('wendigo:')) === 'wendigo:attack', acts);
  await page.waitForTimeout(600);
  await shot('4-after-the-opening');

  // --- a Guardian falls, by real keys, and casts its last shield from the dead --------------------------------------------------------------------
  await setHp(GUARDIANS[0], 1);
  await setHp(GUARDIANS[1], 1);
  const shield = () => lastActions.find((a) => a === 'lake-guardian-a:protect' || a === 'lake-guardian-b:shell');
  for (let i = 0; i < 12 && !shield() && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
    await actions();
  }
  log('actions.guardian-falls', (await actions()).filter((a) => /protect|shell|berserk/.test(a)));
  const fallen = await field();
  check('a Guardian has fallen and cast its last shield on Wendigo from the dead (Protect for the first, Shell for the second)', shield() !== undefined, lastActions.slice(-12));
  const has = (st) => fallen?.wendigo.statuses.includes(st);
  check('Wendigo wears the shield', has('protect') || has('shell'), fallen?.wendigo);
  await page.waitForTimeout(800);
  await shot('5-after-a-guardian-falls');

  // --- the win, by real keys ----------------------------------------------------------------------------------------------------------------------
  await setHp(WENDIGO, 1);
  await setHp(GUARDIANS[0], 1);
  await setHp(GUARDIANS[1], 1);
  for (let i = 0; i < 24 && (await screenNow()) === 'battle'; i++) {
    await warding();
    await setHp(WENDIGO, 1);
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(1500);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  const end = await screenNow();
  check('Wendigo falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
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
check('no 4xx or 5xx responses other than the missing paintings', missing.filter((m) => !/characters\/wendigo|chapter-wendigo|ch49/.test(m)).length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
