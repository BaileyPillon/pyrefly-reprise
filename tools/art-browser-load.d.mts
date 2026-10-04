/** Types for `tools/art-browser-load.mjs` (release 38, "r38-bytes"): every art file of a build loads in WebKit and in Chromium. */

export type LoadEngine = 'chromium' | 'webkit' | 'firefox';
export const ENGINES: readonly LoadEngine[];
export const DEFAULT_ENGINES: readonly LoadEngine[];

export interface LoadItem {
  /** The file as the build ships it, `art/a/b.webp`. */
  rel: string;
  /** The master PNG it ships for (null for an image that is not a master). */
  master: string | null;
  /** `webp`, `png` (recompressed), `copy` (the master's own bytes) or `other`. */
  kind: string;
  /** The master's size (null for `other`): the shipped file must decode to exactly this. */
  width: number | null;
  height: number | null;
}

export interface LoadRow {
  ok: boolean;
  w?: number;
  h?: number;
  why?: string;
}

export interface LoadPlate {
  plate: string;
  scale: '1x' | '2x';
  parts: Array<{ name: string; rel: string | null }>;
}

export function pngSize(file: string): { width: number; height: number } | null;
export function planLoads(options: { distDir: string; publicDir: string }): { art: LoadItem[]; others: LoadItem[]; problems: string[] };
export function platesOf(distDir: string, art: readonly LoadItem[]): LoadPlate[];
/** Why one file failed in one engine, or null when it loaded and decoded at its master's size. */
export function problemOf(item: LoadItem, row: LoadRow | null | undefined): string | null;

export interface LoadEngineRun {
  version?: string;
  rows?: Array<LoadRow | null>;
  ms?: number;
  /** The page stopped before every file was loaded. */
  error?: string;
  /** The engine could not start. */
  unavailable?: string;
}

export interface LoadEngineReport {
  ok: boolean;
  version?: string;
  files?: number;
  loaded?: number;
  failed?: number;
  plates?: { total: number; living: number };
  ms?: number;
  unavailable?: string;
}

export interface ArtLoadResult {
  ok: boolean;
  checked: { art: number; others: number; webp: number; png: number; copy: number };
  engines: Record<string, LoadEngineReport>;
  problems: string[];
  ms: number;
  items: LoadItem[];
  rows: Record<string, Array<LoadRow | null>>;
}

export function verifyArtLoads(options: {
  distDir: string;
  publicDir: string;
  engines?: readonly LoadEngine[];
  jobs?: number;
  chunk?: number;
  port?: number;
  log?: (line: string) => void;
  /** The seam for tests; defaults to real Playwright browsers. */
  runEngine?: (spec: { engine: LoadEngine; baseUrl: string; items: LoadItem[]; jobs: number; chunk: number; log: (line: string) => void }) => Promise<LoadEngineRun>;
}): Promise<ArtLoadResult>;
export function formatLoadReport(result: ArtLoadResult): string;
