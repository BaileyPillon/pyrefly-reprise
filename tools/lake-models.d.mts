/** Types for `tools/lake-models.mjs` (the hidden Wendigo chapter's local model files; Chapter 49, FFX only, 2026-11-07). */
export interface LakeModelFile {
  path: string;
  bytes: number;
  sha256: string;
}
export const LAKE_MODELS_SRC: string;
export const LAKE_MODELS_LIST: string;
export const LAKE_BACKUP_DATE: string;
export const LAKE_STORE_NAME: string;
export const LAKE_SECOND_DISK_NAME: string;
/** The roots the backups live under: the models store, then each drive's second-disk folder that exists (`exists` is injectable). */
export function backupRoots(env?: Record<string, string | undefined>, exists?: (path: string) => boolean): string[];
/** The backup folders `restore` and `ensure` read and `backup` writes (`PYREFLY_LAKE_BACKUP` names one instead). */
export function backupPlaces(env?: Record<string, string | undefined>, exists?: (path: string) => boolean): string[];
export function readList(list?: string): LakeModelFile[];
export function check(dir: string, files?: LakeModelFile[]): string[];
export function copyTree(from: string, to: string, files: readonly LakeModelFile[]): number;
export function recordOf(dir: string): LakeModelFile[];
/** The first backup place that holds every listed file whole, or null. */
export function firstGoodBackup(files: readonly LakeModelFile[], places?: readonly string[]): string | null;
