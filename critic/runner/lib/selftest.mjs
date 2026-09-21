// Self-test for the critic capture harness (PR-0059, CHK-016).
//
// Builds the app and serves it with `vite preview` — the same way every real
// deep review serves its subject (critic/runner/deep.js: "build it into
// dist-gate ... serve it with vite preview"), never `vite dev`: dev mode's
// dependency pre-bundler can force a full-page reload the first time a route
// this test needs (chapter/battle code, never touched by the boot screen) is
// requested, which destroys the execution context mid-evaluate and has
// nothing to do with the harness bug this test exists to catch.
//
// Drives one chapter to a real command menu using the debug API's fast path,
// then proves the three things PR-0059 found broken actually work end to end:
//   1. commandRows / assertMenuRows see the real `.ig-cmd` rows (not the
//      selector round-06's play.mjs watched, which matched nothing).
//   2. assertScreen reads back a real 'pause' after Escape (not an assertion
//      that names a state nobody read, the round-06 supp.mjs `dark` bug).
//   3. audioDebug's real `playing` field is readable (not the `music` /
//      `currentTrack` / `track` guesses gap-audio.mjs used to read).
// Every one of these is written to THROW if it does not hold, per this same
// fix's CHK-016 rule for the library itself: a self-test that quietly passes
// on a broken assumption is the same failure this whole fix exists for.
//
// This is a HARNESS test, not a capture: using window.__pyrefly.gotoChapter's
// debug fast path here is fine (nothing produced by this script is ever
// critic evidence, and the build goes to a scratch dir, never the shared
// dist/). A real round's play.mjs/supp.mjs must still use only real
// Playwright input (CHK-015).
//
// Usage: node critic/runner/lib/selftest.mjs
// Budget: 90 seconds wall clock, build and server start included. Exits
// non-zero (and prints why) on any failure or if the budget is blown.
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';
import { assertScreen, assertMenuRows, waitFor } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const BUDGET_MS = 90000;
// Pick a port unlikely to collide with another agent's dev server (5173,
// 5190) or preview server (5400-5990) in this shared tree.
const PORT = 6100 + (process.pid % 400);
const BASE = `http://127.0.0.1:${PORT}/pyrefly-reprise/`;
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
// Scratch build, outside the repo entirely — never critic's or the shared
// tree's dist/, and cleaned up in `finally` regardless of outcome.
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'pyrefly-selftest-'));

function log(...a) {
  console.log('[selftest]', ...a);
}

async function waitForServer(url, ms) {
  const t0 = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() - t0 > ms) throw new Error(`ASSERT-FAIL preview server did not answer ${url} within ${ms}ms`);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

const t0 = Date.now();
let preview = null;
let browser = null;
let failure = null;

try {
  log('building into', OUT_DIR);
  // Calling vite's bin script with `node` directly (not `npx`/`npm run
  // build`) keeps this off a shell wrapper, so the later preview server's
  // PID is the real process — stoppable by its own PID per the shared-tree
  // rule, not a `.cmd` wrapper that leaves the port held after `.kill()`.
  const build = spawnSync(process.execPath, [VITE_BIN, 'build', '--outDir', OUT_DIR, '--emptyOutDir'], { cwd: ROOT, encoding: 'utf8' });
  if (build.status !== 0) {
    throw new Error(`ASSERT-FAIL build failed (exit ${build.status})\n${(build.stdout || '') + (build.stderr || '')}`.slice(0, 4000));
  }
  log('built in', Date.now() - t0, 'ms');

  preview = spawn(process.execPath, [VITE_BIN, 'preview', '--outDir', OUT_DIR, '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let previewOut = '';
  preview.stdout.on('data', (d) => { previewOut += d.toString(); });
  preview.stderr.on('data', (d) => { previewOut += d.toString(); });
  try {
    await waitForServer(BASE, 20000);
  } catch (e) {
    throw new Error(`${e.message}\n--- preview output ---\n${previewOut.slice(-2000)}`);
  }

  browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => log('pageerror', String(e).slice(0, 300)));
  await page.goto(BASE);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30000 });

  // Fast path to a battle with a real, live command menu. gotoChapter's own
  // promise does not resolve until the chapter ENDS (it needs a player
  // decision at the menu, which nothing here provides), so this must not be
  // awaited — fire it and poll screen()/awaitingMenu separately below.
  await page.evaluate(() => { void window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true, speed: 'skip' }); });
  await assertScreen(page, 'battle', 30000);
  await waitFor(
    'command menu open',
    async () => {
      const json = await page.evaluate(() => JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {}));
      return /"awaitingMenu":true/.test(json);
    },
    { ms: 30000 },
  );

  // --- 1. real command rows ---------------------------------------------
  const rows = await assertMenuRows(page, { context: 'selftest battle menu' });
  if (rows.length < 1) {
    throw new Error(`ASSERT-FAIL expected at least one command row on an open menu, got ${rows.length}`);
  }
  log('rows OK:', rows.map((r) => r.text).join(', '));

  // --- 2. a real pause read-back ------------------------------------------
  await page.keyboard.press('Escape');
  const pauseScreen = await assertScreen(page, 'pause', 10000);
  log('pause OK:', pauseScreen);
  await page.keyboard.press('Escape');
  await assertScreen(page, 'battle', 10000);

  // --- 3. real audio state --------------------------------------------
  const audioState = await waitFor(
    'audioDebug() has a playing field',
    async () => {
      const d = await page.evaluate(() => window.__pyrefly.audioDebug());
      return Object.prototype.hasOwnProperty.call(d, 'playing') ? d : false;
    },
    { ms: 10000 },
  );
  log('audio OK: playing =', JSON.stringify(audioState.playing));

  log('ALL CHECKS PASSED in', Date.now() - t0, 'ms');
} catch (e) {
  failure = e;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (preview) preview.kill();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}

const elapsed = Date.now() - t0;
if (elapsed > BUDGET_MS) {
  console.error(`[selftest] exceeded its ${BUDGET_MS}ms budget (took ${elapsed}ms) — that is itself a self-test failure.`);
  process.exitCode = 1;
}
if (failure) {
  console.error('[selftest] FAILED:', failure.stack || String(failure));
  process.exitCode = 1;
}
