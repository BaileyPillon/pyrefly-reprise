// Library for the eye-candy settings mockups (2026-10-02). Mockup tooling, not product code.
// Headless Playwright from node only. Run with PYREFLY_BROWSER=gpu against a `vite preview` of a scratch build of main:
//   npx vite build --outDir <scratch>/dist --emptyOutDir
//   npx vite preview --outDir <scratch>/dist --port 5700 --strictPort --host 127.0.0.1
// Opens the REAL pause screen with REAL keys; the mockups are then composed by injecting DOM into that live page,
// using the game's own pause markup and classes, so the shipped stylesheet draws everything it knows how to draw.
// Frames go to ECM_OUT (default: ./out/ next to this file).
import { fileURLToPath } from 'node:url';
import { chromium } from '../../../../node_modules/playwright/index.mjs';
import { currentChromiumArgs } from '../../../../tools/browser-mode.mjs';

export const BASE = process.env.BASE ?? 'http://127.0.0.1:5700/pyrefly-reprise/';
export const HERE = fileURLToPath(new URL('./', import.meta.url));
export const OUT = process.env.ECM_OUT ?? HERE + 'out/';
export const GAMES = {
  ffx: { chapter: 'seymour-flux', label: 'FFX Chapter I' },
  ffx2: { chapter: 'ffx2-bahamut', label: 'FFX-2 Chapter IV' },
};
export const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

/** Launch, boot, start the chapter and wait for the first command menu. Returns { browser, page, errors }. */
export async function openBattle(game, size) {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext(SIZES[size]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate((id) => {
    const p = window.__pyrefly;
    p.setMuted(true);
    p.setSeed(1);
    void p.gotoChapter(id, { skipCutscenes: true, skipPrep: true });
  }, GAMES[game].chapter);
  await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 120000 });
  await page.waitForFunction(() => !!window.__pyrefly.battle()?.presenter?.pendingMenu, null, { timeout: 120000 });
  await page.waitForTimeout(1800);
  return { browser, page, errors };
}

/** Open the pause with the real Escape key and walk to the OPTIONS tab with real Q presses (the strip wraps backwards). */
export async function openOptions(page, { phone = false } = {}) {
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pause__tab', { timeout: 20000 });
  await page.waitForTimeout(900);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('.pause__tab')].map((t) => t.dataset.tab));
  const at = await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab);
  const want = tabs.indexOf('options');
  const have = tabs.indexOf(at);
  // Q is "previous tab" and wraps: the shorter way round.
  const fwd = (want - have + tabs.length) % tabs.length;
  const back = (have - want + tabs.length) % tabs.length;
  const key = back <= fwd ? 'q' : 'e';
  for (let i = 0; i < Math.min(back, fwd); i++) { await page.keyboard.press(key); await page.waitForTimeout(260); }
  await page.waitForTimeout(900);
  const now = await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab);
  if (now !== 'options') throw new Error('could not reach OPTIONS, on ' + now + ' tabs ' + tabs.join(','));
  return { tabs, from: at, presses: { key, n: Math.min(back, fwd) } };
}

export async function shot(page, name, dir = OUT + 'shots/', quality = 86) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: dir + name + '.jpg', type: 'jpeg', quality });
  console.log('shot', name);
}
