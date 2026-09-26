/**
 * PR-0149 (both games): a transient host error on a shipped file is retried
 * once (about 500 ms later) before the loader gives up. Live GitHub Pages
 * answered one pose sidecar with a 503; the pose silently lost its scale,
 * anchor and facing metadata.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tryLoadMeta } from '../../src/engine/PaintedArt.ts';
import { fetchWithOneRetry, RETRY_DELAY_MS } from '../../src/engine/fetchRetry.ts';

const SIDECAR = { width: 1024, height: 1024, baselineY: 1000, scale: 1.2, anchorY: 980, facing: 'left' };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchWithOneRetry', () => {
  it('retries once on a 5xx and returns the second answer', async () => {
    const calls: number[] = [];
    const stub = vi.fn(async () => {
      calls.push(calls.length);
      return calls.length === 1 ? jsonResponse(503, {}) : jsonResponse(200, SIDECAR);
    });
    const res = await fetchWithOneRetry('x.json', {}, { fetchImpl: stub, sleep: async () => undefined });
    expect(res.status).toBe(200);
    expect(stub).toHaveBeenCalledTimes(2);
  });

  it('retries once on a thrown fetch', async () => {
    let n = 0;
    const stub = vi.fn(async () => {
      n += 1;
      if (n === 1) throw new TypeError('network');
      return jsonResponse(200, SIDECAR);
    });
    const res = await fetchWithOneRetry('x.json', {}, { fetchImpl: stub, sleep: async () => undefined });
    expect(res.ok).toBe(true);
    expect(stub).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 404 (a real miss stays fast)', async () => {
    const stub = vi.fn(async () => jsonResponse(404, {}));
    const res = await fetchWithOneRetry('x.json', {}, { fetchImpl: stub, sleep: async () => undefined });
    expect(res.status).toBe(404);
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it('waits about 500 ms before the retry', async () => {
    const waits: number[] = [];
    const stub = vi.fn(async () => (waits.length === 0 ? jsonResponse(502, {}) : jsonResponse(200, SIDECAR)));
    await fetchWithOneRetry('x.json', {}, { fetchImpl: stub, sleep: async (ms) => void waits.push(ms) });
    expect(waits).toEqual([RETRY_DELAY_MS]);
    expect(RETRY_DELAY_MS).toBeGreaterThanOrEqual(400);
    expect(RETRY_DELAY_MS).toBeLessThanOrEqual(600);
  });
});

describe('tryLoadMeta (the acceptance check)', () => {
  it('a 503 then 200 stub still gets the sidecar', async () => {
    vi.useFakeTimers();
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        n += 1;
        return n === 1 ? jsonResponse(503, {}) : jsonResponse(200, SIDECAR);
      }),
    );
    const pending = tryLoadMeta('art/characters/braskas-final-aeon-1/hurt.png');
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS + 50);
    const meta = await pending;
    expect(n).toBe(2);
    expect(meta).not.toBeNull();
    expect(meta?.scale).toBe(1.2);
    expect(meta?.anchorY).toBe(980);
    expect(meta?.facing).toBe('left');
  });

  it('a 404 is still a plain miss with one request', async () => {
    const stub = vi.fn(async () => jsonResponse(404, {}));
    vi.stubGlobal('fetch', stub);
    expect(await tryLoadMeta('art/characters/nobody/idle.png')).toBeNull();
    expect(stub).toHaveBeenCalledTimes(1);
  });
});
