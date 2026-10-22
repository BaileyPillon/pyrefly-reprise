import type { ArtifactManifest } from './demo-kit-lib.mjs';
export const LIVE_BASE: string;
export const DEFAULT_MANIFEST: string;
export const SITE_MARK: string;
export function freeBytes(dir: string): number | null;
export function liveManifest(base?: string, fetchImpl?: typeof fetch): Promise<ArtifactManifest | null>;
export interface FetchSiteResult {
  kept: number;
  fetched: number;
  failed: Array<{ path: string; why: string }>;
  bytesFetched: number;
  selected: number;
  complete: boolean;
}
export function fetchSite(opts: {
  manifest: ArtifactManifest;
  dir: string;
  base?: string;
  only?: string[];
  maxTier?: number;
  limit?: number;
  jobs?: number;
  verifyOnly?: boolean;
  fetchImpl?: typeof fetch;
  log?: (message: string) => void;
  retryWaitMs?: number[];
}): Promise<FetchSiteResult>;
export function enoughRoom(free: number | null, need: number, force?: boolean): boolean;
