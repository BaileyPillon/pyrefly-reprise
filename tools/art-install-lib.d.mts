/** Types for `tools/art-install-lib.mjs` (pose continuity, W1): the common core of every art install. */

export const ROOT: string;
export const DEFAULT_PYTHON: string;

export interface InstallItem {
  subject: string;
  /** The folder holding `<pose>.png` and `<pose>.json`; null or absent to register paintings that are already in the target. */
  from?: string | null;
  poses?: string[];
}
export interface InstallWrite {
  subject: string;
  pose: string;
  png: string;
  json: string;
  srcPng: string;
  srcJson: string;
  sha: string;
  replaces: string[];
}
export interface InstallPlan {
  ok: boolean;
  problems: string[];
  writes: InstallWrite[];
  registerOnly: string[];
}
export interface InstallDone {
  subject: string;
  pose: string;
  sha: string;
  bytes: number;
  movedAside: string[];
}

export function hardLinked(dir: string): Array<{ name: string; nlink: number }>;
export function sidecarProblems(obj: unknown, where: string, size?: { width: number; height: number }): string[];
export function posesIn(dir: string): string[];
export function hiresBeside(dir: string, pose: string): string[];
export function subjectsWithoutAnnotation(subjects: string[], root?: string): string[];
export function poseGateAfter(o: { art: string; subjects: string[]; root?: string; run?: (cmd: string, args: string[], o: { cwd: string }) => { status: number }; log?: (line: string) => void }): number;
export function planInstall(o: { target: string; items: InstallItem[]; replace?: boolean; backup?: string | null }): Promise<InstallPlan>;
export function applyInstall(plan: InstallPlan, o?: { backup?: string | null }): InstallDone[];
export function runCommand(cmd: string, args: string[], o?: { cwd?: string; env?: Record<string, string> }): { status: number; error: string | null };
export function register(o: {
  subjects: string[];
  target: string;
  root?: string;
  python?: string;
  run?: (cmd: string, args: string[], o: { cwd: string; env: Record<string, string> }) => { status: number };
  log?: (line: string) => void;
}): { ok: boolean; step: 'annotation' | 'measure' | 'table' | 'gate' | null; calls: Array<{ cmd: string; args: string[] }> };
