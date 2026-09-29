/**
 * Fetch and decode images before the screen that shows them paints (PR-0065,
 * PR-0061), in the order the player will need them (PR-0221, PR-0240).
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
 * **Lanes (r29, PR-0221 / PR-0240).** Measured on a production build over a
 * 25 Mbit/s link, the board used to start about 40 requests (100 MB: every
 * rail card's backdrop and boss) the moment it opened, and on HTTP/2 each of
 * them took an equal share of the pipe: the chosen chapter's speaker portrait,
 * asked for 5.5 s in, arrived at 36.7 s, and the first battle took 25 to 33 s
 * to load (`docs/handoff/r29-load.md`). So each warm now has a lane:
 * `urgent` (what the screen about to open shows), `normal` (the default) and
 * `idle` (what a screen could show later: the board's rail strips). An idle
 * load starts only while nothing urgent or normal is waiting, at most
 * {@link IDLE_PARALLEL} at a time, and never while an {@link holdIdleLane}
 * hold is held (a chapter is being played); a hold also cancels the idle loads
 * in flight, which go back to the front of their lane and finish later. A URL
 * asked for again at a higher lane is promoted.
 *
 * A URL the art manifest says is not on disk is never requested (round 11:
 * the battle preload asked for portraits and poses nobody painted, and every
 * one of them was a console 404 that CHK-016 and CHK-017 forbid). With no
 * manifest to read, the request goes ahead as before.
 *
 * DOM only (no three.js). Game case: both, shared front-end loading.
 */

import { manifestKnowsAsset } from '../engine/ArtManifest.ts';

/** How soon a warm is needed. */
export type WarmLane = 'urgent' | 'normal' | 'idle';
const RANK: Record<WarmLane, number> = { urgent: 0, normal: 1, idle: 2 };

/** How many images load at once, so the first ones asked for arrive first. */
const PARALLEL = 4;
/** How many idle loads may share the pipe with nothing else waiting. */
export const IDLE_PARALLEL = 2;

interface Job {
  url: string;
  lane: WarmLane;
  img: HTMLImageElement | null;
  /** Set while an idle load is being cancelled, so its failure re-queues rather than settles. */
  aborted: boolean;
  settle: (ok: boolean) => void;
}

/** Settled answer per URL: true once decoded, false if it failed. */
const warmed = new Map<string, Promise<boolean>>();
/** Jobs not yet settled, by URL (queued or loading). */
const jobs = new Map<string, Job>();
/** Waiting jobs, in the order they were asked for; picked by lane. */
const waiting: Job[] = [];
/** Jobs loading now. */
const loading = new Set<Job>();
/** The elements themselves, kept so the decoded images stay cached. */
const held: HTMLImageElement[] = [];
/** Open {@link holdIdleLane} holds. */
let holds = 0;

function hasPipeline(): boolean {
  return typeof Image !== 'undefined' && typeof Image.prototype.decode === 'function';
}

function idleLoading(): number {
  let n = 0;
  for (const j of loading) if (j.lane === 'idle') n++;
  return n;
}

/** The next job to start, or null: the most urgent lane first, first asked first. */
function nextJob(): Job | null {
  let best = -1;
  for (let i = 0; i < waiting.length; i++) {
    if (best < 0 || RANK[waiting[i]!.lane] < RANK[waiting[best]!.lane]) best = i;
  }
  if (best < 0) return null;
  const job = waiting[best]!;
  if (job.lane === 'idle') {
    const busy = [...loading].some((j) => j.lane !== 'idle');
    if (holds > 0 || busy || idleLoading() >= IDLE_PARALLEL) return null;
  }
  if (loading.size >= PARALLEL) return null;
  waiting.splice(best, 1);
  return job;
}

/** Cancel the idle loads in flight; they go back to the front of the queue. */
function yieldIdle(): void {
  for (const job of [...loading]) {
    if (job.lane !== 'idle' || !job.img) continue;
    job.aborted = true;
    loading.delete(job);
    const img = job.img;
    job.img = null;
    // Dropping the source cancels the request (the element is ours alone).
    if (typeof img.removeAttribute === 'function') img.removeAttribute('src');
    else img.src = '';
    waiting.unshift(job);
  }
}

function pump(): void {
  const urgentWaiting = holds > 0 || waiting.some((j) => j.lane !== 'idle');
  if (urgentWaiting) yieldIdle();
  for (let job = nextJob(); job; job = nextJob()) start(job);
}

function start(job: Job): void {
  loading.add(job);
  job.aborted = false;
  const img = new Image();
  img.decoding = 'async';
  job.img = img;
  img.src = job.url;
  img.decode().then(
    () => finish(job, img, true),
    () => finish(job, img, false),
  );
}

function finish(job: Job, img: HTMLImageElement, ok: boolean): void {
  // A cancelled idle load: its failure is ours, and it is already queued again.
  if (job.img !== img) return;
  loading.delete(job);
  jobs.delete(job.url);
  job.img = null;
  if (ok) held.push(img);
  job.settle(ok);
  pump();
}

/**
 * Warm one image. Idempotent: a second call returns the first call's answer,
 * and promotes the load if it is asked for at a more urgent lane.
 */
export function warmImage(url: string, lane: WarmLane = 'normal'): Promise<boolean> {
  const known = warmed.get(url);
  if (known) {
    const job = jobs.get(url);
    if (job && RANK[lane] < RANK[job.lane]) {
      job.lane = lane;
      pump();
    }
    return known;
  }
  // No `decode()` means no real image pipeline (jsdom, a unit test): there is
  // nothing to warm, and waiting on an `onload` that never fires would stall.
  if (!hasPipeline()) return Promise.resolve(false);
  const p = new Promise<boolean>((settle) => {
    const job: Job = { url, lane, img: null, aborted: false, settle };
    jobs.set(url, job);
    // Absent by the manifest: nothing to fetch, and no 404 in the console.
    void manifestKnowsAsset(url).then(
      (known2) => {
        if (known2 === false) {
          jobs.delete(url);
          settle(false);
          return;
        }
        waiting.push(job);
        pump();
      },
      () => {
        waiting.push(job);
        pump();
      },
    );
  });
  warmed.set(url, p);
  return p;
}

/** Warm every URL, in order of priority (the queue serves the first ones first). */
export function warmImages(urls: readonly string[], lane: WarmLane = 'normal'): Promise<boolean[]> {
  return Promise.all([...new Set(urls)].map((u) => warmImage(u, lane)));
}

/**
 * Move these URLs' loads, if still waiting or loading, to the idle lane: the
 * board's cursor moved on, so the plate it was showing is no longer urgent and
 * must not hold the pipe against the one it shows now.
 */
export function demoteWarm(urls: readonly string[]): void {
  let moved = false;
  for (const url of urls) {
    const job = jobs.get(url);
    if (job && job.lane !== 'idle') {
      job.lane = 'idle';
      moved = true;
    }
  }
  if (moved) pump();
}

/**
 * Hold the idle lane: until the returned release is called, no idle load
 * starts and the ones in flight are cancelled (and queued again). A chapter
 * holds it from the moment it is chosen until the flow is back on the board,
 * so the rail strips never share the pipe with the prep, the scene, the fight
 * or its pause. Releasing twice is harmless.
 */
export function holdIdleLane(): () => void {
  holds++;
  pump();
  let open = true;
  return () => {
    if (!open) return;
    open = false;
    holds = Math.max(0, holds - 1);
    pump();
  };
}

/**
 * Resolve once every URL is decoded, or after `ceilingMs`, whichever is first.
 * Resolves to true when everything made it in time.
 */
export async function untilWarm(urls: readonly string[], ceilingMs: number, lane: WarmLane = 'normal'): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ceiling = new Promise<false>((resolve) => {
    timer = setTimeout(() => resolve(false), ceilingMs);
  });
  const all = warmImages(urls, lane).then(() => true);
  const ok = await Promise.race([all, ceiling]);
  if (timer !== undefined) clearTimeout(timer);
  return ok;
}

/** True when this URL has been warmed and decoded. For tests and probes. */
export async function isWarm(url: string): Promise<boolean> {
  return (await warmed.get(url)) === true;
}

/** What is queued and loading, per lane. For the probe and the tests. */
export function warmQueueState(): { waiting: Record<WarmLane, number>; loading: Record<WarmLane, number>; holds: number } {
  const count = (list: Iterable<Job>): Record<WarmLane, number> => {
    const out: Record<WarmLane, number> = { urgent: 0, normal: 0, idle: 0 };
    for (const j of list) out[j.lane]++;
    return out;
  };
  return { waiting: count(waiting), loading: count(loading), holds };
}

/** Forget everything. Tests only. */
export function resetImageWarm(): void {
  warmed.clear();
  jobs.clear();
  held.length = 0;
  waiting.length = 0;
  loading.clear();
  holds = 0;
}
