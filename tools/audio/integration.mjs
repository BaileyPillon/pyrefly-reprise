#!/usr/bin/env node
/**
 * Does the pre-rendered audio actually reach the player?
 *
 * Every other check in this folder reads files. This one runs the game in a
 * real browser and watches the network and the AudioManager's own debug
 * surface, because the failure modes that matter most are invisible to a file:
 * a manifest that never loads, a base path that 404s under the Pages prefix, a
 * cue that quietly falls back to the oscillators and sounds exactly like the
 * thing Bailey rejected, a sprite that decodes but never fires.
 *
 * It walks the real flow — title, chapter select, chapter 1, pause, resume,
 * victory — through `window.__pyrefly` (docs/DEV.md), and it finishes by
 * hiding one cue's file to prove the synthesis fallback still catches it.
 *
 *   node tools/audio/integration.mjs [--port=N] [--headed] [--keep]
 */

import { spawn } from 'node:child_process';
import { rename, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const headed = args.includes('--headed');

/** A free port in the band the orchestrator reserved for this agent. */
async function freePort(lo = 5400, hi = 5990) {
  for (let i = 0; i < 40; i++) {
    const port = lo + Math.floor(Math.random() * (hi - lo));
    const ok = await new Promise((resolve) => {
      const server = createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => server.close(() => resolve(true)));
      server.listen(port, '127.0.0.1');
    });
    if (ok) return port;
  }
  throw new Error('no free port in 5400-5990');
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const port = Number(args.find((a) => a.startsWith('--port='))?.slice(7)) || (await freePort());
console.log(`dev server on ${port}`);

const vite = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' },
);
let viteLog = '';
vite.stdout.on('data', (d) => (viteLog += d));
vite.stderr.on('data', (d) => (viteLog += d));

const baseUrl = `http://127.0.0.1:${port}/`;
await new Promise((resolve, reject) => {
  const started = Date.now();
  const poll = setInterval(async () => {
    if (Date.now() - started > 90_000) {
      clearInterval(poll);
      reject(new Error(`vite did not start:\n${viteLog}`));
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        clearInterval(poll);
        resolve();
      }
    } catch {
      /* not up yet */
    }
  }, 500);
});

const browser = await chromium.launch({
  headless: !headed,
  args: [
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--mute-audio=false',
  ],
});

let restore = null;
try {
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = [];
  const failures = [];
  const consoleErrors = [];
  page.on('response', (r) => {
    const url = r.url();
    if (/\/audio\//.test(url)) requests.push({ url, status: r.status(), at: Date.now() });
    if (r.status() >= 400) failures.push(`${r.status()} ${url}`);
  });
  page.on('requestfailed', (r) => failures.push(`failed ${r.url()}`));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 60_000 });

  // The AudioContext only exists after a gesture; the game installs unlock
  // listeners at boot, so one real key press is the whole ritual.
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.__pyrefly.setMuted(false));
  await page.waitForFunction('window.__pyrefly.audioDebug().ready === true', null, {
    timeout: 30_000,
  });

  const manifestSeen = requests.find((r) => r.url.endsWith('manifest.json'));
  check('manifest.json is fetched', !!manifestSeen && manifestSeen.status === 200,
    manifestSeen ? `HTTP ${manifestSeen.status}` : 'never requested');

  const debug0 = await page.evaluate(() => window.__pyrefly.audioDebug());
  check('manifest is installed in the AudioManager', debug0.prerendered.manifest,
    `${debug0.prerendered.cues} cues listed`);
  // Every cue the repo's manifest lists (23 since Chapter VIII's two landed, 2026-09-23).
  const listed = Object.keys(JSON.parse(await readFile(path.join(ROOT, 'public/audio/manifest.json'), 'utf8')).music).length;
  check(`all ${listed} cues are listed`, debug0.prerendered.cues === listed, `${debug0.prerendered.cues}`);
  check('sprite is listed', debug0.prerendered.sprite === true);

  // ---------------------------------------------------------------- title ---
  await page.evaluate(() => window.__pyrefly.playMusic('title'));
  await page.waitForFunction(
    "window.__pyrefly.audioDebug().tracks.find(t => t.name === 'title')?.source !== null",
    null,
    { timeout: 45_000 },
  );
  const titleSource = await page.evaluate(
    () => window.__pyrefly.audioDebug().tracks.find((t) => t.name === 'title').source,
  );
  check('title plays the pre-rendered file, not the oscillators',
    titleSource === 'prerendered', `source = ${titleSource}`);
  check('title.mp3 was fetched',
    requests.some((r) => r.url.includes('title.mp3') && r.status === 200));

  // ------------------------------------------------------- chapter select ---
  await page.evaluate(() => window.__pyrefly.chapterSelect());
  await page.waitForFunction("window.__pyrefly.screen() === 'chapter-select'", null, {
    timeout: 20_000,
  });
  await page.evaluate(() => window.__pyrefly.playMusic('chapter-select'));
  await page.waitForFunction(
    "window.__pyrefly.audioDebug().tracks.find(t => t.name === 'chapter-select')?.source === 'prerendered'",
    null,
    { timeout: 45_000 },
  );
  check('chapter-select crossfades to its own pre-rendered cue', true,
    await page.evaluate(() => window.__pyrefly.audioDebug().playing));

  // --------------------------------------------------------------- battle ---
  const sfxBefore = requests.length;
  const battleStart = Date.now();
  await page.evaluate(() => window.__pyrefly.playMusic('battle-ffx'));
  await page.waitForFunction(
    "window.__pyrefly.audioDebug().tracks.find(t => t.name === 'battle-ffx')?.source === 'prerendered'",
    null,
    { timeout: 45_000 },
  );
  const battleMs = Date.now() - battleStart;
  check('first battle cue is audible quickly on a warm cache', battleMs <= 2000,
    `${battleMs} ms`);

  // Enter the fight by firing the request and then polling from Node.
  // Entering a battle can tear the page's execution context down mid-await,
  // so nothing may be held across it: each poll is its own short evaluate,
  // and a destroyed context is retried rather than thrown.
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  await page.evaluate(() => {
    void window.__pyrefly.goto('battle');
  });
  let battleScreen = null;
  let battlePlaying = null;
  for (let i = 0; i < 100; i++) {
    const state = await page
      .evaluate(() => ({
        screen: window.__pyrefly.screen(),
        playing: window.__pyrefly.audioDebug().playing,
      }))
      .catch(() => null);
    if (state) {
      battleScreen = state.screen;
      battlePlaying = state.playing;
      if (state.screen === 'battle') break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  check('chapter 1 battle runs with audio playing', battleScreen === 'battle',
    `screen ${battleScreen}, playing ${battlePlaying ?? '-'}`);

  // If the context was replaced, the audio needs unlocking again before the
  // remaining checks mean anything.
  await page.waitForFunction('window.__pyreflyReady === true', null, { timeout: 60_000 });
  await page.keyboard.press('Enter').catch(() => {});
  await page
    .waitForFunction('window.__pyrefly.audioDebug().ready === true', null, { timeout: 30_000 })
    .catch(() => {});

  // ------------------------------------------------------------------ sfx ---
  const fired = await page.evaluate(async () => {
    const before = window.__pyrefly.audioDebug().sfx.filter((s) => s.cached).length;
    for (const key of ['Enter', 'ArrowDown', 'Escape']) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
    window.__pyrefly.playSfx('confirm');
    window.__pyrefly.playSfx('cursor-move');
    window.__pyrefly.playSfx('slash-heavy');
    await new Promise((r) => setTimeout(r, 400));
    const debug = window.__pyrefly.audioDebug();
    return {
      before,
      after: debug.sfx.filter((s) => s.cached).length,
      spriteDecoded: debug.prerendered.spriteDecoded,
      prerenderedCount: debug.sfx.filter((s) => s.prerendered).length,
    };
  });
  check('the sfx sprite is fetched and decoded', fired.spriteDecoded === true);
  check('every sfx key resolves in the sprite', fired.prerenderedCount === 134,
    `${fired.prerenderedCount} of 134`);
  check('sprite.mp3 was fetched',
    requests.some((r) => r.url.includes('sprite.mp3') && r.status === 200));

  // ------------------------------------------------------- pause / resume ---
  const pauseSource = await page.evaluate(async () => {
    window.__pyrefly.playMusic('pause');
    for (let i = 0; i < 200; i++) {
      const t = window.__pyrefly.audioDebug().tracks.find((x) => x.name === 'pause');
      if (t?.source) return t.source;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  });
  check('the pause cue is pre-rendered too', pauseSource === 'prerendered',
    `source = ${pauseSource}`);

  // `playing` only changes once the buffer is loaded and the source started,
  // so this polls rather than sleeping a guessed interval.
  const resumed = await page.evaluate(async () => {
    window.__pyrefly.playMusic('battle-ffx');
    for (let i = 0; i < 100; i++) {
      const playing = window.__pyrefly.audioDebug().playing;
      if (playing === 'battle-ffx') return playing;
      await new Promise((r) => setTimeout(r, 100));
    }
    return window.__pyrefly.audioDebug().playing;
  });
  check('resuming returns to the battle cue', resumed === 'battle-ffx', `playing ${resumed}`);

  // -------------------------------------------------------------- victory ---
  const victorySource = await page.evaluate(async () => {
    window.__pyrefly.playMusic('victory-ffx');
    for (let i = 0; i < 200; i++) {
      const t = window.__pyrefly.audioDebug().tracks.find((x) => x.name === 'victory-ffx');
      if (t?.source) return t.source;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  });
  check('victory is pre-rendered', victorySource === 'prerendered', `source = ${victorySource}`);

  // ------------------------------------------------------------- the loop ---
  // Run past a wrap and make sure nothing threw. A cue whose loopEnd sits past
  // the decoded buffer throws inside AudioBufferSourceNode rather than looping.
  const loopOk = await page.evaluate(async () => {
    const before = window.__pyrefly.audioDebug().playing;
    await new Promise((r) => setTimeout(r, 2500));
    return { before, after: window.__pyrefly.audioDebug().playing };
  });
  check('a playing cue survives being left to loop', loopOk.after === loopOk.before,
    `${loopOk.before} -> ${loopOk.after}`);

  // ----------------------------------------------------------- the net ---
  const audio404 = failures.filter((f) => /\/audio\//.test(f));
  check('nothing under /audio/ 404s', audio404.length === 0, audio404.join(', '));
  const realErrors = consoleErrors.filter(
    (e) => !/WebGL|SwiftShader|GroupMarker|Automatic fallback/i.test(e),
  );
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  // -------------------------------------------------- the fallback safety ---
  // Hide one cue's file and prove the synthesis path still makes sound. This
  // is the property the whole architecture rests on: silence is never an
  // acceptable outcome.
  const victim = path.join(ROOT, 'public/audio/music/boss-dread.mp3');
  const hidden = `${victim}.qa-hidden`;
  await rename(victim, hidden);
  restore = async () => rename(hidden, victim);
  const page2 = await context.newPage();
  const fallbackErrors = [];
  page2.on('pageerror', (e) => fallbackErrors.push(e.message));
  await page2.goto(baseUrl, { waitUntil: 'load' });
  await page2.waitForFunction('window.__pyreflyReady === true', null, { timeout: 60_000 });
  await page2.keyboard.press('Enter');
  await page2.waitForFunction('window.__pyrefly.audioDebug().ready === true', null, {
    timeout: 30_000,
  });
  const fallback = await page2.evaluate(async () => {
    const wait = async () => {
      for (let i = 0; i < 450; i++) {
        const t = window.__pyrefly.audioDebug().tracks.find((x) => x.name === 'boss-dread');
        if (t?.source) return t.source;
        await new Promise((r) => setTimeout(r, 100));
      }
      return null;
    };
    window.__pyrefly.playMusic('boss-dread');
    const source = await wait();
    // The boot flow can win the race for `currentMusic` while a synthesised
    // cue is still rendering — AudioManager drops the older request on
    // purpose. Ask again now the buffer is cached, which is instant.
    window.__pyrefly.playMusic('boss-dread');
    let playing = null;
    for (let i = 0; i < 100; i++) {
      playing = window.__pyrefly.audioDebug().playing;
      if (playing === 'boss-dread') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    return { source, playing };
  });
  check('a missing file falls back to synthesis rather than silence',
    fallback.source === 'synth', `source = ${fallback.source}`);
  check('the synthesised fallback actually plays', fallback.playing === 'boss-dread',
    `playing = ${fallback.playing}`);
  check('the fallback throws nothing', fallbackErrors.length === 0,
    fallbackErrors.slice(0, 2).join(' | '));

  await restore();
  restore = null;

  // Prove the restore worked and the pre-rendered path comes back.
  const back = await readFile(victim).then((b) => b.length);
  check('the hidden file is restored', back > 0, `${back} bytes`);
} finally {
  if (restore) await restore().catch(() => {});
  await browser.close();
  vite.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} integration checks passed`);
if (failed.length) {
  console.log('failures:');
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
