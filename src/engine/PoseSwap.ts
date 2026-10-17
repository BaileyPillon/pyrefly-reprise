/**
 * POSE SWAP SMOOTHING (W5 of the pose-continuity fix; both games; behind a switch, `today` until the driver flips it).
 *
 * Bailey, 2026-10-16: "pose continuity is the strongest recurring issue we need a permanent fix for this please." The size half (W3, the ruler) is data; this
 * is the MOTION half. What a pose swap is today: a cross-dissolve of two flat planes whose heads are, at the median, 13 px apart and, at the worst, 310 px, so
 * the middle of every 120 ms blend is two figures trading places, and the continuity harness (CHK-027) reads the fade-weighted head moving 0.26 of that
 * separation in one frame. Four changes, all behind one switch, `?swap=today|smooth` (default {@link POSE_SWAP_DEFAULT}, `today`):
 *
 * 1. **Aligned dissolve** for a pair of paintings that overlap by {@link ALIGN_MIN_OVERLAP} or more (`PoseAlign.ts`): during the blend the outgoing plane drifts
 *    toward a meeting point while it fades out, and the incoming plane starts there and settles into its own place, so the two heads coincide at the middle
 *    of the blend. Only the position is eased, along x (the feet stay on the floor line; the head height is the pose's own); size is already locked by the head lock.
 * 2. **Held-frame cut** for a pair that overlaps by less: the painting changes in ONE step on a frame where the game already holds still ({@link figureHolding}:
 *    a hit-stop, the apex of a strike waiting for the blow, the menu open on a figure at rest), never with two paintings at once. With no hold near, the aligned
 *    dissolve.
 * 3. **The lunge's first frame** on the velocity-continuous curve (`BattlePresenterActors.reachOffset`), not `attackOffset`'s cubic-out, whose first moving frame
 *    covers 28 percent of the distance from a standing start (angle 2, section 4.2: detector steps 0, 0, 0, 64, 73, 41 px). Total distance and timing are the same.
 * 4. **The frame clock** clamps one frame's time at {@link MAX_DELTA_SMOOTH} (1/40 s) instead of {@link MAX_DELTA_TODAY} (1/20 s): a hitch is a slow frame, not a skipped one.
 *
 * The policy is a pure function ({@link swapPolicy}) of the pair's overlap and anchor distance (and whether a hold is near); `PaintedActor` applies it. Pure: no
 * `three`, no DOM, no clock (hard rule 1).
 */

export type PoseSwapMode = 'today' | 'smooth';

/** What a page plays with no `?swap=`. The driver flips this one constant (or the page's address does) once Bailey has seen the clips. */
export const POSE_SWAP_DEFAULT: PoseSwapMode = 'today';

let mode: PoseSwapMode | null = null;

/** `?swap=smooth` turns the four changes on for the page, `?swap=today` off whatever the default is. Read once, like the other URL switches' first look. */
export function poseSwapMode(): PoseSwapMode {
  if (mode === null) {
    const value = new URLSearchParams(globalThis.location?.search ?? '').get('swap');
    mode = value === 'smooth' || value === 'today' ? value : POSE_SWAP_DEFAULT;
  }
  return mode;
}

/** Tests and `window.__pyrefly.swap(...)`: force the mode (`null` reads the address again). */
export function setPoseSwapMode(value: PoseSwapMode | null): void {
  mode = value;
}

/** True when the four changes are on. */
export const poseSwapSmooth = (): boolean => poseSwapMode() === 'smooth';

/** The four changes, by name: `align` (the aligned dissolve), `cut` (the held-frame cut), `lunge` (the first frame) and `clock` (the 1/40 s clamp). */
export type PoseSwapPart = 'align' | 'cut' | 'lunge' | 'clock' | 'cutany';
const ALL_PARTS: readonly PoseSwapPart[] = ['align', 'cut', 'lunge', 'clock', 'cutany'];
/** What `smooth` means without `?swapparts=`. `cutany` (the cut with no limit on how far the heads are apart: the first version, measured and kept as an ablation) is not in it. */
const DEFAULT_PARTS: readonly PoseSwapPart[] = ['align', 'cut', 'lunge', 'clock'];

let parts: ReadonlySet<PoseSwapPart> | null = null;

/**
 * `?swapparts=lunge,clock` (captures and ablations only): under `smooth`, only the named changes run. Without it all four do, which is what `smooth` means; the parameter
 * exists so a measurement can say which of the four moves which reading. Read once.
 */
function swapParts(): ReadonlySet<PoseSwapPart> {
  if (parts === null) {
    const value = new URLSearchParams(globalThis.location?.search ?? '').get('swapparts');
    const named = value === null ? DEFAULT_PARTS : (value.split(',').map((x) => x.trim()).filter((x): x is PoseSwapPart => (ALL_PARTS as readonly string[]).includes(x)));
    parts = new Set(named);
  }
  return parts;
}

/** Tests: force the parts (`null` reads the address again). */
export function setPoseSwapParts(value: readonly PoseSwapPart[] | null): void {
  parts = value === null ? null : new Set(value);
}

/** True when `smooth` is on and this one of its four changes is in it. */
export const poseSwapPart = (p: PoseSwapPart): boolean => poseSwapMode() === 'smooth' && swapParts().has(p);

// ------------------------------------------------------------------ the frame clock (change 4)

/** The longest frame the animation clock advances today: 50 ms (3 frames at 60 Hz) in one drawn frame. */
export const MAX_DELTA_TODAY = 1 / 20;
/** The longest frame under `smooth`: 25 ms, so a hitch advances every blend, lunge and recoil by at most 1.5 frames of a 60 Hz game. */
export const MAX_DELTA_SMOOTH = 1 / 40;

/** The per-frame clamp of `App.tick` for a mode (the current one by default). */
export function frameClockMax(m: PoseSwapMode = poseSwapMode()): number {
  return m === 'smooth' && swapParts().has('clock') ? MAX_DELTA_SMOOTH : MAX_DELTA_TODAY;
}

// ------------------------------------------------------------------ the pair policy (changes 1 and 2)

/**
 * Two paintings that overlap by this much (intersection over union of their silhouettes as drawn) read as one figure changing pose when they are dissolved
 * with their heads together: the aligned dissolve. Under it they read as two figures, and the dissolve is a cut where the game holds still.
 * `[ours]`: the number is the driver's (the swap options page, Part B), not a game fact.
 */
export const ALIGN_MIN_OVERLAP = 0.3;

/**
 * The anchors of a pair must be at least this far apart (a share of the figure's height) for an alignment to be worth the slide it makes: under it the two
 * heads are already one head to the eye, and the plain dissolve moves the fade-weighted head by less than a harness jerk (0.26 of the separation per frame).
 * 0.10 of a 330 px FFX figure is 33 px, so the weighted step the alignment saves is under 9 px and the slide it costs is under 17 px: not worth it.
 */
export const ALIGN_MIN_DISTANCE = 0.1;

/**
 * A cut moves the head the whole distance between the two paintings' anchors in ONE frame, where a dissolve spreads it over seven (the fade-weighted head moves 0.26 of
 * the distance in its steepest frame). So a cut is a jump of that many pixels, and the continuity harness (CHK-027) reads it as a jerk at the swap, over its 24 px line
 * when the heads are 0.07 of the figure's height apart (23 px of a 330 px figure) and over the 40 px failing line at 0.12. The first version cut at any distance and read
 * 37 swap jerks of 40 px or more in 180 s of Sinspawn Gui against today's 19 (the pairs: Tidus attack to follow 118 px, ready to attack 81 px). A cut is therefore made only
 * where the heads are this close (as a share of the figure's height); a pair that overlaps by under 0.30 with its heads further apart takes the aligned dissolve.
 */
export const CUT_MAX_DISTANCE = 0.07;

export type SwapPolicy = 'dissolve' | 'aligned' | 'cut';

/** What the policy needs to know about a pair of paintings changing places. */
export interface SwapPairFacts {
  /** Intersection over union of the two silhouettes as drawn, 0 to 1; null when either has no silhouette (no pixels read). */
  readonly overlap: number | null;
  /** How far apart the two paintings' anchors (the heads, or the stand-in) are along x, as a share of the figure's height; null when either has no anchor. */
  readonly anchorDistance: number | null;
  /** The game holds still now ({@link figureHolding}). */
  readonly hold: boolean;
  /** Another blend is running (two paintings are already on screen): a cut would drop both. */
  readonly blending: boolean;
}

/**
 * How a pair of paintings changes places under `smooth`:
 *
 * - `cut`: overlap under {@link ALIGN_MIN_OVERLAP}, the heads no further apart than {@link CUT_MAX_DISTANCE}, the game holds still and nothing is blending: one step, never two paintings at once;
 * - `aligned`: the heads can be brought together (they are {@link ALIGN_MIN_DISTANCE} apart or more) and either the pair overlaps well or no hold is near;
 * - `dissolve`: everything else, the plain dissolve of today (unknown anchors, heads already together).
 *
 * An unknown overlap is never cut (a pair nobody measured is not a pair that reads as two people).
 */
export function swapPolicy(f: SwapPairFacts, allow: { align: boolean; cut: boolean; cutMaxDistance?: number } = { align: true, cut: true }): SwapPolicy {
  const canAlign = f.anchorDistance !== null && Number.isFinite(f.anchorDistance) && f.anchorDistance >= ALIGN_MIN_DISTANCE;
  const known = f.overlap !== null && Number.isFinite(f.overlap);
  const maxStep = allow.cutMaxDistance ?? CUT_MAX_DISTANCE;
  const stepOk = maxStep === Infinity || (f.anchorDistance !== null && Number.isFinite(f.anchorDistance) && f.anchorDistance <= maxStep);
  if (allow.cut && known && (f.overlap as number) < ALIGN_MIN_OVERLAP && f.hold && !f.blending && stepOk) return 'cut';
  return allow.align && canAlign ? 'aligned' : 'dissolve';
}

// ------------------------------------------------------------------ what the policy did

/** How many pose changes took each road under `smooth` since the page loaded, and which point anchored the planes of the aligned ones (read by captures: `__pyrefly.swapStats()`). */
export interface PoseSwapStats {
  dissolve: number;
  aligned: number;
  cut: number;
  /** Planes of an aligned or cut pair whose anchor was the registered head, the silhouette's centroid, or unknown (no silhouette). */
  anchorHead: number;
  anchorCentroid: number;
  anchorNone: number;
}

const stats: PoseSwapStats = { dissolve: 0, aligned: 0, cut: 0, anchorHead: 0, anchorCentroid: 0, anchorNone: 0 };

/** One pose change that ran the policy: who, which paintings, what the policy saw and what it chose (kept, the last {@link LOG_CAP}, for captures). */
export interface PoseSwapRecord {
  actor: string;
  from: string;
  to: string;
  overlap: number | null;
  distance: number | null;
  hold: boolean;
  blending: boolean;
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

// ------------------------------------------------------------------ holding still

/** A figure that moves no faster than this (world units a second; 0.8 is about 2 px a frame at the battle camera) is holding still. The apex of a strike creeps at 0.6. */
export const STILL_SPEED = 0.8;

/**
 * Whether the game is holding still at this frame, for {@link swapPolicy}: the field clock is frozen (`dt` 0 while the real frame `realDt` runs: a hit-stop, a
 * paused field) or the figure's own offset (lunge, recoil, shake, hop, lean) moved no faster than {@link STILL_SPEED} (the menu open on a figure at rest, the
 * apex of a strike waiting for the blow, the 180 ms follow hold).
 *
 * @param dt the field's seconds this frame, @param realDt the unscaled seconds, @param moved how far the figure's offset moved this frame (world units)
 */
export function figureHolding(dt: number, realDt: number, moved: number): boolean {
  if (!(realDt > 0)) return false;
  if (!(dt > 0)) return true;
  return moved / dt <= STILL_SPEED;
}
