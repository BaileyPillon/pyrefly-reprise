#!/usr/bin/env node
/**
 * Captures the living-portrait v3 prototype for review, in real Chromium on
 * the GPU (PYREFLY_BROWSER=gpu), driven by real keyboard input wherever a key
 * exists: stills are the WebGL canvas itself at its native 832x1216 (so the
 * pixels are the renderer's, not a scaled screenshot), each frozen the
 * instant the pose is reached (debugTimeScale = 0: the clock stops, the held
 * key stays held). Brow and mouth states have no key: those are set on the
 * state machine / renderer directly and say so in the log.
 *
 *   node tools/gen/rig-capture.mjs --url http://localhost:5759/docs/concepts/pause-until-dawn/prototype-v2/
 *
 * Writes docs/concepts/pause-until-dawn/prototype-v2/shots/v3/*.png + capture.json.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentChromiumArgs } from '../browser-mode.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = resolve(REPO, 'docs/concepts/pause-until-dawn/prototype-v2/shots/v3');
const argv = process.argv.slice(2);
const url = argv[argv.indexOf('--url') + 1];
mkdirSync(OUT, { recursive: true });
const log = [];

async function canvasPng(page, name, note) {
  const data = await page.evaluate(() => document.querySelector('canvas[data-living-portrait]').toDataURL('image/png'));
  writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  const f = await page.evaluate(() => window.__livingPortrait.snapshot().frame);
  const row = { name, yaw: +f.yawDeg.toFixed(2), aperture: +f.eyeAperture.toFixed(2), eye: f.eyeState, mouth: f.mouth, brow: f.brow, note };
  log.push(row);
  console.log(JSON.stringify(row));
}

const freeze = (page) => page.evaluate(() => { window.__livingPortrait.opts.debugTimeScale = 0; });
const thaw = (page, s = 1) => page.evaluate((v) => { window.__livingPortrait.opts.debugTimeScale = v; }, s);
const settle = (page, ms) => page.waitForTimeout(ms);

async function holdTo(page, key, test, name, note) {
  await thaw(page);
  await page.keyboard.down(key);
  await page.waitForFunction(test, null, { timeout: 8000, polling: 'raf' });
  await freeze(page);
  await settle(page, 120);
  await canvasPng(page, name, note);
  await page.keyboard.up(key);
}

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 2000 } });
  await page.goto(url);
  await page.waitForFunction(() => window.__livingPortrait?.snapshot().frame !== null, null, { timeout: 20000 });
  await page.locator('canvas[data-living-portrait]').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.mouse.move(0, 0);
  await page.keyboard.press('r'); // reduced motion: yaw holds 0, no idle sway
  await settle(page, 1500);
  await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.eyeAperture > 0.999, null, { timeout: 15000 });
  await freeze(page); await settle(page, 120);
  await canvasPng(page, '01-rest-reduced-motion', 'R key: reduced motion, yaw 0, post grade on');
  await thaw(page);
  await page.keyboard.press('r');
  await settle(page, 2500);
  await freeze(page); await settle(page, 120);
  await canvasPng(page, '02-idle-centre', 'idle sway, no input');
  const Y = (op, v) => new Function(`return window.__livingPortrait.snapshot().frame.yawDeg ${op} ${v}`);
  await holdTo(page, 'ArrowLeft', Y('<=', -20), '03-left-20-blend', 'ArrowLeft held: frontal/q34-left mid-dissolve');
  await holdTo(page, 'ArrowLeft', Y('<=', -39.5), '04-left-40', 'ArrowLeft held to q34-left');
  await holdTo(page, 'ArrowLeft', Y('<=', -62), '05-left-62-blend', 'ArrowLeft held: q34-left/profile-left mid-dissolve');
  await holdTo(page, 'ArrowLeft', Y('<=', -84), '06-left-85', 'ArrowLeft held to profile-left');
  await holdTo(page, 'ArrowRight', Y('>=', 20), '07-right-20-blend', 'ArrowRight held: frontal/q34-right mid-dissolve');
  await holdTo(page, 'ArrowRight', Y('>=', 39.5), '08-right-40', 'ArrowRight held to q34-right');
  await holdTo(page, 'ArrowRight', Y('>=', 62), '09-right-62-blend', 'ArrowRight held: q34-right/profile-right mid-dissolve');
  await holdTo(page, 'ArrowRight', Y('>=', 84), '10-right-85', 'ArrowRight held to profile-right (new, mirrored)');
  // back to centre with a real mouse move a few px off dead centre
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  await thaw(page);
  await page.mouse.move(box.x + box.width / 2 + 3, box.y + box.height / 2 + 3);
  await page.waitForFunction(() => Math.abs(window.__livingPortrait.snapshot().frame.yawDeg) < 3, null, { timeout: 8000 });
  await page.keyboard.press('r'); await settle(page, 1500);
  // blink in slow motion: B, then freeze at each lid state
  for (const [ap, name] of [[0.66, '11-blink-1'], [0.5, '12-half'], [0.33, '13-blink-2'], [0.02, '14-closed']]) {
    await thaw(page, 0.02);
    await page.keyboard.press('b');
    await page.waitForFunction((a) => window.__livingPortrait.snapshot().frame.eyeAperture <= a, ap, { timeout: 20000, polling: 'raf' });
    await freeze(page); await settle(page, 120);
    await canvasPng(page, name, `B key in slow motion, frozen at aperture <= ${ap}`);
    await thaw(page, 1); await settle(page, 600);
  }
  // no key drives brows or a forced mouth: set them directly (disclosed)
  for (const [brow, name] of [['raised', '15-brow-raised'], ['drawn', '16-brow-drawn']]) {
    await freeze(page);
    const data = await page.evaluate((b) => {
      const d = window.__livingPortrait; const f = d.snapshot().frame;
      d.renderer.render({ yawDeg: 0, pitchNorm: 0, eyeState: 'open', eyeAperture: 1, mouth: 'neutral', mouthWeight: 0, brow: b, browWeight: 1, timeSeconds: f.timeSeconds, reducedMotion: true, chestSample: 0 });
      return document.querySelector('canvas[data-living-portrait]').toDataURL('image/png');
    }, brow);
    writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    log.push({ name, yaw: 0, brow, note: `renderer driven directly in one task (no key drives brows): brow ${brow} at weight 1, fringe lifted with raised` });
  }
  for (const [mouth, name] of [['smile', '17-mouth-smile'], ['parted', '18-mouth-parted']]) {
    const data = await page.evaluate((mo) => {
      const d = window.__livingPortrait; const f = d.snapshot().frame;
      d.renderer.render({ yawDeg: 0, pitchNorm: 0, eyeState: 'open', eyeAperture: 1, mouth: mo, mouthWeight: 1, brow: 'neutral', browWeight: 0, timeSeconds: f.timeSeconds, reducedMotion: true, chestSample: 0 });
      return document.querySelector('canvas[data-living-portrait]').toDataURL('image/png');
    }, mouth);
    writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    log.push({ name, yaw: 0, mouth, note: `renderer driven directly in one task: mouth ${mouth} at weight 1` });
  }
  writeFileSync(resolve(OUT, 'capture.json'), `${JSON.stringify({ url, browser: 'chromium, PYREFLY_BROWSER=gpu', stills: log }, null, 2)}\n`);
} finally {
  await browser.close();
}
