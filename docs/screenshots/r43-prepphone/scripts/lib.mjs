// Shared helpers for the r43-prepphone browser proof (scratch quality, kept so the numbers can be reproduced; see ../README.md).
// Environment: PREP_WT = the repo root, PREP_BASE = the dev server (default http://127.0.0.1:5843/), PREP_OUT = where captures go, PYREFLY_BROWSER=gpu.
// Reaches a chapter's party prep the way a player does (title -> chapter select -> Enter), by real keys, in a fresh profile.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const WT = process.env.PREP_WT ?? process.cwd(); // the repo (node_modules, tools/browser-mode.mjs)
const require = createRequire(WT + '/package.json');
export const { chromium } = require('playwright');
export const sharp = require('sharp');
const { currentChromiumArgs } = await import(pathToFileURL(WT + '/tools/browser-mode.mjs').href);

export const BASE = process.env.PREP_BASE ?? 'http://127.0.0.1:5843/';
export const OUT_ROOT = process.env.PREP_OUT ?? path.join(process.cwd(), 'prep-phone-proof-out');

export async function launch() {
  return chromium.launch({ args: [...currentChromiumArgs()] });
}

/** Pin the page to the build it loaded with (HMR is off in the scratch config, this is belt and braces). */
async function pinPage(page) {
  await page.addInitScript(() => {
    const Real = window.WebSocket;
    const isHmr = (p) => p === 'vite-hmr' || (Array.isArray(p) && p.includes('vite-hmr'));
    const Stub = function (url, protocols) {
      if (!isHmr(protocols)) return new Real(url, protocols);
      return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false, send() {}, close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
    };
    Stub.prototype = Real.prototype;
    for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Stub[k] = Real[k];
    window.WebSocket = Stub;
  });
}

/**
 * Open a fresh browser context, play to the chapter's party prep by real keys, dismiss the first-run guide.
 * opts: { id, width, height, touch, dpr }
 */
export async function openPrep(browser, opts) {
  const { id, width, height, touch = false, dpr = 1 } = opts;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push('pageerror: ' + String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push('console.error: ' + m.text().slice(0, 300)); });
  await pinPage(page);
  const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
  const ss = () => page.evaluate(() => window.__pyrefly?.snapshotState?.()?.screenState ?? null);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  const want = async (s, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await scr()) === s) return true; await page.waitForTimeout(200); } throw new Error(`want ${s} got ${await scr()}`); };
  await want('title', 90000);
  await page.waitForTimeout(900);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) {
    await page.waitForTimeout(500);
    if ((await scr()) === 'chapter-select') break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await want('chapter-select');
  let found = false;
  for (const [k, n] of [['ArrowRight', 24], ['ArrowLeft', 48]]) {
    for (let i = 0; i <= n && !found; i++) {
      if ((await ss())?.selectedId === id) { found = true; break; }
      await page.keyboard.press(k);
      await page.waitForTimeout(200);
    }
    if (found) break;
  }
  if (!found) throw new Error('chapter card not found ' + id);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);
  await want('party-prep', 60000);
  await page.waitForTimeout(1500);
  const dismissed = await dismissCards(page, scr);
  await page.waitForTimeout(600);
  return { ctx, page, scr, ss, dismissed };
}

/** The first-run guide and the Sphere Grid's own first-time card sit over the board; neither is part of what is measured. */
export async function dismissCards(page, scr) {
  let pressed = 0;
  for (let i = 0; i < 6; i++) {
    const st = await page.evaluate(() => {
      const sk = document.querySelector('[data-role="firstrun-skip"]');
      let frg = false;
      if (sk) { const r = sk.getBoundingClientRect(); const cs = getComputedStyle(sk); frg = r.width > 3 && r.height > 3 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.bottom > 0 && r.top < innerHeight; }
      return { frg, coach: document.querySelectorAll('.coach-mark,.coach-brief').length, first: /FIRST TIME ON/i.test(document.querySelector('#ui')?.innerText ?? '') };
    });
    if (!st.frg && !st.coach && !st.first) return pressed;
    if (st.frg) {
      let ok = false;
      try { await page.locator('[data-role="firstrun-skip"]').first().click({ timeout: 3000 }); ok = true; } catch { ok = false; }
      if (!ok) await page.keyboard.press('Escape');
    } else if (st.coach) await page.keyboard.press('Escape');
    else await page.keyboard.press('Enter');
    pressed++;
    await page.waitForTimeout(800);
    if ((await scr()) !== 'party-prep') throw new Error('left party-prep while dismissing a card: ' + (await scr()));
  }
  return pressed;
}

export const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
export const join = (...a) => path.join(...a);
