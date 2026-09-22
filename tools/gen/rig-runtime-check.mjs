#!/usr/bin/env node
/**
 * The v3.1 runtime check of the living portrait (mesh warp + seam-matched
 * patches), in real Chromium on the GPU (PYREFLY_BROWSER=gpu) at a
 * 1000x2000 viewport so the canvas renders at its native 832x1216. Stills
 * are the WebGL canvas itself. The turn is driven by REAL keys (ArrowLeft /
 * ArrowRight held, the clock slowed to 0.08x so the freeze lands within a
 * degree of the target yaw); the blink by the real B key in slow motion.
 *
 *   node tools/gen/rig-runtime-check.mjs --url http://localhost:<port>/docs/concepts/pause-until-dawn/prototype-v2/
 *
 * Writes docs/concepts/pause-until-dawn/prototype-v2/shots/: stills, 1:1
 * crops at -40, a warp-off comparison at -20 and -60, and runtime-check.json
 * (yaw per still, the rest-pose pixel diff, the per-patch seam fits).
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { currentChromiumArgs } from '../browser-mode.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = resolve(REPO, 'docs/concepts/pause-until-dawn/prototype-v2/shots');
const argv = process.argv.slice(2);
const base = argv[argv.indexOf('--url') + 1];
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const log = { url: base, browser: 'chromium, PYREFLY_BROWSER=gpu', viewport: '1000x2000', stills: [], crops: [] };

const CROPS = {
  eyes: [250, 320, 360, 200],
  collar: [150, 640, 600, 300],
  hairline: [140, 40, 560, 340],
};

const snap = (page) => page.evaluate(() => window.__livingPortrait.snapshot().frame);
const freeze = (page) => page.evaluate(() => { window.__livingPortrait.opts.debugTimeScale = 0; });
const thaw = (page, s = 1) => page.evaluate((v) => { window.__livingPortrait.opts.debugTimeScale = v; }, s);

async function canvasData(page, crop) {
  return page.evaluate((c) => {
    const src = document.querySelector('canvas[data-living-portrait]');
    if (!c) return src.toDataURL('image/png');
    const o = document.createElement('canvas');
    o.width = c[2];
    o.height = c[3];
    o.getContext('2d').drawImage(src, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]);
    return o.toDataURL('image/png');
  }, crop ?? null);
}

async function save(page, name, note, crop) {
  const data = await canvasData(page, crop);
  writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
  const f = await snap(page);
  const row = { name, yaw: +f.yawDeg.toFixed(2), aperture: +f.eyeAperture.toFixed(2), eye: f.eyeState, note, ...(crop ? { crop } : {}) };
  (crop ? log.crops : log.stills).push(row);
  console.log(JSON.stringify(row));
}

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 2000 } });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text());
  });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(base + query);
  await page.waitForFunction(() => window.__livingPortrait?.snapshot().frame !== null, null, { timeout: 30000 });
  await page.locator('canvas[data-living-portrait]').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.mouse.move(0, 0);
  return page;
}

/** Hold a real arrow key with the clock slowed until yaw passes `target`, then freeze. */
async function holdTo(page, key, target) {
  await thaw(page, 0.08);
  await page.keyboard.down(key);
  const test = target < 0
    ? (t) => window.__livingPortrait.snapshot().frame.yawDeg <= t
    : (t) => window.__livingPortrait.snapshot().frame.yawDeg >= t;
  await page.waitForFunction(test, target, { timeout: 30000, polling: 'raf' });
  await freeze(page);
  await page.keyboard.up(key);
  await page.waitForTimeout(150);
}

/** Back to centre the way a player would: the mouse on the middle of the portrait (the gaze keeps its last target otherwise). */
async function toCentre(page) {
  await thaw(page, 1);
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2);
  await page.waitForFunction(() => Math.abs(window.__livingPortrait.snapshot().frame.yawDeg) < 4, null, { timeout: 20000 });
}

async function restProof(browser) {
  const page = await open(browser, '?post=0');
  await page.keyboard.press('r');
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => {
    const f = window.__livingPortrait.snapshot().frame;
    return f.eyeAperture > 0.999 && f.mouthWeight < 0.001 && f.browWeight < 0.001;
  }, null, { timeout: 30000 });
  await freeze(page);
  await page.waitForTimeout(150);
  const measure = () => page.evaluate(async () => {
    const c = document.querySelector('canvas[data-living-portrait]');
    const w = c.width;
    const h = c.height;
    const shot = await createImageBitmap(await (await fetch(c.toDataURL('image/png'))).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const sc = new OffscreenCanvas(w, h).getContext('2d');
    sc.drawImage(shot, 0, 0);
    const px = sc.getImageData(0, 0, w, h).data;
    const blob = await (await fetch('./art/keys/frontal.png')).blob();
    const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    const o = new OffscreenCanvas(w, h).getContext('2d');
    o.drawImage(bmp, 0, 0);
    const plate = o.getImageData(0, 0, w, h).data;
    const bg = [0.03 * 255, 0.02 * 255, 0.03 * 255];
    let diff = 0;
    let max = 0;
    let sum = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const j = (y * w + x) * 4;
        const a = plate[j + 3] / 255;
        let d = 0;
        for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(px[i + k] - Math.round(plate[j + k] * a + bg[k] * (1 - a))));
        if (d > 1) diff++;
        max = Math.max(max, d);
        sum += d;
      }
    }
    const mid = (600 * w + 400) * 4;
    return {
      canvasPixel_400_600: [...px.slice(mid, mid + 4)],
      platePixel_400_600: [...plate.slice(mid, mid + 4)],
      yaw: window.__livingPortrait.snapshot().frame.yawDeg,
      differingPixelsOver1Level: diff,
      maxLevels: max,
      meanLevels: +(sum / (w * h)).toFixed(4),
      note: 'the WebGL canvas at rest (?post=0, R held reduced motion, eyes open) vs art/keys/frontal.png (the plate) over the clear colour, decoded without colour conversion',
    };
  });
  // a fresh headless GPU context has once handed back a blank canvas for the first read: re-read, and log how many tries it took
  for (let attempt = 1; attempt <= 5; attempt++) {
    log.restDiff = { ...(await measure()), attempt };
    if (log.restDiff.canvasPixel_400_600[0] !== 8) break;
    await page.waitForTimeout(500);
  }
  console.log('rest', JSON.stringify(log.restDiff));
  await page.close();
}

async function stills(browser) {
  const page = await open(browser, '');
  await page.keyboard.press('r');
  await page.waitForTimeout(1200);
  await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.eyeAperture > 0.999, null, { timeout: 20000 });
  await freeze(page);
  await page.waitForTimeout(150);
  await save(page, '01-yaw-0', 'rest: R (reduced motion) holds yaw 0; post grade on');
  await thaw(page, 1);
  await page.keyboard.press('r');
  const turns = [
    ['ArrowLeft', -20, '02-yaw-m20', 'frontal/turn-l45 at t 0.44: both keys warped to the interpolated landmarks'],
    ['ArrowLeft', -40, '03-yaw-m40', 'frontal/turn-l45 at t 0.89'],
    ['ArrowLeft', -60, '04-yaw-m60', 'turn-l45/turn-l85 at t 0.38'],
    ['ArrowLeft', -80, '05-yaw-m80', 'turn-l45/turn-l85 at t 0.88'],
    ['ArrowRight', 20, '06-yaw-p20', 'frontal/turn-r45 at t 0.44'],
    ['ArrowRight', 40, '07-yaw-p40', 'frontal/turn-r45 at t 0.89'],
  ];
  for (const [key, yaw, name, note] of turns) {
    await toCentre(page);
    await holdTo(page, key, yaw);
    await save(page, name, `${key} held (clock 0.08x), frozen at yaw ${yaw}: ${note}`);
    if (yaw === -40) for (const [k, c] of Object.entries(CROPS)) await save(page, `crop-${k}-m40`, `1:1 crop of the -40 still: ${k}`, c);
  }
  await toCentre(page);
  await page.keyboard.press('r');
  await page.waitForTimeout(800);
  await thaw(page, 0.02);
  await page.keyboard.press('b');
  await page.waitForFunction(() => {
    const f = window.__livingPortrait.snapshot().frame;
    return f.eyeState === 'closing' && f.eyeAperture <= 0.5;
  }, null, { timeout: 20000, polling: 'raf' });
  await freeze(page);
  await page.waitForTimeout(150);
  await save(page, '08-mid-blink', 'B key in slow motion (0.02x), frozen mid-close');
  await save(page, 'crop-eyes-mid-blink', '1:1 crop of the mid-blink still', CROPS.eyes);
  log.patchFits = await page.evaluate(() => window.__livingPortrait.renderer.art.patchFits);
  await page.close();
}

async function noWarp(browser) {
  const page = await open(browser, '?warp=0');
  for (const [key, yaw, name] of [['ArrowLeft', -20, '09-nowarp-yaw-m20'], ['ArrowLeft', -60, '10-nowarp-yaw-m60']]) {
    await toCentre(page);
    await holdTo(page, key, yaw);
    await save(page, name, `?warp=0 (plain cross-dissolve) at yaw ${yaw}, for comparison with the warped still`);
  }
  await page.close();
}

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try {
  if (!only || only === 'rest') await restProof(browser);
  if (!only || only === 'stills') await stills(browser);
  if (!only || only === 'nowarp') await noWarp(browser);
  if (!only) writeFileSync(resolve(OUT, 'runtime-check.json'), `${JSON.stringify(log, null, 2)}\n`);
} finally {
  await browser.close();
}
