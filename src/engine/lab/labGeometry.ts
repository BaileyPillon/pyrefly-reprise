/**
 * CAMERA LAB: where each shot's camera stands, computed from the figures' positions.
 *
 * Pure math on plain `{x, y, z}` (no `three`, no DOM), so the framing rules are unit-tested:
 * - **The 180-degree rule.** Every lab camera stays on the viewer's side of the party-to-boss
 *   line, so the paintings keep the chirality they were painted with and nothing is mirrored.
 * - **The painted set.** The arena is one forward-facing painting; a view axis further than
 *   `band` degrees off -z sees past it, so every rig is turned back inside the band.
 * - **Nobody in the way.** A hero shot never stands a party member between the lens and the
 *   actor, or the lens inside a figure.
 * - **The hero in the left third.** The yaw is solved so the actor's torso lands at its
 *   screen position and the boss stays readable on the right.
 *
 * Screen coordinates are normalised device coordinates: x -1 (left) .. 1 (right).
 * Headings are degrees from -z, positive toward +x.
 */


export interface V3 {
  x: number;
  y: number;
  z: number;
}

export interface LabRig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

export interface LabFigure {
  id: string;
  pos: V3;
  height: number;
  side: 'party' | 'enemy' | 'aeon';
  /** Up and on the field (not KO'd, not faded off). */
  standing: boolean;
  /** A rear painting is loaded for the art it wears now, and VIEWS is on. */
  hasRear: boolean;
}

export interface LabStageView {
  figures: readonly LabFigure[];
  bossId: string | null;
  /** Canvas width / height. */
  aspect: number;
  /** Where today's master camera stands: which side of the line the viewer is on. */
  viewer: V3;
  /** Today's wide master (the scene's `idle` rig). */
  idleRig: LabRig;
  /** The FFX-2 over-the-shoulder master for this chapter's formation (P2h), if it has one. */
  partyShoulder: LabRig | null;
  /** Max |heading| of a view axis, degrees: inside it the painted set fills the frame. */
  band: number;
}

export const DEG = Math.PI / 180;

/** A lens within this many degrees of looking past a figure at its target sees its back (the rear painting). */
export const REAR_WITHIN_DEG = 58;

export const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const scale = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
export const arr = (v: V3): [number, number, number] => [round(v.x), round(v.y), round(v.z)];
const round = (n: number): number => Math.round(n * 1000) / 1000;

/** The direction from `a` to `b` on the floor, unit length (+x when they coincide). */
export function floorDir(a: V3, b: V3): V3 {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const n = Math.hypot(dx, dz);
  return n < 1e-6 ? v3(1, 0, 0) : v3(dx / n, 0, dz / n);
}

/** Heading of a floor direction, degrees from -z toward +x. */
export function headingOf(d: V3): number {
  return Math.atan2(d.x, -d.z) / DEG;
}

/** The floor direction for a heading. */
export function dirOfHeading(deg: number): V3 {
  return v3(Math.sin(deg * DEG), 0, -Math.cos(deg * DEG));
}

/**
 * The line `a`->`b` as a frame: `f` along it, `s` across it toward the viewer's side.
 */
export function lineFrame(a: V3, b: V3, viewer: V3): { f: V3; s: V3 } {
  const f = floorDir(a, b);
  let s = v3(-f.z, 0, f.x);
  const toViewer = sub(viewer, a);
  if (s.x * toViewer.x + s.z * toViewer.z < 0) s = scale(s, -1);
  return { f, s };
}

/** Signed side of `p` against the line `a`->`b` on the floor (positive = left of the direction). */
function sideOf(a: V3, b: V3, p: V3): number {
  return (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
}

/** True when `cam` is on the same side of the line `a`->`b` as `viewer` (the 180-degree rule). */
export function onViewerSide(cam: V3, a: V3, b: V3, viewer: V3): boolean {
  return Math.sign(sideOf(a, b, cam)) === Math.sign(sideOf(a, b, viewer)) || Math.abs(sideOf(a, b, cam)) < 1e-6;
}

/** `p` reflected across the floor line through `a` and `b` (height kept). */
export function reflectAcross(p: V3, a: V3, b: V3): V3 {
  const f = floorDir(a, b);
  const rel = sub(p, a);
  const along = rel.x * f.x + rel.z * f.z;
  const foot = add(a, scale(f, along));
  return v3(2 * foot.x - p.x, p.y, 2 * foot.z - p.z);
}

/** Project `p` through a rig: normalised device x/y (-1..1 on screen) and depth along the view. */
export function ndcOf(rig: LabRig, p: V3, aspect: number): { x: number; y: number; depth: number } {
  const pos = v3(...rig.position);
  const fwdRaw = sub(v3(...rig.lookAt), pos);
  const fl = Math.hypot(fwdRaw.x, fwdRaw.y, fwdRaw.z) || 1;
  const fwd = scale(fwdRaw, 1 / fl);
  // right = fwd x up(0,1,0); up' = right x fwd
  let right = v3(-fwd.z, 0, fwd.x);
  const rl = Math.hypot(right.x, right.z) || 1;
  right = scale(right, 1 / rl);
  const up = v3(right.y * fwd.z - right.z * fwd.y, right.z * fwd.x - right.x * fwd.z, right.x * fwd.y - right.y * fwd.x);
  const v = sub(p, pos);
  const depth = v.x * fwd.x + v.y * fwd.y + v.z * fwd.z;
  const t = Math.tan((rig.fov * DEG) / 2);
  const d = Math.max(1e-6, depth);
  return {
    x: (v.x * right.x + v.y * right.y + v.z * right.z) / (d * t * aspect),
    y: (v.x * up.x + v.y * up.y + v.z * up.z) / (d * t),
    depth,
  };
}

/** The camera yaw (heading, degrees) that puts `p` at screen x `ndcX` from `cam`. */
export function yawFor(cam: V3, p: V3, ndcX: number, fov: number, aspect: number): number {
  const alpha = headingOf(floorDir(cam, p));
  const tanH = Math.tan((fov * DEG) / 2) * aspect;
  return alpha - Math.atan(ndcX * tanH) / DEG;
}

/** A look-at point `dist` ahead of `cam` on heading `yaw`, at height `lookH`. */
export function lookFrom(cam: V3, yaw: number, lookH: number, dist: number): V3 {
  const d = dirOfHeading(yaw);
  return v3(cam.x + d.x * dist, lookH, cam.z + d.z * dist);
}

/** Turn the rig about its look-at point (on the floor) until its view axis is inside `band`. */
export function clampToBand(rig: LabRig, band: number): LabRig {
  const pos = v3(...rig.position);
  const look = v3(...rig.lookAt);
  const h = headingOf(floorDir(pos, look));
  if (Math.abs(h) <= band) return rig;
  const turn = (Math.sign(h) * band - h) * DEG; // the heading change wanted, radians
  const rel = sub(pos, look);
  // Turning the camera about the look point by R_y(-turn) raises the view's heading by `turn`.
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const rx = rel.x * c - rel.z * s;
  const rz = rel.x * s + rel.z * c;
  return { ...rig, position: arr(v3(look.x + rx, pos.y, look.z + rz)) };
}

/** Distance on the floor from `p` to the segment `a`-`b`, and where along it (0..1). */
function segDist(a: V3, b: V3, p: V3): { d: number; t: number } {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  return { d: Math.hypot(a.x + abx * t - p.x, a.z + abz * t - p.z), t };
}

/** True when a standing figure (other than `except`) in front of the lens blocks its view of `subject`, or the lens stands in one. */
export function blocked(cam: V3, subject: V3, figures: readonly LabFigure[], except: ReadonlySet<string>): boolean {
  const tx = subject.x - cam.x;
  const tz = subject.z - cam.z;
  for (const f of figures) {
    if (except.has(f.id) || !f.standing) continue;
    // A figure behind the lens is never in the frame.
    if ((f.pos.x - cam.x) * tx + (f.pos.z - cam.z) * tz < 0) continue;
    const near = Math.hypot(f.pos.x - cam.x, f.pos.z - cam.z);
    if (near < (f.side === 'enemy' ? 2.2 : 1.05)) return true;
    const { d, t } = segDist(cam, subject, f.pos);
    if (t > 0.06 && t < 0.94 && d < (f.side === 'enemy' ? 1.4 : 0.62)) return true;
  }
  return false;
}

/**
 * Front or rear painting for one figure, from where the lens stands against the way the
 * figure faces (toward `faceTarget`): rear when the lens looks past the figure at its target
 * (within {@link REAR_WITHIN_DEG}), never for a figure that is down or has no rear painting.
 */
export function viewFor(fig: LabFigure, cam: V3, faceTarget: V3 | null): 'front' | 'rear' {
  if (!fig.hasRear || !fig.standing || !faceTarget) return 'front';
  const look = floorDir(cam, fig.pos);
  const face = floorDir(fig.pos, faceTarget);
  const cos = look.x * face.x + look.z * face.z;
  return cos > Math.cos(REAR_WITHIN_DEG * DEG) ? 'rear' : 'front';
}

/** A figure's box on screen through `rig` (ndc), as a standing card turned to the lens; null behind the lens. */
export function screenBox(rig: LabRig, f: LabFigure, aspect: number): { x0: number; x1: number; y0: number; y1: number; depth: number } | null {
  const pos = v3(...rig.position);
  const fwd = floorDir(pos, v3(...rig.lookAt));
  const right = v3(-fwd.z, 0, fwd.x);
  const half = f.height * (f.side === 'enemy' ? 0.3 : 0.24);
  const pts = [0, f.height].flatMap((h) => [-1, 1].map((k) => ndcOf(rig, v3(f.pos.x + right.x * half * k, f.pos.y + h, f.pos.z + right.z * half * k), aspect)));
  if (pts.some((p) => p.depth < 0.2)) return null;
  return {
    x0: Math.min(...pts.map((p) => p.x)),
    x1: Math.max(...pts.map((p) => p.x)),
    y0: Math.min(...pts.map((p) => p.y)),
    y1: Math.max(...pts.map((p) => p.y)),
    depth: pts[0]!.depth,
  };
}

/** How much of `target`'s on-screen box (clipped to the frame) the nearer figures cover, 0..1. */
export function coverOf(rig: LabRig, target: LabFigure, figures: readonly LabFigure[], except: ReadonlySet<string>, aspect: number): number {
  const b = screenBox(rig, target, aspect);
  if (!b) return 1;
  const clip = { x0: Math.max(-1, b.x0), x1: Math.min(1, b.x1), y0: Math.max(-1, b.y0), y1: Math.min(1, b.y1) };
  const area = Math.max(0, clip.x1 - clip.x0) * Math.max(0, clip.y1 - clip.y0);
  const full = (b.x1 - b.x0) * (b.y1 - b.y0) || 1;
  let covered = 1 - area / full; // off the frame counts as covered
  for (const f of figures) {
    if (f.id === target.id || except.has(f.id) || !f.standing) continue;
    const o = screenBox(rig, f, aspect);
    if (!o || o.depth >= b.depth) continue;
    const w = Math.min(clip.x1, o.x1) - Math.max(clip.x0, o.x0);
    const h = Math.min(clip.y1, o.y1) - Math.max(clip.y0, o.y0);
    if (w > 0 && h > 0) covered += (w * h) / full;
  }
  return Math.min(1, covered);
}
