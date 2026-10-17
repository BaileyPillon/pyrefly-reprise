/** Types for `tools/rig/rig-gate-lib.mjs` (the rig program): the rig gate's core. */
import type { ModelInputs } from '../posescale/pose-model.mjs';

export const ROOT: string;
export const RIG_BANDS: Readonly<{ iou: number; restIou: number; baselinePx: number; sizePx: number; fitIou: number; fitStature: number }>;
export const BUDGET: Readonly<{ parts: number; bones: number; verts: number; tris: number; texels: number; bytes: number }>;

export interface RigGateFailure {
  code: string;
  message: string;
  pose?: string;
}
export interface RigGateKey {
  pose: string;
  class: string;
  source: string | null;
  planted: boolean;
  /** Overlap with the approved painting of the pose, both registered at the idle's scale and feet. Null with no painting. */
  iou: number | null;
  stature: number | null;
  bodyStature: number | null;
  /** The stature the band was applied to (head to soles for a props-out pose). */
  statureRead: number | null;
  headReal: number | null;
  feet: { dx: number; dy: number } | null;
  flags: string[];
  report: string[];
  propsOut: boolean;
  normK: number;
  ok: boolean;
}
export interface RigGateResult {
  subject: string | null;
  status: 'ok' | 'refused';
  failures: RigGateFailure[];
  keys: RigGateKey[];
  rest: { iou: number | null } | null;
  /** Poses the game has a registered painting of that the rig has no key for. */
  uncovered: string[];
  /** Painted poses with no key that the rig is not held to (staged or part paintings, or poses the pose table has no row for). */
  exempt: string[];
  /** Each key's posed box, feet and painted front in the master's px (`tools/rig/rig-silhouette.mjs`), stamped into `gate.silhouettes`. */
  silhouettes: Record<string, RigSilhouette>;
  holes: { joints: string[]; rendered: number; keysWithHoles: string[]; blendsWithHoles: number; blends: Array<{ from: string; to: string; t: number; holes: Array<{ name: string; count: number }> }> } | null;
  size: { parts: number; bones: number; texels: number; bytes: number; verts: number; tris: number };
  digest: string;
  bands: typeof RIG_BANDS;
  budget: typeof BUDGET;
  rigDir: string;
}

export function gateRig(o: { rig: string; root?: string; artDir?: string; inputs?: ModelInputs; blends?: boolean; requireCoverage?: boolean }): Promise<RigGateResult>;
export function costumeSha(costume: { sha?: string; sha2x?: string }, scale: number, artDir: string, subject: string, pose: string): { ok: boolean; why: string };
export function formatRigFailure(subject: string, x: RigGateFailure): string;
export function riggedPoses(result: RigGateResult): string[];
export interface RigSilhouette {
  /** `[x0, y0, x1, y1]`, painted pixels, the master's px, y down (x1, y1 exclusive). */
  box: [number, number, number, number];
  /** The lowest foot landmark of the posed rig, or null with none. */
  feet: [number, number] | null;
  /** Per horizontal band of the box (top to bottom): the first and the last painted pixel as a fraction of the box width; null where the band is empty. */
  profile: { left: Array<number | null>; right: Array<number | null> };
}
export interface RigGateStamp {
  status: 'ok' | 'refused';
  at: string;
  by: string;
  why?: string;
  rules: string;
  digest: string;
  keys: string[];
  /** `full`: every painted pose the battle draws has a key. The deploy and the runtime accept nothing else. */
  coverage: 'full' | 'partial';
  uncovered?: string[];
  exempt: string[];
  silhouettes: Record<string, RigSilhouette>;
  /** The size of every part's PNG and rim mask as the files are (`tools/rig/rig-tiers.mjs#textureSizes`): what the engine budgets texture memory from. */
  textures: Record<string, { map: [number, number]; rim: [number, number] | null }>;
  /** A fingerprint of the digest and the ship record (`sealOf`): a hand edit of `coverage`, `exempt`, `silhouettes` or `textures` breaks it. */
  seal: string;
}
export function sealOf(g: Record<string, any>): string;
export function stampRig(dir: string, result: RigGateResult, o?: { at?: string }): RigGateStamp;
export function verifyStamp(rig: string, o?: { full?: boolean }): { ok: boolean; code?: string; message?: string; raw?: Record<string, any>; dir?: string };
