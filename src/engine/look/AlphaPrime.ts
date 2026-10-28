/**
 * The look's alpha reads of a painting, shared so the demo's prebuild can make them behind the picker (lane "prebuild", 2026-10-24; both games; the demo looks only).
 *
 * `LookBold.extentsOf` reads a figure's extents the first time each of its paintings is drawn: a 128 x 128 `drawImage` and `getImageData` of a 1.5 to 3 megapixel painting, 30 to 40 ms each on the served
 * build, five of them in the fight's first 2 s (frames of 100 to 400 ms). The answer depends on nothing but the texture, so it is cached by texture (it always was, per rig; now for the page) and
 * `app/demo/prebuildFigures.ts` asks for it ahead, one painting a task. The same code, the same canvas size, the same numbers.
 *
 * No game rule here; the extents are the look's own (`LookBoldConfig.baseExtents`).
 */
import type { Texture } from 'three';
import { baseExtents, type Extents } from './LookBoldConfig.ts';
import { EXTENTS_THUMB, standInFor, thumbOf, thumbPending, thumbWhy } from './AlphaThumb.ts';

const cache = new Map<string, Extents | null>();
/** MF-02: the extents last given for a texture, whatever master it held then: a painting is the same painting at every tier, so they stand in while the new master's field is on its way. */
const lastOf = new WeakMap<object, Extents | null>();
/** How the extents were found, for the debug API and the lane's jobs (`__pyrefly.art.stats().alpha`). */
export const extentsReads = { thumb: 0, sync: 0, stoodIn: 0, syncRefused: 0, syncPending: 0 };
let canvas: HTMLCanvasElement | null = null;

/** The cache key of a texture's painting, or null while the image is not there (a placeholder): the caller's default stands in. */
export function extentsKey(tex: Texture | null): string | null {
  const img = tex?.image as { width: number; height: number } | undefined;
  if (!tex || !img || !(img.width > 8) || !(img.height > 8)) return null;
  return `${tex.uuid}:${img.width}x${img.height}`;
}

/** Has this texture's extents been read? */
export function hasExtents(tex: Texture | null): boolean {
  const key = extentsKey(tex);
  return key !== null && cache.has(key);
}

/**
 * A texture's extents from its painting's alpha, cached per texture; null where it cannot be read (no DOM, a released image). MF-02: when the loader's worker has already made the painting's 128 x 128 field
 * (`AlphaThumb.ts`: the same draw on an ImageBitmap, off the page, within a cell of 128 of the page's own) the extents come from it and the page reads nothing; while a field is on its way the texture's previous
 * extents stand in (a master swapped in for the same painting); a painting that has no field and none coming is read here as it always was.
 */
export function readExtents(tex: Texture | null): Extents | null {
  const key = extentsKey(tex);
  if (key === null) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  let e: Extents | null = null;
  const thumb = thumbOf(tex!.image, EXTENTS_THUMB);
  if (thumb) {
    e = baseExtents(thumb, 128, 128);
    if (cache.size > 400) cache.clear();
    cache.set(key, e);
    lastOf.set(tex!, e);
    extentsReads.thumb++;
    return e;
  }
  if (thumbPending(tex!.image, EXTENTS_THUMB)) {
    // not cached, so the next frame asks again and the field, once it has landed, is the answer: the texture's own previous extents first (a master swapped in for the same painting), else the field of another master of the painting
    if (lastOf.has(tex!)) {
      extentsReads.stoodIn++;
      return lastOf.get(tex!) ?? null;
    }
    const alt = standInFor(tex!.image, EXTENTS_THUMB);
    if (alt) {
      extentsReads.stoodIn++;
      return baseExtents(alt, 128, 128);
    }
  }
  extentsReads.sync++;
  const why = thumbWhy(tex!.image);
  if (why === 'refused') extentsReads.syncRefused++;
  else if (why === 'pending') extentsReads.syncPending++; // a field on its way and nothing to stand in for it
  try {
    const img = tex!.image as CanvasImageSource;
    const c = (canvas ??= document.createElement('canvas'));
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.clearRect(0, 0, 128, 128);
      ctx.drawImage(img, 0, 0, 128, 128);
      const d = ctx.getImageData(0, 0, 128, 128).data;
      const a = new Uint8Array(128 * 128);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3]!;
      e = baseExtents(a, 128, 128);
    }
  } catch {
    e = null;
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, e);
  lastOf.set(tex!, e);
  return e;
}
