#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Sinspawn Gui chapter (branch `ch-gui`; FFX only): a headless Playwright run, against a dev or preview server that is
 * already up, that plays the chapter by keyboard as far as a person would and then hands the rest to the advisor's line (`autoBattle('intended')`).
 *
 *   PYREFLY_BROWSER=gpu node tools/gui-smoke.mjs [--base http://127.0.0.1:5190/] [--out docs/screenshots/ch-gui] [--tag desk] [--w 1600 --h 900] [--touch]
 *     [--seed 7] [--stop link2|win] [--lose2] [--speed1 fast|skip]
 *
 * It does, in order: title, chapter select (the board has the eighteen cards and no card for the chapter), the typed word (read from
 * `src/app/screens/frontend/mushroomDoor.ts`, never retyped), party prep (and that it HOLDS after the word's last letter, M, which is the board's SELECT key), the
 * pre-battle scene, the first command menu (the four Gui parts on the field, the party, no placeholder figure), one real-key Attack (a party hit lands), then the advisor's line
 * at fast speed. It takes a screenshot at each of: the first menu, the head's warning, the arms down, the arms grown back, the seam into the second fight, the second
 * fight's first menu (Seymour in the line-up, Switch gone), and the results. `--stop link2` leaves the run at the second fight's first menu; `--stop win` plays to the results;
 * `--lose2` instead loses the second fight on purpose (the party only defends), takes RETRY on the defeat panel and checks that the retry opens on the second fight again (the checkpoint), on its first turns, with Seymour fresh.
 * Exit code 1 on a failed check. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-gui'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const STOP = arg('--stop', 'win');
const LOSE2 = flag('--lose2');
const SPEED1 = arg('--speed1', 'fast'); // the first fight's playback speed: 'fast' to see its beats, 'skip' to get through it
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'mushroomDoor.ts')).href);
const WORD = door.MUSHROOM_DOOR_WORD;
const CHAPTER = door.MUSHROOM_DOOR_CHAPTER;

const steps = [];
const failures = [];
const log = (k, v) => {
  steps.push({ k, v });
  console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
};
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

const ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
const { page, browser } = ctx;
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
const shot = async (name) => {
  const p = join(OUT, `${TAG}-${name}.png`);
  await page.screenshot({ path: p });
  log(`shot.${name}`, p);
};
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
/** The battle read: enemies and party with their art keys, the line-up, the live flags and the log's last events. */
const field = () =>
  page.evaluate(() => {
    const p = window.__pyrefly;
    const st = p?.battleState?.();
    if (!st) return null;
    const c = (id) => st.combatants[id];
    return {
      enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive })),
      active: st.activeIds,
      reserve: st.reserveIds,
      hp: Object.fromEntries(st.activeIds.map((id) => [id, c(id).hp])),
      flags: { head: st.flags['gui.headState'], fight: st.flags['gui.fight'] },
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
    await page.keyboard.press('Escape'); // the first-run guide of a fresh profile takes the first key
    await page.waitForTimeout(900);
  }
  const board = await page.evaluate((id) => {
    const cards = [...document.querySelectorAll('.fe-card')];
    return { cards: cards.length, hasCard: !!document.querySelector(`[data-card="${id}"]`), strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
  }, CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter (eighteen cards)', board.hasCard === false && board.cards === 18, board);
  check('"of 18 beaten" stays the eighteen', /of 18/.test(board.strip ?? ''), board.strip);
  await page.waitForTimeout(1000);
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
  await page.waitForTimeout(1500); // party prep waits for Enter: a SELECT left over from the word's M would have moved on by now
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
  check('the four Gui parts stand on the field', ['sinspawn-gui', 'sinspawn-gui-head', 'sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'].every((id) => f1?.enemies.some((e) => e.id === id)), f1?.enemies);
  check('three of the six open; three wait on the bench', f1?.active.length === 3 && f1?.reserve.length === 3, f1);
  await shot('3-first-menu');

  // --- one real-key Attack ------------------------------------------------------------------------------------------------------------------
  const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter'); // a first-time coaching card takes the first Enter; dismiss each before the command
    await page.waitForTimeout(700);
  }
  const before = await page.evaluate(() => window.__pyrefly.battleLog().length);
  await page.keyboard.press('Enter'); // Attack is the top row
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); // the target the cursor opens on
  await page.waitForTimeout(3500);
  const swung = await page.evaluate((n) => window.__pyrefly.battleLog().slice(n).some((e) => e.type === 'action-start' && ['tidus', 'auron', 'lulu'].includes(e.actorId)), before);
  check('a real-key Attack was taken', swung, before);
  await shot('4-after-attack');

  // --- the advisor's line, fast, with a screenshot at each beat -----------------------------------------------------------------------------
  await page.evaluate((speed) => {
    window.__pyrefly.setBattleSpeed(speed);
    window.__pyrefly.autoBattle('intended');
  }, SPEED1);
  const seen = new Set();
  const want = {
    head: { name: '5-head-warning', test: (st) => st.flags['gui.headState'] === 3 },
    armsDown: { name: '6-arms-down', test: (st) => ['sinspawn-gui-arm-left', 'sinspawn-gui-arm-right'].every((id) => !st.combatants[id].alive) },
    regrown: { name: '7-arms-regrown', test: (st) => st.log.some((e) => e.type === 'message' && /grow back/.test(e.text)) },
  };
  let link2 = false;
  let seamShots = 0;
  const t0 = Date.now();
  for (let i = 0; Date.now() - t0 < 25 * 60_000; i++) {
    const sc = await screenNow();
    if (sc === 'results' || sc === 'cutscene') break;
    const probe = await page.evaluate((tests) => {
      const st = window.__pyrefly.battleState?.();
      if (!st) return { none: true };
      const hits = {};
      for (const [k, src] of Object.entries(tests)) hits[k] = !!new Function('st', `return (${src})(st)`)(st);
      return { enemies: st.enemyIds, hits };
    }, Object.fromEntries(Object.entries(want).map(([k, v]) => [k, v.test.toString()])));
    // The seam is a mid-battle beat: the battle root carries `battle-midbeat` while it plays. One shot at its start and one a few seconds in (the white-out and the second line).
    if (seamShots < 2 && (await page.evaluate(() => !!document.querySelector('.battle-midbeat'))) && (await page.evaluate(() => window.__pyrefly.battleState?.()?.combatants?.['sinspawn-gui']?.alive === false))) {
      await shot(`seam-${seamShots + 1}`);
      seamShots++;
      await page.waitForTimeout(3500);
    }
    if (!probe.none) {
      for (const [k, hit] of Object.entries(probe.hits)) {
        if (hit && !seen.has(k)) {
          seen.add(k);
          await shot(want[k].name);
        }
      }
      if (probe.enemies.includes('sinspawn-gui-2')) {
        // The second fight has begun: stop the advisor before its first decision so the first menu is a person's, and play it at a pace one can see.
        await page.evaluate(() => {
          window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null);
          window.__pyrefly.setBattleSpeed('normal');
        });
        link2 = true;
        break;
      }
    }
    await page.waitForTimeout(200);
  }
  check('the first fight was won and the second began', link2, [...seen]);
  if (link2) {
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(1500);
    const f2 = await field();
    log('field.2', f2);
    check('the guest hour opens on Yuna, Seymour and Auron with no bench', JSON.stringify([...f2.active].sort()) === JSON.stringify(['auron', 'seymour', 'yuna']) && f2.reserve.length === 0, f2);
    await shot('8-second-fight-first-menu');
    if (LOSE2) {
      await page.evaluate(() => {
        window.__pyrefly.setBattleSpeed('skip');
        window.__pyrefly.autoBattle('defend');
      });
      await waitFor('the defeat panel', async () => (await screenNow()) === 'results', { ms: 6 * 60_000, pollMs: 500 });
      const panel = await page.evaluate(() => document.body.innerText);
      check('the second fight can be lost: the defeat panel offers RETRY', /retry/i.test(panel), panel.slice(0, 160));
      await page.waitForTimeout(1500);
      await shot('11-defeat');
      await page.keyboard.press('Enter'); // RETRY is the panel's default
      await page.waitForTimeout(1500);
      await assertScreen(page, 'battle', 120000);
      await waitBattleMenu(page, 120000);
      await page.waitForTimeout(2000);
      const f3 = await field();
      log('field.3', f3);
      check('the retry opens on the second fight, not the first', f3.enemies.some((e) => e.id === 'sinspawn-gui-2') && f3.flags.fight === 2, f3);
      check('the retry opens with Yuna, Seymour and Auron and no bench', JSON.stringify([...f3.active].sort()) === JSON.stringify(['auron', 'seymour', 'yuna']) && f3.reserve.length === 0, f3);
      check('the retry opens the second fight afresh: its first turns, Seymour back at his full 1,200 (he joins fresh), the party on the HP it carried in (Yuna, who was not hurt, at hers)', f3.turn <= 2 && f3.hp.seymour === 1200 && f3.hp.yuna === 775, f3);
      await shot('12-retry-first-menu');
    }
    if (STOP === 'win' && !LOSE2) {
      await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
      // The post scene (a cutscene) comes first and waits on the player; then the results.
      await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 15 * 60_000, pollMs: 500 }).catch(() => null);
      let end = await screenNow();
      check('the second fight is won and the chapter reaches its post scene', end === 'results' || end === 'cutscene', end);
      if (end === 'cutscene') {
        await page.waitForTimeout(1500);
        await shot('9-post-scene');
        for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 260; guard++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(350);
        }
        await waitFor('results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
        end = await screenNow();
      }
      check('the chapter reaches its results', end === 'results', end);
      await page.waitForTimeout(7000); // the counters count up; the shot is of the totals
      if ((await screenNow()) === 'results') await shot('10-results');
    }
  }
} catch (e) {
  failures.push('exception');
  log('FAILED', String(e).slice(0, 500));
  await shot('failed').catch(() => {});
} finally {
  log('page errors', errors.slice(0, 10));
  log('missing art', ctx.notFound.slice(0, 20));
  writeFileSync(join(OUT, `${TAG}-steps.json`), JSON.stringify({ steps, failures, errors: errors.slice(0, 20) }, null, 1));
  await browser.close();
}
console.log(failures.length ? `FAILED: ${failures.join('; ')}` : 'ALL CHECKS PASSED');
process.exit(failures.length ? 1 : 0);
