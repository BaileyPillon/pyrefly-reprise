#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Gauntlet chapter (branch `ch-gauntlet`; FFX only): a headless Playwright run, against a dev server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes). It opens the chapter by its typed word, looks at party prep, plays the pre scene by keyboard,
 * takes the first menu (the Cactuar King at 100,000 HP against Tidus, Yuna and Auron on the Dome stand-in plate) and plays ACT 1 with the real keys to a result, or for four minutes: the plain Attack of whoever's turn it is
 * (Enter on the Attack row, Enter on the King, the only foe). **One debug-API call, and only one:** `window.__pyrefly.setSeed(seed)` (the `--seed` flag) fixes the battle's random seed on party prep, before the first
 * key of the fight, so a run can be repeated; nothing else is written through the debug API, and every key after it is a real key. When the King falls the seam script plays (hands off) and the run waits for ACT 2's
 * first menu (Don Tonberry) and looks at it.
 *
 * PREDICTION (written before the first run, `docs/handoff/ch-gauntlet.md` stage 5): the board shows no card for the chapter; the word opens party prep; the pre scene is nine lines; the first menu shows the Cactuar King
 * at 100,000 and the three standing, with Escape and Flee drawn but shut; a plain Attack takes tens of thousands off the King (its Evasion is 240, so a few swings miss) and is answered with 10,000 Needles on one of
 * the party (a member falls, Auto-Phoenix stands it up at once); the King falls in a handful of swings (200 of 200 careless seeds win act 1), the seam plays and act 2 opens on Don Tonberry at 480,000 with the party whole;
 * the King may instead run away on the third rest roll (rare: the card then reads WITHDREW and "The Cactuar King got away!"); no console error, and no 404 but the paintings the art lane still owes (the pause plate
 * `pause/ch54-gauntlet` and the thumbnail), since every act draws an existing painting on the Dome plate.
 *
 *   PYREFLY_BROWSER=gpu node tools/gauntlet-smoke.mjs [--base http://127.0.0.1:5541/] [--out docs/screenshots/ch-gauntlet] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--wait-min 30] [--max-min 4]
 *
 * Exit code 1 on a failed check, 2 when the lock was not free inside `--wait-min` (nothing was run). Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane.
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-gauntlet'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const WAIT_MIN = Number(arg('--wait-min', '30'));
const MAX_MS = Number(arg('--max-min', '4')) * 60000;
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'gauntletDoor.ts')).href);
const WORD = door.GAUNTLET_DOOR_WORD;
const CHAPTER = door.GAUNTLET_DOOR_CHAPTER;
const MISSING_ART = /pause\/ch54-gauntlet|chapter-gauntlet|monster-arena/;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

// The lock: wait in the line for at most `--wait-min` minutes, then give the line up and run nothing.
const waiting = takeRigRecord(`ch-gauntlet smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
const outcome = await Promise.race([waiting.then((r) => ({ release: r })), new Promise((r) => setTimeout(() => r({ timeout: true }), WAIT_MIN * 60000))]);
if (outcome.timeout) {
  console.log(`NOLOCK: the review-browser lock was not free inside ${WAIT_MIN} minutes; nothing was run`);
  waiting.then((release) => release()).catch(() => undefined); // if the line reaches us later, give the lock straight back
  setTimeout(() => process.exit(2), 1500);
} else {
  await run(outcome.release);
}

async function run(release) {
  let ctx;
  const started = Date.now();
  try {
    ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
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
        const bosses = ['cactuar-king', 'don-tonberry'].filter((id) => st.combatants[id] !== undefined);
        const c = (id) => st.combatants[id];
        return {
          bosses: bosses.map((id) => ({ id, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive })),
          party: st.activeIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive })),
          turn: st.turn,
          ticks: st.ticks,
          needles: st.log.filter((e) => e.type === 'action-start' && e.abilityId?.startsWith('gauntlet-') && /needles/.test(e.abilityId)).length,
          counters: st.log.filter((e) => e.type === 'counter' && e.actorId === 'cactuar-king').length,
          messages: st.log.filter((e) => e.type === 'message' && e.kind === 'system').map((e) => e.text).slice(-4),
        };
      });
    const selectedRow = () => page.evaluate(() => document.querySelector('.ig-cmd--selected')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    const menuRows = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd:not(.ig-cmd--disabled)')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    const allRows = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd')].map((e) => ({ text: e.textContent.replace(/\s+/g, ' ').trim(), disabled: e.classList.contains('ig-cmd--disabled') })));
    const pickRow = async (label) => {
      for (let i = 0; i < 40; i++) {
        const now = await selectedRow();
        if (label.test(now)) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(450);
          return true;
        }
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(150);
      }
      return false;
    };
    const targetName = () => page.evaluate(() => /TARGET\s+([^\n]+)/.exec(document.body.innerText)?.[1]?.trim() ?? /ATTACK\s*(?:→|->)\s*([^\n]+)/i.exec(document.body.innerText)?.[1]?.trim() ?? '');

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
    const board = await page.evaluate((id) => {
      const cards = [...document.querySelectorAll('.fe-card')];
      return { cards: cards.length, hasCard: !!document.querySelector(`[data-card="${id}"]`), mentions: /Gauntlet/i.test(document.body.innerText), strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
    }, CHAPTER);
    log('board', board);
    check('the board has no card for the hidden chapter, does not name it, and counts only the listed ones', board.hasCard === false && board.mentions === false && board.cards >= 18 && new RegExp(`of ${board.cards}`).test(board.strip ?? ''), board);

    // --- the typed word ---------------------------------------------------------------------------------------------------------------------
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

    // --- prep to the first menu -------------------------------------------------------------------------------------------------------------
    await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await screenNow();
    log('after Enter on prep', s);
    let preLines = 0;
    if (s === 'cutscene') {
      await shot('2-pre-scene');
      for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
        await page.keyboard.press('Enter');
        preLines++;
        await page.waitForTimeout(350);
        s = await screenNow();
      }
    }
    log('pre scene Enter presses', preLines);
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(1500);
    const f1 = await field();
    log('field.1', f1);
    check('the Cactuar King at 100,000 HP alone, Tidus, Yuna and Auron standing', f1?.bosses.length === 1 && f1.bosses[0].id === 'cactuar-king' && f1.bosses[0].hp === 100_000 && JSON.stringify(f1.party.map((p) => p.id)) === JSON.stringify(['tidus', 'yuna', 'auron']) && f1.party.every((p) => p.alive), f1);
    await dismissCoach();
    await page.waitForTimeout(600);
    await shot('3-first-menu');
    const every = await allRows();
    log('root rows with their state', every);
    check('Escape and Flee are drawn but shut (the chapter has no way out)', every.filter((r) => /^Escape|^Flee/i.test(r.text)).every((r) => r.disabled) && !(await menuRows()).some((r) => /^Escape|^Flee/i.test(r)), every);

    // --- real keys: the plain Attack, then act 1 to its end (or four minutes) ------------------------------------------------------------------
    let swings = 0;
    let shotNeedle = false;
    let reachedAct2 = false;
    let withdrew = false;
    let sawSeamOrAct2 = false;
    for (let guard = 0; guard < 400 && Date.now() - started < MAX_MS; guard++) {
      const sc = String(await screenNow());
      if (sc === 'results') {
        withdrew = true;
        break;
      }
      if (sc !== 'battle') {
        sawSeamOrAct2 = true;
        await page.waitForTimeout(500);
        continue;
      }
      const f = await field();
      if (f?.bosses.some((b) => b.id === 'don-tonberry')) {
        reachedAct2 = true;
        break;
      }
      const open = await page.evaluate(() => !!document.querySelector('.ig-cmd'));
      if (!open) {
        await page.waitForTimeout(500);
        continue;
      }
      if (f && f.counters > 0 && !shotNeedle) {
        shotNeedle = true;
        await shot('4-after-a-needle');
      }
      if (!(await pickRow(/^Attack/i))) {
        await page.keyboard.press('Escape');
        continue;
      }
      if (swings === 0) check('the target cursor rests on the Cactuar King', /Cactuar King/i.test(await targetName()), await targetName());
      await page.keyboard.press('Enter'); // the cursor opens on the King, the only foe
      swings++;
      await page.waitForTimeout(2500);
    }
    const f2 = await field().catch(() => null);
    log('field.after act 1', f2);
    log('swings by key', swings);
    log('screens met outside the battle', sawSeamOrAct2);
    if (reachedAct2) {
      // The seam played (hands off) and act 2 began: wait for its first menu, then look at it.
      await waitBattleMenu(page, 120000);
      await page.waitForTimeout(1500);
      await dismissCoach();
      const f3 = await field();
      log('field.act 2', f3);
      check('act 2 opened on Don Tonberry at 480,000 HP with the three standing and whole', f3?.bosses.some((b) => b.id === 'don-tonberry' && b.hp === 480_000) && f3.party.length === 3 && f3.party.every((p) => p.alive && p.hp === 9_999), f3);
      await shot('5-act-2-first-menu');
    } else if (withdrew) {
      const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
      log('results text', text);
      check('the King ran away: the card reads WITHDREW with the engine\'s own line', /WITHDREW/i.test(text) && /The Cactuar King got away!/.test(text), text);
      await shot('5-got-away');
    } else {
      check('act 1 reached a result inside the time box (victory into act 2, or the King got away)', false, { swings, ms: Date.now() - started });
      await shot('5-timebox');
    }

    const unexpected404 = missing.filter((m) => !MISSING_ART.test(m));
    check('no console errors', errors.length === 0, errors.slice(0, 5));
    check('no 4xx or 5xx responses but the paintings and plates the art lane still owes', unexpected404.length === 0, unexpected404.slice(0, 8));
    log('missing.gauntlet-art', missing.filter((m) => MISSING_ART.test(m)).length);
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
}
