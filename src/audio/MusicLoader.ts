/**
 * Renders music into AudioBuffers, off the main thread when it can.
 *
 * Split out of AudioManager so the mixer only deals with playback: this class
 * owns the worker, the in-flight requests, the fallback to a synchronous render
 * and the cache of finished buffers.
 */

import { renderTrack } from './render.ts';
import { getTrack } from './tracks/index.ts';
import type { RenderRequest, RenderResponse } from './worker.ts';

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
    if (!this.useWorker || this.workerBroken || typeof Worker === 'undefined') {
      return Promise.resolve(null);
    }
    try {
      if (!this.worker) {
        this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (event: MessageEvent<RenderResponse>) => {
          const resolve = this.pending.get(event.data.id);
          if (resolve) {
            this.pending.delete(event.data.id);
            resolve(event.data);
          }
        };
        this.worker.onerror = () => {
          this.workerBroken = true;
          for (const [id, resolve] of [...this.pending]) {
            this.pending.delete(id);
            resolve(null);
          }
        };
      }
      const id = this.nextRequestId++;
      const request: RenderRequest = { id, name, sampleRate };
      return new Promise<RenderResponse | null>((resolve) => {
        this.pending.set(id, resolve);
        this.worker?.postMessage(request);
      });
    } catch {
      this.workerBroken = true;
      return Promise.resolve(null);
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
