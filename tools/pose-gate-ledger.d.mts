/** Types for `tools/pose-gate-ledger.mjs` (pose continuity, W1): the waiver ledger `docs/target/pose-waivers.json`. */

export const LEDGER_PATH: string;
export const LEGACY_REASON: string;
export const LEGACY_WORDS: string;
export const LEGACY_SEAL_DIGEST: string;
export function sealDigest(seal: Iterable<string>): string;

export interface WaiverRow {
  subject: string;
  pose: string;
  /** The painting master's sha256, 64 hex characters. */
  sha: string;
  reason: string;
  /** Whose words say so, quoted. */
  words: string;
  /** The decision (D-nnn, E-nnn) in the decisions ledger that records those words; required of every row that is not `legacy`. */
  source?: string;
  date: string;
  legacy?: true;
}
export interface WaiverLedger {
  version: 1;
  /** Hashes of the legacy rows' keys, written once by `--write-legacy`. */
  legacySeal?: string[];
  rows: WaiverRow[];
}
export interface LedgerLoad {
  exists: boolean;
  path: string;
  ledger: WaiverLedger | null;
  error: string | null;
}
export interface LedgerProblem {
  code: string;
  message: string;
}

export function waiverKey(subject: string, pose: string, sha: string): string;
/** Remove the legacy rows of paintings that are in band now, and their seal entries (rows are only ever removed). `stillOut`: the `waiverKey`s still out of band. */
export function pruneLegacyLedger(ledger: WaiverLedger, stillOut: Set<string>): { ledger: WaiverLedger; removed: WaiverRow[]; digest: string };
export function writePrunedLedger(root: string, ledger: WaiverLedger): string;
export function sealOf(subject: string, pose: string, sha: string): string;
export function isBaileyWords(words: unknown): boolean;
export function ledgerFile(root: string): string;
export function loadLedger(root: string): LedgerLoad;
export interface LedgerAtRef {
  state: 'ref' | 'absent' | 'error';
  ledger: WaiverLedger | null;
  message: string | null;
}
export function loadLedgerAtRef(root: string, ref: string): LedgerAtRef;
export function normalizeQuote(s: string): string;
export function quotedPassages(words: string): string[];
export function verifyBaileyWords(row: { words?: unknown; source?: unknown }, decisions: Map<string, string> | null): string | null;
export function loadDecisionWords(root: string): Map<string, string>;
export function validateLedger(
  ledger: unknown,
  o?: { base?: WaiverLedger | null; decisions?: Map<string, string> | null; pin?: string | null },
): { problems: LedgerProblem[]; index: Map<string, WaiverRow>; counts: { rows: number; legacy: number; bailey: number } };
export function buildLegacyLedger(paintings: Array<{ subject: string; pose: string; sha: string }>, date: string): WaiverLedger;
export function formatLedger(ledger: WaiverLedger): string;
export function writeNewLedger(root: string, ledger: WaiverLedger): string;
export function waivedRowsWithoutLedger(table: Record<string, Record<string, { status?: string; sha?: string }>>, validated: { index: Map<string, WaiverRow> }): string[];
