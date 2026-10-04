/**
 * Release 38 ("r38-bytes"): `tools/art-derive-lib.mjs` derives lossless WebP from the PNG masters of the painted art: what it
 * derives under each phase, what a browser draws the same, and that every file is proved before it is cached. Tiny synthetic
 * images in a temporary folder (`helpers/artFixtures.ts`): no real art, no real cache. Both games: shared build plumbing.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_SCOPE,
  MIN_WEBP_BYTES,
  alphaClassOf,
  alphaInfoOf,
  applyPlan,
  chooseKind,
  decoderIndependent,
  inScope,
  listMasterPngs,
  pixelsOf,
  planArtDerivation,
  pngChunkTypes,
  refusalFor,
  resolveScope,
  shippedList,
  webpName,
} from '../../tools/art-derive-lib.mjs';
import { pyreflyArtDerive } from '../../tools/art-derive-plugin.mjs';
import { verifyShippedArt } from '../../tools/art-verify.mjs';
import { grey16Png, makeBuild, makeStandardArt, makeWorld, noise, png, putFile, removeWorld, sprite, withChunk } from './helpers/artFixtures.ts';

let root = '';
let pub = '';
let cache = '';
beforeEach(() => {
  ({ root, pub, cache } = makeWorld());
});
afterEach(() => removeWorld(root));
const put = (rel: string, data: Buffer | string): void => putFile(pub, rel, data);
const fakeBuild = (extra: Record<string, string> = {}): string => makeBuild(pub, root, extra);
const standardArt = (): Promise<void> => makeStandardArt(pub);

describe('what is derived', () => {
  it('reads the switch and the phases', () => {
    expect(resolveScope('all')).toBe('all');
    expect(resolveScope('Partial')).toBe('partial');
    expect(resolveScope('SAFE')).toBe('safe');
    expect(resolveScope(' Exact ')).toBe('exact');
    expect(resolveScope('off')).toBe('off');
    expect(() => resolveScope('half')).toThrow(/PYREFLY_ART_WEBP/);
    // Phase 1: the 2x masters and the backdrops, nothing else.
    expect(inScope('art/characters/tidus/idle@2x.png', 'partial')).toBe(true);
    expect(inScope('art/backdrops/gagazet.png', 'partial')).toBe(true);
    expect(inScope('art/backdrops/cavern-stolen-fayth/sakura.png', 'partial')).toBe(true);
    expect(inScope('art/characters/tidus/idle.png', 'partial')).toBe(false);
    expect(inScope('art/portraits/tidus.png', 'partial')).toBe(false);
    expect(inScope('art/characters/tidus/idle.png', 'all')).toBe(true);
    expect(inScope('art/backdrops/gagazet.png', 'off')).toBe(false);
    // `safe` decides by what is in the picture: opaque and binary alpha, and the 2x masters (only ever textures).
    expect(inScope('art/portraits/tidus.png', 'safe', 'opaque')).toBe(true);
    expect(inScope('art/portraits/tidus.png', 'safe', 'binary')).toBe(true);
    expect(inScope('art/portraits/tidus.png', 'safe', 'translucent')).toBe(false);
    expect(inScope('art/portraits/tidus.png', 'safe', null)).toBe(false);
    expect(inScope('art/characters/ixion/idle@2x.png', 'safe', 'translucent')).toBe(true);
    expect(inScope('art/characters/ixion/idle.png', 'safe', 'translucent')).toBe(false);
    // `exact` decides by what is in the picture and by nothing else: no name, not even a 2x master, buys a WebP for a picture a decoder can draw differently.
    expect(inScope('art/portraits/tidus.png', 'exact', 'opaque', 0)).toBe(true);
    expect(inScope('art/portraits/tidus.png', 'exact', 'binary', 0)).toBe(true);
    expect(inScope('art/portraits/tidus.png', 'exact', 'binary', 3)).toBe(false);
    expect(inScope('art/portraits/tidus.png', 'exact', 'translucent', 0)).toBe(false);
    expect(inScope('art/characters/ixion/idle@2x.png', 'exact', 'translucent', 0)).toBe(false);
    expect(inScope('art/backdrops/gagazet.png', 'exact', null, null)).toBe(false);
    expect(inScope('art/portraits/tidus.png', 'exact', 'binary', null)).toBe(false);
    expect(webpName('art/characters/tidus/idle@2x.png')).toBe('art/characters/tidus/idle@2x.webp');
  });

  describe('the default is exact (independent check of 2026-10-03: a WebP only where every decoder draws it the same as the PNG)', () => {
    const SWITCH = 'PYREFLY_ART_WEBP';
    const saved = process.env[SWITCH];
    beforeEach(() => {
      delete process.env[SWITCH];
    });
    afterEach(() => {
      if (saved === undefined) delete process.env[SWITCH];
      else process.env[SWITCH] = saved;
    });

    it('is exact when the switch is unset, empty or blank', () => {
      expect(DEFAULT_SCOPE).toBe('exact');
      expect(resolveScope()).toBe('exact');
      expect(resolveScope(undefined)).toBe('exact');
      expect(resolveScope('')).toBe('exact');
      expect(resolveScope('   ')).toBe('exact');
    });

    it('is still overridden by the environment, and a typo still stops the build', () => {
      process.env[SWITCH] = 'all';
      expect(resolveScope()).toBe('all');
      process.env[SWITCH] = 'safe';
      expect(resolveScope()).toBe('safe');
      process.env[SWITCH] = 'OFF';
      expect(resolveScope()).toBe('off');
      process.env[SWITCH] = 'half';
      expect(() => resolveScope()).toThrow(/PYREFLY_ART_WEBP/);
    });

    it('plans exact when no scope is given: a WebP only for the pictures every decoder draws the same, the partly transparent art recompressed as PNG', async () => {
      await standardArt();
      const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, jobs: 2 });
      expect(plan.scope).toBe('exact');
      expect(Object.fromEntries(plan.entries.map((e) => [e.rel, e.kind]))).toEqual({
        'art/backdrops/sky.png': 'webp', // opaque
        'art/characters/hero/idle.png': 'png', // partly transparent, with colour under alpha 0
        'art/characters/hero/idle@2x.png': 'png', // a 2x master gets no exception
        'art/pause/x.png': 'png',
        'art/portraits/grey.png': 'webp', // opaque
      });
    });

    it('makes the Vite plugin exact too when it is given no options: only opaque and clean binary-alpha masters are in the bundle list', async () => {
      await standardArt();
      const plugin = pyreflyArtDerive({ cacheDir: cache, jobs: 2 }) as unknown as { config(user: { root: string }): Promise<{ define: Record<string, string> }> };
      const list = JSON.parse((await plugin.config({ root })).define['__PYREFLY_ART_WEBP__']!) as string[];
      expect(list).toEqual(['art/backdrops/sky.png', 'art/portraits/grey.png']);
    });
  });

  it('lists the art PNGs a build ships, and not the raw renders and numbered takes', async () => {
    await standardArt();
    put('audio/music/x.png', Buffer.from('not art'));
    expect(listMasterPngs(pub).map((m) => m.rel)).toEqual([
      'art/backdrops/sky.png',
      'art/characters/hero/idle.png',
      'art/characters/hero/idle@2x.png',
      'art/pause/x.png',
      'art/portraits/grey.png',
    ]);
  });
});

describe('what a browser draws the same', () => {
  it('classifies alpha: every pixel 255, only 0 and 255, or anything between', () => {
    const px = (...alphas: number[]) => Buffer.from(alphas.flatMap((a) => [10, 20, 30, a]));
    expect(alphaClassOf(px(255, 255, 255))).toBe('opaque');
    expect(alphaClassOf(px(255, 0, 255))).toBe('binary');
    expect(alphaClassOf(px(0, 0))).toBe('binary');
    expect(alphaClassOf(px(255, 254, 0))).toBe('translucent');
    expect(alphaClassOf(px(1))).toBe('translucent');
    expect(alphaClassOf(Buffer.alloc(0))).toBe('opaque');
  });

  it('counts the colour left under fully transparent pixels, which a decoder that premultiplies throws away', () => {
    const px = (...rgba: number[][]) => Buffer.from(rgba.flat());
    expect(alphaInfoOf(px([10, 20, 30, 255], [0, 0, 0, 0]))).toEqual({ alpha: 'binary', transparent: 1, hidden: 0 });
    expect(alphaInfoOf(px([10, 20, 30, 255], [0, 0, 1, 0], [255, 0, 0, 0], [0, 0, 0, 0]))).toEqual({ alpha: 'binary', transparent: 3, hidden: 2 });
    expect(alphaInfoOf(px([10, 20, 30, 255], [9, 9, 9, 128], [5, 5, 5, 0]))).toEqual({ alpha: 'translucent', transparent: 1, hidden: 1 });
    expect(alphaInfoOf(px([1, 2, 3, 255]))).toEqual({ alpha: 'opaque', transparent: 0, hidden: 0 });
    // Only opaque, or binary with nothing hidden, is drawn the same by every decoder; an unknown count is not a yes.
    expect(decoderIndependent('opaque', 0)).toBe(true);
    expect(decoderIndependent('binary', 0)).toBe(true);
    expect(decoderIndependent('binary', 1)).toBe(false);
    expect(decoderIndependent('translucent', 0)).toBe(false);
    expect(decoderIndependent('binary', null)).toBe(false);
    expect(decoderIndependent(null, null)).toBe(false);
  });

  it('the safe phase derives the opaque and binary-alpha masters and the 2x masters, and keeps the translucent PNGs as they are', async () => {
    await standardArt();
    const cut = sprite(48, 48); // binary alpha (a 24x24 pattern made a WebP of 62 bytes, under the floor, so this one is larger and less regular)
    for (let i = 3; i < cut.length; i += 4) cut[i] = cut[i]! >= 128 ? 255 : 0;
    put('art/portraits/cutout.png', await png(cut, 48, 48, 4));
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'safe', jobs: 2 });
    expect(Object.fromEntries(plan.entries.map((e) => [e.rel, `${e.kind}:${e.alpha}`]))).toEqual({
      'art/backdrops/sky.png': 'webp:opaque',
      'art/characters/hero/idle.png': 'copy:translucent',
      'art/characters/hero/idle@2x.png': 'webp:translucent',
      'art/pause/x.png': 'copy:translucent',
      'art/portraits/cutout.png': 'webp:binary',
      'art/portraits/grey.png': 'webp:opaque',
    });
    // Nothing was encoded for a master the phase leaves alone, and the alpha classes are remembered by hash.
    const again = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'safe', jobs: 2 });
    expect(again.counts).toEqual(plan.counts);
    expect(readdirSync(join(cache, 'alpha'), { recursive: true }).filter((f) => String(f).endsWith('.json'))).toHaveLength(6);
  });
});

describe('the derivation proves what it writes', () => {
  it('derives a lossless WebP whose decoded RGBA is the master\'s, colour under alpha 0 included', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    expect(plan.counts).toEqual({ webp: 5, png: 0, copy: 0 });
    expect(plan.bytes.saved).toBeGreaterThan(0);
    expect(shippedList(plan)).toContain('art/characters/hero/idle@2x.png');
    for (const e of plan.entries) {
      expect(e.kind, e.rel).toBe('webp');
      expect(e.shippedRel).toBe(webpName(e.rel));
      expect(e.shippedBytes).toBeLessThan(e.masterBytes);
      const master = await pixelsOf(join(pub, e.rel));
      const derived = await pixelsOf(readFileSync(e.file as string));
      expect(derived, e.rel).toEqual(master);
      expect(e.rgba, e.rel).toBe(master.hash);
    }
    // The hidden colour: the sprite's fully transparent pixels still carry their RGB in the WebP.
    const { data } = await sharp(readFileSync(plan.entries.find((e) => e.rel.endsWith('hero/idle.png'))!.file as string)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const master = sprite(64, 96);
    expect(data.subarray(0, 4 * 64 * 96).equals(master)).toBe(true);
  });

  it('derives only what the phase names, and keeps the rest as it is', async () => {
    await standardArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'partial', jobs: 2 });
    expect(Object.fromEntries(plan.entries.map((e) => [e.rel, e.kind]))).toEqual({
      'art/backdrops/sky.png': 'webp',
      'art/characters/hero/idle.png': 'copy',
      'art/characters/hero/idle@2x.png': 'webp',
      'art/pause/x.png': 'copy',
      'art/portraits/grey.png': 'copy',
    });
    const off = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'off', jobs: 2 });
    expect(off.counts).toEqual({ webp: 0, png: 0, copy: 5 });
    expect(off.bytes.saved).toBe(0);
  });

  it('reuses the cache: a second plan writes nothing new', async () => {
    await standardArt();
    await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const count = () => readdirSync(cache, { recursive: true }).length;
    const before = count();
    const again = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    expect(count()).toBe(before);
    expect(again.counts.webp).toBe(5);
  });

  it('chooses by size: the WebP when it is smaller, else the PNG recompressed when that is smaller, else the master', () => {
    expect(chooseKind(1000, 700)).toBe('webp');
    expect(chooseKind(1000, 999, 500)).toBe('webp'); // the recompressed size is only read when the WebP lost
    expect(chooseKind(1000, 1000)).toBe('copy'); // a tie keeps the approved file
    expect(chooseKind(1000, 1100)).toBe('copy');
    expect(chooseKind(1000, 1100, 940)).toBe('png');
    expect(chooseKind(1000, 1100, 1000)).toBe('copy');
    expect(chooseKind(1000, 1100, 1010)).toBe('copy');
  });

  it('never chooses a WebP under the floor, whatever the master: WebKit cannot load a 28-byte one (the re-check of 2026-10-03, B3)', () => {
    expect(MIN_WEBP_BYTES).toBe(64); // the measured edge is 30 bytes; 64 is the margin
    expect(chooseKind(95, 28)).toBe('copy'); // Paine's catchlight layer: a 28-byte WebP of a 95-byte master
    expect(chooseKind(95, 28, 120)).toBe('copy'); // and the recompressed PNG is not smaller either: the master's own bytes ship
    expect(chooseKind(300, 28, 250)).toBe('png'); // a smaller recompressed PNG ships instead
    expect(chooseKind(1000, 63)).toBe('copy');
    expect(chooseKind(1000, 63, 900)).toBe('png');
    expect(chooseKind(1000, MIN_WEBP_BYTES)).toBe('webp'); // the floor itself is allowed
    expect(chooseKind(1000, 700)).toBe('webp');
  });

  it('never ships a file larger than its master, whatever the encoder makes of it', async () => {
    // Noise sits where a lossless WebP and a PNG are within a few bytes of each other.
    for (const [w, h, ch] of [[16, 16, 4], [64, 64, 4], [64, 64, 3], [3, 3, 4]] as const) {
      put(`art/portraits/noise-${w}x${h}x${ch}.png`, await png(noise(w * h * ch, 11), w, h, ch, { compressionLevel: 9, adaptiveFiltering: true, palette: false }));
    }
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    expect(plan.entries).toHaveLength(4);
    for (const e of plan.entries) {
      expect(e.shippedBytes, e.rel).toBeLessThanOrEqual(e.masterBytes);
      if (e.kind !== 'webp') expect(e.shippedRel, e.rel).toBe(e.rel);
    }
    const out = fakeBuild();
    applyPlan(out, plan);
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2, exact: false }); // `all` ships partly transparent art as WebP, which the exactness test refuses
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('applies a recompressed PNG over the copy in the build, and the gate compares its pixels', async () => {
    // A hastily compressed master (level 1): the maximum-effort pass makes it smaller, with the same pixels.
    const master = await png(sprite(64, 96), 64, 96, 4, { compressionLevel: 1 });
    put('art/portraits/hasty.png', master);
    const again = await sharp(master).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
    expect(again.length).toBeLessThan(master.length);
    const file = join(root, 'recompressed.png');
    writeFileSync(file, again);
    const pixels = await pixelsOf(master);
    const plan = {
      scope: 'all' as const, cacheDir: cache, encoder: 'test', ms: 0,
      counts: { webp: 0, png: 1, copy: 0 }, bytes: { masters: master.length, shipped: again.length, saved: master.length - again.length },
      entries: [{ rel: 'art/portraits/hasty.png', masterBytes: master.length, kind: 'png' as const, shippedRel: 'art/portraits/hasty.png', shippedBytes: again.length, rgba: pixels.hash, file }],
    };
    const out = fakeBuild();
    expect(applyPlan(out, plan)).toMatchObject({ webp: 0, png: 1, skipped: [] });
    expect(statSync(join(out, 'art/portraits/hasty.png')).size).toBe(again.length);
    expect(existsSync(join(out, 'art/portraits/hasty.webp'))).toBe(false);
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v.problems.filter((p) => p.includes('hasty'))).toEqual([]);
    expect(v.decoded).toBeGreaterThanOrEqual(1);
  });

  it('refuses what a WebP could not carry: colour management, sixteen bits', async () => {
    const base = await png(sprite(24, 24), 24, 24, 4);
    const gamma = withChunk(base, 'gAMA', Buffer.from([0, 0, 0xb1, 0x8f]));
    expect(pngChunkTypes(gamma)).toContain('gAMA');
    expect(await refusalFor(gamma)).toMatch(/gAMA/);
    expect(await refusalFor(base)).toBeNull();
    const deep = grey16Png(16, 16);
    expect(await refusalFor(deep)).toMatch(/not 8 bits/);
    put('art/portraits/gamma.png', gamma);
    put('art/portraits/deep.png', deep);
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    for (const e of plan.entries) {
      expect(e.kind, e.rel).toBe('copy');
      expect(e.note, e.rel).toBeTruthy();
    }
  });

  it('refuses to shadow a file that is already there', async () => {
    put('art/pause/y.png', await png(sprite(16, 16), 16, 16, 4));
    put('art/pause/y.webp', Buffer.from('somebody\'s own file'));
    await expect(planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 1 })).rejects.toThrow(/already exists/);
  });
});

