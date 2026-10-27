/** Types for `tools/measure/policy.mjs`. */
export interface FluidityPolicy {
  hz: { rates: number[]; wallTolerance: number; beatFrames: number; minIntervalMs: number; mode: 'report' | 'gate' };
  jolts: { minJumpPx: number; minShare: number; windowMs: number; maxRise: number; mode: 'report' | 'gate'; baselines: Record<string, { total?: number; seconds?: number; perMinute?: number; byClass?: Record<string, number>; note?: string }> };
}
export declare const FLUIDITY_DEFAULTS: Readonly<FluidityPolicy>;
export declare function fluidityPolicy(root: string): FluidityPolicy;
