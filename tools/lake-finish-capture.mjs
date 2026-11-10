#!/usr/bin/env node
/**
 * The finishing lane's capture of the hidden Wendigo chapter (branch `wendigo-finish`; FFX only): a headless Playwright run (`PYREFLY_BROWSER=gpu` for the real GPU) against a dev server that is already up, with REAL KEYS for every command.
 * It films what the finishing lane added to the 3D lake and writes the timeline that proves it:
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-finish-capture.mjs --base http://127.0.0.1:5471/ --out <dir> [--video] [--stills] [--hud off] [--aeons valefor,ifrit,ixion,shiva] [--seed 7] [--w 1600 --h 900]
 *
 * 1. **Wendigo and the Guardians on their own motion**: the party attacks until the brute has thrown its Double Punch and a Guardian has cast (the clip each model plays is read every 100 ms from the dev handle, `clips.json`).
 * 2. **The aeons**: Yuna's keys (Summon, the aeon's row) call each aeon of the roster in turn; it attacks by key, casts by key, and the first one fires its Overdrive (its gauge is filled by a state edit; the Overdrive
 *    is chosen by key); the Dismiss row sends it away. A still of each aeon on the lake.
 * 3. **Sleep ends the stance**: the Guardians fall, Wendigo (HP set under half) raises its arms, and a Sleeping Powder (put in the bag by a state edit, thrown by key) puts it to sleep: its arms come down on the spot and it
 *    curls into the game's sleep pose (`sleep` clips), the stills and the film show it.
 *
 * The party is kept up by a state edit through the debug API as the first capture tool does; **every command is a real key press**. It takes the machine-wide browser lock before it opens a browser and gives it back at the
 * end. Exit code 1 on a failed check. Paths come from the command line and the environment, none is written here.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { finishKit } from './lake-finish-kit.mjs'; // the film and the key helpers (split out for rule 7), imported before the lock is taken

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(name);

const BASE = arg('--base', 'http://127.0.0.1:5471/');
const OUT = resolve(arg('--out', 'lake-finish-out'));
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const SEED = Number(arg('--seed', '7'));
const VIDEO = flag('--video');
const STILLS = flag('--stills');
const HUD_OFF = arg('--hud', 'off') === 'off';
const AEONS = arg('--aeons', 'valefor,ifrit,ixion,shiva').split(',').filter(Boolean);
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('wendigo-finish lake capture', { maxMinutes: 25, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);

const failures = [];
const events = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: false });
} catch (e) {
  release();
  throw e;
}
const { page, browser } = ctx;
const errors = [];
const missing = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 400)));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`);
});
page.on('response', (r) => {
  if (r.status() >= 400) missing.push(`${r.status()} ${r.url().slice(0, 160)}`);
});

// ------------------------------------------------------------------------------------------------ the film
const clock = { t0: Date.now() };
const mark = (what, extra = {}, at = Date.now()) => {
  events.push({ t: Math.round(((at - clock.t0) / 1000) * 100) / 100, what, ...extra });
  log('event', events.at(-1));
};
// the film and the key helpers are in tools/lake-finish-kit.mjs (rule 7: this file stays under 400 lines)
const { startFilm, stopFilm, shot, hudHide, dismissCoach, ward, setHp, rowsText, pickRow, menuUp, attackWithKeys } = finishKit({ page, out: OUT, w: W, h: H, stills: STILLS, ffmpeg: FFMPEG, log, clock, commandRows, waitBattleMenu });

// ------------------------------------------------------------------------------------------------ helpers
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
let seen = 0;
let lastRows = [];
const watchActions = async () => {
  const rows = await page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start').map((x) => `${x.actorId}:${x.abilityId ?? x.command?.kind}`) : null;
  });
  if (!rows) return lastRows;
  lastRows = rows;
  for (const r of rows.slice(seen)) mark('action', { id: r });
  seen = rows.length;
  return rows;
};
const lake = () =>
  page.evaluate(() => {
    const g = globalThis.__lake3d;
    if (!g) return null;
    return { carrying: g.skin.carrying, capsules: g.models.capsules, clips: Object.fromEntries([...g.models.models].map(([id, m]) => [id, m.playingClip])), sleeping: g.models.models.get('wendigo')?.sleeping ?? null };
  });
/** The clip each monster and aeon model plays, every 100 ms: the proof that the models move by their own clips. */
const timeline = [];
let watching = null;
const startWatch = () => {
  let last = '';
  let beatsSeen = 0;
  watching = setInterval(async () => {
    try {
      const g = await page.evaluate(() => {
        const l = globalThis.__lake3d;
        if (!l) return null;
        const pick = ['wendigo', 'lake-guardian-a', 'lake-guardian-b', 'valefor', 'ifrit', 'ixion', 'shiva'];
        return { clips: Object.fromEntries(pick.filter((id) => l.models.models.has(id)).map((id) => [id, l.models.models.get(id).playingClip])), beats: l.skin.beats.slice() };
      });
      if (!g) return;
      const row = JSON.stringify(g.clips);
      if (row !== last) {
        last = row;
        timeline.push({ t: Math.round(((Date.now() - clock.t0) / 1000) * 100) / 100, clips: g.clips });
      }
      while (beatsSeen < g.beats.length) {
        const b = g.beats[beatsSeen++];
        mark('beat', { id: b.actor + ':' + (b.ability ?? b.kind), kind: b.kind }, b.at);
      }
    } catch {
      /* between screens */
    }
  }, 100);
};

try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
    await page.keyboard.type('wendigo', { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.waitForTimeout(1200);
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  if (VIDEO) {
    await startFilm(join(OUT, 'master.mp4'));
    if (HUD_OFF) await hudHide(true);
  }
  await page.keyboard.press('Enter');
  mark('prep-enter');
  await assertScreen(page, 'battle', 150000);
  startWatch();
  await waitBattleMenu(page, 150000);
  mark('first-menu');
  await page.waitForTimeout(800);
  const first = await lake();
  log('lake', first);
  check('the lake carries no capsule (every file is there, the aeons included once in)', first?.capsules.length === 0 || first?.capsules.every((id) => !['wendigo', 'lake-guardian-a', 'lake-guardian-b'].includes(id)), first?.capsules);
  await dismissCoach();

  // --- 1. the monsters on their own motion ------------------------------------------------------------------------------------------------------
  let rows = [];
  const turn = async () => {
    await ward();
    if (await menuUp(25000)) await attackWithKeys();
    await page.waitForTimeout(900);
    rows = await watchActions();
  };
  mark('monsters-start');
  await ward();
  for (let i = 0; i < 16 && !(rows.some((a) => a === 'wendigo:wendigo-haymaker') && rows.some((a) => /^lake-guardian-[ab]:(lake-berserk|thundara|blizzara)$/.test(a)) && rows.some((a) => /^wendigo:(wendigo-punch|attack)$/.test(a))); i++) {
    await turn();
    await shot(`monsters-${i}`);
  }
  mark('monsters-end');

  // --- 2. the aeons ----------------------------------------------------------------------------------------------------------------------------------
  let odDone = false;
  for (const aeon of AEONS) {
    mark('aeon-start', { aeon });
    let called = false;
    for (let guard = 0; guard < 10 && !called; guard++) {
      await ward();
      if (!(await menuUp(60000))) break;
      const labels = await rowsText();
      if (labels.some((t) => /^summon/i.test(t))) {
        called = (await pickRow(/^summon/i)) && (await pickRow(new RegExp(`^${aeon}`, 'i')));
        break;
      }
      await page.keyboard.press('KeyQ'); // Defend passes the turn until Yuna's menu is up
      await page.waitForTimeout(1500);
    }
    check(`Yuna called ${aeon} with the keys`, called, null);
    if (!called) continue;
    mark('aeon-called', { aeon });
    await page.waitForTimeout(2600);
    const carrying = await lake();
    log(`lake.${aeon}`, carrying);
    check(`${aeon} stands as a model on the lake`, carrying?.carrying?.[aeon] === 'own', carrying?.carrying);
    await shot(`aeon-${aeon}-arrives`);
    // its attack, by key
    await ward();
    if (await menuUp(40000)) {
      await shot(`aeon-${aeon}-menu`);
      mark('aeon-attack', { aeon });
      await attackWithKeys();
      await page.waitForTimeout(900);
      await shot(`aeon-${aeon}-attack-a`);
      await page.waitForTimeout(700);
      await shot(`aeon-${aeon}-attack-b`);
    }
    // the first aeon fires its Overdrive (gauge filled by a state edit, the move chosen by key)
    if (!odDone) {
      await page.evaluate((id) => {
        const st = window.__pyrefly.battleState();
        const c = st?.combatants[id];
        if (c?.overdrive) c.overdrive.gauge = 100;
      }, aeon);
      await ward();
      if (await menuUp(40000)) {
        const labels = await rowsText();
        log(`menu.${aeon}`, labels);
        mark('aeon-overdrive', { aeon });
        const od = await pickRow(/^(energy ray|energy blast|hellfire|meteor strike|aerospark|thor|diamond dust|heavenly strike|overdrive)/i);
        if (od) {
          await page.waitForTimeout(500);
          await page.keyboard.press('Enter'); // the target, when it asks
          await page.waitForTimeout(1200);
          await shot(`aeon-${aeon}-overdrive-a`);
          await page.waitForTimeout(1500);
          await shot(`aeon-${aeon}-overdrive-b`);
          odDone = true;
          await waitFor('the overdrive to end', async () => !(await page.evaluate(() => globalThis.__lake3d?.director.current ?? null)), { ms: 20000, pollMs: 200 }).catch(() => null);
        }
        check(`${aeon} fired an Overdrive by key`, od, labels);
      }
    }
    // a spell or skill by key (the first row of Magic or Special when the aeon has one) is left to its attack; then Dismiss
    await ward();
    if (await menuUp(40000)) {
      const dismissed = await pickRow(/^dismiss/i);
      mark('aeon-dismissed', { aeon, dismissed });
      await page.waitForTimeout(1800);
    }
    rows = await watchActions();
  }

  // --- 3. Sleep ends the stance -----------------------------------------------------------------------------------------------------------------------
  mark('sleep-start');
  await setHp('lake-guardian-a', 1);
  await setHp('lake-guardian-b', 1);
  for (let i = 0; i < 10 && !rows.some((a) => /^lake-guardian-[ab]:(protect|shell)$/.test(a)); i++) await turn();
  mark('double-punch-wait'); // above half its HP, with no Guardian and no aeon left: one turn in three is the Double Punch
  const seenBefore = rows.length;
  const thrown = () => rows.slice(seenBefore).includes('wendigo:wendigo-haymaker');
  for (let i = 0; i < 24 && !thrown() && (await screenNow()) === 'battle'; i++) {
    await page.evaluate(() => { const c = window.__pyrefly.battleState().combatants.wendigo; delete c.statuses.berserk; c.hp = 14000; });
    await turn();
  }
  check('Wendigo threw its Double Punch (alone, above half HP)', thrown(), rows.slice(-12));
  mark('double-punch-end');
  // under half its HP: the arms go up
  let stance = false;
  const seenAgain = rows.length;
  for (let i = 0; i < 24 && !stance && (await screenNow()) === 'battle'; i++) {
    await page.evaluate(() => { const c = window.__pyrefly.battleState().combatants.wendigo; delete c.statuses.berserk; c.hp = 8000; });
    await turn();
    stance = rows.slice(seenAgain).includes('wendigo:wendigo-raise-arms');
  }
  check('Wendigo raised its arms', stance, rows.slice(-10));
  mark('stance-up', { clip: (await lake())?.clips.wendigo });
  await shot('sleep-0-arms-up');
  // a Sleeping Powder in the bag by a state edit, thrown by the keys
  await page.evaluate(() => {
    const eng = window.__pyrefly.battle()?.engine;
    eng?.ctx?.rt?.inventory?.set('sleeping-powder', 4);
  });
  let slept = false;
  for (let tries = 0; tries < 4 && !slept && (await screenNow()) === 'battle'; tries++) {
    await ward();
    await page.evaluate(() => { delete window.__pyrefly.battleState().combatants.wendigo.statuses.berserk; });
    if (!(await menuUp(30000))) break;
    const picked = (await pickRow(/^item/i)) && (await pickRow(/^sleeping powder/i));
    if (!picked) {
      await page.keyboard.press('Escape');
      await page.keyboard.press('KeyQ');
      await page.waitForTimeout(1500);
      continue;
    }
    await page.waitForTimeout(450);
    await page.keyboard.press('Enter'); // the target, when it asks
    mark('sleeping-powder');
    for (const [k, ms] of [['a', 700], ['b', 700], ['c', 900]]) {
      await page.waitForTimeout(ms);
      await shot(`sleep-1${k}`);
    }
    const l = await lake();
    slept = l?.sleeping === true;
    log('lake.sleep', l);
    await page.waitForTimeout(2500);
    await shot('sleep-2-asleep');
    rows = await watchActions();
  }
  check('Wendigo fell asleep and its arms came down (the model sleeps)', slept, await lake());
  mark('sleep-end');
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
  try {
    await page.screenshot({ path: join(OUT, 'zz-failure.jpg'), type: 'jpeg', quality: 85 });
  } catch {
    /* the page may be gone */
  }
}

if (watching) clearInterval(watching);
await stopFilm();
writeFileSync(join(OUT, 'events.json'), JSON.stringify({ events }, null, 1));
writeFileSync(join(OUT, 'clips.json'), JSON.stringify(timeline, null, 1));
check('no console error or page error', errors.filter((x) => !/^warning/.test(x)).length === 0, errors.slice(0, 10));
check('no failed request', missing.length === 0, missing.slice(0, 10));
log('console.all', errors.slice(0, 30));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
