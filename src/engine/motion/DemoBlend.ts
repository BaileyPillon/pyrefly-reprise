/**
 * DEMO MOTION, PART 1: THE POSE BLEND CHOSEN FROM THE PAIR (`?motion=demo`; `DemoMotion.ts` has the switch and the whole picture; both games).
 *
 * Today every pose change is the same 120 ms (party) or 140 ms (foes) plain dissolve of two paintings (`PoseBlend.QUAD_IN_OUT`). Two paintings that overlap well dissolve cleanly; two that barely
 * do (Tidus attack to follow reads an outline overlap of 0.14, Wakka idle to hurt 0.03) show two figures side by side at the middle of it, which is the double image the continuity harness
 * counts in 94 percent of swaps (`docs/handoff/critic-continuity.md`), and the quad curve's middle is twice as fast as its average, so the fade-weighted head moves 0.258 of the gap in one frame.
 *
 * **The blend is chosen from the pair.** `difference` (0 for an overlap of 0.6 or more, 1 for 0.15 or less, 0.5 when the overlap is unknown) sets
 *
 * - the length: 110 ms (party) or 120 ms (foes) for a pair that agrees, up to 140 or 150 ms for one that does not (a longer blend smooths the head further but keeps the double image on screen longer; at 60 fps and the
 *   capped cross, 140 ms reads the head at 0.258 of the gap a frame where today's 120 ms quad dissolve reads 0.252, shows the lesser painting above the harness's 0.15 for 46 ms where today's shows it for 54, and its
 *   peak is 0.33 where today's is 0.43); a KO, an Overdrive or a victory swap is 40 ms longer (200 at most);
 * - the shape, {@link cappedCross}: the outgoing painting leaves as `(1 - s) ** k`, the incoming one comes in as `s` (`s` is `u` eased, {@link easeMap}), with `k = 1 + difference` (1 is a plain blend, 2 is the capped
 *   cross). At `k = 2` the two paintings never both show more than 0.382 (`1 - s = s * s` at its crossing), so a double image of two different outlines is at most 0.382 of the figure for a few frames, under the harness's
 *   0.4, whatever the frame rate; the new painting comes in promptly (it is the action) and the old one is gone first. The body thins to 0.76 at the crossing for a pair that shares nothing, and not at all for one that shares
 *   everything. A pair that agrees (k = 1) reads the head at 0.215 a frame at 120 ms against 0.252. (Numbers, and what the harness read of both chapters: `docs/handoff/demo-motion.md`.)
 *
 * Pure: no `three`, no DOM, no clock. `PaintedActor.beginBlend` reads the overlap of the two planes it has just placed (the same reading the aligned dissolve takes, `PoseAlign.footprintOverlap`)
 * and hands it in; `PoseBlend.retune` puts the result on the blend it has just started. Every number is `[ours]`.
 */
import type { BlendCurves } from '../PoseBlend.ts';
import { clamp01 } from './DemoMotion.ts';

/** An outline overlap at or above this is a pair that agrees: its blend is the short plain one. */
export const AGREE_OVERLAP = 0.6;
/** An overlap at or below this is a pair that does not: its blend is the long capped one. */
export const DISAGREE_OVERLAP = 0.15;
/** The length of a pair that agrees, ms, per side; a pair that does not adds {@link LENGTH_SPREAD}. */
export const AGREE_MS = { party: 110, foe: 120 } as const;
export const LENGTH_SPREAD = { party: 30, foe: 30 } as const;
/** A KO, an Overdrive, a special or a victory swap runs this much longer, and never past {@link LONG_MS_MAX}. */
export const LONG_EXTRA_MS = 40;
export const LONG_MS_MAX = 200;
/** The longest a blend of an ordinary swap may be (the brief's 160). */
export const BLEND_MS_MAX = 160;
/** The pose names whose swaps run longer. */
export const LONG_POSES: ReadonlySet<string> = new Set(['ko', 'dead', 'overdrive', 'od', 'special', 'victory']);

/** 0 (the pair agrees) to 1 (the pair does not) from the outlines' overlap (intersection over union); unknown reads as in between. */
export function difference(overlap: number | null): number {
  if (overlap === null || !Number.isFinite(overlap)) return 0.5;
  return clamp01((AGREE_OVERLAP - overlap) / (AGREE_OVERLAP - DISAGREE_OVERLAP));
}

/**
 * The time map of the blend: a cosine ease, `(1 - cos(pi u)) / 2`. A purely linear blend starts at once (the first frame of 120 ms is 14 percent of the way: 0.087 of the gap against 0.018 for today's quad ease-in), and the
 * harness reads that first step as a jerk on a figure whose two paintings' stance readings are far apart (Bahamut idle to attack: two 100 px feet "jerks" in the first run of this switch, none today; a mix of linear and
 * smoothstep still read 0.05 of the gap in the first frame). The cosine starts as softly as the quad does (curvature 4.9 against 4; 0.022 of the gap in the first frame) with a gentler middle (peak slope 1.57 against 2). The
 * paintings' shares are the same bijection of time, so the cap below does not move.
 */
export const easeMap = (u: number): number => (1 - Math.cos(Math.PI * clamp01(u))) / 2;

/** Where `(1 - u) ** k = u`: the most either painting shows when both do (0.5 at k = 1, 0.382 at k = 2). Bisection; pure. */
export function cappedPeak(k: number): number {
  const e = Math.max(1, k);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (Math.pow(1 - mid, e) > mid) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The capped cross of exponent `k` (1 to 2): the outgoing painting's share is `(1 - s) ** k`, the incoming one's `s`, with `s = easeMap(u)`, and `cap` is where they meet. `PoseBlend` reads `cap` for a blend that
 * starts with both paintings already up (a request that turns a running blend round), and holds the lesser one under it.
 */
export function cappedCross(k: number): BlendCurves {
  const e = Math.min(2, Math.max(1, k));
  return { out: (u) => Math.pow(1 - easeMap(u), e), inn: (u) => easeMap(u), cap: cappedPeak(e) };
}

export interface DemoBlendInput {
  side: 'party' | 'foe';
  /** The painting the figure is going to (`ko`, `attack`, ...). */
  to: string;
  /** The outline overlap of the two paintings as placed, or null when a silhouette is missing. */
  overlap: number | null;
}

export interface DemoBlend {
  /** Real milliseconds. */
  ms: number;
  shape: BlendCurves;
  /** The pair's difference, 0 to 1 (for the notes the tests and the harness keep). */
  difference: number;
  /** The exponent of the capped cross. */
  k: number;
}

/** The blend of one pose change: its length and its shape. */
export function demoBlend(i: DemoBlendInput): DemoBlend {
  const q = difference(i.overlap);
  const base = AGREE_MS[i.side] + LENGTH_SPREAD[i.side] * q;
  const long = LONG_POSES.has(i.to);
  const ms = Math.round(long ? Math.min(LONG_MS_MAX, base + LONG_EXTRA_MS) : Math.min(BLEND_MS_MAX, base));
  const k = 1 + q;
  return { ms, shape: cappedCross(k), difference: q, k };
}

/** The lengths a KO cross (`KoFall.KO_CROSS_MS`, 75 ms) and a revive's take under the demo: slightly longer, still inside the 300 ms landing squash and the 520 ms revive wait. */
export const DEMO_KO_CROSS_MS = 100;
