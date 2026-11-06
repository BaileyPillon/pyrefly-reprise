#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Farplane Cup (branch `ch-farplane-cup`; FFX-2 only): a headless Playwright run against a dev server that is already up, under the review-browser lock
 * (`tools/rig-record-lock.mjs`: one browser job at a time on this PC; the job promises to finish inside ten minutes). It opens the chapter by its typed word, looks at party prep, plays the pre scene by
 * keyboard, takes the first menu of duel 1 (Auron, on the Den of Woe's stage), plays turns with the real keys (Enter on Attack, Enter on the one target), then writes Auron's HP down to a few hundred (a debug
 * write to the battle state, as the Mirror and Dark Aeons smokes do: the fight itself is not a measurement of difficulty) and carries on by keys until the first fight is won and the seam has played, stopping at the
 * first menu of duel 2 (the masked duelist, "????"); then (the review-fix pass) writes the masked duelist's HP down the same way, plays the second seam, checks Seymour's first menu (his sprite is seen in the
 * screenshot), writes his HP down and carries the keys to the results page and the post scene, whose line names the hidden duelist.
 *
 *   PYREFLY_BROWSER=gpu node tools/farplane-cup-smoke.mjs [--base http://127.0.0.1:5231/] [--out docs/screenshots/ch-farplane-cup] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7] [--late-shots]
 *
 * Exit code 1 on a failed check. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. **The three duelists are existing party paintings** (`characters/auron`,
 * `tidus`, `seymour-guest`), so no placeholder warning is expected for them; the pause hero `pause/ffx2-farplane-cup` and the card thumbnail are keys with no painting yet, and a 404 for them is the one accepted.
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

const BASE = arg('--base', 'http://127.0.0.1:5231/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-farplane-cup'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const LATE_ONLY = flag('--late-shots');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'duelistDoor.ts')).href);
const ids = await import(pathToFileURL(join(REPO, 'src', 'data', 'farplane-cup-ids.ts')).href);
const WORD = door.DUELIST_DOOR_WORD;
const CHAPTER = door.DUELIST_DOOR_CHAPTER;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

const release = await takeRigRecord(`ch-farplane-cup smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock', m) });
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
    if (LATE_ONLY && !/^[789]/.test(name)) return; // --late-shots: only duel 3 and the close are saved (the earlier pictures of the first run stand)
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
  check('party prep names the chapter', /Farplane Cup/i.test(prepText), prepText.slice(0, 200));
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
  check('Auron stands alone at full HP', f1?.enemies.length === 1 && f1.enemies[0].id === ids.X2_CUP_AURON_ID && f1.enemies[0].hp === 187_500 && f1.enemies[0].name === 'Auron', f1?.enemies);
  check('the three girls stand at full HP', f1?.girls.every((g) => g.alive && g.hp === g.maxHp), f1?.girls);
  const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  check('the HUD shows Auron\'s name', /Auron/.test(bodyText), bodyText.slice(0, 160));
  await shot('3-duel-1-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-duel-1-menu-clear');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3b-pause');
  // The pause screen is read by eye from the screenshot (its prose is not in the page text): the chapter's line, "battle 1 of 3" and the first objective.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- real keys: Attack on Auron until a girl has acted twice --------------------------------------------------------------------------------
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

  // --- Auron's HP written down (a debug write), then the keys carry the fight to its end and through the seam -----------------------------------------------
  await page.evaluate((id) => {
    const st = window.__pyrefly.battleState();
    if (st.combatants[id].hp > 600) st.combatants[id].hp = 600;
  }, ids.X2_CUP_AURON_ID);
  const t0 = Date.now();
  let duel2 = false;
  let outcome = null;
  for (let i = 0; Date.now() - t0 < 4 * 60_000 && !duel2; i++) {
    const st = await page.evaluate(() => {
      const b = window.__pyrefly.battleState?.();
      return b ? { enemies: b.enemyIds, result: b.result ?? null } : null;
    });
    if (st && st.enemies.includes(ids.X2_CUP_TIDUS_ID)) {
      duel2 = true;
      break;
    }
    const sc = await screenNow();
    if (sc === 'results') {
      outcome = 'results';
      break;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    if (i === 12) await shot('5-fight-1-later');
  }
  log('fight 1 result', { duel2, outcome, ms: Date.now() - t0 });
  check('duel 1 is won by the keys and the seam leads to duel 2', duel2, { outcome });
  if (duel2) {
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2500);
    const f2 = await field();
    log('field.2', f2);
    check('duel 2 opens with the masked duelist alone at full HP', f2?.enemies.length === 1 && f2.enemies[0].id === ids.X2_CUP_TIDUS_ID && f2.enemies[0].hp === 136_200, f2?.enemies);
    // Tidus opens with Blitz Ace (a hit within about 2.4 s), so a girl may already be down at the first menu: the check is that every HP lost is accounted for by a damage event of the log, and a girl with none is whole.
    const lost = await page.evaluate(() => {
      const log = window.__pyrefly.battleLog?.() ?? [];
      const out = {};
      for (const e of log) if (e.type === 'damage' && ['yuna', 'rikku', 'paine'].includes(e.targetId)) out[e.targetId] = (out[e.targetId] ?? 0) + (e.amount ?? 0);
      return out;
    });
    check('the girls opened duel 2 whole (the arena mended them): each girl HP is her maximum less the damage the fight has dealt her', f2?.girls.every((g) => (g.alive ? g.hp === g.maxHp - (lost[g.id] ?? 0) : (lost[g.id] ?? 0) >= g.maxHp)), { girls: f2?.girls, lost });
    const text2 = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    check('the HUD reads the mask "????" and never the real name', /\?\?\?\?/.test(text2) && !/Tidus/i.test(text2), text2.slice(0, 200));
    await shot('6-duel-2-first-menu');
    await dismissCoach();
    await page.waitForTimeout(600);
    await shot('6a-duel-2-menu-clear');

    // --- duel 2 to duel 3: the masked duelist's HP written down (a debug write, as for Auron), then the keys carry the fight, the second seam and Seymour's first menu ---------------------------
    await page.evaluate((id) => {
      const st = window.__pyrefly.battleState();
      if (st.combatants[id].hp > 600) st.combatants[id].hp = 600;
    }, ids.X2_CUP_TIDUS_ID);
    const t1 = Date.now();
    let duel3 = false;
    for (let i = 0; Date.now() - t1 < 4 * 60_000 && !duel3; i++) {
      const st = await page.evaluate(() => {
        const b = window.__pyrefly.battleState?.();
        return b ? { enemies: b.enemyIds } : null;
      });
      if (st && st.enemies.includes(ids.X2_CUP_SEYMOUR_ID)) {
        duel3 = true;
        break;
      }
      if ((await screenNow()) === 'results') break;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(700);
    }
    log('fight 2 result', { duel3, ms: Date.now() - t1 });
    check('duel 2 is won by the keys and the second seam leads to duel 3', duel3, {});
    if (duel3) {
      await waitBattleMenu(page, 120000);
      await page.waitForTimeout(2500);
      const f3 = await field();
      log('field.3', f3);
      check('duel 3 opens with Seymour alone at full HP', f3?.enemies.length === 1 && f3.enemies[0].id === ids.X2_CUP_SEYMOUR_ID && f3.enemies[0].hp === 145_500 && f3.enemies[0].name === 'Seymour', f3?.enemies);
      const lost3 = await page.evaluate(() => {
        const out = {};
        for (const e of window.__pyrefly.battleLog?.() ?? []) if (e.type === 'damage' && ['yuna', 'rikku', 'paine'].includes(e.targetId)) out[e.targetId] = (out[e.targetId] ?? 0) + (e.amount ?? 0);
        return out;
      });
      check('the girls opened duel 3 whole (the arena mended them again): each girl HP is her maximum less the damage this fight has dealt her', f3?.girls.every((g) => (g.alive ? g.hp === g.maxHp - (lost3[g.id] ?? 0) : (lost3[g.id] ?? 0) >= g.maxHp)), { girls: f3?.girls, lost3 });
      const text3 = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      check('the HUD names Seymour', /Seymour/.test(text3), text3.slice(0, 200));
      await shot('7-duel-3-first-menu');
      await dismissCoach();
      await page.waitForTimeout(600);
      await shot('7a-duel-3-menu-clear');

      // --- Seymour's HP written down, then the keys carry the fight to the results page and the post scene -----------------------------------------------------------------------------------
      await page.evaluate((id) => {
        const st = window.__pyrefly.battleState();
        if (st.combatants[id].hp > 600) st.combatants[id].hp = 600;
      }, ids.X2_CUP_SEYMOUR_ID);
      const t2 = Date.now();
      let reached = null;
      let postText = '';
      let revealed = false;
      for (let i = 0; Date.now() - t2 < 4 * 60_000 && !revealed; i++) {
        const sc = await screenNow();
        if (sc === 'results' || sc === 'cutscene') {
          if (reached === null) await shot('8-close-first');
          reached = reached === 'cutscene' ? 'cutscene' : sc; // 'cutscene' once the post scene has played at all
          const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 800));
          postText += ` ${txt}`;
          if (/hidden name finally prints/i.test(txt)) {
            revealed = true;
            await shot('9-post-scene-reveal');
            break;
          }
        }
        await page.keyboard.press('Enter');
        await page.waitForTimeout(700);
      }
      log('fight 3 result', { reached, revealed, ms: Date.now() - t2 });
      check('duel 3 is won by the keys and the chapter reaches its close (the results page or the post scene)', reached !== null, { reached });
      check('the post scene names the hidden duelist (the board line "the hidden name finally prints: Tidus")', revealed, postText.slice(0, 300));
    }
  }

  const accepted = /pause\/ffx2-farplane-cup|chapter-ffx2-farplane-cup/;
  const unexpected404 = missing.filter((m) => !accepted.test(m));
  log('placeholders', [...placeholders]);
  check('no console errors', errors.length === 0, errors.slice(0, 5));
  check('no 4xx or 5xx responses but the pause hero and the card thumbnail (not painted yet)', unexpected404.length === 0, unexpected404.slice(0, 8));
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
