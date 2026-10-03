/**
 * Derived lossless WebP for the shipped painted art (release 38, "r38-bytes").
 *
 * Bailey, 2026-10-03: "I'll go with all your recommendations", adopting ask 1 of the visual options: make room under the
 * 800 MB line (D-332, D-344; the strict 800,000,000 bytes of shipped files) without changing a pixel, with "lossless WebP copies of
 * the shipped art (the PNG originals in the project stay as they are, and a check proves every shipped copy matches its original
 * pixel for pixel) ... tighter PNG compression". The measurement is
 * `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/bytes/README.md`: lossless WebP is about 32 percent smaller than the PNG masters
 * with every decoded RGBA pixel identical.
 *
 * **The masters never change.** `public/art/**.png` stays what is approved, hashed (`docs/target/approved-hashes.json`) and
 * backed up (`D:/Tools/pyrefly-art-backup`). This tool only DERIVES: for the art PNGs the build ships it writes a lossless WebP
 * (or, for the PNGs that stay PNG, the same picture recompressed) into a content-addressed cache (`PYREFLY_ART_CACHE`, default
 * `D:/Tools/pyrefly-art-cache`), and `applyPlan` (`art-derive-apply.mjs`) copies the result into a build's output folder, dropping
 * the PNG there when a WebP replaced it. `art/derived.json` in the output records every mapping.
 *
 * **What ships by default is `exact`** (the independent check of 2026-10-03 found that `safe` was not): a master ships as a WebP only
 * if every decoder draws it the same from the WebP as from the PNG, which is when premultiplying alpha is the identity on all of its
 * pixels: it is opaque, or its alpha is only 0 and 255 with no colour left under alpha 0 (`art-image-facts.mjs` says why). Every other
 * master ships as a PNG, recompressed at maximum effort with the colour under alpha 0 kept, each proved to decode to the master's RGBA
 * in all four channels. So the pixels are the same on every path and in every engine, not only in the Chromium that was measured.
 *
 * Every derived file is proved at encode time (decoded RGBA of the file equals the master's, by sha256) and again, from the
 * files themselves, by `verify` (`tools/art-verify.mjs`), which the deploy runs on the build it is about to publish.
 *
 * The command line is `tools/art-derive.mjs` (plan, warm, verify, audit); the Vite plugin is `tools/art-derive-plugin.mjs`.
 *
 * `PYREFLY_ART_WEBP=off|partial|safe|exact|all` is the switch (default `exact`; `inScope` says what each one derives): `off` ships the
 * PNGs exactly as before. `partial`, `safe` and `all` are not decoder independent (the deploy's gate refuses them) and stay for
 * measurement. The cache key holds the encoder and library versions, so a changed setting never reuses an old file. The tool never
 * deletes: it copies, and `applyPlan` only removes the PNG it replaced from a BUILD OUTPUT folder (never from `public/`).
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';

import { DERIVED_REPORT, applyPlan, derivedReport, shippedList, webpName } from './art-derive-apply.mjs';
import { ALPHA_CLASSES, alphaClassOf, alphaInfoOf, decoderIndependent, pngChunkTypes, stripAncillaryChunks } from './art-image-facts.mjs';
import { isUnshippedPublicFile } from './dist-filter.mjs';

export { ALPHA_CLASSES, DERIVED_REPORT, alphaClassOf, alphaInfoOf, applyPlan, decoderIndependent, derivedReport, pngChunkTypes, shippedList, webpName };

export const SCOPES = Object.freeze(['off', 'partial', 'safe', 'exact', 'all']);
/** What ships when nothing is set: `exact` (a WebP only where every decoder draws it the same as the PNG; D-351 promised that not a pixel changes). */
export const DEFAULT_SCOPE = 'exact';
export const SCOPE_ENV = 'PYREFLY_ART_WEBP';
export const CACHE_ENV = 'PYREFLY_ART_CACHE';
export const DEFAULT_CACHE = 'D:/Tools/pyrefly-art-cache';
/** libwebp lossless at its maximum search (`quality` 100 is the exhaustive one), `exact` keeps the colour under alpha 0. */
export const ENCODER = Object.freeze({ id: 'webp-lossless-q100-e6-exact', options: Object.freeze({ lossless: true, quality: 100, effort: 6, exact: true }) });
/** The PNG pass: maximum effort, adaptive filtering, no palette (so no colour is lost), and no metadata chunks (`stripAncillaryChunks`). */
export const PNG_ENCODER = Object.freeze({ id: 'png-l9-adaptive-nopalette-nometa', options: Object.freeze({ compressionLevel: 9, adaptiveFiltering: true, palette: false }) });
const WEBP_MAX_SIDE = 16383;
const ART_2X = /^art\/characters\/[^/]+\/[^/]+@2x\.png$/;
const PARTIAL = [ART_2X, /^art\/backdrops\/.+\.png$/];

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

let sharpModule = null;
/** sharp, loaded once, with its operation cache off (a long run decodes each file once). */
export function getSharp() {
  if (!sharpModule) {
    const require = createRequire(import.meta.url);
    sharpModule = require('sharp');
    sharpModule.cache(false);
    sharpModule.concurrency(2); // the pool below is the parallelism; each operation stays small
  }
  return sharpModule;
}

/** `exact` (default), `safe`, `all`, `partial` or `off`, from the argument or `PYREFLY_ART_WEBP`; unset or blank is {@link DEFAULT_SCOPE}. */
export function resolveScope(value = process.env[SCOPE_ENV]) {
  const v = String(value ?? DEFAULT_SCOPE).trim().toLowerCase() || DEFAULT_SCOPE;
  if (!SCOPES.includes(v)) throw new Error(`${SCOPE_ENV}=${value}: expected one of ${SCOPES.join(', ')}`);
  return v;
}

export const resolveCache = (value = process.env[CACHE_ENV]) => resolve(value || DEFAULT_CACHE);

/**
 * Is this master (`art/<...>.png`, forward slashes) derived as a WebP under `scope`? `alpha` is its transparency class and `hidden`
 * the number of fully transparent texels that still carry colour (`alphaInfoOf` of its pixels), which `safe` and `exact` read.
 *
 *   off      nothing: every PNG ships as before.
 *   partial  the 2x masters and the backdrops (the first phase of release 38; not exact).
 *   safe     the opaque and binary-alpha masters and every 2x master (not exact, and not the default: the 2x masters are partly
 *            transparent, and one of them is read back through the matte's 2D canvas, where the WebP and the PNG came out up to 124
 *            in 255 apart; the colour under alpha 0 of a WebP is also lost in WebKit).
 *   exact    the default: only the masters every decoder draws the same, opaque ones and binary-alpha ones with nothing hidden under
 *            alpha 0 (`decoderIndependent`). Unknown facts are a no. Every other master stays a PNG.
 *   all      every master (not exact: the same decoded RGBA and the same texture in Chromium, but a composited edge pixel of the
 *            partly transparent art can move through the DOM or a 2D canvas).
 */
export function inScope(rel, scope, alpha = null, hidden = null) {
  if (scope === 'off') return false;
  if (scope === 'all') return true;
  if (scope === 'exact') return decoderIndependent(alpha, hidden);
  if (scope === 'safe') return alpha === 'opaque' || alpha === 'binary' || ART_2X.test(rel);
  return PARTIAL.some((re) => re.test(rel));
}

/**
 * Every art PNG a build ships, from `public/`: all `public/art/**.png` except what `dist-filter.mjs` never ships (raw renders,
 * numbered takes). Links ARE followed (a worktree's junctioned `public/art` is read, never written).
 */
export function listMasterPngs(publicDir) {
  const out = [];
  const root = join(publicDir, 'art');
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith('.png')) {
        const rel = relative(publicDir, full).split(sep).join('/');
        if (!isUnshippedPublicFile(rel)) out.push({ rel, full, bytes: st.size });
      }
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort((a, b) => (a.rel < b.rel ? -1 : 1));
}

/**
 * Decoded RGBA of an image (a Buffer or a path), as a size and the sha256 of the raw 8-bit RGBA bytes: all four channels of every
 * pixel, the colour under alpha 0 included. `{ facts: true }` adds its transparency facts (`alphaInfoOf`).
 */
export async function pixelsOf(input, { facts = false } = {}) {
  const { data, info } = await getSharp()(input).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, hash: sha256(data), ...(facts ? alphaInfoOf(data) : {}) };
}

/** Why a master is kept as it is instead of derived (null: it can be derived). */
export async function refusalFor(png) {
  const bad = pngChunkTypes(png).filter((t) => ['iCCP', 'gAMA', 'cHRM'].includes(t));
  if (bad.length) return `carries ${bad.join(', ')} (colour management a WebP would drop)`;
  const m = await getSharp()(png).metadata();
  if (m.depth !== 'uchar') return `is ${m.depth}, not 8 bits per channel`;
  if ((m.pages ?? 1) > 1) return 'has more than one frame';
  if (Math.max(m.width ?? 0, m.height ?? 0) > WEBP_MAX_SIDE) return 'is larger than a WebP can be';
  return null;
}

/**
 * What a master becomes, from the sizes of its candidates: the WebP when it is smaller than the master; else the PNG
 * recompressed at maximum effort (`recompressedBytes`, null when it was not tried) when that is smaller still; else the master as it
 * is. A tie keeps the master, so no file ever ships larger than the one that is approved.
 */
export function chooseKind(masterBytes, webpBytes, recompressedBytes = null) {
  if (webpBytes < masterBytes) return 'webp';
  return recompressedBytes !== null && recompressedBytes < masterBytes ? 'png' : 'copy';
}

/** Run `fn` over `items` with at most `jobs` in flight; results keep their order. */
export async function pool(items, jobs, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const k = next++;
      if (k >= items.length) return;
      out[k] = await fn(items[k], k);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, items.length)) }, worker));
  return out;
}

const versions = () => getSharp().versions;
/** The WebP cache folder's name: the encoder, and the library versions it ran on. */
export const cacheTag = () => `${ENCODER.id}-sharp${versions().sharp}-webp${versions().webp}`;
/** The PNG cache folder's name: the PNG pass, and the libraries (libvips, libpng, zlib-ng) it ran on. */
export const pngCacheTag = () => `${PNG_ENCODER.id}-sharp${versions().sharp}-vips${versions().vips}-png${versions().png}-zlib${versions()['zlib-ng'] ?? versions().zlib ?? 'x'}`;

const cachePaths = (cacheDir, sha) => {
  const dir = join(cacheDir, cacheTag(), sha.slice(0, 2));
  return { dir, webp: join(dir, `${sha}.webp`), png: join(dir, `${sha}.png`), meta: join(dir, `${sha}.json`) };
};
const pngCachePaths = (cacheDir, sha) => {
  const dir = join(cacheDir, pngCacheTag(), sha.slice(0, 2));
  return { dir, png: join(dir, `${sha}.png`), meta: join(dir, `${sha}.json`) };
};

/** Write through a temporary name, so a second build sharing the cache never reads a half-written file. */
function writeAtomic(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

/** The transparency facts of a master (`alphaInfoOf`), remembered by the master's hash, so they are read once however the encoder changes. */
async function alphaInfoFor(master, cacheDir) {
  const png = readFileSync(master.full);
  const sha = sha256(png);
  const file = join(cacheDir, 'alpha', sha.slice(0, 2), `${sha}.json`);
  if (existsSync(file)) {
    try {
      const known = JSON.parse(readFileSync(file, 'utf8'));
      if (known.v === 1 && ALPHA_CLASSES.includes(known.alpha) && Number.isInteger(known.hidden)) return known;
    } catch {
      /* unreadable: read the picture again */
    }
  }
  const px = await pixelsOf(png, { facts: true });
  const facts = { v: 1, alpha: px.alpha, transparent: px.transparent, hidden: px.hidden };
  writeAtomic(file, JSON.stringify(facts));
  return facts;
}

/** Throws unless `buf` decodes to exactly the master's picture: the size and every byte of all four channels (by sha256), colour under alpha 0 included. */
export async function proveSame(rel, buf, what, master0) {
  const d = await pixelsOf(buf);
  if (d.hash !== master0.hash || d.width !== master0.width || d.height !== master0.height) throw new Error(`${rel}: the ${what} does not decode to the master's pixels; nothing was written`);
}

/** The PNG pass over a master's bytes: maximum effort, then the metadata chunks libvips adds dropped. The caller proves the pixels. */
const encodePng = async (png) => stripAncillaryChunks(await getSharp()(png).png(PNG_ENCODER.options).toBuffer());

/** One master's decision: `{ kind: 'webp' | 'png' | 'copy', shippedBytes, rgba, file }`, from the cache or freshly encoded and proved. */
async function deriveOne(master, cacheDir) {
  const png = readFileSync(master.full);
  const sha = sha256(png);
  const c = cachePaths(cacheDir, sha);
  const base = { rel: master.rel, masterBytes: png.length, masterSha256: sha };
  const hit = existsSync(c.meta) ? JSON.parse(readFileSync(c.meta, 'utf8')) : null;
  if (hit && hit.masterBytes === png.length) {
    const file = hit.kind === 'webp' ? c.webp : hit.kind === 'png' ? c.png : null;
    if (file === null || (existsSync(file) && statSync(file).size === hit.shippedBytes)) return { ...base, ...hit, file, cached: true };
  }
  const t0 = Date.now();
  const refused = await refusalFor(png);
  const master0 = await pixelsOf(png);
  if (refused) {
    const meta = { masterBytes: png.length, kind: 'copy', shippedBytes: png.length, rgba: master0.hash, note: refused };
    writeAtomic(c.meta, JSON.stringify(meta));
    return { ...base, ...meta, file: null, cached: false };
  }
  const webp = await getSharp()(png).webp(ENCODER.options).toBuffer();
  await proveSame(master.rel, webp, 'lossless WebP', master0);
  let kind = chooseKind(png.length, webp.length);
  let again = null;
  if (kind === 'copy') {
    again = await encodePng(png);
    await proveSame(master.rel, again, 'recompressed PNG', master0);
    kind = chooseKind(png.length, webp.length, again.length);
  }
  const shipped = kind === 'webp' ? webp : kind === 'png' ? again : null;
  const file = kind === 'webp' ? c.webp : kind === 'png' ? c.png : null;
  const meta = { masterBytes: png.length, kind, shippedBytes: shipped ? shipped.length : png.length, rgba: master0.hash, ms: Date.now() - t0 };
  if (file) writeAtomic(file, shipped);
  writeAtomic(c.meta, JSON.stringify(meta));
  return { ...base, ...meta, file, cached: false };
}

/**
 * A master that stays a PNG under `exact`: the same picture at maximum PNG effort, proved to decode to the master's RGBA in all four
 * channels (the colour under alpha 0 included) before it is cached, and shipped only when it is smaller; else the master's own bytes.
 * Returns what `deriveOne` does (`kind` is `png` or `copy`).
 */
async function recompressOne(master, cacheDir) {
  const png = readFileSync(master.full);
  const sha = sha256(png);
  const c = pngCachePaths(cacheDir, sha);
  const base = { rel: master.rel, masterBytes: png.length, masterSha256: sha };
  const hit = existsSync(c.meta) ? JSON.parse(readFileSync(c.meta, 'utf8')) : null;
  if (hit && hit.masterBytes === png.length) {
    const file = hit.kind === 'png' ? c.png : null;
    if (file === null || (existsSync(file) && statSync(file).size === hit.shippedBytes)) return { ...base, ...hit, file, cached: true };
  }
  const t0 = Date.now();
  const refused = await refusalFor(png);
  const master0 = await pixelsOf(png);
  let meta = { masterBytes: png.length, kind: 'copy', shippedBytes: png.length, rgba: master0.hash, ...(refused ? { note: refused } : {}) };
  let again = null;
  if (!refused) {
    again = await encodePng(png);
    await proveSame(master.rel, again, 'recompressed PNG', master0);
    if (again.length < png.length) meta = { masterBytes: png.length, kind: 'png', shippedBytes: again.length, rgba: master0.hash, ms: Date.now() - t0 };
  }
  if (meta.kind === 'png') writeAtomic(c.png, again);
  writeAtomic(c.meta, JSON.stringify(meta));
  return { ...base, ...meta, file: meta.kind === 'png' ? c.png : null, cached: false };
}

/**
 * The plan: what every art PNG of `publicDir` becomes in a build, encoding (and proving) what the cache lacks.
 * `entries[i]`: `{ rel, masterBytes, kind, shippedRel, shippedBytes, rgba, file, alpha?, hidden? }`; `kind` is `webp` (ships as `shippedRel`),
 * `png` (ships recompressed from `file`) or `copy` (ships as it is, out of scope or nothing smaller). Under `exact` every master that
 * is not a WebP is recompressed (`png`), unless that is not smaller.
 */
export async function planArtDerivation({ publicDir, cacheDir = resolveCache(), scope = resolveScope(), jobs = Math.min(4, Math.max(1, cpus().length >> 1)), log = () => {} } = {}) {
  const masters = listMasterPngs(publicDir);
  // Only `safe` and `exact` look inside the pictures to decide; the other phases decide by name.
  const reads = scope === 'safe' || scope === 'exact';
  const facts = reads ? await pool(masters, jobs, (m) => alphaInfoFor(m, cacheDir)) : [];
  const factsOf = new Map(masters.map((m, i) => [m.rel, facts[i] ?? null]));
  const wanted = masters.filter((m) => inScope(m.rel, scope, factsOf.get(m.rel)?.alpha ?? null, factsOf.get(m.rel)?.hidden ?? null));
  const asWebp = new Set(wanted.map((m) => m.rel));
  const rest = scope === 'exact' ? masters.filter((m) => !asWebp.has(m.rel)) : [];
  // A derived name that is already a file of its own (`art/pause/x.webp` beside `x.png`) would be silently replaced.
  for (const m of wanted) {
    const to = webpName(m.rel);
    if (existsSync(join(publicDir, to))) throw new Error(`${m.rel}: its derived name ${to} already exists in public/`);
  }
  let done = 0;
  const t0 = Date.now();
  const run = (items, one) => pool(items, jobs, async (m) => {
    const r = await one(m, cacheDir);
    done++;
    if (!r.cached) log(`[art-derive] ${done}/${wanted.length + rest.length} ${m.rel}: ${r.masterBytes} -> ${r.shippedBytes} (${r.kind}${r.note ? `, ${r.note}` : ''}) ${r.ms ?? 0} ms`);
    else if (done % 200 === 0) log(`[art-derive] ${done}/${wanted.length + rest.length} (from the cache)`);
    return r;
  });
  const results = [...(await run(wanted, deriveOne)), ...(await run(rest, recompressOne))];
  const byRel = new Map(results.map((r) => [r.rel, r]));
  const entries = masters.map((m) => {
    const r = byRel.get(m.rel);
    const f = factsOf.get(m.rel);
    const seen = f ? { alpha: f.alpha, hidden: f.hidden } : {};
    if (!r) return { rel: m.rel, masterBytes: m.bytes, kind: 'copy', shippedRel: m.rel, shippedBytes: m.bytes, rgba: null, file: null, ...seen };
    return { rel: m.rel, masterBytes: r.masterBytes, kind: r.kind, shippedRel: r.kind === 'webp' ? webpName(m.rel) : m.rel, shippedBytes: r.shippedBytes, rgba: r.rgba, file: r.file, ...seen, ...(r.note ? { note: r.note } : {}) };
  });
  const sum = (f) => entries.filter(f).reduce((n, e) => n + e.shippedBytes, 0);
  const masterBytes = entries.reduce((n, e) => n + e.masterBytes, 0);
  const total = sum(() => true);
  return {
    scope, cacheDir, encoder: cacheTag(), ...(scope === 'exact' ? { pngEncoder: pngCacheTag() } : {}), entries, ms: Date.now() - t0,
    counts: { webp: entries.filter((e) => e.kind === 'webp').length, png: entries.filter((e) => e.kind === 'png').length, copy: entries.filter((e) => e.kind === 'copy').length },
    bytes: { masters: masterBytes, shipped: total, saved: masterBytes - total },
  };
}
