#!/usr/bin/env node
/**
 * Living portrait v5 pilot (game case: both; Yuna X-2 plate): the browser pass, real Chromium on the GPU, the
 * same page and input model as tools/gen/rig-v4shots.mjs (mouse resting on the canvas where the gaze reads the
 * yaw; x = yaw / range, the range being the rig's own), legend hidden with the real H key.
 *
 *   PYREFLY_BROWSER=gpu node pilot-shots.mjs --url http://127.0.0.1:5231/ --out <dir> --phase sweep|clip|half
 *        [--query ?rig=v41cut] [--range 20] [--turn 20] [--tag name]
 *
 * sweep  ?post=0, reduced motion (no sway), the real arrow keys held, the clock run slowly and frozen at every
 *        degree from -R to +R and back down: <out>/sweep-<tag>/{up,down}/y<+-NN>.png + log (yaw, paint per frame)
 * clip   720x1200, the length and beats of shots/v4/living-portrait-v4.mp4 inside +-R: idle, slow turn to -R and
 *        back, turn to +R and back, a blink (B), a smile -> <out>/clip-<tag>.webm
 * half   720x1200 at half speed (debugTimeScale 0.5, the input glides twice as long): 0 -> +R -> -R -> 0
 *        -> <out>/half-<tag>.webm (the compare clip)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { currentChromiumArgs } from '../../../../../../../tools/browser-mode.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const base = arg('--url');
const OUT = resolve(arg('--out', '.'));
const phase = arg('--phase', 'sweep');
const query = arg('--query', '');
const R = Number(arg('--range', '20'));
const tag = arg('--tag', 'pilot');
/** The turn's amplitude in the clips (defaults to the range; the v4.1 rig's range is 85, its compare turn is 20). */
const A = Number(arg('--turn', String(R)));
mkdirSync(OUT, { recursive: true });

const snap = (p) => p.evaluate(() => {
  const s = window.__livingPortrait.snapshot(); const f = s.frame;
  return { yaw: +f.yawDeg.toFixed(3), base: +f.baseYawDeg.toFixed(3), t: +f.timeSeconds.toFixed(3), eye: f.eyeState, mouth: f.mouth, brow: f.brow, paint: s.paint };
});
const setScale = (p, s) => p.evaluate((v) => { window.__livingPortrait.opts.debugTimeScale = v; }, s);

async function save(page, path) {
  const d = await page.evaluate(() => document.querySelector('canvas[data-living-portrait]').toDataURL('image/png'));
  writeFileSync(path, Buffer.from(d.split(',')[1], 'base64'));
  return snap(page);
}

async function open(browser, q, opts = {}) {
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: opts.viewport ?? { width: 1000, height: 2000 }, ...(opts.video ? { recordVideo: opts.video } : {}) });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(base + q, { timeout: 180000 });
  await page.waitForFunction(() => window.__livingPortrait?.snapshot().frame !== null, null, { timeout: 90000 });
  await page.waitForTimeout(800);
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  return { ctx, page, box, t0 };
}

async function hideLegend(page) {
  await page.keyboard.press('h');
  await page.waitForFunction(() => document.getElementById('legend').style.display === 'none', null, { timeout: 5000 });
}

async function gazeAt(page, box, yaw) {
  await page.mouse.move(box.x + (box.width * (yaw / R + 1)) / 2 + (yaw === 0 ? 1 : 0), box.y + box.height / 2);
}

async function runTo(page, target, dir, scale) {
  await page.evaluate(([tg, dir, sc]) => new Promise((res, rej) => {
    const d = window.__livingPortrait; d.opts.debugTimeScale = sc; const t0 = performance.now();
    const poll = () => {
      const y = d.snapshot().frame.yawDeg;
      if ((dir < 0 && y <= tg) || (dir > 0 && y >= tg)) { d.opts.debugTimeScale = 0; res(); }
      else if (performance.now() - t0 > 60000) { d.opts.debugTimeScale = 0; rej(new Error('timeout at ' + y)); }
      else requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }), [target, dir, scale]);
  await page.waitForTimeout(80);
}

const neutral = () => { const f = window.__livingPortrait.snapshot().frame; return f.eyeAperture > 0.999 && f.eyeState === 'open' && f.mouthWeight < 1e-3 && f.browWeight < 1e-3; };

const phases = {
  async sweep(browser) {
    const q = query ? `${query}&post=0` : '?post=0';
    const { ctx, page } = await open(browser, q);
    await page.mouse.move(0, 0);
    await page.keyboard.press('r');
    await page.waitForFunction(() => window.__livingPortrait.snapshot().frame.reducedMotion, null, { timeout: 5000 });
    const dir = resolve(OUT, `sweep-${tag}`);
    const rows = [];
    for (const [name, key, from, to, sgn] of [['up', 'ArrowRight', -R, R, 1], ['down', 'ArrowLeft', R, -R, -1]]) {
      mkdirSync(resolve(dir, name), { recursive: true });
      // park beyond the start, wait for a neutral face, then hold the key through the sweep
      await page.keyboard.down(sgn > 0 ? 'ArrowLeft' : 'ArrowRight');
      await setScale(page, 1);
      await page.waitForFunction(([f, s]) => (s > 0 ? window.__livingPortrait.snapshot().frame.yawDeg <= f + 0.05 : window.__livingPortrait.snapshot().frame.yawDeg >= f - 0.05), [from, sgn], { timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.keyboard.up(sgn > 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForFunction(neutral, null, { timeout: 60000 });
      await setScale(page, 0);
      {
        const nm = `y${from >= 0 ? 'p' : 'm'}${String(Math.abs(from)).padStart(2, '0')}`;
        const r = await save(page, resolve(dir, name, `${nm}.png`));
        rows.push({ dir: name, target: from, file: `${name}/${nm}.png`, ...r });
      }
      await page.keyboard.down(key);
      for (let y = from + sgn; sgn > 0 ? y <= to : y >= to; y += sgn) {
        // the range end is the spring's asymptote: stop 0.25 short of it (0.05 timed out at the slow clock)
        await runTo(page, y === to ? y - sgn * 0.25 : y, sgn, 0.012);
        const nm = `y${y >= 0 ? 'p' : 'm'}${String(Math.abs(y)).padStart(2, '0')}`;
        const r = await save(page, resolve(dir, name, `${nm}.png`));
        rows.push({ dir: name, target: y, file: `${name}/${nm}.png`, ...r });
        if (y % 5 === 0) console.log(tag, name, y, r.yaw, JSON.stringify(r.paint));
      }
      await page.keyboard.up(key);
    }
    writeFileSync(resolve(dir, 'log.json'), JSON.stringify(rows, null, 1));
    await ctx.close();
  },
  async clip(browser) { await record(browser, 1, 'clip'); },
  async half(browser) { await record(browser, 0.5, 'half'); },
};

async function record(browser, speed, kind) {
  const vdir = resolve(OUT, `video-${tag}-${kind}`);
  mkdirSync(vdir, { recursive: true });
  const size = { width: 720, height: 1200 };
  const { ctx, page, box, t0 } = await open(browser, query, { viewport: size, video: { dir: vdir, size } });
  await hideLegend(page);
  await page.waitForTimeout(100);
  if (speed !== 1) await setScale(page, speed);
  const beats = [];
  const T = Date.now();
  const frames = [];
  let polling = true;
  const pollLog = (async () => { while (polling) { try { frames.push({ ms: Date.now() - T, ...(await snap(page)) }); } catch { /* closing */ } await page.waitForTimeout(40); } })();
  const mark = async (b) => { const s = await snap(page); beats.push({ beat: b, ms: Date.now() - T, yaw: s.yaw, paint: s.paint }); };
  const k = 1 / speed;
  const glide = async (from, to, ms) => {
    const steps = Math.max(2, Math.round((ms * k) / 50));
    for (let i = 1; i <= steps; i++) { await gazeAt(page, box, from + ((to - from) * i) / steps); await page.waitForTimeout((ms * k) / steps); }
  };
  const wait = (ms) => page.waitForTimeout(ms * k);
  await gazeAt(page, box, 0);
  if (kind === 'clip') {
    await mark('idle'); await wait(1400);
    // the v4 clip's beats and order (tools/gen/rig-v4shots.mjs): slow turn to one side first, then the other
    await mark(`slow turn to -${A}`); await glide(0, -A, 2200); await wait(400);
    await mark('back'); await glide(-A, 0, 1700); await wait(200);
    await mark(`turn to +${A}`); await glide(0, A, 1500); await wait(300);
    await mark('back'); await glide(A, 0, 1300); await wait(300);
    await mark('blink (B)'); await page.keyboard.press('b'); await wait(700);
    await mark('smile'); await page.evaluate(() => window.__livingPortrait.forceMouthEvent('smile')); await wait(1900);
  } else {
    await mark('rest'); await wait(800);
    await mark(`turn to +${A}`); await glide(0, A, 2400); await wait(500);
    await mark(`turn to -${A}`); await glide(A, -A, 3600); await wait(500);
    await mark('back to 0'); await glide(-A, 0, 2400); await wait(700);
  }
  await mark('end');
  polling = false;
  await pollLog;
  const v = page.video();
  await ctx.close();
  const out = resolve(OUT, `${kind}-${tag}.webm`);
  renameSync(await v.path(), out);
  writeFileSync(resolve(OUT, `${kind}-${tag}.json`), JSON.stringify({ speed, range: R, query, leadMs: T - t0, beats, frames }, null, 1));
  const mixed = frames.filter((f) => f.paint && f.paint.from !== null).length;
  console.log(kind, tag, 'frames logged', frames.length, 'with two paintings', mixed, '->', out);
}

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try { await phases[phase](browser); } finally { await browser.close(); }
