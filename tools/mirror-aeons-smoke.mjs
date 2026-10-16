#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Mirror Aeons chapter (branch `ch-mirror-aeons`; FFX only): a headless Playwright run, against a dev or preview server that is already up, that opens the chapter by its
 * typed word, looks at party prep, plays the pre scene by keyboard, takes the first menu of Act I (the Dark Magus Sisters on Mushroom Rock Road), then hands the rest to the advisor's line
 * (`autoBattle('intended')`) and stops at the first menu of Act II (Dark Yojimbo in the Cavern of the Stolen Fayth) or plays to the results.
 *
 *   PYREFLY_BROWSER=gpu node tools/mirror-aeons-smoke.mjs [--base http://127.0.0.1:5541/] [--out docs/screenshots/ch-mirror-aeons] [--tag desk] [--w 1600 --h 900] [--touch]
 *     [--seed 7] [--stop link2|win] [--seam]
 *
 * It does, in order: title, chapter select (the board has the eighteen cards and no card for the chapter), the typed word (read from `src/app/screens/frontend/yojimboDoor.ts`, never retyped), party prep (and
 * that it HOLDS after the word's last letter), the pre scene, the first command menu (the pair on the field, the party, no placeholder figure), the advisor's line at skip speed with a screenshot at the
 * seam (the sisters' fall, the white-out) and at Act II's first menu (Dark Yojimbo and the cavern's plate), and, with `--stop win`, the post scene and the results. Exit code 1 on a failed check.
 * `--seam` leaves each sister at 1 HP before the advisor starts and plays Act I at normal speed, so the seam (the sisters' fall, the white-out, the plate swap) is on screen and is photographed.
 * Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. NOTE: until the reverse-engineering session's Dark AI lands, the enemies play the engine's fallback
 * (a plain Attack), so a win here says nothing about difficulty.
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

const BASE = arg('--base', 'http://127.0.0.1:5541/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-mirror-aeons'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const STOP = arg('--stop', 'link2');
const SEAM = flag('--seam');
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'yojimboDoor.ts')).href);
const WORD = door.YOJIMBO_DOOR_WORD;
const CHAPTER = door.YOJIMBO_DOOR_CHAPTER;
const SISTERS = ['dark-mindy', 'dark-sandy']; // Act I is the faithful pair `kino01_72` (MIRROR_ACT_I): Cindy is not in it

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

const ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
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
/** A first-time coaching card takes the first Enter: dismiss each before the advisor is handed the fight. */
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
      enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, gauge: c(id).overdrive?.gauge ?? null })),
      active: st.activeIds,
      reserve: st.reserveIds,
      aeons: Object.keys(st.combatants).filter((id) => st.combatants[id].side === 'aeon'),
      flags: st.flags,
      turn: st.turn,
    };
  });

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
  const board = await page.evaluate((id) => {
    const cards = [...document.querySelectorAll('.fe-card')];
    return { cards: cards.length, hasCard: !!document.querySelector(`[data-card="${id}"]`), strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
  }, CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter (eighteen cards)', board.hasCard === false && board.cards === 18, board);
  check('"of 18 beaten" stays the eighteen', /of 18/.test(board.strip ?? ''), board.strip);
  await page.waitForTimeout(800);
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
    await shot('2-pre-scene-opening');
    for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
      if (guard === 6) await shot('2-pre-scene-sisters');
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
  check('the two sisters stand on the field, every gauge at 0', f1?.enemies.length === SISTERS.length && SISTERS.every((id) => f1?.enemies.some((e) => e.id === id && e.gauge === 0)), f1?.enemies);
  check('Tidus, Yuna and Lulu open; Auron, Wakka, Kimahri and Rikku wait on the bench', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'lulu']) && f1.reserve.length === 4, f1);
  await shot('3-act-i-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-act-i-menu-clear'); // the same menu with the first-time card gone: the whole stage
  // The pause screen's chapter tab: the hero art (not made yet) falls back to Yuna's portrait.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3b-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- the advisor's line, at skip speed: the seam, then Act II's first menu ------------------------------------------------------------------
  await page.evaluate((seam) => {
    if (seam) for (const id of ['dark-mindy', 'dark-sandy']) { const c = window.__pyrefly.battleState().combatants[id]; c.hp = 1; } // a short Act I, to watch the seam
    window.__pyrefly.setBattleSpeed(seam ? 'normal' : 'skip');
    window.__pyrefly.autoBattle('intended');
  }, SEAM);
  let seamShots = 0;
  let link2 = false;
  const t0 = Date.now();
  for (let i = 0; Date.now() - t0 < 25 * 60_000; i++) {
    const sc = await screenNow();
    if (sc === 'results' || sc === 'cutscene') break;
    const probe = await page.evaluate(() => {
      const st = window.__pyrefly.battleState?.();
      if (!st) return { none: true };
      return { enemies: st.enemyIds, sistersDown: ['dark-mindy', 'dark-sandy'].every((id) => st.combatants[id] && !st.combatants[id].alive) };
    });
    if (!probe.none) {
      if (SEAM && seamShots < 5 && probe.sistersDown) {
        // The sisters are down: the seam is playing (or about to). Photograph it a few times, a moment apart, until Act II's formation takes the field.
        await shot(`4-seam-${seamShots + 1}`);
        seamShots++;
        await page.waitForTimeout(2200);
        continue;
      }
      if (probe.enemies.includes('dark-yojimbo')) {
        await page.evaluate(() => {
          window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null); // stop the advisor before its first decision so the first menu is a person's
          window.__pyrefly.setBattleSpeed('normal');
        });
        link2 = true;
        break;
      }
    }
    await page.waitForTimeout(200);
  }
  check('Act I was won and Act II began', link2, { seamShots });
  if (link2) {
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2500);
    const f2 = await field();
    log('field.2', f2);
    check('Act II holds Dark Yojimbo and his dog', f2.enemies.map((e) => e.id).join() === 'dark-yojimbo,dark-daigoro', f2.enemies);
    check('the party carries over: the same three on the field, the bench unchanged', JSON.stringify([...f2.active]) === JSON.stringify(['tidus', 'yuna', 'lulu']), f2.active);
    await shot('5-act-ii-first-menu');
    if (STOP === 'win') {
      await dismissCoach();
      await page.evaluate(() => {
        window.__pyrefly.setBattleSpeed('skip');
        window.__pyrefly.autoBattle('intended');
      });
      await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 15 * 60_000, pollMs: 500 }).catch(() => null);
      let end = await screenNow();
      check('Act II is won and the chapter reaches its post scene', end === 'results' || end === 'cutscene', end);
      if (end === 'cutscene') {
        await page.waitForTimeout(1500);
        await shot('6-post-scene');
        for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 260; guard++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(350);
        }
        await waitFor('results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
        end = await screenNow();
      }
      check('the chapter reaches its results', end === 'results', end);
      await page.waitForTimeout(7000);
      if ((await screenNow()) === 'results') await shot('7-results');
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

check('no console errors', errors.length === 0, errors.slice(0, 5));
check('no 4xx or 5xx responses', missing.length === 0, missing.slice(0, 5));
await browser.close();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
