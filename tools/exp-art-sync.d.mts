export type SyncStatus = 'new' | 'present' | 'conflict';
export interface SyncEntry {
  area: 'art' | 'fx';
  /** Path relative to its root, forward slashes. */
  rel: string;
  src: string;
  dst: string;
  size: number;
  status: SyncStatus;
}
export interface SyncTotals {
  files: number;
  bytes: number;
  new: { files: number; bytes: number };
  present: { files: number; bytes: number };
  conflict: { files: number; bytes: number };
  byArea: Record<string, { files: number; bytes: number; new: number }>;
}
export interface SyncPlan {
  entries: SyncEntry[];
  totals: SyncTotals;
  /** Non-empty = refused: nothing may be copied. */
  problems: string[];
}
export interface SyncResult {
  copied: Array<SyncEntry & { sha256: string }>;
  skipped: SyncEntry[];
  failed: Array<SyncEntry & { reason: string }>;
}
export const isNamespacePath: (rel: string) => boolean;
export const isFxNamespacePath: (rel: string) => boolean;
export function isCleanRelative(rel: string): boolean;
export function planSync(opts?: { source?: string; target?: string; fxSource?: string; fxTarget?: string }): SyncPlan;
export function applySync(plan: SyncPlan, opts?: { onFile?: (e: SyncEntry, r: SyncResult) => void }): Promise<SyncResult>;
