/**
 * How a downed (prone) painting rests on the floor.
 *
 * Critic PR-0022: a KO'd Yuna was the standing figure's plane swapped for her
 * KO painting and nothing more, so the painted body — drawn curled on its side
 * at a slant, head high and boots low — hung in the air on its lowest pixel
 * like a diagonal banner. A body dropped on a floor does not balance on its
 * lowest point: it rolls until it lies on the edge of its outline that sits
 * under its centre of mass. That is what this module works out, from the
 * painting's own alpha, once at load time:
 *
 * - {@link groundHullFromBottoms} — the lower convex hull of the silhouette
 *   (every column's lowest painted pixel, hulled) and the silhouette's centroid;
 * - {@link restPlacement} — the in-plane roll that lays the hull edge under the
 *   centroid flat on the ground, turned about the centroid so the figure stays
 *   at its own station, then lowered so its lowest point touches the floor.
 *
 * No new art: the painting is only turned and set down. GAME-AWARE (AGENTS.md
 * rule 14): **both games** — one shared actor layer draws every KO in FFX
 * chapters 1-3 and FFX-2 chapters 4-6 alike.
 *
 * Pure: no `three`, no DOM.
 */

/** The silhouette's underside, as measured from alpha. Source pixels, y down. */
export interface GroundHull {
  /** Lower convex hull, left to right: `[x, y]` with `y` the pixel row. */
  hull: Array<[number, number]>;
  /** Centroid of the opaque pixels. */
  cx: number;
  cy: number;
}

/** The largest roll a painting is ever given, in radians (~31.5 degrees). */
export const MAX_REST_ROLL = 0.55;

/**
 * The lower convex hull of a silhouette's underside.
 *
 * `bottoms[i]` is the lowest opaque row of sample column `i` (−1 for an empty
 * column); `scaleX` / `scaleY` convert sample units back to source pixels.
 * Returns null when fewer than two columns carry paint.
 */
export function groundHullFromBottoms(
  bottoms: ArrayLike<number>,
  centroid: { x: number; y: number },
  scaleX = 1,
  scaleY = 1,
): GroundHull | null {
  const hull: Array<[number, number]> = [];
  for (let i = 0; i < bottoms.length; i++) {
    const row = bottoms[i]!;
    if (!(row >= 0)) continue;
    // y-up height is -row; a lower hull in y-up is the chain that turns left.
    const p: [number, number] = [(i + 0.5) * scaleX, (row + 1) * scaleY];
    while (hull.length >= 2) {
      const a = hull[hull.length - 2]!;
      const b = hull[hull.length - 1]!;
      // Cross product in y-up space (negate the rows).
      const cross = (b[0] - a[0]) * (-p[1] + a[1]) - (-b[1] + a[1]) * (p[0] - a[0]);
      if (cross <= 0) hull.pop();
      else break;
    }
    hull.push(p);
  }
  if (hull.length < 2) return null;
  return { hull, cx: centroid.x * scaleX, cy: centroid.y * scaleY };
}

/** A plane's in-plane roll and centre, in its parent's (the actor's) frame. */
export interface RestPlacement {
  /** Rotation about the view axis, radians. */
  roll: number;
  /** Plane centre, world units, origin at the actor's ground point. */
  x: number;
  y: number;
}

/**
 * Lay a prone painting on the floor.
 *
 * @param ground   the pose's measured {@link GroundHull} (source pixels)
 * @param frame    PNG width and the anchor row that sits on the ground
 * @param upp      world units per pixel (`PoseScale.unitsPerPixel`)
 * @param offsetY  the upright plane's centre height (`PoseScale.offsetY`)
 * @param mirror   `-1` when the plane is drawn mirrored, else `1`
 */
export function restPlacement(
  ground: GroundHull,
  frame: { width: number; anchorY: number },
  upp: number,
  offsetY: number,
  mirror: 1 | -1,
  maxRoll = MAX_REST_ROLL,
): RestPlacement {
  const halfW = frame.width / 2;
  // Source pixel -> the plane's local frame (world units, x right, y up, origin
  // at the ground point), mirrored the way the plane is.
  const local = (px: number, py: number): [number, number] => [
    (px - halfW) * upp * mirror,
    (frame.anchorY - py) * upp,
  ];
  const pts = ground.hull.map(([px, py]) => local(px, py));
  if (mirror === -1) pts.reverse();
  const [gx, gy] = local(ground.cx, ground.cy);

  // The hull edge under the centroid is the one the body settles on.
  let slope = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (gx >= a[0] && gx <= b[0] && b[0] > a[0]) {
      slope = Math.atan2(b[1] - a[1], b[0] - a[0]);
      break;
    }
  }
  const roll = Math.max(-maxRoll, Math.min(maxRoll, -slope));
  const cos = Math.cos(roll);
  const sin = Math.sin(roll);
  const rot = (x: number, y: number): [number, number] => [
    gx + (x - gx) * cos - (y - gy) * sin,
    gy + (x - gx) * sin + (y - gy) * cos,
  ];

  // Turned about the centroid, so the body stays where it fell; then lowered
  // (or lifted) until its lowest hull point is exactly on the floor.
  let lowest = Infinity;
  for (const [x, y] of pts) lowest = Math.min(lowest, rot(x, y)[1]);
  if (!Number.isFinite(lowest)) lowest = 0;
  const [cx, cy] = rot(0, offsetY);
  return { roll, x: cx, y: cy - lowest };
}

/** The bits of a plane mesh {@link placePlane} writes. */
interface PlacedMesh {
  rotation: { set(x: number, y: number, z: number): unknown };
  position: { set(x: number, y: number, z: number): unknown };
  scale: { x: number };
}

/**
 * Position one pose plane under its actor: an upright pose stands centred over
 * the feet; a prone one with a measured underside is rolled to rest on the
 * floor ({@link restPlacement}) and slid `shift` along it (`ProneLay`).
 * Call after the plane's scale (and mirror) is set.
 */
export function placePlane(
  mesh: PlacedMesh,
  scale: { prone: boolean; anchorY: number; unitsPerPixel: number; offsetY: number },
  meta: { width: number; ground?: GroundHull },
  shift = 0,
): void {
  const g = scale.prone ? meta.ground : undefined;
  const r = g
    ? restPlacement(
        g,
        { width: meta.width, anchorY: scale.anchorY },
        scale.unitsPerPixel,
        scale.offsetY,
        mesh.scale.x < 0 ? -1 : 1,
      )
    : null;
  mesh.rotation.set(0, 0, r ? r.roll : 0);
  mesh.position.set(r ? r.x + shift : 0, r ? r.y : scale.offsetY, 0);
}
