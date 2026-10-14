export interface LocalPathHit {
  line: number;
  column: number;
  kind: 'drive' | 'profile';
}

export interface BuildPathHit extends LocalPathHit {
  file: string;
}

export interface BuildPathReport {
  scanned: number;
  hits: BuildPathHit[];
}

export const DRIVE_PATH: RegExp;
export const DRIVE_PATH_IN_CODE: RegExp;
export const PROFILE_PATH: RegExp;
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
export function listTextFiles(root: string): { rel: string; full: string }[];
export function scanBuildForLocalPaths(root: string): BuildPathReport;
export function formatLocalPathReport(report: BuildPathReport, limit?: number): string;
