/**
 * Derived lossless WebP for the shipped painted art (release 38, "r38-bytes").
 *
 * Bailey, 2026-10-03: "I'll go with all your recommendations", adopting ask 1 of the visual options: make room under the
 * 800 MB line (D-332, D-344; the strict 800,000,000 bytes of shipped files) without changing a pixel. The measurement is
 * `D:/Tools/pyrefly-scratch/2026-10-03/visual-options/bytes/README.md`: lossless WebP is about 32 percent smaller than the PNG
 * masters with every decoded RGBA pixel identical; tighter PNG compression buys only about 4 percent.
 *
 * **The masters never change.** `public/art/**.png` stays what is approved, hashed (`docs/target/approved-hashes.json`) and
 * backed up (`D:/Tools/pyrefly-art-backup`). This tool only DERIVES: for every art PNG the build ships it writes a lossless
 * WebP into a content-addressed cache (`PYREFLY_ART_CACHE`, default `D:/Tools/pyrefly-art-cache`), and `applyPlan` copies the
 * result into a build's output folder, dropping the PNG there. A file whose WebP is not smaller keeps its PNG, recompressed at
 * maximum effort (pixel-identical) when that is smaller still. `art/derived.json` in the output records every mapping.
 *
 * Every derived file is proved at encode time (decoded RGBA of the WebP equals the master's, by sha256) and again, from the
 * files themselves, by `verify` (`tools/art-verify.mjs`), which the deploy runs on the build it is about to publish.
 *
 * The command line is `tools/art-derive.mjs` (plan, warm, verify, audit); the Vite plugin is `tools/art-derive-plugin.mjs`.
 *
 * `PYREFLY_ART_WEBP=off|partial|safe|all` is the switch (default all; `inScope` says what each one derives): `off` ships the
 * PNGs exactly as before; `partial` the 2x masters and the backdrops (the first phase); `safe` everything a browser draws
 * identically from the WebP on every path; `all` everything. The cache key holds the encoder and library versions, so a changed
 * setting never reuses an old file. The tool never deletes: it copies, and `applyPlan` only removes the PNG it replaced from a
 * BUILD OUTPUT folder (never from `public/`).
 *
 * Game case: both (shared build plumbing; no game content).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import process from 'node:process';

import { isUnshippedPublicFile } from './dist-filter.mjs';

export const SCOPES = Object.freeze(['off', 'partial', 'safe', 'all']);
export const SCOPE_ENV = 'PYREFLY_ART_WEBP';
export const CACHE_ENV = 'PYREFLY_ART_CACHE';
export const DEFAULT_CACHE = 'D:/Tools/pyrefly-art-cache';
/** Where `applyPlan` writes the record of what was derived (inside the build output, so it ships and is hashed). */
export const DERIVED_REPORT = 'art/derived.json';
/** libwebp lossless at its maximum search (`quality` 100 is the exhaustive one), `exact` keeps the colour under alpha 0. */
export const ENCODER = Object.freeze({ id: 'webp-lossless-q100-e6-exact', options: Object.freeze({ lossless: true, quality: 100, effort: 6, exact: true }) });
/** The PNG pass for a file whose WebP is not smaller: maximum effort, no palette (so no colour is lost). */
const PNG_OPTIONS = Object.freeze({ compressionLevel: 9, adaptiveFiltering: true, palette: false });
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

/** `all` (default), `safe`, `partial` or `off`, from the argument or `PYREFLY_ART_WEBP`. */
export function resolveScope(value = process.env[SCOPE_ENV]) {
  const v = String(value ?? 'all').trim().toLowerCase() || 'all';
  if (!SCOPES.includes(v)) throw new Error(`${SCOPE_ENV}=${value}: expected one of ${SCOPES.join(', ')}`);
  return v;
}

export const resolveCache = (value = process.env[CACHE_ENV]) => resolve(value || DEFAULT_CACHE);

/**
 * Is this master (`art/<...>.png`, forward slashes) derived under `scope`? `alpha` is `alphaClassOf` of its pixels, which only
 * `safe` reads.
 *
 *   off      nothing: every PNG ships as before.
 *   partial  the 2x masters and the backdrops (the first phase of release 38).
 *   safe     every master the browser draws the same from a WebP as from the PNG on any path: the opaque and the binary-alpha
 *            ones (premultiplying a pixel of alpha 0 or 255 is exact for every decoder), plus the 2x masters, which are only ever
 *            textures (WebGL reads the straight RGBA back out, bit for bit). What stays PNG is the art with partly transparent
 *            pixels that the page may also draw through the DOM or a 2D canvas, where Chromium's WebP decoder premultiplies with
 *            different rounding than its PNG decoder and a pixel can differ by 1 in 255.
 *   all      every master (the default; the same decoded RGBA, and the same texture, bit for bit).
 */
export function inScope(rel, scope, alpha = null) {
  if (scope === 'off') return false;
  if (scope === 'all') return true;
  if (scope === 'safe') return alpha === 'opaque' || alpha === 'binary' || ART_2X.test(rel);
  return PARTIAL.some((re) => re.test(rel));
}

/** `opaque` (every alpha 255), `binary` (only 0 and 255) or `translucent` (any other alpha), from raw 8-bit RGBA bytes. */
export function alphaClassOf(rgba) {
  let zero = false;
  for (let i = 3; i < rgba.length; i += 4) {
    const a = rgba[i];
    if (a === 255) continue;
    if (a !== 0) return 'translucent';
    zero = true;
  }
  return zero ? 'binary' : 'opaque';
}

/** `art/a/b.png` -> `art/a/b.webp`. */
export const webpName = (rel) => rel.replace(/\.png$/, '.webp');

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

/** The chunk types of a PNG before its first IDAT: what could change colour (`iCCP`, `gAMA`, `cHRM`) is visible here. */
export function pngChunkTypes(buf) {
  const types = [];
  for (let i = 8; i + 8 <= buf.length; ) {
    const type = buf.toString('latin1', i + 4, i + 8);
    if (type === 'IDAT') break;
    types.push(type);
    i += 12 + buf.readUInt32BE(i);
  }
  return types;
}

/** Decoded RGBA of an image (a Buffer or a path), as a size and the sha256 of the raw 8-bit RGBA bytes. */
export async function pixelsOf(input) {
  const { data, info } = await getSharp()(input).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: info.channels, hash: sha256(data) };
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
 * recompressed at maximum effort (`recompressedBytes`, null when it was not tried) when that is smaller; else the master as it
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

/** The cache folder's name: the encoder, and the library versions it ran on. */
export const cacheTag = () => {
  const v = getSharp().versions;
  return `${ENCODER.id}-sharp${v.sharp}-webp${v.webp}`;
};

const cachePaths = (cacheDir, sha) => {
  const dir = join(cacheDir, cacheTag(), sha.slice(0, 2));
  return { dir, webp: join(dir, `${sha}.webp`), png: join(dir, `${sha}.png`), meta: join(dir, `${sha}.json`) };
};

/** Write through a temporary name, so a second build sharing the cache never reads a half-written file. */
function writeAtomic(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

/** The alpha class of a master (`alphaClassOf`), remembered by the master's hash, so it is read once however the encoder changes. */
async function alphaFor(master, cacheDir) {
  const png = readFileSync(master.full);
  const file = join(cacheDir, 'alpha', sha256(png).slice(0, 2), `${sha256(png)}.txt`);
  if (existsSync(file)) {
    const known = readFileSync(file, 'utf8').trim();
    if (['opaque', 'binary', 'translucent'].includes(known)) return known;
  }
  const { data } = await getSharp()(png).toColourspace('srgb').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const klass = alphaClassOf(data);
  writeAtomic(file, klass);
  return klass;
}

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
  const prove = async (buf, what) => {
    const d = await pixelsOf(buf);
    if (d.hash !== master0.hash || d.width !== master0.width || d.height !== master0.height) {
      throw new Error(`${master.rel}: the ${what} does not decode to the master's pixels; nothing was written`);
    }
  };
  const webp = await getSharp()(png).webp(ENCODER.options).toBuffer();
  await prove(webp, 'lossless WebP');
  let kind = chooseKind(png.length, webp.length);
  let again = null;
  if (kind === 'copy') {
    again = await getSharp()(png).png(PNG_OPTIONS).toBuffer();
    await prove(again, 'recompressed PNG');
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
 * The plan: what every art PNG of `publicDir` becomes in a build, encoding (and proving) what the cache lacks.
 * `entries[i]`: `{ rel, masterBytes, kind, shippedRel, shippedBytes, rgba, file }`; `kind` is `webp` (ships as `shippedRel`),
 * `png` (ships recompressed from `file`) or `copy` (ships as it is, out of scope or nothing smaller).
 */
export async function planArtDerivation({ publicDir, cacheDir = resolveCache(), scope = resolveScope(), jobs = Math.min(4, Math.max(1, cpus().length >> 1)), log = () => {} } = {}) {
  const masters = listMasterPngs(publicDir);
  // Only `safe` looks inside the pictures to decide; the other phases decide by name.
  const alphas = scope === 'safe' ? await pool(masters, jobs, (m) => alphaFor(m, cacheDir)) : [];
  const alphaOf = new Map(masters.map((m, i) => [m.rel, alphas[i] ?? null]));
  const wanted = masters.filter((m) => inScope(m.rel, scope, alphaOf.get(m.rel)));
  // A derived name that is already a file of its own (`art/pause/x.webp` beside `x.png`) would be silently replaced.
  for (const m of wanted) {
    const to = webpName(m.rel);
    if (existsSync(join(publicDir, to))) throw new Error(`${m.rel}: its derived name ${to} already exists in public/`);
  }
  let done = 0;
  const t0 = Date.now();
  const results = await pool(wanted, jobs, async (m) => {
    const r = await deriveOne(m, cacheDir);
    done++;
    if (!r.cached) log(`[art-derive] ${done}/${wanted.length} ${m.rel}: ${r.masterBytes} -> ${r.shippedBytes} (${r.kind}${r.note ? `, ${r.note}` : ''}) ${r.ms ?? 0} ms`);
    else if (done % 200 === 0) log(`[art-derive] ${done}/${wanted.length} (from the cache)`);
    return r;
  });
  const byRel = new Map(results.map((r) => [r.rel, r]));
  const entries = masters.map((m) => {
    const r = byRel.get(m.rel);
    const alpha = alphaOf.get(m.rel) ?? null;
    if (!r) return { rel: m.rel, masterBytes: m.bytes, kind: 'copy', shippedRel: m.rel, shippedBytes: m.bytes, rgba: null, file: null, ...(alpha ? { alpha } : {}) };
    return { rel: m.rel, masterBytes: r.masterBytes, kind: r.kind, shippedRel: r.kind === 'webp' ? webpName(m.rel) : m.rel, shippedBytes: r.shippedBytes, rgba: r.rgba, file: r.file, ...(alpha ? { alpha } : {}), ...(r.note ? { note: r.note } : {}) };
  });
  const sum = (f) => entries.filter(f).reduce((n, e) => n + e.shippedBytes, 0);
  const masterBytes = entries.reduce((n, e) => n + e.masterBytes, 0);
  const total = sum(() => true);
  return {
    scope, cacheDir, encoder: cacheTag(), entries, ms: Date.now() - t0,
    counts: { webp: entries.filter((e) => e.kind === 'webp').length, png: entries.filter((e) => e.kind === 'png').length, copy: entries.filter((e) => e.kind === 'copy').length },
    bytes: { masters: masterBytes, shipped: total, saved: masterBytes - total },
  };
}

/** The masters shipped as WebP, sorted: the list `ArtShipped.ts` reads as `__PYREFLY_ART_WEBP__`. */
export const shippedList = (plan) => plan.entries.filter((e) => e.kind === 'webp').map((e) => e.rel).sort();

/** The record shipped as `art/derived.json`: no clock, so a build of the same inputs is the same bytes. */
export function derivedReport(plan) {
  return {
    version: 1, tool: 'tools/art-derive.mjs', encoder: plan.encoder, scope: plan.scope, counts: plan.counts, bytes: plan.bytes,
    note: 'Every art PNG the build ships, and what it shipped as. kind webp: the master PNG is not shipped, `shipped` is its lossless WebP; `rgba` is the sha256 of the decoded 8-bit RGBA of the master, which the shipped file decodes to (proved at build and by tools/art-derive.mjs verify).',
    files: plan.entries.map((e) => ({ path: e.rel, kind: e.kind, ...(e.kind === 'webp' ? { shipped: e.shippedRel } : {}), master: e.masterBytes, bytes: e.shippedBytes, ...(e.rgba ? { rgba: e.rgba } : {}), ...(e.alpha ? { alpha: e.alpha } : {}), ...(e.note ? { note: e.note } : {}) })),
  };
}

/**
 * Put the plan into a build output: each derived WebP copied from the cache and its PNG removed from `outDir` (never from
 * `public/`), each recompressed PNG replacing its copy, and the record written. A master the build did not copy (no PNG at
 * `outDir/<rel>`) is left alone. Returns what was applied.
 */
export function applyPlan(outDir, plan) {
  const applied = { webp: 0, png: 0, skipped: [] };
  for (const e of plan.entries) {
    const dst = join(outDir, e.rel);
    if (e.kind === 'copy') continue;
    if (!existsSync(dst)) {
      applied.skipped.push(e.rel);
      continue;
    }
    if (e.kind === 'webp') {
      const to = join(outDir, e.shippedRel);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(e.file, to);
      if (statSync(to).size !== e.shippedBytes) throw new Error(`${e.shippedRel}: the copy in the build is not the cached file`);
      rmSync(dst, { force: true });
      applied.webp++;
    } else {
      copyFileSync(e.file, dst);
      applied.png++;
    }
  }
  if (plan.entries.length === 0) return applied; // a checkout without the art (it is gitignored): nothing derived, nothing to record
  const kept = new Set(applied.skipped);
  const report = derivedReport({ ...plan, entries: plan.entries.filter((e) => !kept.has(e.rel)) });
  const file = join(outDir, DERIVED_REPORT);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(report)}\n`);
  return applied;
}
