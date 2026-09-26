// Shared helpers for the B1 spell-effects options round (2026-09-26).
// Real frames of the LIVE build (no local server): headless Chromium on the GPU.
// Scratch output goes to SPELLFX_SCRATCH (C: temp by default: D: was full on 2026-09-26).
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

export const LIVE = 'https://baileypillon.github.io/pyrefly-reprise/';
export const DIR = fileURLToPath(new URL('./', import.meta.url));
export const SCRATCH = (process.env.SPELLFX_SCRATCH ?? 'C:/Users/Administrator/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/spellfx').replaceAll('\\', '/') + '/';
export const FRAMES = SCRATCH + 'frames/';
mkdirSync(FRAMES, { recursive: true });

export const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

export async function open(size = 'desk', video) {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ ...SIZES[size], ...(video ? { recordVideo: { dir: video, size: SIZES[size].viewport } } : {}) });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', String(e)));
  await page.goto(LIVE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate(() => { window.__pyrefly.setMuted(true); window.__pyrefly.setSeed(1); });
  return { browser, ctx, page };
}

export async function frames(page, n) {
  await page.evaluate(async (k) => { for (let i = 0; i < k; i++) await window.__pyrefly.frame(); }, n);
}

/** A chapter to its first command menu. */
export async function toMenu(page, chapter) {
  await page.evaluate((id) => { window.__pyrefly.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly.frame();
      const s = document.querySelector('.ig-cmd-stack, .x2-cmd, [class*="cmd"]');
      const st = window.__pyrefly.battleState?.();
      if (st && s && !s.hidden && s.getBoundingClientRect().height > 0) return true;
    }
    return false;
  });
  if (!ok) throw new Error('no command menu');
  await page.waitForTimeout(800);
}
