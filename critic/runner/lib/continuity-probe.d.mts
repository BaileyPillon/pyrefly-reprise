/** Types for `critic/runner/lib/continuity-probe.mjs`, so the unit tests can import it. */
export interface ProbeConfig {
  ringScale: number; ringFrames: number; maxStrips: number; cellHeight: number; encodePerFrame: number; jpegQuality: number;
  recentFrames: number; jerkCandidatePx: number; jerkCandidateRatio: number; candidateWindow: number;
  beforeFrames: number; afterFrames: number; cutPx: number;
  /** r43: the element whose opacity is recorded as `w` while it is up (the Save Sphere's wash); null or absent reads nothing. */
  washSelector?: string | null;
}
/** `rig` (R57-002): the page-side reader of a RIGGED figure (`createRigReader` of continuity-rig-probe.mjs, already built); absent, a rig is read as a painted figure, which never changes pose. */
export interface ProbeEnv { window: unknown; document: unknown; performance: { now(): number }; rig?: unknown }
export interface ProbeFigure { id: string; side: string | null; kind: string | null; artId: string | null; /** the rig that draws it, when one does */ rig?: string }
export interface ProbePose { fig: number; pose: string; url: string | null; w: number; h: number; /** a rig's key: the rig's name (it has no painting url) */ rig?: string }
export interface ProbeSwap { n: number; t: number; i: number; from: number; to: number; a: number; /** 1 for a change of a rig's key */ rig?: number }
export interface ProbeFrame { n: number; t: number; f: { i: number; a: number; act: number; s: (number[] | 0)[]; g: [number, number]; /** a rigged figure's frame (continuity-rig-probe.mjs) */ rg?: import('./continuity-rig.mjs').RigRecord }[]; /** r43: the wash element's opacity in this frame, present only while the Save Sphere card is up. */ w?: number }
export interface ProbeStripMeta { id: number; kind: 'swap' | 'jerk'; fi: number; n: number; first: number; crop: number[]; ring: number[]; cell: number[]; view: number[]; meta: unknown; todo: number; have: number; length: number }
export interface ProbeMeta {
  version: number; figs: ProbeFigure[]; poses: ProbePose[]; swaps: ProbeSwap[]; logEvents: { n: number; i: number; type?: string; [key: string]: unknown }[]; view: number[] | null; errors: string[];
  stats: { frames: number; battleFrames: number; battleSeconds: number; maxDtMs: number; slowFrames: number; fps: number | null; copyMsMean: number | null };
  strips: ProbeStripMeta[];
  /** r43: what the probe read of the wash (null when the card never showed): its selector, its background alpha (null when unreadable), the frames it was up and its highest opacity. */
  wash?: { selector: string; alpha: number | null; frames: number; maxOpacity: number; error: string | null } | null;
  /** Motion pass, step 2: the cuts the engine planned as a smear (`window.__pyrefly.smearLog()`), `at` and `cutAt` in the probe's clock; absent on a recording from before. */
  smears?: import('./continuity-smear.mjs').LoggedSmear[];
}
export interface Probe {
  records: ProbeFrame[]; swaps: ProbeSwap[]; strips: unknown[]; errors: string[];
  start(): boolean; finish(): Promise<void>; drain(max: number): { records: ProbeFrame[]; left: number }; meta(): ProbeMeta;
  stripFrames(ids: number[]): { id: number; frames: (string | null)[] }[];
}
export declare function createProbe(cfg: ProbeConfig, env: ProbeEnv): Probe;
