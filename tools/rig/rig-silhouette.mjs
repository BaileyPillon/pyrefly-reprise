/**
 * **A posed key's silhouette: its box, its feet and its painted front, in the painting's own pixels** (the rig program; both games, shared plumbing).
 *
 * The engine drew the HUD's target brackets and read the strike's reach from the IDLE plane (`PaintedActor.contentQuad`, `Silhouette.profileOfActor`), so a raised
 * spear did not widen a bracket and a lunge aimed at the idle's front. A rig is one painting bent, and every key is a different shape; this module measures each key
 * once, at the gate, from the gate's own raster (`rig-raster.mjs`), and the gate stamps the readings into `rig.json` (`gate.silhouettes`, `stampRig`). The runtime reads them
 * (`src/engine/rig/RigSilhouette.ts`) and moves between them with the keys.
 *
 * Units are the MASTER's pixels (`image.w` x `image.h`, y down), the space the rig's joints, boxes and vertices are in; the runtime maps them onto the idle plane exactly as it
 * does the parts. "Painted" is alpha 0.35, the cut `PaintedArt` takes the content box at and `engine/motion/Silhouette.ts` takes the strike's rows at, so the rig's box and rows are
 * read by the rule the painting's are.
 *
 *   box      [x0, y0, x1, y1]  the tight box of the painted pixels (x1, y1 exclusive)
 *   feet     [x, y]            the lowest foot landmark of the posed rig (`feet`, `foot*`, `toe*`, `heel*`, `sole*`), or null with none
 *   profile  { left, right }   BANDS horizontal bands of the box, top to bottom: where the first and the last painted pixel of the band sit, as a fraction 0..1 of the box width
 *                              (null where a band holds nothing), the shape `engine/motion/Silhouette.ts#Profile` is
 */
import { through } from './rig-pose.mjs';

/** Horizontal bands a painted box is cut into (`engine/motion/Silhouette.ts` BANDS). */
export const BANDS = 40;
/** Alpha at or above this is painted (`PAINTED_ALPHA` of `engine/motion/Silhouette.ts`, and the content box's cut in `PaintedArt.ts`). */
export const PAINTED_ALPHA = 0.35;

const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** The landmarks of `rt` that count as feet, by name prefix. */
export const footLandmarks = (rt, prefixes) => Object.keys(rt.landmarks).filter((n) => prefixes.some((f) => n.startsWith(f)));

/**
 * Measure one drawn key.
 * @param {{W: number, H: number, sx: number, sy: number, ox: number, oy: number}} frame the raster frame the key was drawn in (`rig-read.mjs#rigContext`)
 * @param {{alpha: Uint8Array, k: Float64Array}} drawn `drawKey`'s result
 * @param {object} rt the normalised rig @param {string[]} footNames the foot landmarks
 * @returns {{box: number[], feet: number[]|null, profile: {left: Array<number|null>, right: Array<number|null>}}|null} null when nothing is painted
 */
export function silhouetteOf(frame, drawn, rt, footNames) {
  const { W, H, sx, sy, ox, oy } = frame;
  const a = drawn.alpha;
  const cut = Math.round(PAINTED_ALPHA * 255);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      if (a[row + x] >= cut) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const left = new Array(BANDS).fill(null);
  const right = new Array(BANDS).fill(null);
  for (let b = 0; b < BANDS; b++) {
    const ra = y0 + Math.floor((b * bh) / BANDS);
    const rb = y0 + Math.max(Math.floor((b * bh) / BANDS) + 1, Math.floor(((b + 1) * bh) / BANDS));
    let lo = -1;
    let hi = -1;
    for (let y = ra; y < Math.min(rb, y1 + 1); y++) {
      const row = y * W;
      for (let x = x0; x <= x1; x++) {
        if (a[row + x] >= cut) { if (lo < 0 || x < lo) lo = x; break; }
      }
      for (let x = x1; x >= x0; x--) {
        if (a[row + x] >= cut) { if (x > hi) hi = x; break; }
      }
    }
    if (lo < 0) continue;
    left[b] = r3((lo - x0) / bw);
    right[b] = r3((hi + 1 - x0) / bw);
  }
  let feet = null;
  for (const n of footNames) {
    const l = rt.landmarks[n];
    const [fx, fy] = through(drawn.k, l.bone, l.x, l.y);
    if (!feet || fy > feet[1]) feet = [fx, fy];
  }
  return {
    box: [r1((x0 - ox) / sx), r1((y0 - oy) / sy), r1((x1 + 1 - ox) / sx), r1((y1 + 1 - oy) / sy)],
    feet: feet ? [r1(feet[0]), r1(feet[1])] : null,
    profile: { left, right },
  };
}
