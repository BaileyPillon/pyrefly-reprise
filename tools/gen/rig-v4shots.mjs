#!/usr/bin/env node
/**
 * Living-portrait v4 (FFX-2 only): the browser pass. Real Chromium on the GPU
 * (PYREFLY_BROWSER=gpu), a 1000x2000 viewport, the WebGL canvas saved at its
 * native 832x1216. Every pose is reached with real input: the mouse resting
 * on the canvas at the gaze for that yaw (gaze x = yaw / 85), blinks with the
 * real B key; the expressions are the driver's own debug events.
 *
 *   PYREFLY_BROWSER=gpu node tools/gen/rig-v4shots.mjs --url http://127.0.0.1:<port>/docs/concepts/pause-until-dawn/prototype-v2/ --out <dir> [--only stills|clip] [--query ?paint=switch]
 *
 * stills   yaw 0, -20, -40, -60, -80, +20, +40, +60, +80 (clock frozen once
 *          the spring has settled, idle sway on), each with 1:1 crops of the
 *          eyes, the hairline, the tassel and the jaw; mid-blink and closed at
 *          0; smile at 0 and -40; brows raised at +20; slight smile at +20
 * clip     15 s at 720x1200: idle, a slow turn to -80 and back, a turn to +80
 *          and back, a blink, a smile (log-clip.json has the beats)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { currentChromiumArgs } from '../browser-mode.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const base = arg('--url');
const OUT = resolve(arg('--out', 'rig-v4-shots'));
const only = arg('--only', null);
const query = arg('--query', '');
mkdirSync(resolve(OUT, 'crops'), { recursive: true });
const log = {};

const snap = (p) => p.evaluate(() => {
  const s = window.__livingPortrait.snapshot();
  const f = s.frame;
  return { yaw: +f.yawDeg.toFixed(2), base: +f.baseYawDeg.toFixed(2), t: +f.timeSeconds.toFixed(3), eye: f.eyeState, ap: +f.eyeAperture.toFixed(3), mouth: f.mouth, mw: +f.mouthWeight.toFixed(3), brow: f.brow, bw: +f.browWeight.toFixed(3), paint: s.paint };
});
const setScale = (p, s) => p.evaluate((v) => { window.__livingPortrait.opts.debugTimeScale = v; }, s);
const CROPS = { eyes: [140, 300, 640, 220], hairline: [40, 0, 760, 320], tassel: [120, 440, 560, 560], jaw: [140, 560, 640, 300] };

async function save(page, name, crop) {
  const d = await page.evaluate((c) => {
    const src = document.querySelector('canvas[data-living-portrait]');
    if (!c) return src.toDataURL('image/png');
    const o = document.createElement('canvas');
    o.width = c[2]; o.height = c[3];
    o.getContext('2d').drawImage(src, c[0], c[1], c[2], c[3], 0, 0, c[2], c[3]);
    return o.toDataURL('image/png');
  }, crop ?? null);
  writeFileSync(resolve(OUT, `${name}.png`), Buffer.from(d.split(',')[1], 'base64'));
  return { name, ...(await snap(page)) };
}

async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport ?? { width: 1000, height: 2000 }, ...(opts.video ? { recordVideo: opts.video } : {}) });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(base + query, { timeout: 180000 });
  await page.waitForFunction(() => window.__livingPortrait?.snapshot().frame !== null, null, { timeout: 60000 });
  await page.waitForTimeout(800);
  log.gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  return { ctx, page, box };
}

/** The real mouse resting on the canvas where the gaze reads `yaw` (and centre height: no pitch). */
async function gazeAt(page, box, yaw) {
  // the driver reads an input of exactly (0, 0) as "no input" (the gaze holds): 1 px off centre at yaw 0
  await page.mouse.move(box.x + (box.width * (yaw / 85 + 1)) / 2 + (yaw === 0 ? 1 : 0), box.y + box.height / 2);
}

async function settle(page, box, yaw) {
  await setScale(page, 2); // the idle mouth/brow events decay over ~10 s: wait for a neutral window at 2x
  await gazeAt(page, box, yaw);
  // settled on the yaw, and a neutral face (the idle mouth/brow events and blinks run on their own clocks)
  await page.waitForFunction((y) => {
    const d = window.__livingPortrait;
    const f = d.snapshot().frame;
    const ok = Math.abs(f.baseYawDeg - y) < 0.6 && f.mouth === 'neutral' && f.brow === 'neutral' && f.eyeAperture > 0.99 && f.eyeState === 'open';
    if (ok) d.opts.debugTimeScale = 0; // freeze on the very frame that qualifies
    return ok;
  }, yaw, { timeout: 120000, polling: 'raf' });
  await page.waitForTimeout(200);
}

const tag = (y) => (y === 0 ? '0' : y < 0 ? `m${-y}` : `p${y}`);

const phases = {
  async stills(browser) {
    const { ctx, page, box } = await open(browser);
    const rows = [];
    for (const yaw of [0, -20, -40, -60, -80, 20, 40, 60, 80]) {
      await settle(page, box, yaw);
      rows.push(await save(page, `yaw-${tag(yaw)}`));
      for (const [k, c] of Object.entries(CROPS)) await save(page, `crops/yaw-${tag(yaw)}-${k}`, c);
      console.log('yaw', yaw, JSON.stringify(rows.at(-1)));
    }
    // blink at 0: the real B key with the clock slowed, caught closing and closed
    await settle(page, box, 0);
    await setScale(page, 0.03);
    await page.keyboard.press('b');
    await page.waitForFunction(() => { const f = window.__livingPortrait.snapshot().frame; return f.eyeState === 'closing' && f.eyeAperture < 0.55; }, null, { timeout: 30000, polling: 'raf' });
    await setScale(page, 0);
    rows.push(await save(page, 'blink-mid'));
    await save(page, 'crops/blink-mid-eyes', CROPS.eyes);
    await setScale(page, 0.03);
    await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.eyeState === 'closed', null, { timeout: 30000, polling: 'raf' });
    await setScale(page, 0);
    rows.push(await save(page, 'blink-closed'));
    await save(page, 'crops/blink-closed-eyes', CROPS.eyes);
    const expr = async (yaw, name, start, until) => {
      await settle(page, box, yaw);
      await setScale(page, 0);
      await page.evaluate(start);
      await setScale(page, 0.25);
      await page.waitForFunction(until, null, { timeout: 30000, polling: 'raf' });
      await setScale(page, 0);
      rows.push(await save(page, name));
      await save(page, `crops/${name}-face`, [140, 300, 640, 480]);
    };
    const mouthPeak = () => window.__livingPortrait.snapshot().frame.mouthWeight > 0.97;
    await expr(0, 'smile-0', () => window.__livingPortrait.forceMouthEvent('smile'), mouthPeak);
    await expr(-40, 'smile-m40', () => window.__livingPortrait.forceMouthEvent('smile'), mouthPeak);
    await expr(20, 'slight-smile-p20', () => window.__livingPortrait.forceMouthEvent('slightSmile'), mouthPeak);
    await expr(20, 'brow-raised-p20', () => window.__livingPortrait.forceBrowEvent('raised'), () => window.__livingPortrait.snapshot().frame.browWeight > 0.38);
    log.stills = rows;
    await ctx.close();
  },
  async clip(browser) {
    const vdir = resolve(OUT, 'video');
    mkdirSync(vdir, { recursive: true });
    const size = { width: 720, height: 1200 };
    const { ctx, page, box } = await open(browser, { viewport: size, video: { dir: vdir, size } });
    const beats = [];
    const T = Date.now();
    const mark = async (b) => { const s = await snap(page); beats.push({ beat: b, ms: Date.now() - T, yaw: s.yaw, paint: s.paint }); };
    const glide = async (from, to, ms) => {
      const steps = Math.max(2, Math.round(ms / 50));
      for (let i = 1; i <= steps; i++) {
        await gazeAt(page, box, from + ((to - from) * i) / steps);
        await page.waitForTimeout(ms / steps);
      }
    };
    await gazeAt(page, box, 0);
    await mark('idle'); await page.waitForTimeout(1400);
    await mark('slow turn to -80'); await glide(0, -80, 2200); await page.waitForTimeout(400);
    await mark('back'); await glide(-80, 0, 1700); await page.waitForTimeout(200);
    await mark('turn to +80'); await glide(0, 80, 1500); await page.waitForTimeout(300);
    await mark('back'); await glide(80, 0, 1300); await page.waitForTimeout(300);
    await mark('blink (B)'); await page.keyboard.press('b'); await page.waitForTimeout(700);
    await mark('smile'); await page.evaluate(() => window.__livingPortrait.forceMouthEvent('smile')); await page.waitForTimeout(1900);
    await mark('end');
    log.clip = beats;
    const v = page.video();
    await ctx.close();
    renameSync(await v.path(), resolve(OUT, 'clip-15s.webm'));
  },
};

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try {
  for (const [n, fn] of Object.entries(phases)) if (!only || only === n) { console.log('== phase', n); await fn(browser); }
} finally {
  await browser.close();
  writeFileSync(resolve(OUT, `log-${only ?? 'all'}.json`), JSON.stringify(log, null, 2));
}
