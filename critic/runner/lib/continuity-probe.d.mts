/** Types for `critic/runner/lib/continuity-probe.mjs`, so the unit tests can import it. */
export interface ProbeConfig {
  ringScale: number; ringFrames: number; maxStrips: number; cellHeight: number; encodePerFrame: number; jpegQuality: number;
  recentFrames: number; jerkCandidatePx: number; jerkCandidateRatio: number; candidateWindow: number;
  beforeFrames: number; afterFrames: number; cutPx: number;
}
export interface ProbeEnv { window: unknown; document: unknown; performance: { now(): number } }
export interface ProbeFigure { id: string; side: string | null; kind: string | null; artId: string | null }
export interface ProbePose { fig: number; pose: string; url: string | null; w: number; h: number }
export interface ProbeSwap { n: number; t: number; i: number; from: number; to: number; a: number }
export interface ProbeFrame { n: number; t: number; f: { i: number; a: number; act: number; s: (number[] | 0)[]; g: [number, number] }[] }
export interface ProbeStripMeta { id: number; kind: 'swap' | 'jerk'; fi: number; n: number; first: number; crop: number[]; ring: number[]; cell: number[]; view: number[]; meta: unknown; todo: number; have: number; length: number }
export interface ProbeMeta {
  version: number; figs: ProbeFigure[]; poses: ProbePose[]; swaps: ProbeSwap[]; logEvents: { n: number; i: number; type?: string; [key: string]: unknown }[]; view: number[] | null; errors: string[];
  stats: { frames: number; battleFrames: number; battleSeconds: number; maxDtMs: number; slowFrames: number; fps: number | null; copyMsMean: number | null };
  strips: ProbeStripMeta[];
}
export interface Probe {
  records: ProbeFrame[]; swaps: ProbeSwap[]; strips: unknown[]; errors: string[];
  start(): boolean; finish(): Promise<void>; drain(max: number): { records: ProbeFrame[]; left: number }; meta(): ProbeMeta;
  stripFrames(ids: number[]): { id: number; frames: (string | null)[] }[];
}
export declare function createProbe(cfg: ProbeConfig, env: ProbeEnv): Probe;
