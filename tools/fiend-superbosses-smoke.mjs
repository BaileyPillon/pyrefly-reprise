#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Fiend Arena Superbosses (branch `ch-fiend-superbosses`; FFX-2 only): a headless Playwright run against a dev server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes, and gives up without a browser if the lock is not its own within 30 minutes).
 *
 * Run A (the spec): title, Enter, the chapter-select board (no card for the hidden chapter), the typed word `legion`, party prep, the pre scene by keys, act 1 (Almighty Shinra alone at 275,000 HP on the Den of
 * Woe's stage), then real-key Attacks until the fight has a result (the base party is wiped by his opening Clione about 2.6 s in: a defeat is the expected result).
 * Run B (extra, a debug write as the Cup, Mirror Aeons and Dark Aeons smokes do): the chapter again from the defeat's retry; the girls' HP and Shinra's HP are written so the keys carry the fight through the seam, and
 * act 2 (the four heads of the Major Numerus) is looked at: four gauges, four targets, the Den of Woe's stage with four stand-in heads. The fight is not a measurement of difficulty (the bench is).
 *
 *   PYREFLY_BROWSER=gpu node tools/fiend-superbosses-smoke.mjs [--base http://127.0.0.1:5531/] [--out docs/screenshots/ch-fiend-superbosses] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--unrigged-act2] [--diag-out <dir>]
 *
 * `--unrigged-act2` leaves the girls alone in act 2 and checks the wipe (no menu, defeat at 271 logic steps) instead of writing them Invincible to look at it; `--diag-out <dir>` keeps polled pictures and the presenter's state of act 2's
 * first seconds in a folder that is not committed. Exit code 1 on a failed check, 2 when the lock was not its own within 30 minutes (no browser was opened). Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane.
 * Pictures: 1 party prep, 2 act 1's first menu, 3 act 1's defeat, 4 act 2's first menu, 5 act 2's target select.
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

const BASE = arg('--base', 'http://127.0.0.1:5531/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-fiend-superbosses'));
const TAG = arg('--tag', 'desk');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
const RIG_ACT2 = !flag('--unrigged-act2');
/** A scratch folder for diagnostic pictures that are NOT committed (act 2's first seconds, polled). */
const DIAG = arg('--diag-out', null) ? resolve(arg('--diag-out', '')) : null;
if (DIAG) mkdirSync(DIAG, { recursive: true });
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'legionDoor.ts')).href);
const ids = await import(pathToFileURL(join(REPO, 'src', 'data', 'fiend-superbosses-ids.ts')).href);
const WORD = door.LEGION_DOOR_WORD;
const CHAPTER = door.LEGION_DOOR_CHAPTER;
const HEADS = [...ids.NUMERUS_HEAD_IDS];

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let release;
{
  let timer;
  try {
    release = await Promise.race([
      takeRigRecord(`ch-fiend-superbosses smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('lock-timeout')), 30 * 60_000);
      }),
    ]);
  } catch (e) {
    console.log('NO-BROWSER: the lock was not this job\'s within 30 minutes', String(e));
    process.exit(2);
  } finally {
    clearTimeout(timer);
  }
}

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
    await page.screenshot({ path: p, type: 'jpeg', quality: 88 });
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
      const girls = ['yuna', 'rikku', 'paine'].map((id) => ({ id, hp: c(id)?.hp, maxHp: c(id)?.stats.maxHp, alive: c(id)?.alive }));
      return { enemies: st.enemyIds.map((id) => ({ id, name: c(id).name, hp: c(id).hp, maxHp: c(id).stats.maxHp, alive: c(id).alive })), girls, ticks: st.ticks, result: st.result?.outcome ?? null };
    });
  const gauges = () => page.evaluate(() => [...document.querySelectorAll('.ffx2hud__enemies .ig-bosshp')].map((g) => ({ id: g.dataset.actorId, name: g.querySelector('.ig-bosshp__name')?.textContent ?? null })));
  const toPrepAndBattle = async () => {
    await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await screenNow();
    log('after Enter on prep', s);
    if (s === 'cutscene') {
      for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(350);
        s = await screenNow();
      }
    }
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
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
  check('party prep names the chapter', /Fiend Arena Superbosses/i.test(prepText), prepText.slice(0, 240));
  await shot('1-party-prep');

  // --- run A: act 1 ---------------------------------------------------------------------------------------------------------------------------
  await toPrepAndBattle();
  const f1 = await field();
  log('field.1', f1);
  check('Almighty Shinra stands alone at full HP', f1?.enemies.length === 1 && f1.enemies[0].id === ids.X2_ALMIGHTY_SHINRA_ID && f1.enemies[0].hp === 275_000 && f1.enemies[0].name === 'Almighty Shinra', f1?.enemies);
  const g1 = await gauges();
  check('the HUD draws one gauge, his', g1.length === 1 && g1[0].id === ids.X2_ALMIGHTY_SHINRA_ID && g1[0].name === 'Almighty Shinra', g1);
  await shot('2-act-1-first-menu');
  // Real keys: Attack on the one target, again and again, until the fight has a result (the opening Clione ends it about 2.6 s in).
  const t0 = Date.now();
  let result = null;
  for (let i = 0; Date.now() - t0 < 4 * 60_000; i++) {
    const f = await field();
    if (f?.result) {
      result = f.result;
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  log('act 1 result', { result, ms: Date.now() - t0 });
  check('act 1 reaches a result by the keys inside four minutes', result !== null, { result });
  check('the base party is defeated (the bench: 0 wins of 200)', result === 'defeat', { result });
  await page.waitForTimeout(3500);
  const defeatText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
  check('a defeat panel offers a retry', /retry|try again|defeat/i.test(defeatText), defeatText.slice(0, 200));
  await shot('3-act-1-defeat');

  // --- run B: the retry, then a debug write carries the keys through the seam to act 2 -------------------------------------------------------------
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  let s = await screenNow();
  log('after the retry key', s);
  if (s !== 'party-prep' && s !== 'battle' && s !== 'cutscene') {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    s = await screenNow();
    log('after a second key', s);
  }
  if (s === 'party-prep') await toPrepAndBattle();
  else if (s === 'cutscene') {
    for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      s = await screenNow();
    }
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
  }
  await page.evaluate(
    ({ shinra }) => {
      const st = window.__pyrefly.battleState();
      for (const id of ['yuna', 'rikku', 'paine']) {
        st.combatants[id].stats.maxHp = 900_000;
        st.combatants[id].hp = 900_000;
      }
      st.combatants[shinra].hp = 600;
    },
    { shinra: ids.X2_ALMIGHTY_SHINRA_ID },
  );
  const t1 = Date.now();
  let act2 = false;
  for (let i = 0; Date.now() - t1 < 4 * 60_000 && !act2; i++) {
    const st = await page.evaluate(() => {
      const b = window.__pyrefly.battleState?.();
      return b ? { enemies: b.enemyIds } : null;
    });
    if (st && st.enemies.includes(HEADS[0])) {
      act2 = true;
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
  }
  log('act 1 to act 2', { act2, ms: Date.now() - t1 });
  check('act 1 is won by the keys (Shinra written down) and the seam leads to act 2', act2, {});
  // The first menu of act 2, polled by hand (a wipe within seconds is a possible, honest result): the timeline says what happened when it does not come.
  let menu2 = false;
  if (act2) {
    // The engine opens a chained link with every wait whole (`battle/ffx2/atb-open.ts`): the heads strike about 2.9 s in and the girls' first command comes later still, so the unrigged base party is wiped in act 2 without a single
    // menu (the bench: 200 of 200 seeds). To look at the heads and the target cursor the girls are written Invincible (a rig, as the HP writes are); `--unrigged-act2` leaves them be and checks the wipe instead.
    if (RIG_ACT2) {
      await page.evaluate(() => {
        const st = window.__pyrefly.battleState();
        for (const id of ['yuna', 'rikku', 'paine']) st.combatants[id].statuses.invincible = { id: 'invincible', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
      });
    }
    const t2 = Date.now();
    const timeline = [];
    for (let i = 0; Date.now() - t2 < 40_000; i++) {
      const r = await page.evaluate(() => {
        const p = window.__pyrefly;
        const st = p.battleState?.();
        return {
          screen: p.screen?.() ?? null,
          awaiting: JSON.stringify(p.snapshotState?.() ?? {}).includes('"awaitingMenu":true'),
          ticks: st?.ticks ?? null,
          result: st?.result?.outcome ?? null,
          girls: st ? ['yuna', 'rikku', 'paine'].map((id) => st.combatants[id].hp) : null,
        };
      });
      timeline.push(r);
      if (DIAG && r.ticks !== null && r.ticks > 0) {
        log('act 2 presenter', await page.evaluate(() => {
          const ss = window.__pyrefly.snapshotState?.();
          const pb = ss?.screenState?.playback ?? {};
          const st = window.__pyrefly.battleState?.();
          return JSON.stringify({ ticks: st?.ticks, phase: pb.phase, awaiting: pb.awaitingMenu, played: pb.played, last: (pb.lastEvents ?? []).slice(0, 4).map((e) => e.type + ':' + e.ms), gauges: ['yuna', 'rikku', 'paine'].map((id) => Math.round((st?.combatants[id]?.atb?.gauge ?? -1) * 100) / 100), charging: ['yuna', 'rikku', 'paine'].map((id) => !!st?.combatants[id]?.atb?.charging) });
        }));
      }
      if (DIAG && i % 4 === 0) await page.screenshot({ path: join(DIAG, `${TAG}-act2-poll-${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 });
      if (r.awaiting) {
        menu2 = true;
        break;
      }
      if (r.result || r.screen !== 'battle') break;
      await page.waitForTimeout(150);
    }
    log('act 2 timeline (first, last)', [timeline[0], timeline[timeline.length - 1]]);
    if (DIAG) log('act 2 timeline (all)', timeline);
    const last = timeline[timeline.length - 1];
    if (RIG_ACT2) check('act 2 shows its first menu (the girls written Invincible: a rig, so the look can be taken)', menu2, last);
    else check('act 2, unrigged: the base party is wiped without ever being asked for a command, about nine seconds in (271 logic steps at the bench)', !menu2 && last.result === 'defeat' && last.ticks >= 250 && last.ticks <= 300, last);
  }
  if (menu2) {
    const f2 = await field();
    log('field.2', f2);
    const parts = [ids.X2_NUMERUS_BODY_ID, ids.X2_NUMERUS_POD_ID, ids.X2_NUMERUS_TAIL_ID];
    check('act 2 holds seven actors: the four heads at their sourced HP and the three parts', f2?.enemies.length === 7 && HEADS.every((h, i) => f2.enemies[i].id === h && f2.enemies[i].hp === [555_555, 666_666, 666_666, 777_777][i]) && parts.every((p) => f2.enemies.some((e) => e.id === p)), f2?.enemies);
    const g2 = await gauges();
    check('the HUD draws four gauges, one per head, and none for the parts', g2.length === 4 && HEADS.every((h, i) => g2[i].id === h) && g2.map((g) => g.name).join(',') === 'Unum,Duo,Tria,Quattour', g2);
    await shot('4-act-2-first-menu');
    await dismissCoach();
    await page.keyboard.press('Enter'); // Attack: the target cursor opens (the clock is held in a submenu)
    await page.waitForTimeout(900);
    await shot('5-act-2-target-select');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  const accepted = /pause\/ffx2-fiend-superbosses|chapter-ffx2-fiend-superbosses/;
  const unexpected404 = missing.filter((m) => !accepted.test(m));
  log('placeholders', [...placeholders]);
  check('no console errors', errors.length === 0, errors.slice(0, 5));
  check('no 4xx or 5xx responses (the pause hero and the card thumbnail are held keys, not requested)', unexpected404.length === 0, unexpected404.slice(0, 8));
  log('missing (all, including accepted)', missing.slice(0, 8));
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
