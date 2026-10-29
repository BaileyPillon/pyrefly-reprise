/**
 * The phone's ranked start queue (lane "budgets-2", 2026-10-29; BOTH games, shared loading plumbing): `BackgroundQueue` itself, and its two users, the later poses of every figure
 * (`PoseStream.loadStreamed` while the line is held) and the lighting maps (`FigureRelight.prefetchRelight`). Thirty poses and forty maps asking for a 10 Mbit/s at once all land together; through
 * the queue the ones a fight draws first start first, eight at a time across every figure.
 */
import { Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackgroundQueue } from '../../src/engine/BackgroundQueue.ts';
import { LATE_WIDTH, holdBackground, holdBooks, queued, releaseBackground, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';
import { loadStreamed } from '../../src/engine/PoseStream.ts';
import { lookState } from '../../src/engine/look/LookState.ts';
import { beginRelightEpoch, prefetchRelight, releaseRelightBefore, relightCacheStats, unpinRelight } from '../../src/engine/look/relight/FigureRelight.ts';

const tick = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('BackgroundQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const gate = (): { p: Promise<void>; open: () => void } => {
    let open!: () => void;
    const p = new Promise<void>((r) => (open = r));
    return { p, open };
  };

  it('starts at most `width` tasks, lowest rank first, equal ranks in the order they asked', async () => {
    const q = new BackgroundQueue(2);
    const order: string[] = [];
    const gates = new Map<string, () => void>();
    const add = (name: string, rank: number): Promise<string> =>
      q.run(rank, () => {
        order.push(name);
        const g = gate();
        gates.set(name, g.open);
        return g.p.then(() => name);
      });
    const done = [add('a', 5), add('b', 5), add('c', 1), add('d', 5), add('e', 0), add('f', 1)];
    await tick();
    expect(order).toEqual(['e', 'c']); // everything asked in one turn is in the line before the first is picked: rank 0, then the first rank 1
    expect(q.inFlight).toBe(2);
    expect(q.queued).toBe(4);
    gates.get('e')!();
    await tick();
    expect(order).toEqual(['e', 'c', 'f']); // the other rank 1
    gates.get('c')!();
    await tick();
    expect(order).toEqual(['e', 'c', 'f', 'a']); // then the rank 5s in the order they asked
    gates.get('f')!();
    gates.get('a')!();
    await tick();
    expect(order).toEqual(['e', 'c', 'f', 'a', 'b', 'd']);
    for (const g of gates.values()) g();
    await tick();
    expect(await Promise.all(done)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(q.inFlight).toBe(0);
    expect(q.queued).toBe(0);
  });

  it('a task that rejects frees its slot and rejects its caller; one that throws does the same', async () => {
    const q = new BackgroundQueue(1);
    const bad = q.run(0, () => Promise.reject(new Error('no')));
    const thrown = q.run(0, () => {
      throw new Error('sync');
    });
    const good = q.run(0, () => Promise.resolve('ok'));
    await expect(bad).rejects.toThrow('no');
    await expect(thrown).rejects.toThrow('sync');
    await expect(good).resolves.toBe('ok');
    expect(q.inFlight).toBe(0);
  });

  it('a request that hangs gives up its slot after the slot time and the others go on; its own task still resolves its caller later', async () => {
    const q = new BackgroundQueue(1, 1000);
    const hung = gate();
    const first = q.run(0, () => hung.p.then(() => 'late'));
    const second = q.run(0, () => Promise.resolve('next'));
    await vi.advanceTimersByTimeAsync(999);
    expect(q.queued).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    expect(q.queued).toBe(0); // the slot was given up: the second one started
    await expect(second).resolves.toBe('next');
    hung.open();
    await expect(first).resolves.toBe('late');
    expect(q.inFlight).toBe(0); // the slot is not freed twice
  });

  it('a wider queue from now on starts what was waiting', async () => {
    const q = new BackgroundQueue(1);
    const g = gate();
    const started: number[] = [];
    void q.run(0, () => (started.push(1), g.p));
    void q.run(0, () => (started.push(2), g.p));
    void q.run(0, () => (started.push(3), g.p));
    await tick();
    expect(started).toEqual([1]);
    q.setWidth(3);
    await tick();
    expect(started).toEqual([1, 2, 3]);
    g.open();
  });
});

describe('queued() and the later poses of every figure', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetHoldForTests();
    setForegroundFirst(true);
  });
  afterEach(() => {
    vi.useRealTimers();
    resetHoldForTests();
  });

  it('off the phone class queued() is the task itself, started at once', () => {
    setForegroundFirst(false);
    let started = 0;
    for (let i = 0; i < 20; i++) void queued(0, () => (started++, new Promise<void>(() => undefined)));
    expect(started).toBe(20);
  });

  it('two figures\' later poses start together across the whole phone: the everyday moves of both before the rare ones of either, LATE_WIDTH at a time', async () => {
    holdBackground();
    const poses = { idle: 'u/idle', ready: 'u/ready', attack: 'u/attack', cast: 'u/cast', hurt: 'u/hurt', victory: 'u/victory', sleep: 'u/sleep', critical: 'u/critical', follow: 'u/follow' };
    const names = Object.keys(poses);
    const started: string[] = [];
    const gates = new Map<string, () => void>();
    const loadFor = (who: string) => (u: string): Promise<string> => {
      const key = `${who}:${u.replace('u/', '')}`;
      started.push(key);
      if (u.endsWith('/idle') || u.endsWith('/ready')) return Promise.resolve(u);
      return new Promise<string>((r) => gates.set(key, () => r(u)));
    };
    const a = await loadStreamed(poses, names, 3000, loadFor('tidus'), () => false);
    const b = await loadStreamed({ ...poses }, names, 3000, loadFor('yuna'), () => false);
    expect(a.later).not.toBeNull();
    expect(b.later).not.toBeNull();
    releaseBackground();
    await tick();
    const late = started.filter((k) => !/:(idle|ready)$/.test(k));
    expect(late.length).toBe(LATE_WIDTH);
    // 3 everyday moves of each figure are rank 2, the rare ones rank 6: all six everyday moves are among the first eight, and only two rare ones are
    const everyday = late.filter((k) => /:(attack|cast|hurt)$/.test(k));
    expect(everyday.length).toBe(6);
    expect(holdBooks().queue).toEqual({ inFlight: LATE_WIDTH, queued: 4 }); // twelve asked, eight started
    // a slot frees: the next rare pose starts, and nothing starts out of turn
    const first = late[0]!;
    gates.get(first)!();
    await tick();
    expect(started.filter((k) => !/:(idle|ready)$/.test(k)).length).toBe(LATE_WIDTH + 1);
    for (const g of gates.values()) g();
    await tick();
  });
});

describe('the lighting maps through the queue', () => {
  let loads: string[] = [];
  let pending: Array<() => void> = [];
  let armedBefore = false;
  beforeEach(() => {
    vi.useFakeTimers();
    resetHoldForTests();
    armedBefore = lookState.armed;
    lookState.armed = true;
    loads = [];
    pending = [];
    releaseRelightBefore(Number.MAX_SAFE_INTEGER);
    beginRelightEpoch(1);
    vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, url: string, onLoad?: (t: Texture) => void): Texture {
      loads.push(url.replace(/.*characters\//, '').replace(/\.normal.*/, ''));
      const t = new Texture();
      pending.push(() => onLoad?.(t));
      return t;
    } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    lookState.armed = armedBefore;
    resetHoldForTests();
    vi.restoreAllMocks();
  });

  const art = (who: string, pose: string): string => `/art/characters/${who}/${pose}.png`;

  it('on the phone class forty maps start eight at a time, the poses drawn first first; each landing starts the next', async () => {
    setForegroundFirst(true);
    const held = new Set<string>();
    const poses = ['victory', 'follow', 'sleep', 'critical', 'attack', 'hurt', 'cast', 'idle', 'ready'];
    for (const who of ['tidus', 'yuna', 'kimahri', 'wakka', 'lulu']) for (const p of poses) prefetchRelight(art(who, p), 1, false, held);
    await tick();
    expect(loads.length).toBe(LATE_WIDTH);
    // rank 1 (the opening poses' maps) first: idle and ready of the first figures
    expect(loads.every((l) => /\/(idle|ready)$/.test(l))).toBe(true);
    // the whole forty-five: opening, then everyday, then rare
    while (pending.length) {
      pending.shift()!();
      await tick();
    }
    const kinds = loads.map((l) => l.replace(/.*\//, ''));
    const need = (k: string): number => (/^(idle|ready)/.test(k) ? 0 : /^(attack|cast|hurt)$/.test(k) ? 1 : 3);
    expect(kinds.length).toBe(45);
    expect(kinds.map(need)).toEqual([...kinds.map(need)].sort((x, y) => x - y));
    unpinRelight(held);
  });

  it('off the phone class every map starts at once, as before', async () => {
    setForegroundFirst(false);
    const held = new Set<string>();
    for (let i = 0; i < 20; i++) prefetchRelight(art(`f${i}`, 'attack'), 1, false, held);
    await tick();
    expect(loads.length).toBe(20);
    unpinRelight(held);
  });

  it('a loader that throws leaves the map missing, the material unlit, and no unhandled rejection (queued or not)', async () => {
    for (const phone of [true, false]) {
      setForegroundFirst(phone);
      vi.mocked(TextureLoader.prototype.load).mockImplementation((() => {
        throw new Error('the loader threw');
      }) as never);
      const held = new Set<string>();
      const who = phone ? 'thrown-phone' : 'thrown-desk';
      prefetchRelight(art(who, 'attack'), 1, false, held);
      await tick();
      expect(relightCacheStats().maps, `phone ${phone}`).toBe(1);
      expect(relightCacheStats().textures).toBe(0);
      unpinRelight(held);
      releaseRelightBefore(Number.MAX_SAFE_INTEGER);
    }
  });

  it('a map released before its turn is never asked for', async () => {
    setForegroundFirst(true);
    const held = new Set<string>();
    for (let i = 0; i < 12; i++) prefetchRelight(art(`g${i}`, 'attack'), 1, false, held);
    await tick();
    expect(loads.length).toBe(LATE_WIDTH);
    unpinRelight(held); // the figures are gone
    beginRelightEpoch(2);
    expect(releaseRelightBefore(2)).toBe(0);
    expect(relightCacheStats().maps).toBe(0); // the loading entries were forgotten
    while (pending.length) {
      pending.shift()!();
      await tick();
    }
    expect(loads.length).toBe(LATE_WIDTH); // the four still waiting never started
  });
});
