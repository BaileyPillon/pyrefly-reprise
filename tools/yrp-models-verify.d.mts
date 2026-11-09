/** Types for `tools/yrp-models-verify.mjs` (the hidden 3D Bahamut's shipped models, ch-yrp 2026-11-02; FFX-2 only). */
export function expectedYrpFiles(): string[];
/** Why a binary glTF at `path` is not whole, or null. */
export function glbProblem(path: string): string | null;
/** Why a file's text (a JSON file, or a glTF's JSON chunk) names a place on the PC that built it, or null. */
export function localPathProblem(full: string, isGlb: boolean): string | null;
/** Every file under `dir` as a path relative to it with forward slashes (links are not followed). */
export function listFiles(dir: string): string[];
export function verifyYrpModels(
  root: string,
  options?: { mode?: 'build' | 'source'; limits?: { maxFileBytes: number } },
): { ok: boolean; problems: string[]; files: number; bytes: number };
