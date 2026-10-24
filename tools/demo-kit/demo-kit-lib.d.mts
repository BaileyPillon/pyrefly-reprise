export const HOST_READ_FILES: readonly string[];
export const DEMO_QUERY: string;
export const DEFAULT_PORT: number;
export const CONTENT_TYPES: Readonly<Record<string, string>>;
export function contentTypeOf(path: string): string;
export function cacheControlOf(urlPath: string): string;
export function safeJoin(root: string, urlPath: string): string | null;
export function parseRange(header: string | undefined | null, size: number): { start: number; end: number } | 'unsatisfiable' | null;
export function demoUrl(port: number, extra?: string): string;
export const PACK_QUERY: string;
export function boothUrl(port: number, opts?: { plain?: boolean }): string;
export function isPlainBoothUrl(url: string): boolean;
export function browserArgs(opts: { url: string; profileDir: string; kiosk?: boolean }): string[];
export const SAVE_PATHS: readonly string[];
export function browserCandidates(env?: Record<string, string | undefined>): Array<{ name: 'chrome' | 'edge'; path: string }>;
export function findBrowser(
  exists: (path: string) => boolean,
  prefer?: 'chrome' | 'edge' | undefined,
  env?: Record<string, string | undefined>,
): { name: 'chrome' | 'edge'; path: string } | null;
export function kitHome(env?: Record<string, string | undefined>): string;
export function defaultSiteDir(env?: Record<string, string | undefined>): string;
export function sha256hex(buf: Uint8Array): string;
export function formatBytes(n: number): string;
export function tierOf(path: string): number;
export function urlFor(base: string, path: string): string;
export interface ArtifactManifest {
  manifestVersion?: number;
  count?: number;
  totalBytes?: number;
  artifactHash?: string;
  files: Record<string, { sha256: string; bytes: number }>;
}
export function selectFiles(manifest: ArtifactManifest, opts?: { only?: string[]; maxTier?: number; limit?: number }): string[];
export function bytesOf(manifest: ArtifactManifest, paths: string[]): number;
export function destPath(dir: string, manifestPath: string): string | null;
