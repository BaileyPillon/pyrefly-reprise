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
  fetchImpl?: (url: string, init?: Record<string, unknown>) => Promise<{ status: number; text(): Promise<string> }>;
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

export interface CloudflarePublishResult {
  kind: CloudflareKind;
  /** The Worker or the Pages project that was deployed to. */
  siteName: string;
  versionId: string | null;
  urls: string[];
  liveUrl: string;
  liveArtifact: LiveCheck;
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
