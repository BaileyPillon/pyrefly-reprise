/**
 * Types for `tools/deploy-cloudflare.mjs`. Same arrangement as `deploy-classify.d.mts`: the whole
 * public surface, so an export added over there needs a line here.
 */

import type { CloudflareKind, DeployHost, UploadFile, UploadLimitsReport } from './deploy-host.mjs';

export declare const NOT_LOGGED_IN: string;

/** Every side effect the Cloudflare half uses; each is replaceable, and `fail` must not return. */
export interface CloudflareDeps {
  spawnSync?: (
    command: string,
    args: string[],
    options: Record<string, unknown>,
  ) => { status: number | null; stdout?: string; error?: Error };
  existsSync?: (path: string) => boolean;
  readFileSync?: (path: string, encoding: 'utf8') => string;
  removeDir?: (path: string) => void;
  removeFile?: (path: string) => void;
  list?: (dir: string, kind?: CloudflareKind) => { files: UploadFile[]; configFiles: string[] };
  verifyLive?: (manifest: ArtifactManifestLike, url: string, options: { changed: string[]; full: boolean }) => Promise<LiveCheck>;
  fetchImpl?: (url: string, init?: Record<string, unknown>) => Promise<{
    status: number;
    text(): Promise<string>;
    headers?: { get(name: string): string | null };
  }>;
  env?: Record<string, string | undefined>;
  sleep?: (ms: number) => Promise<void>;
  tmpFile?: () => string;
  log?: (message: string) => void;
  fail?: (message: string) => never;
}

export interface ArtifactManifestLike {
  artifactHash: string;
  files: Record<string, unknown>;
}

/** The fields of `verifyLive`'s report that the Cloudflare half reads. */
export interface LiveCheck {
  result: 'PASS' | 'FAIL' | 'UNVERIFIED';
  checked: number;
  liveManifest: string;
  mismatched: string[];
  missing: string[];
  wrongType: string[];
  errors: string[];
}

export declare function checkCloudflareLogin(input: { root: string; deps?: CloudflareDeps }): { loggedIn: boolean; accounts: number };

export declare function prepareCloudflareUpload(input: {
  dist: string;
  manifest: ArtifactManifestLike;
  manifestName: string;
  kind?: CloudflareKind;
  deps?: CloudflareDeps;
}): UploadLimitsReport;

/** What `www.<domain>` does: forwards to the apex (right), serves the game itself (saves would split), answers otherwise, or does not answer. */
export interface WwwForwarding {
  state: 'forwards' | 'serves-game' | 'other' | 'unreachable' | 'skipped';
  detail: string;
}

/** Looks at the www host and logs a WARNING when it does not forward to the apex; never changes anything and never fails a deploy. */
export declare function checkWwwForwarding(input?: { host?: DeployHost; deps?: CloudflareDeps }): Promise<WwwForwarding>;

export interface CloudflarePublishResult {
  kind: CloudflareKind;
  /** The Worker or the Pages project that was deployed to. */
  siteName: string;
  versionId: string | null;
  /** Every address verified byte for byte; a production Workers deploy has the canonical Custom Domain last. */
  urls: string[];
  /** The canonical address for a production Workers deploy, else the address people use. */
  liveUrl: string;
  liveArtifact: LiveCheck;
  /** A production Workers deploy only: what www does. Null otherwise. */
  www: WwwForwarding | null;
}

export declare function publishToCloudflare(input: {
  root: string;
  dist?: string;
  kind?: CloudflareKind;
  preview?: boolean;
  createProject?: boolean;
  mainSha: string;
  bundleHash: string;
  isoNow: string;
  extraMessage?: string;
  manifest: ArtifactManifestLike;
  changedShipped?: string[];
  fullVerify?: boolean;
  host?: DeployHost;
  deps?: CloudflareDeps;
}): Promise<CloudflarePublishResult>;
