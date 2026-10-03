/** Types for `tools/art-derive-lib.mjs` (release 38, "r38-bytes"): lossless WebP derived from the shipped painted art. */

export type ArtScope = 'off' | 'partial' | 'safe' | 'exact' | 'all';
export type ArtAlpha = 'opaque' | 'binary' | 'translucent';
export type ArtKind = 'webp' | 'png' | 'copy';

export const SCOPES: readonly ArtScope[];
/** What ships when `PYREFLY_ART_WEBP` is unset: `exact` (a WebP only where every decoder draws it the same as the PNG). */
export const DEFAULT_SCOPE: ArtScope;
export const SCOPE_ENV: 'PYREFLY_ART_WEBP';
export const CACHE_ENV: 'PYREFLY_ART_CACHE';
export const DEFAULT_CACHE: string;
export const DERIVED_REPORT: 'art/derived.json';
export const ENCODER: { readonly id: string; readonly options: Readonly<Record<string, unknown>> };
/** The PNG pass: maximum effort, adaptive filtering, no palette, no metadata chunks. */
export const PNG_ENCODER: { readonly id: string; readonly options: Readonly<Record<string, unknown>> };
export const ALPHA_CLASSES: readonly ArtAlpha[];

export function sha256(buf: Uint8Array): string;
/** sharp, loaded once. */
export function getSharp(): any;
export function resolveScope(value?: string): ArtScope;
export function resolveCache(value?: string): string;
/** `alpha` and `hidden` (fully transparent texels that still carry colour) are `alphaInfoOf` of the master; `safe` and `exact` read them, and unknown is a no. */
export function inScope(rel: string, scope: ArtScope, alpha?: ArtAlpha | null, hidden?: number | null): boolean;
export function alphaClassOf(rgba: Uint8Array): ArtAlpha;
export function alphaInfoOf(rgba: Uint8Array): { alpha: ArtAlpha; transparent: number; hidden: number };
/** Opaque, or only alpha 0 and 255 with nothing hidden under alpha 0: premultiplying alpha is the identity on every pixel. */
export function decoderIndependent(alpha: ArtAlpha | null | undefined, hidden: number | null | undefined): boolean;
export function webpName(rel: string): string;
export function listMasterPngs(publicDir: string): Array<{ rel: string; full: string; bytes: number }>;
export function pngChunkTypes(buf: Uint8Array): string[];
export function pixelsOf(input: Uint8Array | string, options?: { facts?: boolean }): Promise<{ width: number; height: number; channels: number; hash: string; alpha?: ArtAlpha; transparent?: number; hidden?: number }>;
export function refusalFor(png: Uint8Array): Promise<string | null>;
/** Throws unless `buf` decodes to the master's picture (`master0` is `pixelsOf` of the master): size and all four channels of every pixel, by sha256. */
export function proveSame(rel: string, buf: Uint8Array, what: string, master0: { width: number; height: number; hash: string }): Promise<void>;
export function chooseKind(masterBytes: number, webpBytes: number, recompressedBytes?: number | null): ArtKind;
export function pool<T, R>(items: readonly T[], jobs: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
export function cacheTag(): string;
export function pngCacheTag(): string;

export interface ArtPlanEntry {
  rel: string;
  masterBytes: number;
  kind: ArtKind;
  shippedRel: string;
  shippedBytes: number;
  rgba: string | null;
  file: string | null;
  alpha?: ArtAlpha;
  /** Fully transparent texels of the master that still carry colour (with `alpha`, under `safe` and `exact`). */
  hidden?: number;
  note?: string;
}

export interface ArtPlan {
  scope: ArtScope;
  cacheDir: string;
  encoder: string;
  /** Under `exact`: the PNG pass and the libraries it ran on. */
  pngEncoder?: string;
  entries: ArtPlanEntry[];
  ms: number;
  counts: { webp: number; png: number; copy: number };
  bytes: { masters: number; shipped: number; saved: number };
}

export function planArtDerivation(options: {
  publicDir: string;
  cacheDir?: string;
  scope?: ArtScope;
  jobs?: number;
  log?: (message: string) => void;
}): Promise<ArtPlan>;
export function shippedList(plan: ArtPlan): string[];
export function derivedReport(plan: ArtPlan): { version: number; files: Array<{ path: string; kind: ArtKind; shipped?: string; master: number; bytes: number; rgba?: string; alpha?: ArtAlpha; hidden?: number; note?: string }> } & Record<string, unknown>;
export function applyPlan(outDir: string, plan: ArtPlan): { webp: number; png: number; skipped: string[] };
