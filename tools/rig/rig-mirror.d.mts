/** Types for `tools/rig/rig-mirror.mjs` (the rig program): a release art mirror that carries the rigs. */
export interface MirrorPlan {
  ok: boolean;
  problems: string[];
  subjects: string[];
  /** Files of the source mirror to hard-link (relative paths). */
  links: string[];
  copies: Array<{ subject: string; files: string[]; replaces: boolean }>;
}
export function listFiles(root: string): string[];
export function planMirror(o: { from: string; rigsRoot: string; to: string; subjects?: string[]; makeTiers?: boolean }): Promise<MirrorPlan>;
export function buildMirror(o: { from: string; rigsRoot: string; to: string; plan: MirrorPlan; makeTiers?: boolean; log?: (line: string) => void }): Promise<{
  linked: number;
  copied: number;
  tiered: number;
  manifest: { rigs: string[]; rigTiers: Record<string, number[]>; changedKeys: string[] };
}>;
export function verifyMirror(o: { from: string; rigsRoot: string; to: string; plan: MirrorPlan }): Promise<{ ok: boolean; problems: string[]; files: number; linked: number; copied: number }>;
