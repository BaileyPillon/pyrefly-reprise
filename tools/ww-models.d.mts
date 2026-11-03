/** Types for `tools/ww-models.mjs` (the hidden Wind Waker chapter's local model files; Chapter 32, FFX-2 only, 2026-11-02). */
export interface WwModelFile {
  path: string;
  bytes: number;
  sha256: string;
}
export const WW_MODELS_SRC: string;
export const WW_MODELS_LIST: string;
export const WW_MODELS_BACKUP: string;
export function readList(list?: string): WwModelFile[];
export function check(dir: string, files?: WwModelFile[]): string[];
export function copyTree(from: string, to: string, files: readonly WwModelFile[]): number;
export function recordOf(dir: string): WwModelFile[];
