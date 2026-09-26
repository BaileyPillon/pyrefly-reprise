// Shared helpers for the accessibility options-round captures.
// Real frames of the LIVE build (no local server): headless Chromium on the GPU.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

export const LIVE = 'https://baileypillon.github.io/pyrefly-reprise/';
export const DIR = fileURLToPath(new URL('./', import.meta.url));
export const FRAMES = DIR + 'frames/';
mkdirSync(FRAMES, { recursive: true });

export const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

export async function open(size) {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext(SIZES[size]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', String(e)));
  await page.goto(LIVE, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  await page.evaluate(() => { window.__pyrefly.setMuted(true); window.__pyrefly.setSeed(1); });
  return { browser, page };
}

export async function frames(page, n) {
  await page.evaluate(async (k) => { for (let i = 0; i < k; i++) await window.__pyrefly.frame(); }, n);
}

/** Chapter 1 to its first command menu, one-time hint dismissed, guide + advisor closed. */
export async function toMenu(page, chapter = 'seymour-flux') {
  await page.evaluate((id) => { window.__pyrefly.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 2000; i++) {
      await window.__pyrefly.frame();
      const s = document.querySelector('.ig-cmd-stack');
      if (s && !s.hidden && s.getBoundingClientRect().height > 0) return true;
    }
    return false;
  });
  if (!ok) throw new Error('no command menu');
  await page.waitForTimeout(600);
}

export async function pauseTo(page, tab) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await page.evaluate((t) => document.querySelector(`.pause__tab[data-tab="${t}"]`)?.click(), tab);
  await page.waitForTimeout(900);
}

export async function shot(page, name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: FRAMES + name + '.png' });
  console.log('shot', name);
}
