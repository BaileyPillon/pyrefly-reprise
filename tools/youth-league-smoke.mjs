#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Youth League Tournament (branch `ch-youth-league`; FFX-2 only): a headless Playwright run against a dev server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes, and gives up after `--wait-min` minutes in the line). It opens the chapter by its typed word,
 * looks at party prep, plays the pre scene by keyboard, takes the first menu of act 1 (Yaibal and two Warriors, on the Den of Woe's stage), plays turns with the real keys (Enter on Attack, Enter on the one target),
 * then writes every fighter's HP down to a few hundred (a debug write to the battle state, as the Cup, Mirror and Dark Aeons smokes do: the fights themselves are not a measurement of difficulty) and carries on by
 * keys, act after act, to the seventh and to the results page and the post scene. At each act's first menu it reads the field: who stands there, and that the party arrived as the last act left it (carried, never
 * restored). The barks of the six falls are read from the battle log as they fire.
 *
 *   PYREFLY_BROWSER=gpu node tools/youth-league-smoke.mjs [--base http://127.0.0.1:5241/] [--out docs/screenshots/ch-youth-league] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--wait-min 30]
 *
 * Exit code 1 on a failed check, 2 when the lock could not be had in time (nothing was run: the spec stands UNVERIFIED). Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the
 * built-in pane. **The eight fighter types have no paintings** (`x2-yaibal`, `x2-lucil`, `x2-elma`, `x2-league-warrior`, `-veteran`, `-slasher`, `-mage`, `-master`): the presenter draws its procedural stand-in for
 * each and says so in a console warning, which is accepted here; the pause hero is the Den of Woe's existing plate.
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

const BASE = arg('--base', 'http://127.0.0.1:5241/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-youth-league'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const WAIT_MIN = Number(arg('--wait-min', '30'));
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'youthDoor.ts')).href);
const ids = await import(pathToFileURL(join(REPO, 'src', 'data', 'youth-league-ids.ts')).href);
const WORD = door.YOUTH_DOOR_WORD;
const CHAPTER = door.YOUTH_DOOR_CHAPTER;
const ACTS = ids.ACT_ENEMY_IDS;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

// The lock, with a ceiling on the wait: past `--wait-min` the run gives up before it has touched a browser.
let release;
const gaveUp = Symbol('gave-up');
const lockTry = takeRigRecord(`ch-youth-league smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
const winner = await Promise.race([lockTry, new Promise((r) => setTimeout(() => r(gaveUp), WAIT_MIN * 60_000))]);
if (winner === gaveUp) {
  console.log(`lock not had within ${WAIT_MIN} minutes: the smoke did not run (UNVERIFIED)`);
  process.exit(2);
}
release = winner;

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
  const { page, browser } = ctx;
  const errors = [];
  const missing = [];
  const placeholders = new Set();
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 300));
    if (m.type() === 'warning' && /procedural placeholder/i.test(m.text())) placeholders.add(m.text().slice(0, 160));
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
  const field = () =>
    page.evaluate(() => {
      const st = window.__pyrefly?.battleState?.();
      if (!st) return null;
      const c = (id) => st.combatants[id];
      const girls = ['yuna', 'rikku', 'paine'].map((id) => ({ id, hp: c(id)?.hp, maxHp: c(id)?.stats.maxHp, mp: c(id)?.mp, alive: c(id)?.alive }));
      return { enemies: st.enemyIds.map((id) => ({ id, name: c(id).name, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive })), girls, ticks: st.ticks };
    });
  const partyActions = () => page.evaluate(() => (window.__pyrefly.battleLog?.() ?? []).filter((e) => e.type === 'action-start' && ['yuna', 'rikku', 'paine'].includes(e.actorId)).length);
  const triggersSeen = () => page.evaluate(() => (window.__pyrefly.battleLog?.() ?? []).filter((e) => e.type === 'script-trigger').map((e) => e.name));

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
  const board = await page.evaluate((id) => {
    const cards = [...document.querySelectorAll('.fe-card')];
    return { cards: cards.length, hasCard: !!document.querySelector(`[data-card="${id}"]`), strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
  }, CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter and counts only the listed ones', board.hasCard === false && board.cards >= 18 && new RegExp(`of ${board.cards}`).test(board.strip ?? ''), board);
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
  check('party prep holds after the word (the door took the last letter\'s press)', (await screenNow()) === 'party-prep', await screenNow());
  const prepText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500));
  check('party prep names the chapter', /Youth League/i.test(prepText), prepText.slice(0, 200));
  await shot('1-party-prep');

  // --- prep to the first menu ---------------------------------------------------------------------------------------------------------------
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await screenNow();
  log('after Enter on prep', s);
  if (s === 'cutscene') {
    await shot('2-pre-scene-opening');
    for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
      if (guard === 5) await shot('2-pre-scene-middle');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      s = await screenNow();
    }
  }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  let f = await field();
  log('field.1', f);
  check('act 1 opens with Yaibal and two League Warriors at full HP', f?.enemies.map((e) => e.id).join() === ACTS[0].join() && f.enemies.every((e) => e.hp === e.maxHp), f?.enemies);
  // Under Wait split the first Warrior Attacks can land before the first menu opens (the first run read Yuna 2,389 of 2,488 and Rikku 5,603 of 5,652): the touch run's slower first press read Yuna 2,031: the check is "alive and at least half", not "exactly full" (the opening volley of Yaibal's grenade and two Warriors costs a girl up to a third).
  check('the three girls stand alive and at least half full HP', f?.girls.every((g) => g.alive && g.hp >= g.maxHp * 0.5), f?.girls);
  const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  check('the HUD shows Yaibal\'s name', /Yaibal/.test(bodyText), bodyText.slice(0, 160));
  await shot('3-act-1-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-act-1-menu-clear');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3b-pause');
  // The pause screen is read by eye from the screenshot: the chapter's line, "battle 1 of 7" and the first objective.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- real keys: Attack until a girl has acted twice -----------------------------------------------------------------------------------------
  const startActions = await partyActions();
  for (let round = 0; round < 4 && (await partyActions()) < startActions + 2; round++) {
    const had = await partyActions();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      if ((await partyActions()) > had) break;
    }
  }
  check('real-key Attacks made the girls act', (await partyActions()) >= startActions + 1, { startActions, now: await partyActions() });
  await shot('4-after-key-attacks');

  // --- the seven acts: every fighter's HP written down (a debug write), then the keys carry the fight, the bark and the next act's first menu ---------------------------------------------------
  const barks = [];
  let last = await field();
  for (let act = 0; act < 7; act++) {
    await page.evaluate((fighters) => {
      const st = window.__pyrefly.battleState();
      for (const id of fighters) if (st.combatants[id] && st.combatants[id].hp > 300) st.combatants[id].hp = 300;
    }, ACTS[act]);
    const nextFirst = act < 6 ? ACTS[act + 1][0] : null;
    const t0 = Date.now();
    let arrived = false;
    let sc = null;
    for (let i = 0; Date.now() - t0 < 4 * 60_000; i++) {
      const st = await page.evaluate(() => {
        const b = window.__pyrefly.battleState?.();
        return b ? { enemies: b.enemyIds } : null;
      });
      const seen = await triggersSeen().catch(() => []);
      for (const n of seen) if (!barks.includes(n)) barks.push(n);
      const now = await field();
      if (now && now.enemies.some((e) => e.alive)) last = now;
      if (nextFirst !== null && st && st.enemies.includes(nextFirst)) {
        arrived = true;
        break;
      }
      sc = await screenNow();
      if (sc === 'results') break;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(700);
    }
    log(`act ${act + 1} result`, { arrived, screen: sc, ms: Date.now() - t0 });
    if (act < 6) {
      check(`act ${act + 1} is won by the keys and the bark leads to act ${act + 2}`, arrived, { screen: sc });
      if (!arrived) break;
      await waitBattleMenu(page, 120000);
      await page.waitForTimeout(2500);
      f = await field();
      log(`field.${act + 2}`, f);
      check(`act ${act + 2} opens with its own fighters at full HP`, f?.enemies.map((e) => e.id).join() === ACTS[act + 1].join() && f.enemies.every((e) => e.hp === e.maxHp), f?.enemies);
      // Carried, never restored: a girl who was below her maximum at the end of the last act is still below it now (the keys only press Attack, so no one heals).
      const hurt = last?.girls.filter((g) => g.alive && g.hp < g.maxHp).map((g) => g.id) ?? [];
      const stillHurt = hurt.every((id) => f.girls.find((g) => g.id === id).hp < f.girls.find((g) => g.id === id).maxHp);
      check(`the party entered act ${act + 2} as act ${act + 1} left it (carried, not restored)`, stillHurt, { hurt, now: f?.girls });
      if ([1, 4, 5, 6].includes(act + 1)) {
        await shot(`5-act-${act + 2}-first-menu`);
        await dismissCoach();
        await page.waitForTimeout(600);
        await shot(`5a-act-${act + 2}-menu-clear`);
      }
    }
  }
  check('the six barks fired, one per act that fell, none for Lucil', ids.YL_SEAM_IDS.every((n) => barks.includes(n)), barks);

  // --- the results page and the post scene ---------------------------------------------------------------------------------------------------
  let screen = await screenNow();
  for (let i = 0; i < 80 && screen !== 'results' && screen !== 'cutscene'; i++) {
    await page.waitForTimeout(500);
    screen = await screenNow();
  }
  log('after act 7', screen);
  check('Lucil\'s fall ends the tournament: the results page (or the post scene) follows', screen === 'results' || screen === 'cutscene', screen);
  await page.waitForTimeout(3000);
  await shot('7-results');
  let post = '';
  for (let guard = 0; guard < 80; guard++) {
    const sc2 = await screenNow();
    if (sc2 === 'chapter-select' || sc2 === 'title') break;
    const t = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    if (/chalked clean/i.test(t)) {
      post = t;
      await shot('8-post-scene-close');
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  check('the post scene closes the tournament', /chalked clean|Youth League has had its day/i.test(post), post.slice(0, 200));

  const real404 = missing.filter((m) => !/art\/(characters\/x2-(yaibal|lucil|elma|league-)|pause\/ffx2-youth-league|chapter-ffx2-youth-league)/.test(m));
  log('placeholders', [...placeholders]);
  log('missing', missing);
  check('no console error and no 4xx or 5xx but the paintings that do not exist yet', errors.length === 0 && real404.length === 0, { errors: errors.slice(0, 4), real404: real404.slice(0, 4) });
  await browser.close();
} finally {
  release?.();
}

log('failures', failures);
process.exit(failures.length ? 1 : 0);
