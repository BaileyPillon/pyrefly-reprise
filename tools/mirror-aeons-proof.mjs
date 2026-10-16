#!/usr/bin/env node
/**
 * The real-key proof of the hidden Mirror Aeons chapter's second phase (branch `ch-mirror-aeons`; FFX only): a headless Playwright run against a production build that is already being served, with **real keys at the
 * menus** and the advisor's line (`autoBattle('intended')`) for everything between them. It photographs, in order:
 *
 *   1. Act I's first menu (the pair, Dark Mindy and Dark Sandy, on Mushroom Rock Road);
 *   2. **Yuna's own Sisters' menu with Combine powers lit** (Yuna's keys: Summon, Cindy; the Sisters' gauges start full, so the first Sister's menu offers Combine powers), and the Delta Attack the Combine plays;
 *   3. **the seam**: the sisters going with the light, the white-out with the HUD taken off the screen, the cut into the cavern (a frame every half second, and a timeline of the HUD's opacity and `hidden` printed);
 *   4. **the heal between the acts**: Act I's last party HP and Act II's first menu, whole (HP printed in the log, the frame kept);
 *   5. **Yojimbo's menu, Pay lit** (Yuna's keys: Summon, Yojimbo), his Pay (Yuna pays 100,000 with the keys from the ladder of amounts that `engine/PayRows.ts` makes of the one Pay row; the advisor's line plays on), and **a Dark Zanmato** landing.
 *
 *   PYREFLY_BROWSER=gpu node tools/mirror-aeons-proof.mjs [--base http://127.0.0.1:5541/] [--out docs/screenshots/ch-mirror-aeons] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 2]
 *     [--entry card|word] [--scenario full|retry|zanmato]
 *
 * The chapter is LISTED (Bailey, 2026-10-15): the default entry is its CARD on the board, walked to with the arrow keys and begun with Enter (`--entry word` types `yojimbo` instead, which still works). `--scenario full` plays
 * both acts to the post scene, the results and back to the board (the card's ribbon and "1 of 19" prove the clear was recorded); `--scenario retry` loses Act II on purpose (the party only defends), takes RETRY on the
 * results screen and shows Act II re-opened on a whole party and whole aeons. `--scenario zanmato` makes the rare event CERTAIN by a nudge from the page (the foes' Zanmato byte cleared, the purse and Yojimbo's compatibility set) and plays
 * a landed Zanmato of Yuna's Yojimbo ending Act I (both sisters fall in one action, the seam plays, Act II opens) and then Act II (Dark Yojimbo falls, the post scene, the results, the board), all with real keys after the nudge.
 *
 * Every check is printed as `check.<name>`; the exit code is 1 on a failed one. Headless only (`PYREFLY_BROWSER=gpu` for the real GPU); never the Chrome extension or the built-in pane. The word that opens the chapter is
 * read from `src/app/screens/frontend/yojimboDoor.ts`, never retyped. Nothing in the fight is changed from the page: every figure comes from the engine's own state.
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
const TAG = arg('--tag', 'proof');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = flag('--touch');
const SEED = Number(arg('--seed', '2'));
const HAND_OVER = 76; // Dark Yojimbo's blade when the keys take over from the advisor (tier 2 adds 10 a turn and 2 a hit: two or three of his turns remain before the Zanmato)
const SHIELD_AT = 76; // Yuna calls Yojimbo at her first menu from then on (the advisor's own line waits for 88 and a person's turn order can skip that menu; sent in much earlier, the aeon is struck down before the blow it is there to take)
const UNTIL = arg('--until', 'end');
const ENTRY = arg('--entry', 'card');
const SCENARIO = arg('--scenario', 'full'); // 'combine' stops after the Sisters' Combine powers (a quick look), 'end' plays the whole proof
mkdirSync(OUT, { recursive: true });

const { open, assertScreen, waitBattleMenu, waitFor, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const door = await import(pathToFileURL(join(REPO, 'src', 'app', 'screens', 'frontend', 'yojimboDoor.ts')).href);
const WORD = door.YOJIMBO_DOOR_WORD;

const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  await page.screenshot({ path: p, type: 'jpeg', quality: 86 });
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
/** The engine's own state, read as the debug API gives it (nothing is written to it). */
const state = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return null;
    const c = (id) => st.combatants[id];
    const hp = (ids) => Object.fromEntries(ids.map((id) => [id, [c(id)?.hp, c(id)?.stats?.maxHp]]));
    return {
      turn: st.turn,
      outcome: st.result?.outcome ?? null,
      enemies: st.enemyIds,
      enemyHp: Object.fromEntries(st.enemyIds.map((id) => [id, c(id).hp])),
      gauges: Object.fromEntries(st.enemyIds.map((id) => [id, c(id).overdrive?.gauge ?? null])),
      active: st.activeIds,
      party: hp(st.activeIds),
      aeonId: st.aeonId,
      aeonIds: st.aeonIds ?? null,
      aeons: Object.fromEntries(['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'yojimbo', 'cindy', 'sandy', 'mindy'].map((id) => [id, c(id) ? [c(id).hp, c(id).stats.maxHp, c(id).reviveCountdown ?? 0, c(id).overdrive?.gauge ?? null] : null])),
      flags: { gil: st.flags['yojimbo:gil'], compat: st.flags['yojimbo:compatibility'] },
    };
  });
/** The engine's own event log (the debug API reads it as it stands; the proof never writes to it): its length, the actions started since an index, the damage dealt since an index. */
const logLen = () => page.evaluate(() => window.__pyrefly.battleState()?.log?.length ?? 0);
const startsSince = (from) =>
  page.evaluate(
    (n) =>
      (window.__pyrefly.battleState()?.log ?? [])
        .slice(n)
        .filter((e) => e.type === 'action-start')
        .map((e) => ({ actor: e.actorId, name: e.abilityName ?? null, id: e.abilityId ?? null })),
    from,
  );
const damageSince = (from) =>
  page.evaluate((n) => {
    const out = {};
    for (const e of (window.__pyrefly.battleState()?.log ?? []).slice(n)) if (e.type === 'damage') out[e.targetId] = (out[e.targetId] ?? 0) + e.amount;
    return out;
  }, from);
/** Wait until an action started since `from` has a name or id that matches `re`; the start, or null on a timeout. */
const waitStart = (label, re, from, ms) =>
  waitFor(label, async () => (await startsSince(from)).find((x) => re.test(`${x.name ?? ''} ${x.id ?? ''}`)) ?? false, { ms, pollMs: 60 }).catch(() => null);
/** The enemy action's name bar at the top of the screen (the HUD prints an enemy's ability name there for the span of the action; a party member's actions print none). */
const helpBar = () => page.evaluate(() => document.querySelector('[data-role="action-help"]')?.textContent?.trim() ?? '');

/** Press the row whose label matches `re` in the command stack, walking the cursor with the arrow keys (a list longer than its window scrolls as the cursor walks down); false when no such enabled row turns up. */
async function pickRow(re, { enter = true } = {}) {
  let walked = 0;
  for (let i = 0; i < 90; i++) {
    const { rows } = await commandRows(page);
    if (rows.length === 0) return false;
    const want = rows.findIndex((r) => re.test(r.text) && !r.disabled);
    const at = rows.findIndex((r) => r.selected);
    if (want >= 0 && at === want) {
      if (enter) await page.keyboard.press('Enter');
      await page.waitForTimeout(450);
      return true;
    }
    if (want < 0 && walked++ > 24) return false;
    await page.keyboard.press(want < 0 || want > at ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(160);
  }
  return false;
}
/** Every row of the open list, the window scrolled through (the cursor walks to the end and back to the top). */
async function collectRows() {
  const seen = new Map();
  for (let i = 0; i < 12; i++) {
    for (const r of (await commandRows(page)).rows) seen.set(r.text, r.disabled);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(140);
  }
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
  }
  return [...seen].map(([t, d]) => `${t}${d ? ' (greyed)' : ''}`);
}
const rowsText = async () => (await commandRows(page)).rows.map((r) => `${r.text}${r.disabled ? ' (greyed)' : ''}`);
/** Pass a turn with Defend: the triangle key, Q (the menu prints "Q DEFEND" in its corner). */
const passTurn = async () => {
  await page.keyboard.press('KeyQ');
};

/** The HUD's timeline through the seam: one entry each time the beat's name, the HUD's `hidden` or its opacity changes (read in the page every 60 ms). */
const installSeamLogger = () =>
  page.evaluate(() => {
    const out = (window.__seam = []);
    let last = '';
    setInterval(() => {
      const root = document.querySelector('.battle-midbeat');
      const hud = document.querySelector('.ffxhud');
      const op = hud ? Number(getComputedStyle(hud).opacity).toFixed(2) : 'none';
      const row = `${root ? (root.dataset.midbeat ?? '(beat)') : '-'}|hidden=${hud ? hud.hidden : 'none'}|opacity=${op}`;
      if (row !== last) {
        last = row;
        out.push({ ms: Math.round(performance.now()), row });
      }
    }, 60);
  });

try {
  // --- title to the first menu ---------------------------------------------------------------------------------------------------------------
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  if (ENTRY === 'word') {
    for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
      if (attempt > 0 && (await guideUp())) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(900);
      }
      await page.keyboard.type(WORD, { delay: 150 });
      await page.waitForTimeout(2200);
    }
  } else {
    // The card: walk the cursor with the arrow keys until the chapter's card is the selected one, then Enter.
    const board = await page.evaluate(() => ({ cards: document.querySelectorAll('.fe-card').length, strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? '' }));
    check('the board has nineteen cards and "of 19" (the chapter is listed)', board.cards === 19 && /of 19/.test(board.strip), board);
    await shot('0-board');
    let onCard = false;
    for (let i = 0; i < 40 && !onCard; i++) {
      onCard = (await page.evaluate(() => document.querySelector('.fe-card--sel')?.getAttribute('data-card') ?? null)) === 'mirror-aeons';
      if (!onCard) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
      }
    }
    check("the cursor reached the chapter's card with the arrow keys", onCard, null);
    await page.waitForTimeout(800);
    await shot('0-card');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
  }
  await assertScreen(page, 'party-prep');
  await page.waitForTimeout(1200);
  await shot('0-party-prep');
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await screenNow();
  check('begun from party prep, the intro plays first (the pre scene)', s === 'cutscene', s);
  if (s === 'cutscene') {
    await shot('0a-intro-opening');
    for (let guard = 0; s === 'cutscene' && guard < 260; guard++) {
      if (guard === 5) await shot('0b-intro-sisters');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(350);
      s = await screenNow();
    }
  }
  await assertScreen(page, 'battle', 120000);
  await page.waitForTimeout(600);
  await shot('0c-battle-start');
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  await installSeamLogger();
  const first = await state();
  log('state.act-i-first', first);
  check('Act I is the pair, Dark Mindy and Dark Sandy, both gauges at 0', first.enemies.join() === 'dark-mindy,dark-sandy' && first.gauges['dark-mindy'] === 0 && first.gauges['dark-sandy'] === 0, { enemies: first.enemies, gauges: first.gauges });
  check('the party opens as Tidus, Yuna and Lulu, in full health, with Yojimbo and the Sisters among Yuna\'s aeons', first.active.join() === 'tidus,yuna,lulu' && first.active.every((id) => first.party[id][0] === first.party[id][1]) && first.aeons.yojimbo !== null && first.aeons.cindy !== null, { party: first.party, aeons: first.aeons });
  await dismissCoach();
  await page.waitForTimeout(500);
  await shot('1-act-i-first-menu');

  if (SCENARIO === 'zanmato') {
    // --- A landed Zanmato of Yuna's Yojimbo ends each act (RE's afda2d451), in the order the engine logs it (the release driver, 2026-10-16: ko, ko, action-end, [the seam,] victory) --------------------
    // A Pay buys a Zanmato only 3 times in 64 against the game's byte 4, so the rare event is made CERTAIN by a nudge from the page: the foes' Zanmato byte is cleared on the combatants and the purse and Yojimbo's compatibility
    // are set so that a Pay of all the gil rolls one (2^22 gil, compatibility 0, hire answer 1: a motivation of exactly 80). Everything after the nudge is real keys and the engine's own rules.
    const force = () =>
      page.evaluate(() => {
        const eng = window.__pyrefly.battle()?.engine;
        if (!eng) return 'no engine';
        const st = eng.state();
        for (const id of st.enemyIds) {
          const c = st.combatants[id];
          if (c.enemy) c.enemy = { ...c.enemy, zanmatoLevel: undefined };
        }
        const rt = eng.ctx?.rt;
        if (rt) rt.gil = 4194304;
        if (rt?.yojimbo) {
          rt.yojimbo.compat = 0;
          rt.yojimbo.hire = 1;
        }
        st.flags['yojimbo:gil'] = 4194304;
        st.flags['yojimbo:compatibility'] = 0;
        return `ok gil=${rt?.gil} compat=${rt?.yojimbo?.compat}`;
      });
    const logTail = (from) =>
      page.evaluate(
        (n) =>
          (window.__pyrefly.battleState()?.log ?? [])
            .slice(n)
            .map((e) => (e.type === 'action-start' ? `action-start(${e.abilityName ?? ''})` : e.type === 'ko' ? `ko:${e.targetId}` : e.type)),
        from,
      );
    const zanmatoAct = async (label, pattern) => {
      log(`zanmato.${label}.force`, await force());
      let called = false;
      for (let guard = 0; guard < 12 && !called; guard++) {
        await waitBattleMenu(page, 60000).catch(() => null);
        const labels = await rowsText();
        if (labels.some((t) => /^summon/i.test(t))) {
          called = (await pickRow(/^summon/i)) && (await pickRow(/^yojimbo/i));
          break;
        }
        await passTurn();
        await page.waitForTimeout(1800);
      }
      check(`${label}: Yuna called Yojimbo with the keys`, called, null);
      await page.waitForTimeout(1800);
      await waitBattleMenu(page, 60000).catch(() => null);
      const menu = await rowsText();
      if (menu.some((t) => /^aeon/i.test(t))) await pickRow(/^aeon/i);
      await page.waitForTimeout(500);
      const ladder = await collectRows();
      log(`zanmato.${label}.ladder`, ladder);
      const from = await logLen();
      if (await pickRow(/^pay all$/i, { enter: false })) await page.waitForTimeout(300);
      await shot(`${label}-z0-pay-all-highlighted`);
      const paid = await pickRow(/^pay all$/i);
      check(`${label}: Yuna paid Yojimbo everything with the keys`, paid, ladder);
      for (let i = 1; i <= 16; i++) {
        await sleep(350);
        await shot(`${label}-z${String(i).padStart(2, '0')}`);
        if ((await screenNow()) !== 'battle') break;
      }
      const tail = (await logTail(from)).join(',');
      log(`zanmato.${label}.log`, tail);
      check(`${label}: the log reads Pay, Zanmato, a ko for each foe, action-end, then victory (the seam's trigger between them in Act I)`, pattern.test(tail), tail);
      return tail;
    };
    await installSeamLogger();
    await zanmatoAct('act1', /action-start\(Zanmato\),ko:dark-(mindy|sandy),ko:dark-(mindy|sandy),action-end,script-trigger,victory$/);
    // the seam, then Act II on a whole party
    await waitFor('Act II battle menu', async () => (await screenNow()) === 'battle' && (await state())?.enemies?.join() === 'dark-yojimbo,dark-daigoro', { ms: 90000, pollMs: 500 }).catch(() => null);
    await waitBattleMenu(page, 60000).catch(() => null);
    const seam = await page.evaluate(() => window.__seam ?? []);
    log('seam.timeline', seam.slice(0, 40));
    check("the seam played after the Zanmato (the sisters' beat, the HUD faded to nothing and back)", seam.some((x) => x.row.startsWith('sisters-fall')) && seam.some((x) => x.row.startsWith('sisters-fall') && x.row.endsWith('opacity=0.00')), seam.slice(0, 12));
    const act2 = await state();
    check('Act II opened on Dark Yojimbo and his dog with a whole party', act2?.enemies?.join() === 'dark-yojimbo,dark-daigoro' && act2.active.every((id) => act2.party[id][0] === act2.party[id][1]), act2?.party);
    await dismissCoach();
    await zanmatoAct('act2', /action-start\(Zanmato\),ko:dark-yojimbo,action-end,victory$/);
    // the post scene, the results and the board
    await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 60000, pollMs: 500 }).catch(() => null);
    await shot('z-post-scene');
    for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 260; guard++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2500);
    const resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 260));
    log('results.text', resultsText);
    await shot('z-results');
    check('the results read Victory', /Victory/i.test(resultsText), resultsText);
    for (let i = 0; i < 8 && (await screenNow()) !== 'chapter-select'; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1800);
    }
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => window.__pyrefly.snapshotState().save.chapters['mirror-aeons'] ?? null);
    log('board.after', after);
    check('the clear is recorded in the save', after?.cleared === true, after);
    await finish();
  }

  // --- Act I: Yuna's own Sisters, with Combine powers lit ----------------------------------------------------------------------------------------
  // Pass turns with Defend (Q) until Yuna's menu is up (Tidus has First Strike and goes first), then Summon, Cindy.
  let summoned = false;
  for (let guard = 0; guard < 8 && !summoned; guard++) {
    const labels = await rowsText();
    if (labels.some((t) => /^summon/i.test(t))) {
      log('menu.yuna', labels);
      const inSummon = await pickRow(/^summon/i);
      await page.waitForTimeout(500);
      const aeonRows = await collectRows(); // the window shows six rows; the list is longer
      log('menu.summon', aeonRows);
      check('the summon list holds Yojimbo and Cindy (the Sisters as one summon) beside the five aeons', aeonRows.some((t) => /^yojimbo/i.test(t)) && aeonRows.some((t) => /^cindy/i.test(t)) && aeonRows.some((t) => /^valefor/i.test(t)), aeonRows);
      if (inSummon && (await pickRow(/^cindy/i, { enter: false }))) {
        await shot('2-act-i-summon-list'); // the list scrolled to its end, the cursor on Cindy
        await page.keyboard.press('Enter');
        await page.waitForTimeout(450);
        summoned = true;
      }
      break;
    }
    await passTurn();
    await page.waitForTimeout(1800);
    await waitBattleMenu(page, 60000).catch(() => null);
  }
  check('Yuna called her Sisters with the keys', summoned, null);
  await page.waitForTimeout(1800);
  await waitBattleMenu(page, 60000).catch(() => null);
  const sisters = await state();
  log('state.sisters-out', { aeonId: sisters.aeonId, aeonIds: sisters.aeonIds, gauges: Object.fromEntries(['cindy', 'sandy', 'mindy'].map((id) => [id, sisters.aeons[id]?.[3] ?? null])) });
  check('all three Sisters stand on the field as one summon', JSON.stringify(sisters.aeonIds) === JSON.stringify(['cindy', 'sandy', 'mindy']), sisters.aeonIds);
  // The HUD folds a Sister's orders into one Aeon group beside Dismiss: open it, read every order, put the cursor on Combine powers.
  let menu = await rowsText();
  log('menu.sister', menu);
  let orders = menu;
  if (menu.some((t) => /^aeon/i.test(t)) && (await pickRow(/^aeon/i))) {
    await page.waitForTimeout(500);
    orders = await collectRows();
    log('menu.sister.orders', orders);
  }
  // RE's follow-up (4256d209a) carries out all eight orders: take an ordinary one with the keys first, watch the turn play out and the next menu open, then come back to Combine powers.
  const sampleLabel = orders.find((t) => !/combine|greyed|^dismiss/i.test(t));
  if (sampleLabel) {
    const fromO = await logLen();
    const esc = sampleLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pickedO = await pickRow(new RegExp(`^${esc}$`, 'i'));
    const orderStart = await waitFor('a Sister order in the log', async () => (await startsSince(fromO)).find((x) => ['cindy', 'sandy', 'mindy'].includes(x.actor)) ?? false, { ms: 25000, pollMs: 60 }).catch(() => null);
    await sleep(3500);
    const orderStarts = await startsSince(fromO);
    log('order.sample', { label: sampleLabel, starts: orderStarts });
    check(`a Sister's ordinary order ("${sampleLabel}") is taken with the keys and plays out`, pickedO && !!orderStart, { label: sampleLabel, starts: orderStarts });
    await shot('3a-act-i-sisters-order-played');
    // the next Sister's turn: pass the party's turns with Defend until a menu with the Aeon group is up, open it again
    for (let guard = 0; guard < 8; guard++) {
      await waitBattleMenu(page, 60000).catch(() => null);
      menu = await rowsText();
      if (menu.some((t) => /^aeon/i.test(t))) break;
      await passTurn();
      await page.waitForTimeout(1800);
    }
    log('menu.sister.again', menu);
    orders = menu;
    if (menu.some((t) => /^aeon/i.test(t)) && (await pickRow(/^aeon/i))) {
      await page.waitForTimeout(500);
      orders = await collectRows();
      log('menu.sister.orders.again', orders);
    }
    check('the next Sister\'s menu opened after the order (the turn passed on)', menu.some((t) => /^aeon/i.test(t)), menu);
  }
  const combineLit = orders.some((t) => /combine/i.test(t) && !/greyed/.test(t));
  check("a Sister's menu has Combine powers lit, and Dismiss beside the Aeon group", combineLit && menu.some((t) => /^dismiss/i.test(t)), { menu, orders });
  if (combineLit && (await pickRow(/combine/i, { enter: false }))) {
    await page.waitForTimeout(400);
    await shot('3-act-i-sisters-combine-lit'); // the orders open, the cursor on Combine powers
    const from = await logLen();
    const pairHp = async () => ((await state())?.enemyHp ?? {});
    const hpBefore = await pairHp();
    await page.keyboard.press('Enter');
    const delta = await waitStart('the Delta Attack in the log', /^delta attack/i, from, 25000);
    if (delta) {
      await sleep(900);
      await shot('4-act-i-delta-attack-1');
      await sleep(1100);
      await shot('4-act-i-delta-attack-2');
      await sleep(3500); // the six hits play out
    }
    const dealt = await damageSince(from);
    const hpAfter = await pairHp();
    const hpLost = ['dark-mindy', 'dark-sandy'].reduce((n, id) => n + Math.max(0, (hpBefore[id] ?? 0) - (hpAfter[id] ?? 0)), 0);
    log('delta.damage', { dealt, hpBefore, hpAfter });
    check('the Combine plays the Delta Attack: Cindy throws it, and the pair is hurt', !!delta && delta.actor === 'cindy' && ((dealt['dark-mindy'] ?? 0) + (dealt['dark-sandy'] ?? 0) > 0 || hpLost > 0), { delta, dealt, hpBefore, hpAfter });
  } else {
    await shot('3-act-i-sisters-menu');
  }
  if (UNTIL === 'combine') await finish();

  // --- Act I to its end: the advisor's line at skip speed, the last blows and the seam at normal speed ---------------------------------------------------
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('skip');
    window.__pyrefly.autoBattle('intended');
  });
  let slowed = false;
  let seamShots = 0;
  let lastSeamShot = 0;
  let seamSeen = false;
  let link2 = false;
  let actIEnd = null;
  let linkAt = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < 25 * 60_000) {
    const sc = await screenNow();
    if (sc === 'results' || sc === 'cutscene') break;
    const st = await state();
    if (st) {
      if (st.enemies.includes('dark-yojimbo')) {
        if (!link2) {
          link2 = true;
          linkAt = Date.now();
          await page.evaluate(() => {
            window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null); // stop the advisor before its first decision so the first menu of Act II is a person's
            window.__pyrefly.setBattleSpeed('normal');
          });
        }
      } else {
        actIEnd = st;
        const alive = st.enemies.filter((id) => st.enemyHp[id] > 0);
        if (!slowed && alive.length === 1 && st.enemyHp[alive[0]] < 700_000) {
          slowed = true;
          await page.evaluate(() => window.__pyrefly.setBattleSpeed('normal')); // the last blows and the seam are played, not skipped
        }
      }
    }
    const mid = await page.evaluate(() => document.querySelector('.battle-midbeat')?.dataset.midbeat ?? null);
    if (mid === 'sisters-fall') seamSeen = true;
    if (seamSeen && seamShots < 12 && Date.now() - lastSeamShot > 500) {
      lastSeamShot = Date.now();
      seamShots++;
      await shot(`5-seam-${String(seamShots).padStart(2, '0')}`);
    }
    if (link2 && Date.now() - linkAt > 3500) break;
    await sleep(120);
  }
  check('Act I was won, the seam played (the sisters\' beat) and Act II began', link2 && seamSeen, { seamSeen, seamShots });
  log('state.act-i-end', actIEnd);
  const timeline = await page.evaluate(() => window.__seam);
  log('seam.timeline', timeline);
  const inBeat = timeline.filter((e) => e.row.startsWith('sisters-fall'));
  check('the HUD went fully off the screen behind the white-out (opacity 0 inside the sisters\' beat)', inBeat.some((e) => /opacity=0\.00/.test(e.row)), inBeat.slice(0, 6));
  check('the HUD stayed away through the cut (hidden under the plate swap) and came back whole', timeline.some((e) => /hidden=true/.test(e.row)) && /hidden=false\|opacity=1\.00$/.test(timeline[timeline.length - 1]?.row ?? ''), timeline.slice(-4));

  // --- the heal between the acts, and Act II's first menu --------------------------------------------------------------------------------------------
  if (link2) {
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2500);
    const act2 = await state();
    log('state.act-ii-first', act2);
    const whole = act2.active.every((id) => act2.party[id][0] === act2.party[id][1]);
    const hurtBefore = actIEnd ? actIEnd.active.some((id) => actIEnd.party[id][0] < actIEnd.party[id][1]) || Object.values(actIEnd.aeons).some((a) => a !== null && (a[0] < a[1] || a[2] > 0)) : null;
    log('heal', { actIEndParty: actIEnd?.party ?? null, actIEndAeons: actIEnd?.aeons ?? null, actIIFirstParty: act2.party, actIIFirstAeons: act2.aeons, hurtBefore });
    check('Act II opens on a whole party (every member at full HP)', whole, act2.party);
    check('every aeon is whole at Act II\'s start, none in recovery', Object.values(act2.aeons).every((a) => a === null || (a[0] === a[1] && a[2] === 0)), act2.aeons);
    check('the gil and Yojimbo\'s compatibility carried', typeof act2.flags.gil === 'number' && typeof act2.flags.compat === 'number', act2.flags);
    check('Act II holds Dark Yojimbo and his dog', act2.enemies.join() === 'dark-yojimbo,dark-daigoro', act2.enemies);
    await dismissCoach();
    await page.waitForTimeout(500);
    await shot('6-act-ii-first-menu');

    if (SCENARIO === 'retry') {
      // Lose Act II on purpose: the party only defends. The results screen offers RETRY; Act II must re-open on a whole party and whole aeons.
      await page.evaluate(() => {
        window.__pyrefly.setBattleSpeed('skip');
        window.__pyrefly.autoBattle('defend');
      });
      await waitFor('the defeat results', async () => (await screenNow()) === 'results', { ms: 12 * 60_000, pollMs: 500 }).catch(() => null);
      await page.waitForTimeout(4000);
      const lost = await state();
      log('retry.lost', { screen: await screenNow(), outcome: lost?.outcome ?? null });
      const resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300));
      check('the party that only defends is beaten in Act II (the results screen, a defeat)', (await screenNow()) === 'results' && /defeat/i.test(resultsText), { screen: await screenNow(), text: resultsText });
      log('retry.results', resultsText);
      await shot('11-defeat-results');
      let back = false;
      for (let i = 0; i < 6 && !back; i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2500);
        const sc = await screenNow();
        if (sc === 'party-prep') await page.keyboard.press('Enter');
        if (sc === 'cutscene') for (let g = 0; g < 80 && (await screenNow()) === 'cutscene'; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
        back = (await screenNow()) === 'battle';
      }
      check('RETRY took the cavern back up (the battle screen)', back, await screenNow());
      if (back) {
        await waitBattleMenu(page, 120000).catch(() => null);
        await page.waitForTimeout(2000);
        const again = await state();
        log('retry.state', again);
        check('Act II re-opened on Dark Yojimbo and his dog, with a whole party and whole aeons (the retry is the checkpoint, not the road)', again?.enemies?.join() === 'dark-yojimbo,dark-daigoro' && again.active.every((id) => again.party[id][0] === again.party[id][1]) && Object.values(again.aeons).every((a) => a === null || (a[0] === a[1] && a[2] === 0)), { enemies: again?.enemies, party: again?.party, aeons: again?.aeons });
        await dismissCoach();
        await shot('12-retry-act-ii-first-menu');
      }
      await finish();
    }

    // --- Act II: Yojimbo's own menu, Pay lit; then the advisor pays him and a Dark Zanmato lands ----------------------------------------------------------
    // The advisor plays at skip speed until Dark Yojimbo's blade is nearly full (`HAND_OVER`); then the keys take the turns, Defending until Yuna's menu comes with his blade within a round of full (`SHIELD_AT`, the line's own
    // `SHIELD_AT_GAUGE`): Summon, Yojimbo. The advisor then pays him and Dark Yojimbo's Zanmato lands on him.
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('skip');
      window.__pyrefly.autoBattle('intended');
    });
    let near = false;
    const t1 = Date.now();
    while (Date.now() - t1 < 15 * 60_000) {
      const sc = await screenNow();
      if (sc === 'results' || sc === 'cutscene') break;
      const st = await state();
      if (st && st.gauges['dark-yojimbo'] >= HAND_OVER && st.aeonId === null) {
        await page.evaluate(() => {
          window.__pyrefly.battle()?.battlePresenter?.setAutoPlay(null);
          window.__pyrefly.setBattleSpeed('normal');
        });
        near = true;
        break;
      }
      await sleep(100);
    }
    check('Dark Yojimbo\'s blade filled (the line was stopped for a person\'s turn)', near, null);
    if (near) {
      let yojimbo = false;
      for (let guard = 0; guard < 40 && !yojimbo; guard++) {
        await waitBattleMenu(page, 60000).catch(() => null);
        const labels = await rowsText();
        const now = await state();
        if (now?.aeonId !== null) break; // an aeon is out already: nothing to call
        if (labels.some((t) => /^summon/i.test(t)) && (now?.gauges['dark-yojimbo'] ?? 0) >= SHIELD_AT) {
          if ((await pickRow(/^summon/i)) && (await pickRow(/^yojimbo/i))) yojimbo = true;
          break;
        }
        await passTurn();
        await page.waitForTimeout(1500);
      }
      check('Yuna called Yojimbo with the keys', yojimbo, null);
      await page.waitForTimeout(1800);
      await waitBattleMenu(page, 60000).catch(() => null);
      const ymenu = await rowsText();
      log('menu.yojimbo', ymenu);
      const st = await state();
      // The HUD folds his Pay into the Aeon group beside Dismiss (as it does a Sister's orders): open the group, put the cursor on Pay.
      let payRows = ymenu;
      if (ymenu.some((t) => /^aeon/i.test(t)) && (await pickRow(/^aeon/i))) {
        await page.waitForTimeout(500);
        payRows = await collectRows();
        log('menu.yojimbo.group', payRows);
      }
      check('Yojimbo is on the field with Pay lit in his Aeon group and Dismiss beside it', st.aeonId === 'yojimbo' && payRows.some((t) => /^pay/i.test(t) && !/greyed/.test(t)) && ymenu.some((t) => /^dismiss/i.test(t)), { aeon: st.aeonId, menu: ymenu, group: payRows });
      // The Pay ladder (`engine/PayRows.ts`): one row per round amount the party can pay and a last one for all of it, in the Aeon group beside Dismiss.
      check('the Aeon group is a ladder of payments with the amounts filled (Pay 100,000 and Pay all)', payRows.some((t) => /^pay 100,000$/i.test(t)) && payRows.some((t) => /^pay all$/i.test(t)), { group: payRows });
      if (await pickRow(/^pay 100,000$/i, { enter: false })) await page.waitForTimeout(400);
      await shot('7-act-ii-yojimbo-pay-menu');
      // Yuna pays him 100,000 with the keys (the cursor is on the row); then the advisor's line plays the rest, and a Dark Zanmato lands.
      const before = st.flags;
      const from = await logLen();
      const picked = await pickRow(/^pay 100,000$/i);
      check('Yuna paid Yojimbo 100,000 with the keys', picked, null);
      const pay = await waitStart('Pay in the log', /\bpay\b/i, from, 40000);
      if (pay) {
        await sleep(700);
        await shot('8-act-ii-yojimbo-pays');
      }
      const afterPay = await state();
      log('pay.starts', await startsSince(from));
      check("Yojimbo is paid exactly what the row said (the party's gil went down by 100,000)", !!pay && afterPay.flags.gil === before.gil - 100_000, { before, after: afterPay.flags });
      await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
      const zanLog = await waitStart("Dark Yojimbo's Zanmato in the log", /zanmato/i, from, 90000);
      // The enemy's ability name is on the HUD's top bar for the span of the action: read it as it plays.
      const zan = zanLog ? await waitFor('Zanmato on the top bar', async () => /zanmato/i.test(await helpBar()), { ms: 20000, pollMs: 40 }).catch(() => null) : null;
      if (zanLog) {
        await shot(zan ? '9-act-ii-dark-zanmato' : '9-act-ii-dark-zanmato-late');
        await sleep(2500);
        await shot('10-act-ii-after-zanmato');
      }
      check('a Dark Zanmato lands (named on the top bar while it plays)', !!zanLog && zanLog.actor === 'dark-yojimbo' && !!zan, { zanLog, bar: await helpBar() });
    }
    await page.evaluate(() => {
      window.__pyrefly.setBattleSpeed('skip');
      window.__pyrefly.autoBattle('intended');
    });
    await waitFor('the post scene or the results', async () => ['results', 'cutscene'].includes(await screenNow()), { ms: 15 * 60_000, pollMs: 500 }).catch(() => null);
    const end = await screenNow();
    const last = await state();
    log('end', { screen: end, outcome: last?.outcome ?? null, enemyHp: last?.enemyHp ?? null });
    let wonText = false;
    if (end === 'cutscene' || end === 'results') {
      if (end === 'cutscene') {
        await page.waitForTimeout(1500);
        await shot('11-post-scene');
        for (let guard = 0; (await screenNow()) === 'cutscene' && guard < 260; guard++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(350);
        }
        await waitFor('results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 500 }).catch(() => null);
      }
      await page.waitForTimeout(7000);
      if ((await screenNow()) === 'results') {
        await shot('12-results');
        const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400));
        log('results.text', text);
        wonText = /Victory/i.test(text);
      }
      for (let i = 0; i < 8 && (await screenNow()) !== 'chapter-select'; i++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1800);
      }
      check('the results lead back to the board', (await screenNow()) === 'chapter-select', await screenNow());
      await page.waitForTimeout(3500);
      const after = await page.evaluate(() => ({
        record: window.__pyrefly.snapshotState().save.chapters['mirror-aeons'] ?? null,
        strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
        ribbon: !!document.querySelector('[data-card="mirror-aeons"] .fe-card__ribbon'),
        pip: [...document.querySelectorAll('.cs-pip.is-lit')].map((e) => e.textContent),
      }));
      log('board.after', after);
      check('the clear is recorded in the save like every listed chapter\'s, and the board shows the ribbon and "1 of 19"', after.record?.cleared === true && after.record.attempts >= 1 && after.ribbon && /^1\s*of 19/.test(after.strip), after);
      await shot('13-board-cleared');
    }
    check('Act II is won: the post scene and the results (Victory) follow', (end === 'results' || end === 'cutscene') && wonText, { end, wonText });
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

/** The last two checks, the browser closed, the verdict printed; the exit code is 1 when a check failed. */
async function finish() {
  check('no console errors', errors.length === 0, errors.slice(0, 5));
  check('no 4xx or 5xx responses', missing.length === 0, missing.slice(0, 5));
  await browser.close();
  if (failures.length > 0) {
    console.log('FAILED', JSON.stringify(failures));
    process.exit(1);
  }
  console.log('OK');
  process.exit(0);
}
await finish();
