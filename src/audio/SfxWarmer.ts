/**
 * Chunked, priority-ordered SFX bank warm-up.
 *
 * `AudioManager.warmSfx()` used to post the whole ~124-cue bank as one worker
 * request. The worker is single-threaded, so any music render posted while
 * that request was in flight had to wait for the entire ~2.4s batch to finish
 * before it even started — trading frame stalls for several seconds of
 * silence on first click, which is worse for the player. This warms a
 * handful of cues at a time instead: one chunk is posted, and the next chunk
 * is only posted once every reply for the current one has arrived, so a
 * music request slipped in between two chunks waits behind at most one chunk
 * (a few hundred ms worst case) rather than the whole bank.
 *
 * Cheap, frequently-heard cues (menu, flow, weapons, basic hits) are ordered
 * first; the handful of cues measured at 100ms+ to render (`summon`,
 * `victory-fanfare`, `holy-2`, `holy`, `aeon-overdrive`, `full-life`) are
 * pushed to the very end regardless of which SFX group they live in.
 *
 * Split out of AudioManager to keep that file under its line budget. It still
 * deals in Worker messages, so it lives alongside MusicLoader/worker.ts
 * rather than in the platform-free sfx/ folder — but `warmSfxViaWorker` is
 * driven through the small `SfxWorkerLike` shape below, so tests can supply a
 * plain object instead of a real browser Worker, and the ordering/chunking
 * helpers underneath it are plain, directly-testable functions.
 */

import type { SfxDef } from './sfx/index.ts';
import type { SfxRequest, WorkerResponse } from './worker.ts';

/** How many cues to render per worker round trip while warming the bank. */
export const SFX_WARMUP_CHUNK_SIZE = 6;

/** SFX groups (see `SFX_GROUPS`), most-likely-to-be-heard-soon first. A group
 *  not listed here (e.g. a new sfx file) is warmed after these, in whatever
 *  order Object.keys gives it. */
// `story` follows `flow` because that is the order a player meets them: the
// menus, then the chapter's opening cutscene, and only then the battle.
const GROUP_PRIORITY = ['ui', 'flow', 'story', 'weapons', 'battle', 'enemy', 'magic', 'spells', 'support'];

/** Cues measured at 100ms+ to render (see the module doc above) — warmed last
 *  no matter which group they belong to. */
const HEAVY_SFX = new Set(['summon', 'victory-fanfare', 'holy-2', 'holy', 'aeon-overdrive', 'full-life']);

/** Flatten the SFX groups into one warm-up order: cheap/frequent groups
 *  first, then the rest, with the known-heavy cues pulled to the very end. */
export function orderSfxForWarmup(groups: Record<string, Record<string, SfxDef>>): string[] {
  const groupOrder = [...GROUP_PRIORITY, ...Object.keys(groups).filter((g) => !GROUP_PRIORITY.includes(g))];
  const light: string[] = [];
  const heavy: string[] = [];
  for (const group of groupOrder) {
    for (const name of Object.keys(groups[group] ?? {})) {
      (HEAVY_SFX.has(name) ? heavy : light).push(name);
    }
  }
  return [...light, ...heavy];
}

/** Split into fixed-size chunks, preserving order. */
export function chunkSfxNames(names: string[], size = SFX_WARMUP_CHUNK_SIZE): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < names.length; i += size) chunks.push(names.slice(i, i + size));
  return chunks;
}

/** The slice of the Worker API `warmSfxViaWorker` needs — lets tests drive it
 *  with a plain object instead of a real browser Worker. */
export interface SfxWorkerLike {
  postMessage(message: unknown): void;
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

export interface SfxWarmerHost {
  /** Build and cache an AudioBuffer from one cue's rendered channels. */
  cacheBuffer(name: string, left: Float32Array, right: Float32Array): void;
  /** Fallback for cues the worker never got to (unavailable, or died mid-batch). */
  renderOnMainThread(names: string[]): void;
}

/**
 * Warms `names` on `worker`, one chunk at a time, waiting for every reply in
 * the current chunk before posting the next. Falls back to
 * `host.renderOnMainThread` for whatever hadn't been warmed yet if the worker
 * errors mid-batch.
 */
export function warmSfxViaWorker(worker: SfxWorkerLike, names: string[], sampleRate: number, host: SfxWarmerHost): void {
  const chunks = chunkSfxNames(names);
  let nextChunk = 0;
  let nextId = 1;

  const postChunk = (): void => {
    if (nextChunk >= chunks.length) return;
    const chunk = chunks[nextChunk++]!;
    const id = nextId++;
    let received = 0;
    const cleanup = (): void => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
    };
    const onMessage = (event: MessageEvent<WorkerResponse>): void => {
      const data = event.data;
      if (data.kind !== 'sfx' || data.id !== id) return;
      received++;
      if (data.ok && data.left && data.right) host.cacheBuffer(data.name, data.left, data.right);
      if (received >= chunk.length) {
        cleanup();
        postChunk();
      }
    };
    const onError = (): void => {
      // The worker died mid-batch: this chunk's outcome is unknown and every
      // later chunk was never posted, so hand all of it to the main thread.
      // Cues this chunk already delivered before the error are cheap no-ops
      // there (getSfxBuffer returns the cached copy).
      cleanup();
      host.renderOnMainThread([...chunk, ...chunks.slice(nextChunk).flat()]);
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    const request: SfxRequest = { id, kind: 'sfx', names: chunk, sampleRate };
    worker.postMessage(request);
  };

  postChunk();
}
