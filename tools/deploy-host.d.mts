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
  /** The address of the host: https://echoesofspira.com/ on Cloudflare, the old GitHub Pages address on GitHub. */
  readonly liveUrl: string | null;
  /** GitHub Pages since the switch: still deployable with an explicit --host, as a legacy deploy that records nothing the critic reads as the live build. */
  readonly legacy?: boolean;
  /** Cloudflare only: which product serves the site by default. */
  readonly kind?: CloudflareKind;
  readonly workerName?: string;
  readonly previewWorkerName?: string;
  readonly pagesProject?: string;
  readonly pagesProductionBranch?: string;
  readonly pagesPreviewBranch?: string;
  /** The production Worker's config, with its Custom Domain route. */
  readonly wranglerConfig?: string;
  /** The preview Worker's config: no routes, so a preview can never move the Custom Domain. */
  readonly previewWranglerConfig?: string;
  /** The Custom Domain of the production Worker (the apex), and the www host a dashboard Redirect Rule forwards to it. */
  readonly customDomain?: string;
  readonly wwwHost?: string;
}

export declare const DEFAULT_HOST: 'github' | 'cloudflare';
export declare const HOSTS: Readonly<{ github: DeployHost; cloudflare: DeployHost }>;
/** The address of the default host: what every tool that needs "the live URL" reads. */
export declare const LIVE_URL: string;
export declare const CLOUDFLARE_KINDS: Readonly<Record<CloudflareKind, string>>;

export interface CloudflareLimits {
  readonly maxFileBytes: number;
  readonly maxFiles: number;
  readonly paidMaxFiles: number;
}
export declare const CLOUDFLARE_LIMITS: CloudflareLimits;
export declare const CLOUDFLARE_CONFIG_FILES: readonly string[];
/** The one `_headers` a Cloudflare build may ship: the hashed bundles under /assets/ get this Cache-Control, nothing else is touched. */
export declare const VETTED_HEADERS: Readonly<{ patterns: readonly string[]; cacheControl: string }>;
/** The problems that keep a `_headers` text from being the vetted one (none: it is vetted). */
export declare function checkHeadersFile(text: string): string[];
export declare const PREVIEW_LOG_NAME: string;
export declare const LEGACY_LOG_NAME: string;

/** The Worker or Pages project a run deploys to. */
export declare function siteNameFor(host: DeployHost, kind: CloudflareKind | null, preview: boolean): string;

/** The wrangler config (relative to the repo root) a Workers run uses: the preview Worker never reads the production file. */
export declare function wranglerConfigFor(host: DeployHost, preview: boolean): string;

export type HostArgsResult =
  | {
    ok: true;
    host: DeployHost;
    /** Cloudflare only; null for GitHub Pages. */
    kind: CloudflareKind | null;
    preview: boolean;
    /** A production-style deploy to a legacy host (the old GitHub Pages address): logged in docs/legacy-deploys.log, never as the live build. */
    legacy: boolean;
    fullVerify: boolean;
    createProject: boolean;
    refusal: string | null;
  }
  | { ok: false; error: string };

/** Read `--host`, `--kind`, `--preview`, `--full-verify` and `--create-project` from the parsed argv (`parseArgs` of deploy-pages.mjs). */
export declare function parseHostArgs(args: Record<string, string | boolean | undefined>): HostArgsResult;

/** What a request for this host means: nothing special, a legacy deploy (the old address), or a refusal (a non-default host that is not legacy). */
export declare function hostRequestRole(
  host: Pick<DeployHost, 'name' | 'label' | 'legacy'>,
  options?: { preview?: boolean; defaultHost?: 'github' | 'cloudflare' },
): { legacy: boolean; refusal: string | null };

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

export declare function formatLegacyLogLine(input: {
  isoNow: string;
  mainSha: string;
  bundleHash: string;
  artFileCount: number;
  host: string;
  url: string;
  overrideUsed?: boolean;
}): string;

export declare function describeHostPlan(
  host: DeployHost,
  options?: { kind?: CloudflareKind | null; preview?: boolean; fullVerify?: boolean; createProject?: boolean; legacy?: boolean },
): string[];
