/** Types for `tools/art-derive-lib.mjs` (release 38, "r38-bytes"): lossless WebP derived from the shipped painted art. */

export type ArtScope = 'off' | 'partial' | 'safe' | 'all';
export type ArtAlpha = 'opaque' | 'binary' | 'translucent';
export type ArtKind = 'webp' | 'png' | 'copy';

export const SCOPES: readonly ArtScope[];
export const SCOPE_ENV: 'PYREFLY_ART_WEBP';
export const CACHE_ENV: 'PYREFLY_ART_CACHE';
export const DEFAULT_CACHE: string;
export const DERIVED_REPORT: 'art/derived.json';
export const ENCODER: { readonly id: string; readonly options: Readonly<Record<string, unknown>> };

export function sha256(buf: Uint8Array): string;
/** sharp, loaded once. */
export function getSharp(): any;
export function resolveScope(value?: string): ArtScope;
export function resolveCache(value?: string): string;
export function inScope(rel: string, scope: ArtScope, alpha?: ArtAlpha | null): boolean;
export function alphaClassOf(rgba: Uint8Array): ArtAlpha;
export function webpName(rel: string): string;
export function listMasterPngs(publicDir: string): Array<{ rel: string; full: string; bytes: number }>;
export function pngChunkTypes(buf: Uint8Array): string[];
export function pixelsOf(input: Uint8Array | string): Promise<{ width: number; height: number; channels: number; hash: string }>;
export function refusalFor(png: Uint8Array): Promise<string | null>;
export function chooseKind(masterBytes: number, webpBytes: number, recompressedBytes?: number | null): ArtKind;
export function pool<T, R>(items: readonly T[], jobs: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
export function cacheTag(): string;

export interface ArtPlanEntry {
  rel: string;
  masterBytes: number;
  kind: ArtKind;
  shippedRel: string;
  shippedBytes: number;
  rgba: string | null;
  file: string | null;
  alpha?: ArtAlpha;
  note?: string;
}

export interface ArtPlan {
  scope: ArtScope;
  cacheDir: string;
  encoder: string;
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
export function derivedReport(plan: ArtPlan): { version: number; files: Array<{ path: string; kind: ArtKind; shipped?: string; master: number; bytes: number; rgba?: string; note?: string }> } & Record<string, unknown>;
export function applyPlan(outDir: string, plan: ArtPlan): { webp: number; png: number; skipped: string[] };
