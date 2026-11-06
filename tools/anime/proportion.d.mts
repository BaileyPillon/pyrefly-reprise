/** Types for `tools/anime/proportion.mjs`: the proportion pass over a Meshy 24-joint skinned GLB. */
import type { Glb } from './glbkit.mjs';

export interface ProportionParams {
  /** The head's uniform scale about the Head joint. */
  head: number;
  /** The default lengthening along the bones of the legs and the spine (1 = none). */
  k: number;
  /** Overrides of `k` for the legs and for the spine. */
  leg?: number;
  spine?: number;
  /** The arms follow the spine's lengthening times this. */
  arm: number;
  /** The width scale of the stretched bones (1 = none). */
  slim: number;
  /** The neck bone's length scale. */
  neck: number;
}

export interface ProportionResult {
  total: number;
  headH: number;
  heads: number;
  chin: number;
  top: number;
  dy: number;
  hips: number;
  hipsOld: number;
  outPos: Float64Array;
  outNor: Float64Array;
}

/** Work out the pass for `g` (nothing is written): the new positions, normals, joint places and the measures. */
export declare function proportion(g: Glb, p: ProportionParams): ProportionResult;
/** Write the pass into `g`: positions, normals, inverse-bind matrices, the bones' offsets and every clip's translation tracks. */
export declare function apply(g: Glb, r: ProportionResult, p: ProportionParams): void;
