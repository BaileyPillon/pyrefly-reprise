/**
 * Where the living portrait looks (D-321, Bailey's pick): **the eyes follow the highlighted tab or row, with no extra
 * input**. The pause already has a cursor; the face simply looks at it.
 *
 * Three pure steps, all in one frame space (each axis -1 to 1 over the painting's frame, (0, 0) its centre; the same
 * space `PortraitDriver.setGaze` speaks):
 * 1. {@link framePoint}: the highlighted element's centre as a point in the frame.
 * 2. {@link lookToward}: the direction from the face to that point, as a deflection (each axis -1 to 1).
 * 3. {@link irisOffset}: the deflection plus the A2 glance as an iris offset in master pixels, small and clamped (the
 *    parts' contact sheets show a clean iris to about 8 px; the plate's own `gazeScale` shrinks it further where a
 *    README names a flaw at large offsets).
 *
 * Game case: both. Pure: no DOM (callers pass plain rectangles), no clock, no RNG.
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The centre of `target` as a point in `frame`'s space (-1 to 1 per axis). A degenerate frame answers the centre. */
export function framePoint(target: Rect, frame: Rect): Point {
  if (!(frame.width > 0) || !(frame.height > 0)) return { x: 0, y: 0 };
  const cx = target.left + target.width / 2 - frame.left;
  const cy = target.top + target.height / 2 - frame.top;
  return { x: clamp((cx / frame.width) * 2 - 1, -1, 1), y: clamp((cy / frame.height) * 2 - 1, -1, 1) };
}

/**
 * The deflection from a face to a point, each axis -1 to 1: the full deflection is a point one quarter of the frame
 * away (half a unit), eased so a nearby target moves the eyes a little and a far one all the way.
 */
export function lookToward(point: Point, face: Point): Point {
  const ease = (d: number): number => Math.tanh(d * 2.2) / Math.tanh(1.1);
  return { x: clamp(ease(point.x - face.x), -1, 1), y: clamp(ease(point.y - face.y), -1, 1) };
}

/** Iris travel in master (2x) pixels at a deflection of 1, and what the A2 glance adds. */
export const TRAVEL = { x: 6.5, y: 3 } as const;
export const GLANCE_TRAVEL = { x: 2, y: 1 } as const;
/** Never past this, whatever the sum: the parts are clean to about 8 px. */
export const LIMIT = { x: 8.5, y: 4 } as const;

/**
 * The iris offset in master pixels: the deflection, plus the glance aside (toward `side`, +1 or -1 on x, and a touch
 * up), all scaled by the plate's `gazeScale` and clamped. Positive x is to the right of the frame, y down.
 */
export function irisOffset(look: Point, glance: number, side: number, gazeScale: number): Point {
  const k = clamp(gazeScale, 0, 1);
  const x = (look.x * TRAVEL.x + glance * GLANCE_TRAVEL.x * side) * k;
  const y = (look.y * TRAVEL.y - glance * GLANCE_TRAVEL.y) * k;
  return { x: clamp(x, -LIMIT.x * k, LIMIT.x * k), y: clamp(y, -LIMIT.y * k, LIMIT.y * k) };
}

/** Which way the glance goes: toward the highlight when it is off to one side, else toward the middle of the frame. */
export function glanceSide(look: Point, face: Point): number {
  if (Math.abs(look.x) > 0.15) return look.x > 0 ? 1 : -1;
  return face.x > 0 ? -1 : 1;
}
