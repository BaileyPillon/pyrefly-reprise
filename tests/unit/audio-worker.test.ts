import { describe, expect, it, vi } from 'vitest';

import { handleRequest } from '../../src/audio/worker.ts';
import type { RenderRequest, RenderResponse, SfxRequest, SfxResponse, WorkerResponse } from '../../src/audio/worker.ts';
import { chunkSfxNames, orderSfxForWarmup, warmSfxViaWorker, SFX_WARMUP_CHUNK_SIZE } from '../../src/audio/SfxWarmer.ts';
import type { SfxWorkerLike } from '../../src/audio/SfxWarmer.ts';
import { renderSfx, sfxNames, SFX_GROUPS } from '../../src/audio/sfx/index.ts';
import { trackNames } from '../../src/audio/tracks/index.ts';

const SR = 8000;

describe('worker handleRequest (music)', () => {
  it(
    'renders a track and reports loop points, one reply for one request',
    () => {
      const name = trackNames()[0]!;
      const request: RenderRequest = { id: 1, name, sampleRate: SR };
      const replies = handleRequest(request);
      expect(replies).toHaveLength(1);
      const response = replies[0]!.response as RenderResponse;
      expect(response.id).toBe(1);
      expect(response.ok).toBe(true);
      expect(response.name).toBe(name);
      expect(response.left).toBeInstanceOf(Float32Array);
      expect(response.right).toBeInstanceOf(Float32Array);
      expect(response.left!.length).toBe(response.right!.length);
      expect(response.loopStartSample).toBeGreaterThanOrEqual(0);
      expect(response.loopEndSample!).toBeGreaterThan(response.loopStartSample!);
      expect(replies[0]!.transfer).toEqual([response.left!.buffer, response.right!.buffer]);
    },
    60_000,
  );

  it('produces an error response instead of throwing for an unknown track', () => {
    const request: RenderRequest = { id: 2, name: 'not-a-track', sampleRate: SR };
    const replies = handleRequest(request);
    expect(replies).toHaveLength(1);
    const response = replies[0]!.response as RenderResponse;
    expect(response.id).toBe(2);
    expect(response.ok).toBe(false);
    expect(response.error).toMatch(/Unknown track/i);
    expect(replies[0]!.transfer).toEqual([]);
  });
});

describe('worker handleRequest (sfx batch)', () => {
  it('answers a batched request with one reply per cue, sample-identical to renderSfx', () => {
    const names = sfxNames().slice(0, 4);
    const request: SfxRequest = { id: 3, kind: 'sfx', names, sampleRate: SR };
    const replies = handleRequest(request);
    expect(replies).toHaveLength(names.length);
    replies.forEach((reply, i) => {
      const response = reply.response as SfxResponse;
      expect(response.kind).toBe('sfx');
      expect(response.id).toBe(3);
      expect(response.ok).toBe(true);
      expect(response.name).toBe(names[i]);
      const direct = renderSfx(names[i]!, SR);
      expect(Array.from(response.left!.slice(0, 500))).toEqual(Array.from(direct.left.slice(0, 500)));
      expect(Array.from(response.right!.slice(0, 500))).toEqual(Array.from(direct.right.slice(0, 500)));
      expect(reply.transfer).toEqual([response.left!.buffer, response.right!.buffer]);
    });
  });

  it('gives an unknown cue an error reply without throwing, and still renders the rest of the batch', () => {
    const names = ['not-a-cue', sfxNames()[0]!, sfxNames()[1]!];
    const request: SfxRequest = { id: 4, kind: 'sfx', names, sampleRate: SR };
    const replies = handleRequest(request);
    expect(replies).toHaveLength(3);

    const bad = replies[0]!.response as SfxResponse;
    expect(bad.ok).toBe(false);
    expect(bad.name).toBe('not-a-cue');
    expect(bad.error).toMatch(/Unknown sfx/i);
    expect(replies[0]!.transfer).toEqual([]);

    for (let i = 1; i < replies.length; i++) {
      const good = replies[i]!.response as SfxResponse;
      expect(good.ok).toBe(true);
      expect(good.name).toBe(names[i]);
      expect(good.left).toBeInstanceOf(Float32Array);
      expect(good.right).toBeInstanceOf(Float32Array);
    }
  });
});

describe('chunkSfxNames', () => {
  it('splits into fixed-size chunks, preserving order, with a shorter final chunk', () => {
    const names = ['a', 'b', 'c', 'd', 'e'];
    expect(chunkSfxNames(names, 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('defaults to SFX_WARMUP_CHUNK_SIZE and never drops or reorders a name', () => {
    const names = sfxNames();
    const chunks = chunkSfxNames(names);
    expect(chunks[0]!).toHaveLength(SFX_WARMUP_CHUNK_SIZE);
    expect(chunks.flat()).toEqual(names);
  });
});

describe('orderSfxForWarmup', () => {
  it('puts light groups before heavy ones, and an unlisted group last', () => {
    const groups = {
      support: { 'aeon-overdrive': {} as never, 'buff-generic': {} as never },
      ui: { confirm: {} as never },
      zzz: { 'zzz-cue': {} as never },
    };
    expect(orderSfxForWarmup(groups)).toEqual(['confirm', 'buff-generic', 'zzz-cue', 'aeon-overdrive']);
  });

  it('is a permutation of the real bank with every measured-heavy cue pushed to the end', () => {
    const ordered = orderSfxForWarmup(SFX_GROUPS);
    expect([...ordered].sort()).toEqual([...sfxNames()].sort());
    const heavy = ['summon', 'victory-fanfare', 'holy-2', 'holy', 'aeon-overdrive', 'full-life'];
    const firstHeavyIndex = ordered.findIndex((name) => heavy.includes(name));
    const lastLightIndex = ordered.reduce(
      (max, name, i) => (heavy.includes(name) ? max : i),
      -1,
    );
    expect(firstHeavyIndex).toBeGreaterThan(lastLightIndex);
  });
});

describe('warmSfxViaWorker', () => {
  /** A minimal EventTarget-like stand-in for a browser Worker: enough for
   *  warmSfxViaWorker to post chunk requests and be replied to. */
  class FakeWorker implements SfxWorkerLike {
    posted: SfxRequest[] = [];
    private onMessage: Array<(event: { data: WorkerResponse }) => void> = [];
    private onError: Array<(event: any) => void> = [];

    postMessage(message: unknown): void {
      this.posted.push(message as SfxRequest);
    }
    addEventListener(type: string, listener: (event: any) => void): void {
      if (type === 'message') this.onMessage.push(listener);
      else if (type === 'error') this.onError.push(listener);
    }
    removeEventListener(type: string, listener: (event: any) => void): void {
      if (type === 'message') this.onMessage = this.onMessage.filter((l) => l !== listener);
      else if (type === 'error') this.onError = this.onError.filter((l) => l !== listener);
    }
    /** Answer the most recently posted chunk exactly as the real worker would. */
    replyToLastChunk(): void {
      const request = this.posted[this.posted.length - 1]!;
      for (const reply of handleRequest(request)) {
        for (const listener of [...this.onMessage]) listener({ data: reply.response });
      }
    }
    fail(): void {
      for (const listener of [...this.onError]) listener(undefined);
    }
  }

  it('posts one chunk at a time, only sending the next once every reply in the current one has arrived', () => {
    const names = sfxNames().slice(0, 13); // 6 + 6 + 1 at the default chunk size
    const worker = new FakeWorker();
    const cacheBuffer = vi.fn();
    const renderOnMainThread = vi.fn();
    warmSfxViaWorker(worker, names, SR, { cacheBuffer, renderOnMainThread });

    expect(worker.posted).toHaveLength(1);
    expect(worker.posted[0]!.names).toEqual(names.slice(0, 6));
    worker.replyToLastChunk();

    expect(worker.posted).toHaveLength(2);
    expect(worker.posted[1]!.names).toEqual(names.slice(6, 12));
    worker.replyToLastChunk();

    expect(worker.posted).toHaveLength(3);
    expect(worker.posted[2]!.names).toEqual(names.slice(12));
    worker.replyToLastChunk();

    expect(worker.posted).toHaveLength(3); // nothing left to post
    expect(cacheBuffer).toHaveBeenCalledTimes(names.length);
    expect(renderOnMainThread).not.toHaveBeenCalled();
  });

  it('caches each cue under its own name with the rendered buffers', () => {
    const names = sfxNames().slice(0, 2);
    const worker = new FakeWorker();
    const cacheBuffer = vi.fn();
    warmSfxViaWorker(worker, names, SR, { cacheBuffer, renderOnMainThread: vi.fn() });
    worker.replyToLastChunk();
    for (const name of names) {
      expect(cacheBuffer).toHaveBeenCalledWith(name, expect.any(Float32Array), expect.any(Float32Array));
    }
  });

  it('falls back to the main thread for the failed chunk and every chunk not yet posted', () => {
    const names = sfxNames().slice(0, 13);
    const worker = new FakeWorker();
    const renderOnMainThread = vi.fn();
    warmSfxViaWorker(worker, names, SR, { cacheBuffer: vi.fn(), renderOnMainThread });

    worker.fail(); // dies while the first chunk (names 0-5) is still in flight

    expect(renderOnMainThread).toHaveBeenCalledTimes(1);
    expect(renderOnMainThread).toHaveBeenCalledWith(names); // chunk 1 + the two unposted chunks
    expect(worker.posted).toHaveLength(1); // no further chunk was ever posted
  });
});
