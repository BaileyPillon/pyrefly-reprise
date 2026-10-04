/**
 * Types for `tools/deploy-wrangler.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import
 * it directly. Same arrangement as `deploy-classify.d.mts`: this file declares the module's whole
 * public surface, so an export added over there needs a line here.
 */

import type { CloudflareKind } from './deploy-host.mjs';

export declare const WRANGLER_STDIO: readonly ['ignore', 'inherit', 'inherit'];

export interface WranglerOutputEntry {
  type?: string;
  worker_name?: string | null;
  pages_project?: string | null;
  version_id?: string | null;
  deployment_id?: string | null;
  targets?: unknown;
  url?: unknown;
  alias?: unknown;
  [key: string]: unknown;
}
export declare function parseWranglerOutput(text: string | null | undefined): { entries: WranglerOutputEntry[]; malformed: number };
export declare function pickDeployEntry(entries: WranglerOutputEntry[], name?: string | null, kind?: CloudflareKind): WranglerOutputEntry | null;
export declare function pickDeployedUrls(entry: WranglerOutputEntry | null | undefined): string[];

export declare function wranglerMessage(input: { mainSha: string; isoNow: string; preview?: boolean; extra?: string }): string;
export declare function buildWranglerDeployArgs(input: {
  configPath: string;
  workerName: string;
  message?: string;
  tag?: string;
  dryRun?: boolean;
}): string[];
export declare function buildPagesDeployArgs(input: {
  dist: string;
  projectName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
}): string[];
export declare function buildPagesProjectCreateArgs(input: { projectName: string; productionBranch: string }): string[];
export declare function parsePagesProjectNames(stdout: string | null | undefined): string[] | null;
export declare function wranglerEnv(baseEnv: Record<string, string | undefined>, options?: { outputFile?: string | null }): Record<string, string | undefined>;

/** The one file that says where the pinned wrangler is installed outside the repo, and which version that is. */
export declare const WRANGLER_INSTALL_CONFIG: string;
type ReadFile = (path: string, encoding: 'utf8') => string;
/** The exact version package.json pins (`devDependencies.wrangler`), or null when it cannot be read. */
export declare function readPinnedWranglerVersion(root: string, readFile?: ReadFile): string | null;
/** The version of the wrangler package a `<package>/bin/wrangler.js` belongs to, or null. */
export declare function readWranglerVersion(bin: string, readFile?: ReadFile): string | null;
/** Where the pinned wrangler is installed outside the repo, from `tools/cloudflare/wrangler-install.json`, or null. */
export declare function readWranglerInstall(root: string, readFile?: ReadFile): { version: string; dir: string; bin: string } | null;

export type WranglerSource = 'env' | 'repo' | 'tools';
export declare function resolveWranglerBin(
  root: string,
  exists?: (path: string) => boolean,
  env?: Record<string, string | undefined>,
  readFile?: ReadFile,
): { ok: true; bin: string; source: WranglerSource; version: string | null; pinned: string | null } | { ok: false; error: string };

/** Whole-line `//` comments stripped, then parsed: the committed wrangler configs carry nothing else. */
export declare function parseWranglerConfigText(text: string): Record<string, unknown>;
/** Problems with a wrangler config for a Workers run (empty = fit to deploy): its name, workers.dev, assets, and the Custom Domain as the only route (none for a preview). */
export declare function checkWranglerConfig(text: string, options: { name: string; preview?: boolean; customDomain?: string }): string[];
export declare function parseWhoami(status: number | null, stdout: string | null | undefined): { loggedIn: boolean; accounts: number };
