/**
 * Leaving a fight lets go of what the fight did not use (lane "budgets-2", 2026-10-29; BOTH games, shared loading and memory plumbing; `docs/BUDGETS.md` B5a, release 68's finding R68-B1).
 *
 * The decoded-painting cache (`PaintedArtCache`) and the lighting-map cache (`FigureRelight`) keep the chapter before the one being played, for a retry that never comes from it. A fight is a
 * numbered epoch (`LeaveRelease.beginFight`); when it ends and its figures have let go of their pins, what it did not touch goes (`endFight`), and what it touched stays, so a retry is as warm as before.
 * The caches are real, three's `TextureLoader` is the only stub (it answers at once with a real `Texture`).
 */
import { Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beginPaintingEpoch, cachedPainting, clearPaintingCache, dropPaintingsBefore, paintingCacheMB, paintingCacheSize, paintingKey, type PreparedPainting } from '../../src/engine/PaintedArtCache.ts';
import { beginRelightEpoch, bindRelight, prefetchRelight, relightCacheStats, releaseRelightBefore, unpinRelight } from '../../src/engine/look/relight/FigureRelight.ts';
import { lookState } from '../../src/engine/look/LookState.ts';
import { beginFight, endFight, memRelease, memoryBooks, setMemRelease } from '../../src/engine/LeaveRelease.ts';
import { bindEyeCandyScene, boundEyeCandyScene } from '../../src/engine/fx/a/GoldenHour.ts';
import { ShaderMaterial } from 'three';

const prepared = (w = 1024, h = 1024): PreparedPainting => ({ source: { width: w, height: h } as unknown as HTMLImageElement, cleaned: false, meta: { width: w, height: h, baselineY: h } });
const ask = (url: string, w = 1024, h = 1024): Promise<PreparedPainting | null> => cachedPainting(paintingKey(url, { mode: 'auto' }, {}), async () => prepared(w, h));

let armedBefore = false;
let loaded: Texture[] = [];
let pendingLoads: Array<() => void> = [];
let deferLoads = false;

beforeEach(() => {
  armedBefore = lookState.armed;
  loaded = [];
  pendingLoads = [];
  deferLoads = false;
  clearPaintingCache();
  releaseRelightBefore(Number.MAX_SAFE_INTEGER); // whatever an earlier test left unpinned
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, _url: string, onLoad?: (t: Texture) => void): Texture {
    const t = new Texture();
    loaded.push(t);
    if (deferLoads) pendingLoads.push(() => onLoad?.(t));
    else onLoad?.(t);
    return t;
  } as never);
});
afterEach(() => {
  lookState.armed = armedBefore;
  setMemRelease(undefined);
  bindEyeCandyScene(null);
  vi.restoreAllMocks();
});

const art = (subject: string, pose: string): string => `/art/characters/${subject}/${pose}.png`;

describe('the decoded-painting cache, by fight', () => {
  it('drops the paintings a fight did not ask for and keeps the ones it did', async () => {
    const before = beginPaintingEpoch();
    await ask(art('tidus', 'idle'));
    await ask(art('tidus', 'attack'));
    await ask(art('bahamut', 'idle'));
    expect(paintingCacheSize()).toBe(3);
    const fight = beginPaintingEpoch();
    expect(fight).toBe(before + 1);
    await ask(art('tidus', 'idle')); // a hit in the new fight: kept
    await ask(art('yuna', 'idle')); // made in the new fight: kept
    const out = dropPaintingsBefore(fight);
    expect(out.dropped).toBe(2); // tidus/attack and bahamut/idle were the chapter before
    expect(paintingCacheSize()).toBe(2);
    expect(out.mb).toBeCloseTo(8, 5); // two 1024 x 1024 RGBA paintings
    expect(paintingCacheMB()).toBeCloseTo(8, 5);
  });

  it('a hit in the new fight is not made again, a dropped painting is', async () => {
    let made = 0;
    const make = async (): Promise<PreparedPainting> => (made++, prepared());
    const key = paintingKey(art('kimahri', 'idle'), undefined, undefined);
    await cachedPainting(key, make);
    const fight = beginPaintingEpoch();
    await cachedPainting(key, make);
    expect(made).toBe(1);
    expect(dropPaintingsBefore(fight).dropped).toBe(0);
    const next = beginPaintingEpoch();
    expect(dropPaintingsBefore(next).dropped).toBe(1);
    await cachedPainting(key, make);
    expect(made).toBe(2); // the next fight that wants it prepares it again
  });

  it('a painting still being made when the fight ends is dropped from the book and not kept when it lands', async () => {
    let finish!: (p: PreparedPainting) => void;
    const slow = new Promise<PreparedPainting>((r) => (finish = r));
    beginPaintingEpoch();
    const key = paintingKey(art('wakka', 'idle'), undefined, undefined);
    const asked = cachedPainting(key, () => slow);
    const fight = beginPaintingEpoch();
    expect(dropPaintingsBefore(fight).dropped).toBe(1);
    finish(prepared());
    expect(await asked).not.toBeNull(); // whoever asked still gets it
    expect(paintingCacheSize()).toBe(0); // and the cache did not take it back
  });

  it('a miss (a file that is not there) is never remembered, so nothing is left to drop', async () => {
    beginPaintingEpoch();
    await cachedPainting(paintingKey(art('nobody', 'idle'), undefined, undefined), async () => null);
    expect(paintingCacheSize()).toBe(0);
    expect(dropPaintingsBefore(beginPaintingEpoch()).dropped).toBe(0);
  });
});

describe('the lighting-map cache, by fight', () => {
  const mat = (): ShaderMaterial => new ShaderMaterial({ uniforms: {} });

  it('frees the maps of the chapter before once its figures have let go, keeps the ones this fight used, and never frees a pinned one', () => {
    lookState.armed = true;
    const first = beginPaintingEpoch();
    beginRelightEpoch(first);
    const oldPins = new Set<string>();
    for (const p of ['idle', 'attack', 'hurt']) prefetchRelight(art('tidus', p), 1, false, oldPins);
    expect(relightCacheStats()).toMatchObject({ maps: 3, textures: 3 });
    const second = beginPaintingEpoch();
    beginRelightEpoch(second);
    const newPins = new Set<string>();
    prefetchRelight(art('yuna', 'idle'), 1, false, newPins);
    prefetchRelight(art('yuna', 'cast'), 1, false, newPins);
    // the old figures are disposed (their pins let go); the new ones are still on stage
    unpinRelight(oldPins);
    expect(releaseRelightBefore(second)).toBe(3);
    expect(relightCacheStats()).toMatchObject({ maps: 2, textures: 2, pinned: 2 });
    expect(loaded.slice(0, 3).every((t) => t instanceof Texture)).toBe(true);
    // the fight ends: its own figures let go, but its maps were touched in it, so a retry finds them
    unpinRelight(newPins);
    expect(releaseRelightBefore(second)).toBe(0);
    expect(relightCacheStats().maps).toBe(2);
    // a pinned map is never freed, whatever its age
    const later = beginPaintingEpoch();
    beginRelightEpoch(later);
    const held = new Set<string>();
    prefetchRelight(art('yuna', 'idle'), 1, false, held);
    beginRelightEpoch(later + 1);
    expect(releaseRelightBefore(later + 1)).toBe(1); // yuna/cast: unpinned and not touched in `later`
    expect(relightCacheStats().maps).toBe(1);
    unpinRelight(held);
  });

  it('a map the material binds counts as used in the fight (the figure drew that pose)', () => {
    lookState.armed = true;
    const a = beginPaintingEpoch();
    beginRelightEpoch(a);
    bindRelight(mat(), art('auron', 'idle'), 1);
    const b = beginPaintingEpoch();
    beginRelightEpoch(b);
    bindRelight(mat(), art('auron', 'idle'), 1); // drawn again in the next fight
    expect(releaseRelightBefore(b)).toBe(0);
    expect(relightCacheStats().maps).toBe(1);
    const c = beginPaintingEpoch();
    expect(releaseRelightBefore(c)).toBe(1);
  });

  it('a map that arrives after it was released is disposed and not kept', () => {
    lookState.armed = true;
    deferLoads = true;
    const e = beginPaintingEpoch();
    beginRelightEpoch(e);
    const held = new Set<string>();
    prefetchRelight(art('rikku', 'idle'), 1, false, held);
    expect(relightCacheStats()).toMatchObject({ maps: 1, textures: 0 });
    unpinRelight(held); // the figure that asked is gone
    const next = beginPaintingEpoch();
    beginRelightEpoch(next);
    // the unpinned, untouched, still-loading map is forgotten
    expect(releaseRelightBefore(next)).toBe(0);
    expect(relightCacheStats().maps).toBe(0);
    const spy = vi.spyOn(loaded[0]!, 'dispose');
    pendingLoads.forEach((f) => f());
    expect(spy).toHaveBeenCalled();
    expect(relightCacheStats().maps).toBe(0);
  });
});

describe('beginFight and endFight', () => {
  it('end to end: the chapter before goes from both caches and from the eye-candy binding, this fight\'s set stays', async () => {
    lookState.armed = true;
    beginFight();
    await ask(art('tidus', 'idle'));
    const oldPins = new Set<string>();
    prefetchRelight(art('tidus', 'idle'), 1, false, oldPins);
    bindEyeCandyScene({ key: 'gagazet', game: 'ffx', scene: {} as never, palette: null });
    unpinRelight(oldPins);
    // the next fight
    beginFight();
    await ask(art('yuna', 'idle'));
    const newPins = new Set<string>();
    prefetchRelight(art('yuna', 'idle'), 1, false, newPins);
    expect(boundEyeCandyScene()).not.toBeNull();
    const out = endFight();
    expect(out).toEqual({ paintings: 1, paintingMB: 4, maps: 1 });
    expect(paintingCacheSize()).toBe(1);
    expect(relightCacheStats().maps).toBe(1); // yuna's map: its figures have not let go in this test, so nothing pinned it; it was touched in the fight, so it stays
    expect(boundEyeCandyScene()).toBeNull();
    expect(memoryBooks()).toMatchObject({ paintings: 1, paintingMB: 4, release: true, fight: 0 });
    expect(memoryBooks().last).toEqual(out);
    unpinRelight(newPins);
  });

  it('?memrelease=off (and the demo\'s keep) let go of nothing but still unbind the scene', async () => {
    beginFight();
    await ask(art('tidus', 'idle'));
    bindEyeCandyScene({ key: 'k', game: 'ffx', scene: {} as never, palette: null });
    beginFight();
    setMemRelease(false);
    expect(memRelease()).toBe(false);
    expect(endFight()).toBeNull();
    expect(paintingCacheSize()).toBe(1);
    expect(boundEyeCandyScene()).toBeNull();
    setMemRelease(undefined);
    beginFight();
    await ask(art('yuna', 'idle'));
    expect(endFight({ keep: true })).toBeNull();
    expect(paintingCacheSize()).toBe(2);
  });

  it('is safe without a begin and when called twice', async () => {
    expect(endFight()).toBeNull();
    beginFight();
    await ask(art('tidus', 'idle'));
    expect(endFight()).toEqual({ paintings: 0, paintingMB: 0, maps: 0 });
    expect(endFight()).toBeNull();
    expect(paintingCacheSize()).toBe(1);
  });

  it('reads the word off the address', () => {
    vi.stubGlobal('location', { search: '?memrelease=off' });
    try {
      expect(memRelease()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(memRelease()).toBe(true);
  });
});
