#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Bevelle Guardians chapter (branch `ch-bevelle-guardians`; FFX-2 only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word
 * (`drillshot`), looks at party prep, plays the pre scene by keyboard, takes the first menu (Georapella in the Bevelle Underground), and plays the first fight to its result with REAL KEYS: Enter takes the first row of
 * the menu, Enter takes the target, Enter confirms it, for every girl, until Georapella falls; the seam then plays and the chain opens act 2 (the Precepts Guard) with the party whole.
 *
 *   PYREFLY_BROWSER=gpu node tools/bevelle-guardians-smoke.mjs [--base http://127.0.0.1:5237/] [--out docs/screenshots/ch-bevelle-guardians] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7]
 *
 * Nothing is edited in the battle state: the fight is played as it comes (Georapella only casts, about 100 to 215 a girl a spell). It takes the machine-wide browser lock (`tools/rig-record-lock.mjs`) before it opens a
 * browser and gives it back at the end. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. Exit code 1 on a failed check. The two guardians have no painting yet, so
 * the presenter's placeholder draws them: the 404s for their missing art files are expected and listed, any other 4xx or 5xx fails.
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

const BASE = arg('--base', 'http://127.0.0.1:5237/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-bevelle-guardians'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-bevelle-guardians smoke (' + TAG + ')', { maxMinutes: 12, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'drillshotDoor.ts')).href);
const WORD = door.DRILLSHOT_DOOR_WORD;
const CHAPTER = door.DRILLSHOT_DOOR_CHAPTER;
const GIRLS = ['yuna', 'rikku', 'paine'];

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
const warnings = [];
const missing = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
  if (m.type() === 'warning') warnings.push(m.text().slice(0, 200));
});
page.on('response', (r) => {
  if (r.status() >= 400) missing.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 160)}`);
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
      enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive, sprite: c(id).spriteKey })),
      party: st.activeIds.map((id) => ({ id, hp: c(id).hp, maxHp: c(id).stats.maxHp, mp: c(id).mp, alive: c(id).alive, statuses: Object.keys(c(id).statuses) })),
      turn: st.turn,
      log: st.log.length,
    };
  });
const battleLog = () =>
  page.evaluate(() => (window.__pyrefly?.battleLog?.() ?? []).map((e) => ({ type: e.type, actor: e.actorId, target: e.targetId, source: e.sourceId, ability: e.abilityId, amount: e.amount, name: e.name })));

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
  const board = await page.evaluate((id) => ({ cards: document.querySelectorAll('.fe-card').length, hasCard: !!document.querySelector(`[data-card="${id}"]`), exp: /\bEXP\b/.test(document.body.innerText) }), CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter and no EXP numeral', board.hasCard === false && board.exp === false, board);
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
  check('party prep holds after the word (the last letter T is bound to nothing, so it cannot start the fight)', (await screenNow()) === 'party-prep', await screenNow());
  const prep = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 900));
  log('prep.text', prep);
  check('party prep names the chapter and its tip', /Bevelle Guardians/i.test(prep) && /Drill Shot/i.test(prep), prep.slice(0, 300));
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
  check('Georapella stands alone on the field', JSON.stringify(f1?.enemies.map((e) => e.id)) === JSON.stringify(['x2-georapella']), f1?.enemies.map((e) => e.id));
  check('Yuna, Rikku and Paine open', JSON.stringify(f1?.party.map((p) => p.id)) === JSON.stringify(GIRLS), f1?.party.map((p) => p.id));
  check('Georapella starts at 4,420 HP', f1?.enemies[0]?.hp === 4420, f1?.enemies[0]);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');

  // --- the first fight, by real keys ---------------------------------------------------------------------------------------------------------
  const partyActions = async () => (await battleLog()).filter((e) => e.type === 'action-start' && GIRLS.includes(e.actor)).map((e) => ({ actor: e.actor, ability: e.ability }));
  const acted = [];
  let shotMid = false;
  let georapellaDown = false;
  let act1Log = []; // the engine's log of act 1: the log is per link, so it is kept here while Georapella is the enemy (the next link starts a fresh one)
  for (let round = 0; round < 80 && !georapellaDown; round++) {
    const sNow = await screenNow();
    if (sNow !== 'battle') break;
    const had = (await partyActions()).length;
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      if ((await partyActions()).length > had) break;
    }
    const now = await partyActions();
    if (now.length > had) acted.push(now.at(-1));
    const lg = await battleLog();
    if (lg.length >= act1Log.length && lg.some((e) => e.type === 'action-start' && e.actor === 'x2-georapella' || e.type === 'turn-start')) act1Log = lg;
    if (!shotMid && lg.some((e) => e.type === 'action-start' && e.actor === 'x2-georapella')) {
      await page.waitForTimeout(500);
      await shot('4-first-ga');
      shotMid = true;
    }
    georapellaDown = lg.some((e) => e.type === 'ko' && e.target === 'x2-georapella');
    await page.waitForTimeout(1200);
    await waitBattleMenu(page, 30000).catch(() => null);
  }
  log('actions', { count: acted.length, byActor: GIRLS.map((g) => [g, acted.filter((a) => a.actor === g).length]) });
  check('every girl acted by real keys', GIRLS.every((g) => acted.some((a) => a.actor === g)), acted.slice(0, 12));
  // The seam plays at her fall, before the next link opens: follow the log until the link changes, keeping the fullest one (the seam's script-trigger is in it).
  for (let i = 0; i < 160; i++) {
    const lg = await battleLog();
    if (lg.some((e) => e.type === 'ko' && e.target === 'x2-georapella') && lg.length >= act1Log.length) act1Log = lg;
    const en = ((await field())?.enemies ?? []).map((e) => e.id);
    if (!en.includes('x2-georapella')) break;
    await page.waitForTimeout(250);
  }
  const lgAll = act1Log;
  const gaCasts = lgAll.filter((e) => e.type === 'action-start' && e.actor === 'x2-georapella').map((e) => e.ability);
  log('georapella.casts', gaCasts);
  check('Georapella cast only Ga spells, in a ring', gaCasts.length >= 3 && gaCasts.every((a) => /^x2-georapella-(thundaga|waterga|firaga|blizzaga)$/.test(String(a))), gaCasts);
  const ring = ['x2-georapella-thundaga', 'x2-georapella-waterga', 'x2-georapella-firaga', 'x2-georapella-blizzaga'];
  check('the ring goes round in order', gaCasts.every((a, i) => i === 0 || ring.indexOf(a) === (ring.indexOf(gaCasts[i - 1]) + 1) % 4), gaCasts);
  check('Georapella fell to the party\'s real keys', georapellaDown, await field());

  // --- the seam and the chain ----------------------------------------------------------------------------------------------------------------
  await page.waitForTimeout(1500);
  await shot('5-georapella-down');
  await waitFor('the Precepts Guard on the field', async () => ((await field())?.enemies ?? []).some((e) => e.id === 'x2-precepts-guard'), { ms: 90_000, pollMs: 700 }).catch(() => null);
  const f2 = await field();
  log('field.2', f2);
  check('the seam played and the chain opened act 2: the Precepts Guard stands on the field', f2?.enemies.some((e) => e.id === 'x2-precepts-guard') === true, f2?.enemies);
  check('the party opens act 2 whole (the corridor mended it)', f2?.party.every((p) => p.alive && p.hp === p.maxHp), f2?.party);
  const seams = act1Log.filter((e) => e.type === 'script-trigger').map((e) => e.name);
  log('script-triggers', seams);
  check('the seam fired once (georapella-fallen)', seams.filter((n) => n === 'georapella-fallen').length === 1, seams);
  await waitBattleMenu(page, 60000).catch(() => null);
  await page.waitForTimeout(1200);
  await shot('6-act-2-first-menu');
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 600));
  try {
    await shot('zz-failure');
  } catch {
    /* the page may be gone */
  }
}

const expected = (m) => /\/art\/characters\/x2-(georapella|precepts-guard)\//.test(m);
const unexpected = missing.filter((m) => !expected(m));
log('missing.art (expected: the two guardians have no painting yet)', missing.filter(expected));
log('console.warnings.sample', warnings.slice(0, 6));
check('no console errors', errors.length === 0, errors.slice(0, 8));
check('no 4xx or 5xx responses besides the two unpainted guardians\' art files', unexpected.length === 0, unexpected.slice(0, 8));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
