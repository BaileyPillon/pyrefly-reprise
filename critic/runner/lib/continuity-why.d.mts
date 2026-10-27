/** Types for `critic/runner/lib/continuity-why.mjs`, so the unit tests can import it. */
export interface DesignedBlendPolicy { report: boolean; excuse: boolean; maxMs: number; maxSeverity: number }
export interface ClassPolicy { interludeMs: number; hurtStringMs: number; windUpMs: number; whyWindowMs: number; slackMs: number; designedBlend: DesignedBlendPolicy }
export declare const SWAP_LOG_CAP: number;
export declare const CLASS_DEFAULTS: Readonly<ClassPolicy>;
export declare function classPolicy(cfg: unknown): ClassPolicy;

export interface ClassSwap {
  id: number; figure: string; fromPose: string; toPose: string; tMs: number; counted?: boolean; notShowing?: boolean; rig?: boolean; smear?: object;
  ghost?: { frames: number; ms: number; severity: number };
  why?: { reason: string; ageMs: number | null; source: 'log' };
  interlude?: { n: number; role: 'out' | 'back'; gapMs: number | null; to: string };
  hurtString?: { n: number; role: 'out' | 'back'; gapMs: number | null };
  designed?: { cls: string | null; ms: number };
  designedExcused?: boolean;
}
export interface SwapLogReason { at: number; actor: string; pose: string; paint?: string; reason: string }
export interface SwapLogDesigned { at: number; actor: string; from: string; to: string; cls?: string; ms: number }
export interface SwapLogMeta { reasons?: SwapLogReason[]; designed?: SwapLogDesigned[] }

export declare function swapClass(w: { fromPose: string; toPose: string; rig?: boolean }): string;
export declare function neighbours(swaps: ClassSwap[]): Map<ClassSwap, { prev: ClassSwap | null; next: ClassSwap | null; prevGapMs: number | null; nextGapMs: number | null }>;
export declare function tagWhy(swaps: ClassSwap[], reasons: SwapLogReason[] | null | undefined, policy?: ClassPolicy): number;
export declare function stanceReading(w: ClassSwap, nb: ReturnType<typeof neighbours>, policy?: ClassPolicy): { kind: 'up' | 'down'; reading: string; source: 'log' | 'neighbours' } | null;
export interface Interlude { n: number; figure: string; to: string; gapMs: number | null; ids: [number, number]; ghostFrames: number; ghostMs: number; counted: boolean }
export declare function findInterludes(swaps: ClassSwap[], policy?: ClassPolicy, nb?: ReturnType<typeof neighbours>): Interlude[];
export interface HurtString { n: number; figure: string; gapMs: number | null; ids: [number, number]; ghostFrames: number; ghostMs: number; counted: boolean }
export declare function findHurtStrings(swaps: ClassSwap[], policy?: ClassPolicy, nb?: ReturnType<typeof neighbours>): HurtString[];
export declare function tagDesigned(swaps: ClassSwap[], designed: SwapLogDesigned[] | null | undefined, policy?: ClassPolicy, frameMs?: number): number;
export interface GroupStats { swaps: number; perMinute: number | null; ghostFrames: number; ghostMs: number; ghostMsPerMinute: number | null; ghostFramesPerMinute: number | null; severityMax: number | null }
export declare function groupStats(sel: ClassSwap[], minutes: number): GroupStats;
export interface Prepared { policy: ClassPolicy; whyTagged: number; designedN: number }
export declare function prepareClasses(swaps: ClassSwap[], swapLog: SwapLogMeta | null | undefined, cfg: unknown): Prepared;
export interface ClassReport {
  windowMs: { interlude: number; hurtString: number; windUp: number; why: number };
  source: { why: 'log' | 'neighbours' | 'none'; whyTagged: number; designed: 'log' | 'none'; logCapped: { reasons: boolean; designed: boolean } };
  byClass: Array<GroupStats & { cls: string; planned: number; designed: number }>;
  stance: { source: string; up: Record<string, GroupStats>; down: Record<string, GroupStats> };
  interludes: { count: number; perMinute: number | null; countedPairs: number; ghostFrames: number; ghostMs: number; ghostMsPerMinute: number | null; ghostFramesPerMinute: number | null; ghostShare: number; byTo: Record<string, number>; medianGapMs: number | null };
  hurtStrings: { count: number; perMinute: number | null; ghostFrames: number; ghostMs: number; ghostMsPerMinute: number | null; medianGapMs: number | null };
  designedBlend: DesignedBlendPolicy & GroupStats & { logged: number; matched: number; excused: number; undesignedGhostMsPerMinute: number | null };
}
export declare function classReport(swaps: ClassSwap[], o: { battleSeconds: number; totalGhostFrames: number; prepared: Prepared; swapLog?: SwapLogMeta | null }): ClassReport;
