/**
 * Foreground first (lane "budgets-2", 2026-10-29; BOTH games, shared loading plumbing; `docs/BUDGETS.md` B2a, release 68's finding R68-B1: the phone's load wait of 19.8 s in Chapter I and 42.4 s in
 * Chapter IV with the 87 MB of the fight start all asking for the same 10 Mbit/s).
 *
 * On the phone class, from the moment a battle screen begins to enter until the field is shown, the lighting maps, the later poses and the preload's remaining poses wait; then they start, in the
 * order a fight draws them. Nothing changes off the phone class. The pieces are the real ones: `LoadHold`, `PoseStream.loadStreamed`, the real `PaintedActor` (the head-lock fixture) for the maps, and
 * the preload's phase 4 loop in `load-diet-preload.test.ts`'s sibling below.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/engine/motion/NewMotionGate.ts', () => ({ newMotionOn: () => true }));
vi.mock('../../src/engine/look/relight/FigureRelight.ts', async (orig) => ({ ...(await orig<typeof import('../../src/engine/look/relight/FigureRelight.ts')>()), prefetchRelight: vi.fn(() => null) }));

import { setArtTier } from '../../src/engine/ArtDevice.ts';
import { HOLD_CEILING_MS, backgroundHeld, deferWhileHeld, foregroundFirst, holdBackground, holdBooks, releaseBackground, resetHoldForTests, setForegroundFirst, whenBackgroundOpen } from '../../src/engine/LoadHold.ts';
import { LATE_WINDOW, loadStreamed } from '../../src/engine/PoseStream.ts';
import { setLoadDiet } from '../../src/engine/LoadDiet.ts';
import { prefetchRelight } from '../../src/engine/look/relight/FigureRelight.ts';
import { PaintedActor, painting, reset, yuna } from './engine/head-lock-fixture.ts';

beforeEach(() => {
  resetHoldForTests();
  setLoadDiet(undefined);
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  resetHoldForTests();
  setLoadDiet(undefined);
  setArtTier(undefined);
  vi.unstubAllGlobals();
  reset();
});

describe('who is held', () => {
  it('the phone class is, a desktop class is not, and the load diet off takes it away', () => {
    setArtTier('phone');
    expect(foregroundFirst()).toBe(true);
    for (const cls of ['low', 'mid', 'high'] as const) {
      setArtTier(cls);
      expect(foregroundFirst(), cls).toBe(false);
    }
    setArtTier('phone');
    setLoadDiet(false);
    expect(foregroundFirst()).toBe(false);
  });

  it('?phonediet=off takes it away on the phone, ?phonediet=on puts it on any class (a desktop A/B)', () => {
    setArtTier('phone');
    vi.stubGlobal('location', { search: '?phonediet=off' });
    expect(foregroundFirst()).toBe(false);
    vi.stubGlobal('location', { search: '?phonediet=on' });
    setArtTier('high');
    expect(foregroundFirst()).toBe(true);
  });

  it('a desktop never holds: holdBackground answers false, nothing waits, nothing is counted', async () => {
    setArtTier('high');
    expect(holdBackground()).toBe(false);
    expect(backgroundHeld()).toBe(false);
    await whenBackgroundOpen(); // resolves at once
    expect(deferWhileHeld({}, () => undefined)).toBe(false);
    expect(holdBooks()).toMatchObject({ holds: 0, opens: 0, deferredMaps: 0 });
  });
});

describe('the hold', () => {
  beforeEach(() => setForegroundFirst(true));

  it('holds until released, runs each owner\'s deferred work once, in the order it asked, and counts it', () => {
    expect(holdBackground()).toBe(true);
    expect(holdBackground()).toBe(true); // a second hold is the same hold
    const ran: string[] = [];
    const a = {};
    const b = {};
    expect(deferWhileHeld(a, () => ran.push('a1'))).toBe(true);
    expect(deferWhileHeld(a, () => ran.push('a2'))).toBe(true); // the same owner asks again: still once
    expect(deferWhileHeld(b, () => ran.push('b'), () => true, 'poses')).toBe(true);
    expect(ran).toEqual([]);
    releaseBackground();
    expect(ran).toEqual(['a1', 'b']);
    expect(backgroundHeld()).toBe(false);
    expect(deferWhileHeld(a, () => ran.push('late'))).toBe(false); // open: the caller goes on
    releaseBackground(); // twice is nothing
    expect(holdBooks()).toMatchObject({ holds: 1, opens: 1, deferredMaps: 1, deferredPoses: 1, ceilings: 0 });
  });

  it('a waiter whose owner is gone does nothing at the opening', () => {
    holdBackground();
    let alive = true;
    const ran: string[] = [];
    deferWhileHeld({}, () => ran.push('x'), () => alive);
    alive = false;
    releaseBackground();
    expect(ran).toEqual([]);
  });

  it('whenBackgroundOpen settles at the opening and not before', async () => {
    holdBackground();
    let open = false;
    void whenBackgroundOpen().then(() => (open = true));
    await vi.advanceTimersByTimeAsync(5000);
    expect(open).toBe(false);
    releaseBackground();
    await vi.advanceTimersByTimeAsync(0);
    expect(open).toBe(true);
  });

  it('a hold nobody opens opens itself after the ceiling', async () => {
    holdBackground();
    await vi.advanceTimersByTimeAsync(HOLD_CEILING_MS - 1);
    expect(backgroundHeld()).toBe(true);
    await vi.advanceTimersByTimeAsync(2);
    expect(backgroundHeld()).toBe(false);
    expect(holdBooks()).toMatchObject({ ceilings: 1, opens: 1 });
  });

  it('a new hold after an opening holds again (a retry, the next chapter)', () => {
    holdBackground();
    releaseBackground();
    expect(holdBackground()).toBe(true);
    expect(backgroundHeld()).toBe(true);
    releaseBackground();
    expect(holdBooks()).toMatchObject({ holds: 2, opens: 2 });
  });
});

describe('the lighting maps of a figure', () => {
  beforeEach(() => {
    setForegroundFirst(true);
    vi.mocked(prefetchRelight).mockClear();
  });

  it('a figure staged while the line is held asks for none; at the opening it asks for every pose once, the poses a fight draws first first', () => {
    holdBackground();
    const f = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
    // adopted in the order victory, ko, hurt, idle: a fight draws idle first, then ko and hurt (the everyday moves), the victory last
    f.adoptPoses({ victory: painting('yuna', 'victory'), ko: painting('yuna', 'ko'), hurt: painting('yuna', 'hurt'), idle: painting('yuna', 'idle') }, 'idle');
    f.adoptPoses({ idle: painting('yuna', 'idle') }, 'idle'); // asked again while held: still once at the opening
    expect(prefetchRelight).not.toHaveBeenCalled();
    releaseBackground();
    const names = vi.mocked(prefetchRelight).mock.calls.map((c) => String(c[0]).replace(/.*\//, '').replace('.png', ''));
    expect(names).toEqual(['idle', 'ko', 'hurt', 'victory']); // by need (0, 1, 1, 3), the order of adoption within a need (insertion order was victory, ko, hurt, idle)
  });

  it('a figure disposed while it waited asks for nothing at the opening', () => {
    holdBackground();
    const f = yuna();
    f.dispose();
    releaseBackground();
    expect(prefetchRelight).not.toHaveBeenCalled();
  });

  it('off the hold a figure asks at once and in the order it always did (the desktop is untouched)', () => {
    setForegroundFirst(false);
    const f = yuna();
    const urls = vi.mocked(prefetchRelight).mock.calls.map((c) => String(c[0]));
    expect(urls.map((u) => u.replace(/.*\//, ''))).toEqual(['idle.png', 'hurt.png', 'ko.png', 'victory.png']);
    f.dispose();
  });
});

describe('the later poses of a figure (PoseStream.loadStreamed)', () => {
  beforeEach(() => setForegroundFirst(true));

  const poses = { idle: 'u/idle', ready: 'u/ready', attack: 'u/attack', cast: 'u/cast', hurt: 'u/hurt', victory: 'u/victory', 'od-x': 'u/od-x', sleep: 'u/sleep', critical: 'u/critical', follow: 'u/follow' };
  const names = Object.keys(poses);

  it('held: the figure comes back at once with its opening poses, and the rest start only at the opening, in need order, six at a time', async () => {
    holdBackground();
    const started: string[] = [];
    const gates = new Map<string, () => void>();
    const load = (u: string): Promise<string> => {
      started.push(u);
      return u.endsWith('/idle') || u.endsWith('/ready') ? Promise.resolve(u) : new Promise<string>((r) => gates.set(u, () => r(u)));
    };
    const out = await loadStreamed(poses, names, 3000, load, () => false); // the ceiling is 3 s and fake time does not move: it must not be waited for
    expect(out.names).toEqual(['idle', 'ready']);
    expect(out.later?.names.length).toBe(8);
    expect(started).toEqual(['u/idle', 'u/ready']); // nothing late was asked for
    releaseBackground();
    await vi.advanceTimersByTimeAsync(0);
    expect(started.length).toBe(2 + LATE_WINDOW); // the window, not all eight
    const firstSix = started.slice(2).map((u) => u.replace('u/', ''));
    expect(firstSix.slice(0, 3)).toEqual(['attack', 'cast', 'hurt']); // need 1 before need 3
    expect(firstSix).toEqual(['attack', 'cast', 'hurt', 'victory', 'od-x', 'sleep']); // the window of six; critical and follow wait for a slot
    gates.get('u/attack')!();
    await vi.advanceTimersByTimeAsync(0);
    expect(started.length).toBe(2 + LATE_WINDOW + 1); // a slot freed, the next started
  });

  it('held: a pose whose figure is gone by the opening is never asked for', async () => {
    holdBackground();
    const started: string[] = [];
    let gone = false;
    const out = await loadStreamed(poses, names, 3000, (u) => (started.push(u), Promise.resolve(u)), () => gone);
    gone = true;
    releaseBackground();
    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual(['u/idle', 'u/ready']);
    await Promise.all(out.later!.each.map((p) => p.catch(() => 'stopped')));
  });

  it('not held: the set comes back whole inside the ceiling, exactly as release 68 (the load diet\'s own behaviour)', async () => {
    setForegroundFirst(false);
    const started: string[] = [];
    const out = await loadStreamed(poses, names, 3000, (u) => (started.push(u), Promise.resolve(u)), () => false);
    expect(out.later).toBeNull();
    expect(out.names).toEqual(names);
    expect(started.length).toBe(names.length);
  });

  it('not held: a slow set still waits the ceiling and is built with the opening poses', async () => {
    setForegroundFirst(false);
    const slow = (u: string): Promise<string> => (u.endsWith('/idle') || u.endsWith('/ready') ? Promise.resolve(u) : new Promise<string>(() => undefined));
    const racing = loadStreamed(poses, names, 3000, slow, () => false);
    await vi.advanceTimersByTimeAsync(2999);
    let settled = false;
    void racing.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect((await racing).names).toEqual(['idle', 'ready']);
  });
});
