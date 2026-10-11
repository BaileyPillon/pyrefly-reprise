/** Types for `critic/runner/lib/continuity-staged.mjs`, so the unit tests can import it. */
import type { Anchors, ContinuityConfig, StagedStep } from './continuity-pure.mjs';

export declare const TWIRL_KEY: RegExp;
export declare const STAGED_GAP_FRAMES: number;
export declare function isTwirlKey(name: unknown): boolean;
export declare function twirlKeyOf(anchor: Partial<Anchors> | null | undefined, name?: string): string | null;
export declare function stagedStepOf(aFrom: Partial<Anchors> | null | undefined, aTo: Partial<Anchors> | null | undefined, cfg?: Partial<ContinuityConfig>, names?: { from?: string; to?: string }): StagedStep | null;
export declare function groupStaged<T extends { fi: number; from: number; to: number; n: number; staged?: StagedStep | null }>(swaps: T[], gapFrames?: number): { seq: number; fi: number; steps: T[] }[];
