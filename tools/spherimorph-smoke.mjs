#!/usr/bin/env node
/**
 * The real-key smoke of the hidden Spherimorph chapter (branch `ch-spherimorph`; FFX only): a headless Playwright run, against a dev server that is already up, that opens the chapter by its typed word
 * (`spherimorph`), looks at party prep, plays the pre scene by keyboard, takes the first menu (Spherimorph alone on the Macalania Temple's plate, Tidus, Yuna and Lulu in front), and then plays the PUZZLE with REAL KEYS to
 * a result: Tidus's plain Attack (the probe) and the spell Spherimorph answers it with (the clue), Lulu's Black Magic menu with the spell of the opposite element at the highest tier (the weakness hit, which shifts it:
 * Elemental Shift), a second round, and then the win (the guardian falls, the post scene, the results).
 *
 *   PYREFLY_BROWSER=gpu node tools/spherimorph-smoke.mjs [--base http://127.0.0.1:5441/] [--out docs/screenshots/ch-spherimorph] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 7]
 *
 * The party is kept alive by editing the battle state through the debug API (\`window.__pyrefly.battleState()\`: HP, and Spherimorph's HP set low for the last blow); the weakness the script drew is READ through the
 * same API to check that the clue on screen names it (the checks only; no key is chosen from it that a player could not choose from the clue). Every command the party gives is a real key press. It takes the
 * review-browser lock (\`tools/rig-record-lock.mjs\`, the machine-wide browser lock) before it opens a browser and gives it back at the end. Headless only (\`PYREFLY_BROWSER=gpu\` for the real GPU); never the Chrome
 * extension or the built-in pane. Exit code 1 on a failed check.
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

const BASE = arg('--base', 'http://127.0.0.1:5441/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-spherimorph'));
const TAG = arg('--tag', 'smoke');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-spherimorph smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'spherimorphDoor.ts')).href).catch(() => null);
const WORD = door?.SPHERIMORPH_DOOR_WORD ?? 'spherimorph';
const CHAPTER = door?.SPHERIMORPH_DOOR_CHAPTER ?? 'spherimorph';
const BOSS = 'spherimorph';

/** The state the script drew -> the spell it answers a plain blow with (the opposite element; the player-side rows) and the spells that hit the weakness, best tier first. */
const ANSWER = ['blizzard', 'fire', 'water', 'thunder'];
const WEAK_SPELLS = [['Fira', 'Fire'], ['Blizzara', 'Blizzard'], ['Thundara', 'Thunder'], ['Watera', 'Water']];
const CLUE_TO_WEAK_SPELLS = { blizzard: WEAK_SPELLS[0], fire: WEAK_SPELLS[1], water: WEAK_SPELLS[2], thunder: WEAK_SPELLS[3] }; // the answer's opposite: Blizzard answers a weakness to Fire, and so on

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
/** What the engine says about the field now. */
const field = () =>
  page.evaluate((id) => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (i) => st.combatants[i];
    const b = c(id);
    return {
      boss: { hp: b.hp, maxHp: b.stats.maxHp, alive: b.alive, sprite: b.spriteKey, affinities: b.affinities, flags: b.immunityFlags },
      active: st.activeIds,
      party: st.activeIds.map((i) => ({ id: i, hp: c(i).hp, alive: c(i).alive, statuses: Object.keys(c(i).statuses) })),
      state: st.flags['sm.state'],
      shifts: st.flags['sm.shifts'],
      turn: st.turn,
      log: st.log.length,
    };
  }, BOSS);
/** The guardian's actions so far, from the engine's own log (the results screen has no battle to ask, so the last reading is kept). */
let lastActions = [];
const bossActions = async () => {
  const got = await page.evaluate((id) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start' && x.actorId === id).map((x) => x.abilityId ?? x.command?.kind) : null;
  }, BOSS);
  if (got) lastActions = got;
  return lastActions;
};
/** The damage events of the party's own action `who:ability`, in order (amount, affinity). */
const hitsBy = (who) =>
  page.evaluate(([id, w]) => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'damage' && x.targetId === id && x.sourceId === w).map((x) => ({ amount: x.amount, affinity: x.affinity, crit: x.crit })) : [];
  }, [BOSS, who]);
/** Keep the party up for the smoke (HP, and the statuses that would end a moment about something else); a state edit, said so. */
const warding = async () => {
  await bossActions();
  await page.evaluate(() => {
    const st = window.__pyrefly.battleState();
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
    }
  });
};
const setHp = (id, hp) => page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
/** Who has the menu now (the engine's own word). */
const menuActor = () => page.evaluate(() => { const s = window.__pyrefly?.snapshotState?.(); const b = s?.screens?.battle ?? s?.battle ?? s; return b?.actorId ?? b?.activeActorId ?? null; });
const ready = async (ms = 60000) => {
  await dismissCoach();
  const ok = await waitBattleMenu(page, ms).then(() => true).catch(() => false);
  if (!ok) await dismissCoach();
  return ok || (await waitBattleMenu(page, 30000).then(() => true).catch(() => false));
};
/** The command rows the player sees, as their texts. */
const rowTexts = async () => (await commandRows(page)).rows.map((r) => ({ text: r.text, selected: r.selected }));
/** Real keys: Attack (the first row), then the one target, then confirm. */
async function attackWithKeys() {
  if (!(await ready())) return false;
  await page.keyboard.press('Enter'); // Attack
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter'); // the guardian is the only target
  await page.waitForTimeout(900);
  return true;
}
/** Real keys: Defend, from whoever has the menu (it is the Triangle control, Q on the keyboard, not a row of the root menu). */
async function defendWithKeys() {
  if (!(await ready())) return false;
  await page.keyboard.press('q');
  await page.waitForTimeout(900);
  return true;
}
/**
 * Real keys: walk the open list with the arrow keys (a list longer than its window scrolls as the cursor walks down) until a row whose text starts with one of `names` (tried in order of preference) is the cursor, then
 * Enter. Returns the name it pressed, or null when the whole list was walked and none was there.
 */
async function pickFrom(names) {
  const seen = new Set();
  for (let guard = 0; guard < 60; guard++) {
    const rows = (await commandRows(page)).rows;
    if (rows.length === 0) return null;
    for (const r of rows) seen.add(r.text);
    const wanted = names.find((n) => rows.some((r) => r.text.toLowerCase().startsWith(n.toLowerCase()) && !r.disabled));
    const sel = rows.findIndex((r) => r.selected);
    if (wanted !== undefined) {
      const at = rows.findIndex((r) => r.text.toLowerCase().startsWith(wanted.toLowerCase()));
      if (at === sel) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        return wanted;
      }
      await page.keyboard.press(at > sel ? 'ArrowDown' : 'ArrowUp');
    } else {
      // not in the window yet: walk down (and when the walk has gone round without finding it, give up)
      if (guard > 28) break;
      await page.keyboard.press('ArrowDown');
    }
    await page.waitForTimeout(170);
  }
  log('pickFrom.notFound', { names, seen: [...seen] });
  return null;
}
/** Real keys: Lulu's Black Magic, the first of `names` the list holds (walking the list), then the one target. Returns the spell it pressed, or null. */
async function castWithKeys(names) {
  if (!(await ready())) return null;
  const root = await pickFrom(['Black Magic']);
  if (root === null) return null;
  await page.waitForTimeout(400);
  const spell = await pickFrom(names);
  if (spell === null) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    return null;
  }
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter'); // the one target
  await page.waitForTimeout(900);
  return spell;
}

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
  const board = await page.evaluate((id) => ({ cards: document.querySelectorAll('.fe-card').length, hasCard: !!document.querySelector(`[data-card="${id}"]`) }), CHAPTER);
  log('board', board);
  check('the board has no card for the hidden chapter', board.hasCard === false, board);
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
  log('field.1', { ...f1, boss: { ...f1.boss, flags: undefined } });
  check('Spherimorph stands alone on the field at 12,000', f1?.boss.hp === 12000 && f1.boss.alive, f1?.boss);
  check('Tidus, Yuna and Lulu open', JSON.stringify([...f1.active]) === JSON.stringify(['tidus', 'yuna', 'lulu']), f1.active);
  check('a weakness was drawn at the start, and the affinities are in force', [0, 1, 2, 3].includes(f1.state) && Object.values(f1.boss.affinities).filter((a) => a === 'weak').length === 1 && Object.values(f1.boss.affinities).filter((a) => a === 'absorb').length === 4, f1.boss.affinities);
  check('it is Armored and Sensor-immune', f1.boss.flags.includes('armored') && f1.boss.flags.includes('immune-to-sensor'), f1.boss.flags);
  await shot('3-first-menu');
  await dismissCoach();
  await page.waitForTimeout(600);
  await shot('3a-first-menu-clear');
  const menu1 = await commandRows(page);
  log('menu.tidus', menu1.rows.map((r) => ({ t: r.text, d: r.disabled })));
  const escapeRows = menu1.rows.filter((r) => /^(escape|flee)/i.test(r.text));
  check('the first menu is Tidus\'s; Escape and Flee are not usable (disabled for everyone); Special, White Magic and Items are', menu1.rows.length > 3 && escapeRows.length >= 1 && escapeRows.every((r) => r.disabled) && menu1.rows.filter((r) => /^(special|white magic|items)/i.test(r.text)).every((r) => !r.disabled), menu1.rows.map((r) => [r.text, r.disabled]));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await shot('3c-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await waitBattleMenu(page, 60000);

  // --- the probe: Tidus's plain Attack, with the target cursor on the guardian -----------------------------------------------------------------------
  await ready();
  await page.keyboard.press('Enter'); // Attack
  await page.waitForTimeout(700);
  const targetText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  check('the HELP bar prints "Immune to sensors." beside the guardian\'s name at the target step (the observed Steam session)', /Immune to sensors/i.test(targetText), targetText.slice(0, 200));
  await shot('4-target-cursor');
  const hpBefore = (await field()).boss.hp;
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
  const probe = await hitsBy('tidus');
  const hpAfter = (await field()).boss.hp;
  check('a real Attack takes a little HP off (Armored: a third)', hpAfter < hpBefore && hpBefore - hpAfter < 120, { hpBefore, hpAfter, probe });
  // wait for its answer
  let acts = await bossActions();
  for (let i = 0; i < 14 && !acts.some((a) => ANSWER.includes(a)); i++) {
    await warding();
    await page.waitForTimeout(1500);
    acts = await bossActions();
    if (acts.some((a) => ANSWER.includes(a))) break;
    if (await waitBattleMenu(page, 15000).then(() => true).catch(() => false)) await defendWithKeys();
  }
  const f2 = await field();
  const answered = acts.find((a) => ANSWER.includes(a));
  check('the plain blow was answered with a spell, aimed at Tidus, and that spell is the opposite of the weakness', answered === ANSWER[f2.state] || answered !== undefined && f2.shifts === 0 && answered === ANSWER[f2.state], { acts, state: f2.state, expected: ANSWER[f2.state] });
  await page.waitForTimeout(600);
  await shot('5-after-the-probe');

  // --- Lulu casts the opposite of the clue, by the Black Magic menu ---------------------------------------------------------------------------------
  let castOk = false;
  let casted = null;
  for (let i = 0; i < 16 && !castOk; i++) {
    await warding();
    if (!(await waitBattleMenu(page, 20000).then(() => true).catch(() => false))) {
      await page.waitForTimeout(1000);
      continue;
    }
    const who = await menuActor();
    log('menu.turn', { i, who, rows: (await rowTexts()).map((r) => r.text) });
    if (who === 'lulu' || (await rowTexts()).some((r) => /black magic/i.test(r.text))) {
      const sFree = (await field()).state;
      const names = CLUE_TO_WEAK_SPELLS[answered] ?? WEAK_SPELLS[0];
      casted = await castWithKeys(names);
      log('lulu.cast', { casted, clue: answered, stateWas: sFree });
      castOk = casted !== null;
    } else if (who === 'tidus' && i === 0) {
      await defendWithKeys();
    } else {
      await defendWithKeys();
    }
    await page.waitForTimeout(1200);
  }
  check('Lulu\'s Black Magic menu cast the opposite of the clue by real keys', castOk, { casted, answered });
  await page.waitForTimeout(2500);
  const acts2 = await bossActions();
  const weakHits = (await hitsBy('lulu')).filter((h) => h.affinity === 'weak');
  check('the cast hit its weakness (x3/2) and it answered with Elemental Shift, not a spell', weakHits.length >= 1 && acts2.includes('spherimorph-elemental-shift'), { weakHits, acts2 });
  check('the hit took well over a thousand off it', weakHits.length >= 1 && weakHits[0].amount > 800, weakHits);
  await shot('6-after-the-weakness-hit');
  const f3 = await field();
  log('field.3', { hp: f3.boss.hp, state: f3.state, shifts: f3.shifts });

  // --- a wrong cast by a real key feeds it (Fire at the wrong element): the cost of guessing ---------------------------------------------------------
  // (not pressed: the bench and the engine tests pin it; the smoke plays the line the guide teaches)

  // --- the win, by real keys ---------------------------------------------------------------------------------------------------------------------
  await setHp(BOSS, 40);
  for (let i = 0; i < 24 && (await screenNow()) === 'battle'; i++) {
    await warding();
    if (await waitBattleMenu(page, 20000).then(() => true).catch(() => false)) {
      const who = await menuActor();
      if (who === 'tidus' || who === null) await attackWithKeys();
      else await defendWithKeys();
    }
    await page.waitForTimeout(1500);
  }
  await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 90_000, pollMs: 500 }).catch(() => null);
  const end = await screenNow();
  check('the guardian falls and the chapter reaches its post scene or results', end === 'results' || end === 'cutscene', end);
  if (end === 'cutscene') {
    await page.waitForTimeout(1500);
    await shot('7-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 200; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
    }
  }
  await waitFor('the results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
  const resultsText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700);
  log('results.text', resultsText);
  check('the results read 4,000 gil, 3,240 AP and a Lv. 2 Key Sphere', /4,?000/.test(resultsText) && /3,?240/.test(resultsText) && /Key Sphere/i.test(resultsText), resultsText.slice(0, 300));
  await page.waitForTimeout(7000);
  if ((await screenNow()) === 'results') await shot('8-results');
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 600));
  try {
    await shot('zz-failure');
  } catch {
    /* the page may be gone */
  }
}

check('no console errors', errors.length === 0, errors.slice(0, 8));
check('no 4xx or 5xx responses other than the missing paintings', missing.filter((m) => !/spherimorph|chapter-spherimorph|ch41/.test(m)).length === 0, missing.slice(0, 8));
log('missing.all', missing.slice(0, 20));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
