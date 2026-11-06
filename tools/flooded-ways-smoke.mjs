#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Flooded Ways chapter (branch `ch-flooded-ways`; FFX only): a headless Playwright run, against a dev or preview server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes). It opens the chapter by its typed word, looks at party prep, plays the pre scene by keyboard,
 * takes the first menu of the Via Purifico's first area (Evrae Altana and the two Gate Locks), and plays with the real keys:
 *
 *   1. Attack on Evrae Altana (Enter, Enter): the area-1 counter answers;
 *   2. Open lock on the first Gate Lock, then on the second (the menu walked with Down until the selected row reads "Open lock", then Enter, Enter): the area ends as a victory and the chain carries on to area 2;
 *   3. area 2's first menu: Evrae Altana opens with the HP area 1 left it, the locks are new;
 *   4. (a debug write, named as such, as the other chapters' smokes do) Evrae Altana is left at 1 HP and an Attack with the real keys kills it: the chain skips area 3 and opens the Baaj Temple's fight;
 *   5. Geosgaeno's first menu; (a debug write) its cycle slot is set to the swallow, and the first character it swallows has the two-row menu, Struggle and Defend, photographed.
 *
 *   PYREFLY_BROWSER=gpu node tools/flooded-ways-smoke.mjs [--base http://127.0.0.1:5198/] [--out docs/screenshots/ch-flooded-ways] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--stop area2|baaj|hold]
 *
 * Exit code 1 on a failed check. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. **Three paintings do not exist yet** (Geosgaeno, the Gate Lock and Evrae Altana's own
 * recolour): the presenter draws its procedural placeholder for them (one console WARNING per missing key, not an error); their sidecar and painting files, and the pause hero `pause/ch36-flooded-ways`, answer 404, and those are
 * the only 404s the run accepts.
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

const BASE = arg('--base', 'http://127.0.0.1:5198/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-flooded-ways'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const STOP = arg('--stop', 'hold');
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'geosgaenoDoor.ts')).href);
const WORD = door.GEOSGAENO_DOOR_WORD;
const CHAPTER = door.GEOSGAENO_DOOR_CHAPTER;
const MISSING_ART = /characters\/(geosgaeno|gate-lock|evrae-altana)|portraits\/(geosgaeno|gate-lock|evrae-altana)|pause\/ch36-flooded-ways/;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

const release = await takeRigRecord(`ch-flooded-ways smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
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
        enemies: st.enemyIds.map((id) => ({ id, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive, zombie: !!c(id).statuses.zombie })),
        party: st.activeIds.map((id) => ({ id, hp: c(id).hp, alive: c(id).alive, removed: c(id).removed })),
        flags: { link: st.flags['fw.link'], water: st.flags['battle.inWater'], hold: st.flags['fw.hold'], v4: st.flags['fw.geo.v4'] },
        turn: st.turn,
        counters: st.log.filter((e) => e.type === 'counter' && e.actorId === 'evrae-altana').length,
      };
    });
  const selectedRow = () => page.evaluate(() => document.querySelector('.ig-cmd--selected')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  const menuRows = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  /** Walk the menu with Down until the selected row reads `label`; Enter on it. */
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

  /** The name on the target cursor's plate ("TARGET  Gate Lock"), or ''. */
  const targetName = () => page.evaluate(() => /TARGET\s+([^\n]+)/.exec(document.body.innerText)?.[1]?.trim() ?? '');
  /** With the target cursor up: step Right until it rests on a name matching `label`; Enter on it. */
  const aimAt = async (label) => {
    for (let i = 0; i < 8; i++) {
      if (label.test(await targetName())) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        return true;
      }
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);
    }
    return false;
  };

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
  check('area 1: Evrae Altana at 16,384 (a Zombie) and two Gate Locks at 500, in a water battle', f1?.enemies.length === 3 && f1.enemies[0].id === 'evrae-altana' && f1.enemies[0].hp === 16_384 && f1.enemies[0].zombie && f1.enemies[1].hp === 500 && f1.enemies[2].hp === 500 && f1.flags.water === true && f1.flags.link === 'area-1', f1);
  check('Tidus, Wakka and Rikku are the party, all standing', JSON.stringify(f1.party.map((p) => p.id)) === JSON.stringify(['tidus', 'wakka', 'rikku']) && f1.party.every((p) => p.alive), f1.party);
  await shot('3-area-1-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-area-1-menu-clear');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3b-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- real keys: Attack on Evrae Altana (the first target is the first enemy), the counter answers ------------------------------------------------
  await waitBattleMenu(page, 60000);
  const rows = await menuRows();
  log('root rows', rows);
  check('the root menu offers Open lock', rows.some((r) => /Open lock/i.test(r)), rows);
  check('Attack reached by the menu', await pickRow(/^Attack/i), await selectedRow());
  await shot('4-attack-target-cursor');
  check('the target cursor rests on Evrae Altana', await aimAt(/Evrae/i), await targetName());
  const f2 = await field();
  log('after the key attack', f2);
  check('the key Attack hurt Evrae Altana and area 1 answered it with a counter', f2.enemies[0].hp < 16_384 && f2.counters >= 1, { hp: f2.enemies[0].hp, counters: f2.counters });
  const carried = f2.enemies[0].hp;

  // --- real keys: Open lock twice -----------------------------------------------------------------------------------------------------------
  for (const which of [1, 2]) {
    await waitBattleMenu(page, 60000);
    const ok = await pickRow(/Open lock/i);
    check(`Open lock reached by the menu (${which})`, ok, await selectedRow());
    if (which === 1) await shot('5-open-lock-target-cursor');
    if (which === 1 && STOP === 'lock') {
      // --stop lock: only the staging read (both locks under the Open lock target cursor), for a spot change; nothing is played further.
      const target = await targetName();
      check('the Open lock cursor rests on a Gate Lock', /Gate Lock/i.test(target), target);
      await page.keyboard.press('ArrowRight'); // the cursor steps to the other lock: its framing is the second photograph
      await page.waitForTimeout(500);
      await shot('5b-open-lock-second-lock');
      await browser.close();
      release();
      console.log(failures.length > 0 ? `FAILED ${JSON.stringify(failures)}` : 'OK (stopped at the lock cursor)');
      process.exit(failures.length > 0 ? 1 : 0);
    }
    await page.keyboard.press('Enter'); // the first lock the cursor rests on
    await page.waitForTimeout(3000);
    const f = await field();
    log(`after open lock ${which}`, f.enemies.map((e) => `${e.id}:${e.hp}`));
  }
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(2500);
  const f3 = await field();
  log('field.2', f3);
  check('the chain carried on to area 2: Evrae Altana opens with the HP area 1 left it, the locks are new', f3.flags.link === 'area-2' && f3.enemies[0].id === 'evrae-altana' && f3.enemies[0].hp === carried && f3.enemies[1].hp === 500 && f3.enemies[2].hp === 500, { carried, f3: f3.enemies });
  await shot('6-area-2-first-menu');

  if (STOP !== 'area2') {
    // --- a debug write (named): Evrae Altana left at 1 HP, a real-key Attack kills it; the chain skips area 3 ------------------------------------------
    await page.evaluate(() => {
      const st = window.__pyrefly.battleState();
      st.combatants['evrae-altana'].hp = 1;
    });
    await waitBattleMenu(page, 60000);
    await pickRow(/^Attack/i);
    check('the cursor rests on Evrae Altana for the killing blow', await aimAt(/Evrae/i), await targetName());
    for (let i = 0; i < 80 && (await field())?.flags.link !== 'geosgaeno'; i++) {
      const sc = await screenNow();
      if (sc === 'cutscene') await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2500);
    const f4 = await field();
    log('field.baaj', f4);
    check('Evrae Altana fell in area 2 and the chain went on to Geosgaeno, not area 3', f4.flags.link === 'geosgaeno' && f4.enemies.length === 1 && f4.enemies[0].id === 'geosgaeno' && f4.enemies[0].hp === 32_767, f4);
    // A fresh fight (`restoresPartyOnEntry`, tested on the engine); by the first menu Geosgaeno may already have punched, and the water takes whoever its Stone Punch petrifies (Tidus wears no Ward): shattered members are off the field, nobody is knocked out and still on it.
    check('the party entered the Baaj Temple whole: anyone missing was shattered by the water, nobody is knocked out', f4.party.every((p) => (p.alive && p.hp > 0) || p.removed), f4.party);
    await shot('7-baaj-first-menu');

    // --- the chain position after a skipped area (the review's M2): the pause screen reads battle 4 of 4 and the Baaj row is ticked -----------------
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    const pauseText = await page.evaluate(() => document.body.innerText);
    check('the pause screen in the Baaj Temple reads "battle 4 of 4" after area 3 was skipped', /BATTLE 4 OF 4/i.test(pauseText), (/BATTLE \d OF \d/i.exec(pauseText) ?? [''])[0]);
    for (let i = 0; i < 6 && !/Reach the Baaj Temple/i.test(await page.evaluate(() => document.body.innerText)); i++) {
      await page.keyboard.press('e'); // R1: the next tab, up to the CHAPTER tab
      await page.waitForTimeout(500);
    }
    const chapterTab = await page.evaluate(() => document.body.innerText);
    const rowOf = (label) => new RegExp(`\\d\\.\\s*${label}[\\s\\S]{0,40}?(Done|—)`, 'i').exec(chapterTab)?.[1]?.toLowerCase() ?? null;
    log('chapter tab rows', { first: rowOf('Get past the first gate'), baaj: rowOf('Reach the Baaj Temple'), last: rowOf('Send Geosgaeno home') });
    check('the CHAPTER tab ticks "Get past the first gate" and "Reach the Baaj Temple" and not yet the last row', rowOf('Get past the first gate') === 'done' && rowOf('Reach the Baaj Temple') === 'done' && rowOf('Send Geosgaeno home') === '—', chapterTab.slice(0, 600));
    await shot('7a-pause-chapter-tab-baaj');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    await waitBattleMenu(page, 60000);

    if (STOP === 'hold') {
      // --- a debug write (named): the next turn Geosgaeno takes is the swallow; the swallowed character's menu is Struggle and Defend ---------------------
      await page.evaluate(() => {
        window.__pyrefly.battleState().flags['fw.geo.v4'] = 3;
      });
      let held = '';
      for (let i = 0; i < 40 && held === ''; i++) {
        await waitBattleMenu(page, 60000);
        held = String((await field()).flags.hold ?? '');
        if (held === '') {
          await pickRow(/^Attack/i); // the cheap pass: an Attack on whoever the cursor rests on (Geosgaeno is the only foe)
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2500);
        }
      }
      check('Geosgaeno swallowed a character', held !== '', held);
      if (held !== '') {
        for (let i = 0; i < 20; i++) {
          await waitBattleMenu(page, 60000);
          const now = await menuRows();
          if (now.some((r) => /Struggle/i.test(r))) {
            log('held menu', now);
            check('the swallowed character has Struggle and none of the ordinary rows (Defend is the Triangle control, not a row)', now.length <= 2 && now.some((r) => /Struggle/i.test(r)) && !now.some((r) => /Attack|Items|Special|White Magic|Open lock/i.test(r)), now);
            await shot('8-held-menu');
            break;
          }
          await pickRow(/^Attack/i);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
        }
      }
    }
  }

  const unexpected404 = missing.filter((m) => !MISSING_ART.test(m));
  log('placeholders', [...placeholders]);
  check('no console errors', errors.length === 0, errors.slice(0, 5));
  check('no 4xx or 5xx responses but the paintings not made yet', unexpected404.length === 0, unexpected404.slice(0, 8));
  log('missing.flooded-art', missing.filter((m) => MISSING_ART.test(m)).length);
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
