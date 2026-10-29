/**
 * The load diet's pure half (lane "load-diet", 2026-10-29; both games, shared loading plumbing): the switch, the need of a pose, the order the preload downloads in, the split of a
 * figure's poses into the ones it waits for and the ones it streams, and the ceiling race. `docs/handoff/load-diet.md` has the evidence (round 30b's G4 request log) and the numbers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STREAM_CEILING_MS, loadDiet, orderByNeed, poseNeed, raceCeiling, setLoadDiet, splitPoses, streamCeilingMs } from '../../src/engine/LoadDiet.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

afterEach(() => {
  setLoadDiet(null);
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('the switch', () => {
  it('is on by default and ?loaddiet=off turns it off (release 67 everywhere)', () => {
    expect(loadDiet()).toBe(true);
    expect(streamCeilingMs()).toBe(STREAM_CEILING_MS);
    vi.stubGlobal('location', { search: '?loaddiet=off' });
    expect(loadDiet()).toBe(false);
    expect(streamCeilingMs()).toBe(0);
    vi.stubGlobal('location', { search: '?loaddiet=on&x=1' });
    expect(loadDiet()).toBe(true);
  });

  it('a forced value beats the address, and null goes back to it', () => {
    vi.stubGlobal('location', { search: '?loaddiet=off' });
    setLoadDiet(true);
    expect(loadDiet()).toBe(true);
    setLoadDiet(null);
    expect(loadDiet()).toBe(false);
  });
});

describe('poseNeed', () => {
  it('puts the opening poses first, the everyday moves next, the rare ones last', () => {
    for (const s of ['idle', 'idle-far', 'idle-near', 'ready']) expect(poseNeed(s)).toBe(0);
    for (const s of ['attack', 'cast', 'hurt', 'item', 'defend', 'guard', 'telegraph']) expect(poseNeed(s)).toBe(1);
    for (const s of ['ko', 'charge', 'twirl-start', 'windup', 'summon', 'stage-2']) expect(poseNeed(s)).toBe(2);
    for (const s of ['victory', 'sleep', 'critical', 'follow', 'overdrive', 'od-energy-rain', 'od-x2-lady-luck-attack-reels']) expect(poseNeed(s)).toBe(3);
  });

  it('classes every state the art manifest lists (nothing falls outside 0 to 3, and the everyday moves are the common ones)', () => {
    const manifest = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'public', 'art', 'manifest.json'), 'utf8')) as { subjects: Record<string, { states: string[] }> };
    const counts = [0, 0, 0, 0];
    for (const s of Object.values(manifest.subjects)) for (const st of s.states) counts[poseNeed(st)]!++;
    expect(counts.reduce((a, b) => a + b, 0)).toBeGreaterThan(900);
    expect(counts[0]!).toBeGreaterThan(150); // every subject has an idle
    expect(counts[1]!).toBeGreaterThan(400); // attack, cast, hurt, item...
  });
});

describe('orderByNeed', () => {
  it('is stable: the boss before the party stays inside a need', () => {
    const items = [
      { who: 'boss', state: 'attack' },
      { who: 'boss', state: 'victory' },
      { who: 'tidus', state: 'ready' },
      { who: 'tidus', state: 'attack' },
      { who: 'tidus', state: 'victory' },
      { who: 'yuna', state: 'ready' },
      { who: 'yuna', state: 'ko' },
    ];
    const out = orderByNeed(items, (i) => poseNeed(i.state)).map((i) => `${i.who}:${i.state}`);
    expect(out).toEqual(['tidus:ready', 'yuna:ready', 'boss:attack', 'tidus:attack', 'yuna:ko', 'boss:victory', 'tidus:victory']);
  });

  it('keeps every item exactly once and does not touch its input', () => {
    const input = ['victory', 'attack', 'idle', 'ko'];
    const copy = [...input];
    expect(orderByNeed(input, poseNeed).sort()).toEqual([...input].sort());
    expect(input).toEqual(copy);
  });
});

describe('splitPoses', () => {
  const poses = {
    idle: '/a/idle.png',
    ready: '/a/ready.png',
    attack: '/a/attack.png',
    cast: '/a/attack.png', // the stage's pose map: cast falls to attack's file
    guard: '/a/idle.png', // and a pose with nothing of its own falls to idle's file
    hurt: '/a/hurt.png',
    victory: '/a/victory.png',
  };

  it('waits for the opening poses and for every pose that shares their file; streams the rest', () => {
    const { early, late } = splitPoses(poses);
    expect(early).toEqual(['idle', 'ready', 'guard']);
    expect(late).toEqual(['attack', 'cast', 'hurt', 'victory']);
  });

  it('honours a narrowed name list and keeps the order', () => {
    const { early, late } = splitPoses(poses, ['victory', 'idle', 'hurt']);
    expect(early).toEqual(['idle']);
    expect(late).toEqual(['victory', 'hurt']);
  });

  it('a figure with only an idle has nothing to stream', () => {
    expect(splitPoses({ idle: '/b/idle.png' })).toEqual({ early: ['idle'], late: [] });
  });
});

describe('raceCeiling', () => {
  it('gives the value when it comes inside the ceiling', async () => {
    vi.useFakeTimers();
    const p = raceCeiling(Promise.resolve(7), 3000);
    await expect(p).resolves.toBe(7);
    expect(vi.getTimerCount()).toBe(0); // the timer is cleared
  });

  it('gives null when the ceiling passes first', async () => {
    vi.useFakeTimers();
    const never = new Promise<number>(() => undefined);
    const p = raceCeiling(never, 3000);
    await vi.advanceTimersByTimeAsync(3000);
    await expect(p).resolves.toBeNull();
  });

  it('a rejection rejects (the caller decides)', async () => {
    await expect(raceCeiling(Promise.reject(new Error('x')), 50)).rejects.toThrow('x');
  });
});
