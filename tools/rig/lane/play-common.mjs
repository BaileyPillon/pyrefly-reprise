/**
 * **Playing the real game headless, frame by frame** (the lane kit; the rig program, 2026-10-18). What the per-subject scripts (`lulu-moment.mjs`, `fight-virtual-lulu.mjs`, ...) each repeated:
 * open the game in headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`), reach a hidden chapter's first menu with real key presses, pause the page's clock and run it by 16 or 17 ms steps
 * (Playwright `page.clock`) so a clip is the game at an exact 60 Hz whatever else the machine is doing, and grab the canvas after every step.
 *
 * Everything the subject changes is an argument (`lane-subjects.json`): the actor id, the chapter's door word and id. Nothing here touches the repository; `repo` is only where Playwright and the
 * browser-mode helper are read from.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { frameMs, guards } from './lane-pure.mjs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait while a guard file asks for quiet (`GPU-QUIET`, `REVIEW-BROWSER`): a recording is a browser on the GPU. */
export async function waitForGuards(log, exists = fs.existsSync) {
  for (let g = guards(exists); g.length; g = guards(exists)) { log(`${g.join(' and ')} exists: waiting 60 s`); await sleep(60000); }
}

/** Launch headless Chromium from the tree's own Playwright and open the game at `base` (rig on or off), 1600 x 900, localStorage cleared. */
export async function openGame({ repo, base, rig = 'on', log = console.log, loadTimeout = 240000 }) {
  const { chromium } = await import(pathToFileURL(`${repo}/node_modules/playwright/index.mjs`).href);
  const { currentChromiumArgs } = await import(pathToFileURL(`${repo}/tools/browser-mode.mjs`).href);
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const notFound = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 400)}`));
  page.on('response', (r) => { if (r.status() >= 400) notFound.push({ url: r.url(), status: r.status() }); });
  await page.clock.install();
  await page.goto(`${base}?rig=${rig}`, { waitUntil: 'domcontentloaded', timeout: loadTimeout });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${base}?rig=${rig}&crisp=a2`, { waitUntil: 'domcontentloaded', timeout: loadTimeout });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: loadTimeout });
  log('the game is ready');
  const input = {
    press: (key) => page.keyboard.press(key),
    async hold(key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); },
  };
  const g = {
    browser, page, input, consoleErrors, notFound, log,
    scr: () => page.evaluate(() => window.__pyrefly.screen()),
    ss: () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null),
    awaitingMenu: async () => Boolean((await g.ss())?.playback?.awaitingMenu),
    brief: () => page.evaluate(() => Boolean(document.querySelector('.coach-brief'))),
    curActor: () => page.evaluate(() => window.__pyrefly.battle()?.battleEngine?.ctx?.rt?.currentActorId ?? null),
    async want(name, ms = 60000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await g.scr()) === name) return true; await page.waitForTimeout(100); } return false; },
  };
  return g;
}

/** From the title to the chapter's first command menu, by real key presses: Enter through the briefs, the door word on the board, Enter through the cutscene. Throws if the door opens another chapter. */
export async function reachFirstMenu(g, spec) {
  const { input, page } = g;
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  if (!(await g.want('title'))) throw new Error('no title');
  await page.waitForTimeout(900);
  await input.press('Enter');
  for (let i = 0; i < 60 && !(await g.brief()) && (await g.scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  for (let i = 0; i < 24 && (await g.scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(500); }
  if (!(await g.want('chapter-select', 10000))) throw new Error('the chapter board was not reached');
  for (const ch of spec.chapter.door) { await input.press(ch); await page.waitForTimeout(120); }
  await page.waitForTimeout(2200);
  const chap = (await g.ss())?.chapter;
  if (chap !== spec.chapter.id) throw new Error(`the door word opened ${chap}, not ${spec.chapter.id}`);
  await input.press('Enter'); await page.waitForTimeout(2400);
  for (let i = 0; i < 4 && (await g.scr()) === 'cutscene'; i++) { await input.press('Enter'); await page.waitForTimeout(1500); }
  for (let holds = 0; (await g.scr()) === 'cutscene' && holds < 20; holds++) await input.hold('Enter', 4000);
  if (!(await g.want('battle', 90000))) throw new Error('the battle was not reached');
  for (let i = 0; i < 300 && !(await g.awaitingMenu()); i++) await page.waitForTimeout(150);
  if (!(await g.awaitingMenu())) throw new Error('no first menu');
  await page.waitForTimeout(2500);
  const rigs = await page.evaluate(() => window.__pyrefly.rigs?.() ?? null);
  g.log('first menu is up; rigs():', JSON.stringify(rigs).slice(0, 400));
  return rigs;
}

/** Pause the page's clock (retrying while Playwright says the time is in the past); from here the game moves only when `step` runs it. */
export async function pauseClock(page) {
  for (let k = 0; k < 6; k++) {
    try { const now = await page.evaluate(() => Date.now()); await page.clock.pauseAt(new Date(now + 1500 * (k + 1))); return; } catch (e) { if (!/past/.test(String(e))) throw e; await page.waitForTimeout(300); }
  }
  throw new Error('could not pause the clock');
}

/** A canvas grabber in the page: `__grab()` returns the biggest canvas as a JPEG (base64) after the next animation frame. */
export async function installGrabber(page, quality) {
  await page.evaluate((q) => {
    const canvases = [...document.querySelectorAll('canvas')];
    const c = canvases.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const g = document.createElement('canvas');
    g.width = c.width; g.height = c.height;
    const gctx = g.getContext('2d');
    window.__grab = () => new Promise((resolve) => {
      requestAnimationFrame(() => {
        gctx.drawImage(c, 0, 0);
        g.toBlob(async (b) => {
          const buf = new Uint8Array(await b.arrayBuffer());
          let s = ''; const CH = 0x8000;
          for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
          resolve({ b64: btoa(s), w: c.width, h: c.height, canvases: canvases.length });
        }, 'image/jpeg', q);
      });
    });
  }, quality / 100);
}

/** The frame stepper: `step(shoot)` runs the clock one frame (16 or 17 ms) and, when `shoot` and recording, writes the canvas to `dir()/f<frame>.jpg` (after `onShot(frame)`). */
export function makeStepper(page, { dir, onShot, log }) {
  const s = { frame: 0, recording: true, dirOverride: null };
  s.step = async (shoot = true) => {
    const doShoot = shoot && s.recording;
    const pending = doShoot ? page.evaluate(() => window.__grab()) : null;
    await page.clock.runFor(frameMs(s.frame));
    if (pending) {
      const r = await pending;
      fs.writeFileSync(path.join(s.dirOverride ?? dir, `f${String(s.frame).padStart(4, '0')}.jpg`), Buffer.from(r.b64, 'base64'));
      if (s.frame < 3) log('grab', r.w, r.h, 'canvases', r.canvases, 'bytes', r.b64.length);
      if (onShot) await onShot(s.frame);
    }
    s.frame++;
  };
  s.steps = async (n, shoot = true) => { for (let i = 0; i < n; i++) await s.step(shoot); };
  return s;
}
