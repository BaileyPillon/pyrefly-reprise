/** Types for `tools/rig/rig-install.mjs` (the rig program): install a rig through the gate. */
import type { ModelInputs } from '../posescale/pose-model.mjs';

export interface RigInstallItem {
  subject: string;
  from: string;
}
export interface RigInstallWrite {
  subject: string;
  from: string;
  dest: string;
  files: string[];
  replaces: string[];
}
export interface RigInstallPlan {
  ok: boolean;
  problems: string[];
  writes: RigInstallWrite[];
}
export function rigFiles(raw: Record<string, any>): string[];
export function planRigInstall(o: {
  rigsRoot: string;
  artDir?: string;
  root?: string;
  inputs?: ModelInputs;
  items: RigInstallItem[];
  replace?: boolean;
  backup?: string | null;
  requireCoverage?: boolean;
}): Promise<RigInstallPlan>;
export function applyRigInstall(plan: RigInstallPlan, o?: { backup?: string | null }): Array<{ subject: string; files: number; movedAside: number }>;
