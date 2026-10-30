/** Types for `critic/runner/lib/continuity-gaps.mjs`, so the unit tests can import it. */
import type { ContinuityConfig } from './continuity-pure.mjs';

export interface GapPolicy { excuse: boolean }
export declare const GAP_DEFAULTS: Readonly<GapPolicy>;
export declare function gapPolicy(cfg: Partial<ContinuityConfig> | { gaps?: Partial<GapPolicy> } | null | undefined): GapPolicy;
export declare function startedInGap(list: Array<{ n: number; fig: object }>, at: number, to: number, fadeOf: (fig: object, k: number) => number, fadeMin: number): boolean;
