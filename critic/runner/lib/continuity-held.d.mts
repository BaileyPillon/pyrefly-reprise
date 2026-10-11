/** Types for `critic/runner/lib/continuity-held.mjs`, so the unit tests can import it. */
import type { FrameOfFig, Held } from './continuity-pure.mjs';

export declare const HELD_EPSILON: number;
export declare const HELD_MIN_FRAMES: number;
export declare function heldPlateau(frames: FrameOfFig[], swap: { from: number; to: number }, blendFadeMin: number, frameMs: number): Held;
