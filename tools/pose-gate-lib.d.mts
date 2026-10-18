/** Types for `tools/pose-gate-lib.mjs` (pose continuity, W1): the pose gate's core. */
import type { ModelInputs, ModelRow, PoseReading } from './posescale/pose-model.mjs';
import type { WaiverLedger, WaiverRow } from './pose-gate-ledger.mjs';

export const ROOT: string;
export const STATUSES: readonly string[];

export interface GateFailure {
  subject?: string;
  pose?: string;
  code: string;
  message: string;
}
export interface GateNote {
  subject?: string;
  pose?: string;
  message: string;
}
export interface PaintingJudgement {
  outcome: 'exempt' | 'pass' | 'waived' | 'fail';
  failures: Array<{ code: string; message: string }>;
  notes: string[];
  flags: string[];
  report: string[];
  proposed: string | null;
}
export interface GateEntry {
  subject: string;
  pose: string;
  key: string;
  class: string;
  kind: string;
  game: string;
  /** `rigged`: a pass or a waiver whose pose a gate-ok rig serves (the painting stays the fallback). */
  outcome: PaintingJudgement['outcome'] | 'rigged';
  rigged?: boolean;
  /** The outcome before a rig relabelled it. */
  was?: string;
  status: string | null;
  proposed: string | null;
  flags: string[];
  report: string[];
  codes: string[];
  stature: number | null;
  headReal: number | null;
  lengthRatio: number | null;
  iou: number | null;
  held: boolean;
  waived: boolean;
  legacy: boolean;
  sha: string;
}
export interface GateResult {
  artDir: string;
  subjects: number;
  paintings: number;
  entries: GateEntry[];
  failures: GateFailure[];
  notes: GateNote[];
  ledger: { exists: boolean; rows: number; legacy: number; bailey: number; problems: number; stale: number; base: 'none' | 'ref' | 'absent' | 'error' };
  /** The rigs found under `rigs.dir` for these subjects: whether each counted, its mode, the poses it serves, and why not. */
  rigs: Array<{ subject: string; ok: boolean; mode: string; keys: string[]; why: string | null }>;
}

export function flagText(reading: PoseReading, flag: string): string;
export function judgePainting(reading: PoseReading, row: ModelRow | undefined, waiver: WaiverRow | undefined): PaintingJudgement;
export function runGate(o?: {
  root?: string;
  artDir?: string;
  inputs?: ModelInputs;
  subjects?: string[];
  ledger?: WaiverLedger | null;
  ledgerBase?: WaiverLedger | null;
  baseRef?: string;
  concurrency?: number;
  onSubject?: (subject: string, readings: PoseReading[]) => void;
  /** The decisions ledger's words by id (default: read from `root`). */
  decisions?: Map<string, string> | null;
  /** The legacy seal's expected digest (default: the one pinned in tools/pose-gate-ledger.mjs). */
  pin?: string | null;
  /** The rig root (`<dir>/<subject>/rig.json`): poses a gate-ok rig serves are reported `rigged`. `mode` `full` (default) runs the rig gate again, `stamp` checks the stamp only. */
  rigs?: { dir?: string; mode?: 'full' | 'stamp' };
}): Promise<GateResult>;
export function formatFailure(x: GateFailure): string;
export function countByCode(failures: Array<{ code: string }>): Record<string, number>;
export function censusReport(result: GateResult, o?: { full?: boolean }): Record<string, any>;
export function legacyPaintings(result: GateResult, o?: { except?: string[] }): Array<{ subject: string; pose: string; sha: string; flags: string[] }>;
export function listBuiltPaintings(distDir: string): Array<{ subject: string; pose: string; file: string }>;
export function checkBuilt(built: Array<{ subject: string; pose: string; file: string }>, result: GateResult): Array<{ subject: string; pose: string; code: string; message: string }>;
export function checkMastersUnchanged(built: Array<{ subject: string; pose: string; file: string }>, result: GateResult): Array<{ subject: string; pose: string; code: string; message: string }>;
export function poseGateRefusal(failures: Array<{ code: string }>, stage: string): string;
export function enforcePoseGate(o: {
  root?: string;
  artDir?: string;
  baseRef?: string | null;
  log?: (line: string) => void;
  fail: (message: string) => never | void;
  rigs?: { dir?: string; mode?: 'full' | 'stamp' };
}): Promise<GateResult>;
export function enforceBuiltPaintings(o: {
  dist: string;
  result: GateResult;
  log?: (line: string) => void;
  fail: (message: string) => never | void;
}): Array<{ subject: string; pose: string; file: string }>;
export function scrubPath(text: string, dir?: string): string;
