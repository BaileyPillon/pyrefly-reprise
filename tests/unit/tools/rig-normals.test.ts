/**
 * **The normal pieces in the rig tooling** (release 61, the HD-2D look; both games, shared plumbing). A rig file may name a normal piece for a part and for a variant (`normal`, format v2.2 additive); the tools that read a
 * rig folder must count it, fingerprint it, size it, let it ship and refuse a folder that carries one the file does not name, and a file with none must read exactly as before. `tools/rig/rig-normals-add.mjs` gives an
 * existing rig its pieces: proved here on a synthetic figure (a master, its map, three parts) that it cuts the map by the part's box, writes opaque RGB, names the piece, refuses what it cannot prove is a window of the idle,
 * and never writes into its source.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { BUDGET, BUDGET_BOSS } from '../../../tools/rig/rig-gate-lib.mjs';
import { partImages, rigDigest, rigSize } from '../../../tools/rig/rig-format.mjs';
import { inventory } from '../../../tools/rig/rig-ship.mjs';
import { rigImageNames, rigShippedNames, textureSizes } from '../../../tools/rig/rig-tiers.mjs';
import { addNormals, isWindowOf, mapFileFor } from '../../../tools/rig/rig-normals-add.mjs';

const tmp = (p: string): string => mkdtempSync(join(tmpdir(), p));
const png = async (file: string, w: number, h: number, rgba: [number, number, number, number], channels: 3 | 4 = 4): Promise<void> => {
  await sharp({ create: { width: w, height: h, channels, background: { r: rgba[0], g: rgba[1], b: rgba[2], alpha: rgba[3] / 255 } } }).png().toFile(file);
};

/** A rig folder with a part and a variant, each with a colour PNG, a rim and a normal piece of its own size. */
async function folder(withNormals = true): Promise<{ dir: string; raw: Record<string, any> }> {
  const dir = tmp('rig-normals-');
  await png(join(dir, 'head.png'), 20, 30, [200, 100, 50, 255]);
  await png(join(dir, 'head.rim.png'), 20, 30, [255, 255, 255, 255], 3);
  await png(join(dir, 'head.alt.png'), 16, 24, [10, 120, 50, 255]);
  await png(join(dir, 'head.alt.rim.png'), 16, 24, [255, 255, 255, 255], 3);
  if (withNormals) {
    await png(join(dir, 'head.normal.png'), 6, 9, [128, 128, 255, 255], 3);
    await png(join(dir, 'head.alt.normal.png'), 5, 7, [140, 120, 250, 255], 3);
  }
  const raw = {
    version: 2, name: 'zz', scale: 2, image: { w: 100, h: 100 }, baselineY: 90,
    parts: [{ name: 'head', order: 0, png: 'head.png', rim: 'head.rim.png', ...(withNormals ? { normal: 'head.normal.png' } : {}), box: [10, 10, 20, 30], bone: 'root', variants: { alt: { png: 'head.alt.png', rim: 'head.alt.rim.png', ...(withNormals ? { normal: 'head.alt.normal.png' } : {}), box: [10, 10, 16, 24], bone: 'root' } } }],
  };
  writeFileSync(join(dir, 'rig.json'), JSON.stringify(raw));
  return { dir, raw };
}

describe('a rig that names normal pieces', () => {
  it('lists them with their look, null where there is none, and the file list that has a 1x twin never includes them', async () => {
    const { raw } = await folder();
    expect(partImages(raw).map((p) => [p.part, p.variant, p.normal])).toEqual([['head', null, 'head.normal.png'], ['head', 'alt', 'head.alt.normal.png']]);
    expect(rigImageNames(raw)).toEqual(['head.png', 'head.rim.png', 'head.alt.png', 'head.alt.rim.png']);
    expect(rigShippedNames(raw)).toEqual(['head.png', 'head.rim.png', 'head.alt.png', 'head.alt.rim.png', 'head.normal.png', 'head.alt.normal.png']);
    const bare = (await folder(false)).raw;
    expect(partImages(bare).every((p) => p.normal === null)).toBe(true);
    expect(rigShippedNames(bare)).toEqual(rigImageNames(bare));
  });

  it('sizes each from its header, and stamps no `normal` for a look that has none (the stamp a rig without pieces gets is the one it always got)', async () => {
    const { dir, raw } = await folder();
    expect(textureSizes(raw, dir)).toEqual({ head: { map: [20, 30], rim: [20, 30], normal: [6, 9] }, 'head:alt': { map: [16, 24], rim: [16, 24], normal: [5, 7] } });
    const plain = await folder(false);
    expect(textureSizes(plain.raw, plain.dir)).toEqual({ head: { map: [20, 30], rim: [20, 30] }, 'head:alt': { map: [16, 24], rim: [16, 24] } });
  });

  it('counts their bytes and texels apart from the colour textures (the colour budget is the one it was)', async () => {
    const { dir, raw } = await folder();
    const s = rigSize(raw, dir);
    expect(s.normalTexels).toBe(6 * 9 + 5 * 7);
    expect(s.normalBytes).toBeGreaterThan(0);
    const plain = await folder(false);
    const p = rigSize(plain.raw, plain.dir);
    expect(p.normalTexels).toBe(0);
    expect(p.normalBytes).toBe(0);
    expect(s.bytes).toBe(p.bytes); // the colour bytes do not include the pieces
    expect(s.texels).toBe(p.texels);
    expect(BUDGET.normalTexels).toBeGreaterThan(0);
    expect(BUDGET_BOSS.normalBytes).toBe(BUDGET.normalBytes);
  });

  it('fingerprints them: a changed piece, or a piece that goes, changes the digest the stamp is bound to', async () => {
    const { dir, raw } = await folder();
    const d0 = rigDigest(raw, dir);
    await png(join(dir, 'head.normal.png'), 6, 9, [100, 140, 250, 255], 3);
    expect(rigDigest(raw, dir)).not.toBe(d0);
    const noPiece = { ...raw, parts: raw.parts.map((p: Record<string, unknown>) => ({ ...p, normal: undefined })) };
    expect(rigDigest(noPiece, dir)).not.toBe(rigDigest(raw, dir));
  });

  it('lets the pieces it names ship, and flags one it does not name (it would ship unvetted)', async () => {
    const { dir, raw } = await folder();
    expect(inventory(dir, raw).extra).toEqual([]);
    await png(join(dir, 'tail.normal.png'), 4, 4, [128, 128, 255, 255], 3);
    expect(inventory(dir, raw).extra).toEqual(['tail.normal.png']);
  });
});

describe('rig-normals-add: an existing rig gets its pieces from the idle painting\'s map', () => {
  /** A 100x80 master with an opaque rectangle, its map (a left-to-right ramp in R so a wrong crop shows), a rig whose `body` is the rectangle's window and `front` a part from another painting. */
  async function figure(): Promise<{ from: string; maps: string; art: string }> {
    const root = tmp('rig-normals-add-');
    const art = join(root, 'art');
    const maps = join(root, 'maps');
    const from = join(root, 'rig');
    for (const d of [join(art, 'characters', 'zz'), join(maps, 'characters', 'zz'), from]) mkdirSync(d, { recursive: true });
    const W = 100;
    const H = 80;
    const master = Buffer.alloc(W * H * 4);
    const ramp = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const inside = x >= 20 && x < 70 && y >= 10 && y < 60;
      master.set(inside ? [(x * 3) % 256, (y * 5) % 256, 90, 255] : [0, 0, 0, 0], (y * W + x) * 4);
      ramp.set([Math.min(255, x * 2), 128, 255], (y * W + x) * 3);
    }
    await sharp(master, { raw: { width: W, height: H, channels: 4 } }).png().toFile(join(art, 'characters', 'zz', 'idle@2x.png'));
    await sharp(ramp, { raw: { width: W, height: H, channels: 3 } }).png().toFile(join(maps, 'characters', 'zz', 'idle@2x.normal.png'));
    // the body part: the master's window [20, 10, 50, 50]; the front part: a part of ANOTHER painting (a flat green block that does not sit on the master's colours)
    const body = Buffer.alloc(50 * 50 * 4);
    for (let y = 0; y < 50; y++) for (let x = 0; x < 50; x++) body.set([((20 + x) * 3) % 256, ((10 + y) * 5) % 256, 90, 255], (y * 50 + x) * 4);
    await sharp(body, { raw: { width: 50, height: 50, channels: 4 } }).png().toFile(join(from, 'body.png'));
    await sharp({ create: { width: 30, height: 30, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } } }).png().toFile(join(from, 'front.png'));
    writeFileSync(join(from, 'rig.json'), JSON.stringify({
      version: 1, name: 'zz', scale: 2, image: { w: W, h: H }, baselineY: 70, costume: { painting: 'characters/zz/idle', pose: 'idle', sha: 'x' },
      parts: [{ name: 'body', order: 0, png: 'body.png', box: [20, 10, 50, 50], bone: 'root' }, { name: 'front', order: 1, png: 'front.png', box: [30, 20, 30, 30], bone: 'root' }],
      gate: { status: 'ok', at: 'x', by: 'x' },
    }));
    return { from, maps, art };
  }

  it('maps a costume painting to its map file', () => {
    expect(mapFileFor({ costume: { painting: 'characters/lulu/idle' }, scale: 2 }, 'M')?.map.replace(/\\/g, '/')).toBe('M/characters/lulu/idle@2x.normal.png');
    expect(mapFileFor({ costume: { painting: 'art/characters/ifrit/idle@2x.png' }, scale: 1 }, 'M')?.map.replace(/\\/g, '/')).toBe('M/characters/ifrit/idle.normal.png');
    expect(mapFileFor({ costume: { painting: 'portraits/x' }, scale: 2 }, 'M')).toBeNull();
  });

  it('cuts the map by the part\'s box at the asked scale, opaque RGB, names it, drops the stamp, and lists the part it cannot prove is a window', async () => {
    const f = await figure();
    const to = join(tmp('rig-normals-out-'), 'zz-n');
    const r = await addNormals({ from: f.from, to, maps: f.maps, art: f.art, scale: 0.5 });
    expect(r.done).toEqual([['body', '25x25']]);
    expect(r.skipped.map(([n]: [string, string]) => n)).toEqual(['front']);
    expect(r.skipped[0]![1]).toMatch(/idle master/);
    const raw = JSON.parse(readFileSync(join(to, 'rig.json'), 'utf8'));
    expect(raw.parts[0].normal).toBe('body.normal.png');
    expect(raw.parts[1].normal).toBeUndefined();
    expect(raw.gate).toBeUndefined(); // the digest covers the piece: the gate stamps it again
    const piece = await sharp(join(to, 'body.normal.png')).raw().toBuffer({ resolveWithObject: true });
    expect([piece.info.width, piece.info.height, piece.info.channels]).toEqual([25, 25, 3]);
    // the ramp in R is 2 * x of the master: the piece's left edge is the master's x = 20 (R about 40), its right edge x = 69 (R about 138)
    expect(piece.data[(12 * 25 + 0) * 3]).toBeGreaterThan(36);
    expect(piece.data[(12 * 25 + 0) * 3]).toBeLessThan(48);
    expect(piece.data[(12 * 25 + 24) * 3]).toBeGreaterThan(130);
    expect(piece.data[(12 * 25 + 24) * 3]).toBeLessThan(146);
    expect(existsSync(join(to, 'body.png'))).toBe(true); // the rest of the folder is copied
  });

  it('never writes into its source or over a folder that exists, and refuses a map of another size', async () => {
    const f = await figure();
    const before = readFileSync(join(f.from, 'rig.json'), 'utf8');
    const to = join(tmp('rig-normals-out-'), 'zz-n');
    await addNormals({ from: f.from, to, maps: f.maps, art: f.art });
    expect(readFileSync(join(f.from, 'rig.json'), 'utf8')).toBe(before);
    expect(existsSync(join(f.from, 'body.normal.png'))).toBe(false);
    await expect(addNormals({ from: f.from, to, maps: f.maps, art: f.art })).rejects.toThrow(/exists/);
    await sharp({ create: { width: 50, height: 40, channels: 3, background: { r: 128, g: 128, b: 255 } } }).png().toFile(join(f.maps, 'characters', 'zz', 'idle@2x.normal.png'));
    await expect(addNormals({ from: f.from, to: join(tmp('rig-normals-out-'), 'b'), maps: f.maps, art: f.art })).rejects.toThrow(/image is 100x80/);
  });

  it('isWindowOf: a part that is the master\'s own colour inside its silhouette is a window; a part from another painting is not', async () => {
    const f = await figure();
    const master = await sharp(join(f.art, 'characters', 'zz', 'idle@2x.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect((await isWindowOf(master.data, master.info.width, join(f.from, 'body.png'), [20, 10, 50, 50])).ok).toBe(true);
    const other = await isWindowOf(master.data, master.info.width, join(f.from, 'front.png'), [30, 20, 30, 30]);
    expect(other.ok).toBe(false);
  });
});
