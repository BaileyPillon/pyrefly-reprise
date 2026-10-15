/** Types for `tools/ffxcam-table-lib.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import it. */

/** One recorded sample: eye x y z, look-at x y z, roll in degrees, lens. */
export type Sample = number[];

/** A key as the fit writes it: `[step, eye, look-at, roll, lens, shape]`. */
export type FitKey = [number, [number, number, number], [number, number, number], number, number, number | number[]];

export interface FitError {
  eye: number;
  ref: number;
  roll: number;
  fov: number;
  dir: number;
}

export declare const TOLERANCE: { pos: number; deg: number };
export declare function quantise(sample: Sample): Sample;
export declare function errorOf(predicted: ArrayLike<number>, sample: ArrayLike<number>): FitError;
export declare function fitKeys(samples: Sample[], shapes?: string[], tol?: { pos: number; deg: number }): FitKey[];
export declare function evalKeys(keys: FitKey[], step: number): number[];
export declare function worstError(keys: FitKey[], samples: Sample[]): FitError;
