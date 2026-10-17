/** Types for `critic/runner/lib/continuity-pure.mjs`, so the unit tests can import it. */
import type { FeetSilhouetteReading, HeightReading, RealHeadReading } from './continuity-readings.mjs';
export type Quad = number[]; // [x0,y0,x1,y1,x2,y2,x3,y3]: top-left, top-right, bottom-right, bottom-left, CSS px
export type Mat3 = number[]; // row-major 3x3
export interface Box { u0: number; t0: number; u1: number; t1: number }
export interface Mask { w: number; h: number; bits: Uint8Array | number[] }
export interface Anchors {
  head: Box | null; mass: number | null; centroid?: { u: number; t: number } | null; stance: { u: number; t: number } | null; stanceSrc: string | null; mask: Mask | null; prone: boolean; stale?: boolean; subject?: string | null; pose?: string | null; url?: string;
  /** Pose continuity (W4): the pixels' own readings, whatever the registration says. */
  stanceSil?: { u: number; t: number } | null;
  /** The silhouette's top, ground line, left and right, normalised (continuity-silhouette.mjs `estimateExtent`). */
  extent?: { top: number; base: number; left: number; right: number } | null;
  /** The subject's kind and the pose's class (tools/posescale/pose-kinds.mjs): which band the pose is judged in. */
  kind?: string | null; cls?: string | null;
  /** The record's hold: the head the player really sees over the idle's (the registered box is virtual), and the stature it was held to. */
  heldHeadRatio?: number | null; recStature?: number | null;
  /** The painting's sha256 as the registration record carries it, and whether a fresh record backs this painting at all. */
  sha?: string | null; registered?: boolean;
  /** The waiver (docs/target/pose-waivers.json) that lets this painting stand outside its band, or null. */
  waiver?: { reason: string; words: string; date: string | null; legacy: boolean; shaChecked: boolean } | null;
}
/** `cs` (probe version 2): where the camera's change alone moved each corner since the last frame, present only while the camera moved. */
export interface PlaneRec { k: number; fade: number; vis: boolean; q: number[]; cs: number[] | null }
export interface FigRec { i: number; a: number; act: number; s: (number[] | 0)[]; g: [number, number] }
export interface FrameOfFig { n: number; t: number; fig: FigRec }

export interface ContinuityConfig {
  minBattleSeconds: number; minSwaps: number; minFps: number;
  size: { headTolerancePct: number; feetTolerancePx: number; headTolerancePctCoarse: number; feetTolerancePxCoarse: number; feetSilhouettePct?: number };
  motion: {
    windowFrames: number; blendFadeMin: number; ghostFadeMin: number; ghostOutlineMin: number; ghostSeverityFail: number;
    snapOutlineMin: number; snapCentroidMinPx: number; snapsPerMinuteMax: number;
    jerkMinPx: number; jerkFloorPx: number; jerkRatio: number; jerkFailPx: number; localWindow: number; mergeFrames: number; ballisticChain: number; cutPx: number;
    /** W4: a frame longer than this (ms) is a long frame, the clock's hitch and not the design (default 34). */
    longFrameMs?: number;
  };
  /** W4: the readings from the pixels; `false` switches one off. */
  readings?: { height?: boolean; feetSilhouette?: boolean; realHead?: boolean };
  /** W4, the CHK-027 split: `dashesFail` gates the mid-move dashes as every jerk was gated; `teleportPx` is the mid-move step that is gated either way. A cfg without this block gates every jerk. */
  jerks?: { dashesFail?: boolean; teleportPx?: number };
  /** W4: `honour: false` judges every pose; `path` is the ledger. */
  waivers?: { honour?: boolean; path?: string };
  strips: { worstSwaps: number; worstJerks: number; worstGhosts: number; beforeFrames: number; afterFrames: number };
  /** r40 instrument edit (a): 'centroid' (default) follows a figure with no registration by its silhouette's centroid, 'feet' gives the earlier reading back. */
  tracking?: { unregistered?: 'centroid' | 'feet'; /** W4: 'point' (default) subtracts the camera's shift of each tracked point, 'origin' the figure origin's (the earlier reading). */ camera?: 'point' | 'origin' };
  /** r40 instrument edit (b): `twirl: false` gives the earlier reading of a twirl's cuts back; `gapFrames` is how far apart two steps of one change may be. */
  staged?: { twirl?: boolean; gapFrames?: number };
  /** r43 (FOC40-02): `excuse: true` tags a jerk whose step happened under the Save Sphere's wash as covered and leaves it out of the numbers (it ships false until the owner's yes: the definition of a jerk is his); `minCover` is how much of the picture the veil must hide; a null `selector` stops the probe reading the wash. */
  wash?: { excuse?: boolean; minCover?: number; selector?: string | null };
  [key: string]: unknown;
}

/** A step of the spherechange's twirl (continuity-staged.mjs): `edge` says whether it is between two keys, into the first or out of the last; `seq`, `step` and `of` are set once the run's steps are grouped. */
export interface StagedStep { kind: 'twirl'; edge: 'between-keys' | 'enters' | 'leaves'; from: string | null; to: string | null; seq?: number; step?: number; of?: number }
/** The longest stretch in which both paintings of a swap showed and neither fade moved (continuity-held.mjs). */
export interface Held { frames: number; ms: number; from: number | null }
export interface SwapResult {
  camCut: boolean; costume?: boolean; sameArt?: boolean; range?: boolean; staged: StagedStep | null; held: Held; snapStaged: boolean;
  /** `label`: 'control' for a registered head (held to the idle's by the head lock, so it agrees with itself), 'mass' for the silhouette's. */
  head: { fromPx: number; toPx: number; ratio: number | null; source: 'registration' | 'silhouette'; metric: 'head' | 'mass'; label?: 'control' | 'mass' } | null;
  feet: { dx: number; dy: number; px: number; standing: boolean; source: string } | null;
  outline: { iou: number; centroidShiftPx: number; areaRatio: number | null } | null;
  ghost: { frames: number; ms: number; peak: number; severity: number; worstFrame: number | null };
  blendFrames: number; snap: boolean; hardCut: boolean; failHead: boolean; failFeet: boolean; unmeasured?: string;
  /** Pose continuity (W4): the readings from the pixels and whether each fails CHK-026 (never for a waived pose). */
  height?: HeightReading | null; feetSil?: FeetSilhouetteReading | null; headReal?: RealHeadReading | null;
  failHeight?: boolean; failFeetSil?: boolean; failRealHead?: boolean; unregistered?: boolean;
}
export interface SwapRow extends Partial<SwapResult> {
  id?: number; figure?: string; fromPose?: string; toPose?: string; n?: number; counted?: boolean; camCut?: boolean; notShowing?: boolean; snap?: boolean; hardCut?: boolean;
  ghost: SwapResult['ghost'];
}
export interface Jerk { n: number; t: number; px: number; localPx: number; ratio: number; part: 'feet' | 'head' | 'centroid'; dx: number; dy: number; atSwap?: boolean; /** W4: 'swap' (gated), 'dash' (reported) or 'teleport' (a mid-move step no lunge could make: gated). */ kind?: 'swap' | 'dash' | 'teleport'; /** W4: the frame time of the frame the step fell on (ms), and whether it was a long one. */ frameMs?: number | null; longFrame?: boolean; id?: number; staged?: { kind: 'twirl'; seq?: number }; /** r43: what was over the step (the wash element's opacity and the cover it gave), when a wash was up on either frame. */ wash?: { opacity: number; cover: number; frames: [number, number] }; /** r43: the step happened under the wash and the policy excuses it. */ covered?: boolean }

export declare const FRAME_MS: number;
export declare function unitSquareToQuad(q: ArrayLike<number>): Mat3;
export declare function applyH(H: Mat3, u: number, t: number): [number, number];
export declare function invertH(H: Mat3): Mat3 | null;
export declare function polygonArea(pts: number[][]): number;
export declare function scale1600(canvasCssWidth: number): number;
export declare function headSizePx(H: Mat3, head: Box): number;
export declare function headCentre(H: Mat3, head: Box): [number, number];
export declare function feetPoint(H: Mat3, stance: { u: number; t: number }): [number, number];
export declare function outlineJump(maskA: Mask, HA: Mat3, maskB: Mask, HB: Mat3, quadA: Quad, quadB: Quad, cells?: number): { iou: number; centroidShift: number; areaA: number; areaB: number } | null;
export declare function planeOf(raw: unknown): PlaneRec | null;
export declare function planesOf(fig: FigRec): { cur: PlaneRec | null; other: PlaneRec | null };
export interface TrackCams { feet: [number, number] | null; head: [number, number] | null; centroid: [number, number] | null }
export declare function figureTrack(fig: FigRec, anchors: (Anchors | null)[], byCentroid?: boolean): { feet: [number, number] | null; head: [number, number] | null; centroid: [number, number] | null; /** the camera-only shift of each tracked point (probe version 2) */ cams: TrackCams } | null;
export declare function analyzeSwap(o: { frames: FrameOfFig[]; at?: number; swap: { from: number; to: number }; anchors: (Anchors | null)[]; k1600: number; camCut: boolean; cfg: ContinuityConfig; names?: { from?: string; to?: string } }): SwapResult;
export declare function detectJerks(track: { n: number; t: number; feet: [number, number] | null; head: [number, number] | null; centroid?: [number, number] | null; cam: [number, number]; cams?: TrackCams | null }[], k1600: number, cfg: ContinuityConfig): Jerk[];
export declare function median(a: number[]): number;
export interface Summary {
  battleSeconds: number; swaps: number; counted: number; excludedByCut: number; excludedNotShowing: number; swapsPerMinute: number | null;
  size: {
    judged?: number; costumeSwaps?: number; sameArtSwaps?: number; costumeWorstHeadPct?: number; costumeWorstFeetPx?: number; headMeasured: number; headRegistration: number; headSilhouette: number; headUnmeasured: number; maxHeadJumpPct: number; maxHeadJumpPctRegistration: number; headOverTolerance: number; feetMeasured: number; maxFeetShiftPx: number; feetOverTolerance: number;
    /** W4: height (stature; a KO's length is report-only), the silhouette's own feet, the real head across a hold, unregistered paintings. */
    heightMeasured: number; heightOverBand: number; heightWaived: number; minStature: number | null; maxStature: number | null; koLengthMeasured: number; minKoLength: number | null; koLengthReported: number;
    feetSilMeasured: number; feetSilOver: number; feetSilWaived: number; maxFeetSilPx: number; holdSwaps: number; worstRealHeadPct: number; realHeadOutsideBand: number; realHeadWaived: number; unregisteredSwaps: number;
  };
  motion: { snaps: number; snapsPerMinute: number | null; hardCuts: number; hardCutsPerMinute: number | null; snapsByToPose: Record<string, number>; lowestIou: number; maxCentroidShiftPx: number; ghostSwaps: number; ghostFrames: number; worstGhostSeverity: number; ghostOverFail: number; jerks: number; jerksMidMove: number; worstJerkPx: number; jerksOverFail: number; heldSwaps: number; longestHeldFrames: number; stagedChanges: number; stagedSteps: number; stagedSnapsExcused: number; jerksAtStaged: number; jerksCovered?: number; worstCoveredJerkPx?: number;
    /** W4, the CHK-027 split: jerks at a swap (gated), mid-move teleports (gated), mid-move dashes (reported), and the same by the frame they fell on. */
    swapJerks: number; swapJerksWorstPx: number; swapJerksOverFail: number; teleports: number; teleportsWorstPx: number; dashes: number; dashesWorstPx: number; dashesOverFail: number;
    jerksLongFrame: number; swapJerksLongFrame: number; swapJerksSteadyOverFail: number;
  };
  /** W4: how the frame clock ran (percentiles of the time between drawn frames), shown beside the jerks and never gated. */
  frameTime: FrameTime | null;
  checks: Record<'CHK-026' | 'CHK-027', { result: 'PASS' | 'FAIL' | 'UNVERIFIED'; reasons: string[]; note?: string }>;
}
export interface FrameTime { frames: number; p50Ms: number; p90Ms: number; p99Ms: number; maxMs: number; longFrames: number; longFramePct: number; longMs: number }
export declare function frameTimeOf(dts: number[], longMs?: number): FrameTime | null;
export declare function summarize(o: { swaps: SwapRow[]; jerks: Jerk[]; coveredJerks?: Jerk[]; battleSeconds: number; cfg: ContinuityConfig; frameTime?: FrameTime | null }): Summary;
export declare function verdicts(s: Pick<Summary, 'battleSeconds' | 'counted' | 'size' | 'motion'>, cfg: ContinuityConfig, run?: { fps?: number | null; error?: string | null }): Summary['checks'];
export declare function swapBadness(s: SwapRow, cfg: ContinuityConfig): number;
export declare function continuityReportLine(s: { battleSeconds: number; chapters?: { fps?: number | null; dedicated?: boolean | null }[]; checks: Record<string, { result: string; reasons?: string[] }>; motion?: { jerksCovered?: number; worstCoveredJerkPx?: number } }): string;
export declare function distinctFirst<T>(list: T[], key: (x: T) => string, n: number): T[];
export declare function worstSwaps(swaps: SwapRow[], n: number, cfg: ContinuityConfig): SwapRow[];
