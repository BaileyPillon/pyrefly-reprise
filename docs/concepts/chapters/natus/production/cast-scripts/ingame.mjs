#!/usr/bin/env node
/**
 * Natus hero cast (FFX only): real 1600x900 frames of Chapter X (seymour-natus) with the candidate.
 *   node ingame.mjs            (own Vite server on 5761, HMR and watcher off, closed on exit)
 * Request interception: the placeholder scene's gagazet.png -> the Highbridge plate
 * (public/art/backdrops/bevelle-highbridge.png); seymour-natus idle/cast -> the ring composites from
 * compose.py (the ring layer is not wired in src yet). Frames: idle line-up, then the cast pose held.
 */
import { createServer } from 'file:///D:/Final%20Fantasy/node_modules/vite/dist/node/index.js';
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
const PORT = 5761, A = 'D:/Final Fantasy/public/art/', F = 'D:/Tools/pyrefly-scratch/natus-cast/frame/';
mkdirSync(F, { recursive: true });
const server = await createServer({ root: 'D:/Final Fantasy', configFile: 'D:/Final Fantasy/vite.config.ts', server: { port: PORT, strictPort: true, hmr: false, watch: null }, clearScreen: false, logLevel: 'error' });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  const png = (p) => ({ status: 200, contentType: 'image/png', body: readFileSync(p) });
  const json = (p) => ({ status: 200, contentType: 'application/json', body: readFileSync(p) });
  await page.route('**/art/backdrops/gagazet.png*', (r) => r.fulfill(png(A + 'backdrops/bevelle-highbridge.png')));
  await page.route('**/art/characters/seymour-natus/*', (r) => {
    const u = r.request().url().split('?')[0]; const pose = u.includes('/cast.') ? 'cast' : 'idle';
    return r.fulfill(u.endsWith('.json') ? json(`${F}natus-${pose}.json`) : png(`${F}natus-${pose}.png`));
  });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'commit', timeout: 180000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
  await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('seymour-natus', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
  await page.waitForTimeout(12000);
  const keys = await page.evaluate(() => [...window.__pyrefly.battle().stage.actors.keys()]);
  console.log('actors', keys.join(','));
  await page.evaluate(() => window.__pyrefly.trigger('hud:off')); await page.waitForTimeout(600);
  await page.screenshot({ path: `${F}f-idle.png` });
  const set = (pose) => page.evaluate(async (pose) => {
    const p = window.__pyrefly; const e = p.battle().stage.actors.get('seymour-natus');
    e.actor.setPose(pose, { immediate: true, force: true }); await p.frames(30);
  }, pose);
  await set('cast'); await page.screenshot({ path: `${F}f-cast.png` });
  await page.evaluate(() => window.__pyrefly.trigger('hud:on')); await page.waitForTimeout(600);
  await set('cast'); await page.screenshot({ path: `${F}f-cast-hud.png` });
  console.log('wrote frames');
} finally {
  await browser?.close(); await server.close();
}
