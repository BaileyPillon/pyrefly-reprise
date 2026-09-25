/**
 * **Where a body lies** when a standing painting is rolled onto its back
 * (`PaintedActor.lieDown`, the `'body'` departure; Seymour at Macalania, D-046).
 *
 * The roll turns the plane about the feet, in its own plane. Two corrections
 * make the result a body lying on the floor at its own station rather than a
 * card tipped over beside it (Chapter VII e2e, commit 06338dbc: "lies tilted
 * off the floor", laid out a body-length from where he stood):
 *
 * - **the slide**: the roll about the feet would carry the painting's middle a
 *   half body-length away, so it is slid back until its middle is over the
 *   same spot the standing figure's middle was;
 * - **the lift**: whatever corner of the painted content ends lowest is raised
 *   to the floor, so nothing sinks through it and, at a full quarter turn, the
 *   whole long edge rests on it.
 *
 * Pure (no `three`), so the geometry is unit-tested without a WebGL context.
 * Shared plumbing, both games; only FFX's Seymour uses it today.
 */

/**
 * The tip back, radians: a full quarter turn, so the painting lies **flat** on
 * the floor, face up. The fix pass's 1.0 left it a plane 32.7 degrees up from
 * the floor with its far edge 37 percent of his standing height in the air
 * (repair-pass verifier: "Not flat").
 */
export const LIE_FLAT_TILT = Math.PI / 2;

/**
 * How far a body lying flat floats over the floor, world units: enough that
 * the painting never fights the floor or the blob shadow for depth, too little
 * to read as a gap at any game framing.
 */
export const LIE_CLEARANCE = 0.03;

/** The painted content's box in the plane's own units: x centred on the feet, y up from them. */
export interface ContentBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * `[dx, lift, dz]` for a plane rolled by `angle` radians (positive = counter-
 * clockwise, as `Object3D.rotation.z`) and then tipped back by `tilt` radians
 * about its now-horizontal long axis (`rotation.x = -tilt`, the top going away
 * from a camera on +z), with `mirrored` when the plane is drawn flipped
 * (`mesh.scale.x < 0`). `[0, 0, 0]` unrolled.
 *
 * The tip back is what makes it read as lying *on* the floor rather than
 * standing on its side above it (Chapter VII fix-pass frames: a painting
 * rolled a quarter turn stands as tall as its figure is wide, so Seymour's
 * robe held his head a body-width off the ground). The lift is recomputed
 * for the tipped plane, and `dz` keeps the body's middle at its station.
 */
export function lieOffset(box: ContentBox, mirrored: boolean, angle: number, tilt = 0): [number, number, number] {
  if (angle === 0) return [0, 0, 0];
  const xs = mirrored ? [-box.x1, -box.x0] : [box.x0, box.x1];
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  let low = 0;
  for (const x of xs) for (const y of [box.y0, box.y1]) low = Math.min(low, x * s + y * c);
  const cx = (xs[0]! + xs[1]!) / 2;
  const cy = (box.y0 + box.y1) / 2;
  // The rolled centre's height above the feet, before any lift or tip.
  const midY = cx * s + cy * c;
  const lift = -low * Math.cos(tilt) + LIE_CLEARANCE * (1 - Math.cos(tilt));
  return [cx - (cx * c - cy * s), lift, midY * Math.sin(tilt)];
}
