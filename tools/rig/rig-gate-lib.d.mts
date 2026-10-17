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
export function stampRig(dir: string, result: RigGateResult, o?: { at?: string }): { status: 'ok' | 'refused'; at: string; by: string; why?: string; rules: string; digest: string; keys: string[] };
export function verifyStamp(rig: string): { ok: boolean; code?: string; message?: string; raw?: Record<string, any>; dir?: string };
