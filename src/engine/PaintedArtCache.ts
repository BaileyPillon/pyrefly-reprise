/**
 * The expensive half of loading a painting, done once per session (PR-0061).
 *
 * `PaintedArt.loadPainted` used to fetch, decode, matte-check and alpha-measure
 * every pose PNG each time a battle staged it: about 0.9 s of main-thread work
 * for Chapter 1's 30 paintings, measured on a production build (the flood fill
 * in `cleanMatte` alone was 0.7 s), paid behind the swirl on every entry and
 * again on every retry. None of it depends on anything but the file, so the
 * finished answer (the pixels to upload and the measured `PoseMeta`) is kept
 * here, keyed by URL and the matte and fit options that shaped it.
 *
 * What is **not** kept is the `Texture`: every `loadPainted` call still builds
 * its own, so an actor that disposes its textures on teardown never pulls a
 * shared one out from under another. The cache holds the image the texture is
 * made from, which is what lets `app/screens/battlePreload.ts` do the work
 * while the player is still on the prep menu and the pre-battle scene.
 *
 * Pure bookkeeping: no DOM, no three.js. Game case: both (shared loading).
 */

import type { PoseMeta } from './PaintedArt.ts';

/** A painting ready to become a texture. */
export interface PreparedPainting {
  /** The pixels to upload: the decoded image, or the matte-cleaned canvas. */
  readonly source: HTMLImageElement | HTMLCanvasElement;
  /** True when `source` is the cleaned canvas rather than the file itself. */
  readonly cleaned: boolean;
  /** The sidecar plus the measured baseline, content box and ground hull. */
  readonly meta: PoseMeta;
  /** Which master `source` is: 1 for the approved painting (also when absent), 2 to 4 for `<name>@<n>x.png` (release 39, `ArtTier.ts`). */
  readonly scale?: number;
}

/**
 * How many paintings to keep. A chapter stages about 30-40 (five figures,
 * up to eight poses each, 0.5-1.5 MB a file), so this holds the chapter being
 * played plus roughly the last two, a retry's worth, without the session's
 * memory growing with every chapter visited. Oldest first out.
 */
export const PAINTING_CACHE_LIMIT = 96;

/**
 * And how many decoded megabytes (RGBA, no mips) they may add up to (release 39): a 2x master is four times a 1x painting and
 * a chapter's thirty to forty paintings at 2x are about 500 MB of decoded pixels the browser may keep resident, so the count
 * alone no longer bounds the memory. Oldest first out, never the one just made.
 */
export const PAINTING_CACHE_MB = 900;

const cache = new Map<string, Promise<PreparedPainting | null>>();
const decodedMB = new Map<string, number>();

function sizeMB(p: PreparedPainting): number {
  const s = p.source as { naturalWidth?: number; width?: number; height?: number; naturalHeight?: number };
  return ((s.naturalWidth || s.width || 0) * (s.naturalHeight || s.height || 0) * 4) / (1024 * 1024);
}

/** Drop the oldest paintings until the count and the decoded size are both within their limits; `keep` is never dropped. */
function trim(keep: string): void {
  let total = 0;
  for (const mb of decodedMB.values()) total += mb;
  for (const key of cache.keys()) {
    if (cache.size <= PAINTING_CACHE_LIMIT && total <= PAINTING_CACHE_MB) break;
    if (key === keep) continue;
    total -= decodedMB.get(key) ?? 0;
    cache.delete(key);
    decodedMB.delete(key);
  }
}

/** The cache key: the URL plus the options that change the answer. */
export function paintingKey(url: string, matte?: unknown, fit?: unknown): string {
  const m = matte === undefined ? '-' : JSON.stringify(matte);
  const f = fit === undefined ? '-' : fit === false ? 'off' : JSON.stringify(fit);
  return `${url}|${m}|${f}`;
}

/**
 * The prepared painting for `key`, running `make` only the first time.
 *
 * A miss (`null`: no file, undecodable) is not remembered, so a later call
 * looks again. `refresh` forces a fresh `make`: the dev hot-swap path, where
 * the file on disk is newer than anything held here.
 */
export function cachedPainting(
  key: string,
  make: () => Promise<PreparedPainting | null>,
  refresh = false,
): Promise<PreparedPainting | null> {
  const held = refresh ? undefined : cache.get(key);
  if (held) {
    // Most recently used moves to the back of the eviction queue.
    cache.delete(key);
    cache.set(key, held);
    return held;
  }
  const made = make().then(
    (p) => {
      if (!p && cache.get(key) === made) cache.delete(key);
      if (p && cache.get(key) === made) {
        decodedMB.set(key, sizeMB(p));
        trim(key);
      }
      return p;
    },
    () => {
      if (cache.get(key) === made) cache.delete(key);
      return null;
    },
  );
  cache.set(key, made);
  trim(key);
  return made;
}

/** True when `key` has been asked for and not evicted (it may still be loading). */
export function hasPainting(key: string): boolean {
  return cache.has(key);
}

/** How many paintings are held. For tests and the debug probe. */
export function paintingCacheSize(): number {
  return cache.size;
}

/** Forget everything. Tests only. */
export function clearPaintingCache(): void {
  cache.clear();
  decodedMB.clear();
}

/** The decoded megabytes the cache holds (for the debug probe and the tests). */
export function paintingCacheMB(): number {
  let total = 0;
  for (const mb of decodedMB.values()) total += mb;
  return total;
}
