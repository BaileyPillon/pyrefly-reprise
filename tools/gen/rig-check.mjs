#!/usr/bin/env node
/**
 * Living-portrait v3.2 check: re-runs the v3.1 check's own measurements
 * (critic/scratch/living-portrait-v3/capture.mjs, the same real inputs and
 * crops) against the current build, in real Chromium on the GPU at a
 * 1000x2000 viewport (the canvas at its native 832x1216). Every still is the
 * WebGL canvas itself. Turns use the real arrow keys held with the clock
 * slowed to 0.08x; blinks the real B key; the mid-gaze test a real mouse
 * resting on the canvas.
 *
 *   PYREFLY_BROWSER=gpu node tools/gen/rig-check.mjs --url http://127.0.0.1:<port>/docs/concepts/pause-until-dawn/prototype-v2/ --out <dir> [--only rest|seams|blink|turnblink|mouse|idle|smile|clip]
 *
 * Writes PNGs and log-<phase>.json into --out; the numbers are read by
 * tools/gen/rig-measure.py.
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { currentChromiumArgs } from '../browser-mode.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const base = arg('--url');
const OUT = resolve(arg('--out', 'rig-check-out'));
const only = arg('--only', null);
mkdirSync(OUT, { recursive: true });
const log = {};

const snap = (p) => p.evaluate(() => {
  const s = window.__livingPortrait.snapshot();
  const f = s.frame;
  return { yaw: f.yawDeg, base: f.baseYawDeg, t: f.timeSeconds, eye: f.eyeState, ap: f.eyeAperture, mouth: f.mouth, mw: f.mouthWeight, brow: f.brow, bw: f.browWeight, chest: f.chestSample, paint: s.paint };
});
const setScale = (p, s) => p.evaluate((v) => { window.__livingPortrait.opts.debugTimeScale = v; }, s);
/** Run the clock at `scale` until sim time reaches `tt`, then freeze. */
const runTo = (p, tt, scale = 1) => p.evaluate(([x, sc]) => new Promise((res) => {
  const d = window.__livingPortrait; d.opts.debugTimeScale = sc;
  const poll = () => { if (d.snapshot().frame.timeSeconds >= x) { d.opts.debugTimeScale = 0; res(); } else requestAnimationFrame(poll); };
  requestAnimationFrame(poll);
}), [tt, scale]);

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

async function open(browser, query, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport ?? { width: 1000, height: 2000 }, ...(opts.video ? { recordVideo: opts.video } : {}) });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(base + query);
  await page.waitForFunction(() => window.__livingPortrait?.snapshot().frame !== null, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.mouse.move(0, 0);
  log.gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
  return { ctx, page };
}

async function reducedRest(page, settle = 4000) {
  await page.keyboard.press('r');
  await page.waitForFunction(() => { const f = window.__livingPortrait.snapshot().frame; return f.reducedMotion && Math.abs(f.yawDeg) < 1e-3 && f.eyeAperture > 0.999 && f.mouthWeight < 1e-3 && f.browWeight < 1e-3; }, null, { timeout: 30000 });
  await page.waitForTimeout(settle);
  await setScale(page, 0);
  await page.waitForTimeout(200);
}

async function holdTo(page, key, target, slow = 0.08) {
  await setScale(page, slow);
  await page.keyboard.down(key);
  const test = target < 0 ? (t) => window.__livingPortrait.snapshot().frame.yawDeg <= t : (t) => window.__livingPortrait.snapshot().frame.yawDeg >= t;
  await page.waitForFunction(test, target, { timeout: 60000, polling: 'raf' });
  await setScale(page, 0);
  await page.keyboard.up(key);
  await page.waitForTimeout(200);
  return snap(page);
}

async function toCentre(page) {
  await setScale(page, 1);
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2);
  await page.waitForFunction(() => Math.abs(window.__livingPortrait.snapshot().frame.yawDeg) < 1.5, null, { timeout: 20000 });
  await page.mouse.move(0, 0);
}

const CROPS = { collar: [150, 640, 600, 300], hairline: [140, 40, 560, 340], eyeR: [228, 330, 230, 170], eyeL: [500, 320, 230, 170], braid: [140, 440, 260, 600] };
const PLAN = [['ArrowLeft', -20], ['ArrowLeft', -40], ['ArrowLeft', -60], ['ArrowLeft', -80], ['ArrowRight', 20], ['ArrowRight', 40], ['ArrowRight', 60], ['ArrowRight', 80]];

const phases = {
  async rest(browser) {
    for (const q of ['?post=0', '']) {
      const { ctx, page } = await open(browser, q);
      await reducedRest(page);
      log[`rest${q}`] = await save(page, q ? 'rest-post0' : 'rest-post');
      await ctx.close();
    }
  },
  async seams(browser) {
    const rows = [];
    for (const [q, tag, reduced] of [['', 'live', false], ['?post=0', 'p0rm', true]]) {
      const { ctx, page } = await open(browser, q);
      if (reduced) { await page.keyboard.press('r'); await page.waitForTimeout(300); }
      for (const [key, yaw] of PLAN) {
        await toCentre(page);
        await holdTo(page, key, yaw);
        const name = `seam-${tag}-${yaw < 0 ? 'm' : 'p'}${Math.abs(yaw)}`;
        rows.push(await save(page, name));
        if (tag === 'live') for (const [k, c] of Object.entries(CROPS)) await save(page, `${name}-crop-${k}`, c);
        console.log(name, rows.at(-1).yaw.toFixed(2), JSON.stringify(rows.at(-1).paint));
      }
      await ctx.close();
    }
    log.seams = rows;
  },
  async turnblink(browser) {
    const rows = [];
    const { ctx, page } = await open(browser, '?post=0');
    await page.keyboard.press('r');
    const box = await page.locator('canvas[data-living-portrait]').boundingBox();
    for (const yaw of [-30, -45, -84, 30, 45, 84]) {
      // a real mouse held on the canvas at this gaze (an arrow key always runs to the stop)
      await setScale(page, 1);
      await page.mouse.move(box.x + (box.width * (yaw / 85 + 1)) / 2, box.y + box.height / 2 + 1);
      await page.waitForTimeout(1500); // settle
      await setScale(page, 0.02);
      await page.keyboard.press('b');
      await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.eyeState === 'closed', null, { timeout: 20000, polling: 'raf' });
      await setScale(page, 0);
      await page.waitForTimeout(150);
      const tag = `${yaw < 0 ? 'm' : 'p'}${Math.abs(yaw)}`;
      rows.push(await save(page, `turnblink-${tag}-closed`));
      await save(page, `turnblink-${tag}-closed-crop-eyes`, [228, 300, 520, 200]);
      await setScale(page, 1);
      await page.waitForTimeout(600);
      rows.push(await save(page, `turnblink-${tag}-open`));
    }
    log.turnblink = rows;
    await ctx.close();
  },
  async blink(browser) {
    const { ctx, page } = await open(browser, '?post=0');
    await reducedRest(page);
    const frames = [await save(page, 'blink-00-rest')];
    const t0 = (await snap(page)).t;
    await page.keyboard.press('b');
    for (let i = 1, target = t0 + 0.016; i < 25; i++, target += 0.016) {
      await runTo(page, target, 0.02);
      await page.waitForTimeout(80);
      const r = await save(page, `blink-${String(i).padStart(2, '0')}`);
      r.dtMs = +((r.t - t0) * 1000).toFixed(1);
      frames.push(r);
      if (r.eye === 'open' && r.ap > 0.999 && i > 4) break;
    }
    log.blink = frames;
    await ctx.close();
  },
  async mouse(browser) {
    const rows = [];
    for (const deg of [15, 22, 25, 60]) {
      const { ctx, page } = await open(browser, '');
      const box = await page.locator('canvas[data-living-portrait]').boundingBox();
      await page.mouse.move(box.x + (box.width * (deg / 85 + 1)) / 2, box.y + box.height / 2 + 1);
      await page.waitForTimeout(1500);
      for (let k = 0; k < 120; k++) {
        const s = await snap(page);
        rows.push({ deg, k, t: +s.t.toFixed(3), yaw: +s.yaw.toFixed(2), base: +s.base.toFixed(2), paint: s.paint });
        if (deg === 22 && k % 5 === 0) await save(page, `mouse-${deg}-${String(k).padStart(3, '0')}`, [120, 0, 700, 900]);
        await page.waitForTimeout(100);
      }
      await ctx.close();
    }
    log.mouse = rows;
  },
  async idle(browser) {
    const { ctx, page } = await open(browser, '?post=0');
    await setScale(page, 0);
    const t0 = (await snap(page)).t;
    const rows = [];
    mkdirSync(resolve(OUT, 'idle'), { recursive: true });
    const frames = Math.round(Number(arg('--idleSeconds', 20)) * 10);
    for (let k = 0; k <= frames; k++) {
      await runTo(page, t0 + k * 0.1);
      await page.waitForTimeout(40);
      const r = await save(page, `idle/f${String(k).padStart(3, '0')}`, [150, 100, 600, 700]);
      await save(page, `idle/c${String(k).padStart(3, '0')}`, [0, 880, 832, 336]);
      rows.push(r);
    }
    log.idle = rows;
    await ctx.close();
  },
  async smile(browser) {
    const { ctx, page } = await open(browser, '?post=0');
    await reducedRest(page, 1000);
    await page.keyboard.press('r'); // idle back on so the mouth event runs
    await page.evaluate(() => window.__livingPortrait.forceMouthEvent('smile'));
    await setScale(page, 0.2);
    await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.mouthWeight > 0.97, null, { timeout: 20000, polling: 'raf' });
    await setScale(page, 0);
    log.smile = await save(page, 'smile-peak');
    await save(page, 'smile-peak-crop', [300, 540, 360, 200]);
    await ctx.close();
  },
  async clip(browser) {
    const vdir = resolve(OUT, 'video');
    mkdirSync(vdir, { recursive: true });
    const size = { width: 720, height: 1200 };
    const { ctx, page } = await open(browser, '', { viewport: size, video: { dir: vdir, size } });
    const beats = [];
    const T = Date.now();
    const mark = async (b) => { const s = await snap(page); beats.push({ beat: b, ms: Date.now() - T, yaw: +s.yaw.toFixed(1), paint: s.paint }); };
    const box = await page.locator('canvas[data-living-portrait]').boundingBox();
    const centre = () => page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2 + 2);
    await page.keyboard.press('h');
    await mark('idle'); await page.waitForTimeout(2500);
    await mark('ArrowLeft held'); await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(1300); await page.keyboard.up('ArrowLeft');
    await mark('hold'); await page.waitForTimeout(1500);
    await mark('centre'); await centre(); await page.waitForTimeout(1300); await page.mouse.move(0, 0);
    await mark('ArrowRight held'); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1300); await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(700);
    await mark('blink while turned (B)'); await page.keyboard.press('b'); await page.waitForTimeout(900);
    await mark('centre'); await centre(); await page.waitForTimeout(1200); await page.mouse.move(0, 0);
    await mark('blink (B)'); await page.keyboard.press('b'); await page.waitForTimeout(800);
    await mark('smile'); await page.evaluate(() => window.__livingPortrait.forceMouthEvent('smile')); await page.waitForTimeout(1800);
    await mark('idle'); await page.waitForTimeout(1700);
    await mark('end');
    log.clip = beats;
    const v = page.video();
    await ctx.close();
    renameSync(await v.path(), resolve(OUT, 'clip.webm'));
  },
};

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try {
  for (const [n, fn] of Object.entries(phases)) if (!only || only === n) { console.log('== phase', n); await fn(browser); }
} finally {
  await browser.close();
  writeFileSync(resolve(OUT, `log-${only ?? 'all'}.json`), JSON.stringify(log, null, 2));
}
