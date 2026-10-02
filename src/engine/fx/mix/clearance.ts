import { Vector3, type PerspectiveCamera } from 'three';
import { cameraAt, coverShare, figBox, type Box, type Fig, type Mask, type Pose } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's MENU CLEARANCE rule, ported from option C's prototype
 * (`fx/max/c/clearance.ts`, the refinement of 2026-10-02) and tightened to the judges' must-fix lists:
 *
 * - while a command menu is open, every party member is 97 % in view with at most 6 % under a panel,
 *   and every boss part is no worse than today's rig shows it (a part bigger than the frame, Vegnagun's
 *   Tail across D-228's view, cannot be whole in any approved view);
 * - **party-height floor**: no master makes the party smaller than today's rig minus 10 % (the judges:
 *   Ch I 285 -> 232 px, Evrae 244 -> 211, Natus smaller, Ch IV 170 -> 100 after a spherechange);
 * - **party overlap**: no party member hides more of another than today plus 3 % (at least 12 % is
 *   allowed), the nearer figure covering the farther (Evrae: Tidus must not hide Wakka);
 * - **boss cover**: no enemy's painted box covers more of a party member than today plus 2 % (at least
 *   8 %): Paine never stands inside Bahamut's silhouette.
 *
 * `fitClear` searches from the master toward today's rig (blends), standing back along the view line,
 * and over a static lens shift (capped at 8 % of the frame), for the pose NEAREST the master that passes;
 * when nothing passes, the floor and the overlaps weigh more than a few percent under a panel. Everything
 * is in FIELD space: CSS px of the canvas, with the part the viewport shows as `view` (the phone shows a
 * slice of a wider field). Pure apart from the `three` maths (the DOM is read by `hudPanels.ts`). Both games.
 */

export interface Field {
  W: number;
  H: number;
  /** The part of the field the viewport shows. */
  view: Box;
  /** HUD panels, in field px. */
  panels: Box[];
}

export interface Limit {
  inView: number;
  underHud: number;
}

export interface PartyRule {
  /** Today's party mean height minus 10 % (field px). */
  floorPx: number;
  /** The largest share of a member a nearer member may cover. */
  overlapMax: number;
  /** The largest share of a member an enemy's painted box may cover. */
  bossCoverMax: number;
}

export interface Clear {
  ok: boolean;
  worst: number;
  partyPx: number;
  overlap: number;
  bossCover: number;
  floorOk: boolean;
  overlapOk: boolean;
  figs: { id: string; enemy: boolean; inView: number; underHud: number }[];
}

const PARTY_LIMIT: Limit = { inView: 0.97, underHud: 0.06 };
const GX = 6;
const GY = 8;
/** The fit's estimate runs a little above what the live frame shows (the paintings turn to the camera). */
const FLOOR_MARGIN = 1.03;

/**
 * A figure's share in view and under a panel. With a silhouette `mask` (a boss), only its painted
 * pixels count: a serpent's bounding box is mostly sky, and the sky may sit under a card.
 */
export function measure(b: Box, f: Field, mask?: Mask): Limit {
  if (mask) {
    const NX = 10;
    const NY = 14;
    let solid = 0;
    let inside = 0;
    let under = 0;
    for (let i = 0; i < NX; i++)
      for (let j = 0; j < NY; j++) {
        const fx = (i + 0.5) / NX;
        const fy = (j + 0.5) / NY;
        if (mask.at(fx, fy) < 0.35) continue;
        solid++;
        const x = b.l + fx * (b.r - b.l);
        const y = b.t + fy * (b.b - b.t);
        if (x >= f.view.l && x <= f.view.r && y >= f.view.t && y <= f.view.b) inside++;
        if (f.panels.some((p) => x >= p.l && x <= p.r && y >= p.t && y <= p.b)) under++;
      }
    if (solid >= 6) return { inView: inside / solid, underHud: under / solid };
  }
  const area = Math.max(1, (b.r - b.l) * (b.b - b.t));
  const w = Math.max(0, Math.min(b.r, f.view.r) - Math.max(b.l, f.view.l));
  const h = Math.max(0, Math.min(b.b, f.view.b) - Math.max(b.t, f.view.t));
  let under = 0;
  for (let i = 0; i < GX; i++)
    for (let j = 0; j < GY; j++) {
      const x = b.l + ((i + 0.5) / GX) * (b.r - b.l);
      const y = b.t + ((j + 0.5) / GY) * (b.b - b.t);
      if (f.panels.some((p) => x >= p.l && x <= p.r && y >= p.t && y <= p.b)) under++;
    }
  return { inView: (w * h) / area, underHud: under / (GX * GY) };
}

/** The share of `a` (a party member's box) inside `e`'s painted silhouette (or its box, with no mask). */
function silhouetteCover(a: Box, e: Box, mask: Mask | undefined): number {
  if (!mask) return coverShare(a, e);
  let n = 0;
  let hit = 0;
  for (let i = 0; i < GX; i++)
    for (let j = 0; j < GY; j++) {
      n++;
      const x = a.l + ((i + 0.5) / GX) * (a.r - a.l);
      const y = a.t + ((j + 0.5) / GY) * (a.b - a.t);
      if (x < e.l || x > e.r || y < e.t || y > e.b) continue;
      if (mask.at((x - e.l) / Math.max(1e-6, e.r - e.l), (y - e.t) / Math.max(1e-6, e.b - e.t)) >= 0.35) hit++;
    }
  return hit / Math.max(1, n);
}

/** Every figure's screen box under a camera (field px). */
export function boxesOf(cam: PerspectiveCamera, figs: readonly Fig[], f: Field): Box[] {
  return figs.map((g) => figBox(g, cam, f.W, f.H));
}

/** The worst share of a party member a nearer member covers, from screen boxes and camera distances. */
export function overlapOf(boxes: readonly Box[], figs: readonly Fig[], camPos: Vector3): number {
  let worst = 0;
  const idx = figs.map((g, i) => (g.enemy ? -1 : i)).filter((i) => i >= 0);
  for (const i of idx)
    for (const j of idx) {
      if (i === j) continue;
      if (figs[j]!.feet.distanceTo(camPos) >= figs[i]!.feet.distanceTo(camPos)) continue;
      worst = Math.max(worst, coverShare(boxes[i]!, boxes[j]!));
    }
  return worst;
}

/** The worst share of a party member inside an enemy's painted silhouette (Paine inside Bahamut). */
export function bossCoverOf(boxes: readonly Box[], figs: readonly Fig[]): number {
  let worst = 0;
  figs.forEach((g, i) => {
    if (g.enemy) return;
    figs.forEach((e, j) => {
      if (e.enemy) worst = Math.max(worst, silhouetteCover(boxes[i]!, boxes[j]!, e.mask));
    });
  });
  return worst;
}

/** How boxes, plus a static lens shift (+ = content right / down), keep every figure clear. */
export function clearBoxes(boxes: readonly Box[], figs: readonly Fig[], camPos: Vector3, f: Field, lens: [number, number], limits: readonly (Limit | null)[], rule: PartyRule | null): Clear {
  let worst = 0;
  let px = 0;
  let n = 0;
  const rows: Clear['figs'] = [];
  figs.forEach((g, i) => {
    const b0 = boxes[i]!;
    const b = { l: b0.l + lens[0], r: b0.r + lens[0], t: b0.t + lens[1], b: b0.b + lens[1] };
    const m = measure(b, f, g.mask);
    const lim = (g.enemy ? limits[i] : null) ?? PARTY_LIMIT;
    worst += Math.max(0, lim.inView - m.inView) + Math.max(0, m.underHud - lim.underHud);
    rows.push({ id: g.id, enemy: g.enemy, inView: +m.inView.toFixed(2), underHud: +m.underHud.toFixed(2) });
    if (!g.enemy) {
      px += b.b - b.t;
      n++;
    }
  });
  const partyPx = px / Math.max(1, n);
  const overlap = overlapOf(boxes, figs, camPos);
  const bossCover = bossCoverOf(boxes, figs);
  const floorOk = !rule || partyPx >= rule.floorPx - 0.5;
  const overlapOk = !rule || (overlap <= rule.overlapMax + 1e-6 && bossCover <= rule.bossCoverMax + 1e-6);
  return { ok: worst <= 1e-6 && floorOk && overlapOk, worst, partyPx, overlap, bossCover, floorOk, overlapOk, figs: rows };
}

/**
 * Per-figure limits and the party rule, from today's figures under today's rig (the stage as it left
 * them, before any BOSS SCALE or spacing): a boss part no worse than today shows it; the party at least
 * today's height minus 10 %, hidden no more than today plus 3 % and covered by an enemy no more than
 * today plus 2 %. Aligned with `todayFigs`.
 */
export function limitsFor(todayFigs: readonly Fig[], today: Pose, f: Field): { limits: (Limit | null)[]; rule: PartyRule; todayPx: number } {
  const c = cameraAt(today, f.W / f.H);
  const tBoxes = boxesOf(c, todayFigs, f);
  const limits = todayFigs.map((g, i): Limit | null => {
    if (!g.enemy) return null;
    const t = measure(tBoxes[i]!, f, g.mask);
    return { inView: Math.min(0.97, t.inView - 0.02), underHud: Math.max(0.1, t.underHud + 0.02) };
  });
  let px = 0;
  let n = 0;
  todayFigs.forEach((g, i) => {
    if (g.enemy) return;
    px += tBoxes[i]!.b - tBoxes[i]!.t;
    n++;
  });
  const todayPx = px / Math.max(1, n);
  const rule: PartyRule = {
    floorPx: 0.9 * todayPx,
    overlapMax: Math.max(0.12, overlapOf(tBoxes, todayFigs, today.pos) + 0.03),
    bossCoverMax: Math.max(0.08, bossCoverOf(tBoxes, todayFigs) + 0.02),
  };
  return { limits, rule, todayPx };
}

export interface Fit {
  pose: Pose;
  lens: [number, number];
  clear: Clear;
  blend: number;
  back: number;
  score: number;
}

const BLENDS = [0, 0.25, 0.5, 0.75, 1];
const BACKS = [1, 1.04, 1.08, 1.16, 1.25, 1.35];

/**
 * The pose NEAREST the master that keeps every figure clear of the HUD, the party above its floor and
 * nobody hidden (or the least bad one): an approved composition changes only as much as the rule needs.
 */
export function fitClear(master: Pose, today: Pose, figs: readonly Fig[], f: Field, lensOn: boolean, limits: readonly (Limit | null)[], rule0: PartyRule): Fit {
  const steps = lensOn ? [-0.08, -0.04, 0, 0.04, 0.08] : [0];
  const stepsY = lensOn ? [-0.04, 0, 0.04] : [0];
  const rule: PartyRule = { ...rule0, floorPx: rule0.floorPx * FLOOR_MARGIN };
  let best: Fit | null = null;
  for (const bl of BLENDS) {
    const look = new Vector3().lerpVectors(master.look, today.look, bl);
    const pos0 = new Vector3().lerpVectors(master.pos, today.pos, bl);
    const fov = master.fov + (today.fov - master.fov) * bl;
    for (const k of BACKS) {
      const pose: Pose = { pos: look.clone().add(pos0.clone().sub(look).multiplyScalar(k)), look, fov };
      const boxes = boxesOf(cameraAt(pose, f.W / f.H), figs, f);
      for (const sx of steps)
        for (const sy of stepsY) {
          const lens: [number, number] = [Math.round(sx * f.W), Math.round(sy * f.H)];
          const cl = clearBoxes(boxes, figs, pose.pos, f, lens, limits, rule);
          const deficit = Math.max(0, rule.floorPx - cl.partyPx);
          const excess = Math.max(0, cl.overlap - rule.overlapMax) + Math.max(0, cl.bossCover - rule.bossCoverMax);
          // Passing poses: the least change from the master (stand-back, blend toward today, shift).
          // Failing ones: the floor and the overlaps weigh most, then the share under a panel.
          const score = cl.ok
            ? 1e6 - 300 * (k - 1) - 60 * bl - 0.15 * (Math.abs(lens[0]) + Math.abs(lens[1])) + 0.05 * cl.partyPx
            : -cl.worst * 1000 - deficit * 40 - excess * 3000 + bl;
          if (!best || score > best.score) best = { pose, lens, clear: cl, blend: bl, back: k, score };
        }
    }
  }
  return best!;
}
