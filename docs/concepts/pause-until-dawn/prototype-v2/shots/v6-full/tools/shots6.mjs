#!/usr/bin/env node
/**
 * Living portrait v6 full (game case: both; Yuna X-2 plate): the browser passes on the scratch runtime (proto-v6.diff),
 * real Chromium on the GPU, the real mouse and the real keys, and a clock advanced frame by frame (`?manual=1`,
 * `stepFrame(dt)`) so every frame can carry the face the CPU rig rendered for it.
 *
 *   PYREFLY_BROWSER=gpu node shots6.mjs --url http://127.0.0.1:5720/ --out <dir> --phase log|frames|sweep|rest [--script clip|half]
 *
 * log     pass 1: the input script, stepped at the script's fps; <out>/log-<script>.json (yaw, paint, gaze target per frame)
 * frames  pass 2: the same input, and before each step the face of that frame (<out>/faces-<script>/faces.json, face_turn.py)
 *         is put into the painted key's front; the page (720 x 1200, legend hidden with the real H key) -> frames-<script>/
 *         and the log again (the paint per frame must equal pass 1's)
 * sweep   ?post=0, reduced motion (the real R key), one set of frozen weights on all nine keys (<out>/faces-<tag>), the real
 *         arrow keys held and the clock stepped until every degree from -40 to +40 and back: canvas PNGs -> <tag>/{up,down}
 * rest    ?post=0, reduced motion, no input: the canvas of v5.1 and of v6 at rest (the frontal as one back + front)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { currentChromiumArgs } from '../../../../../../../tools/browser-mode.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const base = arg('--url');
const OUT = resolve(arg('--out', '.'));
const phase = arg('--phase', 'log');
const script = arg('--script', 'clip');
/** sweep: which frozen-weight faces (turn6.py sweep|sweep-rest) -> <out>/<tag>/ */
const tag = arg('--tag', 'sweep');
const R = 40;
mkdirSync(OUT, { recursive: true });

/** Input keyframes [t (runtime s), yaw target (deg), mouse y (-1..1)]; linear between, a step = two at one time. */
const SCRIPTS = {
  // the full turn: idle, a glance, -40, a glance there, the whole sweep to +40, a big step back to 0
  clip: { fps: 60, end: 15.0, keys: [[0, 0, 0], [1.6, 0, 0], [1.6, 14, -0.22], [2.5, 14, -0.22], [2.5, 0, 0], [3.0, 0, 0], [4.3, -R, 0],
    [5.6, -R, 0], [5.6, -24, 0.18], [6.4, -24, 0.18], [6.4, -R, 0], [6.9, -R, 0], [9.1, R, 0], [10.9, R, 0], [10.9, 0, 0], [15.0, 0, 0]] },
  // v5.1's compare turn (shots.mjs `half`): 0 -> +40 -> -40 -> 0 with the same glides and holds, rendered at 50 fps and
  // encoded at 25 (half speed)
  half: { fps: 50, end: 10.9, keys: [[0, 0, 0], [0.8, 0, 0], [3.2, R, 0], [3.7, R, 0], [7.3, -R, 0], [7.8, -R, 0], [10.2, 0, 0], [10.9, 0, 0]] },
};

function inputAt(keys, t) {
  let k = keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a[0] && t < b[0]) {
      const g = (t - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * g, a[2] + (b[2] - a[2]) * g];
    }
    if (t >= b[0]) k = b;
  }
  return [k[1], k[2]];
}

const snap = () => {
  const s = window.__livingPortrait.snapshot(); const f = s.frame;
  return { t: +f.timeSeconds.toFixed(4), yaw: +f.yawDeg.toFixed(4), base: +f.baseYawDeg.toFixed(4), pitch: +f.pitchDeg.toFixed(4), gx: +f.gaze.x.toFixed(4), gy: +f.gaze.y.toFixed(4), rm: f.reducedMotion, paint: s.paint };
};

async function open(browser, q, viewport = { width: 720, height: 1200 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(base + q, { timeout: 180000 });
  await page.waitForFunction(() => window.__livingPortrait && window.__livingPortrait.renderer && window.__livingPortrait.renderer.composer, null, { timeout: 90000 });
  await page.evaluate(() => window.__livingPortrait.stepFrame(0));
  const box = await page.locator('canvas[data-living-portrait]').boundingBox();
  return { ctx, page, box };
}

async function hideLegend(page) {
  await page.keyboard.press('h');
  await page.waitForFunction(() => document.getElementById('legend').style.display === 'none', null, { timeout: 5000 });
}

function mouseXY(box, yaw, y) {
  // 1 px right of centre at yaw 0 (a centred mouse is "no input" to the runtime and would hold the last target)
  const x = box.x + (box.width * (yaw / R + 1)) / 2 + (Math.abs(yaw) < 1e-6 ? 1 : 0);
  return [Math.max(box.x + 1, Math.min(box.x + box.width - 1, x)), box.y + (box.height * (y + 1)) / 2];
}

async function canvasPng(page, path) {
  const d = await page.evaluate(() => document.querySelector('canvas[data-living-portrait]').toDataURL('image/png'));
  writeFileSync(path, Buffer.from(d.split(',')[1], 'base64'));
}

async function upload(page, faces) {
  return page.evaluate(async (fs) => {
    const d = window.__livingPortrait;
    let ok = true;
    for (const f of fs) ok = (await d.setFace(f.key, f.x, f.y, f.url, !!f.over)) && ok;
    return ok;
  }, faces);
}

async function run(browser, withFaces) {
  const S = SCRIPTS[script];
  const { ctx, page, box } = await open(browser, '?rig=v6&v6=1&manual=1');
  await hideLegend(page);
  const faces = withFaces ? JSON.parse(readFileSync(resolve(OUT, `faces-${script}`, 'faces.json'), 'utf8')) : null;
  const fdir = resolve(OUT, `frames-${script}`);
  if (withFaces) mkdirSync(fdir, { recursive: true });
  const n = Math.round(S.end * S.fps);
  const rows = [];
  let last = null;
  let bad = 0;
  for (let i = 0; i < n; i++) {
    const t = i / S.fps;
    const [yaw, y] = inputAt(S.keys, t);
    const [mx, my] = mouseXY(box, yaw, y);
    if (!last || Math.abs(mx - last[0]) > 0.01 || Math.abs(my - last[1]) > 0.01) { await page.mouse.move(mx, my); last = [mx, my]; }
    if (faces) {
      const f = faces.frames[i];
      if (!(await upload(page, f.uploads))) bad++;
    }
    const r = await page.evaluate(([dt, first]) => { window.__livingPortrait.stepFrame(first ? 0 : dt); return null; }, [1 / S.fps, i === 0]);
    const s = await page.evaluate(snap);
    rows.push({ i, inYaw: +yaw.toFixed(3), inY: +y.toFixed(3), ...s });
    if (faces && faces.frames[i].key !== s.paint.to) bad++;
    if (withFaces) await page.screenshot({ path: resolve(fdir, `${String(i).padStart(5, '0')}.png`) });
    if (i % 120 === 0) console.log(script, i, s.yaw, JSON.stringify(s.paint), r);
  }
  writeFileSync(resolve(OUT, `${withFaces ? 'log2' : 'log'}-${script}.json`), JSON.stringify({ fps: S.fps, end: S.end, keys: S.keys, box, frames: rows }));
  console.log(script, 'frames', rows.length, 'with two paintings', rows.filter((f) => f.paint.from !== null).length, withFaces ? `upload/paint mismatches ${bad}` : '');
  await ctx.close();
}

const phases = {
  async log(browser) { await run(browser, false); },
  async frames(browser) { await run(browser, true); },
  async rest(browser) {
    for (const [tag, q] of [['v51', '?post=0&manual=1'], ['v6', '?rig=v6&v6=1&post=0&manual=1']]) {
      const { ctx, page } = await open(browser, q, { width: 1000, height: 2000 });
      await page.keyboard.press('r');
      for (let i = 0; i < 5; i++) await page.evaluate(() => window.__livingPortrait.stepFrame(1 / 60));
      console.log(tag, JSON.stringify(await page.evaluate(snap)));
      await canvasPng(page, resolve(OUT, `rest-${tag}.png`));
      await ctx.close();
    }
  },
  async sweep(browser) {
    // --tag sweep-v51: the same stepped sweep on v5.1 as committed (its own rig, lids and patches), the baseline
    const v51 = tag === 'sweep-v51';
    const { ctx, page } = await open(browser, v51 ? '?post=0&manual=1' : '?rig=v6&v6=1&post=0&manual=1', { width: 1000, height: 2000 });
    await page.mouse.move(0, 0);
    await page.keyboard.press('r');
    if (!v51) {
      const faces = JSON.parse(readFileSync(resolve(OUT, `faces-${tag}`, 'faces.json'), 'utf8'));
      if (!(await upload(page, faces.uploads))) throw new Error('sweep upload failed');
    }
    const step = (dt) => page.evaluate((d) => window.__livingPortrait.stepFrame(d).frame.yawDeg, dt);
    const rows = [];
    for (const [name, key, from, to, sgn] of [['up', 'ArrowRight', -R, R, 1], ['down', 'ArrowLeft', R, -R, -1]]) {
      mkdirSync(resolve(OUT, tag, name), { recursive: true });
      await page.keyboard.down(sgn > 0 ? 'ArrowLeft' : 'ArrowRight');
      for (let k = 0; k < 600; k++) await step(1 / 30);
      await page.keyboard.up(sgn > 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.keyboard.down(key);
      for (let y = from; sgn > 0 ? y <= to : y >= to; y += sgn) {
        const tg = y === to ? y - sgn * 0.25 : y === from ? null : y;
        let yaw = await step(0);
        let guard = 0;
        while (tg !== null && (sgn > 0 ? yaw < tg : yaw > tg) && guard++ < 20000) yaw = await step(1 / 2000);
        const nm = `y${y >= 0 ? 'p' : 'm'}${String(Math.abs(y)).padStart(2, '0')}`;
        await canvasPng(page, resolve(OUT, tag, name, `${nm}.png`));
        const s = await page.evaluate(snap);
        rows.push({ dir: name, target: y, file: `${name}/${nm}.png`, ...s });
        if (y % 10 === 0) console.log('sweep', name, y, s.yaw, JSON.stringify(s.paint));
      }
      await page.keyboard.up(key);
    }
    writeFileSync(resolve(OUT, tag, 'log.json'), JSON.stringify(rows, null, 1));
    await ctx.close();
  },
};

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
try { await phases[phase](browser); } finally { await browser.close(); }
