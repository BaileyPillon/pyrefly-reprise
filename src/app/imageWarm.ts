/**
 * Fetch and decode images before the screen that shows them paints (PR-0065,
 * PR-0061).
 *
 * A painted `<img>` or CSS background on this site is a 1-6 MB PNG. Put up
 * cold, it paints as nothing (or as the grey placeholder bust under it) until
 * the file has arrived and been decoded, which is what the critic kept
 * photographing: the briefing without Auron or his backdrop, the board's party
 * tiles as grey silhouettes, the battle-start card without its painting.
 *
 * {@link warmImages} starts the request and `HTMLImageElement.decode()` for
 * each URL and keeps the element alive for the rest of the session, so the
 * browser's memory cache answers the real `<img>` at once, already decoded.
 * {@link untilWarm} is the gate a screen waits on before its first paint,
 * always with a ceiling: a slow network may delay a screen, never hold it.
 *
 * A URL the art manifest says is not on disk is never requested (round 11:
 * the battle preload asked for portraits and poses nobody painted, and every
 * one of them was a console 404 that CHK-016 and CHK-017 forbid). With no
 * manifest to read, the request goes ahead as before.
 *
 * DOM only (no three.js). Game case: both, shared front-end loading.
 */

import { manifestKnowsAsset } from '../engine/ArtManifest.ts';

/** Settled answer per URL: true once decoded, false if it failed. */
const warmed = new Map<string, Promise<boolean>>();
/** The elements themselves, kept so the decoded images stay cached. */
const held: HTMLImageElement[] = [];

/** How many images load at once, so the first ones asked for arrive first. */
const PARALLEL = 4;
let active = 0;
const queue: Array<() => void> = [];

function slot(): Promise<void> {
  if (active < PARALLEL) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release(): void {
  const next = queue.shift();
  if (next) next();
  else active--;
}

/** Warm one image. Idempotent: a second call returns the first call's answer. */
export function warmImage(url: string): Promise<boolean> {
  const known = warmed.get(url);
  if (known) return known;
  // No `decode()` means no real image pipeline (jsdom, a unit test): there is
  // nothing to warm, and waiting on an `onload` that never fires would stall.
  if (typeof Image === 'undefined' || typeof Image.prototype.decode !== 'function') return Promise.resolve(false);
  const p = (async (): Promise<boolean> => {
    // Absent by the manifest: nothing to fetch, and no 404 in the console.
    if ((await manifestKnowsAsset(url)) === false) return false;
    await slot();
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      held.push(img);
      await img.decode();
      return true;
    } catch {
      return false;
    } finally {
      release();
    }
  })();
  warmed.set(url, p);
  return p;
}

/** Warm every URL, in order of priority (the queue serves the first ones first). */
export function warmImages(urls: readonly string[]): Promise<boolean[]> {
  return Promise.all([...new Set(urls)].map((u) => warmImage(u)));
}

/**
 * Resolve once every URL is decoded, or after `ceilingMs`, whichever is first.
 * Resolves to true when everything made it in time.
 */
export async function untilWarm(urls: readonly string[], ceilingMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ceiling = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), ceilingMs);
  });
  const all = warmImages(urls).then(() => true);
  const ok = await Promise.race([all, ceiling]);
  if (timer !== undefined) clearTimeout(timer);
  return ok;
}

/** True when this URL has been warmed and decoded. For tests and probes. */
export async function isWarm(url: string): Promise<boolean> {
  return (await warmed.get(url)) === true;
}

/** Forget everything. Tests only. */
export function resetImageWarm(): void {
  warmed.clear();
  held.length = 0;
  queue.length = 0;
  active = 0;
}
