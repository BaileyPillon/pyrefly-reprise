/**
 * **The gate's rules for format v2 parts and variants** (2026-10-18; both games; the rig program's `rig-v2` track). A key may show or hide a part and swap a part's image for a variant; these rules
 * stop that from becoming a way to pass the gate by deleting the figure or by carrying data nothing uses. The reading of a state (`rig-pose.mjs#keyState`), the raster (`rig-raster.mjs`) and the
 * hole scan (`rig-holes.mjs`) know the state already; this file holds what is judged ABOUT it.
 *
 *   hidden-share      a key may hide at most {@link HIDDEN_SHARE_MAX} of the idle's rest alpha area (the parts shown at rest that the key hides, drawn at rest, over the whole rest figure). The overlap
 *                     bar of 0.75 and the landmark rule still judge the figure AS DRAWN, so hiding a part cannot raise an overlap, but it could lower the figure's mass to dodge a hole; this caps it.
 *   part-never-shown  a part marked `hidden` that no key shows is dead data (the reader refuses it too).
 *   variant-unused    a variant no key swaps in is dead data, and a texture the engine loads for nothing.
 *   variant-missing   a key swaps in a variant the part does not have (raised by `rig-format.mjs`).
 *
 * And a REPORT, not a refusal: each variant's palette distance from its base part ({@link variantPalettes}). A mixed costume is allowed (Lulu's front parts are cut from her defend and Overdrive
 * paintings), but the driver's clip review reads this number, so it is said.
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { rasterize } from './rig-raster.mjs';
import { keyState, restPose, restState } from './rig-pose.mjs';

/** The most of the idle's rest alpha area a key may hide. */
export const HIDDEN_SHARE_MAX = 0.6;

/** The rules that need no raster: dead data. @returns {Array<{code: string, message: string}>} */
export function variantRules(rt) {
  const out = [];
  const keys = Object.entries(rt.keys);
  for (const p of rt.parts) {
    if (p.hidden && !keys.some(([n, k]) => n !== 'idle' && k.parts?.[p.name]?.show)) out.push({ code: 'part-never-shown', message: `part ${p.name} is hidden at rest and no key shows it (dead data)` });
    for (const vn of Object.keys(p.variants ?? {})) {
      if (!keys.some(([, k]) => k.parts?.[p.name]?.show && k.parts[p.name].image === vn)) out.push({ code: 'variant-unused', message: `part ${p.name} variant ${vn}: no key swaps it in (dead data, and a texture the engine would load for nothing)` });
    }
  }
  return out;
}

const painted = (alpha) => {
  let n = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] > 128) n++;
  return n;
};

/**
 * The share of the idle's rest alpha area that `key` hides: the parts shown at rest and hidden in the key, drawn at rest, over `restArea` (the painted pixels of the whole rest figure at `frame`).
 * Zero for a key that hides nothing, and for any v1 rig.
 */
export function hiddenShare(rt, frame, key, restArea) {
  const rest = restState(rt);
  const state = keyState(rt, key);
  const hidden = rt.parts.filter((p) => rest[p.name].shown && !state[p.name].shown).map((p) => p.name);
  if (!hidden.length || !(restArea > 0)) return 0;
  const { alpha } = rasterize(rt, restPose(rt), frame, { parts: hidden, state: Object.fromEntries(rt.parts.map((p) => [p.name, { shown: true, image: null }])) });
  return painted(alpha) / restArea;
}

/** Alpha-weighted histogram of an image's colours, 4 bits a channel (4096 bins), normalised to sum 1. */
async function histogram(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Float64Array(4096);
  let total = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const a = data[i * 4 + 3];
    if (a < 32) continue;
    bins[((data[i * 4] >> 4) << 8) | ((data[i * 4 + 1] >> 4) << 4) | (data[i * 4 + 2] >> 4)] += a;
    total += a;
  }
  if (total > 0) for (let i = 0; i < bins.length; i++) bins[i] /= total;
  return bins;
}

/**
 * Each variant's palette distance from its base part, 0 (the same colours) to 1 (nothing in common): the total variation distance of the two alpha-weighted colour histograms. A repaint of the
 * same part (a wound, a mouth) reads near 0; a different costume's pixels read high. A report for the driver's clip review, never a refusal.
 * @returns {Promise<Array<{part: string, variant: string, distance: number}>>}
 */
export async function variantPalettes(rt, dir) {
  const out = [];
  for (const p of rt.parts) {
    const vs = Object.entries(p.variants ?? {});
    if (!vs.length) continue;
    const base = await histogram(join(dir, p.png));
    for (const [vn, v] of vs) {
      const h = await histogram(join(dir, v.png));
      let d = 0;
      for (let i = 0; i < h.length; i++) d += Math.abs(h[i] - base[i]);
      out.push({ part: p.name, variant: vn, distance: Math.round((d / 2) * 1000) / 1000 });
    }
  }
  return out;
}
