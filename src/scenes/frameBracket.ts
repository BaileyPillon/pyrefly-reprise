/**
 * Props that bracket the frame stay at the frame's edge when the window is wider than 16:9 (round 21, PR-0344; FFX-2 only in use:
 * Chapters IV and XIII's two Bevelle conduits).
 *
 * A bracketing prop stands where the 16:9 frame cuts it ("a conduit at x 7.7 is cut by the edge", `bevelle-underground.ts`). At 21:9
 * the same world x is a third of the way in from the edge, so each pipe stood in the picture as a dark slab with two straight, tilted
 * sides and a strip of lamps on it: the "hard tilted seam with a brighter lantern at the very edge" the critic saw at 2560x1080 (the
 * painted wings were innocent: with the two pipes hidden the join disappears). At a fixed vertical field of view the frame's half-width
 * at any depth grows with the aspect, so scaling a prop's x by `aspect / (16 / 9)` keeps it at the same fraction of the frame: cut by
 * the edge at every width. Narrower than 16:9 nothing moves (the pipes are then outside the frame, as they were).
 *
 * Pure; no `three`, no DOM.
 */

/** The aspect the bracketing props were placed for (the rig tables are solved at 16:9). */
export const BRACKET_ASPECT = 16 / 9;

/** What a bracketing prop's world x is multiplied by at `aspect`: 1 at 16:9 and narrower, `aspect / (16 / 9)` wider. */
export function bracketScale(aspect: number): number {
  return Number.isFinite(aspect) && aspect > BRACKET_ASPECT ? aspect / BRACKET_ASPECT : 1;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// PR-0421 (round 24, deep review of 72973096; FFX-2 only in use: Chapter IV's Bevelle conduits): the same rule for a camera that pulls back.
//
// `bracketScale` keeps a bracketing prop at the frame's edge when the WINDOW widens; the camera can do the same to it. Chapter IV opens on the
// scene's `intro` rig (high, 16.4 back; the party walks on there, the name slab dissolves over it) and a pull-back stands the two pipes in the
// picture exactly as a wide window did: at 1600x900 they read as two dark slabs, x 0 to 190 and x 1350 to 1470, with the painting beyond them. The
// reviewer read them as the plate's edges; they are not: the painting and its wings fill that frame (hide the pipes and the frame is all painting;
// the frustum stays inside the plate at every window shape, `tests/unit/r41-ch4cam.test.ts`). So the pipes follow a pull-back out: where the
// camera's frame is more than 12 percent wider at a pipe's depth than the rig they were placed against (the idle rig; the giants' own views are
// 7 to 11 percent wider, the idle sway a little more), a pipe is held to the share of the frame it already has there (12 percent in, what the close rigs show)
// and brought out to the border at 30 percent wider. Nothing else moves: the close rigs (the action, party, enemy and victory shots), the settled frames, a window
// narrower than 16:9 and the phone are as they were.
// ---------------------------------------------------------------------------------------------------------------------------------

/** The rig the pipes were placed against: the Bevelle scene's `idle` (`CAMERA_REF` and the `idle` rig there): where it stands, what it looks at, and its lens. */
export const BRACKET_REF = { pos: [0, 3.0, 9.6], look: [0.15, 1.5, -1.3], fov: 32 } as const;

/**
 * How much wider than {@link BRACKET_REF}'s frame (at a pipe's depth) a camera's may be before a pipe is held (`from`), and the width at which the pipe has reached the border (`full`);
 * between them the share of the frame's width its inner edge may stand in from the border runs from `inboard` (12 percent: what the close rigs show, and what a pipe has under the
 * opening's move where it crosses `from`, so nothing jumps) down to nothing, along a smoothstep. The giants' idle views, with the sway and the comfort camera's drift, stay under
 * `from` (7 to 11 percent wider) and are untouched.
 */
export const BRACKET_WIDEN = { from: 1.12, full: 1.3, inboard: 0.12 } as const;

/** What the clamp reads of the camera: where it stands, the basis of its view (its right and forward vectors), the half height of its frame at unit depth and its aspect. */
export interface BracketCamera {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  wx: number;
  wy: number;
  wz: number;
  /** tan(fov / 2). */
  tanV: number;
  aspect: number;
}

/** The camera as the clamp reads it: a three.js `PerspectiveCamera`'s position, quaternion, vertical field of view (degrees) and aspect (structural, so this file imports nothing). */
export function bracketCamera(c: {
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  fov: number;
  aspect: number;
}): BracketCamera {
  const { x, y, z, w } = c.quaternion;
  return {
    x: c.position.x,
    y: c.position.y,
    z: c.position.z,
    rx: 1 - 2 * (y * y + z * z),
    ry: 2 * (x * y + w * z),
    rz: 2 * (x * z - w * y),
    wx: -2 * (x * z + w * y),
    wy: -2 * (y * z - w * x),
    wz: -(1 - 2 * (x * x + y * y)),
    tanV: Math.tan((c.fov * Math.PI) / 360),
    aspect: c.aspect,
  };
}

/** The reference rig's forward vector (what a pipe's depth under it is read with) and its lens. */
const REF_W = (() => {
  const d = [BRACKET_REF.look[0] - BRACKET_REF.pos[0], BRACKET_REF.look[1] - BRACKET_REF.pos[1], BRACKET_REF.look[2] - BRACKET_REF.pos[2]] as const;
  const n = Math.hypot(d[0], d[1], d[2]);
  return { x: d[0] / n, y: d[1] / n, z: d[2] / n, tanV: Math.tan((BRACKET_REF.fov * Math.PI) / 360) };
})();

const smooth01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Where a bracketing pipe stands, world x: `x` (today's place: `base` times {@link bracketScale}) or, where the camera's frame is wider at the pipe's depth than the reference rig's
 * ({@link BRACKET_WIDEN}), further out: the share of the frame's width the pipe's inner edge stands in from the border is held to a smoothstep of how much wider it is, from
 * {@link BRACKET_WIDEN}`.inboard` to nothing at {@link BRACKET_WIDEN}`.full`. One-sided (a pipe never moves in) and continuous in the camera, so a dolly takes the pipe out and back along
 * the same path. `base` is the pipe's
 * placed x, `z` its world z, `r` its radius at the foot; `cam` null (no camera bound, a phone) leaves `x`.
 *
 * The pipe's inner edge is placed on the view ray at the wanted fraction, read through the camera's own basis (so the move's yaw, pitch and roll are in it) at the pipe's foot, the
 * deck: a camera that looks down leans a vertical pipe in toward the bottom of the frame, so the foot is the most inboard point of it.
 */
export function bracketedX(base: number, z: number, r: number, x: number, cam: BracketCamera | null): number {
  if (!cam || base === 0) return x;
  const left = base < 0;
  const inner = x + (left ? r : -r);
  const dy = -cam.y;
  const dz = z - cam.z;
  const depth = (inner - cam.x) * cam.wx + dy * cam.wy + dz * cam.wz;
  if (!(depth > 1e-6)) return x; // not in front of the lens
  const ta = cam.tanV * cam.aspect;
  const ndc = ((inner - cam.x) * cam.rx + dy * cam.ry + dz * cam.rz) / (depth * ta); // -1 left border .. 1 right border
  const share = left ? (ndc + 1) / 2 : (1 - ndc) / 2; // how far in from the border the inner edge stands, of the frame's width
  if (!(share > 0)) return x; // at the border or past it already
  const depthRef = (inner - BRACKET_REF.pos[0]) * REF_W.x - BRACKET_REF.pos[1] * REF_W.y + (z - BRACKET_REF.pos[2]) * REF_W.z;
  if (!(depthRef > 1e-6)) return x;
  const widen = (depth * cam.tanV) / (depthRef * REF_W.tanV); // the two frames' half widths at the pipe's depth (the aspect is the same in both)
  if (!(widen > BRACKET_WIDEN.from)) return x;
  const want = Math.min(share, BRACKET_WIDEN.inboard * (1 - smooth01((widen - BRACKET_WIDEN.from) / (BRACKET_WIDEN.full - BRACKET_WIDEN.from))));
  if (!(want < share)) return x;
  const n = left ? 2 * want - 1 : 1 - 2 * want;
  const den = cam.rx - n * ta * cam.wx;
  if (!(Math.abs(den) > 1e-6)) return x;
  const innerWant = cam.x + (n * ta * (dy * cam.wy + dz * cam.wz) - dy * cam.ry - dz * cam.rz) / den;
  if (!Number.isFinite(innerWant) || (innerWant - cam.x) * cam.wx + dy * cam.wy + dz * cam.wz <= 0) return x;
  const moved = innerWant + (left ? -r : r);
  return left ? Math.min(x, moved) : Math.max(x, moved);
}
