/**
 * Strip thumbnails: a small derived copy of each painting the chapter board's rail strips paint (r44-thumbs; Bailey, 2026-10-12 ~23:15 EDT,
 * "I'll go with all of your recommendations", the driver's "a yes or no on chapter picture thumbnails").
 *
 * **Game case: both** (shared board and art pipeline; no game content, no painting, no data value changes).
 *
 * ## Why
 *
 * Each rail card paints its boss on its scene (D-183), and the only files for that were the full 4-6 MB backdrop and the boss idle:
 * eighteen cards are about 100 MB of masters, drawn at a strip of about 260 x 35 px (`docs/handoff/r43-delivery.md` section 3: "the rail is
 * 90 of the 110 MB"). The strips now show a thumbnail; the full painting loads when its plate is shown (`src/app/screens/frontend/`).
 *
 * ## What it is
 *
 * **The masters never change** (`public/art/**.png`, hashed in `docs/target/approved-hashes.json`, backed up). For each master named by
 * `src/data/art/strip-art.json` a build derives ONE thumbnail, by a rule and not by hand: the master decoded to sRGB RGBA, resized with
 * Lanczos3 to {@link THUMB_SPEC} (a scene to 768 px wide, a figure to 576 px tall, never enlarged, aspect kept to the pixel), and stored
 * LOSSLESSLY, the same way the full pictures are (`art-derive-lib.mjs`): a WebP where every decoder draws it the same (the picture is
 * opaque, `decoderIndependent`) and a PNG where it is not (a painting with soft edges). The sizes are for the strip's real size, measured on the
 * real board in a browser (`docs/handoff/r44-thumbs.md`): the scene fills the card's art, 233 px wide on a 1600 x 900 window (467 at 2x), 562 on 4K,
 * 722 on a 390 x 844 phone at 3x and 750 on a 5K retina; the boss on a card is drawn at most 118 px tall at 1600 x 900 (236 at 2x) and 478 on the
 * phone at 3x, 528 on a large tablet at 2x. A thumbnail at least as wide or tall as the strip's device pixels is as sharp as the full picture the
 * browser would have scaled down (measured against it: 45 dB and up); one smaller is upscaled and soft (30 dB). So 768 px and 576 px: sharp at 2x on a
 * desktop and at 3x on a phone, with room.
 *
 * Because it is lossless, a thumbnail has an exact proof: its decoded RGBA must equal the master's, resized again by the same rule (the
 * encode-time proof here, and `tools/art-derive.mjs verify` from the files of the finished build). A thumbnail that is not what the rule
 * gives is a failed build, never a softer picture. The cache is content-addressed like the full pictures' (`PYREFLY_ART_CACHE`), keyed by
 * the master's hash, the spec, the encoders and the library versions.
 *
 * `PYREFLY_ART_THUMBS=off` ships none (the strips then show the full paintings, as before r44): the switch for a live problem.
 * A master the tool refuses (colour management a WebP would drop, 16 bits, a second frame) or that is no larger than the thumbnail size
 * ships none and says why; the runtime then shows the full picture (`src/engine/ArtShipped.ts` `thumbArtUrl`).
 */
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';

import { ENCODER, MIN_WEBP_BYTES, PNG_ENCODER, getSharp, pixelsOf, pool, refusalFor, resolveCache, sha256 } from './art-derive-lib.mjs';
import { alphaInfoOf, decoderIndependent, stripAncillaryChunks } from './art-image-facts.mjs';
import { thumbName } from './art-thumb-apply.mjs';

export { THUMB_FILE, THUMB_INFIX, applyThumbs, shippedThumbs, thumbMap, thumbName, thumbReport } from './art-thumb-apply.mjs';

/** The rule. Bumping `id` (or any number) makes every cache entry stale, because the cache folder is named after it. */
export const THUMB_SPEC = Object.freeze({ id: 'strip-thumb-1', kernel: 'lanczos3', sceneWidth: 768, figureHeight: 576 });
export const THUMBS_ENV = 'PYREFLY_ART_THUMBS';
/** The masters the board's strips paint, relative to the repository root. */
export const STRIP_LIST = 'src/data/art/strip-art.json';
/** A name the list may hold: a scene backdrop, or a character's idle painting. */
const STRIP_MASTER = /^art\/(?:backdrops\/[a-z0-9][a-z0-9-]*|characters\/[a-z0-9][a-z0-9-]*\/idle)\.png$/;

/** `on` (default) or `off`, from the argument or `PYREFLY_ART_THUMBS`; unset or blank is `on`. */
export function resolveThumbSwitch(value = process.env[THUMBS_ENV]) {
  const v = String(value ?? 'on').trim().toLowerCase() || 'on';
  if (v !== 'on' && v !== 'off') throw new Error(`${THUMBS_ENV}=${value}: expected on or off`);
  return v;
}

/** The masters of the strip list: sorted, unique, each a scene backdrop or a character's idle. Throws on anything else. */
export function readStripList(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const list = data?.masters;
  if (!Array.isArray(list)) throw new Error(`${file}: expected { "masters": [...] }`);
  const bad = list.filter((m) => typeof m !== 'string' || !STRIP_MASTER.test(m));
  if (bad.length) throw new Error(`${file}: not a scene backdrop or a character idle: ${bad.slice(0, 3).join(', ')}`);
  if (new Set(list).size !== list.length) throw new Error(`${file}: a master is listed twice`);
  return [...list].sort();
}

/**
 * The thumbnail size for a master of `width` x `height`: a scene is 768 px wide, a figure 576 px tall, the other side kept to the
 * master's aspect and rounded to a whole pixel; never larger than the master (`reduced` is false then and no thumbnail is made).
 */
export function thumbTarget(rel, width, height) {
  const scene = rel.startsWith('art/backdrops/');
  const scale = scene ? THUMB_SPEC.sceneWidth / width : THUMB_SPEC.figureHeight / height;
  if (!(scale < 1)) return { width, height, reduced: false };
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), reduced: true };
}

const versions = () => getSharp().versions;
/** The cache folder's name: the rule, the two encoders, and the library versions they ran on. */
export const thumbCacheTag = () => {
  const v = versions();
  return `${THUMB_SPEC.id}-${THUMB_SPEC.kernel}-s${THUMB_SPEC.sceneWidth}-f${THUMB_SPEC.figureHeight}-${ENCODER.id}-${PNG_ENCODER.id}-sharp${v.sharp}-vips${v.vips}-webp${v.webp}-png${v.png}`;
};

/**
 * The reference thumbnail of a master (its bytes or its path): the decoded RGBA the shipped file must equal. The ONE definition of the
 * rule, used to make a thumbnail and again to check it from the finished build.
 */
export async function referenceThumb(input, rel) {
  const sharp = getSharp();
  const meta = await sharp(input).metadata();
  const target = thumbTarget(rel, meta.width, meta.height);
  const { data, info } = await sharp(input)
    .toColourspace('srgb')
    .ensureAlpha()
    .resize(target.width, target.height, { fit: 'fill', kernel: THUMB_SPEC.kernel })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data, hash: sha256(data), facts: alphaInfoOf(data), masterWidth: meta.width, masterHeight: meta.height, reduced: target.reduced };
}

/**
 * How a reference ships: a WebP when every decoder draws it the same (opaque; `decoderIndependent`) and it is smaller than the PNG and not
 * under the {@link MIN_WEBP_BYTES} floor; otherwise the PNG at maximum effort with its metadata chunks dropped.
 */
async function encodeThumb(ref) {
  const sharp = getSharp();
  const opaque = ref.facts.alpha === 'opaque';
  const source = () => {
    const s = sharp(ref.data, { raw: { width: ref.width, height: ref.height, channels: 4 } });
    return opaque ? s.removeAlpha() : s;
  };
  const png = stripAncillaryChunks(await source().png(PNG_ENCODER.options).toBuffer());
  const webp = decoderIndependent(ref.facts.alpha, ref.facts.hidden) ? await source().webp(ENCODER.options).toBuffer() : null;
  if (webp && webp.length >= MIN_WEBP_BYTES && webp.length < png.length) return { kind: 'webp', buf: webp };
  return { kind: 'png', buf: png };
}

function writeAtomic(file, data) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, file);
}

const cachePaths = (cacheDir, sha) => {
  const dir = join(cacheDir, 'thumbs', thumbCacheTag(), sha.slice(0, 2));
  return { dir, meta: join(dir, `${sha}.json`), file: (kind) => join(dir, `${sha}.${kind}`) };
};

/** One master's decision: `{ kind: 'webp' | 'png' | 'none', ... }`, from the cache or freshly made and proved. */
async function deriveThumb(master, cacheDir) {
  const png = readFileSync(master.full);
  const sha = sha256(png);
  const c = cachePaths(cacheDir, sha);
  const base = { rel: master.rel, masterBytes: png.length, masterSha256: sha };
  const hit = existsSync(c.meta) ? JSON.parse(readFileSync(c.meta, 'utf8')) : null;
  if (hit && hit.v === 1 && hit.masterBytes === png.length) {
    if (hit.kind === 'none') return { ...base, ...hit, file: null, cached: true };
    const file = c.file(hit.kind);
    if (existsSync(file) && statSync(file).size === hit.bytes) return { ...base, ...hit, file, cached: true };
  }
  const t0 = Date.now();
  const none = (note) => {
    const meta = { v: 1, kind: 'none', masterBytes: png.length, note };
    writeAtomic(c.meta, JSON.stringify(meta));
    return { ...base, ...meta, file: null, cached: false };
  };
  const refused = await refusalFor(png);
  if (refused) return none(refused);
  const ref = await referenceThumb(png, master.rel);
  if (!ref.reduced) return none(`is ${ref.masterWidth}x${ref.masterHeight}, no larger than a thumbnail would be`);
  const enc = await encodeThumb(ref);
  const got = await pixelsOf(enc.buf);
  if (got.hash !== ref.hash || got.width !== ref.width || got.height !== ref.height) {
    throw new Error(`${master.rel}: the ${enc.kind} thumbnail does not decode to the master resized by the rule; nothing was written`);
  }
  const meta = { v: 1, kind: enc.kind, width: ref.width, height: ref.height, masterBytes: png.length, masterWidth: ref.masterWidth, masterHeight: ref.masterHeight, bytes: enc.buf.length, rgba: ref.hash, alpha: ref.facts.alpha, ms: Date.now() - t0 };
  const file = c.file(enc.kind);
  writeAtomic(file, enc.buf);
  writeAtomic(c.meta, JSON.stringify(meta));
  return { ...base, ...meta, file, cached: false };
}

/**
 * The plan: what every listed master's thumbnail is, encoding (and proving) what the cache lacks.
 * `entries[i]`: `{ rel, thumbRel, kind, width, height, masterBytes, bytes, rgba, file, alpha?, note? }`, sorted by master; `kind` is `webp`, `png`
 * or `none` (no thumbnail: `note` says why, `thumbRel`/`file` are absent). `off` (true, or the reason as a string) means the build is to make none.
 */
export async function planThumbs({ publicDir, cacheDir = resolveCache(), listFile = null, list = null, jobs = Math.min(4, Math.max(1, cpus().length >> 1)), log = () => {}, off = false } = {}) {
  const spec = { ...THUMB_SPEC };
  if (off) return { off: typeof off === 'string' ? off : `${THUMBS_ENV}=off`, spec, encoder: thumbCacheTag(), entries: [], ms: 0 };
  const wanted = list ?? readStripList(listFile);
  const t0 = Date.now();
  let done = 0;
  const results = await pool(wanted, jobs, async (rel) => {
    const full = join(publicDir, rel);
    if (!existsSync(full)) return { rel, kind: 'none', masterBytes: 0, note: 'is not in public/art', file: null };
    const r = await deriveThumb({ rel, full }, cacheDir);
    done++;
    if (!r.cached) log(`[art-thumbs] ${done}/${wanted.length} ${rel}: ${r.masterBytes} -> ${r.bytes ?? 0} (${r.kind}${r.width ? `, ${r.width}x${r.height}` : ''}${r.note ? `, ${r.note}` : ''}) ${r.ms ?? 0} ms`);
    return r;
  });
  const entries = results
    .map((r) => (r.kind === 'none' ? { rel: r.rel, kind: 'none', masterBytes: r.masterBytes, file: null, ...(r.note ? { note: r.note } : {}) } : { rel: r.rel, thumbRel: thumbName(r.rel, r.kind), kind: r.kind, width: r.width, height: r.height, masterBytes: r.masterBytes, bytes: r.bytes, rgba: r.rgba, alpha: r.alpha, file: r.file }))
    .sort((a, b) => (a.rel < b.rel ? -1 : 1));
  return { spec, encoder: thumbCacheTag(), entries, ms: Date.now() - t0 };
}
