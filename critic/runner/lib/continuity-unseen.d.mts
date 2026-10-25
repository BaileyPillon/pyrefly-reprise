/** Types for `critic/runner/lib/continuity-unseen.mjs`, so the unit tests can import it. */
import type { ContinuityConfig } from './continuity-pure.mjs';

export interface UnseenPolicy { excuse: boolean; minShare: number; fadeMin: number; maxBoxViews: number }
export declare const UNSEEN_DEFAULTS: Readonly<UnseenPolicy>;
export declare function unseenPolicy(cfg: Partial<ContinuityConfig> | { unseen?: Partial<UnseenPolicy> } | null | undefined): UnseenPolicy;
export declare function unseenIn(fig: { s?: unknown[]; rg?: { h?: number[]; f?: number[]; c?: number[] } } | null | undefined, view: number[], o?: { minShare?: number; fadeMin?: number; maxBoxViews?: number }): boolean;
