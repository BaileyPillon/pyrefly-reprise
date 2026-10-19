/** Types for `tools/rig/lane/track.mjs` (the lane kit): the rig tracker's pure parts. */
export interface TrackRecord {
  n: number;
  t: number;
  rig: boolean;
  pose: string;
  head: number[] | null;
  feet: number[] | null;
  centroid: number[] | null;
  hand: number[] | null;
  tip: number[] | null;
  root: number[];
  V: number[];
  P: number[];
}
export interface TrackSample {
  n: number;
  t: number;
  pose: string;
  fig: { head: number[] | null; feet: number[] | null; centroid: number[] | null; hand: number[] | null; tip: number[] | null; cam: number[] };
}
export function toSamples(records: TrackRecord[], W?: number, H?: number): TrackSample[];
export function analyse(samples: TrackSample[], repo: string, width?: number): Promise<{ frames: number; jerksHeadFeetPelvis: number; maxStepPxPerFrame: Record<string, number>; cameraCutFrames: number; poseKeyChanges: number; perPoint: Record<string, number | null> }>;
