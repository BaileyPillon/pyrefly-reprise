/** Types for `critic/runner/lib/continuity-pure.mjs`, so the unit tests can import it. */
export type Quad = number[]; // [x0,y0,x1,y1,x2,y2,x3,y3]: top-left, top-right, bottom-right, bottom-left, CSS px
export type Mat3 = number[]; // row-major 3x3
export interface Box { u0: number; t0: number; u1: number; t1: number }
export interface Mask { w: number; h: number; bits: Uint8Array | number[] }
export interface Anchors { head: Box | null; mass: number | null; stance: { u: number; t: number } | null; stanceSrc: string | null; mask: Mask | null; prone: boolean; stale?: boolean; subject?: string | null; pose?: string | null; url?: string }
export interface PlaneRec { k: number; fade: number; vis: boolean; q: number[] }
export interface FigRec { i: number; a: number; act: number; s: (number[] | 0)[]; g: [number, number] }
export interface FrameOfFig { n: number; t: number; fig: FigRec }

export interface ContinuityConfig {
  minBattleSeconds: number; minSwaps: number; minFps: number;
  size: { headTolerancePct: number; feetTolerancePx: number; headTolerancePctCoarse: number; feetTolerancePxCoarse: number };
  motion: {
    windowFrames: number; blendFadeMin: number; ghostFadeMin: number; ghostOutlineMin: number; ghostSeverityFail: number;
    snapOutlineMin: number; snapCentroidMinPx: number; snapsPerMinuteMax: number;
    jerkMinPx: number; jerkFloorPx: number; jerkRatio: number; jerkFailPx: number; localWindow: number; mergeFrames: number; ballisticChain: number; cutPx: number;
  };
  strips: { worstSwaps: number; worstJerks: number; worstGhosts: number; beforeFrames: number; afterFrames: number };
  [key: string]: unknown;
}

export interface SwapResult {
  camCut: boolean; costume?: boolean; sameArt?: boolean; range?: boolean;
  head: { fromPx: number; toPx: number; ratio: number | null; source: 'registration' | 'silhouette'; metric: 'head' | 'mass' } | null;
  feet: { dx: number; dy: number; px: number; standing: boolean; source: string } | null;
  outline: { iou: number; centroidShiftPx: number; areaRatio: number | null } | null;
  ghost: { frames: number; ms: number; peak: number; severity: number; worstFrame: number | null };
  blendFrames: number; snap: boolean; hardCut: boolean; failHead: boolean; failFeet: boolean; unmeasured?: string;
}
export interface SwapRow extends Partial<SwapResult> {
  id?: number; figure?: string; fromPose?: string; toPose?: string; n?: number; counted?: boolean; camCut?: boolean; notShowing?: boolean; snap?: boolean; hardCut?: boolean;
  ghost: SwapResult['ghost'];
}
export interface Jerk { n: number; t: number; px: number; localPx: number; ratio: number; part: 'feet' | 'head'; dx: number; dy: number; atSwap?: boolean; id?: number }

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
export declare function figureTrack(fig: FigRec, anchors: (Anchors | null)[]): { feet: [number, number] | null; head: [number, number] | null } | null;
export declare function analyzeSwap(o: { frames: FrameOfFig[]; at?: number; swap: { from: number; to: number }; anchors: (Anchors | null)[]; k1600: number; camCut: boolean; cfg: ContinuityConfig }): SwapResult;
export declare function detectJerks(track: { n: number; t: number; feet: [number, number] | null; head: [number, number] | null; cam: [number, number] }[], k1600: number, cfg: ContinuityConfig): Jerk[];
export declare function median(a: number[]): number;
export interface Summary {
  battleSeconds: number; swaps: number; counted: number; excludedByCut: number; excludedNotShowing: number; swapsPerMinute: number | null;
  size: { judged?: number; costumeSwaps?: number; sameArtSwaps?: number; costumeWorstHeadPct?: number; costumeWorstFeetPx?: number; headMeasured: number; headRegistration: number; headSilhouette: number; headUnmeasured: number; maxHeadJumpPct: number; maxHeadJumpPctRegistration: number; headOverTolerance: number; feetMeasured: number; maxFeetShiftPx: number; feetOverTolerance: number };
  motion: { snaps: number; snapsPerMinute: number | null; hardCuts: number; hardCutsPerMinute: number | null; snapsByToPose: Record<string, number>; lowestIou: number; maxCentroidShiftPx: number; ghostSwaps: number; ghostFrames: number; worstGhostSeverity: number; ghostOverFail: number; jerks: number; jerksMidMove: number; worstJerkPx: number; jerksOverFail: number };
  checks: Record<'CHK-026' | 'CHK-027', { result: 'PASS' | 'FAIL' | 'UNVERIFIED'; reasons: string[]; note?: string }>;
}
export declare function summarize(o: { swaps: SwapRow[]; jerks: Jerk[]; battleSeconds: number; cfg: ContinuityConfig }): Summary;
export declare function verdicts(s: Pick<Summary, 'battleSeconds' | 'counted' | 'size' | 'motion'>, cfg: ContinuityConfig, run?: { fps?: number | null; error?: string | null }): Summary['checks'];
export declare function swapBadness(s: SwapRow, cfg: ContinuityConfig): number;
export declare function distinctFirst<T>(list: T[], key: (x: T) => string, n: number): T[];
export declare function worstSwaps(swaps: SwapRow[], n: number, cfg: ContinuityConfig): SwapRow[];
