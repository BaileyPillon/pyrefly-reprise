#!/usr/bin/env node
/**
 * Every art file loads in the browser: the WHOLE shipped set, in WebKit and in Chromium (release 38, "r38-bytes"; the re-check's B3).
 *
 * `art-derive verify` proves the derived files decode to the master's RGBA with sharp, and `art-browser-identity` compares pixels as
 * Chromium draws them, but neither says that a file LOADS in the engines players use. The re-check of 2026-10-03 found two 28-byte WebP
 * that Playwright's WebKit refuses (`<img>` error, `decode()` rejects) while Chromium loads them, so Paine's living pause portrait stayed
 * static there. Every earlier check had looked at a pick of 20 to 30 files, and a file the browser cannot decode still answers `200` and
 * prints nothing, so no HTTP-status or console-error gate could see it. This is the whole-set check, with no sample and no exemption:
 *
 *  - every art file of the build: for each master in `art/derived.json` the file that ships for it (a derived WebP, a recompressed PNG,
 *    or the master's own PNG), and every other image the build ships (the lossy `.2x.webp` pause and title plates, the depth maps);
 *  - each is loaded the way the game loads art, an `<img>` with `onload` / `onerror` (as `livingParts.loadPlateImages` does), then a full
 *    `decode()`, in each engine (WebKit and Chromium by default, Firefox when asked);
 *  - an art file passes only if it decodes and its width and height are its MASTER's (read from the PNG header in `public/art`); the
 *    other images need only decode, at a size above zero;
 *  - every plate of the living portraits is judged as the loader judges it: a plate at a scale is living only if ALL its parts load, else
 *    it stays static and says nothing (`art/portrait-parts/manifest.json`, `src/app/screens/pause/livingParts.ts`);
 *  - an engine that cannot start is a failure, not a skip (a load that was never run is not a pass); so is a file the record says ships and
 *    the build does not hold, a master the record lacks, and a record of a master that is not there. There is no option to run a subset.
 *
 *   node tools/art-browser-load.mjs --dir <build output> [--public public] [--engines chromium,webkit] [--jobs 6] [--port 0] [--out report.json]
 *
 * Exit 0: every file loads in every engine. Exit 1: anything else. The deploy runs it (`tools/deploy-pages.mjs`). Playwright from node,
 * never the Claude-in-Chrome extension or the built-in pane; `PYREFLY_BROWSER=gpu` picks Chromium's real-GPU arguments as in the other
 * tools. Real Safari and iOS are not covered (Playwright's WebKit is its own build); Firefox cannot start on the owner's machine.
 * Game case: both (shared build plumbing; where it shows is the plate check, Paine, FFX-2 only).
 */
import { closeSync, createReadStream, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { DERIVED_REPORT, listMasterPngs } from './art-derive-lib.mjs';
import { currentChromiumArgs } from './browser-mode.mjs';

export const ENGINES = Object.freeze(['chromium', 'webkit', 'firefox']);
export const DEFAULT_ENGINES = Object.freeze(['chromium', 'webkit']);
const IMAGE = /\.(?:png|webp|jpe?g|gif|avif)$/i;
const TYPES = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif', '.html': 'text/html', '.json': 'application/json' };
const PLATE_MANIFEST = 'art/portrait-parts/manifest.json';

/** Width and height from a PNG's header (its first 24 bytes), or null when the file is not a PNG. */
export function pngSize(file) {
  const fd = openSync(file, 'r');
  try {
    const head = Buffer.alloc(24);
    if (readSync(fd, head, 0, 24, 0) < 24 || head.readUInt32BE(0) !== 0x89504e47 || head.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
  } finally {
    closeSync(fd);
  }
}

const walk = (root) => {
  const out = [];
  const go = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) go(full);
      else out.push(relative(root, full).split(sep).join('/'));
    }
  };
  if (existsSync(root)) go(root);
  return out.sort();
};

/**
 * What a build must load. `art`: every master of `art/derived.json` with the file that ships for it (`rel`), its kind and its master's
 * size. `others`: every other image file of the build. `problems`: a master the record lacks, a record of a master that is not in `public/art`,
 * a file the record says ships and the build does not hold, or no record at all.
 */
export function planLoads({ distDir, publicDir }) {
  const recordFile = join(distDir, DERIVED_REPORT);
  if (!existsSync(recordFile)) return { art: [], others: [], problems: [`${DERIVED_REPORT} is missing from the build: not a build that derived its art`] };
  const record = JSON.parse(readFileSync(recordFile, 'utf8'));
  const masters = new Map(listMasterPngs(publicDir).map((m) => [m.rel, m]));
  const problems = [];
  const art = [];
  const listed = new Set();
  for (const f of record.files ?? []) {
    listed.add(f.path);
    const rel = f.kind === 'webp' ? f.shipped : f.path;
    const master = masters.get(f.path);
    if (!master) problems.push(`${f.path}: art/derived.json lists a master that is not in public/art`);
    if (!rel || !existsSync(join(distDir, rel))) {
      problems.push(`${rel ?? f.path}: art/derived.json says this file ships for ${f.path}, and the build does not hold it`);
      continue;
    }
    const size = master ? pngSize(master.full) : null;
    if (master && !size) problems.push(`${f.path}: the master has no readable PNG header`);
    art.push({ rel, master: f.path, kind: f.kind, width: size?.width ?? null, height: size?.height ?? null });
  }
  for (const rel of masters.keys()) if (!listed.has(rel)) problems.push(`${rel}: art/derived.json has no entry for it`);
  const have = new Set(art.map((a) => a.rel));
  const others = walk(distDir).filter((rel) => IMAGE.test(rel) && !have.has(rel)).map((rel) => ({ rel, master: null, kind: 'other', width: null, height: null }));
  return { art, others, problems };
}

/** The plates of the build's `art/portrait-parts/manifest.json`, one per plate and scale, each part with the file that ships for it (null: none). */
export function platesOf(distDir, art) {
  const file = join(distDir, PLATE_MANIFEST);
  if (!existsSync(file)) return [];
  const shipped = new Map(art.map((a) => [a.master, a.rel]));
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  const plates = [];
  for (const [plate, spec] of Object.entries(manifest.plates ?? {})) {
    for (const scale of ['1x', '2x']) {
      const parts = Object.keys(spec.parts ?? {}).map((name) => ({ name, rel: shipped.get(`art/portrait-parts/${plate}/${scale}/${name}.png`) ?? null }));
      plates.push({ plate, scale, parts });
    }
  }
  return plates;
}

/** Why one file failed in one engine (null: it loaded and decoded at the size it must have). `row` is `{ ok, w, h, why }`. */
export function problemOf(item, row) {
  if (!row) return 'was never loaded (the page stopped before it)';
  if (!row.ok) return row.why;
  if (!(row.w > 0 && row.h > 0)) return `decoded to ${row.w}x${row.h}`;
  if (item.width !== null && (row.w !== item.width || row.h !== item.height)) return `loaded at ${row.w}x${row.h}, but its master is ${item.width}x${item.height}`;
  return null;
}

/** Runs in the page: each url as an `<img>` (onload / onerror, as the game loads art), then a full `decode()`. One `{ ok, w, h, why }` per url, in order. */
async function loadInPage({ urls, jobs, timeoutMs }) {
  const one = (url) => {
    let timer = 0;
    const work = (async () => {
      const img = new Image();
      img.decoding = 'async';
      const event = await new Promise((resolve) => {
        img.onload = () => resolve('load');
        img.onerror = () => resolve('error');
        img.src = url;
      });
      if (event !== 'load') return { ok: false, why: 'the <img> fired error: the browser could not load or parse the file' };
      try {
        await img.decode();
      } catch (err) {
        return { ok: false, why: `decode() rejected: ${err?.name ?? 'Error'}: ${String(err?.message ?? err).slice(0, 80)}` };
      }
      const row = { ok: true, w: img.naturalWidth, h: img.naturalHeight };
      img.removeAttribute('src');
      return row;
    })();
    const late = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ ok: false, why: `no answer after ${timeoutMs} ms` }), timeoutMs);
    });
    return Promise.race([work, late]).finally(() => clearTimeout(timer));
  };
  const out = new Array(urls.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(jobs, urls.length) }, async () => {
      for (;;) {
        const k = next++;
        if (k >= urls.length) return;
        out[k] = await one(urls[k]);
      }
    }),
  );
  return out;
}

const withTimeout = (promise, ms, what) => {
  let timer = 0;
  const late = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} did not finish in ${ms} ms`)), ms);
  });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
};

/** Serve a build folder (and a blank page) on 127.0.0.1; `port` 0 takes a free one. Nothing outside the folder is reachable. */
function startServer(distDir, port) {
  const root = resolve(distDir);
  const server = createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent((req.url ?? '/').split('?')[0].slice(1));
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (rel === '__blank.html') {
      res.writeHead(200, { 'content-type': 'text/html' }).end('<!doctype html><meta charset="utf-8"><title>art load</title>');
      return;
    }
    const file = resolve(root, rel);
    if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'content-length': statSync(file).size, 'cache-control': 'no-store' });
    const stream = createReadStream(file);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
  return new Promise((ok, fail) => {
    server.once('error', fail);
    server.listen(port, '127.0.0.1', () => ok({ server, port: server.address().port }));
  });
}

/**
 * The default runner: one browser of `engine`, one page, `items` loaded in chunks of `chunk`. Returns `{ version, rows, ms }` (`rows[i]` is
 * the result for `items[i]`, null when the page stopped first, with `error` saying why), or `{ unavailable }` when the engine cannot start.
 */
async function runInBrowser({ engine, baseUrl, items, jobs, chunk, log }) {
  const pw = await import('playwright');
  const t0 = Date.now();
  let browser;
  try {
    browser = engine === 'chromium' ? await pw.chromium.launch({ args: [...currentChromiumArgs()] }) : await pw[engine].launch();
  } catch (err) {
    return { unavailable: String(err?.message ?? err).split('\n')[0].slice(0, 200) };
  }
  const rows = new Array(items.length).fill(null);
  let error = null;
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/__blank.html`);
    for (let i = 0; i < items.length; i += chunk) {
      const part = items.slice(i, i + chunk);
      const urls = part.map((it) => `/${it.rel.split('/').map(encodeURIComponent).join('/')}`);
      const out = await withTimeout(page.evaluate(loadInPage, { urls, jobs, timeoutMs: 60000 }), 300000, `${engine}: ${part.length} files`);
      out.forEach((r, k) => (rows[i + k] = r));
      log(`  [${engine}] ${Math.min(i + chunk, items.length)}/${items.length}, ${rows.filter((r) => r && !r.ok).length} failed`);
    }
  } catch (err) {
    error = `the page stopped: ${String(err?.message ?? err).split('\n')[0].slice(0, 200)}`;
  }
  const version = browser.version();
  await browser.close().catch(() => {});
  return { version, rows, ms: Date.now() - t0, ...(error ? { error } : {}) };
}

/**
 * The gate (see the file header). `runEngine({ engine, baseUrl, items, jobs, chunk, log })` is the seam the unit tests use; it
 * defaults to real Playwright browsers. Returns `{ ok, checked, engines, problems, ms, items, rows }`.
 */
export async function verifyArtLoads({ distDir, publicDir, engines = DEFAULT_ENGINES, jobs = 6, chunk = 120, port = 0, log = () => {}, runEngine = runInBrowser } = {}) {
  const t0 = Date.now();
  for (const e of engines) if (!ENGINES.includes(e)) throw new Error(`unknown engine ${e}: expected ${ENGINES.join(', ')}`);
  const plan = planLoads({ distDir, publicDir });
  const items = [...plan.art, ...plan.others];
  const problems = [...plan.problems];
  const checked = { art: plan.art.length, others: plan.others.length, webp: 0, png: 0, copy: 0 };
  for (const a of plan.art) checked[a.kind === 'webp' ? 'webp' : a.kind === 'png' ? 'png' : 'copy']++;
  const report = { ok: false, checked, engines: {}, problems, ms: 0, items, rows: {} };
  if (plan.art.length === 0) {
    if (plan.problems.length === 0) problems.push(`${DERIVED_REPORT} lists no art file`);
    report.ms = Date.now() - t0;
    return report;
  }
  const plates = platesOf(distDir, plan.art);
  const { server, port: bound } = await startServer(distDir, port);
  try {
    const baseUrl = `http://127.0.0.1:${bound}`;
    const runs = await Promise.all(engines.map(async (engine) => [engine, await runEngine({ engine, baseUrl, items, jobs, chunk, log })]));
    for (const [engine, run] of runs) {
      if (run.unavailable) {
        problems.push(`[${engine}] could not start: ${run.unavailable} (a load that was never run is not a pass)`);
        report.engines[engine] = { ok: false, unavailable: run.unavailable };
        continue;
      }
      const why = items.map((it, i) => problemOf(it, run.rows[i]));
      // The cause first, then each file that failed; the files a stopped page never reached are one line, not hundreds.
      if (run.error) problems.push(`[${engine}] ${run.error}`);
      items.forEach((it, i) => why[i] && run.rows[i] && problems.push(`[${engine}] ${it.rel}: ${why[i]}`));
      const never = items.filter((_, i) => !run.rows[i]);
      if (never.length) problems.push(`[${engine}] ${never.length} file(s) were never loaded (the page stopped before them), the first ${Math.min(3, never.length)}: ${never.slice(0, 3).map((n) => n.rel).join(', ')}`);
      const loaded = new Map(items.map((it, i) => [it.rel, why[i] === null]));
      const living = plates.filter((p) => p.parts.length > 0 && p.parts.every((x) => x.rel !== null && loaded.get(x.rel) === true));
      for (const p of plates.filter((x) => !living.includes(x))) {
        const bad = p.parts.filter((x) => x.rel === null || loaded.get(x.rel) !== true).map((x) => x.name);
        problems.push(`[${engine}] the portrait plate ${p.plate}@${p.scale} would stay a still picture (the loader returns null unless every part loads): ${bad.length ? bad.join(', ') : 'no parts'} did not`);
      }
      const failed = why.filter((w) => w !== null).length;
      report.rows[engine] = run.rows;
      report.engines[engine] = { ok: failed === 0 && !run.error && living.length === plates.length, version: run.version, files: items.length, loaded: items.length - failed, failed, plates: { total: plates.length, living: living.length }, ms: run.ms };
    }
  } finally {
    server.close();
    server.closeAllConnections?.();
  }
  report.ok = problems.length === 0;
  report.ms = Date.now() - t0;
  return report;
}

/** The result as text, for the log and the handoff. */
export function formatLoadReport(r) {
  const c = r.checked;
  const names = Object.keys(r.engines);
  const lines = [`art-browser-load: ${r.ok ? 'PASS' : 'FAIL'}: ${c.art} art file(s) (${c.webp} WebP, ${c.png} recompressed PNG, ${c.copy} PNG as shipped) and ${c.others} other image(s) in ${names.length ? names.join(' and ') : 'no engine'}, ${(r.ms / 1000).toFixed(0)} s`];
  for (const [name, e] of Object.entries(r.engines)) {
    lines.push(e.unavailable ? `  ${name}: NOT RUN (${e.unavailable})` : `  ${name} ${e.version}: ${e.loaded} of ${e.files} loaded and decoded at the master's size, ${e.failed} failed; portrait plates living ${e.plates.living} of ${e.plates.total}; ${(e.ms / 1000).toFixed(0)} s`);
  }
  for (const p of r.problems.slice(0, 40)) lines.push(`  PROBLEM ${p}`);
  if (r.problems.length > 40) lines.push(`  ... and ${r.problems.length - 40} more problem(s)`);
  return lines.join('\n');
}

async function main() {
  const arg = (name, fallback = null) => {
    const i = process.argv.indexOf(name);
    return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
  };
  if (!arg('--dir')) throw new Error('give --dir <build output>');
  const result = await verifyArtLoads({
    distDir: resolve(arg('--dir')),
    publicDir: resolve(arg('--public', 'public')),
    engines: arg('--engines', DEFAULT_ENGINES.join(',')).split(',').map((s) => s.trim()).filter(Boolean),
    jobs: Number(arg('--jobs', '6')),
    port: Number(arg('--port', '0')),
    log: console.log,
  });
  console.log(formatLoadReport(result));
  if (arg('--out')) {
    mkdirSync(dirname(resolve(arg('--out'))), { recursive: true });
    writeFileSync(resolve(arg('--out')), `${JSON.stringify(result, null, 1)}\n`);
  }
  process.exitCode = result.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
