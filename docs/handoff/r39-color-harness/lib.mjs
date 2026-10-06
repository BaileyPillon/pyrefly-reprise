// r39-color harness (scratch). Headless GPU Playwright from node, never the browser pane / Claude-in-Chrome.
import { chromium } from 'file:///D:/pyrefly-r39-color/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

export const ROOT = 'D:/Tools/pyrefly-scratch/2026-10-05/r39-color';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const GPU_ARGS = [
  '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox',
  '--autoplay-policy=no-user-gesture-required',
  '--disable-frame-rate-limit', '--disable-gpu-vsync',
  '--enable-webgl-draft-extensions',
];

export async function launch({ width = 2560, height = 1440, dpr = 1 } = {}) {
  const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  // a virtual clock for performance.now(): the same frame can be re-read
  await ctx.addInitScript(() => {
    const realNow = performance.now.bind(performance);
    let frozenAt = null; let skipped = 0;
    performance.now = () => (frozenAt !== null ? frozenAt : realNow()) - skipped;
    window.__clock = {
      freeze() { if (frozenAt === null) frozenAt = realNow(); },
      thaw() { if (frozenAt !== null) { skipped += realNow() - frozenAt; frozenAt = null; } },
    };
  });
  const page = await ctx.newPage();
  const errors = []; const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  return { browser, ctx, page, errors, failed };
}

export async function ready(page, seed = 1) {
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate((s) => window.__pyrefly.setSeed(s), seed);
}

export const battleSnap = (page) => page.evaluate(() => {
  const b = window.__pyrefly?.battle?.();
  if (!b) return { screen: window.__pyrefly?.screen?.() ?? null };
  const snap = b.snapshot?.() ?? {};
  return { playback: snap.playback ? { phase: snap.playback.phase, awaitingMenu: snap.playback.awaitingMenu } : null, screen: window.__pyrefly.screen() };
});

/** Start a chapter and wait for the first command menu. */
export async function startChapter(page, chapter, seed = 4) {
  const t0 = Date.now();
  await page.evaluate(([id, sd]) => { window.__pyrefly.setCoaching?.(false); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true, seed: sd }); }, [chapter, seed]);
  for (let i = 0; i < 900; i++) {
    const st = await battleSnap(page).catch(() => null);
    if (st?.playback?.awaitingMenu) break;
    await sleep(200);
  }
  await sleep(1500);
  return Date.now() - t0;
}

export async function freeze(page, on) {
  await page.evaluate((o) => {
    const fx = window.__pyrefly.fx;
    if (o) { fx?.freeze?.(true); window.__clock.freeze(); } else { window.__clock.thaw(); fx?.freeze?.(false); }
  }, on);
}

export function writeJson(path, obj) { mkdirSync(path.replace(/[\\/][^\\/]*$/, ''), { recursive: true }); writeFileSync(path, JSON.stringify(obj, null, 1)); }
export function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
export { mkdirSync, existsSync, writeFileSync, readFileSync };
