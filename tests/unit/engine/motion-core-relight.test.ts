/**
 * Motion pass, lane "core", step 2 (MAP fact 11): no pose is ever drawn unlit at first use. A staged figure's normal maps are fetched and PINNED the moment its paintings are staged
 * (`PaintedActor.prefetchLights` -> `FigureRelight.prefetchRelight`), the cache's cap (it was 56: Chapter I stages 50 maps) leaves room for two chapters besides, and a pinned map is never evicted;
 * the figure's disposal lets them go. Nothing happens unless a look is armed. Game case: both (shared plumbing; the HD-2D look is on in exactly Chapters I and IV).
 */
import { ShaderMaterial, Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lookState } from '../../../src/engine/look/LookState.ts';
import { bindRelight, pinnedRelightCount, prefetchRelight, relightStats, unpinRelight } from '../../../src/engine/look/relight/FigureRelight.ts';

let loads: string[] = [];
let armedBefore = false;

beforeEach(() => {
  armedBefore = lookState.armed;
  loads = [];
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, url: string, onLoad?: (t: Texture) => void): Texture {
    loads.push(url);
    const t = new Texture();
    onLoad?.(t);
    return t;
  } as never);
});
afterEach(() => {
  lookState.armed = armedBefore;
  vi.restoreAllMocks();
});

const painting = (subject: string, pose: string): string => `/art/characters/${subject}/${pose}.png`;
const mat = (): ShaderMaterial => new ShaderMaterial({ uniforms: {} });

describe('prefetch and pin', () => {
  it('does nothing with no look armed', () => {
    lookState.armed = false;
    const before = relightStats.requested;
    expect(prefetchRelight(painting('tidus', 'attack'), 1)).toBeNull();
    expect(relightStats.requested).toBe(before);
    expect(loads).toHaveLength(0);
  });

  it('fetches a staged pose\'s map once, pins it, and answers the same URL the figure will bind', () => {
    lookState.armed = true;
    const before = relightStats.requested;
    const url = prefetchRelight(painting('tidus', 'follow'), 1)!;
    expect(url).toContain('follow');
    expect(url).toContain('normal');
    expect(relightStats.requested).toBe(before + 1);
    expect(prefetchRelight(painting('tidus', 'follow'), 1)).toBe(url);
    expect(relightStats.requested).toBe(before + 1); // not fetched twice
    // the figure binding the same pose later finds the map there: lit at once, no wait
    const m = mat();
    bindRelight(m, painting('tidus', 'follow'), 1);
    expect(m.uniforms['relightOn']!.value).toBe(1);
    expect(relightStats.requested).toBe(before + 1);
    unpinRelight([url]);
  });

  it('a placeholder, or a painting with no URL, has no map to fetch', () => {
    lookState.armed = true;
    expect(prefetchRelight(undefined, 1)).toBeNull();
    expect(prefetchRelight(painting('tidus', 'idle'), 1, true)).toBeNull();
  });

  it('a pinned map survives the cache filling past its cap; an unpinned one does not; unpinning lets it go', () => {
    lookState.armed = true;
    const keep = prefetchRelight(painting('kimahri', 'ready'), 1)!;
    const requested = relightStats.requested;
    for (let i = 0; i < 140; i++) bindRelight(mat(), painting(`filler${i}`, 'idle'), 1); // 140 other figures' maps through the cache
    expect(relightStats.requested).toBe(requested + 140);
    expect(prefetchRelight(painting('kimahri', 'ready'), 1)).toBe(keep);
    expect(relightStats.requested).toBe(requested + 140); // still cached: not fetched again
    bindRelight(mat(), painting('filler0', 'idle'), 1);
    expect(relightStats.requested).toBe(requested + 141); // the oldest unpinned one went
    const pinned = pinnedRelightCount();
    unpinRelight([keep]);
    expect(pinnedRelightCount()).toBe(pinned - 1);
  });

  it('the cap leaves room for two chapters\' staged maps (56 for Chapter IV, 50 for Chapter I)', () => {
    lookState.armed = true;
    const requested = relightStats.requested;
    const urls: string[] = [];
    for (let i = 0; i < 106; i++) urls.push(prefetchRelight(painting(`staged${i % 9}`, `pose${i}`), 1)!);
    expect(relightStats.requested).toBe(requested + 106);
    for (let i = 0; i < 106; i++) prefetchRelight(painting(`staged${i % 9}`, `pose${i}`), 1);
    expect(relightStats.requested).toBe(requested + 106); // all still there
    unpinRelight(urls);
  });
});
