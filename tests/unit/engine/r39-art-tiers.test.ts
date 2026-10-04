/**
 * Release 39 ("r39-hires-engine"; both games, shared plumbing): the art budget, the 1x-4x masters and their manifest.
 * Pure arithmetic (`ArtBudget.ts`), the URL and manifest contract (`ArtTier.ts`, `ArtManifest.ts`, `tools/gen/manifest.mjs`)
 * and the device class (`ArtDevice.ts`). No GPU, no browser.
 */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildManifest } from '../../../tools/gen/manifest.mjs';
import {
  backdropScaleFor,
  baseScale,
  budgetFor,
  classifyDevice,
  classifyGpu,
  evictionOrder,
  fallbackScale,
  floorDetail,
  parseTierOverride,
  pickScale,
  requiredScale,
  textureMB,
  tierMove,
  type Resident,
} from '../../../src/engine/ArtBudget.ts';
import { manifestKnowsAsset, parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { artScalesForNow, baseScaleFor, pixelUrlFor, scaleOfUrl, setHiTier, tierUrl, tieredKind } from '../../../src/engine/ArtTier.ts';
import { artBudget, deviceClass, setArtTier, setBufferWidth, setForcedArtScale, setGpuInfo } from '../../../src/engine/ArtDevice.ts';
import { PAINTING_CACHE_MB, cachedPainting, clearPaintingCache, hasPainting, paintingCacheMB, type PreparedPainting } from '../../../src/engine/PaintedArtCache.ts';

afterEach(() => {
  resetArtManifest();
  setForcedArtScale(undefined);
  setHiTier(null);
  setArtTier(null);
  setGpuInfo(null);
  setBufferWidth(0);
});

const manifest = (subjects: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  parseArtManifest({ version: 1, subjects, backdrops: ['gagazet', 'bevelle-underground'], ...extra });

describe('device class', () => {
  it('reads the GPU string', () => {
    expect(classifyGpu('ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('discrete');
    expect(classifyGpu('ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('discrete');
    expect(classifyGpu('ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)')).toBe('discrete');
    expect(classifyGpu('ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('integrated');
    expect(classifyGpu('ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('integrated');
    expect(classifyGpu('Adreno (TM) 740')).toBe('integrated');
    expect(classifyGpu('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe('software');
    expect(classifyGpu('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe('software');
    expect(classifyGpu(null)).toBe('unknown');
    expect(classifyGpu('Something New 9000')).toBe('unknown');
  });
  it('phone first, then software, then discrete, else a middling desktop', () => {
    const d = { bufferWidth: 2560, memoryGB: null as number | null };
    expect(classifyDevice({ ...d, phone: true, gpu: 'NVIDIA GeForce RTX 4090' })).toBe('phone');
    expect(classifyDevice({ ...d, phone: false, gpu: 'Google SwiftShader' })).toBe('low');
    expect(classifyDevice({ ...d, phone: false, gpu: 'NVIDIA GeForce RTX 4090' })).toBe('high');
    expect(classifyDevice({ ...d, phone: false, gpu: 'NVIDIA GeForce RTX 4090', memoryGB: 4 })).toBe('mid');
    expect(classifyDevice({ ...d, phone: false, gpu: 'Intel(R) UHD Graphics' })).toBe('mid');
    expect(classifyDevice({ ...d, phone: false, gpu: null })).toBe('mid');
  });
  it('a forced class beats the address and the device, and the budget follows it', () => {
    setGpuInfo('NVIDIA GeForce RTX 4090');
    expect(deviceClass()).toBe('high');
    setArtTier('phone');
    expect(deviceClass()).toBe('phone');
    expect(artBudget().maxScale).toBe(2);
    expect(artBudget().backdropScale).toBe(1);
    setArtTier(null);
    expect(artBudget().maxScale).toBe(4);
    expect(parseTierOverride('mid')).toBe('mid');
    expect(parseTierOverride('ultra')).toBeNull();
    expect(parseTierOverride(null)).toBeNull();
  });
  it('every class has a budget, and the strong one holds more than the weak one', () => {
    const [phone, low, mid, high] = (['phone', 'low', 'mid', 'high'] as const).map(budgetFor);
    expect(high!.maxScale).toBeGreaterThan(mid!.maxScale);
    expect(high!.textureMB).toBeGreaterThan(mid!.textureMB);
    expect(mid!.textureMB).toBeGreaterThan(low!.textureMB);
    expect(low!.textureMB).toBeGreaterThan(phone!.textureMB);
    expect(high!.backdropScale).toBe(2);
    expect(high!.aa).not.toBe('off');
    expect(phone!.aa).toBe('off');
    expect(low!.aa).toBe('off'); // a software renderer pays for every pass in CPU time
    // a returned budget is the caller's own copy
    const a = budgetFor('high');
    a.maxScale = 1;
    expect(budgetFor('high').maxScale).toBe(4);
  });
  it('the parallax bands are never softer than the painting under them on a desktop, and stay small on a phone', () => {
    const [phone, low, mid, high] = (['phone', 'low', 'mid', 'high'] as const).map(budgetFor);
    expect(phone!.bandPx).toBe(1536); // what every device had before release 39
    expect(low!.bandPx).toBe(1536);
    expect(mid!.bandPx).toBe(2688); // the approved painting's own width
    expect(high!.bandPx).toBe(4096);
  });
  it('a procedural floor is drawn at a scale that follows the class and the buffer, and never past what the GPU can hold', () => {
    const [phone, low, mid, high] = (['phone', 'low', 'mid', 'high'] as const).map(budgetFor);
    const edge = 2048; // the Fahrenheit's foredeck: 1024 x 2048 at design size
    expect(floorDetail(phone!, 2560, edge, 16384)).toBe(1);
    expect(floorDetail(low!, 3840, edge, 16384)).toBe(1);
    expect(floorDetail(mid!, 2560, edge, 16384)).toBe(2);
    expect(floorDetail(mid!, 3840, edge, 16384)).toBe(2); // a mid card does not get a third
    expect(floorDetail(high!, 2560, edge, 16384)).toBe(2);
    expect(floorDetail(high!, 3840, edge, 16384)).toBe(3); // 4K magnifies a low-angle floor half again as much
    expect(floorDetail(high!, 3840, edge, 4096)).toBe(2); // a 4096 texture limit: two at most
    expect(floorDetail(high!, 3840, edge, 2048)).toBe(1);
    expect(floorDetail(high!, 3840, 0, 16384)).toBeGreaterThanOrEqual(1);
  });
});

describe('what a size asks for', () => {
  it('textures cost their mip chain', () => {
    expect(textureMB(2048, 2048)).toBeCloseTo(21.33, 1);
    expect(textureMB(5376, 3072)).toBeCloseTo(84, 0);
  });
  it('a master is asked for when a texel would be magnified past one pixel', () => {
    expect(requiredScale(0.62)).toBeCloseTo(0.62);
    expect(requiredScale(2.95)).toBeCloseTo(2.95); // Tidus `ready` at HERO CLOSE, 1440p
    expect(requiredScale(0)).toBe(1);
    expect(requiredScale(3, 1.5)).toBe(2);
  });
  it('picks the smallest master that is enough, else the largest the cap allows, else 1x', () => {
    expect(pickScale(0.9, [2, 3, 4], 4)).toBe(1);
    expect(pickScale(1.0, [2, 3, 4], 4)).toBe(1);
    expect(pickScale(1.2, [2, 3, 4], 4)).toBe(2);
    expect(pickScale(2.95, [2, 3, 4], 4)).toBe(3);
    expect(pickScale(3.01, [2, 3, 4], 4)).toBe(4);
    expect(pickScale(3.01, [2, 4], 4)).toBe(4);
    expect(pickScale(2.2, [2, 4], 4)).toBe(4); // no 3x on disk: the next one up
    expect(pickScale(6, [2, 3, 4], 4)).toBe(4); // more than any master: the best there is
    expect(pickScale(6, [2, 3, 4], 2)).toBe(2); // the device's cap
    expect(pickScale(2.5, [], 4)).toBe(1); // nothing on disk
    expect(pickScale(2.5, [4], 2)).toBe(1); // only masters above the cap
  });
  it('a missing master falls back one tier at a time', () => {
    expect(fallbackScale(4, [2, 3, 4])).toBe(3);
    expect(fallbackScale(3, [2, 4])).toBe(2);
    expect(fallbackScale(2, [2, 4])).toBe(1);
    expect(fallbackScale(4, [])).toBe(1);
  });
  it('the base scale follows the buffer and the ceiling', () => {
    const high = budgetFor('high');
    expect(baseScale(high, 1920)).toBe(1);
    expect(baseScale(high, 2560)).toBe(2);
    expect(baseScale(high, 3840)).toBe(2);
    expect(baseScale(budgetFor('phone'), 2560)).toBe(2);
    expect(baseScale({ ...high, maxScale: 1 }, 3840)).toBe(1);
    expect(backdropScaleFor(high, 1920)).toBe(1);
    expect(backdropScaleFor(high, 2560)).toBe(2);
    expect(backdropScaleFor(budgetFor('mid'), 3840)).toBe(1);
  });
  it('a slot only ever moves up from here; eviction owns going down', () => {
    expect(tierMove(1, 2.7, [2, 3, 4], 4)).toBe('up');
    expect(tierMove(3, 2.7, [2, 3, 4], 4)).toBe('keep');
    expect(tierMove(4, 1.1, [2, 3, 4], 4)).toBe('keep');
    expect(tierMove(2, 5, [2, 3, 4], 2)).toBe('keep'); // capped
  });
});

describe('eviction', () => {
  const r = (key: string, scale: number, mb: number, lastSeen: number, visible = false): Resident => ({ key, scale, mb, lastSeen, visible });
  it('drops nothing while under the budget', () => {
    expect(evictionOrder([r('a', 4, 50, 1)], 100)).toEqual([]);
  });
  it('drops masters least recently seen first, never a visible one, never the approved 1x', () => {
    const list = [r('base', 1, 40, 0), r('old4', 4, 60, 3), r('new4', 4, 60, 9), r('on3', 3, 40, 1, true), r('mid2', 2, 20, 5)];
    expect(evictionOrder(list, 200)).toEqual(['old4']); // 220 -> 160
    expect(evictionOrder(list, 150)).toEqual(['old4', 'mid2']); // 220 -> 160 -> 140
    expect(evictionOrder(list, 100)).toEqual(['old4', 'mid2', 'new4']); // base and the visible one stay: still over, by design
  });
  it('among equals the bigger one goes first', () => {
    expect(evictionOrder([r('s', 2, 10, 4), r('b', 4, 50, 4)], 30)).toEqual(['b']);
  });
});

describe('master URLs', () => {
  it('names a figure state or a backdrop at a scale, and nothing else', () => {
    expect(tierUrl('/pyrefly-reprise/art/characters/tidus/ready.png', 3)).toBe('/pyrefly-reprise/art/characters/tidus/ready@3x.png');
    expect(tierUrl('/art/characters/sin-left-fin/idle-far.png?v=1', 4)).toBe('/art/characters/sin-left-fin/idle-far@4x.png?v=1');
    expect(tierUrl('/art/backdrops/gagazet.png', 2)).toBe('/art/backdrops/gagazet@2x.png');
    expect(tierUrl('/art/characters/tidus/idle.png', 1)).toBeNull();
    expect(tierUrl('/art/characters/tidus/idle.png', 5)).toBeNull();
    expect(tierUrl('/art/characters/tidus/idle.png', 2.5)).toBeNull();
    expect(tierUrl('/art/characters/tidus/idle.2.png', 2)).toBeNull();
    expect(tierUrl('/art/portraits/tidus.png', 2)).toBeNull();
    expect(tierUrl('/art/title/keyart.png', 2)).toBeNull();
    expect(tieredKind('/art/characters/tidus/idle.png')).toBe('figure');
    expect(tieredKind('/art/backdrops/gagazet.png')).toBe('backdrop');
    expect(tieredKind('/art/pause/ch1.png')).toBeNull();
  });
  it('reads a master back to its scale', () => {
    expect(scaleOfUrl('/art/characters/tidus/ready@3x.png')).toBe(3);
    expect(scaleOfUrl('/art/characters/tidus/ready@4x.webp?x=1')).toBe(4);
    expect(scaleOfUrl('/art/characters/tidus/ready.png')).toBe(1);
    expect(scaleOfUrl('/art/pause/ch1.2x.webp')).toBe(1);
  });
});

describe('the manifest lists masters, and only those beside a 1x file', () => {
  const m = () =>
    manifest(
      {
        tidus: { states: ['idle', 'ready'], portrait: false, tiers: { idle: [4, 2], ready: [2, 3, 4], ghost: [2, 7] } },
        evrae: { states: ['idle'], portrait: false, states2x: ['idle'] },
        auron: { states: ['idle'], portrait: false },
      },
      { backdropTiers: { gagazet: [2], unknown: [2] } },
    );
  it('parses tiers sorted, within 2 to 4, for known states; an old states2x reads as [2]', () => {
    const parsed = m();
    expect(parsed?.subjects['tidus']?.tiers).toEqual({ idle: [2, 4], ready: [2, 3, 4] });
    expect(parsed?.subjects['evrae']?.tiers).toEqual({ idle: [2] });
    expect(parsed?.subjects['evrae']?.states2x).toEqual(['idle']);
    expect(parsed?.subjects['auron']?.tiers).toBeUndefined();
    expect(parsed?.backdropTiers).toEqual({ gagazet: [2] });
  });
  it('knows each master by its file name', async () => {
    setArtManifest(m());
    expect(await manifestKnowsAsset('/art/characters/tidus/ready@3x.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/characters/tidus/idle@3x.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/characters/tidus/idle@4x.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/characters/evrae/idle@2x.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/characters/auron/idle@2x.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/backdrops/gagazet@2x.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/backdrops/gagazet@4x.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/backdrops/bevelle-underground@2x.png')).toBe(false);
  });
  it('answers which scales a painting has, or null with no manifest', async () => {
    expect(artScalesForNow('/art/characters/tidus/ready.png')).toBeNull();
    setArtManifest(m());
    expect(artScalesForNow('/art/characters/tidus/ready.png')).toEqual([2, 3, 4]);
    expect(artScalesForNow('/art/characters/tidus/ready@2x.png')).toEqual([]);
    expect(artScalesForNow('/art/characters/auron/idle.png')).toEqual([]);
    expect(artScalesForNow('/art/backdrops/gagazet.png')).toEqual([2]);
    expect(artScalesForNow('/art/portraits/tidus.png')).toEqual([]);
  });
  it('the generator lists every scale beside its 1x file, and backdrops too', () => {
    const root = mkdtempSync(join(tmpdir(), 'pyrefly-r39-'));
    try {
      const dir = join(root, 'characters', 'tidus');
      mkdirSync(dir, { recursive: true });
      for (const f of ['idle', 'ready']) {
        writeFileSync(join(dir, `${f}.png`), 'x');
        writeFileSync(join(dir, `${f}.json`), '{}');
      }
      for (const f of ['idle@2x', 'idle@4x', 'ready@3x', 'ready@4x', 'hurt@3x', 'idle@5x', 'idle.2@2x']) writeFileSync(join(dir, `${f}.png`), 'x');
      const back = join(root, 'backdrops');
      mkdirSync(back, { recursive: true });
      for (const f of ['gagazet.png', 'gagazet@2x.png', 'orphan@2x.png']) writeFileSync(join(back, f), 'x');
      const { manifest: out, warnings } = buildManifest(root, { now: 'T' });
      expect(out.subjects['tidus']?.tiers).toEqual({ idle: [2, 4], ready: [3, 4] });
      expect(out.subjects['tidus']?.states2x).toEqual(['idle']);
      expect(out.backdropTiers).toEqual({ gagazet: [2] });
      expect(warnings.join(' ')).not.toContain('@');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('which file a painting is drawn from', () => {
  const tidus = () => manifest({ tidus: { states: ['idle', 'ready', 'attack'], portrait: false, tiers: { idle: [2, 4], ready: [2, 3, 4] } } }, { backdropTiers: { gagazet: [2] } });
  it('draws the 1x file under 1440p and the 2x master from 1440p up, then whatever the governor asks for', async () => {
    setArtManifest(tidus());
    setArtTier('high');
    setBufferWidth(1920);
    expect(baseScaleFor('/art/characters/tidus/ready.png')).toBe(1);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready.png');
    setBufferWidth(2560);
    expect(baseScaleFor('/art/characters/tidus/ready.png')).toBe(2);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready@2x.png');
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 2.95)).toBe('/art/characters/tidus/ready@3x.png');
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 3.4)).toBe('/art/characters/tidus/ready@4x.png');
    expect(await pixelUrlFor('/art/characters/tidus/idle.png', 2.95)).toBe('/art/characters/tidus/idle@4x.png'); // no 3x of idle on disk
    expect(await pixelUrlFor('/art/characters/tidus/attack.png', 3)).toBe('/art/characters/tidus/attack.png'); // none at all
  });
  it('a weaker device stops at its own ceiling', async () => {
    setArtManifest(tidus());
    setBufferWidth(3840);
    setArtTier('mid');
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 4)).toBe('/art/characters/tidus/ready@2x.png');
    setArtTier('phone');
    setBufferWidth(780);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready.png');
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 1.8)).toBe('/art/characters/tidus/ready@2x.png');
  });
  it('a backdrop is drawn from its 2x master only where the device holds it', async () => {
    setArtManifest(tidus());
    setBufferWidth(2560);
    setArtTier('high');
    expect(await pixelUrlFor('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet@2x.png');
    setBufferWidth(1920);
    expect(await pixelUrlFor('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.png');
    setBufferWidth(2560);
    setArtTier('mid');
    expect(await pixelUrlFor('/art/backdrops/gagazet.png')).toBe('/art/backdrops/gagazet.png');
    expect(await pixelUrlFor('/art/backdrops/bevelle-underground.png')).toBe('/art/backdrops/bevelle-underground.png');
  });
  it('the base load never goes above the base scale, and a pin takes the nearest master below it', async () => {
    setArtManifest(manifest({ tidus: { states: ['idle', 'ready'], portrait: false, tiers: { idle: [4], ready: [2, 4] } } }));
    setArtTier('high');
    setBufferWidth(2560);
    expect(await pixelUrlFor('/art/characters/tidus/idle.png')).toBe('/art/characters/tidus/idle.png'); // only a 4x on disk: the base is 2
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready@2x.png');
    expect(await pixelUrlFor('/art/characters/tidus/idle.png', 2)).toBe('/art/characters/tidus/idle@4x.png'); // the governor may ask for more
    setForcedArtScale(3);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready@2x.png'); // pinned to 3, no 3x: the 2x
    setForcedArtScale(null);
  });
  it('without a manifest the 1x painting is drawn, as it always was', async () => {
    setArtTier('high');
    setBufferWidth(3840);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 3)).toBe('/art/characters/tidus/ready.png');
  });
  it('release 35\'s pins still hold: false is every painting at 1x, true at least 2x', async () => {
    setArtManifest(tidus());
    setArtTier('mid');
    setBufferWidth(1920);
    setHiTier(false);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png', 3)).toBe('/art/characters/tidus/ready.png');
    setHiTier(true);
    expect(baseScaleFor('/art/characters/tidus/ready.png')).toBe(2);
    expect(await pixelUrlFor('/art/characters/tidus/ready.png')).toBe('/art/characters/tidus/ready@2x.png');
  });
});

describe('the painting cache is bounded by decoded size as well as by count', () => {
  const painting = (px: number): PreparedPainting => ({ source: { naturalWidth: px, naturalHeight: px } as unknown as HTMLImageElement, cleaned: false, meta: { width: 1, height: 1, baselineY: 1 }, scale: 4 });
  afterEach(() => clearPaintingCache());
  it('drops the oldest masters once the decoded pixels pass the limit, never the one just made', async () => {
    clearPaintingCache();
    const big = Math.round(Math.sqrt((PAINTING_CACHE_MB / 3.5) * 1024 * 1024 / 4)); // about 257 MB decoded each: four of them pass the limit
    for (const k of ['a', 'b', 'c', 'd']) await cachedPainting(k, async () => painting(big));
    expect(hasPainting('a')).toBe(false);
    expect(hasPainting('d')).toBe(true);
    expect(paintingCacheMB()).toBeLessThanOrEqual(PAINTING_CACHE_MB);
  });
  it('small paintings are not touched by it', async () => {
    clearPaintingCache();
    for (const k of ['a', 'b', 'c']) await cachedPainting(k, async () => painting(512));
    expect([hasPainting('a'), hasPainting('b'), hasPainting('c')]).toEqual([true, true, true]);
    expect(paintingCacheMB()).toBeCloseTo(3, 0);
  });
});
