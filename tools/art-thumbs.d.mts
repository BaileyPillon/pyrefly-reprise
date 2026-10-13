import type { ThumbPlan } from './art-thumb-apply.mjs';

/** Types for `tools/art-thumbs.mjs` (r44-thumbs): the small derived copies of the paintings the chapter board's strips paint. */

export { THUMB_FILE, THUMB_INFIX, applyThumbs, shippedThumbs, thumbMap, thumbName, thumbReport } from './art-thumb-apply.mjs';
export type { ThumbEntry, ThumbKind, ThumbPlan, ThumbRecord } from './art-thumb-apply.mjs';

export const THUMB_SPEC: { readonly id: string; readonly kernel: string; readonly sceneWidth: number; readonly figureHeight: number };
export const THUMBS_ENV: 'PYREFLY_ART_THUMBS';
export const STRIP_LIST: 'src/data/art/strip-art.json';
export function resolveThumbSwitch(value?: string): 'on' | 'off';
/** The masters of the strip list: sorted, unique, each a scene backdrop or a character's idle. */
export function readStripList(file: string): string[];
export function thumbTarget(rel: string, width: number, height: number): { width: number; height: number; reduced: boolean };
export const thumbCacheTag: () => string;
export function referenceThumb(
  input: Uint8Array | string,
  rel: string,
): Promise<{ width: number; height: number; data: Buffer; hash: string; facts: { alpha: 'opaque' | 'binary' | 'translucent'; transparent: number; hidden: number }; masterWidth: number; masterHeight: number; reduced: boolean }>;
export function planThumbs(options: {
  publicDir: string;
  cacheDir?: string;
  listFile?: string | null;
  list?: readonly string[] | null;
  jobs?: number;
  log?: (message: string) => void;
  /** True, or the reason as a string: make none. */
  off?: boolean | string;
}): Promise<ThumbPlan>;
