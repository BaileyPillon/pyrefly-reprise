/**
 * Release 38 ("r38-bytes"), repair of the independent check of 2026-10-03: what ships as a lossless WebP is only what EVERY decoder
 * draws the same from the WebP as from the PNG (opaque art, and art whose alpha is only 0 and 255 with no colour left under alpha 0),
 * and every other master ships as a PNG recompressed at maximum effort with its pixels, the colour under alpha 0 included, proved
 * identical in all four channels. The gate (`verifyShippedArt`) refuses a WebP of anything else. Tiny synthetic images in a temporary
 * folder (`helpers/artFixtures.ts`). Both games: shared build plumbing.
 */
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyPlan, pixelsOf, planArtDerivation, pngChunkTypes, proveSame } from '../../tools/art-derive-lib.mjs';
import { pngChunks, stripAncillaryChunks } from '../../tools/art-image-facts.mjs';
import { verifyShippedArt } from '../../tools/art-verify.mjs';
import { chunk, makeBuild, makeWorld, noise, png, putFile, removeWorld, sprite, withChunk } from './helpers/artFixtures.ts';

let root = '';
let pub = '';
let cache = '';
beforeEach(() => {
  ({ root, pub, cache } = makeWorld());
});
afterEach(() => removeWorld(root));

/** `sprite` with its alpha cut to 0 and 255; `clean` zeroes the colour under the transparent pixels, else the sprite's gradient stays there. */
function cutout(w: number, h: number, clean: boolean): Buffer {
  const b = sprite(w, h);
  for (let i = 0; i < b.length; i += 4) {
    const solid = b[i + 3]! >= 128;
    b[i + 3] = solid ? 255 : 0;
    if (!solid && clean) b.fill(0, i, i + 3);
  }
  return b;
}

/** Five masters, one of each kind that matters: opaque, clean binary alpha, binary alpha with hidden colour, partly transparent, a partly transparent 2x. */
async function exactArt(): Promise<void> {
  putFile(pub, 'art/portraits/opaque.png', await png(Buffer.from(Array.from({ length: 96 * 54 * 3 }, (_, i) => Math.floor(((i / 3) % 96) * 2.5))), 96, 54, 3));
  putFile(pub, 'art/characters/hero/clean.png', await png(cutout(64, 96, true), 64, 96, 4));
  putFile(pub, 'art/characters/hero/hidden.png', await png(cutout(64, 96, false), 64, 96, 4));
  putFile(pub, 'art/characters/hero/soft.png', await png(sprite(64, 96), 64, 96, 4));
  putFile(pub, 'art/characters/hero/soft@2x.png', await png(sprite(128, 192), 128, 192, 4));
}

const rawOf = async (input: Buffer | string) => (await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;

describe('what ships as a WebP under exact, and what ships as a recompressed PNG', () => {
  it('a WebP only for opaque and clean binary-alpha art; every other master, the 2x one included, stays a PNG', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    expect(Object.fromEntries(plan.entries.map((e) => [e.rel, `${e.kind}:${e.alpha}:${e.hidden}`]))).toEqual({
      'art/characters/hero/clean.png': 'webp:binary:0',
      'art/characters/hero/hidden.png': expect.stringMatching(/^png:binary:[1-9]\d*$/),
      'art/characters/hero/soft.png': expect.stringMatching(/^png:translucent:[1-9]\d*$/),
      'art/characters/hero/soft@2x.png': expect.stringMatching(/^png:translucent:[1-9]\d*$/),
      'art/portraits/opaque.png': 'webp:opaque:0',
    });
    expect(plan.counts).toEqual({ webp: 2, png: 3, copy: 0 });
    expect(plan.pngEncoder).toMatch(/^png-l9-adaptive-nopalette-nometa-sharp/);
  });

  it('proves each recompressed PNG decodes to the master in all four channels, the colour under alpha 0 included, and carries no metadata', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const kept = plan.entries.filter((e) => e.kind === 'png');
    expect(kept).toHaveLength(3);
    for (const e of kept) {
      const shipped = readFileSync(e.file as string);
      expect(shipped.length, e.rel).toBeLessThan(e.masterBytes);
      expect(shipped.length, e.rel).toBe(e.shippedBytes);
      const [a, b] = [await rawOf(join(pub, e.rel)), await rawOf(shipped)];
      expect(Buffer.compare(a, b), `${e.rel}: every byte of RGBA`).toBe(0);
      expect(pngChunkTypes(shipped), `${e.rel}: nothing but the header before the pixels`).toEqual(['IHDR']);
      expect(pngChunks(shipped).map((c) => c.type).at(-1)).toBe('IEND');
      expect(e.rgba).toBe((await pixelsOf(join(pub, e.rel))).hash);
    }
    // The colour the PNG keeps under alpha 0 is really there (the sprite's gradient), not zeroed.
    const hidden = await rawOf(readFileSync(kept.find((e) => e.rel.endsWith('hidden.png'))!.file as string));
    let colourUnderAlpha0 = 0;
    for (let i = 0; i < hidden.length; i += 4) if (hidden[i + 3] === 0 && (hidden[i]! | hidden[i + 1]! | hidden[i + 2]!)) colourUnderAlpha0++;
    expect(colourUnderAlpha0).toBeGreaterThan(100);
  });

  it('keeps the master as it is where the recompressed PNG is not smaller, and where the master carries colour management', async () => {
    // Noise does not compress, and a master with no metadata chunk has nothing left to drop: the same IDAT, so a tie, so the master.
    putFile(pub, 'art/portraits/noise.png', stripAncillaryChunks(await png(noise(64 * 64 * 4, 11), 64, 64, 4, { compressionLevel: 9, adaptiveFiltering: true, palette: false })));
    const base = await png(sprite(24, 24), 24, 24, 4, { compressionLevel: 9, adaptiveFiltering: true, palette: false });
    putFile(pub, 'art/portraits/gamma.png', withChunk(base, 'gAMA', Buffer.from([0, 0, 0xb1, 0x8f])));
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const byRel = Object.fromEntries(plan.entries.map((e) => [e.rel, e]));
    expect(byRel['art/portraits/noise.png']).toMatchObject({ kind: 'copy', file: null, shippedRel: 'art/portraits/noise.png' });
    expect(byRel['art/portraits/noise.png']!.shippedBytes).toBe(byRel['art/portraits/noise.png']!.masterBytes);
    expect(byRel['art/portraits/gamma.png']).toMatchObject({ kind: 'copy', file: null });
    expect(byRel['art/portraits/gamma.png']!.note).toMatch(/gAMA/);
  });

  it('is deterministic and cached: a second plan encodes nothing, and a cold cache makes the same bytes', async () => {
    await exactArt();
    const first = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const files = () => readdirSync(cache, { recursive: true }).length;
    const before = files();
    const again = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    expect(files()).toBe(before);
    expect(again.counts).toEqual(first.counts);
    const cold = await planArtDerivation({ publicDir: pub, cacheDir: join(root, 'cache2'), scope: 'exact', jobs: 1 });
    expect(cold.entries.map((e) => [e.rel, e.kind, e.shippedBytes])).toEqual(first.entries.map((e) => [e.rel, e.kind, e.shippedBytes]));
    for (const [i, e] of first.entries.entries()) if (e.file) expect(readFileSync(cold.entries[i]!.file as string).equals(readFileSync(e.file))).toBe(true);
  });

  it('records what it decided in art/derived.json: the scope, the rule, each master\'s transparency and the PNG pass', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const out = makeBuild(pub, root);
    expect(applyPlan(out, plan)).toMatchObject({ webp: 2, png: 3, skipped: [] });
    const record = JSON.parse(readFileSync(join(out, 'art/derived.json'), 'utf8')) as { scope: string; rule: string; pngEncoder: string; files: Array<{ path: string; kind: string; alpha: string; hidden: number; bytes: number }> };
    expect(record).toMatchObject({ scope: 'exact' });
    expect(record.rule).toMatch(/only 0 and 255 with no colour left under alpha 0/);
    expect(record.pngEncoder).toMatch(/zlib/);
    expect(record.files.map((f) => `${f.path}:${f.kind}:${f.alpha}`)).toEqual([
      'art/characters/hero/clean.png:webp:binary',
      'art/characters/hero/hidden.png:png:binary',
      'art/characters/hero/soft.png:png:translucent',
      'art/characters/hero/soft@2x.png:png:translucent',
      'art/portraits/opaque.png:webp:opaque',
    ]);
    expect(record.files.find((f) => f.path.endsWith('clean.png'))!.hidden).toBe(0);
    expect(record.files.find((f) => f.path.endsWith('hidden.png'))!.hidden).toBeGreaterThan(0);
    for (const f of record.files.filter((x) => x.kind === 'png')) expect(statSync(join(out, f.path)).size).toBe(f.bytes);
  });
});

describe('the proof every derived file passes before it is cached', () => {
  it('accepts the same picture however it is encoded, and refuses one changed in any channel: a hidden colour, an alpha step, a size', async () => {
    const raw = cutout(48, 64, false); // colour under the transparent pixels
    const master = await png(raw, 48, 64, 4);
    const master0 = await pixelsOf(master);
    await expect(proveSame('art/x.png', await png(raw, 48, 64, 4, { compressionLevel: 9, adaptiveFiltering: true }), 'recompressed PNG', master0)).resolves.toBeUndefined();
    await expect(proveSame('art/x.png', await sharp(raw, { raw: { width: 48, height: 64, channels: 4 } }).webp({ lossless: true, exact: true }).toBuffer(), 'lossless WebP', master0)).resolves.toBeUndefined();
    const hiddenZeroed = Buffer.from(raw); // what a decoder that premultiplies would hand over: the colour under alpha 0 gone
    for (let i = 0; i < hiddenZeroed.length; i += 4) if (hiddenZeroed[i + 3] === 0) hiddenZeroed.fill(0, i, i + 3);
    expect(Buffer.compare(hiddenZeroed, raw)).not.toBe(0);
    await expect(proveSame('art/x.png', await png(hiddenZeroed, 48, 64, 4), 'recompressed PNG', master0)).rejects.toThrow(/art\/x\.png: the recompressed PNG does not decode to the master's pixels/);
    const alphaStep = Buffer.from(raw);
    alphaStep[3] = 254;
    await expect(proveSame('art/x.png', await png(alphaStep, 48, 64, 4), 'lossless WebP', master0)).rejects.toThrow(/does not decode to the master's pixels/);
    await expect(proveSame('art/x.png', await png(cutout(24, 32, false), 24, 32, 4), 'lossless WebP', master0)).rejects.toThrow(/does not decode to the master's pixels/);
  });
});

describe('the metadata a recompressed PNG does not carry', () => {
  it('drops pHYs and tEXt, keeps the header, the compressed pixels and the end, byte for byte, and refuses what is not a PNG', async () => {
    const base = stripAncillaryChunks(await png(sprite(32, 32), 32, 32, 4)); // libvips writes a pHYs of its own
    const noisy = withChunk(withChunk(base, 'pHYs', Buffer.from([0, 0, 0x0b, 0x13, 0, 0, 0x0b, 0x13, 1])), 'tEXt', Buffer.from('prompt\0a long prompt'));
    expect(pngChunkTypes(noisy)).toEqual(['IHDR', 'pHYs', 'tEXt']);
    const stripped = stripAncillaryChunks(noisy);
    expect(pngChunkTypes(stripped)).toEqual(['IHDR']);
    const pick = (buf: Buffer, type: string) => pngChunks(buf).filter((c) => c.type === type).map((c) => buf.subarray(c.start, c.end).toString('hex'));
    for (const type of ['IHDR', 'IDAT', 'IEND']) expect(pick(stripped, type), type).toEqual(pick(noisy, type));
    expect(Buffer.compare(await rawOf(stripped), await rawOf(noisy))).toBe(0);
    expect(() => stripAncillaryChunks(Buffer.from('not a png at all'))).toThrow(/not a PNG/);
    expect(() => stripAncillaryChunks(Buffer.concat([base.subarray(0, 40), chunk('IDAT', Buffer.alloc(0)).subarray(0, 6)]))).toThrow();
  });
});

describe('the gate refuses a WebP that a decoder could draw differently', () => {
  it('passes an exact build', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const out = makeBuild(pub, root);
    applyPlan(out, plan);
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v).toMatchObject({ ok: true, exact: true, checked: 5, webp: 2, png: 3, decoded: 5, problems: [] });
  });

  it('fails, by default, a build that ships partly transparent art or art with colour under alpha 0 as WebP, and passes it only when asked not to look', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = makeBuild(pub, root);
    applyPlan(out, plan);
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v.ok).toBe(false);
    expect(v.problems.map((p) => p.split(':')[0])).toEqual(['art/characters/hero/hidden.png', 'art/characters/hero/soft.png', 'art/characters/hero/soft@2x.png']);
    const text = v.problems.join('\n');
    expect(text).toMatch(/hidden\.png: shipped as a WebP, but the master keeps colour under \d+ fully transparent texel\(s\)/);
    expect(text).toMatch(/soft\.png: shipped as a WebP, but the master has partly transparent pixels/);
    expect(text).toMatch(/soft@2x\.png: shipped as a WebP, but the master has partly transparent pixels/);
    expect(await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2, exact: false })).toMatchObject({ ok: true, exact: false, problems: [] });
  });

  it('judges the master, not the record: a record that calls a translucent master opaque does not get it through', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'all', jobs: 2 });
    const out = makeBuild(pub, root);
    applyPlan(out, plan);
    const file = join(out, 'art/derived.json');
    const record = JSON.parse(readFileSync(file, 'utf8')) as { files: Array<{ path: string; alpha?: string; hidden?: number }> };
    for (const f of record.files) if (f.path.endsWith('soft.png')) Object.assign(f, { alpha: 'opaque', hidden: 0 });
    writeFileSync(file, JSON.stringify(record));
    const text = (await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 })).problems.join('\n');
    expect(text).toMatch(/soft\.png: shipped as a WebP, but the master has partly transparent pixels/);
    expect(text).toMatch(/soft\.png: art\/derived\.json records opaque\/0 for its transparency, the master is translucent\//);
  });

  it('fails a recompressed PNG that gained a colour chunk its master lacks, and one that decodes to other pixels', async () => {
    await exactArt();
    const plan = await planArtDerivation({ publicDir: pub, cacheDir: cache, scope: 'exact', jobs: 2 });
    const out = makeBuild(pub, root);
    applyPlan(out, plan);
    const soft = join(out, 'art/characters/hero/soft.png');
    writeFileSync(soft, withChunk(readFileSync(soft), 'gAMA', Buffer.from([0, 0, 0xb1, 0x8f])));
    const hidden = join(out, 'art/characters/hero/hidden.png');
    const other = cutout(64, 96, false);
    other[0] = other[0]! ^ 1; // one colour under alpha 0, one step off: a decoder that keeps it would see it
    writeFileSync(hidden, await png(other, 64, 96, 4));
    const v = await verifyShippedArt({ distDir: out, publicDir: pub, jobs: 2 });
    expect(v.ok).toBe(false);
    const text = v.problems.join('\n');
    expect(text).toMatch(/soft\.png: the recompressed PNG carries gAMA, which the master does not/);
    expect(text).toMatch(/hidden\.png: the shipped PNG decodes to different pixels than the master/);
    rmSync(soft);
  });
});
