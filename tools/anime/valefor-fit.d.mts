/** Types for `tools/anime/valefor-fit.mjs`: the Meshy Valefor stood in the Wind Waker chapter's file convention. */
import type { Glb } from './glbkit.mjs';

export interface ValeforFit {
  scale: number;
  rawHeight: number;
  height: number;
  /** The shift applied: x centre, lowest y, claws' z (in the raw units). */
  centre: [number, number, number];
  islands: number;
  droppedIslands: number;
  droppedTris: number;
  freedBytes: number;
  beak: [number, number, number] | null;
  chestFront: number | null;
  bands: Array<{ from: number; to: number; count: number; max: number; body: number }>;
}

/** Fit `g` (one static primitive with an index list) in place: scale to `height`, claws on y 0, centred, specks under `minTris` dropped, the map regraded by `saturation`, the BIN repacked. */
export declare function fitValefor(g: Glb, opts?: { height?: number; minTris?: number; saturation?: number }): Promise<ValeforFit>;
