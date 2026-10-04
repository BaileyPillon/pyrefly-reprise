// @vitest-environment jsdom
/**
 * Round 21, PR-0314 (FFX-2 only): the twirl starts as soon as its keys are here instead of after the new outfit's paintings have loaded, which
 * on a network was the girl standing in her old outfit for hundreds of ms (longer with the high-resolution tiers). The keys are files of their
 * own; what waits for the outfit is the size the stage draws a pose at (set by the idle in use) and the last frame, which holds until it is in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setArtManifest, parseArtManifest } from '../../src/engine/ArtManifest.ts';

vi.mock('../../src/engine/PaintedArt.ts', () => ({
  artUrl: (p: string) => p,
  softSilhouette: () => null,
  prewarmPainted: () => Promise.resolve(true),
  // each figure's idle: a different pixel scale, so a key painted for one and shown on the other is resized
  tryLoadMeta: (url: string) => Promise.resolve({ baselineY: /rikku-thief/.test(url) ? 700 : /rikku-gunner/.test(url) ? 650 : 800, scale: 1, width: 600, height: 800 }),
  loadPainted: (url: string) => Promise.resolve({ texture: { dispose: () => undefined }, meta: { width: 600, height: 800, baselineY: 700, scale: 1 }, placeholder: false, url }),
}));

import { HOLD_MAX_MS, TwirlSlot, playAt, twirlTimes } from '../../src/engine/fx/mix/twirl.ts';
import { HIDE_CLASS } from '../../src/engine/fx/mix/twirlColumn.ts';

const MANIFEST = {
  subjects: {
    'rikku-thief': { states: ['idle', 'twirl-start', 'twirl-going'] },
    'rikku-gunner': { states: ['idle', 'twirl-mid'] },
    'rikku-white-mage': { states: ['idle', 'twirl-forming', 'twirl-end'] },
  },
};

type Applied = { pose: string; meta: { scale?: number } };
function girl(deferred: { resolve: () => void; promise: Promise<void> }) {
  const applied: Applied[] = [];
  const a = {
    name: 'rikku',
    poseUrls: { idle: '/art/characters/rikku-thief/idle.png' } as Record<string, string>,
    slots: [{ mesh: {}, pose: 'idle', fade: 1 }, { mesh: {}, pose: 'idle', fade: 0 }],
    active: 0,
    poses: new Map<string, unknown>([['idle', { texture: { dispose: () => undefined }, meta: { scale: 1 } }]]),
    loadPoses: (_poses?: unknown, _initial?: string) => deferred.promise,
    flash: vi.fn(),
    applyPose: (_i: number, pose: string, tex: { meta: { scale?: number } }) => void applied.push({ pose, meta: tex.meta }),
    syncOpacity: () => undefined,
  };
  return { a, applied };
}
const defer = (): { resolve: () => void; promise: Promise<void> } => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { resolve, promise };
};
const flush = async (n = 16): Promise<void> => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

beforeEach(() => {
  document.documentElement.classList.remove(HIDE_CLASS);
  setArtManifest(parseArtManifest(MANIFEST));
});
afterEach(() => setArtManifest(null));

describe('playAt: what shows at a moment of the twirl (pure)', () => {
  const { at, end } = twirlTimes(5, undefined, [2, 2, 3, 2, 3]);
  it('is the key whose time has come, and the play is over at its end once the outfit is in', () => {
    expect(playAt(at, end, 0, false)).toEqual({ i: 0, over: false });
    expect(playAt(at, end, at[2]! + 1, false).i).toBe(2);
    expect(playAt(at, end, end - 1, true)).toEqual({ i: 4, over: false });
    expect(playAt(at, end, end, true)).toEqual({ i: 4, over: true });
  });
  it('past its end it HOLDS the last key while the new outfit is not in', () => {
    expect(playAt(at, end, end + 500, false)).toEqual({ i: 4, over: false });
    expect(playAt(at, end, end + 5000, false)).toEqual({ i: 4, over: false });
  });
});

describe('the twirl starts before the new outfit has loaded (PR-0314)', () => {
  const run = (t: TwirlSlot, ms: number): void => {
    for (let k = 0; k < Math.round(ms / (1000 / 60)); k++) t.update(1 / 60);
  };

  it('plays its first key while the outfit\'s paintings are still loading, sized for the figure standing now', async () => {
    const d = defer();
    const { a, applied } = girl(d);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: '/art/characters/rikku-white-mage/idle.png' });
    await flush();
    expect(t.stats.played).toBe(1); // the play was queued without waiting for `d`
    expect(t.busy()).toBe(true);
    run(t, 100);
    expect(applied.length).toBeGreaterThan(0);
    // twirl-start belongs to the outfit she is leaving (rikku-thief): its own idle is the one standing, so no resize before the outfit lands
    expect(applied[0]!.meta.scale).toBeCloseTo(1, 9);
    t.dispose();
  });

  it('a key painted for another figure is resized for the idle standing NOW, then for the new idle once it is in', async () => {
    const d = defer();
    const { a, applied } = girl(d);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: '/art/characters/rikku-white-mage/idle.png' });
    await flush();
    run(t, 330); // into twirl-mid, which is painted for rikku-gunner (baseline 650) while rikku-thief (700) stands
    const before = applied.at(-1)!.meta.scale!;
    expect(before).toBeCloseTo((700 / 650) * 1, 6); // the stage sizes poses by the idle in use: the thief's
    d.resolve();
    await flush();
    run(t, 40);
    const after = applied.at(-1)!.meta.scale!;
    expect(after).toBeCloseTo((800 / 650) * 1, 6); // now the new outfit's idle (baseline 800) is the one in use
    expect(after).not.toBeCloseTo(before, 3);
    t.dispose();
  });

  it('holds the last key past its end until the new outfit is in, then lets go and shows the column again', async () => {
    const d = defer();
    const { a, applied } = girl(d);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: '/art/characters/rikku-white-mage/idle.png' });
    await flush();
    run(t, 1500); // far past the 640 ms of keys, the outfit still loading
    expect(t.busy()).toBe(true);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(true);
    const n = applied.length;
    run(t, 100);
    expect(applied.length).toBeGreaterThan(n); // still drawing the last key
    d.resolve();
    await flush();
    run(t, 40);
    expect(t.busy()).toBe(false);
    expect(document.documentElement.classList.contains(HIDE_CLASS)).toBe(false);
    t.dispose();
  });

  it('does not hold for ever: an outfit that never lands lets the twirl go after the cap', async () => {
    const d = defer();
    const { a } = girl(d);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: '/art/characters/rikku-white-mage/idle.png' });
    await flush();
    run(t, 640 + HOLD_MAX_MS + 300);
    expect(t.busy()).toBe(false);
    t.dispose();
  });

  it('with the outfit already in (a cached change) it plays as it always did: the keys, then the outfit', async () => {
    const d = defer();
    d.resolve();
    const { a, applied } = girl(d);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: '/art/characters/rikku-white-mage/idle.png' });
    await flush();
    run(t, 800);
    expect(t.busy()).toBe(false);
    expect(applied.length).toBeGreaterThan(30); // the keys, then the final write of the outfit's own idle
  });
});
