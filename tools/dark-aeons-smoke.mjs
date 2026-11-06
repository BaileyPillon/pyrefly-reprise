#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Dark Aeons chapter (branch `ch-dark-aeons`; FFX only): a headless Playwright run, against a dev or preview server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes). It opens the chapter by its typed word, looks at party
 * prep, plays the pre scene by keyboard, takes the first menu of link 1 (Dark Valefor on the road, the plate the scene starts on), plays turns with the real keys (Enter on Attack, Enter on the one target) and watches the
 * Overdrive gauge take its hit events, then hands the rest to the advisor's line (`autoBattle('intended')`) and stops at the first menu of link 2 (Dark Ifrit, the seam played, the desert's plate).
 *
 *   PYREFLY_BROWSER=gpu node tools/dark-aeons-smoke.mjs [--base http://127.0.0.1:5197/] [--out docs/screenshots/ch-dark-aeons] [--tag desk] [--w 1600 --h 900] [--touch]
 *     [--seed 7] [--stop link2|win] [--quick]
 *
 * `--stop link2` (default) ends at link 2's first menu: link 1 played to its result and the seam. `--stop win` carries on to the results through all seven links; **`--quick` leaves each foe at 5,000 HP at its first menu**
 * (a debug write to the battle state, as the Mirror smoke's `--seam` does) so the whole chain plays in minutes and each link's plate is photographed at its first menu. A quick run says nothing about difficulty.
 * Exit code 1 on a failed check. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. **The six Dark paintings do not exist yet**: the presenter draws its procedural
 * placeholder for each foe (one console WARNING per missing key, not an error) and the sidecar and painting files of `characters/dark-*` and `portraits/dark-*`, and the pause hero `pause/ch34-dark-aeons`, answer 404; those are the only 404s the run accepts.
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

const BASE = arg('--base', 'http://127.0.0.1:5197/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-dark-aeons'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const STOP = arg('--stop', 'link2');
const QUICK = flag('--quick');
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'darkaeonDoor.ts')).href);
const ids = await import(pathToFileURL(join(REPO, 'src', 'data', 'ffx', 'dark-aeons-six-ids.ts')).href);
const WORD = door.DARKAEON_DOOR_WORD;
const CHAPTER = door.DARKAEON_DOOR_CHAPTER;
const LINKS = ids.DARK_SIX_LINKS.map((l) => ({ key: l.key, body: l.bodyId, plate: l.plate }));

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

const release = await takeRigRecord(`ch-dark-aeons smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
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
      return {
        enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive, gauge: c(id).overdrive?.gauge ?? null })),
        active: st.activeIds,
        reserve: st.reserveIds,
        flags: st.flags,
        turn: st.turn,
      };
    });
  const shrink = (hp) =>
    page.evaluate((to) => {
      const st = window.__pyrefly?.battleState?.();
      if (!st) return;
      for (const id of st.enemyIds) if (st.combatants[id].hp > to) st.combatants[id].hp = to;
    }, hp);

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
      if (guard === 5) await shot('2-pre-scene-middle');
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
  check('Dark Valefor stands alone, gauge 0, full HP', f1?.enemies.length === 1 && f1.enemies[0].id === 'dark-valefor' && f1.enemies[0].gauge === 0 && f1.enemies[0].hp === 800_000, f1?.enemies);
  check('Tidus, Yuna and Auron open; Lulu, Wakka, Kimahri and Rikku wait on the bench', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'auron']) && f1.reserve.length === 4, f1);
  await shot('3-link-1-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-link-1-menu-clear');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3b-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- real keys: Attack on the foe, twice; the gauge takes a hit event each --------------------------------------------------------------------
  let lastGauge = (await field()).enemies[0].gauge;
  let gains = 0;
  for (let turn = 0; turn < 2; turn++) {
    await waitBattleMenu(page, 60000);
    await page.keyboard.press('Enter'); // Attack
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter'); // the one target
    await page.waitForTimeout(2500);
    const f = await field();
    if (f.enemies[0].gauge > lastGauge) gains++;
    lastGauge = f.enemies[0].gauge;
    log('after the key attack', { turn, gauge: f.enemies[0].gauge, hp: f.enemies[0].hp });
  }
  check('real-key Attacks fill the gauge (a hit event each: +15 on Dark Valefor)', gains >= 1 && lastGauge >= 15, { gains, lastGauge });
  await shot('3c-after-two-key-attacks');

  // --- the advisor's line at skip speed: link 1 to its result, the seam, then each next link's first menu -----------------------------------------
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('skip');
    window.__pyrefly.autoBattle('intended');
  });
  const seen = new Set(['dark-valefor']);
  let reached = 1;
  const t0 = Date.now();
  const lastLink = STOP === 'win' ? LINKS.length : 2;
  for (let i = 0; Date.now() - t0 < 8.5 * 60_000 && reached < lastLink; i++) {
    const sc = await screenNow();
    if (sc === 'results' || sc === 'cutscene') {
      await page.waitForTimeout(300);
      if (sc === 'results') break;
    }
    const probe = await page.evaluate(() => {
      const st = window.__pyrefly.battleState?.();
      return st ? { enemies: st.enemyIds } : { none: true };
    });
    if (!probe.none) {
      const body = LINKS.find((l, idx) => idx + 1 > reached && probe.enemies.includes(l.body) && !seen.has(l.body + idx));
      if (body !== undefined) {
        const idx = LINKS.indexOf(body);
        seen.add(body.body + idx);
        reached = idx + 1;
        await page.evaluate(() => window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null)); // stop the advisor before its first decision so the first menu is a person's
        await page.evaluate(() => window.__pyrefly.setBattleSpeed('normal'));
        await waitBattleMenu(page, 120000);
        await page.waitForTimeout(2500);
        const f = await field();
        log(`field.link${reached}`, f);
        // The advisor's line may already have taken one action before it was stopped (the foe's gauge then reads a hit's worth and its counter may have hurt one member), so the check is the foe and its place, not an untouched bar.
        check(`link ${reached}: ${body.body} stands alone and alive, the three of the party standing`, f.enemies.length === 1 && f.enemies[0].id === body.body && f.enemies[0].alive && f.enemies[0].gauge <= 20 && JSON.stringify([...f.active]) === JSON.stringify(['tidus', 'yuna', 'auron']), f);
        await shot(`4-link-${reached}-${body.key}-first-menu`);
        if (reached < lastLink) {
          if (QUICK) await shrink(5_000);
          await page.evaluate(() => {
            window.__pyrefly.setBattleSpeed('skip');
            window.__pyrefly.autoBattle('intended');
          });
        }
      }
    }
    await page.waitForTimeout(250);
  }
  check(`the chain reached link ${lastLink}`, reached >= lastLink, { reached });

  if (STOP === 'win' && reached >= LINKS.length) {
    await dismissCoach();
    if (QUICK) await shrink(5_000);
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('skip');
      window.__pyrefly.autoBattle('intended');
    });
    await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 4 * 60_000, pollMs: 500 }).catch(() => null);
    let end = await screenNow();
    check('the last link is won and the chapter reaches its post scene', end === 'results' || end === 'cutscene', end);
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

  const unexpected404 = missing.filter((m) => !/characters\/dark-|portraits\/dark-|pause\/ch34-dark-aeons/.test(m));
  log('placeholders', [...placeholders]);
  check('no console errors', errors.length === 0, errors.slice(0, 5));
  check('no 4xx or 5xx responses but the Dark paintings (not made yet)', unexpected404.length === 0, unexpected404.slice(0, 8));
  log('missing.dark-art', missing.filter((m) => /characters\/dark-|portraits\/dark-|pause\/ch34-dark-aeons/.test(m)).length);
  await browser.close();
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 600));
  try {
    await ctx?.page.screenshot({ path: join(OUT, `${TAG}-zz-failure.jpg`), type: 'jpeg', quality: 85 });
  } catch {
    /* the page may be gone */
  }
  try {
    await ctx?.browser.close();
  } catch {
    /* gone */
  }
} finally {
  release();
}
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
