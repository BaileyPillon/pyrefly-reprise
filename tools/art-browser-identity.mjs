#!/usr/bin/env node
/**
 * The same pixels in the browser: every shipped art file against its master PNG, as Chromium decodes them (release 38,
 * "r38-bytes"). `node tools/art-derive.mjs verify` proves the derived WebP decodes to the master's RGBA with sharp (libvips,
 * libwebp, libpng). The game does not use those decoders, so this repeats the proof with the one that matters: the browser's.
 *
 * For each file the build ships as a derived WebP (the record is `art/derived.json`), the master PNG from `public/` and the
 * shipped file are loaded as images in headless Chromium (Playwright, from node; `PYREFLY_BROWSER=gpu` for the real GPU) and
 * compared two ways:
 *   - 2D canvas: `drawImage` then `getImageData`, which is what the game's own alpha measuring and matte checks read;
 *   - WebGL2 texture: `texImage2D` with `UNPACK_PREMULTIPLY_ALPHA_WEBGL` off and no colour-space conversion (how three.js uploads
 *     a painting), drawn 1:1 with `texelFetch` into an RGBA8 target and read back with `readPixels`: the texels the shader samples.
 * Both must be equal to the last channel value, for the size of the image. The WebGL read is the texture path of the 3D scenes
 * and must be exact for every file. The 2D canvas is read twice more with the art drawn over black and over white (what a
 * screen shows, so a pixel's colour is compared where it was premultiplied, not where `getImageData` divides it back out):
 *   - opaque art and art whose alpha is only 0 and 255 must match exactly: premultiplying alpha 0 or 255 is exact;
 *   - art with partly transparent pixels is allowed one step in 255 on those pixels and no more: Chromium premultiplies a
 *     decoded WebP (inside libwebp) and a decoded PNG (in Skia) with different rounding. `--screen-exact` makes even that a
 *     failure, which is what a build made with PYREFLY_ART_WEBP=safe must pass; the 2x masters (`@2x`) are exempt from it,
 *     because they are only ever loaded as WebGL textures (`src/engine/ArtTier.ts`), where the read is exact.
 *
 *   node tools/art-browser-identity.mjs --dir <build output> [--public public] [--port 6504] [--only substring] [--screen-exact]
 *        [--out report.json]
 *
 * Exit 0: every pair as required. Exit 1: any difference beyond that, or any file that would not load.
 * Game case: both (shared build plumbing).
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const TYPES = { '.png': 'image/png', '.webp': 'image/webp', '.html': 'text/html' };

/** Runs in the page: one pair, both ways. */
function comparePair(masterUrl, shippedUrl) {
  const load = async (url) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  };
  const canvasRead = (img, backdrop = null) => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (backdrop) {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.drawImage(img, 0, 0);
    return new Uint32Array(ctx.getImageData(0, 0, c.width, c.height).data.buffer);
  };
  const gl = (window.__gl ??= (() => {
    const canvas = document.createElement('canvas');
    const g = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!g) throw new Error('no WebGL2');
    const sh = (type, src) => {
      const s = g.createShader(type);
      g.shaderSource(s, src);
      g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s));
      return s;
    };
    const p = g.createProgram();
    g.attachShader(p, sh(g.VERTEX_SHADER, '#version 300 es\nvoid main(){ vec2 v=vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); gl_Position=vec4(v*2.0-1.0,0.0,1.0); }'));
    g.attachShader(p, sh(g.FRAGMENT_SHADER, '#version 300 es\nprecision highp float; uniform highp sampler2D t; out vec4 o; void main(){ o = texelFetch(t, ivec2(gl_FragCoord.xy), 0); }'));
    g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p));
    return { g, p };
  })());
  const glRead = (img) => {
    const { g, p } = gl;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, g.RGBA, g.UNSIGNED_BYTE, img);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    const target = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, target);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
    const fbo = g.createFramebuffer();
    g.bindFramebuffer(g.FRAMEBUFFER, fbo);
    g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, target, 0);
    g.viewport(0, 0, w, h);
    g.disable(g.BLEND);
    g.useProgram(p);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.uniform1i(g.getUniformLocation(p, 't'), 0);
    g.drawArrays(g.TRIANGLES, 0, 3);
    const px = new Uint8Array(w * h * 4);
    g.readPixels(0, 0, w, h, g.RGBA, g.UNSIGNED_BYTE, px);
    g.deleteTexture(tex);
    g.deleteTexture(target);
    g.deleteFramebuffer(fbo);
    return new Uint32Array(px.buffer);
  };
  const diff = (a, b) => {
    if (a.length !== b.length) return -1;
    let n = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
    return n;
  };
  /** How far apart two RGBA readbacks are: the pixels that differ and the largest difference in any one channel. */
  const spread = (a, b) => {
    let pixels = 0;
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (x === y) continue;
      pixels++;
      for (let sh = 0; sh < 32; sh += 8) max = Math.max(max, Math.abs(((x >>> sh) & 255) - ((y >>> sh) & 255)));
    }
    return { pixels, max };
  };
  return (async () => {
    const [m, s] = [await load(masterUrl), await load(shippedUrl)];
    const size = `${m.naturalWidth}x${m.naturalHeight}`;
    if (size !== `${s.naturalWidth}x${s.naturalHeight}`) return { size, error: `size differs: ${s.naturalWidth}x${s.naturalHeight}` };
    const ms = canvasRead(m);
    const ss = canvasRead(s);
    let alpha = 'opaque';
    const bytes = new Uint8Array(ms.buffer);
    for (let i = 3; i < bytes.length && alpha !== 'translucent'; i += 4) {
      const a = bytes[i];
      if (a === 255) continue;
      alpha = a === 0 ? 'binary' : 'translucent';
    }
    return {
      size,
      alpha,
      webgl: diff(glRead(m), glRead(s)),
      canvas: diff(ms, ss),
      canvasMax: spread(ms, ss).max,
      overBlack: spread(canvasRead(m, '#000'), canvasRead(s, '#000')),
      overWhite: spread(canvasRead(m, '#fff'), canvasRead(s, '#fff')),
    };
  })();
}

async function main() {
  const dist = resolve(arg('--dir') ?? '');
  if (!arg('--dir')) throw new Error('give --dir <build output>');
  const pub = resolve(arg('--public', 'public'));
  const only = arg('--only');
  const screenExact = process.argv.includes('--screen-exact');
  const recordFile = join(dist, 'art', 'derived.json');
  if (!existsSync(recordFile)) throw new Error(`${recordFile} is missing: not a build that derived its art`);
  const record = JSON.parse(readFileSync(recordFile, 'utf8'));
  const pairs = record.files.filter((f) => f.kind === 'webp' && (!only || f.path.includes(only))).map((f) => ({ master: f.path, shipped: f.shipped }));

  const server = createServer((req, res) => {
    const m = /^\/(master|shipped)\/(.+?)(?:\?.*)?$/.exec(req.url ?? '');
    if (req.url === '/blank.html') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><html><body></body></html>');
      return;
    }
    const file = m ? join(m[1] === 'master' ? pub : dist, decodeURIComponent(m[2])) : null;
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream', 'content-length': statSync(file).size });
    createReadStream(file).pipe(res);
  });
  const port = Number(arg('--port', '6504'));
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const rows = [];
  const problems = [];
  const t0 = Date.now();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/blank.html`);
    const renderer = await page.evaluate(() => {
      const g = document.createElement('canvas').getContext('webgl2');
      const e = g?.getExtension('WEBGL_debug_renderer_info');
      return g && e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'no WebGL2';
    });
    console.log(`art-browser-identity: ${pairs.length} pair(s) in ${resolveBrowserMode()} mode (${await browser.version()}, ${renderer})`);
    for (const [i, p] of pairs.entries()) {
      let r;
      try {
        r = await page.evaluate(`(${comparePair.toString()})(${JSON.stringify(`/master/${p.master}`)}, ${JSON.stringify(`/shipped/${p.shipped}`)})`);
      } catch (err) {
        r = { error: String(err.message ?? err).slice(0, 160) };
      }
      rows.push({ master: p.master, shipped: p.shipped, ...r });
      const screen = Math.max(r.overBlack?.max ?? 0, r.overWhite?.max ?? 0);
      const screenPixels = (r.overBlack?.pixels ?? 0) + (r.overWhite?.pixels ?? 0);
      if (r.error) problems.push(`${p.master}: ${r.error}`);
      else if (r.webgl !== 0) problems.push(`${p.master}: ${r.webgl} WebGL texel(s) differ`);
      else if (r.alpha !== 'translucent' && (r.canvas !== 0 || screenPixels !== 0)) problems.push(`${p.master}: ${r.alpha} art, yet ${r.canvas} canvas pixel(s) and ${screenPixels} screen pixel(s) differ`);
      else if (screen > 1) problems.push(`${p.master}: a screen pixel differs by ${screen} steps of 255`);
      else if (screenExact && screenPixels !== 0 && !/@2x\.png$/.test(p.master)) problems.push(`${p.master}: ${screenPixels} screen pixel(s) differ by ${screen} step of 255 (--screen-exact)`);
      if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${pairs.length}, ${problems.length} problem(s)`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  const ok = problems.length === 0 && rows.length > 0;
  const byClass = {};
  for (const r of rows) {
    const k = (byClass[r.alpha ?? 'unknown'] ??= { files: 0, webglExact: 0, screenExact: 0, screenMax: 0 });
    k.files++;
    if (r.webgl === 0) k.webglExact++;
    const px = (r.overBlack?.pixels ?? 0) + (r.overWhite?.pixels ?? 0);
    if (px === 0) k.screenExact++;
    k.screenMax = Math.max(k.screenMax, r.overBlack?.max ?? 0, r.overWhite?.max ?? 0);
  }
  console.log(`art-browser-identity: ${ok ? 'PASS' : 'FAIL'}: ${rows.length} pair(s) compared in the browser (2D canvas and WebGL texture), ${problems.length} problem(s), ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  for (const [k, v] of Object.entries(byClass)) console.log(`  ${k}: ${v.files} file(s), ${v.webglExact} exact as a WebGL texture, ${v.screenExact} exact on screen, largest screen difference ${v.screenMax} step(s) of 255`);
  for (const p of problems.slice(0, 30)) console.log(`  PROBLEM ${p}`);
  if (arg('--out')) {
    mkdirSync(dirname(resolve(arg('--out'))), { recursive: true });
    writeFileSync(resolve(arg('--out')), `${JSON.stringify({ ok, pairs: rows.length, byClass, problems, rows }, null, 1)}\n`);
  }
  process.exitCode = ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
