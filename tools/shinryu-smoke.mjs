#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Shinryu chapter (branch `ch-shinryu`; FFX only): a headless Playwright run, against a dev or preview server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes). It opens the chapter by its typed word, looks at party prep, plays the pre scene by keyboard,
 * takes the first menu (Shinryu at 2,000,000 HP, Tidus, Wakka and Rikku, a water battle) and plays the WHOLE fight with the real keys and no debug write:
 *
 *   1. Attack with whoever's turn it is (Enter on the first row, Enter on Shinryu, the only foe): every blow takes 99,999 off it and draws a claw from it;
 *   2. the loop goes on until the battle ends (about 21 blows); an Eraser, if one lands, is a shatter (the member is gone from the field);
 *   3. the results page (AP 50,000, no gil), then the post scene, then back to the board.
 *
 * PREDICTION (written before the first run, `docs/handoff/ch-shinryu.md` section 9): the party wins on every seed in about 25 CTB ticks; the HP bar of the first Attack reads 1,900,001 (2,000,000 less 99,999); Shinryu's first
 * counter is a claw of about 260 to 300 on the hitter; the first Eraser (about one battle in three) prints "shatters" and Wakka's callout line plays once; the results page reads 50,000 AP and a drop of Wings to Discovery or Dark
 * Matter (two of it: the killing blow is the cap, which is the Overkill threshold); no console error and no 404 but the paintings and plates the art lane still owes.
 *
 *   PYREFLY_BROWSER=gpu node tools/shinryu-smoke.mjs [--base http://127.0.0.1:5237/] [--out docs/screenshots/ch-shinryu] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--wait-min 30]
 *
 * Exit code 1 on a failed check, 2 when the lock was not free inside `--wait-min` (nothing was run). Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. **The paintings do not
 * exist yet** (Shinryu's own set, the stage plate of release 76 in a tree whose art mirror is older, the pause hero and the portrait): the presenter draws the airship Evrae's painting for the body and a placeholder where a plate is
 * missing, and the 404s for those files are the only ones the run accepts.
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
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-shinryu'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const WAIT_MIN = Number(arg('--wait-min', '30'));
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'shinryuDoor.ts')).href);
const WORD = door.SHINRYU_DOOR_WORD;
const CHAPTER = door.SHINRYU_DOOR_CHAPTER;
const MISSING_ART = /characters\/shinryu|portraits\/shinryu|pause\/ch48-shinryu|chapter-shinryu|via-purifico-flooded-3/;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

// The lock: wait in the line for at most `--wait-min` minutes, then give the line up and run nothing.
const waiting = takeRigRecord(`ch-shinryu smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
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
        const c = (id) => st.combatants[id];
        return {
          boss: { hp: c('shinryu').hp, maxHp: c('shinryu').stats.maxHp, alive: c('shinryu').alive },
          party: st.activeIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, removed: c(id).removed })),
          water: st.flags['battle.inWater'],
          turn: st.turn,
          ticks: st.ticks,
          answers: st.log.filter((e) => e.type === 'counter' && e.actorId === 'shinryu').length,
          erasers: st.log.filter((e) => e.type === 'action-start' && e.actorId === 'shinryu' && e.abilityId === 'shinryu-eraser').length,
          shatters: st.log.filter((e) => e.type === 'message' && / shatters$/.test(e.text)).length,
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
    // Desktop draws "TARGET <name>"; the phone layout has no such line and confirms with a button "ATTACK -> <NAME>" (found on the first phone run, seed 11: the failed check was this reader, the cursor was on Shinryu).
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
      return { cards: cards.length, hasCard: !!document.querySelector(`[data-card="${id}"]`), strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null };
    }, CHAPTER);
    log('board', board);
    check('the board has no card for the hidden chapter and counts only the listed ones', board.hasCard === false && board.cards >= 18 && new RegExp(`of ${board.cards}`).test(board.strip ?? ''), board);
    await shot('0-board');

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
    check('Shinryu at 2,000,000 HP alone, in a water battle, Tidus, Wakka and Rikku standing', f1?.boss.hp === 2_000_000 && f1.water === true && JSON.stringify(f1.party.map((p) => p.id)) === JSON.stringify(['tidus', 'wakka', 'rikku']) && f1.party.every((p) => p.alive), f1);
    await shot('3-first-menu');
    await dismissCoach();
    await page.waitForTimeout(600);
    await shot('3a-first-menu-clear');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    await shot('3b-pause');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    await waitBattleMenu(page, 60000);

    // --- real keys: the first Attack, then the whole fight --------------------------------------------------------------------------------------
    const rows = await menuRows();
    log('root rows', rows);
    const every = await allRows();
    log('root rows with their state', every);
    check('Escape and Flee are drawn but shut (the chapter has no way out)', every.filter((r) => /^Escape|^Flee/i.test(r.text)).length > 0 && every.filter((r) => /^Escape|^Flee/i.test(r.text)).every((r) => r.disabled) && !rows.some((r) => /^Escape|^Flee/i.test(r)), every);
    check('Attack reached by the menu', await pickRow(/^Attack/i), await selectedRow());
    await shot('4-attack-target-cursor');
    check('the target cursor rests on Shinryu', /Shinryu/i.test(await targetName()), await targetName());
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3500);
    const f2 = await field();
    log('after the first key attack', f2);
    check('the first key Attack took 99,999 off it, and it answered with a claw', f2.boss.hp === 2_000_000 - 99_999 && f2.answers >= 1, { hp: f2.boss.hp, answers: f2.answers });
    await shot('5-after-first-blow');

    let blows = 1;
    let shotEraser = false;
    for (let guard = 0; guard < 120; guard++) {
      const sc = await screenNow();
      if (sc !== 'battle') break;
      const open = await page.evaluate(() => !!document.querySelector('.ig-cmd'));
      if (!open) {
        await page.waitForTimeout(500);
        continue;
      }
      const f = await field();
      if (f && f.shatters > 0 && !shotEraser) {
        shotEraser = true;
        await shot('6-after-an-eraser');
      }
      if (!(await pickRow(/^Attack/i))) {
        await page.keyboard.press('Escape');
        continue;
      }
      await page.keyboard.press('Enter'); // the cursor opens on Shinryu, the only foe
      blows++;
      await page.waitForTimeout(2500);
    }
    const f3 = await field().catch(() => null);
    log('field.end', f3);
    log('blows by key', blows);
    check('the battle ended: the results page or the post scene is up', ['results', 'cutscene', 'chapter-select', 'title'].includes(String(await screenNow())), await screenNow());
    // The post script plays first and ends on the results page: advance with Enter until the results page is up.
    for (let guard = 0; guard < 140 && String(await screenNow()) !== 'results'; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(450);
    }
    await shot('7-post-scene-ended');
    await page.waitForTimeout(1500);
    check('the results page is up', String(await screenNow()) === 'results', await screenNow());
    const resultsText = await page.evaluate(() => document.body.innerText);
    log('results text', resultsText.replace(/\s+/g, ' ').slice(0, 400));
    await shot('7-results');
    check('the results page names 50,000 AP', /50,?000/.test(resultsText), (/AP[^\n]{0,40}/i.exec(resultsText) ?? [''])[0]);
    check('the drop is Wings to Discovery or Dark Matter', /Wings to Discovery|Dark Matter/i.test(resultsText), (/ITEMS[^\n]{0,60}/i.exec(resultsText) ?? [''])[0]);
    const seen = [];
    for (let guard = 0; guard < 140; guard++) {
      const sc = String(await screenNow());
      if (seen.at(-1) !== sc) seen.push(sc);
      if (sc === 'chapter-select' || sc === 'title') break;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(450);
    }
    log('screens after the fight', seen);
    check('the post scene played and the flow returned to the board', seen.includes('cutscene') || seen.includes('chapter-select'), seen);
    await shot('8-after');

    const unexpected404 = missing.filter((m) => !MISSING_ART.test(m));
    check('no console errors', errors.length === 0, errors.slice(0, 5));
    check('no 4xx or 5xx responses but the paintings and plates not installed in this tree', unexpected404.length === 0, unexpected404.slice(0, 8));
    log('missing.shinryu-art', missing.filter((m) => MISSING_ART.test(m)).length);
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
  process.exit(0); // the lock's timer would otherwise hold the process open after a pass (found on the phone run: it printed OK and stayed up)
}
