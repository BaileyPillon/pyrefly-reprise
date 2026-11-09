#!/usr/bin/env node
/**
 * The capture tool of the hidden Wendigo chapter's 3D stage (branch `ch-wendigo`; FFX only): a headless Playwright run (`PYREFLY_BROWSER=gpu` for the real GPU) against a dev server that is already up. It opens the
 * chapter by its typed word, plays the pre scene (the opening flight) with no key, then fights with REAL KEYS to the win and the ice break, and records what the lake does:
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-capture.mjs --base http://127.0.0.1:5442/ --out <dir> [--video] [--stills] [--hud off] [--fps-only [--uncapped]] [--seed 7] [--w 1600 --h 900]
 *
 * - `--video`: one master film of the whole run at 1600 x 900 (Chrome's screencast, its JPEG frames timed onto a 30 fps ticker and piped to ffmpeg, `FFMPEG` in the environment names the binary), with `events.json`
 *   (every beat with its time in the film: the opening flight, each action of the engine's own log, the victory, the ice break) so a clip is cut by name (`--cut` below).
 * - `--stills`: a picture at each named moment (the opening's keys, the first menu, a party attack, Wendigo's blows, a Guardian's spell, the stance, the win, the ice break's stages).
 * - `--hud off`: the battle layer (`#ui`) is hidden by CSS for the film (the keys and the menu rows still work); the stills are taken both ways.
 * - `--views`: after the first menu, ten still poses of the stage (the dev handle's director holds the camera on each: the arena, the brute close, Tidus close, the mirror low, the aurora, the temple, the crystals, the shafts), the battle layer hidden.
 * - `--fps-only`: no film, no stills: the frame rate over each moment (requestAnimationFrame deltas in the page: mean, the slowest 1 percent, share of frames over 20 ms) for the opening, the fight and the break.
 * The party is kept alive by a state edit through the debug API (`window.__pyrefly.battleState()`: HP) and the enemies' HP is set for the stance and the last blows; **every command is a real key press**. It takes the
 * machine-wide browser lock (`tools/rig-record-lock.mjs`) before it opens a browser and gives it back at the end. Exit code 1 on a failed check. Paths come from the command line and the environment, none is written here.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { frameCounter } from './lake-capture-fps.mjs';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(name);

const BASE = arg('--base', 'http://127.0.0.1:5442/');
const OUT = resolve(arg('--out', 'lake-capture-out'));
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const SEED = Number(arg('--seed', '7'));
const VIDEO = flag('--video');
const STILLS = flag('--stills');
const FPS_ONLY = flag('--fps-only');
const VIEWS = flag('--views');
const HUD_OFF = arg('--hud', 'on') === 'off';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-wendigo lake capture', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);

const failures = [];
const events = [];
const fps = {};
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

/** `--uncapped`: the GPU browser with the frame-rate limit and vsync off, so the frame rate is what the page can do, not what the display allows (the headroom over 60). */
async function openUncapped() {
  const { chromium } = await import('playwright');
  const { GPU_ARGS } = await import(pathToFileURL(join(REPO, 'tools', 'browser-mode.mjs')).href);
  const browser = await chromium.launch({ args: [...GPU_ARGS, '--disable-frame-rate-limit', '--disable-gpu-vsync'] });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  return { browser, ctx: context, page };
}

let ctx;
try {
  ctx = flag('--uncapped') ? await openUncapped() : await open({ base: BASE, fresh: true, width: W, height: H, touch: false });
} catch (e) {
  release();
  throw e;
}
const { page, browser } = ctx;
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 400)));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`);
});

// ------------------------------------------------------------------------------------------------ the film
let t0 = Date.now();
const now = () => (Date.now() - t0) / 1000;
const mark = (what, extra, at = Date.now()) => {
  events.push({ t: Math.round(((at - t0) / 1000) * 100) / 100, what, ...extra });
  log('event', events.at(-1));
};
let ff = null;
let cdp = null;
let latest = null;
let ticker = null;
async function startFilm(file) {
  ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-vcodec', 'mjpeg', '-i', '-', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.stdin.on('error', () => undefined);
  cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', (f) => {
    latest = Buffer.from(f.data, 'base64');
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1, maxWidth: W, maxHeight: H });
  t0 = Date.now();
  // the film's clock is the wall clock: a tick that came late (the machine was busy) writes the frame as many times as it owes, so the film is as long as the run and an event's time is its time in the film
  let written = 0;
  ticker = setInterval(() => {
    if (!latest || !ff?.stdin.writable) return;
    const due = Math.floor(((Date.now() - t0) / 1000) * 30);
    while (written < due) {
      ff.stdin.write(latest);
      written++;
    }
  }, 8);
}
async function stopFilm() {
  if (!ff) return;
  clearInterval(ticker);
  await cdp.send('Page.stopScreencast').catch(() => undefined);
  await new Promise((r) => {
    ff.on('close', r);
    ff.stdin.end();
  });
  ff = null;
}

const shot = async (name) => {
  if (!STILLS) return;
  await page.screenshot({ path: join(OUT, `${name}.jpg`), type: 'jpeg', quality: 92 });
  log('shot', name);
};

const { framesStart, framesStop } = frameCounter(page, fps, log);

// ------------------------------------------------------------------------------------------------ the fight's helpers
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
const dismissCoach = async () => {
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
};
let seen = 0;
/** New `action-start` rows of the engine's log since the last call, as events. */
const watchActions = async () => {
  const rows = await page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    return st ? st.log.filter((x) => x.type === 'action-start').map((x) => `${x.actorId}:${x.abilityId ?? x.command?.kind}`) : null;
  });
  if (!rows) return [];
  const fresh = rows.slice(seen);
  seen = rows.length;
  for (const r of fresh) mark('action', { id: r });
  return rows;
};
const ward = () =>
  page.evaluate(() => {
    const st = window.__pyrefly?.battleState?.();
    if (!st) return;
    for (const id of st.activeIds) {
      const c = st.combatants[id];
      c.stats.maxHp = 99999;
      c.hp = 99999;
      for (const s of ['petrify', 'doom', 'sleep', 'confuse', 'berserk']) {
        c.immunities[s] = 255;
        delete c.statuses[s];
      }
    }
  });
const setHp = (id, hp) => page.evaluate(([i, h]) => { window.__pyrefly.battleState().combatants[i].hp = h; }, [id, hp]);
const lake = () => page.evaluate(() => {
  const g = globalThis.__lake3d;
  if (!g) return null;
  return { carrying: g.skin.carrying, capsules: g.models.capsules, flown: g.director.flown.slice(-6), flying: g.director.current, epilogue: g.epilogue.time, timings: g.timings, clips: Object.fromEntries([...g.models.models].map(([id, m]) => [id, m.playingClip])) };
});
async function attackWithKeys() {
  await dismissCoach();
  const ready = await waitBattleMenu(page, 60000).then(() => true).catch(() => false);
  if (!ready) return false;
  await page.keyboard.press('Enter'); // Attack
  await page.waitForTimeout(450);
  await page.keyboard.press('Enter'); // the target the cursor starts on
  await page.waitForTimeout(500);
  return true;
}
/** A background watcher: marks each flight of the camera director and the start of the ice break, and takes the opening's and the break's stills. */
let watching = null;
const startWatch = () => {
  let flown = 0;
  let beatsSeen = 0;
  let ice = false;
  let stage = 0;
  const ICE_AT = [0.4, 1.4, 2.4, 3.4, 4.4, 5.2];
  watching = setInterval(async () => {
    try {
      const g = await page.evaluate(() => { const l = globalThis.__lake3d; return l ? { flown: l.director.flown.slice(), epi: l.epilogue.time, beats: l.skin.beats.slice() } : null; });
      if (!g) return;
      while (beatsSeen < g.beats.length) { // the actions as the presenter plays them (the skin was told when each opened), at the moment they opened
        const b = g.beats[beatsSeen++];
        mark('beat', { id: b.actor + ':' + (b.ability ?? b.kind), kind: b.kind }, b.at);
      }
      while (flown < g.flown.length) {
        const name = g.flown[flown++];
        mark('flight', { name });
        if (FPS_ONLY && (name === 'opening' || name === 'win')) await framesStart(); // the frame rate over the opening flight and over the win and the break, not over the loading
        if (name === 'opening' && STILLS) [0.3, 1.5, 3.0, 4.5, 6.0].forEach((sec, k) => setTimeout(() => shot(`open-${k}`).catch(() => undefined), sec * 1000));
      }
      if (g.epi >= 0 && !ice) { ice = true; mark('ice-break'); }
      while (g.epi >= 0 && STILLS && stage < ICE_AT.length && g.epi >= ICE_AT[stage]) await shot(`ice-${ICE_AT[stage++]}`);
    } catch { /* the page may be between screens */ }
  }, 100);
};
const hudHide = async (on) => {
  await page.evaluate((hide) => {
    let s = document.getElementById('lake-capture-hide');
    if (!s) {
      s = document.createElement('style');
      s.id = 'lake-capture-hide';
      document.head.appendChild(s);
    }
    s.textContent = hide ? '#ui { visibility: hidden !important; }' : '';
  }, on);
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

  // --- the pre scene and the opening flight (no key: the scene plays itself) ---------------------------------------------------------------
  let opened = false;
  for (let i = 0; i < 400 && !opened; i++) {
    const s = await screenNow();
    if (s === 'cutscene' || s === 'battle') opened = true;
    else await page.waitForTimeout(50);
  }
  mark('pre-scene', { screen: await screenNow() });
  startWatch();
  await assertScreen(page, 'battle', 150000);
  mark('battle-screen');
  await waitBattleMenu(page, 150000);
  mark('first-menu');
  if (FPS_ONLY) await framesStop('opening-flight');
  await page.waitForTimeout(1200);
  log('lake', await lake());
  check('the lake is a 3D stage with no capsule', (await lake())?.capsules.length === 0, await lake());
  await shot('first-menu');
  if (STILLS) {
    await hudHide(true);
    await page.waitForTimeout(250);
    await shot('first-menu-nohud');
    await hudHide(HUD_OFF);
  }
  await dismissCoach();

  if (VIEWS) {
    await hudHide(true);
    const POSES = {
      'v-arena-high': [[0, 30, 30], [0, 0, -6], 50],
      'v-wendigo-close': [[4.5, 1.7, -1.5], [2.5, 2.0, -5.8], 30],
      'v-tidus-close': [[2.0, 1.4, 4.6], [0, 1.2, 1.8], 28],
      'v-party-low-mirror': [[-3, 0.7, 6], [0.8, 1.3, 0.6], 34],
      'v-aurora-wide': [[0, 1.6, 9], [0, 12, -60], 62],
      'v-temple': [[-10, 2, 0], [-22, 12, -112], 28],
      'v-crystals-fg': [[-3, 1.2, 0], [-8.8, 2.5, -3.6], 40],
      'v-ice-low-wide': [[6, 0.7, 12], [-4, 1, -20], 45],
      'v-shafts': [[0, 2, 12], [3, 14, -30], 42],
      'v-guardians': [[-1, 1.6, 3.5], [2.4, 1.4, -2.8], 34],
    };
    for (const [name, [pos, look, fov]] of Object.entries(POSES)) {
      await page.evaluate(([p, l, f]) => { void globalThis.__lake3d.director.fly({ name: 'view', keys: [{ t: 0, pos: p, look: l, fov: f }, { t: 3600, pos: p, look: l, fov: f }] }); }, [pos, look, fov]);
      await page.waitForTimeout(700);
      await shot(name);
    }
    await page.evaluate(() => globalThis.__lake3d.director.stop());
    await hudHide(HUD_OFF);
    await page.waitForTimeout(500);
  }

  // --- the fight ---------------------------------------------------------------------------------------------------------------------------
  if (FPS_ONLY) await framesStart();
  let rows = [];
  const turn = async () => {
    await ward();
    if (await waitBattleMenu(page, 25000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(900);
    rows = await watchActions();
  };
  await ward();
  mark('party-attack');
  await attackWithKeys();
  await page.waitForTimeout(250);
  await shot('party-attack-a');
  await page.waitForTimeout(500);
  await shot('party-attack-b');
  for (let i = 0; i < 14 && !(rows.some((a) => a.endsWith(':lake-berserk')) && rows.some((a) => a.startsWith('wendigo:'))); i++) {
    await turn();
    await shot(`fight-${i}`);
  }
  await shot('wendigo-and-guardian');
  // the Guardians fall (their last shields), then Wendigo stands alone under half its HP and not berserk: the stance and its counter
  await setHp('lake-guardian-a', 1);
  await setHp('lake-guardian-b', 1);
  mark('guardians-to-1');
  for (let i = 0; i < 10 && !rows.some((a) => /^lake-guardian-[ab]:(protect|shell)$/.test(a)); i++) await turn();
  await shot('guardians-fallen');
  let stance = false;
  let counter = false;
  let stanceShots = 0;
  for (let i = 0; i < 24 && !(stance && counter) && (await screenNow()) === 'battle'; i++) {
    await page.evaluate(() => { const c = window.__pyrefly.battleState().combatants.wendigo; delete c.statuses.berserk; c.hp = 8000; });
    await turn();
    stance = rows.includes('wendigo:wendigo-raise-arms');
    counter = rows.includes('wendigo:wendigo-counter-punch');
    if (stance && stanceShots < 3) await shot(`stance-${stanceShots++}`);
  }
  check('Wendigo raised its arms', stance, rows.slice(-10));
  log('stance.counter-punch', counter);
  if (FPS_ONLY) await framesStop('fight');

  // --- the win, by real keys -----------------------------------------------------------------------------------------------------------------
  await setHp('wendigo', 1);
  mark('finishing');
  for (let i = 0; i < 12 && (await screenNow()) === 'battle'; i++) {
    await ward();
    await setHp('wendigo', 1);
    if (await waitBattleMenu(page, 12000).then(() => true).catch(() => false)) await attackWithKeys();
    await page.waitForTimeout(700);
    await watchActions();
  }
  mark('won', { screen: await screenNow() });
  await waitFor('the results', async () => (await screenNow()) === 'results', { ms: 60_000, pollMs: 250 }).catch(() => null);
  if (FPS_ONLY) await framesStop('win-and-ice-break');
  mark('results', { screen: await screenNow() });
  await page.waitForTimeout(1800);
  await shot('results');
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
  try {
    await shot('zz-failure');
    await page.screenshot({ path: join(OUT, 'zz-failure.jpg'), type: 'jpeg', quality: 85 });
  } catch {
    /* the page may be gone */
  }
}

if (watching) clearInterval(watching);
await stopFilm();
writeFileSync(join(OUT, 'events.json'), JSON.stringify({ events, fps }, null, 1));
check('no console error or page error', errors.filter((x) => !/^warning/.test(x)).length === 0, errors.slice(0, 10));
log('console.all', errors.slice(0, 30));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
