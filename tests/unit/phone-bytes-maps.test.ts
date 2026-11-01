/**
 * Release 73, lane "r73-bytes" (BOTH games, shared lighting plumbing; ChatGPT point 5, `docs/BUDGETS.md` B2a): on the phone class the idle lighting map of a figure drawn for the first time waits for the
 * entry's hold. Release 70's phone10 run asked for the five idle maps (2.2 MB in Chapter I, 1.8 MB in Chapter IV) 0.4 s after the battle screen began to enter, because the first draw of a figure binds its
 * material to the map of the pose it draws and `bindRelight` fetched it at once; the hold of release 69 deferred only the maps of the other poses (`prefetchLights`). The map is not drawn before the field is
 * shown (the load card covers it), the shader program is compiled with the relight block at the bind and does not change when the map lands (a uniform), so only the time of the bytes moves.
 *
 * The caches are real; three's `TextureLoader` is the only stub. The hold is the real `LoadHold`.
 */
import { ShaderMaterial, Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindRelight, prefetchRelight, relightCacheStats, releaseRelightBefore, unpinRelight } from '../../src/engine/look/relight/FigureRelight.ts';
import { lookState } from '../../src/engine/look/LookState.ts';
import { bytesBooks, holdBackground, releaseBackground, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';

let armedBefore = false;
let asked: string[] = [];
let landNow = true;
let landers: Array<() => void> = [];

const art = (subject: string, pose: string): string => `/art/characters/${subject}/${pose}.png`;
const mat = (): ShaderMaterial => new ShaderMaterial({ uniforms: {} });
const flush = async (): Promise<void> => {
  for (let i = 0; i < 30; i++) await Promise.resolve();
};

beforeEach(() => {
  armedBefore = lookState.armed;
  lookState.armed = true;
  asked = [];
  landNow = true;
  landers = [];
  resetHoldForTests();
  releaseRelightBefore(Number.MAX_SAFE_INTEGER);
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, url: string, onLoad?: (t: Texture) => void): Texture {
    asked.push(url);
    const t = new Texture();
    if (landNow) onLoad?.(t);
    else landers.push(() => onLoad?.(t));
    return t;
  } as never);
});
afterEach(() => {
  lookState.armed = armedBefore;
  releaseRelightBefore(Number.MAX_SAFE_INTEGER);
  resetHoldForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('the idle map of a figure drawn for the first time', () => {
  it('not held (a desktop): bound and asked for at once, as before', () => {
    const m = mat();
    bindRelight(m, art('tidus', 'idle'), 1);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('/tidus/idle');
    expect(m.uniforms['relightOn']!.value).toBe(1);
    expect(bytesBooks().idleMaps).toBe(0);
  });

  it('held (the phone\'s entry): nothing is asked for while the line is held, the material waits unlit, and the map is asked for when the hold opens', async () => {
    setForegroundFirst(true);
    holdBackground();
    const m = mat();
    bindRelight(m, art('tidus', 'idle'), 1);
    await flush();
    expect(asked).toEqual([]);
    expect(relightCacheStats()).toMatchObject({ maps: 1, textures: 0 }); // on the book as loading, so nobody asks for it twice
    expect(m.uniforms['relightOn']!.value).toBe(0);
    releaseBackground();
    await flush();
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain('/tidus/idle');
    expect(m.uniforms['relightOn']!.value).toBe(1); // lit the moment it lands
    expect(bytesBooks().idleMaps).toBe(1);
  });

  it('?phonebytes=off keeps release 69/70\'s order while the hold stays shut: the idle map is asked for at once', async () => {
    vi.stubGlobal('location', { search: '?phonebytes=off' });
    setForegroundFirst(true);
    holdBackground();
    bindRelight(mat(), art('tidus', 'idle'), 1);
    expect(asked).toHaveLength(1);
    expect(bytesBooks().idleMaps).toBe(0);
  });

  it('a pose drawn again while the line is held does not promote its map ahead of the hold', async () => {
    setForegroundFirst(true);
    holdBackground();
    const m = mat();
    bindRelight(m, art('yuna', 'idle'), 1);
    bindRelight(m, art('yuna', 'idle'), 1); // the figure re-applies its pose (a resize, a swap): still waiting
    bindRelight(mat(), art('yuna', 'idle'), 1); // a second plane of the same pose
    await flush();
    expect(asked).toEqual([]);
    releaseBackground();
    await flush();
    expect(asked.filter((u) => u.includes('/yuna/idle'))).toHaveLength(1); // once
  });

  it('after the hold opens the idle maps go first, then the everyday moves\' maps, then the rare ones\' (the queue\'s rank order)', async () => {
    setForegroundFirst(true);
    holdBackground();
    const pins = new Set<string>();
    prefetchRelight(art('kimahri', 'victory'), 1, false, pins); // need 3: rank 7
    prefetchRelight(art('kimahri', 'attack'), 1, false, pins); // need 1: rank 3
    bindRelight(mat(), art('kimahri', 'idle'), 1); // need 0: rank 1
    await flush();
    expect(asked).toEqual([]);
    releaseBackground();
    await flush();
    expect(asked.map((u) => /\/kimahri\/([a-z]+)/.exec(u)![1])).toEqual(['idle', 'attack', 'victory']);
    unpinRelight(pins);
  });

  it('a map released before the hold opened (the fight ended, the screen was torn down) is never asked for', async () => {
    setForegroundFirst(true);
    holdBackground();
    bindRelight(mat(), art('rikku', 'idle'), 1);
    expect(relightCacheStats().maps).toBe(1);
    releaseRelightBefore(Number.MAX_SAFE_INTEGER);
    releaseBackground();
    await flush();
    expect(asked).toEqual([]);
    expect(relightCacheStats().maps).toBe(0);
  });

  it('once the hold is open a pose being drawn asks at once again, and a map that is already there is adopted without a request', async () => {
    setForegroundFirst(true);
    holdBackground();
    bindRelight(mat(), art('paine', 'idle'), 1);
    releaseBackground();
    await flush();
    expect(asked).toHaveLength(1);
    const again = mat();
    bindRelight(again, art('paine', 'idle'), 1);
    expect(asked).toHaveLength(1);
    expect(again.uniforms['relightOn']!.value).toBe(1);
    bindRelight(mat(), art('paine', 'ready'), 1); // a new pose, hold open: now
    expect(asked.map((u) => /\/paine\/([a-z]+)/.exec(u)![1])).toEqual(['idle', 'ready']);
  });

  it('a map that is on its way when the hold opens is not asked for twice, and a late bind promotes nothing it should not', async () => {
    landNow = false;
    setForegroundFirst(true);
    holdBackground();
    const a = mat();
    bindRelight(a, art('lulu', 'idle'), 1);
    releaseBackground();
    await flush();
    expect(asked).toHaveLength(1);
    bindRelight(mat(), art('lulu', 'idle'), 1); // loading: waits with the first
    expect(asked).toHaveLength(1);
    for (const land of landers) land();
    expect(a.uniforms['relightOn']!.value).toBe(1);
  });
});
