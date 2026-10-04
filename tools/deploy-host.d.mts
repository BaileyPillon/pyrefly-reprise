/**
 * Types for `tools/deploy-host.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import
 * it directly. Same arrangement as `deploy-classify.d.mts`: this file declares the module's whole
 * public surface, so an export added over there needs a line here.
 */

export type CloudflareKind = 'workers' | 'pages';

export interface DeployHost {
  readonly name: 'github' | 'cloudflare';
  readonly label: string;
  /** Where the build is served from: '/pyrefly-reprise/' on GitHub Pages, '/' on Cloudflare. */
  readonly base: string;
  /** Known for GitHub Pages; null for Cloudflare until the first deploy reports it. */
  readonly liveUrl: string | null;
  /** Cloudflare only: which product serves the site by default. */
  readonly kind?: CloudflareKind;
  readonly workerName?: string;
  readonly previewWorkerName?: string;
  readonly pagesProject?: string;
  readonly pagesProductionBranch?: string;
  readonly pagesPreviewBranch?: string;
  readonly wranglerConfig?: string;
}

export declare const DEFAULT_HOST: 'github' | 'cloudflare';
export declare const HOSTS: Readonly<{ github: DeployHost; cloudflare: DeployHost }>;
export declare const CLOUDFLARE_KINDS: Readonly<Record<CloudflareKind, string>>;

export interface CloudflareLimits {
  readonly maxFileBytes: number;
  readonly maxFiles: number;
  readonly paidMaxFiles: number;
}
export declare const CLOUDFLARE_LIMITS: CloudflareLimits;
export declare const CLOUDFLARE_CONFIG_FILES: readonly string[];
export declare const PREVIEW_LOG_NAME: string;

/** The Worker or Pages project a run deploys to. */
export declare function siteNameFor(host: DeployHost, kind: CloudflareKind | null, preview: boolean): string;

export type HostArgsResult =
  | {
    ok: true;
    host: DeployHost;
    /** Cloudflare only; null for GitHub Pages. */
    kind: CloudflareKind | null;
    preview: boolean;
    fullVerify: boolean;
    createProject: boolean;
    refusal: string | null;
  }
  | { ok: false; error: string };

/** Read `--host`, `--kind`, `--preview`, `--full-verify` and `--create-project` from the parsed argv (`parseArgs` of deploy-pages.mjs). */
export declare function parseHostArgs(args: Record<string, string | boolean | undefined>): HostArgsResult;

/** The extra environment `vite build` needs for this host. */
export declare function hostBuildEnv(host: DeployHost): Record<string, string>;

/** Problems with a built index.html for this base; empty when it is right. */
export declare function checkBuildBase(html: string, base: string): string[];

export interface UploadFile {
  path: string;
  bytes: number;
}

/** The files wrangler would upload from a directory for this kind, and the root config files it would not. */
export declare function listUploadFiles(dir: string, kind?: CloudflareKind): { files: UploadFile[]; configFiles: string[] };

export interface UploadLimitsReport {
  ok: boolean;
  fileCount: number;
  totalBytes: number;
  largest: UploadFile[];
  problems: string[];
}
export declare function checkUploadLimits(files: UploadFile[], limits?: CloudflareLimits): UploadLimitsReport;

/** What would be uploaded that the manifest does not list, and what the manifest lists that is not there. */
export declare function compareUploadSet(
  files: UploadFile[],
  manifestFiles: Record<string, unknown>,
  manifestName: string,
): { unlisted: string[]; missing: string[] };

export declare function formatPreviewLogLine(input: {
  isoNow: string;
  mainSha: string;
  bundleHash: string;
  artFileCount: number;
  host: string;
  kind: string;
  site: string;
  url: string;
  overrideUsed?: boolean;
}): string;

export declare function describeHostPlan(
  host: DeployHost,
  options?: { kind?: CloudflareKind | null; preview?: boolean; fullVerify?: boolean; createProject?: boolean },
): string[];
