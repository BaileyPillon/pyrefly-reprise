import { AGREE_CELLS, extentsAgree } from './alphaAgree.ts';

export { AGREE_CELLS, extentsAgree };

/**
 * A PAINTING'S SMALL ALPHA FIELDS, READ OFF THE MAIN THREAD (post-conference motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games: shared look plumbing, felt in FFX Chapter I, small in FFX-2
 * Chapter IV).
 *
 * THE FREEZE. The look reads a figure's alpha the first time each of its paintings is drawn: `AlphaPrime.readExtents` (a 128 x 128 `drawImage` and `getImageData` of the whole painting, so the contact shadow and
 * the reflection know where the feet are) and `fx/mix/breathRig.ts` (a 32 x 48 field for the breathing rig). The painting is a 1.5 to 15 megapixel `<img>` the page decoded, and the first draw of it has to build the
 * image's mip levels: 79 to 202 ms for a 3x or 4x master on this PC, 7 to 22 ms at 1x, the repeat 0.1 to 0.3 ms (`e1`). It lands on the frame that first shows the pose: the aeon's summon and attack, an item throw,
 * Cheer, Talk, the Auron switch (46 reads of 2.9 s and 30 breath reads of 0.8 s in one Chapter I fight, 57 frames over 33 ms).
 *
 * THE FIX. The work depends on nothing but the file's bytes, so a Worker does it from the bytes (`alphaThumb.worker.ts`: decode, a `drawImage` into an `OffscreenCanvas` of the same size, `getImageData`) when the
 * painting is loaded, and the field is kept against the `<img>` the texture holds (a WeakMap: the image, whatever textures are made from it; a master swapped in by the art governor is another image with its own
 * entry). A reader asks {@link thumbOf}: the field when it has landed, else null, and the reader does what it did before. `AlphaPrime.readExtents` also asks {@link thumbPending}: while a field is on its way
 * the previous extents of the texture, or those of another master of the same painting, stand in (a painting is the same painting at every tier), so an upgrade never makes the page read the 4x master itself.
 *
 * HOW CLOSE (the lane's `e1b` and `e2` browser jobs, 263 paintings of Chapters I and IV at 1x and 3x).
 *   - The BREATHING RIG's field is byte for byte the page's own (`createImageBitmap(blob, resize 'medium')` equals `createImageBitmap(img, ...)`: 263 of 263).
 *   - The EXTENTS field is not: Chromium draws an `<img>` through its own mip-filtered path, which no `ImageBitmap` draw in a worker reproduces (17 variants, 0 identical). The field is the AREA AVERAGE of the alpha
 *     plane (`alphaArea.ts`), the closest tried: its extents (six numbers on a 128 grid) are the page's in 167 paintings, within one cell in 95 more and 7 cells off in one. The canvas draw of the same bytes is a
 *     second opinion: where the two disagree by more than a cell (3 of 263) the AGREEMENT GUARD refuses the field and the page reads the painting itself, as it always did.
 *   - What the extents drive is the contact ellipse, the reflection and the figure's box; one cell is 0.8 percent of the painting's width (about 3.5 px of a 450 px figure at 1440p, about 2 px on the ellipse).
 * `?alphathumb=off` is release 64's reading, for a comparison; `?alphathumb=exact` keeps only the exact breathing field (the extents stay on the page).
 *
 * No Worker (the unit tests, an old browser) or a worker that fails: every reader reads for itself, as before.
 */

export type ThumbMode = 'area' | 'draw' | 'bitmap-medium';

/** One field: its size and how it is made ('area': the mean of the alpha plane over each texel's footprint, `alphaArea.ts`; 'draw': `drawImage(bitmap, 0, 0, w, h)` at the medium quality; 'bitmap-medium': `createImageBitmap(img, { resizeWidth, resizeHeight, resizeQuality: 'medium' })` then a 1:1 draw, the way `breathRig.ts` makes it). */
export interface ThumbSpec {
  readonly w: number;
  readonly h: number;
  readonly mode: ThumbMode;
}

/** `AlphaPrime.readExtents`: the figure's extents. */
export const EXTENTS_THUMB: ThumbSpec = { w: 128, h: 128, mode: 'area' };
/** The same painting as a canvas draw: not read by anyone, it is the second opinion the extents field is checked against. */
export const EXTENTS_CHECK: ThumbSpec = { w: 128, h: 128, mode: 'draw' };
/** `fx/mix/breathRig.ts`: the chest rig's field (GW x GH there). */
export const BREATH_THUMB: ThumbSpec = { w: 32, h: 48, mode: 'bitmap-medium' };

/** What a loaded painting is asked for. */
export const PAINTING_THUMBS: readonly ThumbSpec[] = [EXTENTS_THUMB, EXTENTS_CHECK, BREATH_THUMB];

const specKey = (s: ThumbSpec): string => `${s.mode}:${s.w}x${s.h}`;
const KEY_EXTENTS = specKey(EXTENTS_THUMB);
const KEY_CHECK = specKey(EXTENTS_CHECK);

/** The fields published for an image, by spec. */
const held = new WeakMap<object, Map<string, Uint8Array>>();
/** The two extents fields while the guard waits for both. */
const unsettled = new WeakMap<object, Map<string, Uint8Array>>();
/** Which painting (its address with no master tier and no extension) an image is, so another master of the same painting can stand in for one whose field is on its way. */
const paintingOf = new WeakMap<object, string>();
/** The newest extents field that landed for each painting, whatever master it came from (a field is 16 KB; the book is cleared when it grows past 400 paintings). */
const newestOf = new Map<string, Uint8Array>();
/** The fields asked for and not given up on, so a second load of the same image asks nothing and a reader can tell "on its way" from "never". */
const asked = new WeakMap<object, Set<string>>();

/** `?alphathumb=off`: every reader reads its own field, as it did before this lane. `?alphathumb=exact`: only the breathing rig's field (byte for byte the page's own) is made in the worker; the extents stay on the page, with no one-cell tolerance and the freezes of their first read. */
export function alphaThumbWord(search: string = typeof window !== 'undefined' ? window.location.search : ''): 'on' | 'exact' | 'off' {
  try {
    const w = new URLSearchParams(search).get('alphathumb');
    return w === 'off' || w === 'exact' ? w : 'on';
  } catch {
    return 'on';
  }
}
export const alphaThumbOn = (search?: string): boolean => alphaThumbWord(search) !== 'off';

let word: 'on' | 'exact' | 'off' | undefined;
const on = (): boolean => (word ??= alphaThumbWord()) !== 'off';

/** For the tests and the lane's browser job: re-read the switch from an address. */
export function setAlphaThumbSearch(search: string): void {
  word = alphaThumbWord(search);
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

/** A painting's name with no master tier and no extension: `.../art/characters/tidus/idle%402x.png` and `.../idle.webp` are both `art/characters/tidus/idle`. */
export function paintingName(url: string): string {
  const m = /(art\/characters\/.+?)(?:(?:%40|@)\d+x)?\.(?:png|webp)(?:\?.*)?$/i.exec(url);
  return m ? m[1]!.toLowerCase() : '';
}

/** Images whose extents field the guard refused (the page reads those itself). */
const refusedImages = new WeakSet<object>();

/** Why a reader has no field for an image: 'refused' by the guard, still 'pending', or 'none' (never asked for: not a figure's painting, the switch off, no Worker). For the books. */
export function thumbWhy(image: unknown): 'refused' | 'pending' | 'none' {
  if (!image || typeof image !== 'object') return 'none';
  if (refusedImages.has(image)) return 'refused';
  return thumbPending(image, EXTENTS_THUMB) ? 'pending' : 'none';
}

/** Fields the guard has refused, for the books. */
const counters = { asked: 0, landed: 0, failed: 0, refused: 0, reused: 0, timedOut: 0 };

function publish(image: object, key: string, alpha: Uint8Array): void {
  let m = held.get(image);
  if (!m) held.set(image, (m = new Map()));
  m.set(key, alpha);
  if (key === KEY_EXTENTS) {
    const name = paintingOf.get(image);
    if (name) {
      if (newestOf.size > 400) newestOf.clear();
      newestOf.set(name, alpha);
    }
  }
}

/** Keep a field against an image (the worker's answer, a test's own). The two extents fields are held until both are in and agree. */
export function storeThumb(image: object, spec: ThumbSpec, alpha: Uint8Array): void {
  const key = specKey(spec);
  asked.get(image)?.add(key);
  if (key !== KEY_EXTENTS && key !== KEY_CHECK) return publish(image, key, alpha);
  let pair = unsettled.get(image);
  if (!pair) unsettled.set(image, (pair = new Map()));
  pair.set(key, alpha);
  const med = pair.get(KEY_EXTENTS);
  const low = pair.get(KEY_CHECK);
  if (!med || !low) return;
  unsettled.delete(image);
  if (extentsAgree(med, low)) {
    publish(image, KEY_EXTENTS, med);
    return;
  }
  refusedImages.add(image);
  counters.refused++; // two downscales of this painting disagree on its extents: a thin element near the threshold; the page reads it itself
  asked.get(image)?.delete(KEY_EXTENTS);
}

/** For the tests: say which painting an image is (the loaders do it through `requestThumbs`). */
export function notePainting(image: object, url: string): void {
  const name = paintingName(url);
  if (name) paintingOf.set(image, name);
}

/**
 * A field of the SAME painting at another master, for the frames in which this image's own is on its way (a painting is the same painting at every tier: the extents of its 2x and its 4x master agree to within
 * a cell). Null when the image has its own, when none is on its way (the reader reads for itself), or when no other master's field has landed.
 */
export function standInFor(image: unknown, spec: ThumbSpec): Uint8Array | null {
  if (specKey(spec) !== KEY_EXTENTS || !thumbPending(image, spec)) return null;
  const name = paintingOf.get(image as object);
  return name ? (newestOf.get(name) ?? null) : null;
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
  /** The address the bytes came from, so what comes back is kept for the next image made from the same file. */
  name: string;
  /** What the worker is sent (the encoded bytes or an absolute address); `sent`: posted to a worker, else it waits in the queue. */
  source: Blob | string;
  sent: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * The raw fields by address (not by image): the art governor loads a master again for a warm-up or after an eviction, and that is a new `<img>` of the same bytes. Its fields are these, with no decode.
 * Cleared when it holds more than 600 files (a field pair is about 33 KB).
 */
const byAddress = new Map<string, Map<string, Uint8Array>>();
/** The address with no query: one file, however it was asked for. */
const addressOf = (name: string): string => name.replace(/[?#].*$/, '');

/** For the tests: say what a file's fields are (the worker's answers are kept this way). */
export function seedAddress(name: string, spec: ThumbSpec, alpha: Uint8Array): void {
  const key = addressOf(name);
  let m = byAddress.get(key);
  if (!m) byAddress.set(key, (m = new Map()));
  m.set(specKey(spec), alpha);
}

const POOL = 2;
/** Jobs on the workers at once (decoding a 4x master holds 60 MB or more; the review's memory run saw +328 MB at the opening's peak with every painting sent at once): the rest wait here, oldest first. */
export const MAX_IN_FLIGHT = 4;
/** A job that has not answered this long after it was sent is given up on and its readers read for themselves (a hung decode, a lost reply); past 4 timeouts in a row with nothing landed the workers are ended. */
export const JOB_TIMEOUT_MS = 20000;
const TIMEOUTS_TO_END = 4;
const workers: Worker[] = [];
let broken = false, seq = 0, rr = 0, inFlight = 0, timeoutsInARow = 0;
const waiting = new Map<number, Job>(); // every job asked for and not yet over, queued or sent
const queue: number[] = []; // the ids not yet sent

function giveUp(job: Job): void {
  counters.failed++;
  const did = asked.get(job.image);
  for (const s of job.specs) if (!(held.get(job.image)?.has(specKey(s)) ?? false)) did?.delete(specKey(s)); // not on its way any more: the readers read for themselves
}

/** A job is over (answered, failed, timed out or dropped): it leaves the books. Undefined when it was already over. */
function settle(id: number): Job | undefined {
  const job = waiting.get(id);
  if (job) {
    waiting.delete(id);
    clearTimeout(job.timer);
    if (job.sent) inFlight--;
  }
  return job;
}

/** The workers are no use (a script error, or silent): every waiting job is given up on, the workers are ended, and every reader reads for itself as before. */
function endWorkers(): void {
  broken = true;
  for (const id of [...waiting.keys()]) giveUp(settle(id)!);
  queue.length = inFlight = 0;
  for (const w of workers.splice(0)) try { w.terminate(); } catch { /* already gone */ }
}

/** Send queued jobs while fewer than MAX_IN_FLIGHT are out. */
function pump(): void {
  while (inFlight < MAX_IN_FLIGHT && queue.length > 0) {
    const id = queue.shift()!;
    const job = waiting.get(id);
    if (!job) continue;
    const w = pick();
    if (w) {
      job.sent = true;
      inFlight++;
      job.timer = setTimeout(() => onTimeout(id), JOB_TIMEOUT_MS);
      try { w.postMessage({ id, source: job.source, specs: job.specs }); continue; } catch { /* given up below */ }
    }
    settle(id);
    giveUp(job);
  }
}

function onTimeout(id: number): void {
  const job = settle(id);
  if (!job) return;
  giveUp(job);
  counters.timedOut++;
  if (++timeoutsInARow >= TIMEOUTS_TO_END) endWorkers();
  pump();
}

/** A worker can make the fields only where it can decode a Blob and draw into an OffscreenCanvas (not Safari before 16.4, nor the WebKit that Playwright ships for Windows: found by the lane's WebKit smoke, where every request came back failed). */
function workerCanDraw(): boolean {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
}

/** Failures in a row with nothing landed in between: past this many the worker is given up on (a browser that cannot do the work answers every request `ok: false`). */
const GIVE_UP_AFTER = 6; let failuresInARow = 0;

function make(): Worker | null {
  if (broken) return null;
  if (!workerCanDraw()) {
    broken = typeof Worker !== 'undefined'; // no Worker at all (jsdom) stays "not broken": there is nothing to report; a Worker that cannot draw is a browser to leave alone for good
    return null;
  }
  try {
    const w = new Worker(new URL('./alphaThumb.worker.ts', import.meta.url), { type: 'module', name: 'alpha-thumb' });
    w.onmessage = (e: MessageEvent<Reply>): void => {
      const job = waiting.get(e.data.id);
      if (!job) return;
      if (!e.data.ok) {
        settle(e.data.id);
        giveUp(job);
        if (++failuresInARow >= GIVE_UP_AFTER && counters.landed === 0) broken = true; // nothing has ever landed: stop asking, every reader reads for itself as before
        pump();
        return;
      }
      if (e.data.done) {
        settle(e.data.id);
        pump();
        return;
      }
      const s = e.data.i !== undefined ? job.specs[e.data.i] : undefined;
      const a = e.data.a;
      if (s && a && a.length === s.w * s.h) {
        storeThumb(job.image, s, a);
        counters.landed++;
        failuresInARow = 0;
        timeoutsInARow = 0;
        if (job.name) {
          let m = byAddress.get(job.name);
          if (!m) {
            if (byAddress.size > 600) byAddress.clear();
            byAddress.set(job.name, (m = new Map()));
          }
          m.set(specKey(s), a);
        }
      }
    };
    w.onerror = endWorkers; // a worker that cannot run: every reader reads for itself, as before
    return w;
  } catch {
    broken = true;
    return null;
  }
}

function pick(): Worker | null {
  if (broken) return null;
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
  if (name) notePainting(image, name);
  let did = asked.get(image);
  if (!did) asked.set(image, (did = new Set()));
  const fresh = specs.filter((s) => !did!.has(specKey(s)) && (word === 'on' || s.mode === 'bitmap-medium'));
  if (fresh.length === 0) return;
  const known = name ? byAddress.get(addressOf(name)) : undefined;
  if (known && fresh.every((s) => known.has(specKey(s)))) {
    // the same file again: its fields are in hand
    for (const s of fresh) {
      did.add(specKey(s));
      storeThumb(image, s, known.get(specKey(s))!);
    }
    counters.reused += fresh.length;
    return;
  }
  if (!pick()) return;
  for (const s of fresh) did.add(specKey(s));
  const id = ++seq;
  waiting.set(id, { image, specs: fresh, name: name ? addressOf(name) : '', source: typeof source === 'string' ? absolute(source) : source, sent: false });
  queue.push(id);
  counters.asked += fresh.length;
  pump();
}

/** `requestThumbs` that hands the image back, so a loader keeps its return line (`PaintedArt.tryLoadImage`). */
export function withThumbs<T>(image: T, source: Blob | string, specs?: readonly ThumbSpec[]): T {
  requestThumbs(image, source, specs);
  return image;
}

/** The worker's side of the books, for the debug API and the lane's jobs (`__pyrefly.art.stats().alpha`). */
export function thumbStats(): { on: boolean; workers: number; broken: boolean; waiting: number; queued: number; asked: number; landed: number; failed: number; refused: number; reused: number; timedOut: number } {
  return { on: on(), workers: workers.length, broken, waiting: waiting.size, queued: queue.length, asked: counters.asked, landed: counters.landed, failed: counters.failed, refused: counters.refused, reused: counters.reused, timedOut: counters.timedOut };
}
