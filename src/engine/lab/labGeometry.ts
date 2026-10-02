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

import type { ShotRequest } from './LabTypes.ts';
import type { ShotTuning } from './labChapters.ts';

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

const DEG = Math.PI / 180;

const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const v3 = (x: number, y: number, z: number): V3 => ({ x, y, z });
const arr = (v: V3): [number, number, number] => [round(v.x), round(v.y), round(v.z)];
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
function lookFrom(cam: V3, yaw: number, lookH: number, dist: number): V3 {
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

/** True when a standing figure (other than `except`) blocks the lens's view of `subject`, or the lens stands in one. */
export function blocked(cam: V3, subject: V3, figures: readonly LabFigure[], except: ReadonlySet<string>): boolean {
  for (const f of figures) {
    if (except.has(f.id) || !f.standing) continue;
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
 * (within 50 degrees), never for a figure that is down or has no rear painting.
 */
export function viewFor(fig: LabFigure, cam: V3, faceTarget: V3 | null): 'front' | 'rear' {
  if (!fig.hasRear || !fig.standing || !faceTarget) return 'front';
  const look = floorDir(cam, fig.pos);
  const face = floorDir(fig.pos, faceTarget);
  const cos = look.x * face.x + look.z * face.z;
  return cos > Math.cos(50 * DEG) ? 'rear' : 'front';
}

// ------------------------------------------------------------------ the shots

const fig = (view: LabStageView, id: string | null): LabFigure | null =>
  (id ? view.figures.find((f) => f.id === id) : undefined) ?? null;

/** The party's centre on the floor (standing members, or everyone when all are down). */
export function partyCentre(view: LabStageView): V3 {
  const party = view.figures.filter((f) => f.side !== 'enemy');
  const use = party.some((f) => f.standing) ? party.filter((f) => f.standing) : party;
  if (!use.length) return v3(0, 0, 0);
  const s = use.reduce((acc, f) => add(acc, f.pos), v3(0, 0, 0));
  return scale(s, 1 / use.length);
}

function bossOf(view: LabStageView): LabFigure | null {
  return fig(view, view.bossId) ?? view.figures.find((f) => f.side === 'enemy' && f.standing) ?? null;
}

/** Keep the rig inside the set and on the viewer's side of the party-to-boss line. */
function legal(rig: LabRig, view: LabStageView): LabRig {
  let out = clampToBand(rig, view.band);
  const boss = bossOf(view);
  if (boss) {
    const o = partyCentre(view);
    const cam = v3(...out.position);
    if (!onViewerSide(cam, o, boss.pos, view.viewer)) out = clampToBand({ ...out, position: arr(reflectAcross(cam, o, boss.pos)) }, view.band);
  }
  return out;
}

function rigOf(cam: V3, look: V3, fov: number): LabRig {
  return { position: arr(cam), lookAt: arr(look), fov };
}

/** A shot over an actor's shoulder (hero, hero-close, caster-low, item-close), with candidates. */
function shoulderShot(view: LabStageView, actor: LabFigure, toward: V3, t: ShotTuning['hero']): LabRig {
  const { f, s } = lineFrame(actor.pos, toward, view.viewer);
  const base = actor.hasRear ? t.angle : t.frontAngle;
  const tries: Array<[number, number]> = [
    [base, t.dist],
    [base - 12, t.dist],
    [base + 10, t.dist],
    [base, t.dist * 1.18],
    [base - 24, t.dist * 0.9],
    [base + 18, t.dist * 1.1],
  ];
  const torso = v3(actor.pos.x, actor.pos.y + actor.height * 0.55, actor.pos.z);
  const except = new Set([actor.id]);
  let first: LabRig | null = null;
  for (const [deg, dist] of tries) {
    const cam = add(add(actor.pos, scale(f, -dist * Math.cos(deg * DEG))), scale(s, dist * Math.sin(deg * DEG)));
    cam.y = t.camH;
    let yaw = yawFor(cam, torso, t.wantX, t.fov, view.aspect);
    let rig = rigOf(cam, lookFrom(cam, yaw, t.lookH, Math.max(4, Math.hypot(toward.x - cam.x, toward.z - cam.z) * 0.6)), t.fov);
    // The boss readable on the right: if it fell off the frame, trade some of the actor's margin.
    const tx = ndcOf(rig, v3(toward.x, toward.y + 1.6, toward.z), view.aspect).x;
    if (tx > 0.86) {
      yaw = yawFor(cam, torso, Math.max(-0.82, t.wantX - (tx - 0.8)), t.fov, view.aspect);
      rig = rigOf(cam, lookFrom(cam, yaw, t.lookH, Math.max(4, Math.hypot(toward.x - cam.x, toward.z - cam.z) * 0.6)), t.fov);
    }
    rig = legal(rig, view);
    first ??= rig;
    const at = v3(...rig.position);
    if (Math.abs(headingOf(floorDir(at, v3(...rig.lookAt)))) > view.band + 0.5) continue;
    if (blocked(at, actor.pos, view.figures, except)) continue;
    return rig;
  }
  return first ?? legal(rigOf(add(actor.pos, v3(0, t.camH, 3)), add(actor.pos, v3(0, t.lookH, -3)), t.fov), view);
}

/** A close view of an enemy from the party's side (`angle` toward the viewer's side), sized by its height. */
function enemyShot(view: LabStageView, enemy: LabFigure, t: ShotTuning['target'], wantX = 0.05): LabRig {
  const party = partyCentre(view);
  const g = floorDir(enemy.pos, party);
  const { s } = lineFrame(party, enemy.pos, view.viewer);
  const dir = floorDir(v3(0, 0, 0), add(scale(g, Math.cos(t.angle * DEG)), scale(s, Math.sin(t.angle * DEG))));
  const dist = Math.max(3.2, enemy.height * t.distPerHeight);
  const cam = add(enemy.pos, scale(dir, dist));
  cam.y = t.camH;
  const aim = v3(enemy.pos.x, enemy.pos.y + enemy.height * t.lookPerHeight, enemy.pos.z);
  const yaw = yawFor(cam, aim, wantX, t.fov, view.aspect);
  return legal(rigOf(cam, lookFrom(cam, yaw, aim.y, dist), t.fov), view);
}

/** Solve one shot. `T` is the style's tuning for this chapter. */
export function solveShot(req: ShotRequest, view: LabStageView, T: ShotTuning): LabRig {
  const boss = bossOf(view);
  const subject = fig(view, req.subject);
  const other = fig(view, req.target);
  const bossPos = boss?.pos ?? v3(0, 0, -6);
  switch (req.kind) {
    case 'hero':
    case 'hero-close':
    case 'caster-low':
    case 'item-close': {
      if (!subject) return view.idleRig;
      const t = req.kind === 'hero' ? T.hero : req.kind === 'hero-close' ? T.heroClose : req.kind === 'caster-low' ? T.casterLow : T.itemClose;
      const toward = subject.side === 'enemy' ? partyCentre(view) : (other && other.side === 'enemy' ? other.pos : bossPos);
      return shoulderShot(view, subject, toward, t);
    }
    case 'party-shoulder':
      return view.partyShoulder ? legal(view.partyShoulder, view) : view.idleRig;
    case 'party-front':
      return view.idleRig;
    case 'target':
    case 'enemy-front': {
      const enemy = subject ?? boss;
      if (!enemy) return view.idleRig;
      return enemyShot(view, enemy, req.kind === 'target' ? T.target : T.enemyFront);
    }
    case 'impact-wide': {
      if (subject && subject.side === 'enemy') return enemyShot(view, subject, T.impactWide, 0.05);
      // On the party (a heal): high over their shoulders, toward the boss.
      const o = partyCentre(view);
      const { f, s } = lineFrame(o, bossPos, view.viewer);
      const cam = add(add(o, scale(f, -T.partyWide.back)), scale(s, T.partyWide.side));
      cam.y = T.partyWide.camH;
      return legal(rigOf(cam, v3(o.x + f.x * 1.2, T.partyWide.lookH, o.z + f.z * 1.2), T.partyWide.fov), view);
    }
    case 'lunge-side': {
      if (!subject) return view.idleRig;
      const target = other?.pos ?? bossPos;
      const mid = scale(add(subject.pos, target), 0.5);
      const { f, s } = lineFrame(subject.pos, target, view.viewer);
      const L = T.lungeSide;
      const cam = add(add(mid, scale(f, -L.dist * Math.cos(L.angle * DEG))), scale(s, L.dist * Math.sin(L.angle * DEG)));
      cam.y = L.camH;
      return legal(rigOf(cam, v3(mid.x, L.lookH, mid.z), L.fov), view);
    }
    case 'enemy-behind-party': {
      const enemy = subject ?? boss;
      const o = partyCentre(view);
      const ePos = enemy?.pos ?? bossPos;
      const { f, s } = lineFrame(o, ePos, view.viewer);
      const B = T.enemyBehindParty;
      const cam = add(add(o, scale(f, -B.back)), scale(s, B.side));
      cam.y = B.camH;
      const aim = v3(ePos.x, ePos.y + (enemy?.height ?? 4) * B.lookPerHeight, ePos.z);
      const yaw = yawFor(cam, aim, B.wantX, B.fov, view.aspect);
      return legal(rigOf(cam, lookFrom(cam, yaw, aim.y * 0.85, Math.hypot(aim.x - cam.x, aim.z - cam.z)), B.fov), view);
    }
    case 'colossus': {
      const enemy = subject && subject.side === 'enemy' ? subject : boss;
      if (!enemy) return view.idleRig;
      const party = partyCentre(view);
      const g = floorDir(enemy.pos, party);
      const { s } = lineFrame(party, enemy.pos, view.viewer);
      const C = T.colossus;
      const cam = add(add(enemy.pos, scale(g, enemy.height * C.towardPerHeight)), scale(s, enemy.height * C.sidePerHeight));
      cam.y = C.camH;
      const look = add(add(enemy.pos, scale(g, enemy.height * 0.15)), scale(s, -enemy.height * 0.28));
      look.y = enemy.pos.y + enemy.height * C.lookPerHeight;
      return legal(rigOf(cam, look, C.fov), view);
    }
    case 'victory': {
      const hero = subject ?? view.figures.find((f) => f.side !== 'enemy' && f.standing) ?? null;
      if (!hero) return view.idleRig;
      const toViewer = floorDir(hero.pos, view.viewer);
      const V = T.victory;
      const cam = add(hero.pos, scale(toViewer, V.dist));
      cam.y = V.camH;
      const look = add(hero.pos, scale(toViewer, -0.6));
      look.y = V.lookH;
      return legal(rigOf(cam, look, V.fov), view);
    }
  }
}
