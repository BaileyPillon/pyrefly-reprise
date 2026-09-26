/**
 * Types for `tools/critic-plan.mjs`, so the unit tests can import it directly.
 * Same arrangement as `critic-policy.d.mts`.
 */
import type { ReviewPlan } from './critic-policy.mjs';

export interface RepoPlan extends ReviewPlan {
  previousBuild: string | null;
  head: string | null;
  lastDeep: { sha: string; date: string; source: string } | null;
  /** Where the chapter list came from: the registry (encounters.ts minus the COMING ids) or the policy.json fallback. */
  chapterSource: 'registry' | 'policy.json';
}

export function lastDeployedSha(root: string): string | null;
/** Listed chapters from src/data/encounters.ts minus LOCKED_CHAPTER_IDS, or null when the registry cannot be read. */
export function registryChapters(root?: string): Record<string, { game: string; scene: string }> | null;
export function planForRepo(opts?: {
  root?: string; since?: string | null; head?: string; paths?: string[] | null;
  manifest?: unknown; previousManifest?: unknown; claim?: string | null; minimum?: string | null; extraPaths?: string[];
}): RepoPlan;
