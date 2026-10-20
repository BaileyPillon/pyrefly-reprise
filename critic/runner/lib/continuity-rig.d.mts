/** Types for `critic/runner/lib/continuity-rig.mjs` (a rigged figure's change of key, R57-002), so the unit tests can import it. */
import type { ContinuityConfig, FrameOfFig, SwapResult } from './continuity-pure.mjs';

export interface RigConfig {
  head: string[]; centroid: string[]; feet: string[]; headPart: string;
  /** parts, other than the head part, that carry a head when a key brings them in (Lulu's front-view upper body), and the share of the idle plane's area at which one counts as drawn (R59, decision 146) */
  headVariants: string[]; variantMinArea: number;
  /** a change of key that has not settled in this many frames of the change is judged on what was seen */
  settleFrames: number;
  /** keys whose feet leave the ground by design (jump, overdrive): their feet are shown, not judged */
  notPlanted: string[];
}
/** One frame of a rigged figure (continuity-rig-probe.mjs): points in CSS px on the canvas, `*u` the same in the idle plane's own coordinates (u across, t down, 0..1). */
export interface RigRecord {
  b: 0 | 1; h: [number, number] | null; f: [number, number] | null; c: [number, number] | null;
  /** how far the camera alone moved the head, the feet and the centroid since the last frame (x, y each), present only while the camera moved */
  cs?: number[];
  hu: [number, number] | null; fu: [number, number] | null; cu: [number, number] | null;
  ha: number | null; ma: number | null; /** the head variant part drawn at a real size in this key (R59) */ hv?: string; bh: number | null; bw: number | null; pw: number; ph: number;
}
export interface RigSwapInfo {
  name: string | null; fromKey: string; toKey: string; settled: boolean; framesToSettle: number | null; headMetric: 'head' | 'mass' | 'variant' | null;
  moved?: { head: { dx: number; dy: number } | null; centroid: { dx: number; dy: number } | null }; cutJumpPx?: number;
}
export declare const RIG_DEFAULTS: Readonly<RigConfig>;
export declare function rigConfig(cfg: Partial<ContinuityConfig> | null | undefined): RigConfig | null;
export declare function rigProbeConfig(cfg: Partial<ContinuityConfig> | null | undefined): { head: string[]; centroid: string[]; feet: string[]; headPart: string; headVariants: string[]; variantMinArea: number } | null;
export declare function rigTrack(rg: RigRecord | null | undefined): { feet: [number, number] | null; head: [number, number] | null; centroid: [number, number] | null; cams: { head: [number, number] | null; feet: [number, number] | null; centroid: [number, number] | null } } | null;
export declare function idleBoxOf(list: FrameOfFig[], poses: { fig: number; pose: string }[], fi: number): number | null;
export declare function analyzeRigSwap(o: {
  frames: FrameOfFig[]; at: number; from: { pose: string; rig?: string }; to: { pose: string; rig?: string }; idleBh: number | null | undefined; k1600: number; camCut: boolean; cfg: ContinuityConfig;
  /** the head the player really sees in a key over the idle's (`realHeadOfRegistration`), read only for a change of key that swaps the head part (R59, decision 146) */
  realHead?: ((pose: string) => number | null) | null;
}): SwapResult & { unmeasured?: string };
export declare function rigCoverage(o: { figs: { id: string; rig?: string }[]; poses: { fig: number; pose: string; rig?: string }[]; swaps: { fi: number; counted?: boolean; head?: unknown; feet?: unknown; rig?: { settled: boolean } }[] }): {
  figure: string; rig: string; keys: string[]; swaps: number; counted: number; settled: number; headMeasured: number; feetMeasured: number;
}[];
