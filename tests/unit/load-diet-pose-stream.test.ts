/**
 * The pose stream (lane "load-diet", 2026-10-29; both games, shared loading plumbing): the opening poses first and without a limit, the others started in the order a fight draws them
 * and a few at a time, waited for at most the ceiling, the rest handed back. A complete set comes back whole in the order it was asked for (release 67's result).
 */
import { describe, expect, it, vi } from 'vitest';
import { LATE_WINDOW, StreamStopped, loadStreamed, startWindowed } from '../../src/engine/PoseStream.ts';

const deferred = <T>(): { promise: Promise<T>; resolve: (v: T) => void } => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const flush = async (n = 10): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

describe('startWindowed', () => {
  it('starts tasks in order, at most `width` in flight, and answers in task order', async () => {
    const gates = Array.from({ length: 8 }, () => deferred<number>());
    const started: number[] = [];
    let flying = 0;
    let peak = 0;
    const out = startWindowed(
      gates.map((g, i) => () => {
        started.push(i);
        peak = Math.max(peak, ++flying);
        return g.promise.finally(() => flying--);
      }),
      3,
    );
    await flush();
    expect(started).toEqual([0, 1, 2]);
    gates[1]!.resolve(11);
    await flush();
    expect(started).toEqual([0, 1, 2, 3]);
    for (let i = 0; i < 8; i++) gates[i]!.resolve(i * 10);
    expect(await Promise.all(out)).toEqual([0, 11, 20, 30, 40, 50, 60, 70]); // task 1 settled first, with 11; a second resolve changes nothing
    expect(peak).toBeLessThanOrEqual(3);
    expect(started).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('a stop skips the tasks not yet started, and a failing task does not hold the window', async () => {
    let stopped = false;
    const ran: number[] = [];
    const out = startWindowed(
      [0, 1, 2, 3].map((i) => () => {
        ran.push(i);
        if (i === 1) stopped = true;
        return i === 0 ? Promise.reject(new Error('boom')) : Promise.resolve(i);
      }),
      1,
      () => stopped,
    );
    const settled = await Promise.allSettled(out);
    expect(settled.map((s) => s.status)).toEqual(['rejected', 'fulfilled', 'rejected', 'rejected']);
    expect((settled[2] as PromiseRejectedResult).reason).toBeInstanceOf(StreamStopped);
    expect(ran).toEqual([0, 1]);
  });
});

describe('loadStreamed', () => {
  const POSES = {
    idle: 'idle.png',
    ready: 'ready.png',
    victory: 'victory.png',
    ko: 'ko.png',
    attack: 'attack.png',
    cast: 'attack.png',
    hurt: 'hurt.png',
    guard: 'idle.png',
  };
  const names = Object.keys(POSES);

  it('a complete set comes back whole, in the order it was asked for', async () => {
    const out = await loadStreamed(POSES, names, 1000, async (u) => u.toUpperCase(), () => false);
    expect(out.later).toBeNull();
    expect(out.names).toEqual(names);
    expect(out.loaded).toEqual(names.map((n) => POSES[n as keyof typeof POSES].toUpperCase()));
  });

  it('starts the others only once the opening poses are in, in the order a fight draws them, a few at a time', async () => {
    const calls: string[] = [];
    const gates = new Map<string, ReturnType<typeof deferred<string>>>();
    const load = (u: string): Promise<string> => {
      // one load per file, as `PaintedActorPoses.loadPoses` memoizes by URL
      const known = gates.get(u);
      if (known) return known.promise;
      calls.push(u);
      const g = deferred<string>();
      gates.set(u, g);
      return g.promise;
    };
    const p = loadStreamed(POSES, names, 5000, load, () => false);
    await flush();
    expect(calls.sort()).toEqual(['idle.png', 'ready.png']); // the opening poses, and the pose that shares idle's file, alone
    gates.get('idle.png')!.resolve('i');
    await flush();
    expect(calls).toHaveLength(2); // ready is still on its way: the others wait
    gates.get('ready.png')!.resolve('r');
    await flush();
    expect(calls.slice(2)).toEqual(['attack.png', 'hurt.png', 'ko.png', 'victory.png']); // the everyday moves, then the rest, the rare ones last
    for (const u of ['attack.png', 'hurt.png', 'ko.png', 'victory.png']) gates.get(u)!.resolve(u);
    const out = await p;
    expect(out.later).toBeNull();
    expect(LATE_WINDOW).toBeGreaterThanOrEqual(4);
  });

  it('past the ceiling it returns the opening poses and the rest on their way', async () => {
    vi.useFakeTimers();
    try {
      const attack = deferred<string>();
      const load = (u: string): Promise<string> => (u === 'attack.png' ? attack.promise : Promise.resolve(u));
      const p = loadStreamed(POSES, names, 3000, load, () => false);
      await vi.advanceTimersByTimeAsync(3000);
      const out = await p;
      expect(out.names).toEqual(['idle', 'ready', 'guard']);
      expect(out.loaded).toEqual(['idle.png', 'ready.png', 'idle.png']);
      expect(out.later!.names).toEqual(['victory', 'ko', 'attack', 'cast', 'hurt']);
      attack.resolve('A');
      expect(await Promise.all(out.later!.each)).toEqual(['victory.png', 'ko.png', 'A', 'A', 'hurt.png']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a figure with only opening poses is loaded whole at once', async () => {
    const out = await loadStreamed({ idle: 'a.png', ready: 'b.png' }, ['idle', 'ready'], 10, async (u) => u, () => false);
    expect(out).toEqual({ names: ['idle', 'ready'], loaded: ['a.png', 'b.png'], later: null });
  });
});
