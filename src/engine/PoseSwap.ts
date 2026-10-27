/**
 * POSE MOTION (W5 of the pose-continuity fix; both games). Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for
 * this please." The size half (W3, the ruler) is data; this is the MOTION half. What a pose swap is: a cross-dissolve of two flat planes whose heads are, at the
 * median, 13 px apart and, at the worst, 310 px, so the middle of every 120 ms blend is two figures trading places.
 *
 * Two things are ON for everyone (the driver's delegated pick after the measurement, 2026-10-17), and a third is OFF unless the address asks:
 *
 * - **The lunge's first frame** (ON): the house part of the step rides `BattlePresenterActors.reachOffset`, the velocity-continuous curve, not `attackOffset`'s
 *   cubic-out, whose first moving frame covers 28 percent of the distance from a standing start (angle 2, section 4.2: detector steps 0, 0, 0, 64, 73, 41 px).
 *   Total distance and beats are the same.
 * - **The animation clock** (ON): one frame advances what is only drawn (the battle field's tweens, lunges, blends and recoils, the camera, the numerals, the beats) at most
 *   {@link MAX_DELTA_SMOOTH} (1/40 s), not {@link MAX_DELTA_CLASSIC} (1/20 s): a hitch is a slow frame, not a skipped one. Every TIMER keeps the 1/20 s clamp: see
 *   {@link battleFrameClocks}.
 *
 * `?motion=classic` restores both of those as they were (comparison and safety); `?motion=smooth` is the default spelled out.
 * `classic` also brings back, in FFX-2, the ATB turn start as it was (ready, idle, ready: `KeyPoses.readyCarriesIntoWindUp` answers false), so the post-flicker hold can be compared side by side.
 *
 * - **The aligned dissolve** (OFF): `?swap=aligned` only (`PoseAlign.ts`). During the blend the outgoing plane drifts toward a meeting point while it fades out and
 *   the incoming plane starts there and settles home, so the two heads coincide at the middle of the blend; sideways only. It was measured better on swap jerks and
 *   double images and worse on CHK-026's registered feet in every chapter (the bodies slide apart for 120 ms), so it stays an option, not the default.
 *
 * The held-frame cut of the first build was removed: it fired 0 times in 180 s of any of four fights once it was limited to heads that do not jump, and when it
 * was not limited it was the worst part (37 swap jerks of 40 px or more in Sinspawn Gui against 19 today, and snaps).
 *
 * The aligned policy is a pure function ({@link swapPolicy}) of the pair's overlap and anchor distance; `PaintedActor` applies it. Pure: no `three`, no DOM,
 * no clock (hard rule 1).
 */

// ------------------------------------------------------------------ the motion switch: lunge and frame clock

/** `smooth` (the default): the lunge on `reachOffset` and the frame clock at 1/40 s. `classic`: today's lunge and the 1/20 s clock. */
export type MotionMode = 'smooth' | 'classic';

/** What a page plays with no `?motion=`. */
export const MOTION_DEFAULT: MotionMode = 'smooth';

let motion: MotionMode | null = null;

/** `?motion=classic` restores today's lunge and clock for the page; `?motion=smooth` is the default. Read once, like the other URL switches' first look. */
export function motionMode(): MotionMode {
  if (motion === null) {
    const value = new URLSearchParams(globalThis.location?.search ?? '').get('motion');
    motion = value === 'smooth' || value === 'classic' ? value : MOTION_DEFAULT;
  }
  return motion;
}

/** Tests and `window.__pyrefly.motionMode(...)`: force the mode (`null` reads the address again). */
export function setMotionMode(value: MotionMode | null): void {
  motion = value;
}

/** True when the lunge's first frame and the 1/40 s clock are on (the default). */
export const motionSmooth = (): boolean => motionMode() === 'smooth';

/** The longest frame `App.tick` hands any screen, and the longest the animation clock advances in `classic`: 50 ms (3 frames at 60 Hz) in one drawn frame. */
export const MAX_DELTA_CLASSIC = 1 / 20;
/** The longest frame of the battle field's animation clock by default: 25 ms, so a hitch advances every blend, lunge and recoil by at most 1.5 frames of a 60 Hz game. */
export const MAX_DELTA_SMOOTH = 1 / 40;

/** The per-frame clamp of the battle field's ANIMATION clock for a mode (the current one by default). `App.tick` keeps its own 1/20 s for everything. */
export const frameClockMax = (m: MotionMode = motionMode()): number => (m === 'smooth' ? MAX_DELTA_SMOOTH : MAX_DELTA_CLASSIC);

/**
 * The two clocks of one battle frame. The driver's rule for the 1/40 s clamp (2026-10-17): it may apply to the presentation clock alone, and every timer keeps the
 * 1/20 s clamp, so a slow phone never counts a stall, a play-time total or a settle window slower than real time because of it.
 *
 * - `timer`: the frame as `App.tick` clamps it, at {@link MAX_DELTA_CLASSIC} in BOTH modes (the stall watchdog, the play-time total, the formation settle window).
 *   The battle engines' own clocks are not on the frame clock at all (the ATB pump and the CTB steps read the wall clock, `BattlePresenterActive.ts`), so the ATB
 *   cannot run slow because of a slow frame, under either mode.
 * - `animation`: the same frame clamped at {@link frameClockMax} (1/40 s by default, 1/20 s under `?motion=classic`): everything that is only drawn, the tweens,
 *   lunges, pose blends and recoils, the camera moves, the damage numerals, the cut-ins, and the mid-battle beats' budgets, which are spent out of the SAME clock as the
 *   camera moves they wait for (`BattleScreenCutscenes.ts` "Two clocks").
 */
export interface BattleFrameClocks {
  readonly timer: number;
  readonly animation: number;
}

/** Split one frame into its timer clock and its animation clock (pure). */
export function battleFrameClocks(dt: number, m: MotionMode = motionMode()): BattleFrameClocks {
  const timer = Math.min(dt, MAX_DELTA_CLASSIC);
  return { timer, animation: Math.min(timer, frameClockMax(m)) };
}

// ------------------------------------------------------------------ the aligned dissolve switch

let aligned: boolean | null = null;

/** True when the aligned dissolve is on: `?swap=aligned` only. Off by default. Read once. */
export function alignedSwapOn(): boolean {
  if (aligned === null) aligned = new URLSearchParams(globalThis.location?.search ?? '').get('swap') === 'aligned';
  return aligned;
}

/** Tests and `window.__pyrefly.swap(...)`: force the aligned dissolve on or off (`null` reads the address again). */
export function setAlignedSwap(value: boolean | null): void {
  aligned = value;
}

// ------------------------------------------------------------------ the pair policy of the aligned dissolve

/**
 * The anchors of a pair must be at least this far apart (a share of the figure's height) for an alignment to be worth the slide it makes: under it the two
 * heads are already one head to the eye, and the plain dissolve moves the fade-weighted head by less than a harness jerk (0.26 of the separation per frame).
 * 0.10 of a 330 px FFX figure is 33 px, so the weighted step the alignment saves is under 9 px and the slide it costs is under 17 px: not worth it.
 * `[ours]`: the number is the driver's (the swap options page, Part B), not a game fact.
 */
export const ALIGN_MIN_DISTANCE = 0.1;

export type SwapPolicy = 'dissolve' | 'aligned';

/**
 * An alignment brings the two HEADS together; it moves the two BODIES with them. Where the heads are far apart but the bodies already overlap well (Tidus idle to hurt: the
 * silhouettes overlap by 0.46, the heads are 66 px apart), the slide pulls the bodies apart (0.10) and the double image the harness reads rises from 0.23 to 0.39. So the
 * aligned dissolve is used only where it does not take the paintings out of each other: the overlap with the anchors at the meeting point must be at least the overlap where they
 * stand.
 */
export const ALIGN_MIN_GAIN = 0;

/** What the policy needs to know about a pair of paintings changing places. */
export interface SwapPairFacts {
  /** Intersection over union of the two silhouettes as drawn, 0 to 1; null when either has no silhouette (no pixels read). */
  readonly overlap: number | null;
  /** How far apart the two paintings' anchors (the heads, or the stand-in) are along x, as a share of the figure's height; null when either has no anchor. */
  readonly anchorDistance: number | null;
  /** The same overlap with both anchors moved to the meeting point (what the middle of an aligned dissolve shows); null when it cannot be told. */
  readonly overlapAligned?: number | null;
}

/**
 * How a pair of paintings changes places under `?swap=aligned`:
 *
 * - `aligned`: the heads can be brought together (they are {@link ALIGN_MIN_DISTANCE} apart or more) and the alignment does not take the paintings out of each other ({@link ALIGN_MIN_GAIN});
 * - `dissolve`: everything else, the plain dissolve (unknown anchors, heads already together, bodies already on each other).
 */
export function swapPolicy(f: SwapPairFacts): SwapPolicy {
  const known = f.overlap !== null && Number.isFinite(f.overlap);
  const gain = known && f.overlapAligned != null && Number.isFinite(f.overlapAligned) ? f.overlapAligned - (f.overlap as number) : null;
  const canAlign = f.anchorDistance !== null && Number.isFinite(f.anchorDistance) && f.anchorDistance >= ALIGN_MIN_DISTANCE && (gain === null || gain >= ALIGN_MIN_GAIN);
  return canAlign ? 'aligned' : 'dissolve';
}

// ------------------------------------------------------------------ what the policy did

/** How many pose changes took each road under `?swap=aligned` since the page loaded, and which point anchored the planes (read by captures: `__pyrefly.swapStats()`). */
export interface PoseSwapStats {
  dissolve: number;
  aligned: number;
  /** Planes of a pair whose anchor was the registered head, the silhouette's centroid, or unknown (no silhouette). */
  anchorHead: number;
  anchorCentroid: number;
  anchorNone: number;
}

const stats: PoseSwapStats = { dissolve: 0, aligned: 0, anchorHead: 0, anchorCentroid: 0, anchorNone: 0 };

/** One pose change that ran the policy: who, which paintings, what the policy saw and what it chose (kept, the last {@link LOG_CAP}, for captures). */
export interface PoseSwapRecord {
  actor: string;
  from: string;
  to: string;
  overlap: number | null;
  overlapAligned: number | null;
  distance: number | null;
  policy: SwapPolicy;
  /** The anchor of the outgoing and of the incoming plane. */
  anchors: [AnchorKind, AnchorKind];
}
export type AnchorKind = 'head' | 'centroid' | null;

const LOG_CAP = 800;
const log: PoseSwapRecord[] = [];

/** The recorded pose changes, oldest first (a copy); `reset` empties the record. */
export function poseSwapLog(reset = false): PoseSwapRecord[] {
  const out = log.slice();
  if (reset) log.length = 0;
  return out;
}

/** Count one pose change that ran the policy, with the source of each plane's anchor (null: none), and record it. */
export function notePoseSwap(policy: SwapPolicy, sources: readonly (('head' | 'centroid') | null)[], record?: Omit<PoseSwapRecord, 'policy' | 'anchors'>): void {
  if (record) {
    if (log.length >= LOG_CAP) log.shift();
    log.push({ ...record, policy, anchors: [sources[0] ?? null, sources[1] ?? null] });
  }
  stats[policy]++;
  for (const s of sources) {
    if (s === 'head') stats.anchorHead++;
    else if (s === 'centroid') stats.anchorCentroid++;
    else stats.anchorNone++;
  }
}

/** A copy of the counters. */
export const poseSwapStats = (): PoseSwapStats => ({ ...stats });

/** Tests and captures: zero the counters. */
export function resetPoseSwapStats(): void {
  for (const k of Object.keys(stats) as (keyof PoseSwapStats)[]) stats[k] = 0;
}
