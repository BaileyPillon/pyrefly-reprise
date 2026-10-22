/**
 * THE SMEAR PLANNER (conference demo, motion pass, lane "core", step 2; `motion/SmearSwitch.ts` has the switch and the whole picture; pure: no `three`, no DOM, no clock; both games).
 *
 * Today every pose change is the same short dissolve of two paintings (`PoseBlend`, retuned from the pair by `DemoBlend.demoBlend`). Two paintings that share little of their outline (the party's
 * poses are different DRAWINGS: of 70 non-idle poses over the six demo figures only 3 reach an IoU of 0.50 with the idle, `docs/handoff/pose-continuity.md`) show two figures side by side in the middle
 * of any dissolve. Bailey's pick, 2026-10-22: "Cut on the motion peak with a smear": a BIG change is a CUT inside a 1 to 2 frame smear, on the fastest frame of the move; a small one keeps the quick blend.
 *
 * - **Big** ({@link isBigChange}): the outlines overlap by less than {@link BIG_OVERLAP} (the same reading the continuity harness takes of a swap, `PoseAlign.footprintOverlap`), or the two heads are
 *   {@link BIG_ANCHOR} of the figure's height or more apart. An unknown overlap with no anchor is NOT big (there is nothing to say it is, so the plain blend stays).
 * - **On the fastest frame** ({@link MIN_SPEED}): the figure must be MOVING when the swap happens (the strike's `travelPeak` and `settlePeak` marks, the recoil's first frame). A change at rest
 *   (the menu's idle to ready, the return to idle once home) keeps its blend: a cut with a streak on a standing figure has nothing to hide behind.
 * - **The cut** ({@link CUT}): the old painting stays whole until the middle of the window and the new one is whole from there, so no frame shows both. The window is {@link CUT_MS_MIN} to
 *   {@link CUT_MS_MAX} ms (grown to {@link FRAMES_MIN} frames of the display actually running, so it is never a single frame at 60 Hz or below): 2 to 4 frames at 120 Hz, 2 at 60.
 * - **The smear** ({@link smearAmount}): the render (a shader block, `PaintedShader.ts`) gets an amount that is {@link smearAmount}(progress) over the window, peaking AT the cut: the old painting
 *   leaves streaked and the new one arrives streaked. {@link LENGTH} says how long the streak is at full amount, as a share of the plane's width, per style.
 * - **The flash** ({@link flashInto}): a light flash (1 to 2 frames) on a cut INTO an action painting; not on the struck figure's hurt swap (it has the hit flash already: two on one big plane
 *   is a white blob, `docs/handoff/demo-motion.md` item 4), not on a return to idle.
 *
 * Every number is `[ours]`: the sources give no smear length, window or threshold (they give frame counts, not drawings).
 */
import type { BlendCurves } from '../PoseBlend.ts';
import { difference } from './DemoBlend.ts';
import { clamp01 } from './DemoMotion.ts';

/** A pair whose outlines overlap by less than this is a big change. (0.6 is where the plain blend reads clean; 0.15 where the pair shares nothing: `DemoBlend`.) */
export const BIG_OVERLAP = 0.5;
/** Two heads this far apart, as a share of the figure's height, are a big change whatever the outlines say. */
export const BIG_ANCHOR = 0.12;
/** The figure must move at least this fast, body heights a second, for a swap to be cut. A lunge peaks at 4 to 8, a recoil at 1 to 1.5. */
export const MIN_SPEED = 0.45;
/** The speed at which the smear is at full strength, body heights a second. */
export const REF_SPEED = 3;
/** The window of a cut, real ms: 24 for a pair that nearly agrees, 34 for one that shares nothing. */
export const CUT_MS_MIN = 24;
export const CUT_MS_MAX = 34;
/** The window is never fewer than this many frames of the display running (so the old painting is smeared for at least a frame, even at 60 Hz). */
export const FRAMES_MIN = 2.25;
/** The longest a window grows to on a slow display, ms. */
export const WINDOW_CAP_MS = 70;
/** Where in the window the cut falls (0 to 1). */
export const CUT_AT = 0.5;
/** The streak's length at full amount, a share of the plane's width: soft blur and painted streak. */
export const LENGTH: Readonly<Record<'blur' | 'paint', number>> = { blur: 0.14, paint: 0.34 };
/** The light flash: peak (a fraction of a full flash) and the paintings it is for. */
export const FLASH_PEAK = 0.28;
const FLASH_INTO = /^(attack|cast|item|special|summon|telegraph|overdrive|od|od-.+)$/;
/** Paintings the smear leaves alone: the knock-out collapse has its own cut (step 3), a twirl is the spherechange's own sequence. */
const SKIP = /^(ko|dead|twirl-.+)$/;

/** The cut: the old painting whole until {@link CUT_AT}, the new one whole from it. Handed to `PoseBlend.retune`. */
export const CUT: BlendCurves = {
  out: (u) => (u < CUT_AT ? 1 : 0),
  inn: (u) => (u < CUT_AT ? 0 : 1),
};

/** How much smear (0 to 1) `u` (0 to 1) of the way through the window: nothing at either end, full at the cut. */
export function smearAmount(u: number): number {
  const x = clamp01(u);
  return Math.pow(Math.sin(Math.PI * x), 0.8);
}

/** True when a cut INTO the painting `to` gets the light flash. */
export function flashInto(to: string): boolean {
  return FLASH_INTO.test(to);
}

/** Is this pair a big change? An unknown overlap with no anchor reads as small. */
export function isBigChange(overlap: number | null, anchorDistance: number | null): boolean {
  const lowOverlap = overlap !== null && Number.isFinite(overlap) && overlap < BIG_OVERLAP;
  const farHeads = anchorDistance !== null && Number.isFinite(anchorDistance) && anchorDistance >= BIG_ANCHOR;
  return lowOverlap || farHeads;
}

export interface SmearInput {
  /** The painting going out and the one coming in (the names the actor asked for). */
  from: string;
  to: string;
  /** The two paintings' outline overlap as placed, or null. */
  overlap: number | null;
  /** How far apart the two heads are, a share of the figure's height, or null. */
  anchorDistance: number | null;
  /** How fast the figure is moving (or about to move, a recoil's first frame), body heights a second. */
  speed: number;
  /** The recent frame time of the display, ms (0 or less: unknown). */
  frameMs: number;
  /** The style the page asked for. */
  style: 'paint' | 'blur';
}

export interface SmearPlan {
  /** The length of the window (the pose blend's length), real ms. */
  cutMs: number;
  style: 'paint' | 'blur';
  /** The smear's strength, 0 to 1: scales the amount over the window. */
  strength: number;
  /** The streak's length at amount 1 and strength 1, a share of the plane's width. */
  length: number;
  /** Does the cut carry the light flash? */
  flash: boolean;
  /** The pair's difference (0 agrees, 1 shares nothing), for the log. */
  difference: number;
}

/** The plan for one pose change, or null when the plain blend stays (small change, no motion, a painting the smear leaves alone). */
export function smearPlan(i: SmearInput): SmearPlan | null {
  if (SKIP.test(i.to) || SKIP.test(i.from)) return null;
  if (!isBigChange(i.overlap, i.anchorDistance)) return null;
  if (!(i.speed >= MIN_SPEED)) return null;
  const q = difference(i.overlap);
  const base = CUT_MS_MIN + (CUT_MS_MAX - CUT_MS_MIN) * q;
  const frames = i.frameMs > 0 && Number.isFinite(i.frameMs) ? FRAMES_MIN * i.frameMs : 0;
  const cutMs = Math.round(Math.min(WINDOW_CAP_MS, Math.max(base, frames)));
  const strength = clamp01((0.55 + 0.45 * q) * Math.min(1, Math.max(0.35, i.speed / REF_SPEED)));
  return { cutMs, style: i.style, strength, length: LENGTH[i.style], flash: flashInto(i.to), difference: q };
}

// ------------------------------------------------------------------ rigs

/** A rig key change that swaps this share of the figure's mesh area to another image or more (`RigFade.swapShare`) is a big change. */
export const RIG_BIG_SHARE = 0.5;

export interface RigSmearInput {
  /** The key going out and the one coming in. */
  from: string;
  to: string;
  /** The share (0 to 1) of the figure's mesh area whose image the move changes. */
  share: number;
  frameMs: number;
  style: 'paint' | 'blur';
}

/**
 * The plan for a rig's key change (the bosses): a rig has no silhouettes to overlap, so the share of the figure whose image flips stands in for the difference, and there is no speed gate (the
 * bones are moving fastest at the half-way point, which is where the flip falls). Null for a small change, a knock-out, or a spherechange.
 */
export function rigSmearPlan(i: RigSmearInput): SmearPlan | null {
  if (SKIP.test(i.to) || SKIP.test(i.from)) return null;
  if (!(i.share >= RIG_BIG_SHARE)) return null;
  const q = clamp01((i.share - RIG_BIG_SHARE) / (1 - RIG_BIG_SHARE));
  const base = CUT_MS_MIN + (CUT_MS_MAX - CUT_MS_MIN) * q;
  const frames = i.frameMs > 0 && Number.isFinite(i.frameMs) ? FRAMES_MIN * i.frameMs : 0;
  const cutMs = Math.round(Math.min(WINDOW_CAP_MS, Math.max(base, frames)));
  return { cutMs, style: i.style, strength: clamp01(0.6 + 0.4 * q), length: LENGTH[i.style], flash: flashInto(i.to), difference: q };
}
