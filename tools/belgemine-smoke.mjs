#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Belgemine's Challenge chapter (branch `ch-belgemine`; FFX only): a headless Playwright run, against a dev or preview server that is already up, that opens the chapter by its typed
 * word (`sidequest`), looks at party prep, plays the pre scene by keyboard, takes the first menu (Yuna alone against Valefor and Belgemine on the Remiem stand-in court), opens the Summon list, and reads what the engine and
 * the page say. Nothing else: the chain itself is run on the real engine by `tests/unit/chapters/belgemine-engine.test.ts` and the bench.
 *
 *   PYREFLY_BROWSER=gpu node tools/belgemine-smoke.mjs [--base http://127.0.0.1:5190/] [--out docs/screenshots/ch-belgemine] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7]
 *
 * It takes the review-browser lock (`tools/rig-record-lock.mjs`) before it opens a browser and gives it back at the end. Headless only; never the Chrome extension or the built-in pane. Exit code 1 on a failed check.
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

const BASE = arg('--base', 'http://127.0.0.1:5190/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-belgemine'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-belgemine smoke (desk)', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const WORD = 'sidequest';
const CHAPTER = 'belgemine';

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
const field = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (id) => st.combatants[id];
    return {
      enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, sprite: c(id).spriteKey })),
      active: st.activeIds,
      flags: Object.keys(st.flags).filter((k) => k.startsWith('belgemine.') || k.startsWith('aeonDuel')),
    };
  });

try {
  // --- title and the board ----------------------------------------------------------------------------------------------------------------
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

  // --- the typed word ---------------------------------------------------------------------------------------------------------------------
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

  // --- prep to the first menu -------------------------------------------------------------------------------------------------------------
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
  check('Belgemine and Valefor stand on the field', JSON.stringify(f1?.enemies.map((e) => e.id)) === JSON.stringify(['belgemine', 'belg-valefor']), f1?.enemies.map((e) => e.id));
  check('Yuna alone opens', JSON.stringify(f1?.active) === JSON.stringify(['yuna']), f1?.active);
  check('the duel flags are up', (f1?.flags ?? []).length > 0, f1?.flags);
  await dismissCoach();
  await shot('3-first-menu');
  const text = await page.evaluate(() => document.body.innerText);
  check('the menu names Summon', /summon/i.test(text), text.slice(0, 200));
  // The formation scripts call setDefendingEnabled(0) (`lmyt01_0n`): the battle carries the flag and the HUD draws no Defend tab.
  const defendState = await page.evaluate(() => ({
    flag: window.__pyrefly?.battleState?.()?.flags?.['formation.defendOff'] ?? null,
    counterFlag: window.__pyrefly?.battleState?.()?.flags?.['formation.counterOff'] ?? null,
    tabs: document.querySelectorAll('.ffx-cmd-defend:not([hidden])').length, // the tab always exists; it is hidden while no Defend command is offered
    tabsInDom: document.querySelectorAll('.ffx-cmd-defend').length,
  }));
  log('defend.state', defendState);
  check('Defend is off: the flag is up and no Defend tab is drawn', defendState.flag === true && defendState.counterFlag === true && defendState.tabs === 0, defendState);

  // --- the Summon list (real keys): the cursor starts on Special, whose rows are greyed; three Downs reach Summon (the greyed rows are skipped) ----------
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  const list = await page.evaluate(() => document.body.innerText);
  check('the Summon list opens on Ifrit, the first aeon Yuna may call (Valefor, the one Belgemine holds, is dimmed above it)', /VALEFOR\s+IFRIT\s+IXION[\s\S]*Calls Ifrit/.test(list), list.slice(0, 400));
  await shot('4-summon-list');
  check('no page errors', errors.length === 0, errors.slice(0, 4));
  check('no 4xx on the page', missing.filter((m) => !/favicon/.test(m)).length === 0, missing.slice(0, 6));
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('error', String(e).slice(0, 600));
  try {
    await shot('error');
  } catch {
    /* the page may be gone */
  }
} finally {
  await browser.close().catch(() => undefined);
  release();
}
log('failures', failures);
process.exit(failures.length === 0 ? 0 : 1);
