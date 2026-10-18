// Continuity harness: the plane geometry (projective maps of a painting onto the screen). Pure; split out of continuity-pure.mjs, which re-exports it.
//
// Game case: both (shared critic plumbing).

/**
 * The projective map of the unit square onto a screen quad, as a row-major 3x3: (0,0) -> corner 0 (top-left),
 * (1,0) -> corner 1, (1,1) -> corner 2, (0,1) -> corner 3. A flat plane seen through a camera maps to its four
 * projected corners by exactly this (Heckbert's square-to-quad), so any point of the painting is one multiply.
 * @param {ArrayLike<number>} q [x0,y0,x1,y1,x2,y2,x3,y3]
 */
export function unitSquareToQuad(q) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) return [x1 - x0, x3 - x0, x0, y1 - y0, y3 - y0, y0, 0, 0, 1];
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

/** Map (u,t) of the painting to the screen. */
export function applyH(H, u, t) {
  const w = H[6] * u + H[7] * t + H[8];
  return [(H[0] * u + H[1] * t + H[2]) / w, (H[3] * u + H[4] * t + H[5]) / w];
}

/** The inverse of a 3x3 (row-major), or null when singular. */
export function invertH(H) {
  const [a, b, c, d, e, f, g, h, i] = H;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) return null;
  const k = 1 / det;
  return [A * k, -(b * i - c * h) * k, (b * f - c * e) * k, B * k, (a * i - c * g) * k, -(a * f - c * d) * k, C * k, -(a * h - b * g) * k, (a * e - b * d) * k];
}

/** Shoelace area of a polygon given as [[x,y],...]. */
export function polygonArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    s += x0 * y1 - x1 * y0;
  }
  return Math.abs(s) / 2;
}
