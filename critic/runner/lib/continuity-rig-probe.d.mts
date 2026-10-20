/** Types for `critic/runner/lib/continuity-rig-probe.mjs` (the page-side reader of a rigged figure, R57-002), so the unit tests can import it. */
import type { RigRecord } from './continuity-rig.mjs';

export interface RigReaderConfig { head: string[]; centroid: string[]; feet: string[]; headPart: string }
export interface RigSample {
  name: string; key: string; busy: boolean;
  /** the key's painted box on the screen: top-left, top-right, bottom-right, bottom-left (8 numbers, CSS px), or null with no stamped shape */
  q: number[] | null;
  rg: RigRecord;
}
export interface RigReader {
  is(actor: unknown): boolean;
  /** `P` projects a world point to CSS px under this frame's camera, `Pp` under the last frame's (null while the camera is still). Null when the rig is not built or nothing could be read. */
  sample(actor: unknown, P: (p: number[]) => number[], Pp: ((p: number[]) => number[]) | null): RigSample | null;
}
export declare function createRigReader(cfg: RigReaderConfig): RigReader;
