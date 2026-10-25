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

const cache = new Map<string, Extents | null>();
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

/** A texture's extents from its painting's alpha, cached per texture; null where it cannot be read (no DOM, a released image). */
export function readExtents(tex: Texture | null): Extents | null {
  const key = extentsKey(tex);
  if (key === null) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  let e: Extents | null = null;
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
  return e;
}
