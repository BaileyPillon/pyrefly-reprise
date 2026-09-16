/**
 * Renders music into AudioBuffers, off the main thread when it can.
 *
 * Split out of AudioManager so the mixer only deals with playback: this class
 * owns the worker, the in-flight requests, the fallback to a synchronous render
 * and the cache of finished buffers. AudioManager also borrows this worker to
 * warm up the SFX bank (see `getWorker()`) rather than spawning a second one;
 * SFX messages carry `kind: 'sfx'` and this class's own listener ignores them.
 */

import { renderTrack } from './render.ts';
import { getTrack } from './tracks/index.ts';
import type { RenderRequest, RenderResponse, WorkerResponse } from './worker.ts';

export interface LoopedBuffer {
  buffer: AudioBuffer;
  /** Loop points in seconds, ready for AudioBufferSourceNode. */
  loopStart: number;
  loopEnd: number;
}

export class MusicLoader {
  private useWorker: boolean;
  private worker: Worker | null = null;
  private workerBroken = false;
  private pending = new Map<number, (response: RenderResponse | null) => void>();
  private nextRequestId = 1;
  private cache = new Map<string, LoopedBuffer>();
  private inflight = new Map<string, Promise<LoopedBuffer>>();

  constructor(useWorker = true) {
    this.useWorker = useWorker;
  }

  has(name: string): boolean {
    return this.cache.has(name);
  }

  cachedNames(): string[] {
    return [...this.cache.keys()];
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

  private async render(ctx: AudioContext, name: string): Promise<LoopedBuffer> {
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
   * `load()` does for music.
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
