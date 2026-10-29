/**
 * How the battle preload's lookahead brings a pose's file in (load diet, lane "load-diet", 2026-10-29; both games, shared loading plumbing).
 *
 * Phase 4 of `battlePreload.ts` downloads a few poses ahead of the one-at-a-time decode. It used to do that with `fetch(url).blob()` and let the decode ask for the
 * same file again through an `<img>` (`PaintedArt.tryLoadImage`): the G4 run of round 30b (`4c-reqlog-ch1.json`, cache off) saw 58 files requested twice, 46 MB
 * of the 170 MB, and with the cache on every second ask is still a conditional request and a round trip (the art is served `max-age=0, must-revalidate`).
 * Here the lookahead is an `<img>` of its own, held until the decode of that file is done: the browser's memory cache then answers the decode's `<img>` with the
 * request already in flight or finished, no second request. Nothing is decoded or drawn from it. With the diet off (`?loaddiet=off`) it is the `fetch` it was.
 */
import { loadDiet } from '../../engine/LoadDiet.ts';

/** The lookahead's images by the pose's own URL: alive from the ask to the end of that pose's decode. */
const held = new Map<string, HTMLImageElement>();

/** Pull a file into the HTTP cache without holding on to it (release 67's way; R61 PR-0495: low priority, the poses are drawn later). */
function viaFetch(url: string, signal: AbortSignal): Promise<void> {
  return fetch(url, { signal, priority: 'low' } as RequestInit)
    .then((res) => (res.ok ? res.blob() : null))
    .then(
      () => undefined,
      () => undefined,
    );
}

/**
 * Start bringing `pixelUrl` (the file the painting at `key` will be drawn from) in at low priority. Resolves when it has arrived, failed or been cancelled;
 * never rejects. `key` is what {@link releasePrefetch} is given when the decode of that pose is done.
 */
export function prefetchPose(key: string, pixelUrl: string, signal: AbortSignal): Promise<void> {
  if (!loadDiet() || typeof Image === 'undefined') return viaFetch(pixelUrl, signal);
  if (held.has(key)) return Promise.resolve();
  const img = new Image();
  img.decoding = 'async';
  img.crossOrigin = 'anonymous'; // the decode's `<img>` is three's `ImageLoader`, which asks `crossOrigin = 'anonymous'`: a different request mode would not share this request in the memory cache
  (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low';
  held.set(key, img);
  return new Promise<void>((resolve) => {
    const done = (): void => resolve();
    img.onload = done;
    img.onerror = done;
    signal.addEventListener(
      'abort',
      () => {
        if (held.get(key) === img) held.delete(key);
        img.onload = img.onerror = null;
        if (typeof img.removeAttribute === 'function') img.removeAttribute('src');
        resolve();
      },
      { once: true },
    );
    img.src = pixelUrl;
  });
}

/** The decode of the pose at `key` is done: the lookahead's image is let go (its file is in the cache and the painting's own `<img>` has it). */
export function releasePrefetch(key: string): void {
  held.delete(key);
}

/** Let go of every lookahead image (a preload ended). */
export function releaseAllPrefetch(): void {
  held.clear();
}

/** How many lookahead images are alive (the tests). */
export function prefetchHeld(): number {
  return held.size;
}
