/**
 * Gets music into an AudioBuffer, by the best route available.
 *
 * There are two routes, and the whole point is that the caller cannot tell
 * which one ran:
 *
 *   1. PRE-RENDERED. If `public/audio/manifest.json` lists the cue, fetch the
 *      MP3 and hand it to `decodeAudioData`. Those files were rendered offline
 *      from the same scores with real sampled instruments and mixed in a
 *      concert hall, which is the entire reason the game stopped sounding
 *      like a synthesiser.
 *   2. SYNTHESISED. Otherwise, render the score with the oscillator voices,
 *      off the main thread when Workers are available. This is the original
 *      path, unchanged, and it is the safety net: a missing manifest, a failed
 *      fetch, a codec the browser dislikes, or a cue nobody has rendered yet
 *      all land here and still make sound.
 *
 * AudioManager also borrows this class's worker to warm up the SFX bank (see
 * `getWorker()`) rather than spawning a second one; SFX messages carry
 * `kind: 'sfx'` and this class's own listener ignores them.
 */

import { renderTrack } from './render.ts';
import { getTrack } from './tracks/index.ts';
import {
  clampLoopPoints,
  evictionPlan,
  musicEntry,
  resolveAudioUrl,
  type AudioManifest,
} from './manifest.ts';
import type { RenderRequest, RenderResponse, WorkerResponse } from './worker.ts';

export interface LoopedBuffer {
  buffer: AudioBuffer;
  /** Loop points in seconds, ready for AudioBufferSourceNode. */
  loopStart: number;
  loopEnd: number;
  /** Which route produced this buffer — surfaced by the debug overlay. */
  source: 'prerendered' | 'synth';
}

export class MusicLoader {
  private useWorker: boolean;
  private worker: Worker | null = null;
  private workerBroken = false;
  private pending = new Map<number, (response: RenderResponse | null) => void>();
  private nextRequestId = 1;
  private cache = new Map<string, LoopedBuffer>();
  private inflight = new Map<string, Promise<LoopedBuffer>>();
  private manifest: AudioManifest | null = null;
  private baseUrl: string;
  /** Cues that failed to fetch or decode; never retried, always synthesised. */
  private prerenderFailed = new Set<string>();

  constructor(useWorker = true, baseUrl = '/') {
    this.useWorker = useWorker;
    this.baseUrl = baseUrl;
  }

  /** Install the manifest read at startup. Null or absent means "synthesise everything". */
  setManifest(manifest: AudioManifest | null): void {
    this.manifest = manifest;
  }

  getManifest(): AudioManifest | null {
    return this.manifest;
  }

  has(name: string): boolean {
    return this.cache.has(name);
  }

  cachedNames(): string[] {
    return [...this.cache.keys()];
  }

  /** How a cached cue was produced, for the debug overlay. */
  sourceOf(name: string): 'prerendered' | 'synth' | null {
    return this.cache.get(name)?.source ?? null;
  }

  load(ctx: AudioContext, name: string): Promise<LoopedBuffer> {
    const cached = this.cache.get(name);
    if (cached) return Promise.resolve(cached);
    const existing = this.inflight.get(name);
    if (existing) return existing;
    const promise = this.render(ctx, name).then((buffer) => {
      this.cache.set(name, buffer);
      this.inflight.delete(name);
      return buffer;
    });
    this.inflight.set(name, promise);
    return promise;
  }

  /**
   * Drop decoded buffers we are unlikely to need again.
   *
   * A decoded 90 second stereo buffer is ~30 MB of float samples; keeping all
   * twenty-one would be a third of a gigabyte to no purpose. The caller says
   * what is playing and what is likely next, and everything else goes.
   */
  evict(current: string | null, upcoming: string[] = [], keep = 3): string[] {
    const dropped = evictionPlan(this.cachedNames(), current, upcoming, keep);
    for (const name of dropped) this.cache.delete(name);
    return dropped;
  }

  private async render(ctx: AudioContext, name: string): Promise<LoopedBuffer> {
    const prerendered = await this.loadPrerendered(ctx, name);
    if (prerendered) return prerendered;
    return this.synthesise(ctx, name);
  }

  /**
   * Route 1: fetch and decode the offline render.
   *
   * Any failure here returns null rather than throwing, and marks the cue so
   * we do not try again. Silence is never an acceptable outcome — a 404, an
   * offline cache miss or a codec the browser rejects should all end up
   * synthesising the cue, which always works.
   */
  private async loadPrerendered(ctx: AudioContext, name: string): Promise<LoopedBuffer | null> {
    if (this.prerenderFailed.has(name)) return null;
    const entry = musicEntry(this.manifest, name);
    if (!entry) return null;
    if (typeof fetch !== 'function') return null;
    try {
      const response = await fetch(resolveAudioUrl(this.baseUrl, entry.file));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(bytes);
      const { loopStart, loopEnd } = clampLoopPoints(entry, buffer.duration);
      return { buffer, loopStart, loopEnd, source: 'prerendered' };
    } catch (error) {
      this.prerenderFailed.add(name);
      if (typeof console !== 'undefined') {
        console.warn(`[audio] pre-rendered "${name}" unavailable, synthesising instead`, error);
      }
      return null;
    }
  }

  /** Route 2: the original synthesis path, in a Worker when there is one. */
  private async synthesise(ctx: AudioContext, name: string): Promise<LoopedBuffer> {
    const sampleRate = ctx.sampleRate;
    const response = await this.renderViaWorker(name, sampleRate);
    let left: Float32Array;
    let right: Float32Array;
    let loopStartSample: number;
    let loopEndSample: number;
    if (response && response.ok && response.left && response.right) {
      left = response.left;
      right = response.right;
      loopStartSample = response.loopStartSample ?? 0;
      loopEndSample = response.loopEndSample ?? left.length;
    } else {
      // No worker (or it died): render on this thread instead. Same code path,
      // same samples — it just costs a couple of seconds of jank.
      const rendered = renderTrack(getTrack(name), sampleRate);
      left = rendered.left;
      right = rendered.right;
      loopStartSample = rendered.loopStartSample;
      loopEndSample = rendered.loopEndSample;
    }
    const buffer = ctx.createBuffer(2, left.length, sampleRate);
    // getChannelData().set() rather than copyToChannel(): it accepts any
    // ArrayBufferLike-backed Float32Array, including one transferred from a worker.
    buffer.getChannelData(0).set(left);
    buffer.getChannelData(1).set(right);
    return {
      buffer,
      loopStart: loopStartSample / sampleRate,
      loopEnd: loopEndSample / sampleRate,
      source: 'synth',
    };
  }

  private renderViaWorker(name: string, sampleRate: number): Promise<RenderResponse | null> {
    const worker = this.getWorker();
    if (!worker) return Promise.resolve(null);
    const id = this.nextRequestId++;
    const request: RenderRequest = { id, name, sampleRate };
    return new Promise<RenderResponse | null>((resolve) => {
      this.pending.set(id, resolve);
      worker.postMessage(request);
    });
  }

  /**
   * The shared render worker, created (and its listeners wired up) on first
   * use. Returns null when Workers are unavailable or the worker has died —
   * callers should fall back to a main-thread render in that case, same as
   * `synthesise()` does for music.
   */
  getWorker(): Worker | null {
    if (!this.useWorker || this.workerBroken || typeof Worker === 'undefined') return null;
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        if (event.data.kind === 'sfx') return; // handled by AudioManager's own listener
        const resolve = this.pending.get(event.data.id);
        if (resolve) {
          this.pending.delete(event.data.id);
          resolve(event.data);
        }
      });
      worker.addEventListener('error', () => {
        this.workerBroken = true;
        for (const [id, resolve] of [...this.pending]) {
          this.pending.delete(id);
          resolve(null);
        }
      });
      this.worker = worker;
      return worker;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
    this.inflight.clear();
    this.cache.clear();
  }
}
