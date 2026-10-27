/**
 * A PAINTING'S SMALL ALPHA FIELDS, READ OFF THE MAIN THREAD (post-conference motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games: shared look plumbing, felt in FFX Chapter I, small in FFX-2
 * Chapter IV).
 *
 * THE FREEZE. The look reads a figure's alpha the first time each of its paintings is drawn (`AlphaPrime.readExtents`: a 128 x 128 `drawImage` and `getImageData` of the whole painting, so the contact
 * shadow and the reflection know where the feet are; `breathRig.ts` a 32 x 48 field for the breathing rig; `fx/mix/geometry.ts` a 48 x 72 one for the silhouette checks). The painting is a 1.5 to 15 megapixel
 * `<img>` the page decoded, and the first draw of it has to build the image's mip levels (79 to 202 ms for a 3x or 4x master on this PC, 7 to 22 ms at 1x; the repeat is 0.1 to 0.3 ms), on the frame that first
 * shows the pose: the aeon's summon and attack, an item throw, Cheer, Talk, the Auron switch (20 of Chapter I's 55 long frames in `AlphaPrime.ts` alone, `appendix/rollup-ch1-1440-cap-trace2.json`).
 *
 * THE FIX. The work depends on nothing but the file's bytes, so a Worker does it from the bytes (`alphaThumbWorker.ts`: decode, a `drawImage` into an `OffscreenCanvas` of the same size, `getImageData`) when the
 * painting is loaded, and the field is kept against the `<img>` the texture holds (a WeakMap: the image, whatever textures are made from it; a master swapped in by the art governor is another image with its own
 * entry). A reader asks {@link thumbOf}: the field when it has landed, else null, and the reader does what it did before. `AlphaPrime.readExtents` also asks {@link thumbPending}: while a field is on its way
 * the texture's extents of the painting's previous master stand in (a painting is the same painting at every tier), so an upgrade never makes the page read the 4x master itself.
 *
 * HOW CLOSE. Not byte for byte: the worker draws an `ImageBitmap`, the page drew an `<img>`, and Chromium filters the two differently (the page's draw builds mip levels, the bitmap's does not), so about 1,000 of
 * a field's 16,384 texels differ (a few edge texels by up to 150 of 255) and the extents move by one cell of 128 in about half the paintings (`D:/Tools/pyrefly-scratch/2026-10-26/fluidity/build/mf-l4-freezes/e1`,
 * `e1b`, `e2`: the lane's equality jobs and their numbers are in `docs/handoff/mf-l4-freezes.md`). `?alphathumb=off` is release 64's reading, for a comparison.
 *
 * No Worker (the unit tests, an old browser) or a worker that fails: every reader reads for itself, as before.
 */

export type ThumbMode = 'draw' | 'bitmap-medium';

/** One field: its size and how the page used to make it ('draw': `drawImage(img, 0, 0, w, h)`; 'bitmap-medium': `createImageBitmap(img, { resizeWidth, resizeHeight, resizeQuality: 'medium' })` then a 1:1 draw). */
export interface ThumbSpec {
  readonly w: number;
  readonly h: number;
  readonly mode: ThumbMode;
}

/** `AlphaPrime.readExtents`: the figure's extents. */
export const EXTENTS_THUMB: ThumbSpec = { w: 128, h: 128, mode: 'draw' };
/** `fx/mix/breathRig.ts`: the chest rig's field (GW x GH there). */
export const BREATH_THUMB: ThumbSpec = { w: 32, h: 48, mode: 'bitmap-medium' };
/** `fx/mix/geometry.ts` `alphaOf`: the silhouette checks' field. */
export const GEOMETRY_THUMB: ThumbSpec = { w: 48, h: 72, mode: 'draw' };

/** What a loaded painting is asked for. */
export const PAINTING_THUMBS: readonly ThumbSpec[] = [EXTENTS_THUMB, GEOMETRY_THUMB, BREATH_THUMB];

const specKey = (s: ThumbSpec): string => `${s.mode}:${s.w}x${s.h}`;

/** The fields landed for an image, by spec. */
const held = new WeakMap<object, Map<string, Uint8Array>>();
/** The fields asked for and not given up on, so a second load of the same image asks nothing and a reader can tell "on its way" from "never". */
const asked = new WeakMap<object, Set<string>>();

/** `?alphathumb=off`: every reader reads its own field, as it did before this lane. */
export function alphaThumbOn(search: string = typeof window !== 'undefined' ? window.location.search : ''): boolean {
  try {
    return new URLSearchParams(search).get('alphathumb') !== 'off';
  } catch {
    return true;
  }
}

let enabled: boolean | undefined;
const on = (): boolean => (enabled ??= alphaThumbOn());

/** For the tests and the lane's browser job: re-read the switch from an address. */
export function setAlphaThumbSearch(search: string): void {
  enabled = alphaThumbOn(search);
}

/** The field of `image` for `spec`, top row first, one alpha byte a texel; null while it has not landed (or never will). */
export function thumbOf(image: unknown, spec: ThumbSpec): Uint8Array | null {
  if (!on() || !image || typeof image !== 'object') return null;
  return held.get(image)?.get(specKey(spec)) ?? null;
}

/** Is this field on its way (asked for, not landed, not given up on)? */
export function thumbPending(image: unknown, spec: ThumbSpec): boolean {
  if (!on() || broken || !image || typeof image !== 'object') return false;
  const k = specKey(spec);
  return (asked.get(image)?.has(k) ?? false) && !(held.get(image)?.has(k) ?? false);
}

/** Mark a field as asked for (the book `requestThumbs` keeps), for the tests: there is no Worker in jsdom to ask. */
export function notePending(image: object, spec: ThumbSpec): void {
  let did = asked.get(image);
  if (!did) asked.set(image, (did = new Set()));
  did.add(specKey(spec));
}

/** Keep a field against an image (the worker's answer, a test's own). */
export function storeThumb(image: object, spec: ThumbSpec, alpha: Uint8Array): void {
  let m = held.get(image);
  if (!m) held.set(image, (m = new Map()));
  m.set(specKey(spec), alpha);
  asked.get(image)?.add(specKey(spec));
}

interface Reply {
  id: number;
  ok: boolean;
  i?: number;
  a?: Uint8Array;
  done?: boolean;
}

interface Job {
  image: object;
  specs: readonly ThumbSpec[];
}

const POOL = 2;
const workers: Worker[] = [];
let broken = false;
let seq = 0;
let rr = 0;
const waiting = new Map<number, Job>();
const counters = { asked: 0, landed: 0, failed: 0 };

function giveUp(job: Job): void {
  counters.failed++;
  const did = asked.get(job.image);
  for (const s of job.specs) if (!(held.get(job.image)?.has(specKey(s)) ?? false)) did?.delete(specKey(s)); // not on its way any more: the readers read for themselves
}

function make(): Worker | null {
  if (broken || typeof Worker === 'undefined') return null;
  try {
    const w = new Worker(new URL('./alphaThumbWorker.ts', import.meta.url), { type: 'module', name: 'alpha-thumb' });
    w.onmessage = (e: MessageEvent<Reply>): void => {
      const job = waiting.get(e.data.id);
      if (!job) return;
      if (!e.data.ok) {
        waiting.delete(e.data.id);
        giveUp(job);
        return;
      }
      if (e.data.done) {
        waiting.delete(e.data.id);
        return;
      }
      const s = e.data.i !== undefined ? job.specs[e.data.i] : undefined;
      const a = e.data.a;
      if (s && a && a.length === s.w * s.h) {
        storeThumb(job.image, s, a);
        counters.landed++;
      }
    };
    w.onerror = (): void => {
      broken = true; // a worker that cannot run: every reader reads for itself, as before
      for (const job of waiting.values()) giveUp(job);
      waiting.clear();
    };
    return w;
  } catch {
    broken = true;
    return null;
  }
}

function pick(): Worker | null {
  if (workers.length < POOL) {
    const w = make();
    if (w) workers.push(w);
  }
  if (workers.length === 0) return null;
  return workers[rr++ % workers.length]!;
}

/** Only a figure's painting has fields (`art/characters/...`): a backdrop or a plate is never read for its alpha, and decoding one a second time would be pure cost. */
export function figurePainting(url: string): boolean {
  return /(?:^|\/)art\/characters\//.test(url);
}

/** An absolute address for a worker (it resolves against its own script, not the page). */
function absolute(url: string): string {
  try {
    return new URL(url, typeof document !== 'undefined' ? document.baseURI : undefined).href;
  } catch {
    return url;
  }
}

/**
 * Ask for the fields of a loaded painting: `source` is its encoded bytes (a Blob, when the loader has them) or its address (the worker reads it from the HTTP cache the `<img>` filled). Fire and forget: the
 * fields land when they land, a reader that comes first reads for itself. Nothing is asked twice for one image.
 */
export function requestThumbs(image: unknown, source: Blob | string, specs: readonly ThumbSpec[] = PAINTING_THUMBS, url?: string): void {
  if (!on() || !image || typeof image !== 'object') return;
  const name = url ?? (typeof source === 'string' ? source : '');
  if (name && !figurePainting(name)) return;
  let did = asked.get(image);
  if (!did) asked.set(image, (did = new Set()));
  const fresh = specs.filter((s) => !did!.has(specKey(s)));
  if (fresh.length === 0) return;
  const w = pick();
  if (!w) return;
  for (const s of fresh) did.add(specKey(s));
  const id = ++seq;
  const job: Job = { image, specs: fresh };
  waiting.set(id, job);
  counters.asked += fresh.length;
  try {
    w.postMessage({ id, source: typeof source === 'string' ? absolute(source) : source, specs: fresh });
  } catch {
    waiting.delete(id);
    giveUp(job);
  }
}

/** `requestThumbs` that hands the image back, so a loader keeps its return line (`PaintedArt.tryLoadImage`). */
export function withThumbs<T>(image: T, source: Blob | string, specs?: readonly ThumbSpec[]): T {
  requestThumbs(image, source, specs);
  return image;
}

/** The worker's side of the books, for the debug API and the lane's jobs (`__pyrefly.art.stats().alpha`). */
export function thumbStats(): { on: boolean; workers: number; broken: boolean; waiting: number; asked: number; landed: number; failed: number } {
  return { on: on(), workers: workers.length, broken, waiting: waiting.size, asked: counters.asked, landed: counters.landed, failed: counters.failed };
}
