/**
 * **The strike reaches its target** (r391-reach; both games, see `StrikeReach.ts` for who gets it; no `three`, no DOM).
 *
 * The house lunge is a fixed 1.4 world units (`BattlePresenterBeats.actionStart`), tuned against the stage's own formations. It stops short wherever
 * the picture puts the foe further than that away: in Chapter I Tidus ended 159 px from Seymour Flux, in Chapter VI a goon 300 px from Yuna, in
 * Chapter III release 39's own staging made the boss's move too long for it (`r39-looks` repaired that chapter alone). A strike that does not reach
 * its target is a defect, and a longer fixed lunge is the wrong repair: the figures stand 4 to 17 world units apart in depth, so a world unit of lunge
 * is a different number of pixels for every pair, and a lunge long enough for the farthest sends the nearest through its target. The relation that has
 * to hold is the one on the screen.
 *
 * So the strike is solved against the picture ({@link reachAlong}): the lunge, never less than today's and never more than {@link REACH_CAP}
 * further, at which the attacker's painted FRONT meets the target's painted near side with {@link CONTACT_PX} of painted overlap over the rows the two
 * share (`motion/Silhouette.ts`: the front is read row by row from the painting's alpha, the measure the critic's chamfer reads, not the boxes, which
 * overlap by 150 px while the pixels are still apart). Both are read through the camera the shot is settling on (`StageMotionPort.shape`).
 *
 * What it leaves alone, to the unit: a strike that already reaches; a target that shares no screen row with the attacker (above or below it: a lateral
 * lunge cannot touch it, and a longer one only runs under it); a box the stage cannot give. And it never runs the attacker into a figure standing in
 * its own depth lane ({@link LANE}) that today's lunge is clear of: no new collisions.
 *
 * Presentation only: no engine state, no RNG, no timing (the lunge keeps its 440 ms and its apex at 0.58). The distance beyond the house lunge rides an eased step
 * (`BattlePresenterActors.reachOffset`), so a long lunge does not jump its first frame; the house part is the old curve to the frame.
 */
import { frontClearance, nearClearance, type Shape } from './Silhouette.ts';

/** The most the solver may add to a lunge, world units (a target further than that is a design question, not a longer lunge). */
export const REACH_CAP = 3;

/** How deep the attacker's painted front goes into the target's at the apex, px on a 1600-wide frame (scaled with the frame): a visible touch, not a walk through. */
export const CONTACT_PX = 14;

/** The rows the two shapes must share for a strike to be worth solving, px on a 1600-wide frame: under it the target is above or below the attacker. */
export const MIN_SHARED_PX = 10;

/**
 * A target at most this far above or below the attacker's rows (px on a 1600-wide frame; no row in common, a little air between) is lined up with, not touched: a
 * lateral lunge ends beside it, as close as it can get. Further than that it is out of reach of a lateral lunge and the lunge is left alone.
 */
export const NEAR_PX = 40;

/**
 * An attacker whose painted box is wider than this share of the frame is a colossus (Sin's fins and face, Vegnagun's tail): it is the field, not a fighter that crosses it, and the
 * giant plane far behind the camera is the one thing the screen reading cannot place to within a hundred pixels. Its lunge is left alone.
 */
export const COLOSSUS = 0.5;

/** A figure within this many world units of the attacker's depth stands in its lane: two painted figures that close in depth intersect on the floor, not only on the screen. */
export const LANE = 0.5;

/** What {@link reachAlong} needs to see: the painted shapes on screen with the attacker carried `along`, and who stands in its way. */
export interface ReachWorld {
  /** +1: the attacker faces +x (the party's, an aeon's); -1: it faces -x (a fiend's). */
  dir: 1 | -1;
  /** The canvas width over 1600: the margins are in px on a 1600-wide frame. */
  scale: number;
  /** The attacker's painted shape with its feet carried `along` world units along its facing from where it stands. Null when it is not on the field. */
  attacker(along: number): Shape | null;
  /** The target's painted shape, where it stands now. */
  target(): Shape | null;
  /** The figures in the attacker's own lane (not the target): each one's painted shape, where it stands now (null: not shown). */
  lane?: ReadonlyArray<() => Shape | null>;
}

/**
 * How far the strike at `along` is from the end it aims at, px (+ short of it, 0 or less: there): the painted fronts {@link CONTACT_PX} into one another over the rows
 * the shapes share, else (the target a little above or below, {@link NEAR_PX}) lined up laterally; null when it cannot be read or the target is out of reach of a lateral lunge.
 */
function shortBy(w: ReachWorld, t: Shape, along: number): number | null {
  const a = w.attacker(along);
  if (!a) return null;
  const c = frontClearance(w.dir, a, t);
  if (c && Number.isFinite(c.gap) && c.shared >= MIN_SHARED_PX * w.scale) return c.gap + CONTACT_PX * w.scale;
  const n = nearClearance(w.dir, a, t, NEAR_PX * w.scale);
  return n && Number.isFinite(n.gap) ? n.gap : null;
}

/** The lateral painted clearance between the attacker at `along` and another figure (+ air, - overlap), null when they share no row. */
function gapAt(w: ReachWorld, t: Shape, along: number): number | null {
  const a = w.attacker(along);
  const c = a ? frontClearance(w.dir, a, t) : null;
  return c && Number.isFinite(c.gap) ? c.gap : null;
}

/**
 * The lunge, world units, at which the strike reaches its target ({@link shortBy}): `base` when it already does, when the target is out of reach of a lateral lunge or a
 * shape is unknown, else more, by at most {@link REACH_CAP}; and never into a figure of the lane that `base` is clear of. The screen gap is nearly linear in the lunge (a camera
 * with some yaw bends it a little), so a secant search with a few steps lands on it.
 */
export function reachAlong(base: number, w: ReachWorld): number {
  const t = w.target();
  const a0 = w.attacker(base);
  if (!t || !a0 || a0.rect.w > COLOSSUS * 1600 * w.scale) return base;
  const e0 = shortBy(w, t, base);
  if (e0 === null || !Number.isFinite(e0) || e0 <= 0.5) return base; // out of reach of a lateral lunge, or already there (half a pixel)
  const top = base + REACH_CAP;
  let l0 = base;
  let l1 = Math.min(top, base + 1);
  let f0 = e0;
  const e1 = shortBy(w, t, l1);
  if (e1 === null) return base;
  let f1 = e1;
  for (let i = 0; i < 6 && Math.abs(f1) > 0.5; i++) {
    const slope = (f1 - f0) / (l1 - l0);
    if (!(slope < 0)) return base; // a gap that does not close with the lunge (a box that went missing): leave today's
    const next = Math.min(top, Math.max(base, l1 - f1 / slope));
    if (next === l1) break; // at the cap (or at today's lunge): that is as far as it goes
    l0 = l1;
    f0 = f1;
    l1 = next;
    const f = shortBy(w, t, l1);
    if (f === null) return base;
    f1 = f;
  }
  let reach = Math.min(top, Math.max(base, l1));

  // The lane: a figure that today's lunge is clear of and the longer one would newly run into stops it at the figure's near side.
  for (const other of w.lane ?? []) {
    const o = other();
    if (!o) continue;
    const g0 = gapAt(w, o, base);
    if (g0 === null || g0 <= 0) continue; // not in its way, or today's lunge already overlaps it: not this solver's doing
    const gEnd = gapAt(w, o, reach);
    if (gEnd === null || gEnd > 0) continue;
    let lo = base;
    let hi = reach;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      const g = gapAt(w, o, mid);
      if (g !== null && g > 0) lo = mid;
      else hi = mid;
    }
    reach = lo;
  }
  return reach;
}
