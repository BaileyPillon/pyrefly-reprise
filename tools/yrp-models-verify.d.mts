/** Types for `tools/yrp-models-verify.mjs` (the hidden 3D Bahamut's shipped models, ch-yrp 2026-11-02; FFX-2 only). */
export function expectedYrpFiles(): string[];
export function verifyYrpModels(
  root: string,
  options?: { mode?: 'build' | 'source'; limits?: { maxFileBytes: number } },
): { ok: boolean; problems: string[]; files: number; bytes: number };
