import { artScalesFor, pixelUrlFor, scaleOfUrl } from './ArtTier.ts';
import { fallbackScale } from './ArtBudget.ts';
import { manifestKnowsAsset } from './ArtManifest.ts';
import { fetchWithOneRetry } from './fetchRetry.ts';
import type { LoadOptions } from './ArtMeasure.ts';

/**
 * The art governor's load of one master, ready to be staged (release 39.1, "r391-stalls"; both games, shared plumbing, no game content).
 *
 * `PaintedArt.loadPixels` hands back a decoded `<img>`, and Three uploads an `<img>` with straight alpha by decoding the PNG again on the main thread inside
 * `texSubImage2D` (145 ms for a 4x figure, 200 ms for a 2x backdrop; `TextureStager.ts`). The bitmap route decodes once and off the thread, but only from the file's
 * bytes: `createImageBitmap(<img>)` decodes synchronously. So the file is fetched once as a Blob and read two ways:
 *
 *  - an `<img>` over an object URL: the handle `texture.image` keeps (its size, what a restored WebGL context re-uploads from, and what the effects that read a painting's alpha
 *    through a 2D canvas draw, `fx/mix/breathRig.ts`, `geometry.ts`). It is decoded off the thread, as `PaintedArt.tryLoadImage` always did, so those reads stay cheap; the upload does not use it;
 *  - an `ImageBitmap` (`premultiplyAlpha: 'none'`, `colorSpaceConversion: 'none'`, `imageOrientation: 'flipY'`): the pixels, exactly as the legacy upload holds them
 *    (the run-time probe, `StageProbe.ts`, and the identity test prove it), decoded off the main thread.
 *
 * **Priority.** A background load (a sibling's upgrade, a warm-up) is fetched at `priority: 'low'`, as the `<img>` it replaces was: an image element's request is low priority, a
 * `fetch` defaults to high, and on a slow link the speculative masters (about 100 MB in a Chapter I opening) must not crowd out the base paintings the first menu waits for. A
 * warm-up of a file the page has fetched once reads it from the cache (`cache: 'force-cache'`) instead of asking the server to revalidate it.
 *
 * Same fall-back chain as `loadPixels`: one retry of a 5xx or a failed request when the manifest says the file ships (a 404 is a real answer and stays fast), then the
 * next master down, then the approved file; a master that will not load is never a missing painting. Where no bitmap could be made the image is decoded as before and
 * the caller swaps the old way.
 */

export interface LoadedMaster {
  image: HTMLImageElement;
  scale: number;
  /** The decoded pixels, or null (no `createImageBitmap`, or it refused this file): swap `image` the old way. The caller closes it. */
  bitmap: ImageBitmap | null;
}

/** The options the staged upload is proven exact with (`StageProbe.ts`). */
export const BITMAP_OPTIONS: ImageBitmapOptions = { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'flipY' };

const warned = new Set<string>();

function warnMiss(url: string): void {
  if (warned.has(url)) return;
  warned.add(url);
  console.warn(`[painted] missing master: ${url} — falling back to the next smaller file.`);
}

/** How a load is fetched (see the doc above). */
export function requestInit(opts?: LoadOptions): RequestInit {
  const init: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {};
  if (opts && !opts.urgent) init.priority = 'low';
  if (opts?.warm) init.cache = 'force-cache';
  return init;
}

/** The file's bytes, or null on a miss. A 5xx or a thrown request is retried once when the manifest says the file ships; a 4xx is not. */
async function fetchBlob(url: string, opts?: LoadOptions): Promise<Blob | null> {
  try {
    const ships = (await manifestKnowsAsset(url)) === true;
    const init = requestInit(opts);
    const res = ships ? await fetchWithOneRetry(url, init) : await fetch(url, init);
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

/** An `<img>` over the blob, loaded and decoded off the main thread. The object URL is revoked once it has loaded: the element keeps what it read. */
async function blobToImage(blob: Blob): Promise<HTMLImageElement | null> {
  const href = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = (): void => resolve();
      img.onerror = (): void => reject(new Error('the image did not load'));
      img.src = href;
    });
    await img.decode?.().catch(() => undefined); // in step with the bitmap's own decode: two worker threads, none of the main thread
    return img;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(href);
  }
}

async function toBitmap(blob: Blob): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    return await createImageBitmap(blob, BITMAP_OPTIONS);
  } catch {
    return null;
  }
}

async function readMaster(url: string, opts?: LoadOptions): Promise<{ image: HTMLImageElement; bitmap: ImageBitmap | null } | null> {
  const blob = await fetchBlob(url, opts);
  if (!blob) {
    warnMiss(url);
    return null;
  }
  const [image, bitmap] = await Promise.all([blobToImage(blob), toBitmap(blob)]);
  if (!image) {
    bitmap?.close();
    warnMiss(url);
    return null;
  }
  return { image, bitmap };
}

/** The pixels of the master of `wanted` times (or the nearest one below that ships, or the approved file), with the bitmap they are staged from. */
export async function loadMaster(url: string, wanted: number, opts?: LoadOptions): Promise<LoadedMaster | null> {
  let px = await pixelUrlFor(url, wanted);
  const available = (await artScalesFor(url)) ?? [];
  for (let guard = 0; guard < 4; guard++) {
    const scale = scaleOfUrl(px);
    const got = await readMaster(px, opts);
    if (got) return { ...got, scale };
    if (scale === 1) return null;
    px = await pixelUrlFor(url, fallbackScale(scale, available));
  }
  const got = await readMaster(url, opts);
  return got ? { ...got, scale: 1 } : null;
}
