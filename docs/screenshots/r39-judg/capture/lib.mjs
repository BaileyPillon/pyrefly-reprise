// Shared helpers for the r39-judg proofs (docs/handoff/r39-judg.md) (headless Chromium, real keys, GPU mode).
// Playwright and the repo's own harness helpers are read from the worktree D:/pyrefly-r39-judg.
import { chromium } from 'file:///D:/pyrefly-r39-judg/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-r39-judg/tools/browser-mode.mjs';
import fs from 'node:fs';

export const WT = 'D:/pyrefly-r39-judg';
export const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-04/r39-judg';
export const BASE = process.env.BASE ?? 'http://127.0.0.1:7200/';

export async function launch({ width = 1600, height = 900, touch = false, storage = null } = {}) {
  const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    ...(touch ? { hasTouch: true, isMobile: true } : {}),
    ...(storage ? { storageState: storage } : {}),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push('pageerror ' + String(e).slice(0, 300)));
  return { browser, ctx, page, errors };
}

export async function ready(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
}

export const until = async (page, read, ok, ms, label) => {
  const t0 = Date.now();
  for (;;) {
    const v = await read();
    if (ok(v)) return v;
    if (Date.now() - t0 > ms) throw new Error(`${label}: gave up (last ${JSON.stringify(v)})`);
    await page.waitForTimeout(120);
  }
};

export const phase = (page) => page.evaluate(() => window.__pyrefly.battle()?.presenter?.snapshot().phase ?? '');

export function writeJson(path, obj) {
  fs.mkdirSync(path.replace(/[\\/][^\\/]*$/, ''), { recursive: true });
  fs.writeFileSync(path, JSON.stringify(obj, null, 1));
}
