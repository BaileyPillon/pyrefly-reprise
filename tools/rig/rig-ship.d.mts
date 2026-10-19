/** Types for `tools/rig/rig-ship.mjs` (the rig program): what a rig must be to ship, and the deploy's two checks of it. */
export interface RigShipProblem {
  code: string;
  message: string;
}
export interface RigShipVerdict {
  ok: boolean;
  subject: string;
  problems: RigShipProblem[];
  info: { keys: string[]; exempt: string[]; tiers: { checked: number; texels: number; bytes: number } | null };
}
export interface VerifiedRig {
  subject: string;
  dir: string;
  keys: string[];
}
export function paintedPosesOf(artDir: string, subject: string): string[];
export function inventory(dir: string, raw: Record<string, any>): { names: Set<string>; extra: string[] };
export function verifyShippableRig(o: { dir: string; artDir: string; subject?: string; allowPartial?: boolean; tiers?: boolean }): Promise<RigShipVerdict>;
export function listRigFolders(publicDir: string): { root: string; folders: Array<{ subject: string; dir: string }>; stray: string[] };
export function rigRefusal(n: number, stage: string): string;
export function enforceShippedRigs(o: { publicDir: string; log?: (line: string) => void; fail: (message: string) => void }): Promise<VerifiedRig[]>;
export function enforceBuiltRigs(o: { dist: string; publicDir: string; verified: Array<{ subject: string }>; log?: (line: string) => void; fail: (message: string) => void }): { rigs: string[]; files: number };
