/** Types for `tools/measure/policy.mjs`. */
export interface FluidityPolicy {
  hz: { rates: number[]; wallTolerance: number; beatFrames: number; minIntervalMs: number; mode: 'report' | 'gate' };
  jolts: { minJumpPx: number; minShare: number; windowMs: number; gridMs: number; maxRise: number; sigma: number; mode: 'report' | 'gate'; baselines: Record<string, { method?: 'raw' | 'grid'; total?: number; seconds?: number; perMinute?: number; byClass?: Record<string, number>; note?: string }> };
}
export declare const FLUIDITY_DEFAULTS: Readonly<FluidityPolicy>;
export declare function fluidityPolicy(root: string): FluidityPolicy;
export declare function stampThresholds(policyBlock: object | null | undefined): Record<string, unknown>;
