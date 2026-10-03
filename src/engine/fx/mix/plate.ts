import { Vector3, type Mesh, type Object3D, type PlaneGeometry } from 'three';
import { UP, coverShare, type Box, type Fig, type Pose } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's FAIL-CLOSED gates (round 19, PR-0307 and PR-0310; both games, shared
 * plumbing). A colossus master is an authored view of a painting that was made for today's rig, so it
 * is only allowed to stand when it shows the painted plate no worse than today's rig does (PR-0307:
 * Yunalesca's master showed the plate's tilted edge and a dark void at every aspect) and when no party member
 * stands inside a boss's silhouette at rest (PR-0310: "a positive gap", promised by `masters.ts`, now enforced).
 * A master that fails either is not used: the fit falls back toward today's rig, which is always a candidate.
 *
 * Pure apart from reading the plate mesh's matrix. Nothing here writes the camera or a figure (rule 1).
 */

/** The painted plate as a rectangle in space: its centre, unit axes, normal and half sizes (world). */
export interface Plate {
  o: Vector3;
  u: Vector3;
  v: Vector3;
  n: Vector3;
  hw: number;
  hh: number;
}

/** The plate of a scene: `Backdrop`'s main painting (`backdrop-painting`), as its world matrix and geometry place it. */
export function plateOf(root: Object3D | null | undefined): Plate | null {
  const main = root?.getObjectByName?.('backdrop-painting') as Mesh | undefined;
  const p = (main?.geometry as PlaneGeometry | undefined)?.parameters;
  if (!main || !p?.width || !p?.height) return null;
  main.updateWorldMatrix(true, false);
  const m = main.matrixWorld;
  const u = new Vector3().setFromMatrixColumn(m, 0);
  const v = new Vector3().setFromMatrixColumn(m, 1);
  const hw = (p.width / 2) * u.length();
  const hh = (p.height / 2) * v.length();
  u.normalize();
  v.normalize();
  return { o: new Vector3().setFromMatrixPosition(m), u, v, n: new Vector3().crossVectors(u, v).normalize(), hw, hh };
}

const GX = 13;
const GY = 9;

/** The view ray through a field point, for a pose and a static lens shift (CSS px, + = content right / down). */
function rayAt(pose: Pose, W: number, H: number, sx: number, sy: number, lens: readonly [number, number]): Vector3 {
  const f = new Vector3().subVectors(pose.look, pose.pos).normalize();
  const right = new Vector3().crossVectors(f, UP).normalize();
  const up = new Vector3().crossVectors(right, f).normalize();
  const tanV = Math.tan((pose.fov * Math.PI) / 360);
  const nx = ((sx - lens[0]) / W) * 2 - 1;
  const ny = 1 - ((sy - lens[1]) / H) * 2;
  return f.addScaledVector(right, nx * tanV * (W / H)).addScaledVector(up, ny * tanV);
}

/**
 * Where the ray from `pos` along `dir` lands: on the painting, below its bottom edge (the lit ground plane stands there; a plate
 * is hung at the floor line), or past it (above, to a side or behind: the scene's background colour, the dark void).
 */
function lands(plate: Plate, pos: Vector3, dir: Vector3): 'on' | 'below' | 'void' {
  const den = dir.dot(plate.n);
  if (Math.abs(den) < 1e-9) return 'void';
  const t = new Vector3().subVectors(plate.o, pos).dot(plate.n) / den;
  if (t <= 0) return 'void';
  const hit = pos.clone().addScaledVector(dir, t).sub(plate.o);
  const a = hit.dot(plate.u);
  const b = hit.dot(plate.v);
  if (Math.abs(a) > plate.hw || b > plate.hh) return 'void';
  return b < -plate.hh ? 'below' : 'on';
}

/**
 * The share of the frame (sampled on a grid, the four corners included) whose view ray runs past the plate (above it, to a side
 * or behind: the void; below its bottom edge is the ground plane, not counted): 0 when the whole frame shows painting or ground.
 * `corners` counts the frame's corners that miss it.
 */
export function plateMiss(plate: Plate, pose: Pose, W: number, H: number, lens: readonly [number, number] = [0, 0]): { share: number; corners: number } {
  let miss = 0;
  let corners = 0;
  for (let i = 0; i < GX; i++)
    for (let j = 0; j < GY; j++) {
      if (lands(plate, pose.pos, rayAt(pose, W, H, (i / (GX - 1)) * W, (j / (GY - 1)) * H, lens)) !== 'void') continue;
      miss++;
      if ((i === 0 || i === GX - 1) && (j === 0 || j === GY - 1)) corners++;
    }
  return { share: miss / (GX * GY), corners };
}

/** What a master may show beyond today's rig: a sliver (a grid cell's worth is 0.9 %). */
export const PLATE_TOLERANCE = 0.004;

/**
 * The plate gate for a pose: how much more of the frame misses the plate than today's rig does (0 = passes;
 * today's own miss is the allowance, so a plate today's rig already runs past is never held against a master that
 * shows no more of the edge). `today` is `plateMiss` of today's rig at the same size.
 */
export function plateExcess(plate: Plate | null, today: { share: number; corners: number } | null, pose: Pose, W: number, H: number, lens: readonly [number, number]): number {
  if (!plate || !today) return 0;
  const m = plateMiss(plate, pose, W, H, lens);
  const more = Math.max(0, m.share - today.share - PLATE_TOLERANCE);
  return m.corners > today.corners && more === 0 ? PLATE_TOLERANCE : more;
}

/** The share of a party member's box a boss's painted pixels may cover before the two count as touching (three of the 48 grid cells; a stray cell is not a member standing inside a boss). */
export const REST_COVER_MAX = 0.06;

/**
 * The rest gap (PR-0310): the nearest approach, in CSS px, between any party member's screen box and any enemy's painted
 * silhouette; positive means nobody stands inside a boss. A boss with a mask counts only its painted pixels (a serpent's box is
 * mostly sky); without one its box is the silhouette. Negative = the depth of the overlap along the shorter axis.
 */
export function restGap(boxes: readonly Box[], figs: readonly Fig[]): number {
  let gap = Infinity;
  figs.forEach((p, i) => {
    if (p.enemy) return;
    const a = boxes[i]!;
    figs.forEach((e, j) => {
      if (!e.enemy) return;
      const b = boxes[j]!;
      const dx = Math.max(b.l - a.r, a.l - b.r);
      const dy = Math.max(b.t - a.b, a.t - b.b);
      const sep = Math.max(dx, dy); // > 0: the boxes do not meet
      if (sep > 0) {
        gap = Math.min(gap, sep);
        return;
      }
      // The boxes meet: the silhouette decides when the boss has a mask (sampled over the member's box).
      const mask = e.mask;
      if (!mask) {
        gap = Math.min(gap, sep);
        return;
      }
      let hits = 0;
      let n = 0;
      for (let x = 0; x < 6; x++)
        for (let y = 0; y < 8; y++) {
          const px = a.l + ((x + 0.5) / 6) * (a.r - a.l);
          const py = a.t + ((y + 0.5) / 8) * (a.b - a.t);
          n++;
          if (px < b.l || px > b.r || py < b.t || py > b.b) continue;
          if (mask.at((px - b.l) / Math.max(1e-6, b.r - b.l), (py - b.t) / Math.max(1e-6, b.b - b.t)) >= 0.35) hits++;
        }
      if (hits / n > REST_COVER_MAX) gap = Math.min(gap, sep);
      else gap = Math.min(gap, 1); // meeting only on the boss's empty sky or the member's margin: a hairline gap
    });
  });
  return gap;
}

/** Boxes moved by a static lens shift (CSS px). */
export function shifted(boxes: readonly Box[], lens: readonly [number, number]): Box[] {
  return boxes.map((b) => ({ l: b.l + lens[0], r: b.r + lens[0], t: b.t + lens[1], b: b.b + lens[1] }));
}

/** The most of an enemy's painted box FFX's Sensor card may cover under a colossus master (round 19, PR-0312: 34.5 % of Natus). */
export const SENSOR_COVER_MAX = 0.05;

/** The worst share of an enemy's box that `slab` covers. */
export function sensorCover(boxes: readonly Box[], figs: readonly Fig[], slab: Box | null): number {
  if (!slab) return 0;
  let worst = 0;
  figs.forEach((g, i) => {
    if (g.enemy) worst = Math.max(worst, coverShare(boxes[i]!, slab));
  });
  return worst;
}

/**
 * What a colossus master may not do (0 passes): leave a member inside a boss at rest (PR-0310) or put the Sensor card over
 * a boss part (PR-0312). In the units `fitClear`'s gate ranks by: a hair over zero for a touch, more for a deeper one.
 */
export function colossusExcess(boxes: readonly Box[], figs: readonly Fig[], slab: Box | null, W: number): number {
  const gap = restGap(boxes, figs);
  return (gap > 0 ? 0 : 0.01 - gap / W) + Math.max(0, sensorCover(boxes, figs, slab) - SENSOR_COVER_MAX);
}

/** The gate's two readings as a short note for the plan log (checks only). */
export function gateNote(boxes: readonly Box[], figs: readonly Fig[], slab: Box | null): string {
  return `gap${Math.round(restGap(boxes, figs))} sc${sensorCover(boxes, figs, slab).toFixed(2)}`;
}
