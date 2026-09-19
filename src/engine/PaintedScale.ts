/**
 * Pure sizing maths for painted character planes.
 *
 * No `three`, no DOM: this is the one piece of {@link PaintedActor} that has to
 * be right for every pose a generator hands us, so it lives on its own and is
 * unit-tested directly (`tests/unit/engine/painted-scale.test.ts`).
 *
 * ## Why a *reference* pose exists
 *
 * The obvious sizing rule — "every pose is `worldHeight` tall" — is wrong the
 * moment a pose is not a standing figure. A KO painting is a landscape render
 * (about 1216x832) of a body lying down; forcing that PNG to 1.75 world units
 * *tall* also makes it ~2.6 units *wide*, so a downed Tidus ends up at roughly
 * twice his standing size and sprawls across his neighbours, with the PNG's
 * rectangle showing as a seam.
 *
 * What is actually constant across a subject's poses is the **pixel scale**:
 * the generator paints the same character at roughly the same pixels-per-metre
 * in every render. So the scale is computed **once, from the idle pose**
 * (`worldHeight / idle.baselineY` world units per texel) and then applied to
 * every other pose. A prone pose keeps that pixel scale and simply comes out
 * wide and low, which is what lying down looks like.
 */

/**
 * The tight box painted content occupies inside a PNG, in source pixels.
 *
 * Measured from alpha at load time (`PaintedArt.measureAlpha`). It exists
 * because generated art is padded: a Yu Pagoda sits in the middle of a
 * 1024x1024 canvas with most of the frame empty, so anything scaled to the
 * *plane* — a target bracket above all — comes out two to three times too big
 * and lands on its neighbour.
 */
export interface AlphaBox {
  /** Left edge of painted content, pixels from the left of the PNG. */
  x0: number;
  /** Right edge, exclusive. */
  x1: number;
  /** Top edge, pixels from the top. */
  y0: number;
  /** Bottom edge, exclusive. */
  y1: number;
}

/** The measurements of one painted pose that sizing cares about. */
export interface PoseFrame {
  width: number;
  height: number;
  /** Y pixel from the top of the PNG where the figure meets the ground. */
  baselineY: number;
  /** Tight alpha box, when it could be measured. See {@link AlphaBox}. */
  content?: AlphaBox;
  /**
   * Sidecar override: multiply the derived pixel scale. `1.1` = "this render
   * came out 10% small". Ignored when absent or not finite/positive.
   */
  scale?: number;
  /**
   * Sidecar override: the row that sits on the ground, in pixels from the top
   * of the PNG (same units as `baselineY`). A value in `(0, 1]` is read as a
   * *fraction* of the height instead, so `0.98` and `816` both work.
   */
  anchorY?: number;
}

export interface PoseScaleOptions {
  /** Standing height of the subject, in world units. A human is ~1.75. */
  worldHeight: number;
  /**
   * The pose that sets the subject's pixel scale — the idle painting. Pass
   * `null` (or omit) to size the pose against itself, which is the old
   * behaviour and the right one for a procedural placeholder.
   */
  reference?: PoseFrame | null;
  /**
   * Safety net: the longest side of a pose may not exceed this multiple of
   * `worldHeight`. A prone body is about 1.2x a standing figure once padding is
   * counted, so 2.2 leaves generous room while still catching a render that
   * came back at a wildly different pixel scale. Default 2.2.
   */
  maxExtent?: number;
  /** The same net from below. Default 0.35. */
  minExtent?: number;
  /** Width/height ratio at which a pose counts as prone. Default 1.15. */
  proneAspect?: number;
  /**
   * The pose's tight alpha box, when the caller measured it somewhere other
   * than the sidecar. Overrides {@link PoseFrame.content}.
   */
  content?: AlphaBox;
}

export interface PoseScale {
  /** World units per texture pixel — the number the whole fix turns on. */
  unitsPerPixel: number;
  /** Plane size in world units. */
  width: number;
  height: number;
  /** Local Y for the plane's centre, so `anchorY` lands on the group origin. */
  offsetY: number;
  /** World Y of the top of the plane, relative to the group origin. */
  topY: number;
  /** The anchor row actually used, in pixels from the top of the PNG. */
  anchorY: number;
  /** True when the pose is meaningfully wider than tall (a downed body). */
  prone: boolean;
  /** Radius of the pose's ground footprint, for the contact shadow. */
  footprint: number;
  /** True when {@link PoseScaleOptions.maxExtent} or `minExtent` had to bite. */
  clamped: boolean;
  /**
   * The painted silhouette's own box, in the plane's local world units, with
   * the origin at the figure's ground point (the same origin
   * {@link PoseScale.offsetY} is measured against): `x` runs right, `y` runs
   * up. This is the rectangle a target bracket is drawn around.
   *
   * Falls back to the whole plane when the PNG's alpha could not be measured,
   * so a caller never has to branch.
   */
  contentBox: { x0: number; x1: number; y0: number; y1: number };
}

const finitePositive = (v: number | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Clamp `v` into `[lo, hi]`, tolerating NaN by falling back to `lo`. */
function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Size one pose's plane.
 *
 * ```ts
 * const idle = { width: 709, height: 1056, baselineY: 1040 };
 * const ko   = { width: 1216, height: 823, baselineY: 813 };
 *
 * computePoseScale(idle, { worldHeight: 1.75 }).height;              // 1.777
 * computePoseScale(ko, { worldHeight: 1.75, reference: idle }).height; // 1.385
 * computePoseScale(ko, { worldHeight: 1.75, reference: idle }).prone;  // true
 * ```
 *
 * Without the reference that same KO plane is 1.75 tall and **2.62 wide**,
 * which is the defect this function exists to remove.
 */
export function computePoseScale(pose: PoseFrame, opts: PoseScaleOptions): PoseScale {
  const worldHeight = finitePositive(opts.worldHeight) ? opts.worldHeight : 1.75;
  const w = Math.max(1, Number.isFinite(pose.width) ? pose.width : 1);
  const h = Math.max(1, Number.isFinite(pose.height) ? pose.height : 1);
  const baseline = clamp(pose.baselineY, 1, h);

  // The figure's standing height in pixels. Taken from idle when we have it, so
  // every pose of one subject shares a single pixels-per-world-unit.
  const ref = opts.reference;
  const standingPx = ref
    ? clamp(ref.baselineY, 1, Math.max(1, Number.isFinite(ref.height) ? ref.height : 1))
    : baseline;

  // `scale` on the *reference* calibrates the whole subject (the idle render
  // came out small, so every pose is small); `scale` on the pose tweaks that
  // one pose. Sizing idle against itself must not apply its own factor twice,
  // hence the identity check.
  let unitsPerPixel = worldHeight / standingPx;
  if (ref && finitePositive(ref.scale)) unitsPerPixel *= ref.scale;
  if (pose !== ref && finitePositive(pose.scale)) unitsPerPixel *= pose.scale;

  // A render at a wildly different pixel scale (a close crop, a half-size
  // sketch) would otherwise inherit idle's scale and come out absurd. Clamp the
  // *longest side*, so a prone pose is judged on its length and an upright one
  // on its height.
  let clamped = false;
  const longest = Math.max(w, h) * unitsPerPixel;
  const maxAllowed = (opts.maxExtent ?? 2.2) * worldHeight;
  const minAllowed = (opts.minExtent ?? 0.35) * worldHeight;
  if (longest > maxAllowed) {
    unitsPerPixel *= maxAllowed / longest;
    clamped = true;
  } else if (longest < minAllowed) {
    unitsPerPixel *= minAllowed / longest;
    clamped = true;
  }

  // Where the ground line is. `anchorY` in (0, 1] is a fraction of the height,
  // anything larger is a pixel row; both clamp into the image.
  let anchorPx = baseline;
  if (finitePositive(pose.anchorY)) {
    anchorPx = pose.anchorY <= 1 ? pose.anchorY * h : pose.anchorY;
  }
  anchorPx = clamp(anchorPx, 0, h);

  const width = w * unitsPerPixel;
  const height = h * unitsPerPixel;
  // Sink the plane by whatever is painted *below* the anchor row, so the anchor
  // sits exactly on the group origin — feet for a standing pose, the lowest
  // painted row (the body's near side) for a prone one.
  const offsetY = height / 2 - (h - anchorPx) * unitsPerPixel;

  const prone = w > h * (opts.proneAspect ?? 1.15);

  // The silhouette's box, moved out of image space (origin top-left, y down)
  // and into the plane's own space (origin at the ground point, y up). The
  // whole plane is the honest fallback when alpha could not be read.
  const box = opts.content ?? pose.content;
  const valid =
    box && Number.isFinite(box.x0) && Number.isFinite(box.y0) && box.x1 > box.x0 && box.y1 > box.y0;
  const halfW = width / 2;
  const contentBox = valid
    ? {
        x0: clamp(box.x0, 0, w) * unitsPerPixel - halfW,
        x1: clamp(box.x1, 0, w) * unitsPerPixel - halfW,
        // `anchorPx` is the ground row, so pixels *above* it are positive Y.
        y0: (anchorPx - clamp(box.y1, 0, h)) * unitsPerPixel,
        y1: (anchorPx - clamp(box.y0, 0, h)) * unitsPerPixel,
      }
    : { x0: -halfW, x1: halfW, y0: offsetY - height / 2, y1: offsetY + height / 2 };

  return {
    unitsPerPixel,
    width,
    height,
    offsetY,
    topY: offsetY + height / 2,
    anchorY: anchorPx,
    prone,
    contentBox,
    // A standing figure's silhouette is much narrower than its PNG (arms, a
    // weapon, padding); a prone one fills nearly the whole frame and its
    // shadow has to stretch under the whole body or the figure reads as
    // floating sideways.
    footprint: width * (prone ? 0.44 : 0.3),
    clamped,
  };
}

/**
 * UV height of the shader's contact-darkening ramp for a plane `height` world
 * units tall, so the ramp is a fixed *world* distance off the ground rather
 * than a fixed fraction of the plane. Without this, a short prone plane gets
 * the same 10%-of-plane band as a standing one and it reads as a hard
 * horizontal seam across the whole landscape image.
 */
export function contactBandFor(height: number, worldBand = 0.16): number {
  if (!Number.isFinite(height) || height <= 0) return 0.1;
  return clamp(worldBand / height, 0.02, 0.2);
}
