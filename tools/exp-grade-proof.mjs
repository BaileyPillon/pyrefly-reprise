#!/usr/bin/env node
/**
 * The grade stage of the live renderer, run on a fixed picture: the proof that a change to the room's look leaves every other chapter's grade as it was
 * (branch `exp-leblanc`; FFX-2 only for the room, "both" for the proof: it reads FFX and FFX-2 chapters).
 *
 *   PYREFLY_BROWSER=gpu node tools/exp-grade-proof.mjs --base http://127.0.0.1:4190/ [--chapters seymour-flux,ffx2-bahamut,ffx2-leblanc] [--out proof.json]
 *
 * Why not two frames: a battle frame holds animation (the camera's drift, the dust, the figures' breathing), so two builds never draw the same pixels. The grade
 * is the one stage a look change touches, and it is a pure function of its uniforms and its input: this opens each chapter's battle, reads the uniforms its
 * scene left on the live grade pass, and runs THAT pass (the live `ShaderPass`, the live shader program) over two fixed pictures, a 256 x 256 ramp of every
 * red, green and blue level with a falling alpha, and the same with the alpha at 1, into an 8-bit target; the bytes it reads back are hashed. Run it on two builds
 * (the committed look and the new one) and the hashes of every chapter but the experiment's must be the same, byte for byte, with the same uniforms.
 * The new haze uniforms are listed too: each must be at its neutral value (0) in every other chapter.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { open, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};
const BASE = arg('--base', 'http://127.0.0.1:4190/');
const CHAPTERS = arg('--chapters', 'seymour-flux,ffx2-bahamut,ffx2-leblanc').split(',');
const OUT = arg('--out', null);

/** Runs inside the page. */
async function proofInPage() {
  const app = window.__pyrefly.app;
  const R = app.renderer;
  const pass = R.gradePass;
  const gl = R.renderer;
  const RT = R.composer.renderTarget1.constructor;
  const Tex = R.composer.renderTarget1.texture.constructor;
  const N = 256;
  const make = (alphaFalls) => {
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = (y * N + x) * 4;
        img.data[i] = x; // red across
        img.data[i + 1] = y; // green down
        img.data[i + 2] = (x * 3 + y * 5) & 255; // blue: a diagonal sweep
        img.data[i + 3] = alphaFalls ? 255 - ((x + y) >> 1) : 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new Tex(c);
    t.needsUpdate = true;
    return t;
  };
  const u = pass.uniforms;
  const snapshot = {};
  for (const [k, v] of Object.entries(u)) {
    const x = v.value;
    if (typeof x === 'number') snapshot[k] = x;
    else if (x && typeof x.x === 'number' && typeof x.z === 'number' && x.w === undefined) snapshot[k] = [x.x, x.y, x.z];
  }
  // what the proof holds still: the clock (the grain), the figure path's bloom lookup
  const keep = { time: u.time.value, bloomRemove: u.bloomRemove.value };
  u.time.value = 0.5;
  u.bloomRemove.value = 0;
  const prevTarget = gl.getRenderTarget();
  const hashes = {};
  for (const [name, falls] of [['opaque', false], ['alpha', true]]) {
    const target = new RT(N, N);
    const input = make(falls);
    const wasScreen = pass.renderToScreen;
    pass.renderToScreen = false;
    pass.render(gl, target, { texture: input }, 0, false);
    pass.renderToScreen = wasScreen;
    const buf = new Uint8Array(N * N * 4);
    gl.readRenderTargetPixels(target, 0, 0, N, N, buf);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    hashes[name] = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    target.dispose();
    input.dispose();
  }
  gl.setRenderTarget(prevTarget);
  u.time.value = keep.time;
  u.bloomRemove.value = keep.bloomRemove;
  return { hashes, uniforms: snapshot, palette: R.palette?.name ?? null };
}

const results = {};
for (const chapter of CHAPTERS) {
  const ctx = await open({ base: BASE, fresh: true });
  try {
    await ctx.page.evaluate(() => window.__pyrefly.setSeed(1));
    ctx.page.evaluate((c) => window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, seed: 1 }), chapter).catch(() => {});
    await waitBattleMenu(ctx.page, 180000);
    await ctx.page.waitForTimeout(2500);
    results[chapter] = await ctx.page.evaluate(proofInPage);
    const r = results[chapter];
    const haze = ['hazeColor', 'hazeAmount', 'hazeSide'].map((k) => `${k}=${JSON.stringify(r.uniforms[k] ?? 'absent')}`).join(' ');
    console.log(`${chapter.padEnd(18)} palette ${String(r.palette).padEnd(20)} opaque ${r.hashes.opaque.slice(0, 16)} alpha ${r.hashes.alpha.slice(0, 16)}  ${haze}`);
  } finally {
    await ctx.browser.close();
  }
}
if (OUT) {
  mkdirSync(dirname(resolve(OUT)), { recursive: true });
  writeFileSync(resolve(OUT), JSON.stringify(results, null, 1));
  console.log('wrote', resolve(OUT));
}
