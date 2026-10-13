/**
 * The output side of the strip thumbnails (r44-thumbs): the names of the derived files, the map the bundle reads, the section of
 * `art/derived.json` that records them, and putting a plan into a build output folder. Node built-ins only, split out of
 * `art-thumbs.mjs` (which plans and proves them with sharp) the way `art-derive-apply.mjs` is split out of `art-derive-lib.mjs`:
 * `art-derive-apply.mjs` imports this file, so this file must not import the library back.
 *
 * Game case: both (shared build plumbing; the chapter board's strips are one shared screen).
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** The stem marker of a derived thumbnail: `art/backdrops/gagazet.png` -> `art/backdrops/gagazet.thumb.webp`. */
export const THUMB_INFIX = '.thumb';

/** A thumbnail's shipped name, from its master's (`art/a/b.png`) and the format it ships in. */
export const thumbName = (rel, kind) => rel.replace(/\.png$/, `${THUMB_INFIX}.${kind}`);

/** The names a thumbnail can have (`art/a/b.thumb.webp`, `art/a/b.thumb.png`). */
export const THUMB_FILE = /\.thumb\.(?:webp|png)$/;

/** Entries that ship a thumbnail, sorted by master. */
export const shippedThumbs = (plan) => plan.entries.filter((e) => e.kind === 'webp' || e.kind === 'png').sort((a, b) => (a.rel < b.rel ? -1 : 1));

/**
 * The map the bundle reads as `__PYREFLY_ART_THUMBS__` (`src/engine/ArtShipped.ts`): master -> the thumbnail file, for the masters
 * that have one. A master missing from it has no thumbnail in this build, and the board shows the full picture.
 */
export const thumbMap = (plan) => Object.fromEntries(shippedThumbs(plan).map((e) => [e.rel, e.thumbRel]));

/** The section of `art/derived.json`: what the build derived as thumbnails, or that it was told not to. No clock: the same inputs give the same bytes. */
export function thumbReport(plan) {
  if (plan.off) return { enabled: false, reason: plan.off };
  const sum = (f) => plan.entries.filter(f).reduce((n, e) => n + (e.bytes ?? 0), 0);
  return {
    enabled: true,
    spec: plan.spec,
    encoder: plan.encoder,
    counts: { webp: plan.entries.filter((e) => e.kind === 'webp').length, png: plan.entries.filter((e) => e.kind === 'png').length, none: plan.entries.filter((e) => e.kind === 'none').length },
    bytes: { masters: plan.entries.reduce((n, e) => n + (e.masterBytes ?? 0), 0), thumbs: sum((e) => e.kind !== 'none') },
    note: 'A small copy of each master the chapter board\'s strips paint (src/data/art/strip-art.json), made at build time from the master and never painted by hand: the master resized to `spec` with the named kernel and stored losslessly, as a WebP where every decoder draws it the same (opaque) and as a PNG where it is not (partly transparent). `rgba` is the sha256 of the thumbnail\'s decoded 8-bit RGBA, which `tools/art-derive.mjs verify` re-derives from the master and compares. A master with kind none ships no thumbnail and the board shows the full picture.',
    files: plan.entries.map((e) => ({
      path: e.rel,
      kind: e.kind,
      master: e.masterBytes ?? 0,
      ...(e.kind === 'none' ? {} : { thumb: e.thumbRel, width: e.width, height: e.height, bytes: e.bytes, rgba: e.rgba }),
      ...(e.note ? { note: e.note } : {}),
    })),
  };
}

/**
 * Put the thumbnails into a build output: each one copied from the cache to its shipped name, and its size checked. Never touches
 * `public/`. Returns what was written.
 */
export function applyThumbs(outDir, plan) {
  const applied = { written: 0, bytes: 0 };
  if (plan.off) return applied;
  for (const e of shippedThumbs(plan)) {
    if (!e.file || !existsSync(e.file)) throw new Error(`${e.rel}: its thumbnail ${e.thumbRel} is not in the cache`);
    const to = join(outDir, e.thumbRel);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(e.file, to);
    if (statSync(to).size !== e.bytes) throw new Error(`${e.thumbRel}: the copy in the build is not the cached file`);
    applied.written++;
    applied.bytes += e.bytes;
  }
  return applied;
}
