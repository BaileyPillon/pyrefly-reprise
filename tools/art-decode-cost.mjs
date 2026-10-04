#!/usr/bin/env node
/**
 * What decoding the derived WebP costs against the PNG master, in the browser (release 38, "r38-bytes").
 *
 * For a stratified sample of the files a build ships as derived WebP (the record is `art/derived.json`; strata are the art's
 * folders and the 2x masters, taken evenly by size), the master PNG from `public/` and the shipped WebP are each fetched into a
 * blob, then `img.decode()` is timed on a fresh blob URL, network excluded, median of N alternating repetitions, in headless
 * Chromium (Playwright from node; `PYREFLY_BROWSER=gpu` for the real GPU). The totals are per file, per megapixel and per kind
 * of art.
 *
 *   node tools/art-decode-cost.mjs --dir <build output> [--public public] [--sample 90] [--reps 5] [--port 6505] [--out cost.json]
 *
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
const kindOf = (path) => (path.includes('@2x') ? '2x' : path.split('/')[1]);

/** Runs in the page: both decodes of one pair, `reps` times, alternating. */
async function timePair(master, shipped, reps) {
  const blobs = {};
  for (const [k, u] of Object.entries({ png: `/master/${master}`, webp: `/shipped/${shipped}` })) blobs[k] = await (await fetch(u, { cache: 'no-store' })).blob();
  const t = { png: [], webp: [] };
  let w = 0;
  let h = 0;
  for (let i = 0; i < reps; i++) {
    for (const k of i % 2 === 0 ? ['png', 'webp'] : ['webp', 'png']) {
      const url = URL.createObjectURL(blobs[k]);
      const img = new Image();
      img.src = url;
      const t0 = performance.now();
      await img.decode();
      t[k].push(performance.now() - t0);
      w = img.naturalWidth;
      h = img.naturalHeight;
      URL.revokeObjectURL(url);
    }
  }
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  return { w, h, png: med(t.png), webp: med(t.webp), pngBytes: blobs.png.size, webpBytes: blobs.webp.size };
}

async function main() {
  if (!arg('--dir')) throw new Error('give --dir <build output>');
  const dist = resolve(arg('--dir'));
  const pub = resolve(arg('--public', 'public'));
  const sample = Number(arg('--sample', '90'));
  const reps = Number(arg('--reps', '5'));
  const port = Number(arg('--port', '6505'));
  const record = JSON.parse(readFileSync(join(dist, 'art', 'derived.json'), 'utf8'));
  const pairs = record.files.filter((f) => f.kind === 'webp');
  const byKind = {};
  for (const f of pairs) (byKind[kindOf(f.path)] ??= []).push(f);
  const picked = [];
  for (const list of Object.values(byKind)) {
    list.sort((a, b) => a.master - b.master);
    const n = Math.max(1, Math.round((sample * list.length) / pairs.length));
    for (let i = 0; i < n; i++) picked.push(list[Math.min(list.length - 1, Math.floor(((i + 0.5) * list.length) / n))]);
  }
  const server = createServer((req, res) => {
    if (req.url === '/blank.html') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<!doctype html><body></body>');
      return;
    }
    const m = /^\/(master|shipped)\/(.+)$/.exec(req.url ?? '');
    const file = m ? join(m[1] === 'master' ? pub : dist, decodeURIComponent(m[2])) : null;
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': file.endsWith('.webp') ? 'image/webp' : 'image/png', 'content-length': statSync(file).size });
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const rows = [];
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/blank.html`);
    console.log(`art-decode-cost (${resolveBrowserMode()}): ${picked.length} of ${pairs.length} pairs, ${reps} repetitions`);
    for (const f of picked) rows.push({ path: f.path, kind: kindOf(f.path), ...(await page.evaluate(`(${timePair.toString()})(${JSON.stringify(f.path)}, ${JSON.stringify(f.shipped)}, ${reps})`)) });
  } finally {
    await browser.close();
    server.close();
  }
  const sum = (key) => rows.reduce((n, r) => n + r[key], 0);
  const mp = rows.reduce((n, r) => n + (r.w * r.h) / 1e6, 0);
  console.log(`total over ${rows.length} files, ${mp.toFixed(1)} MP: PNG ${sum('png').toFixed(0)} ms, WebP ${sum('webp').toFixed(0)} ms, ratio ${(sum('webp') / sum('png')).toFixed(2)}; per MP ${(sum('png') / mp).toFixed(1)} against ${(sum('webp') / mp).toFixed(1)} ms`);
  const kinds = {};
  for (const r of rows) {
    const c = (kinds[r.kind] ??= { files: 0, png: 0, webp: 0, mp: 0, pngBytes: 0, webpBytes: 0 });
    c.files++;
    c.png += r.png;
    c.webp += r.webp;
    c.mp += (r.w * r.h) / 1e6;
    c.pngBytes += r.pngBytes;
    c.webpBytes += r.webpBytes;
  }
  for (const [k, c] of Object.entries(kinds)) console.log(`  ${k.padEnd(14)} ${String(c.files).padStart(3)} files ${c.mp.toFixed(1).padStart(6)} MP  PNG ${(c.png / c.files).toFixed(0).padStart(4)} ms  WebP ${(c.webp / c.files).toFixed(0).padStart(4)} ms per file (${(c.webp / c.png).toFixed(2)}x), bytes ${(c.pngBytes / 1e6).toFixed(1)} to ${(c.webpBytes / 1e6).toFixed(1)} MB`);
  if (arg('--out')) {
    mkdirSync(dirname(resolve(arg('--out'))), { recursive: true });
    writeFileSync(resolve(arg('--out')), `${JSON.stringify({ rows, kinds }, null, 1)}\n`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
