/**
 * RUN-IN's stand-off (r38-motion, FFX-2 only): where a girl stops when she runs in to a target. Pure geometry over what
 * the stage reports (`StageMotionPort`): no `three`, no DOM, no engine state, so a test can drive it and the browser
 * pass can measure it chapter by chapter.
 *
 * The sources fix only that a short-range dressphere closes the distance and a long-range one does not
 * (`research/ffx2-combat-core.md` section 1), so where she stops is a staging choice, and the staging of these
 * chapters makes it a hard one: the party stands in the lower left of the frame and the fiend is **4 to 17 world
 * units deeper** (Bahamut z -5.8 against the party's 1.45 to -1.5; Vegnagun's tail z -17), while on screen Paine
 * already stands against the fiend's near edge. A run straight at the fiend is a run into the picture: she shrinks,
 * goes up the frame and hides behind Rikku (found in the first browser pass). So the stop is chosen by **what the
 * picture shows**, from a small search over lanes between her place and the fiend's depth and over how far to the
 * side she runs, each scored on:
 *
 * - **travel**: how far she moves toward the fiend on screen (a run you can see: up to a quarter of the frame);
 * - **size**: she stays near her own size on screen (a short run into depth is a big shrink);
 * - **clear**: nobody nearer the camera covers her where she stops (her teammates are drawn over her otherwise);
 * - **never inside**: not in the fiend's depth slab and across its painted span (`{@link STAND_OFF}.slab`), a hard rule,
 *   and not buried in its picture on screen while her feet are above its bottom edge (a soft one: she may stand in
 *   front of its feet, never in its body);
 * - **in frame**.
 * The fiend's painted width is read from its painting, never from a table, so Bahamut's spread wings, Ixion's body and
 * Vegnagun's colossus each get their own answer, and so will a chapter added later.
 *
 * Round 21 (PR-0364, PR-0347; FFX-2 only): the truck follows half of the run, and Yuna, who stands at the left of the frame, left
 * it (Leblanc, 1600x900, Rikku's runs: Yuna 82 and 17 % in frame at the peak, her left edge at -33 and -157 px). A run's truck is
 * now fitted ({@link fitTruck}): the whole follow when every girl on her side stays where the frame has her, cut back in steps until
 * each is no more cropped at the frame's edges than she is at rest, and none at all when even the smallest follow would crop one.
 * The stop itself is scored against the truck it will run under, so a stop that needs a truck the frame cannot give is not chosen.
 */
import type { PaintedSpan, Rect, Spot } from './StageMotionPort.ts';

export type { Spot } from './StageMotionPort.ts';

/** World units unless it says px. `slab`: how close to the fiend's depth she may stand across its span (hard no). */
export const STAND_OFF = { gap: 0.15, front: 0.5, bodyHalf: 0.45, slab: 1.2, step: 0.35, maxRun: 6 } as const;

/** The camera follows part of the run sideways and lifts a little: a truck, not a pan (the wide FFX-2 frame holds). */
export const TRUCK = { follow: 0.5, lift: 0.1 } as const;

export interface RunWorld {
  /** Where she stands. */
  home: Spot;
  /** Her painted box (world), or null for a default width. */
  girl: PaintedSpan | null;
  /** The target's painted box (world). */
  target: PaintedSpan;
  /** Her painted box on screen with her feet at `at` and the camera slid by `truck`; null when unknown. */
  rectOf(at: Spot, truck: Spot): Rect | null;
  /** The target's painted box on screen with the camera slid by `truck`. */
  targetRect(truck: Spot): Rect | null;
  /** Every other figure: its depth, and its painted box on screen with the camera slid by `truck`. */
  others: ReadonlyArray<{ z: number; rect(truck: Spot): Rect | null }>;
  /**
   * The girls on her side other than her: figures the truck must keep in the frame (round 21, PR-0364). Each one's painted box on
   * screen with the camera slid by `truck`. Optional: with none given the truck is the whole follow, as it was before.
   */
  keep?: ReadonlyArray<{ rect(truck: Spot): Rect | null }>;
  /** The canvas, CSS px, and the part of it the window shows (`l`, `r`, `t`, `b`; the whole canvas when absent). */
  view: { w: number; h: number; l?: number; r?: number; t?: number; b?: number };
}

export interface RunPlan {
  spot: Spot;
  /** The truck she runs under: the camera slid this far while she is out. */
  truck: Spot;
  /** +1 she runs toward +x (the usual: party left, fiends right), -1 toward -x. */
  dir: 1 | -1;
  /** How far she runs along the ground, world units. */
  distance: number;
  /** For the browser pass: what the scoring saw at the stop. */
  why: { score: number; travelPx: number; scale: number; covered: number; inFrontOfFeet: boolean; buried: number };
}

const ZERO: Spot = { x: 0, y: 0, z: 0 };
const area = (r: Rect): number => Math.max(1, r.w * r.h);
/** The share of `a` that `b` covers, 0..1. */
function covers(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? (w * h) / area(a) : 0;
}

/** The share of the frame's width a girl on her side may be left from its edge when the truck is on: 1.5 %, never more cropped than at rest. */
export const KEEP_MARGIN = 0.015;

/** The part of the canvas the window shows, canvas px (the whole canvas when the view does not say). */
function frameOf(v: RunWorld['view']): { l: number; r: number; t: number; b: number } {
  return { l: v.l ?? 0, r: v.r ?? v.w, t: v.t ?? 0, b: v.b ?? v.h };
}

/** The fractions of the follow tried, whole first; 0 is the frame as it stands. */
const TRUCK_STEPS = [1, 0.8, 0.6, 0.4, 0.25, 0.12, 0] as const;

/**
 * The truck for a run to a stop `dx` along the ground: the whole follow ({@link TRUCK}) when every figure in `keep` stays where the
 * frame has it at rest, else the largest fraction of it (and of its lift) for which none is more cropped at the left, right or
 * bottom edge than at rest, else none. A figure already past an edge at rest is held to what it shows there, never made worse.
 * Pure on its input.
 */
export function fitTruck(w: RunWorld, dx: number): Spot {
  const full: Spot = { x: dx * TRUCK.follow, y: TRUCK.lift, z: 0 };
  const keep = w.keep ?? [];
  if (!keep.length) return full;
  const { l, r: right, b: bottom } = frameOf(w.view);
  const m = (right - l) * KEEP_MARGIN;
  const rest = keep.map((k) => k.rect(ZERO));
  const holds = (truck: Spot): boolean =>
    keep.every((k, i) => {
      const r0 = rest[i];
      const r = k.rect(truck);
      if (!r0 || !r) return true;
      return r.x >= Math.min(r0.x, l + m) - 0.5 && r.x + r.w <= Math.max(r0.x + r0.w, right - m) + 0.5 && r.y + r.h <= Math.max(r0.y + r0.h, bottom) + 0.5;
    });
  for (const k of TRUCK_STEPS) {
    const truck: Spot = { x: full.x * k, y: full.y * k, z: 0 };
    if (holds(truck)) return truck;
  }
  return ZERO;
}

/**
 * Plan the run of a figure to a target. Null when nothing can be planned (the figure or target is off the field):
 * the strike then plays as it does today.
 */
export function planRun(w: RunWorld): RunPlan | null {
  const { home, target } = w;
  const half = w.girl ? Math.min(1.3, Math.max(0.25, (w.girl.x1 - w.girl.x0) / 2)) : STAND_OFF.bodyHalf;
  const dir: 1 | -1 = (target.x0 + target.x1) / 2 >= home.x ? 1 : -1;
  const r0 = w.rectOf(home, ZERO);
  if (!r0) return null;
  const zFar = target.z + STAND_OFF.front;
  const reach = Math.min(STAND_OFF.maxRun, Math.abs((target.x0 + target.x1) / 2 - home.x));
  const sideways: number[] = [];
  for (let d = STAND_OFF.step; d <= reach + 1e-6; d += STAND_OFF.step) sideways.push(d);
  // The classic stand-off too: at the fiend's own depth, just outside its painted span.
  const edge = (dir > 0 ? target.x0 : target.x1) - dir * (half + STAND_OFF.gap);
  if (dir * (edge - home.x) > STAND_OFF.step) sideways.push(dir * (edge - home.x));
  const fr = frameOf(w.view);
  const frameX = Math.max((fr.r - fr.l) * 0.03, 20); // 3 % of the frame, never under 20 px: her strike is wider than her idle (a slice of a phone is 390 px)
  let best: RunPlan | null = null;
  for (const t of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    const z = home.z + (zFar - home.z) * t;
    for (const d of sideways) {
      const spot: Spot = { x: home.x + dir * d, y: home.y, z };
      // Hard: never in the fiend's depth slab and across its painted span.
      if (Math.abs(z - target.z) < STAND_OFF.slab && spot.x + half > target.x0 && spot.x - half < target.x1) continue;
      const truck = fitTruck(w, spot.x - home.x);
      const r = w.rectOf(spot, truck);
      const rStage = w.rectOf(spot, ZERO);
      if (!r || !rStage) continue;
      const travelPx = ((rStage.x + rStage.w / 2) - (r0.x + r0.w / 2)) * dir;
      const scale = rStage.h / r0.h;
      let covered = 0;
      for (const o of w.others) {
        const orect = o.z > z ? o.rect(truck) : null; // only what is nearer the camera can cover her
        if (orect) covered += covers(r, orect);
      }
      const tr = w.targetRect(truck);
      const inFrontOfFeet = !tr || r.y + r.h >= tr.y + tr.h - 4;
      const buried = tr && !inFrontOfFeet ? covers(r, tr) : 0;
      const inFrame = r.x >= fr.l + frameX && r.x + r.w <= fr.r - frameX && r.y >= fr.t && r.y + r.h <= fr.b;
      const score =
        Math.min(Math.max(travelPx, 0), w.view.w * 0.28) / (w.view.w * 0.28) +
        0.9 * Math.min(scale, 1) -
        3 * Math.min(1, covered) -
        1.2 * buried -
        (inFrame ? 0 : 1.5) -
        0.03 * Math.hypot(spot.x - home.x, spot.z - home.z);
      if (!best || score > best.why.score) {
        best = { spot, truck, dir, distance: Math.hypot(spot.x - home.x, spot.z - home.z), why: { score, travelPx, scale, covered, inFrontOfFeet, buried } };
      }
    }
  }
  return best;
}
