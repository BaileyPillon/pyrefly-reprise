/** Types for `tools/lake-models-verify.mjs` (the hidden Wendigo chapter's shipped models, ch-wendigo 2026-11-07; FFX only). */
import type { LakeModelFile } from './lake-models.mjs';

/** The environment variable and word that let a build with no models folder through (`capsules`). */
export const CAPSULES_ENV: 'PYREFLY_LAKE_MODELS';
export const CAPSULES_OK: 'capsules';
/** Every file the set contains, as a path under the root with forward slashes (`models-exp/lake/...`). */
export function expectedLakeFiles(): string[];
export function verifyLakeModels(
  root: string,
  options?: { mode?: 'build' | 'source'; limits?: { maxFileBytes: number }; list?: LakeModelFile[] },
): { ok: boolean; problems: string[]; files: number; bytes: number };
