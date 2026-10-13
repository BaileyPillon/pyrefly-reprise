/** Types for `tools/ffxcam-plate-lib.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import it. */
import type { Coverage, PaintedWorld } from '../src/engine/ffxcam/plateFit.ts';

export declare function paintedWorld(): PaintedWorld;
export declare function basisOf(pose: { eye: readonly number[]; ref: readonly number[]; roll: number }): { eye: number[]; forward: number[]; right: number[]; up: number[] };
export declare function coverage(world: PaintedWorld, pose: { eye: readonly [number, number, number]; ref: readonly [number, number, number]; roll: number; fovDeg: number }, aspect: number, nx?: number, ny?: number): Coverage;
