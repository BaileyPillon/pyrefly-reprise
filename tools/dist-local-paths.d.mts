export interface LocalPathHit {
  line: number;
  column: number;
  kind: 'drive' | 'profile';
}

export interface BuildPathHit {
  file: string;
  line: number;
  column: number;
  /**
   * `drive` and `profile`: a local path. `link`: a link to claude.ai (r47-rc, FOC46-06). `sidecar-key`: a key of a painting sidecar that is not on
   * the list; `sidecar-shape`: a painting sidecar that is not a JSON object.
   */
  kind: 'drive' | 'profile' | 'link' | 'sidecar-key' | 'sidecar-shape';
  /** The key's name, for a `sidecar-key` hit whose key is a plain identifier (a path or a value is never in a hit). */
  key?: string;
}

export interface BuildPathReport {
  scanned: number;
  hits: BuildPathHit[];
}

export const DRIVE_PATH: RegExp;
export const DRIVE_PATH_IN_CODE: RegExp;
export const PROFILE_PATH: RegExp;
/** A link to claude.ai (a host name, with or without a scheme or a subdomain). */
export const PRIVATE_LINK: RegExp;
/** The source of the expression that matches a whole local path (drive or profile); build it with `new RegExp(LOCAL_PATH_SPAN, 'g')`. */
export const LOCAL_PATH_SPAN: string;
export const TEXT_EXTENSIONS: ReadonlySet<string>;
export const CODE_EXTENSIONS: ReadonlySet<string>;

/** The name a local path is replaced by: its last name (a full stop after the path kept), `Users` for a profile folder itself. */
export function leafOfPath(span: string): string;
/** `text` with every local path replaced by its last name. With `count`, the number of paths replaced too. */
export function redactLocalPaths(text: string): string;
export function redactLocalPaths(text: string, options: { count: true }): { text: string; count: number };
/** Every local path in `text` (never the path itself). `code` selects the stricter drive rule for bundles and stylesheets. */
export function findLocalPaths(text: string, options?: { code?: boolean }): LocalPathHit[];
/** Every link to claude.ai in `text` (never the link itself). */
export function findPrivateLinks(text: string): { line: number; column: number; kind: 'link' }[];
export function listTextFiles(root: string): { rel: string; full: string }[];
export function scanBuildForLocalPaths(root: string): BuildPathReport;
export function formatLocalPathReport(report: BuildPathReport, limit?: number): string;
