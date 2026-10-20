/** Types for `critic/runner/lib/continuity-rig.mjs` (a rigged figure's change of key, R57-002), so the unit tests can import it. */
import type { ContinuityConfig, FrameOfFig, SwapResult } from './continuity-pure.mjs';

export interface RigConfig {
  head: string[]; centroid: string[]; feet: string[]; headPart: string;
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
  ha: number | null; ma: number | null; bh: number | null; bw: number | null; pw: number; ph: number;
}
export interface RigSwapInfo {
  name: string | null; fromKey: string; toKey: string; settled: boolean; framesToSettle: number | null; headMetric: 'head' | 'mass' | null;
  moved?: { head: { dx: number; dy: number } | null; centroid: { dx: number; dy: number } | null }; cutJumpPx?: number;
}
export declare const RIG_DEFAULTS: Readonly<RigConfig>;
export declare function rigConfig(cfg: Partial<ContinuityConfig> | null | undefined): RigConfig | null;
export declare function rigProbeConfig(cfg: Partial<ContinuityConfig> | null | undefined): { head: string[]; centroid: string[]; feet: string[]; headPart: string } | null;
export declare function rigTrack(rg: RigRecord | null | undefined): { feet: [number, number] | null; head: [number, number] | null; centroid: [number, number] | null; cams: { head: [number, number] | null; feet: [number, number] | null; centroid: [number, number] | null } } | null;
export declare function idleBoxOf(list: FrameOfFig[], poses: { fig: number; pose: string }[], fi: number): number | null;
export declare function analyzeRigSwap(o: {
  frames: FrameOfFig[]; at: number; from: { pose: string; rig?: string }; to: { pose: string; rig?: string }; idleBh: number | null | undefined; k1600: number; camCut: boolean; cfg: ContinuityConfig;
}): SwapResult & { unmeasured?: string };
export declare function rigCoverage(o: { figs: { id: string; rig?: string }[]; poses: { fig: number; pose: string; rig?: string }[]; swaps: { fi: number; counted?: boolean; head?: unknown; feet?: unknown; rig?: { settled: boolean } }[] }): {
  figure: string; rig: string; keys: string[]; swaps: number; counted: number; settled: number; headMeasured: number; feetMeasured: number;
}[];
