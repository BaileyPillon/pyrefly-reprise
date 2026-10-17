/** Types for `critic/runner/lib/continuity-readings.mjs`: the HEIGHT, independent FEET and real HEAD readings of pose continuity (W4). */
import type { Anchors } from './continuity-pure.mjs';
import type { Waiver } from './continuity-waivers.mjs';

export interface HeightReading {
  fromPx: number; toPx: number; ratio: number | null;
  /** `idle`: one painting is the figure's idle, so `stature` (or, for a KO, `length`) is the pose's own; `pair`: two other poses, judged on their ratio. */
  vs: 'idle' | 'pair'; pose: string | null; side: 'from' | 'to' | null; class: string | null;
  stature: number | null; length: number | null; band: number[] | null;
  /** fail the check unless waived: `stature-low`, `stature-high`. */
  flags: string[];
  /** never fail: `ko-short`, `ko-long`. */
  report: string[];
  waived: Waiver | null; source: 'pixels';
}
/**
 * `gate` says which part of the gap judges the swap: 'dy' (both stances registered: the ground line only) or 'xy' (one is not: both axes); `gatePx` is that part, `tolerancePx` the line.
 */
export interface FeetSilhouetteReading { dx: number; dy: number; px: number; gate: 'dy' | 'xy'; gatePx: number; standing: boolean; source: 'silhouette'; registeredGapPx: [number | null, number | null]; tolerancePx: number; waived?: Waiver | null }
export interface RealHeadReading { ratio: number; fromHeld: number | null; toHeld: number | null; costPct: number; band: number[]; outsideBand: boolean; waived?: Waiver | null }
type Map3 = number[];
export declare function figureHeightPx(H: Map3, ext: NonNullable<Anchors['extent']>): number;
export declare function figureLengthPx(H: Map3, ext: NonNullable<Anchors['extent']>): number;
export declare function statureBandOf(cls: string | null | undefined, pose: string): number[] | null;
export declare function readHeight(o: { aFrom: Anchors | null; aTo: Anchors | null; Hf: Map3; Ht: Map3; k1600: number }): HeightReading | null;
export declare function readFeetSilhouette(o: { aFrom: Anchors | null; aTo: Anchors | null; Hf: Map3; Ht: Map3; k1600: number }): FeetSilhouetteReading | null;
export declare function readRealHead(o: { aFrom: Anchors | null; aTo: Anchors | null; head: { ratio: number | null; source: string } | null }): RealHeadReading | null;

import type { ContinuityConfig } from './continuity-pure.mjs';
export declare function feetSilhouetteTolerancePx(cfg: Pick<ContinuityConfig, 'size'> | null | undefined, figurePx: number): number;
export declare function poseReadings(o: { aFrom: Anchors | null; aTo: Anchors | null; Hf: Map3; Ht: Map3; k1600: number; head: { ratio: number | null; source: string } | null; cfg: Partial<ContinuityConfig> | null | undefined; judged: boolean }): {
  height: HeightReading | null; feetSil: FeetSilhouetteReading | null; headReal: RealHeadReading | null; failHeight: boolean; failFeetSil: boolean; failRealHead: boolean; unregistered: boolean;
};
