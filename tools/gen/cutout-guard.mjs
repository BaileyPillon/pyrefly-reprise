/**
 * Cut-out sanity guard — catches the rembg failures a bad pose prompt causes,
 * even after `lintSpritePrompt` (comfy.mjs) has stripped the tokens that cause
 * most of them.
 *
 * 2026-09-21: a `yuna-dark-knight` pose render prompted with `dark aura,
 * black and purple, attacking, dynamic pose, action pose` came back as a
 * coloured swirl wrapped around the figure, duplicated blades, and mangled
 * limbs. `isnet-anime` kept the whole swirl as opaque content, so the crop box
 * came back covering the entire 832x1216 source frame instead of a tight box
 * around a figure — exactly the failure `docs/ART-PIPELINE.md` §2 item 4
 * already warned about ("the crop box comes back as the whole 832x1216
 * frame"). A written warning was not enough; this is the check that makes it
 * mechanical.
 *
 * Three independent checks, any one of which rejects the cutout:
 *
 *   1. **Coverage.** The cropped image covers almost the entire source canvas
 *      in both width and height — a real standing figure leaves visible
 *      margin on at least one axis; a swirl or splatter fills the frame on
 *      both.
 *   2. **A second blob.** A connected component of opaque pixels, well
 *      removed from the main figure, big enough to be a duplicated weapon or
 *      a floating scrap of effect rather than image noise.
 *   3. **A near-white patch.** A concentration of near-white opaque pixels —
 *      background rembg failed to cut — that is either its own detached blob
 *      or reaches the edge of the frame. Deliberately NOT triggered by white
 *      *clothing*: Yuna's sash, Yunalesca's robe and Leblanc's fan are legal,
 *      because their white pixels are internal to the figure's own blob and
 *      never touch the canvas edge. See `NEAR_WHITE_REGION_FRACTION_MIN`.
 *
 * Everything that touches pixels is exercised through `evaluateCutout`, which
 * takes plain typed arrays and is a pure function — no PNG decode, no
 * filesystem — so `tests/unit/art-cutout-guard.test.ts` can hand it synthetic
 * masks precisely shaped to hit or miss each rule. `checkCutoutFile` is the
 * only part of this module that touches disk, and it exists solely so
 * `comfy.mjs` (and the throwaway measurement scripts an art session runs
 * against real renders) have one call to make.
 *
 * Uses `sharp`, already a project devDependency (see `tools/portraits/
 * measure-face-crops.mjs` and `tools/end-state-board.mjs` for the same
 * raw-buffer pattern) — no new dependency, no download. The 8-connected
 * flood fill itself lives in `tools/gen/connected-components.mjs` (a generic
 * primitive, re-exported here for callers that already import this module).
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync, unlinkSync, renameSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { boxesTouch, labelComponents } from './connected-components.mjs';

export { labelComponents };

// --------------------------------------------------------------------------
// Thresholds
// --------------------------------------------------------------------------

/**
 * Alpha at or above this counts as "opaque content", below it as background
 * or antialiasing halo.
 *
 * Matches `tools/gen/rembg.py`'s own `--alpha-threshold` default (8) exactly,
 * so "opaque" means the same thing to the guard as it did to the crop that
 * produced the file it is looking at.
 */
export const OPAQUE_ALPHA_MIN = 8;

/**
 * Reject when the cutout covers more than this fraction of the source canvas
 * in BOTH width and height — but only for `full`/`portrait` composition. See
 * `COVERAGE_CHECKED_COMPOSITIONS` for why `boss` and `prone` are exempt.
 *
 * Chosen empirically, not at the round number in the incident brief (0.92),
 * because 0.92 rejects real approved art: `public/art/characters/auron/
 * idle.png` is a full-length coat-and-katana pose that legitimately covers
 * 96.0% x 99.0% of its 832x1216 source (his coat and the katana tip reach
 * close to both edges). The two incident renders measure 100.0% x 100.0% and
 * 99.8% x 97.3%. 0.965 sits in the gap between Auron's smaller axis (96.0%)
 * and the tighter incident's smaller axis (97.3%), so it clears every
 * approved `full`-composition sprite in the sweep this guard was calibrated
 * against (`tidus/idle` 87.7% x 93.1%, `yuna/idle` 96.5% x 88.4%, `auron/
 * idle` 96.0% x 99.0%) while still catching both incident files.
 *
 * A handful of `full`-composition action poses in the current cast (weapon
 * swings and flowing robes that legitimately reach both edges — e.g. `wakka/
 * attack` at 96.9% x 98.6%) sit just above 0.965 too. That is a real,
 * disclosed trade-off, not a bug: `--keepBad` is the escape hatch for a
 * regenerate of one of those, and it is a far smaller and more defensible set
 * than the ~30% of the whole cast (mostly `boss` and `prone`, by design meant
 * to fill the frame) that a blanket 92% threshold rejected in the sweep this
 * guard shipped with. See `docs/ART-PIPELINE.md` §6 "Painted-in effects and
 * dirty cut-outs" for the full measurement table.
 */
export const CROP_COVERAGE_MAX = 0.965;

/**
 * Compositions the coverage rule actually applies to.
 *
 * `boss` (`full body, centered, imposing`) and `prone` (a downed figure
 * spanning the ground) are BY DESIGN meant to fill the frame — see
 * `BOSS_COMPOSITION`/`PRONE_COMPOSITION` in `comfy.mjs`. A sweep of the
 * shipped cast at this threshold found 36 boss-composition and 6
 * prone-composition files that legitimately measure 97-100% coverage on both
 * axes (Yunalesca, ffx2-Bahamut, Vegnagun, every `ko` pose in the roster) —
 * rejecting those would make the guard fire on most of the boss roster, not
 * on the swirl failure it exists to catch. `full` and `portrait` are where
 * "a figure standing in its frame with visible margin" is the actual
 * composition contract, so that is where a lost margin is actually a signal.
 */
export const COVERAGE_CHECKED_COMPOSITIONS = Object.freeze(['full', 'portrait']);

/**
 * Reject when a second connected component of opaque pixels, not touching the
 * largest one, is bigger than this fraction of the largest component's pixel
 * count.
 *
 * 6% (the incident brief's number) is deliberately generous: a held prop that
 * rembg happens to separate by a hairline of transparency (a scabbard tip, a
 * trailing sash) is usually well under a twentieth of the whole figure. A
 * duplicated blade or a chunk of swirl big enough to read as a second object
 * on a contact sheet is much bigger than that.
 */
export const SECOND_COMPONENT_MAX_RATIO = 0.06;

/**
 * Two components within this many pixels of each other (bounding-box gap, not
 * pixel-accurate distance) count as "touching" rather than "floating apart".
 *
 * A few pixels covers the antialiased/thresholded gap between a hand and the
 * weapon it is holding — isnet-anime's edges are not pixel-perfect against
 * `OPAQUE_ALPHA_MIN`. Anything farther apart than this is not the same
 * object.
 */
export const COMPONENT_TOUCH_GAP_PX = 3;

/** A pixel with every channel at or above this is "near-white". */
export const NEAR_WHITE_RGB_MIN = 245;

/**
 * Reject only when near-white opaque pixels exceed this fraction of the whole
 * opaque area...
 */
export const NEAR_WHITE_PIXEL_FRACTION_MAX = 0.03;

/**
 * ...AND are concentrated in one connected near-white region at least this
 * big (as a fraction of the opaque area).
 *
 * Both conditions matter: a cel-shaded highlight puts near-white pixels all
 * over a character (a blade's glint, a tooth of light on hair) that individually
 * are nowhere near a fifth of a percent of the figure. Requiring one *region*
 * this size is what tells a leftover background patch apart from ordinary
 * shading speckle.
 */
export const NEAR_WHITE_REGION_FRACTION_MIN = 0.015;

/**
 * A near-white region is only a defect if it is DETACHED from the figure's
 * main blob, or (for `full`/`portrait` composition) reaches the canvas edge.
 *
 * Added after the correction on the 2026-09-21 incident: white clothing is
 * legal art (Yuna's sash, Yunalesca's robe, Leblanc's fan) and is always part
 * of the same connected alpha blob as the rest of the figure, sitting well
 * inside the frame the way `standing, feet visible` composes a figure with
 * margin on every side. A background patch rembg failed to remove is either
 * its own separate blob, or a wedge that reaches all the way to an edge of
 * the (already-cropped) canvas — a real garment does not, because the crop
 * margin exists precisely so the figure never touches the frame.
 *
 * `touchesEdge` is dropped for `boss` composition specifically: a sweep of
 * the shipped roster found `ffx2-bahamut`'s idle and hurt poses legitimately
 * have a bright mist/glow ground effect that reaches the bottom edge by
 * design (`BOSS_COMPOSITION` never promises margin the way `standing, feet
 * visible` does) — `detached` alone still catches an actual separate white
 * blob on a boss.
 */
export function nearWhiteIsSuspect({ detached, touchesEdge }, composition = 'full') {
  if (composition === 'boss') return Boolean(detached);
  return Boolean(detached || touchesEdge);
}

/**
 * When `--ref` points at an approved sprite, that sprite's own near-white
 * fraction is a fairer ceiling than the fixed constant above — a character
 * who is legitimately mostly white (a heavy dose of white armor or robe)
 * should not need special-casing by name. The reference's own fraction times
 * this allowance is used as an alternate ceiling; the higher of the two wins,
 * so a subject with almost no white in their reference still gets the fixed
 * 3% floor rather than a floor of zero.
 */
export const REF_NEAR_WHITE_ALLOWANCE = 1.5;

// --------------------------------------------------------------------------
// Pure evaluation
// --------------------------------------------------------------------------

/**
 * Rule 1: crop-box coverage of the source canvas.
 *
 * `width`/`height` are the cropped output image's own pixel dimensions (what
 * rembg's `cropBox` spans), `sourceWidth`/`sourceHeight` are the raw render's
 * canvas before cropping (rembg's sidecar `source` field). The fractions are
 * always computed and returned (useful in the sidecar even when not acted
 * on); `exceeds` only fires for `composition`s in
 * `COVERAGE_CHECKED_COMPOSITIONS` — see that constant for why `boss` and
 * `prone` are exempt.
 */
export function evaluateCoverage(width, height, sourceWidth, sourceHeight, composition = 'full') {
  if (!width || !height || !sourceWidth || !sourceHeight) return null;
  const widthFraction = width / sourceWidth;
  const heightFraction = height / sourceHeight;
  const checked = COVERAGE_CHECKED_COMPOSITIONS.includes(composition);
  return {
    widthFraction,
    heightFraction,
    checked,
    exceeds: checked && widthFraction > CROP_COVERAGE_MAX && heightFraction > CROP_COVERAGE_MAX,
  };
}

/**
 * Rule 2: a second, detached, oversized blob of opaque pixels.
 *
 * @param {Uint8Array} alpha length width*height
 */
export function evaluateComponents(alpha, width, height) {
  const n = width * height;
  const mask = new Uint8Array(n);
  let opaquePixels = 0;
  for (let i = 0; i < n; i++) {
    if (alpha[i] >= OPAQUE_ALPHA_MIN) {
      mask[i] = 1;
      opaquePixels++;
    }
  }
  const { labels, sizes, boxes, count } = labelComponents(mask, width, height);
  if (!count) {
    return { opaquePixels: 0, componentCount: 0, secondRatio: 0, touchesLargest: null, exceeds: false, labels, largestIdx: -1 };
  }

  let largestIdx = 0;
  for (let i = 1; i < count; i++) if (sizes[i] > sizes[largestIdx]) largestIdx = i;
  let secondIdx = -1;
  for (let i = 0; i < count; i++) {
    if (i === largestIdx) continue;
    if (secondIdx === -1 || sizes[i] > sizes[secondIdx]) secondIdx = i;
  }

  let secondRatio = 0;
  let touchesLargest = null;
  let exceeds = false;
  if (secondIdx !== -1) {
    secondRatio = sizes[secondIdx] / sizes[largestIdx];
    touchesLargest = boxesTouch(boxes[largestIdx], boxes[secondIdx], COMPONENT_TOUCH_GAP_PX);
    exceeds = secondRatio > SECOND_COMPONENT_MAX_RATIO && !touchesLargest;
  }

  return {
    opaquePixels,
    componentCount: count,
    largestPixels: sizes[largestIdx],
    secondPixels: secondIdx === -1 ? 0 : sizes[secondIdx],
    secondRatio,
    touchesLargest,
    exceeds,
    // Kept for evaluateNearWhite, which needs to know which alpha-component a
    // near-white pixel belongs to; not part of the public "measurements".
    labels,
    largestIdx,
  };
}

/** Fraction of opaque pixels that are near-white, with no component analysis. */
export function nearWhiteFractionOf(alpha, rgb, width, height) {
  const n = width * height;
  let opaque = 0;
  let nearWhite = 0;
  for (let i = 0; i < n; i++) {
    if (alpha[i] < OPAQUE_ALPHA_MIN) continue;
    opaque++;
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    if (r >= NEAR_WHITE_RGB_MIN && g >= NEAR_WHITE_RGB_MIN && b >= NEAR_WHITE_RGB_MIN) nearWhite++;
  }
  return opaque ? nearWhite / opaque : 0;
}

/**
 * Rule 3: a near-white patch, detached from the figure or touching the frame
 * edge.
 *
 * `components` is the result of {@link evaluateComponents} on the same pixels
 * — reused so the near-white pass does not re-label the whole opaque mask.
 */
export function evaluateNearWhite(alpha, rgb, width, height, components, opts = {}) {
  const { opaquePixels, labels, largestIdx } = components;
  if (!opaquePixels) return { fraction: 0, largestRegionFraction: 0, detached: false, touchesEdge: false, exceeds: false };

  const n = width * height;
  const nearWhiteMask = new Uint8Array(n);
  let nearWhiteCount = 0;
  for (let i = 0; i < n; i++) {
    if (alpha[i] < OPAQUE_ALPHA_MIN) continue;
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    if (r >= NEAR_WHITE_RGB_MIN && g >= NEAR_WHITE_RGB_MIN && b >= NEAR_WHITE_RGB_MIN) {
      nearWhiteMask[i] = 1;
      nearWhiteCount++;
    }
  }
  const fraction = nearWhiteCount / opaquePixels;
  if (!nearWhiteCount) {
    return { fraction: 0, largestRegionFraction: 0, detached: false, touchesEdge: false, exceeds: false };
  }

  const nw = labelComponents(nearWhiteMask, width, height);
  let largestNw = -1;
  for (let i = 0; i < nw.count; i++) {
    if (largestNw === -1 || nw.sizes[i] > nw.sizes[largestNw]) largestNw = i;
  }
  const largestRegionFraction = largestNw === -1 ? 0 : nw.sizes[largestNw] / opaquePixels;

  let detached = false;
  let touchesEdge = false;
  if (largestNw !== -1) {
    let samplePixel = -1;
    for (let i = 0; i < nw.labels.length; i++) {
      if (nw.labels[i] === largestNw) {
        samplePixel = i;
        break;
      }
    }
    const ownAlphaComponent = samplePixel === -1 ? -1 : labels[samplePixel];
    detached = ownAlphaComponent !== largestIdx;
    const box = nw.boxes[largestNw];
    touchesEdge = box.minX === 0 || box.minY === 0 || box.maxX === width - 1 || box.maxY === height - 1;
  }

  const refFraction = typeof opts.refFraction === 'number' ? opts.refFraction : null;
  const allowance =
    refFraction != null
      ? Math.max(NEAR_WHITE_PIXEL_FRACTION_MAX, refFraction * REF_NEAR_WHITE_ALLOWANCE)
      : NEAR_WHITE_PIXEL_FRACTION_MAX;

  const suspect = nearWhiteIsSuspect({ detached, touchesEdge }, opts.composition ?? 'full');
  const exceeds = suspect && fraction > allowance && largestRegionFraction > NEAR_WHITE_REGION_FRACTION_MIN;

  return { fraction, largestRegionFraction, detached, touchesEdge, exceeds, allowanceUsed: allowance };
}

/**
 * Run all three rules and return one verdict.
 *
 * Pure: takes decoded pixel data and rembg's own reported dimensions, nothing
 * else. `width`/`height` are the cropped output's pixel dimensions;
 * `alpha`/`rgb` are `Uint8Array`s of that same size (row-major, `rgb` as
 * `[r,g,b]` triples).
 *
 * @param {{
 *   width: number, height: number,
 *   sourceWidth?: number, sourceHeight?: number,
 *   alpha?: Uint8Array, rgb?: Uint8Array,
 *   refNearWhiteFraction?: number,
 *   composition?: string,
 * }} input
 */
export function evaluateCutout({
  width,
  height,
  sourceWidth,
  sourceHeight,
  alpha,
  rgb,
  refNearWhiteFraction,
  composition = 'full',
} = {}) {
  const coverage = evaluateCoverage(width, height, sourceWidth, sourceHeight, composition);
  const components = alpha && width && height ? evaluateComponents(alpha, width, height) : null;
  const nearWhite =
    components && rgb
      ? evaluateNearWhite(alpha, rgb, width, height, components, { refFraction: refNearWhiteFraction, composition })
      : null;

  const reasons = [];
  if (coverage?.exceeds) {
    reasons.push(
      `crop box covers ${(coverage.widthFraction * 100).toFixed(1)}% x ` +
        `${(coverage.heightFraction * 100).toFixed(1)}% of the source canvas ` +
        `(over ${(CROP_COVERAGE_MAX * 100).toFixed(1)}% in both dimensions)`,
    );
  }
  if (components?.exceeds) {
    reasons.push(
      `a second blob covers ${(components.secondRatio * 100).toFixed(1)}% of the main ` +
        `figure's pixel count (over ${(SECOND_COMPONENT_MAX_RATIO * 100).toFixed(0)}%) and ` +
        `does not touch it — likely a floating swirl or duplicated object`,
    );
  }
  if (nearWhite?.exceeds) {
    reasons.push(
      `${(nearWhite.fraction * 100).toFixed(1)}% of opaque pixels are near-white, ` +
        `concentrated in a ${nearWhite.detached ? 'detached' : 'frame-edge-touching'} region ` +
        `covering ${(nearWhite.largestRegionFraction * 100).toFixed(1)}% of the opaque area — ` +
        `likely a background blob rembg failed to remove`,
    );
  }

  return {
    ok: reasons.length === 0,
    reasons,
    measurements: {
      ...(coverage ? { coverage } : {}),
      ...(components
        ? {
            components: {
              componentCount: components.componentCount,
              largestPixels: components.largestPixels,
              secondPixels: components.secondPixels,
              secondRatio: components.secondRatio,
              touchesLargest: components.touchesLargest,
            },
          }
        : {}),
      ...(nearWhite
        ? {
            nearWhite: {
              fraction: nearWhite.fraction,
              largestRegionFraction: nearWhite.largestRegionFraction,
              detached: nearWhite.detached,
              touchesEdge: nearWhite.touchesEdge,
              allowanceUsed: nearWhite.allowanceUsed,
            },
          }
        : {}),
    },
  };
}

// --------------------------------------------------------------------------
// Disk I/O — the only impure part of this module
// --------------------------------------------------------------------------

/** Decode a PNG's alpha and RGB channels into flat typed arrays. */
export async function decodeRgba(pngPath) {
  const img = sharp(pngPath).ensureAlpha();
  const { width, height } = await img.metadata();
  const raw = await img.raw().toBuffer();
  const n = width * height;
  const alpha = new Uint8Array(n);
  const rgb = new Uint8Array(n * 3);
  for (let i = 0, p = 0; i < raw.length; i += 4, p++) {
    rgb[p * 3] = raw[i];
    rgb[p * 3 + 1] = raw[i + 1];
    rgb[p * 3 + 2] = raw[i + 2];
    alpha[p] = raw[i + 3];
  }
  return { width, height, alpha, rgb };
}

/**
 * The near-white fraction of an already-approved reference cutout, for
 * `evaluateCutout`'s `refNearWhiteFraction`.
 *
 * Returns `null` rather than throwing on anything unreadable — a missing or
 * corrupt reference file is a separate problem from this one render, and the
 * guard should fall back to the fixed threshold rather than fail the batch
 * over it.
 */
export async function referenceNearWhiteFraction(refPath) {
  try {
    if (!refPath || !existsSync(refPath)) return null;
    const { width, height, alpha, rgb } = await decodeRgba(refPath);
    return nearWhiteFractionOf(alpha, rgb, width, height);
  } catch {
    return null;
  }
}

/**
 * Decode `outPath` and run {@link evaluateCutout} against it, given rembg's
 * own reported source canvas size.
 *
 * `refPath`, if given, is decoded once for its own near-white baseline (see
 * `REF_NEAR_WHITE_ALLOWANCE`). Never throws on a decode failure — an
 * unreadable cutout is reported as unverified (`ok: true`, no measurements)
 * rather than rejected, the same fail-open policy as the black-frame guard:
 * a bug in this checker should not be able to stop the art fleet.
 */
export async function checkCutoutFile(outPath, { sourceWidth, sourceHeight, refPath, composition } = {}) {
  try {
    const { width, height, alpha, rgb } = await decodeRgba(outPath);
    const refNearWhiteFraction = refPath ? await referenceNearWhiteFraction(refPath) : null;
    return evaluateCutout({
      width,
      height,
      sourceWidth,
      sourceHeight,
      alpha,
      rgb,
      composition,
      ...(refNearWhiteFraction != null ? { refNearWhiteFraction } : {}),
    });
  } catch (err) {
    return {
      ok: true,
      reasons: [],
      measurements: {},
      unverified: true,
      error: err.message,
    };
  }
}

/**
 * Where a rejected cutout goes — beside the black-frame quarantine, same
 * flat-folder-with-stamp convention as `quarantineTargetFor` in
 * `black-frame.mjs`.
 */
export function cutoutQuarantinePath(filePath, quarantineDir, stamp) {
  const name = `${stamp ? `${stamp}__` : ''}${basename(filePath)}`;
  return join(quarantineDir, name);
}

/**
 * Move a rejected cutout into quarantine. Never deletes: a bad cutout is
 * evidence about the prompt or the checkpoint, same reasoning as
 * `quarantineServerCopy` in `comfy.mjs` for black frames.
 *
 * @returns {string|null} the absolute destination, or null if there was
 *   nothing at `filePath` to move
 */
export function quarantineCutout(filePath, quarantineDir, stamp) {
  if (!existsSync(filePath)) return null;
  mkdirSync(quarantineDir, { recursive: true });
  const target = cutoutQuarantinePath(filePath, quarantineDir, stamp);
  try {
    renameSync(filePath, target);
  } catch (err) {
    if (err.code !== 'EXDEV' && err.code !== 'EPERM') throw err;
    copyFileSync(filePath, target);
    unlinkSync(filePath);
  }
  return resolve(target);
}
