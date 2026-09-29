// Route driver: the browser context and the evidence it leaves behind.
//
// Promoted from critic/rounds/round-13/cap/{lib,route}.mjs by batch t1-b5 of the
// thresholds program (docs/plans/thresholds-program-2026-09-26.md, "Batch 5"):
//   - evidence contexts (round 13 could only say "keyboard at 1600x900"): a touch
//     context (hasTouch, isMobile, rows and reticles chosen with page.tap), a
//     gamepad shim (navigator.getGamepads from an init script, standard mapping,
//     the same PAD_MAP src/app/Input.ts reads), reduce-motion (emulateMedia), a
//     per-run audioDebug file (every sample whole, no 4,000-character cut) and a
//     dialogue-box timeline for scene walks;
//   - PR-0213: a capture's `asserted` names the state a helper read back in the
//     same breath as the CHK-016 stale-root read, so staleRoots.screen and the
//     asserted screen can never disagree; a capture whose wanted state was not
//     reached says UNVERIFIED instead of pretending.
// Both games: shared critic plumbing. No product code lives here.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

import { currentChromiumArgs, resolveBrowserMode } from '../../../tools/browser-mode.mjs';
import { dboxStep } from './route-pure.mjs';
import { ensure, makeIndexer } from './lib.mjs';

export const MODE = resolveBrowserMode();

/** Keyboard key -> standard-gamepad button index (src/app/Input.ts PAD_MAP). */
export const PAD_BUTTON = Object.freeze({ Enter: 0, Escape: 1, ArrowUp: 12, ArrowDown: 13, ArrowLeft: 14, ArrowRight: 15 });

/** Init script: one virtual standard-mapping pad the harness presses through `window.__routePad`. */
function gamepadShim() {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  const pad = { id: 'route virtual pad (standard mapping)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0, vibrationActuator: null };
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
  window.__routePad = {
    set(i, down) {
      buttons[i] = { pressed: down, touched: down, value: down ? 1 : 0 };
      pad.timestamp = performance.now();
    },
  };
  window.addEventListener('load', () => {
    try {
      const ev = new Event('gamepadconnected');
      Object.defineProperty(ev, 'gamepad', { value: pad });
      window.dispatchEvent(ev);
    } catch {
      /* the poll still sees the pad */
    }
  });
}

/**
 * Init script: record every dialogue line the player is shown, with its speaker and screen.
 * PR-0225 (round 15): only a box that is really showing counts (`.dbox.dbox--visible`; the
 * old fallback read the hidden `.dbox` and timed a box nobody saw), and every show is its
 * own entry: the merge rule is `dboxStep` (route-pure.mjs, injected here by source), so a
 * line that repeats, or one that starts with the previous line's words, is a new entry and
 * the typewriter growing is not. A MutationObserver reads the box on every change besides
 * the 100 ms poll, so the empty frame between two lines is never missed.
 */
function dboxRecorder(dboxStep) {
  const mem = { lines: [], seen: null };
  window.__routeDbox = mem.lines;
  const read = () => {
    const box = document.querySelector('.dbox.dbox--visible');
    const win = box?.querySelector('.dbox__win');
    if (!box || box.closest('[hidden]') || Math.max(box.getBoundingClientRect().height, win?.getBoundingClientRect().height ?? 0) < 2) return null;
    const img = box.querySelector('.dbox__portrait img');
    return {
      speaker: (box.querySelector('.dbox__speaker')?.textContent ?? '').trim(),
      role: (box.querySelector('.dbox__role')?.textContent ?? '').trim(),
      text: ((box.querySelector('.dbox__text') ?? box.querySelector('.dbox__body'))?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      portrait: img ? (img.currentSrc || img.src || '').split('/').slice(-1)[0] : null,
      narrate: box.classList.contains('dbox--narrate'),
    };
  };
  const sample = () => {
    let screen = null;
    try { screen = window.__pyrefly?.screen?.() ?? null; } catch { screen = null; }
    dboxStep(mem, read(), Math.round(performance.now()), screen);
  };
  setInterval(sample, 100);
  const start = () => new MutationObserver(sample).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
}

/**
 * Opens the page for one route with the evidence contexts asked for.
 * `contexts` goes into run.json as the proof each one was used.
 */
export async function openRoute({ base, width, height, touch = false, gamepad = false, reduceMotion = false, fresh = true }) {
  if (!base) throw new Error('openRoute({ base }) needs the URL the subject is served on.');
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch,
    reducedMotion: reduceMotion ? 'reduce' : 'no-preference',
  });
  if (gamepad) await ctx.addInitScript(gamepadShim);
  await ctx.addInitScript({ content: `(${dboxRecorder})(${dboxStep});` });
  const page = await ctx.newPage();
  if (reduceMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  const consoleErrors = [];
  const notFound = [];
  const htmlImages = [];
  const net = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 400)}`));
  page.on('response', (r) => {
    if (r.status() >= 400) notFound.push({ url: r.url(), status: r.status() });
    const ct = r.headers()['content-type'] || '';
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav)(\?|$)/i.test(r.url()) && ct.includes('text/html')) htmlImages.push({ url: r.url(), ct });
  });
  page.on('request', (r) => { if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav|m4a)(\?|$)/i.test(r.url())) net.push(r.url().replace(base, '')); });
  if (fresh) {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked storage */ } });
  }
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  const contexts = {
    viewport: `${width}x${height}`,
    touch: touch ? { hasTouch: true, isMobile: true, taps: 0, tapped: [], keyboardFallbacks: 0 } : null,
    gamepad: gamepad
      ? { shim: 'navigator.getGamepads init script, one standard-mapping pad', presses: 0, byButton: {}, keyboardFallbacks: {}, padSeenByPage: await page.evaluate(() => (navigator.getGamepads?.() ?? []).filter(Boolean).length) }
      : null,
    reduceMotion: reduceMotion
      ? { emulated: 'reducedMotion=reduce (context and emulateMedia)', matchMedia: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), saveSetting: await page.evaluate(() => window.__pyrefly?.snapshotState?.()?.save?.settings?.reduceMotion ?? null) }
      : null,
  };
  return { browser, ctx, page, consoleErrors, notFound, htmlImages, net, contexts };
}

/**
 * The route's one input path. Keyboard by default; with the gamepad shim, the
 * keys the pad has go through the pad (the rest are counted as keyboard
 * fallbacks); with touch, `tap` is used for rows and reticles by the caller.
 */
export function makeInput(page, contexts) {
  const pad = contexts.gamepad;
  const padSet = (i, down) => page.evaluate(([b, d]) => window.__routePad?.set(b, d), [i, down]);
  return {
    async press(key) {
      if (pad && key in PAD_BUTTON) {
        const b = PAD_BUTTON[key];
        await padSet(b, true);
        await page.waitForTimeout(90);
        await padSet(b, false);
        await page.waitForTimeout(40);
        pad.presses++;
        pad.byButton[key] = (pad.byButton[key] ?? 0) + 1;
        return;
      }
      if (pad) pad.keyboardFallbacks[key] = (pad.keyboardFallbacks[key] ?? 0) + 1;
      if (contexts.touch) contexts.touch.keyboardFallbacks++;
      await page.keyboard.press(key);
    },
    /** Open the pause: Escape on a keyboard, Start (button 9, src/app/Input.ts PAD_MAP) on the pad. */
    async pause() {
      if (pad) {
        await padSet(9, true);
        await page.waitForTimeout(90);
        await padSet(9, false);
        await page.waitForTimeout(40);
        pad.presses++;
        pad.byButton.Start = (pad.byButton.Start ?? 0) + 1;
        return;
      }
      if (contexts.touch) contexts.touch.keyboardFallbacks++;
      await page.keyboard.press('Escape');
    },
    async hold(key, ms) {
      if (pad && key in PAD_BUTTON) {
        await padSet(PAD_BUTTON[key], true);
        await page.waitForTimeout(ms);
        await padSet(PAD_BUTTON[key], false);
        pad.presses++;
        return;
      }
      if (contexts.touch) contexts.touch.keyboardFallbacks++;
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
    },
    /** Touch only: tap the element (a real touch event through Playwright). */
    async tap(locator, what) {
      try {
        await locator.tap({ timeout: 5000 });
      } catch (e) {
        // A layer over the control takes the touch: a finding for the report, then the caller falls back to a key.
        const m = /from <([^>]*)>[^\n]*intercepts pointer events/.exec(String(e));
        (contexts.touch.blocked ??= []).push({ what, by: m ? m[1].slice(0, 160) : String(e).split('\n')[0].slice(0, 160) });
        return false;
      }
      contexts.touch.taps++;
      if (contexts.touch.tapped.length < 400) contexts.touch.tapped.push(what);
      return true;
    },
  };
}

/** CHK-016: no orphaned screen roots, read together with the screen and the menu state. */
export function readScreenState(page) {
  return page.evaluate(() => {
    const p = window.__pyrefly;
    const snap = p?.snapshotState?.();
    return {
      screen: p?.screen?.() ?? null,
      roots: [...document.querySelectorAll('#ui > [data-screen]')].map((e) => e.getAttribute('data-screen')),
      titleRoots: document.querySelectorAll('.ig-title-screen').length,
      awaitingMenu: snap?.screenState?.playback?.awaitingMenu === true,
      targeting: (p?.targeting?.()?.selection ?? null) !== null || document.querySelectorAll('[data-target-id]').length > 0,
      links: snap?.screenState?.links ?? null,
    };
  });
}

/**
 * PR-0213: shoot, then record what was actually on screen. `want` is the state
 * the caller needs ({ screen, awaitingMenu, targeting }); every wanted field is
 * compared with the read taken with the stale roots, and `asserted` is written
 * from that read: `screen=<actual> ...` when it matches, `UNVERIFIED ...` when
 * it does not. `asserted`'s screen and `staleRoots.screen` are one read.
 */
export function makeSnap({ page, evidence, dir, meta, fails, jpeg = false }) {
  const addIndex = makeIndexer(evidence);
  return async function snap(name, state, want = {}, extra = {}) {
    const file = jpeg ? name.replace(/\.png$/i, '.jpg') : name;
    const rel = `${dir}/${file}`;
    const full = path.join(evidence, rel);
    ensure(path.dirname(full));
    try {
      await page.screenshot({ path: full, ...(/\.jpe?g$/i.test(file) ? { type: 'jpeg', quality: 80 } : {}) });
      const now = await readScreenState(page);
      const misses = Object.entries(want).filter(([k, v]) => now[k] !== v).map(([k, v]) => `${k} wanted ${v} got ${now[k]}`);
      const parts = [`screen=${now.screen}`];
      if ('awaitingMenu' in want) parts.push(`awaitingMenu=${now.awaitingMenu}`);
      if ('targeting' in want) parts.push(`targeting=${now.targeting}`);
      if ('links' in want) parts.push(`links=${now.links}`);
      const asserted = misses.length ? `UNVERIFIED (${misses.join('; ')}) ${parts.join(' ')}` : parts.join(' ');
      if (misses.length) fails.push({ file, unverified: misses });
      addIndex({ file: rel, ...meta, state, asserted, verified: misses.length === 0, ...extra, staleRoots: { roots: now.roots, titleRoots: now.titleRoots, screen: now.screen } });
      return !misses.length;
    } catch (e) {
      fails.push({ file, err: String(e).slice(0, 300) });
      return false;
    }
  };
}

/** Per-run audioDebug file: one JSON line per sample, whole (round 13 cut each at 4,000 characters). */
export function makeAudioLog(page, file, t0) {
  ensure(path.dirname(file));
  fs.writeFileSync(file, '');
  let n = 0;
  const sample = async (at) => {
    let d = null;
    let err = null;
    try {
      d = await page.evaluate(() => window.__pyrefly?.audioDebug?.() ?? null);
    } catch (e) {
      err = String(e).slice(0, 200);
    }
    fs.appendFileSync(file, `${JSON.stringify({ at, ms: Date.now() - t0, ...(err ? { err } : { d }) })}\n`);
    n++;
    return d;
  };
  sample.count = () => n;
  return sample;
}

/** The dialogue lines recorded since boot (see dboxRecorder). */
export function readDboxTimeline(page) {
  return page.evaluate(() => (window.__routeDbox ?? []).slice()).catch(() => []);
}
