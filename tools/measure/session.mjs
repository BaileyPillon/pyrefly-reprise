// One game session on a VIRTUAL CLOCK, at an exact 60, 120 or 144 Hz (motion-fluidity pass, lane L5; both games, tooling). PORTED from the motion-core and curves lanes' session.mjs / rec.mjs (scratch) so the
// pass has one capture library; headless GPU Chromium, real key presses, the debug API only reads.
//
// How the clock is virtual: Playwright's fake clock (`page.clock`) replaces Date, performance.now and the timers; a manual rAF queue (installed before the game's first line) holds the game's
// requestAnimationFrame callbacks. One `tick()` advances the fake clock by one display frame's milliseconds (`frameMsFor(hz)`: 17,17,16 at 60; 8,8,9 at 120; seventeen 7s and a 6 at 144; the sums are exact, so a
// 144 Hz second is 1000 ms) and then runs the queued callbacks once with the fake `performance.now()`. The game sees a display of exactly that rate and no frame is ever late: this is the game at governor
// level 0 with the CSS timeline and the audio on real time (the caveat of CA-02: a booth at level 3 or a long-frame run is not this; the clips are evidence of the motion's SHAPE, the pace tool of its cost).
// Nothing is added to the game's page except the queue (`window.__manualRaf`, `window.__runFrame`).
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { frameMsFor } from '../../critic/runner/lib/hz-pure.mjs';

export { frameMsFor };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INIT = () => {
  // the idle sway's phases are Math.random() draws (DemoIdle.ts): a seeded generator makes two captures of one scripted moment draw the same ones when the number of draws before them is the same (review m7)
  let seed = 0x5eed1234;
  Math.random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const orig = window.requestAnimationFrame.bind(window);
  const origCancel = window.cancelAnimationFrame.bind(window);
  let manual = false;
  let id = 1000000;
  const q = new Map();
  window.requestAnimationFrame = (cb) => { if (!manual) return orig(cb); const i = ++id; q.set(i, cb); return i; };
  window.cancelAnimationFrame = (i) => { if (q.delete(i)) return; origCancel(i); };
  window.__manualRaf = (on) => { manual = on; };
  window.__runFrame = () => { const now = performance.now(); const cbs = [...q.values()]; q.clear(); for (const cb of cbs) cb(now); return cbs.length; };
};

/** Launch headless Chromium from the tree's own Playwright with the repo's launch flags (PYREFLY_BROWSER=gpu for the real GPU). */
export async function launchBrowser(root) {
  process.env.PYREFLY_BROWSER ??= 'gpu';
  const { chromium } = await import(pathToFileURL(path.join(root, 'node_modules/playwright/index.mjs')).href);
  const { currentChromiumArgs } = await import(pathToFileURL(path.join(root, 'tools/browser-mode.mjs')).href);
  return chromium.launch({ args: [...currentChromiumArgs()] });
}

/** Open the game at `base` + `query` on a fake clock with the manual rAF queue installed (not yet paused). Returns the session `g`. */
export async function openGame(browser, base, query = '', viewport = { width: 1600, height: 900 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 300)}`));
  await page.clock.install();
  await page.addInitScript(INIT);
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${base}${query}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  const g = {
    browser, context, page, consoleErrors,
    press: (k) => page.keyboard.press(k),
    scr: () => page.evaluate(() => window.__pyrefly.screen()),
    ss: () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null),
    async want(name, ms = 60000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await g.scr()) === name) return true; await page.waitForTimeout(100); } return false; },
    menu: async () => Boolean((await g.ss())?.playback?.awaitingMenu),
    brief: () => page.evaluate(() => Boolean(document.querySelector('.coach-brief'))),
  };
  return g;
}

/** Title -> chapter board -> battle -> the first command menu, with real keys, seed 1. Throws (never falls through) when a state is not reached. */
export async function reachFirstMenu(g, chapter) {
  const { page } = g;
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  if (!(await g.want('title'))) throw new Error('no title');
  await page.waitForTimeout(900);
  await g.press('Enter');
  for (let i = 0; i < 60 && !(await g.brief()) && (await g.scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  for (let i = 0; i < 24 && (await g.scr()) !== 'chapter-select'; i++) { await g.press('Enter'); await page.waitForTimeout(500); }
  if (!(await g.want('chapter-select', 10000))) throw new Error('the chapter board was not reached');
  await page.evaluate((id) => window.__pyrefly.trigger(`select:${id}`), chapter);
  await page.waitForTimeout(2200);
  const chap = (await g.ss())?.chapter;
  if (chap !== chapter) throw new Error(`the board opened ${chap}, not ${chapter}`);
  await g.press('Enter'); await page.waitForTimeout(2400);
  for (let i = 0; i < 4 && (await g.scr()) === 'cutscene'; i++) { await g.press('Enter'); await page.waitForTimeout(1500); }
  for (let holds = 0; (await g.scr()) === 'cutscene' && holds < 20; holds++) { await page.keyboard.down('Enter'); await page.waitForTimeout(4000); await page.keyboard.up('Enter'); }
  if (!(await g.want('battle', 90000))) throw new Error('the battle was not reached');
  for (let i = 0; i < 1500 && !(await g.menu()); i++) await page.waitForTimeout(40); // a short poll: every real millisecond from here to the pause is game time at an open menu
  if (!(await g.menu())) throw new Error('no first menu');
  // no settle wait here (a first version waited 2.5 s of real time): in FFX-2 the top-level command menu runs the ATB clock (the default Wait split holds it only below the top level), so each real second
  // was a second of game time and Chapter IV began from a different state every run (the 120 Hz capture of the first matrix had Bahamut acting at 1.2 s and Paine's strike 0.7 units away). The clock is paused next.
}

/** Pause the fake clock and hand the game's frames to the manual queue. After this only `tick()` moves time. */
export async function pauseClock(page) {
  for (let k = 0; k < 6; k++) {
    try { const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(new Date(now + [100, 250, 600, 1500, 3000, 6000][k])); break; } catch (e) { if (!/past/.test(String(e))) throw e; await page.waitForTimeout(300); }
  }
  await page.evaluate(() => window.__manualRaf(true));
  await page.clock.runFor(34);
  await page.clock.runFor(17);
}

/**
 * A stepper for an exact display rate: `tick(read)` advances one display frame, runs the game's frame and, when `read` (an expression string or a function) is given, returns what it read in the same evaluate.
 * `n` counts frames; `ms` is the virtual time elapsed (the sum of the steps, so 144 Hz is exact over 7 frames).
 */
export function makeStepper(page, hz) {
  const steps = frameMsFor(hz);
  const s = { hz, n: 0, ms: 0, steps };
  s.tick = async (read) => {
    const dt = steps[s.n % steps.length];
    await page.clock.runFor(dt);
    s.n++;
    s.ms += dt;
    if (!read) return page.evaluate('window.__runFrame()');
    return page.evaluate(`(() => { window.__runFrame(); return (${typeof read === 'function' ? read.toString() : read})(); })()`);
  };
  s.ticks = async (k, read) => { let last; for (let i = 0; i < k; i++) last = await s.tick(read); return last; };
  return s;
}
