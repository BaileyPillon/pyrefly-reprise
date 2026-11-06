#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Penance chapter (branch `ch-penance`; FFX only): a headless Playwright run, against a dev or preview server that is already up, that opens the chapter by its typed word
 * (`judgment`), looks at party prep, plays the pre scene by keyboard, takes the first menu (Penance and its two hands on the Fahrenheit's deck), and then plays the chapter's moments with REAL KEYS: the change
 * (a hit that leaves Penance under three quarters: the split painting, once), an arm falling (hidden from the cursor, back after the clock has run), and the win (Penance falls, the arms with it, the results).
 *
 *   PYREFLY_BROWSER=gpu node tools/penance-smoke.mjs [--base http://127.0.0.1:5231/] [--out docs/screenshots/ch-penance] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--explore]
 *
 * The party is kept alive by editing the battle state through the debug API (`window.__pyrefly.battleState()`: HP, and the fast-forward that puts Penance's HP just over a line); every command the party gives is a
 * real key press (Enter on Attack, the target cursor's arrows, Enter on the target). It takes the review-browser lock (`D:/Tools/pyrefly-scratch/RIG-RECORD`) before it opens a browser and gives it back at the end.
 * Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
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

const BASE = arg('--base', 'http://127.0.0.1:5231/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-penance'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const EXPLORE = flag('--explore');
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-penance smoke (desk)', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'judgmentDoor.ts')).href).catch(() => null);
const WORD = door?.JUDGMENT_DOOR_WORD ?? 'judgment';
const CHAPTER = door?.JUDGMENT_DOOR_CHAPTER ?? 'penance';
const ENEMIES = ['penance', 'penance-right-arm', 'penance-left-arm'];

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
    const c = (id) => st.combatants[id];
    return {
      enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, removed: c(id).removed, sprite: c(id).spriteKey, statuses: Object.keys(c(id).statuses) })),
      active: st.activeIds,
      party: st.activeIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, statuses: Object.keys(c(id).statuses) })),
      flags: { phase: st.flags['pen.phase'], counter: st.flags['pen.counter'] },
      turn: st.turn,
      log: st.log.length,
    };
  });
/** Keep the party up for the smoke (HP, and the statuses that would end a moment about something else); a state edit, said so. */
const warding = () =>
  page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
      for (const s of ['petrify', 'doom', 'armor-break', 'sleep']) {
        c.immunities[s] = 255;
        delete c.statuses[s];
      }
    }
  });
const setHp = (id, hp) => page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
const whoseTurn = () =>
  page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    return st.activeIds.find((id) => document.body.innerText.length > 0 && (window.__pyrefly.snapshotState?.() && JSON.stringify(window.__pyrefly.snapshotState()).includes(`"actorId":"${id}"`))) ?? null;
  });
/** Real keys: Attack (the first row), then the target cursor to `target`, then confirm. The cursor starts on the first enemy; the arrows walk the enemies. */
async function attackWithKeys(target) {
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
  const order = await page.evaluate(() => window.__pyrefly.battleState().enemyIds.filter((id) => { const c = window.__pyrefly.battleState().combatants[id]; return c.alive && !c.removed && !c.flags.hidden && !c.flags.untargetable; }));
  const want = order.indexOf(target);
  if (want < 0) return false;
  for (let i = 0; i < want; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(220);
  }
  await page.waitForTimeout(250);
  await page.keyboard.press('Enter');
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
  check('Penance and its two hands stand on the field', JSON.stringify(f1?.enemies.map((e) => e.id)) === JSON.stringify(ENEMIES), f1?.enemies.map((e) => e.id));
  check('Tidus, Yuna and Rikku open', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'rikku']), f1.active);
  check('Penance starts with Protect on, at 12,000,000', f1.enemies[0].statuses.includes('protect') && f1.enemies[0].hp === 12000000, f1.enemies[0]);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');
  if (EXPLORE) {
    log('snapshot', await page.evaluate(() => JSON.stringify(window.__pyrefly.snapshotState?.() ?? null).slice(0, 3000)));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    log('target-step html', await page.evaluate(() => [...document.querySelectorAll('[class*="target"]')].slice(0, 8).map((e) => e.className + ':' + (e.textContent || '').slice(0, 40)).join(' | ')));
    await shot('3b-target-step');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3c-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- the change, by real keys ---------------------------------------------------------------------------------------------------------------
  await warding();
  await setHp('penance', 9050000); // a state edit: Penance just over the line, so one real Attack makes the change
  let changed = false;
  for (let i = 0; i < 14 && !changed; i++) {
    await warding();
    await attackWithKeys('penance');
    await page.waitForTimeout(1800);
    changed = (await field()).flags.phase === 1;
  }
  check('one real Attack across the line makes the change (pen.phase 1)', changed, await field());
  await page.waitForTimeout(6000); // Separation, the flash and the swap
  const f2 = await field();
  check('Penance wears the split painting once, Protect is off', f2.enemies[0].sprite === 'penance-split' && !f2.enemies[0].statuses.includes('protect'), f2.enemies[0]);
  await shot('4-the-change');
  await waitBattleMenu(page, 120000).catch(() => null);

  // --- an arm falls, by real keys ------------------------------------------------------------------------------------------------------------------
  await setHp('penance-right-arm', 1000);
  let fell = false;
  for (let i = 0; i < 14 && !fell; i++) {
    await warding();
    await attackWithKeys('penance-right-arm');
    await page.waitForTimeout(1800);
    const f = await field();
    fell = !f.enemies[1].alive;
  }
  check('the Right Arm falls to a real Attack and is gone from the field', fell, await field());
  await page.waitForTimeout(2500);
  await shot('5-arm-down');
  const gone = await page.evaluate(() => document.body.innerText.includes('Right Arm'));
  log('arm text on screen while down', gone);
  let back = false;
  for (let i = 0; i < 40 && !back; i++) {
    await warding();
    if (await waitBattleMenu(page, 30000).then(() => true).catch(() => false)) {
      await attackWithKeys('penance');
      await page.waitForTimeout(1500);
    }
    back = (await field()).enemies[1].alive;
  }
  check('the Right Arm is back whole after the clock has run', back, await field());
  await shot('6-arm-back');

  // --- the win, by real keys -----------------------------------------------------------------------------------------------------------------
  await setHp('penance', 1);
  for (let i = 0; i < 20 && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) await attackWithKeys('penance');
    await page.waitForTimeout(1500);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  let end = await screenNow();
  check('Penance falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
  const fEnd = await page.evaluate(() => { const st = window.__pyrefly.battleState?.(); return st ? st.enemyIds.map((id) => [id, st.combatants[id].alive]) : null; });
  log('enemies at the end', fEnd);
  if (end === 'cutscene') {
    await page.waitForTimeout(1500);
    await shot('7-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 260; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
    await waitFor('results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
    end = await screenNow();
  }
  check('the chapter reaches its results', end === 'results', end);
  await page.waitForTimeout(7000);
  if ((await screenNow()) === 'results') await shot('8-results');
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
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
