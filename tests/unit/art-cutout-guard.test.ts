/**
 * `tools/gen/cutout-guard.mjs` — the check that stands between a bad rembg
 * cutout and `public/art/`.
 *
 * 2026-09-21: a `yuna-dark-knight` pose render came back as a coloured swirl
 * wrapped around the figure, with duplicated blades and mangled limbs.
 * `isnet-anime` kept the whole swirl as opaque content, so the crop box came
 * back covering the entire source frame instead of a tight box around a
 * figure. These tests exercise the three rules against synthetic masks built
 * directly as pixel arrays — no PNG encoding needed, since `evaluateCutout`
 * is a pure function of decoded pixels — precisely shaped to hit or miss each
 * rule, plus the calibration facts recorded in `cutout-guard.mjs`'s constants
 * (a coverage threshold tuned against real approved art, a near-white gate
 * that must not fire on ordinary white clothing).
 */
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_TOUCH_GAP_PX,
  COVERAGE_CHECKED_COMPOSITIONS,
  CROP_COVERAGE_MAX,
  NEAR_WHITE_PIXEL_FRACTION_MAX,
  NEAR_WHITE_REGION_FRACTION_MIN,
  NEAR_WHITE_RGB_MIN,
  OPAQUE_ALPHA_MIN,
  SECOND_COMPONENT_MAX_RATIO,
  evaluateComponents,
  evaluateCoverage,
  evaluateCutout,
  evaluateNearWhite,
  labelComponents,
  nearWhiteIsSuspect,
} from '../../tools/gen/cutout-guard.mjs';

// --------------------------------------------------------------------------
// Synthetic pixel builders
// --------------------------------------------------------------------------

/** A blank (fully transparent, black) canvas of alpha + rgb typed arrays. */
function blankCanvas(width: number, height: number) {
  return { width, height, alpha: new Uint8Array(width * height), rgb: new Uint8Array(width * height * 3) };
}

/** Paint an opaque rectangle `[x0, y0, x1, y1)` with a solid colour. */
function paintRect(
  canvas: ReturnType<typeof blankCanvas>,
  [x0, y0, x1, y1]: [number, number, number, number],
  [r, g, b]: [number, number, number],
  alphaValue = 255,
) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * canvas.width + x;
      canvas.alpha[i] = alphaValue;
      canvas.rgb[i * 3] = r;
      canvas.rgb[i * 3 + 1] = g;
      canvas.rgb[i * 3 + 2] = b;
    }
  }
  return canvas;
}

const BODY_COLOR: [number, number, number] = [120, 60, 40];
const WHITE: [number, number, number] = [255, 255, 255];

// --------------------------------------------------------------------------
// The four synthetic scenarios the incident brief asks for
// --------------------------------------------------------------------------

describe('evaluateCutout — synthetic scenarios', () => {
  it('accepts a clean figure: one compact blob, margin on both axes, no white blob', () => {
    const canvas = blankCanvas(100, 200);
    paintRect(canvas, [20, 10, 80, 190], BODY_COLOR); // 60x180 blob, margin left/right/top/bottom
    const result = evaluateCutout({
      ...canvas,
      sourceWidth: 120,
      sourceHeight: 220,
      composition: 'full',
    });
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('rejects a figure plus a floating (detached) swirl blob', () => {
    const canvas = blankCanvas(200, 200);
    paintRect(canvas, [10, 10, 110, 160], BODY_COLOR); // main blob: 100x150 = 15000px
    // A second blob far in the opposite corner, well clear of
    // COMPONENT_TOUCH_GAP_PX, sized just over 6% of the main blob (900px).
    paintRect(canvas, [170, 170, 200, 190], BODY_COLOR); // 30x20 = 600... bump size below
    // Make the second blob comfortably over the 6% threshold (900px+) on its own.
    paintRect(canvas, [150, 170, 190, 195], BODY_COLOR); // 40x25 = 1000px, merges with the block above into one ~1600px blob, still isolated from the main one
    const result = evaluateCutout({
      ...canvas,
      sourceWidth: 220,
      sourceHeight: 220,
      composition: 'full',
    });
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes('second blob'))).toBe(true);
    expect(result.measurements.components?.touchesLargest).toBe(false);
    expect(result.measurements.components?.secondRatio).toBeGreaterThan(SECOND_COMPONENT_MAX_RATIO);
  });

  it('rejects a full-frame splatter: opaque content covering the whole source canvas', () => {
    const canvas = blankCanvas(200, 200);
    paintRect(canvas, [0, 0, 200, 200], BODY_COLOR); // fills the crop edge to edge
    const result = evaluateCutout({
      ...canvas,
      sourceWidth: 200,
      sourceHeight: 200,
      composition: 'full',
    });
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes('crop box covers'))).toBe(true);
    expect(result.measurements.coverage?.widthFraction).toBe(1);
    expect(result.measurements.coverage?.heightFraction).toBe(1);
  });

  it('rejects a figure with a detached white blob (background rembg failed to remove)', () => {
    const canvas = blankCanvas(150, 200);
    paintRect(canvas, [10, 10, 110, 190], BODY_COLOR); // main blob: 100x180 = 18000px, non-white
    paintRect(canvas, [120, 10, 150, 40], WHITE); // detached white blob: 30x30 = 900px (~4.8% of opaque area)
    const result = evaluateCutout({
      ...canvas,
      sourceWidth: 220,
      sourceHeight: 220,
      composition: 'full',
    });
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes('near-white'))).toBe(true);
    expect(result.measurements.nearWhite?.detached).toBe(true);
  });

  it('accepts a figure whose white pixels are ordinary internal clothing (Yuna/Yunalesca/Leblanc case)', () => {
    // Same overall shape as the rejected case, but the white patch is INSIDE
    // the main blob (a sash/collar), never a separate component, never
    // touching the frame edge. This is the exact false positive Bailey's
    // 2026-09-21 correction called out, and the reason `nearWhiteIsSuspect`
    // requires "detached or touches edge" rather than acting on the raw
    // percentage alone.
    const canvas = blankCanvas(150, 200);
    paintRect(canvas, [10, 10, 140, 190], BODY_COLOR); // main blob, well inside the frame
    paintRect(canvas, [60, 60, 90, 100], WHITE); // a white sash, fully embedded, not touching any edge
    const result = evaluateCutout({
      ...canvas,
      sourceWidth: 220,
      sourceHeight: 220,
      composition: 'full',
    });
    expect(result.measurements.nearWhite?.detached).toBe(false);
    expect(result.measurements.nearWhite?.touchesEdge).toBe(false);
    expect(result.ok).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Rule 1: coverage
// --------------------------------------------------------------------------

describe('evaluateCoverage', () => {
  it('flags coverage over the threshold in both dimensions, for a checked composition', () => {
    const r = evaluateCoverage(99, 99, 100, 100, 'full');
    expect(r?.widthFraction).toBeCloseTo(0.99);
    expect(r?.exceeds).toBe(true);
  });

  it('does not flag when only one axis is tight', () => {
    // Auron's approved idle: 96.0% x 99.0% — width alone must not trip it.
    const r = evaluateCoverage(96, 99, 100, 100, 'full');
    expect(r?.exceeds).toBe(false);
  });

  it('is exempt for boss and prone composition — they are designed to fill the frame', () => {
    for (const composition of ['boss', 'prone']) {
      const r = evaluateCoverage(100, 100, 100, 100, composition);
      expect(r?.checked).toBe(false);
      expect(r?.exceeds).toBe(false);
    }
    expect(COVERAGE_CHECKED_COMPOSITIONS).toEqual(['full', 'portrait']);
  });

  it('is checked for full and portrait', () => {
    for (const composition of ['full', 'portrait']) {
      const r = evaluateCoverage(100, 100, 100, 100, composition);
      expect(r?.checked).toBe(true);
      expect(r?.exceeds).toBe(true);
    }
  });

  it('returns null without enough information rather than guessing', () => {
    expect(evaluateCoverage(0, 100, 100, 100)).toBeNull();
    expect(evaluateCoverage(100, 100, 0, 100)).toBeNull();
  });

  it('the threshold itself sits where the calibration comment says it does', () => {
    expect(CROP_COVERAGE_MAX).toBe(0.965);
  });
});

// --------------------------------------------------------------------------
// Rule 2: connected components
// --------------------------------------------------------------------------

describe('labelComponents', () => {
  it('finds one component for one solid blob', () => {
    const width = 5;
    const height = 5;
    const mask = new Uint8Array(width * height);
    for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) mask[y * width + x] = 1;
    const { count, sizes } = labelComponents(mask, width, height);
    expect(count).toBe(1);
    expect(sizes[0]).toBe(9);
  });

  it('separates two blobs that do not touch, even diagonally', () => {
    const width = 6;
    const height = 3;
    const mask = new Uint8Array(width * height);
    mask[0 * width + 0] = 1; // top-left pixel
    mask[2 * width + 5] = 1; // bottom-right pixel, far away
    const { count, sizes } = labelComponents(mask, width, height);
    expect(count).toBe(2);
    expect(sizes.sort()).toEqual([1, 1]);
  });

  it('merges two blobs that touch only diagonally (8-connectivity)', () => {
    const width = 3;
    const height = 3;
    const mask = new Uint8Array(width * height);
    mask[0] = 1; // (0,0)
    mask[4] = 1; // (1,1), diagonal neighbor of (0,0)
    const { count, sizes } = labelComponents(mask, width, height);
    expect(count).toBe(1);
    expect(sizes[0]).toBe(2);
  });

  it('an empty mask has zero components', () => {
    const { count } = labelComponents(new Uint8Array(9), 3, 3);
    expect(count).toBe(0);
  });
});

describe('evaluateComponents', () => {
  it('uses OPAQUE_ALPHA_MIN, matching rembg.py’s own --alpha-threshold default', () => {
    expect(OPAQUE_ALPHA_MIN).toBe(8);
    const width = 3;
    const height = 1;
    const alpha = new Uint8Array([OPAQUE_ALPHA_MIN - 1, OPAQUE_ALPHA_MIN, 255]);
    const result = evaluateComponents(alpha, width, height);
    expect(result.opaquePixels).toBe(2); // the sub-threshold pixel does not count
  });

  it('treats a bounding-box gap within COMPONENT_TOUCH_GAP_PX as touching', () => {
    const width = 10;
    const height = 1;
    const alpha = new Uint8Array(width);
    alpha[0] = 255; // component A: single pixel at x=0
    alpha[COMPONENT_TOUCH_GAP_PX] = 255; // component B, exactly at the gap limit
    const result = evaluateComponents(alpha, width, height);
    expect(result.componentCount).toBe(2);
    expect(result.touchesLargest).toBe(true);
  });

  it('treats a gap one pixel beyond COMPONENT_TOUCH_GAP_PX as not touching', () => {
    const width = 12;
    const height = 1;
    const alpha = new Uint8Array(width);
    alpha[0] = 255;
    alpha[0 + COMPONENT_TOUCH_GAP_PX + 2] = 255;
    const result = evaluateComponents(alpha, width, height);
    expect(result.touchesLargest).toBe(false);
  });
});

// --------------------------------------------------------------------------
// Rule 3: near-white
// --------------------------------------------------------------------------

describe('nearWhiteIsSuspect', () => {
  it('fires on detached or edge-touching, for ordinary compositions', () => {
    expect(nearWhiteIsSuspect({ detached: true, touchesEdge: false })).toBe(true);
    expect(nearWhiteIsSuspect({ detached: false, touchesEdge: true })).toBe(true);
    expect(nearWhiteIsSuspect({ detached: false, touchesEdge: false })).toBe(false);
  });

  it('for boss composition, only detached counts — a boss can legitimately have a glow/mist ground effect touching the edge', () => {
    // Calibrated against ffx2-bahamut/idle.png and /hurt.png, which have a
    // bright mist/glow ground effect reaching the bottom edge by design.
    expect(nearWhiteIsSuspect({ detached: false, touchesEdge: true }, 'boss')).toBe(false);
    expect(nearWhiteIsSuspect({ detached: true, touchesEdge: false }, 'boss')).toBe(true);
  });
});

describe('evaluateNearWhite / NEAR_WHITE thresholds', () => {
  it('does not fire on scattered highlight speckle below the region-size floor', () => {
    const canvas = blankCanvas(100, 100);
    paintRect(canvas, [0, 0, 100, 100], BODY_COLOR);
    // Speckle a handful of isolated near-white pixels around the figure —
    // individually far under NEAR_WHITE_REGION_FRACTION_MIN of the opaque area.
    for (let i = 0; i < 20; i++) {
      const x = (i * 7) % 100;
      const y = (i * 13) % 100;
      canvas.rgb[(y * 100 + x) * 3] = NEAR_WHITE_RGB_MIN;
      canvas.rgb[(y * 100 + x) * 3 + 1] = NEAR_WHITE_RGB_MIN;
      canvas.rgb[(y * 100 + x) * 3 + 2] = NEAR_WHITE_RGB_MIN;
    }
    const components = evaluateComponents(canvas.alpha, canvas.width, canvas.height);
    const result = evaluateNearWhite(canvas.alpha, canvas.rgb, canvas.width, canvas.height, components, {});
    expect(result.exceeds).toBe(false);
  });

  it('raises the allowance when a --ref baseline is legitimately mostly white', () => {
    const canvas = blankCanvas(100, 100);
    paintRect(canvas, [0, 0, 100, 100], BODY_COLOR);
    paintRect(canvas, [0, 0, 60, 60], WHITE); // 36% white, edge-touching -> normally suspect
    const components = evaluateComponents(canvas.alpha, canvas.width, canvas.height);
    const withoutRef = evaluateNearWhite(canvas.alpha, canvas.rgb, canvas.width, canvas.height, components, {});
    expect(withoutRef.exceeds).toBe(true);
    // A reference whose own near-white fraction is close to this candidate's
    // raises the ceiling enough to accept it.
    const withRef = evaluateNearWhite(canvas.alpha, canvas.rgb, canvas.width, canvas.height, components, {
      refFraction: 0.4,
    });
    expect(withRef.allowanceUsed).toBeGreaterThan(NEAR_WHITE_PIXEL_FRACTION_MAX);
    expect(withRef.exceeds).toBe(false);
  });

  it('constants match the calibration comments', () => {
    expect(NEAR_WHITE_RGB_MIN).toBe(245);
    expect(NEAR_WHITE_PIXEL_FRACTION_MAX).toBe(0.03);
    expect(NEAR_WHITE_REGION_FRACTION_MIN).toBe(0.015);
  });
});
