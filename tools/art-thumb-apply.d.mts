/** Types for `tools/art-thumb-apply.mjs` (r44-thumbs): the names, the bundle's map, the `art/derived.json` section and the build output side of the strip thumbnails. */

export type ThumbKind = 'webp' | 'png' | 'none';

export const THUMB_INFIX: '.thumb';
export const THUMB_FILE: RegExp;
/** `art/a/b.png` + `webp` -> `art/a/b.thumb.webp`. */
export function thumbName(rel: string, kind: 'webp' | 'png'): string;

export interface ThumbEntry {
  /** The master, `art/<...>.png`. */
  rel: string;
  kind: ThumbKind;
  /** The thumbnail's shipped name (absent when `kind` is `none`). */
  thumbRel?: string;
  width?: number;
  height?: number;
  masterBytes?: number;
  /** The thumbnail file's size in bytes. */
  bytes?: number;
  /** sha256 of the thumbnail's decoded 8-bit RGBA. */
  rgba?: string;
  alpha?: 'opaque' | 'binary' | 'translucent';
  /** The cached file the build copies (absent when `kind` is `none`). */
  file?: string | null;
  /** Why a master has no thumbnail. */
  note?: string;
}

export interface ThumbPlan {
  /** Set (to the reason) when the build was told to make none. */
  off?: string;
  spec: { id: string; kernel: string; sceneWidth: number; figureHeight: number };
  encoder: string;
  entries: ThumbEntry[];
  ms: number;
}

export function shippedThumbs(plan: ThumbPlan): ThumbEntry[];
/** The master -> thumbnail map the bundle reads as `__PYREFLY_ART_THUMBS__`. */
export function thumbMap(plan: ThumbPlan): Record<string, string>;
export interface ThumbRecord {
  enabled: boolean;
  reason?: string;
  spec?: ThumbPlan['spec'];
  encoder?: string;
  counts?: { webp: number; png: number; none: number };
  bytes?: { masters: number; thumbs: number };
  note?: string;
  files?: Array<{ path: string; kind: ThumbKind; master: number; thumb?: string; width?: number; height?: number; bytes?: number; rgba?: string; note?: string }>;
}
export function thumbReport(plan: ThumbPlan): ThumbRecord;
export function applyThumbs(outDir: string, plan: ThumbPlan): { written: number; bytes: number };
