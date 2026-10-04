/**
 * Release 39 (both games, build plumbing): the hi-res installer. A 4x master keeps a ring of the figure's own colour under the
 * transparent pixels beside its silhouette, so bilinear and mip filtering never blend black or grey into an edge; the 3x derived from it
 * must keep that ring (a first version premultiplied and wrote one flat teal under every transparent pixel), and the plan must install only
 * what is safe: a master whose 1x file is unchanged, at exactly the scale, never over an existing file.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { derive3, oneXPath, plan } from '../../tools/hires-install.mjs';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
const tmp = (): string => {
  const d = mkdtempSync(join(tmpdir(), 'pyrefly-r39-hires-'));
  dirs.push(d);
  return d;
};

/** A 4x master of a 10x15 figure: a coloured disc, a ring of its colour under the transparent pixels beside it, black beyond. */
async function master4(file: string): Promise<void> {
  const W = 40;
  const H = 60;
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - 20, y - 30);
      const i = (y * W + x) * 4;
      if (d < 12) px.set([200, 60, 40, 255], i); // the figure
      else if (d < 18) px.set([200, 60, 40, 0], i); // the bleed: colour under alpha 0
      else px.set([0, 0, 0, 0], i);
    }
  }
  await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toFile(file);
}

describe('derive3', () => {
  it('keeps the colour ring under the transparent pixels and invents none', async () => {
    const d = tmp();
    await master4(join(d, 'm@4x.png'));
    await derive3(sharp, { from: join(d, 'm@4x.png'), to: join(d, 'm@3x.png'), size: [30, 45] });
    const { data, info } = await sharp(join(d, 'm@3x.png')).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([30, 45]);
    const under = new Map<string, number>();
    let transparent = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) continue;
      transparent++;
      const k = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      under.set(k, (under.get(k) ?? 0) + 1);
    }
    expect(transparent).toBeGreaterThan(300);
    expect(under.has('0,0,0')).toBe(true); // black beyond the ring
    // the ring survives: transparent pixels that still carry the figure's red
    const ring = [...under.entries()].filter(([k]) => Number(k.split(',')[0]) > 100).reduce((s, [, n]) => s + n, 0);
    expect(ring).toBeGreaterThan(20);
    // and no flat colour fills the empty area (the premultiplied resize's tell)
    const flat = [...under.entries()].filter(([k, n]) => k !== '0,0,0' && n > transparent / 2);
    expect(flat).toEqual([]);
  });

  it('keeps the silhouette: the alpha of the 3x is the 4x alpha, resized', async () => {
    const d = tmp();
    await master4(join(d, 'm@4x.png'));
    await derive3(sharp, { from: join(d, 'm@4x.png'), to: join(d, 'm@3x.png'), size: [30, 45] });
    const src = await sharp(join(d, 'm@4x.png')).raw().toBuffer();
    const alpha = Buffer.alloc(40 * 60);
    for (let i = 0; i < alpha.length; i++) alpha[i] = src[i * 4 + 3]!;
    const ref = await sharp(alpha, { raw: { width: 40, height: 60, channels: 1 } }).resize(30, 45, { kernel: 'lanczos3', fit: 'fill' }).extractChannel(0).raw().toBuffer();
    const out = await sharp(join(d, 'm@3x.png')).raw().toBuffer();
    expect(out.length).toBe(30 * 45 * 4);
    let worst = 0;
    let opaque = 0;
    for (let i = 0; i < ref.length; i++) {
      worst = Math.max(worst, Math.abs(ref[i]! - out[i * 4 + 3]!));
      if (out[i * 4 + 3] === 255) opaque++;
    }
    expect(worst).toBe(0);
    expect(opaque).toBeGreaterThan(150); // the disc (radius 9 at 3x, about 250 px) is solid, not a smear of stride errors
    expect(opaque).toBeLessThan(300);
  });
});

describe('plan', () => {
  const sha = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');

  async function setup(): Promise<{ lib: string; art: string }> {
    const root = tmp();
    const lib = join(root, 'lib');
    const art = join(root, 'art');
    for (const d of [join(art, 'characters', 'hero'), join(lib, 'characters', 'hero'), join(art, 'backdrops'), join(lib, 'backdrops')]) mkdirSync(d, { recursive: true });
    const flat = (w: number, h: number): Buffer => Buffer.alloc(w * h * 4, 1);
    const write = (file: string, w: number, h: number): Promise<unknown> => sharp(flat(w, h), { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);
    await write(join(art, 'characters', 'hero', 'idle.png'), 10, 15);
    await write(join(lib, 'characters', 'hero', 'idle@2x.png'), 20, 30);
    await write(join(lib, 'characters', 'hero', 'idle@4x.png'), 40, 60);
    await write(join(art, 'backdrops', 'room.png'), 8, 4);
    await write(join(lib, 'backdrops', 'room@2x.png'), 16, 8);
    await write(join(lib, 'backdrops', 'room@4x.png'), 32, 16);
    const rec = (id: string, outs: Array<[string, number, [number, number]]>, hash: string) => ({
      id,
      status: 'ok',
      flags: [],
      source_sha256: hash,
      outputs: outs.map(([path, scale, size]) => ({ path, scale, bytes_png: readFileSync(join(lib, path)).length, size })),
    });
    writeFileSync(
      join(lib, 'manifest.json'),
      JSON.stringify({
        assets: {
          a: rec('characters/hero/idle', [['characters/hero/idle@4x.png', 4, [40, 60]], ['characters/hero/idle@2x.png', 2, [20, 30]]], sha(join(art, 'characters', 'hero', 'idle.png'))),
          b: rec('backdrops/room@2x', [['backdrops/room@2x.png', 2, [16, 8]], ['backdrops/room@4x.png', 4, [32, 16]]], sha(join(art, 'backdrops', 'room.png'))),
        },
      }),
    );
    return { lib, art };
  }

  it('installs the 2x and 4x beside the approved files, derives the 3x, and stops a backdrop at 2x', async () => {
    const { lib, art } = await setup();
    const { jobs, skipped } = await plan({ lib, art, only: [], scales: [2, 3, 4] });
    const ids = jobs.map((j) => `${j.kind}:${j.id}`).sort();
    expect(ids).toEqual(['derive3:characters/hero/idle@3x.png', 'link:backdrops/room@2x.png', 'link:characters/hero/idle@2x.png', 'link:characters/hero/idle@4x.png']);
    expect(skipped).toEqual([]);
    expect(oneXPath(art, 'characters/hero/idle@4x.png')).toBe(join(art, 'characters/hero/idle.png'));
  });

  it('never installs over a file that is there, nor a master of a changed 1x painting', async () => {
    const { lib, art } = await setup();
    writeFileSync(join(art, 'characters', 'hero', 'idle@2x.png'), 'already here');
    let r = await plan({ lib, art, only: [], scales: [2, 3, 4] });
    expect(r.jobs.map((j) => j.id)).not.toContain('characters/hero/idle@2x.png');
    expect(r.skipped.some((s) => s.id === 'characters/hero/idle@2x.png' && /already/.test(s.why))).toBe(true);
    await sharp(Buffer.alloc(10 * 15 * 4, 9), { raw: { width: 10, height: 15, channels: 4 } }).png().toFile(join(art, 'characters', 'hero', 'idle.png')); // the approved painting changed
    r = await plan({ lib, art, only: ['characters/hero'], scales: [2, 3, 4] });
    expect(r.jobs).toEqual([]);
    expect(r.skipped.every((s) => /sha256|already/.test(s.why))).toBe(true);
  });

  it('--only takes a prefix of the asset id', async () => {
    const { lib, art } = await setup();
    const r = await plan({ lib, art, only: ['backdrops/'], scales: [2, 3, 4] });
    expect(r.jobs.map((j) => j.id)).toEqual(['backdrops/room@2x.png']);
  });

  it('redo3 derives an existing 3x again', async () => {
    const { lib, art } = await setup();
    writeFileSync(join(art, 'characters', 'hero', 'idle@3x.png'), 'old');
    expect((await plan({ lib, art, only: ['characters/'], scales: [3, 4] })).jobs.map((j) => j.kind)).toEqual(['link']);
    expect((await plan({ lib, art, only: ['characters/'], scales: [3, 4], redo3: true })).jobs.map((j) => j.kind).sort()).toEqual(['derive3', 'link']);
  });
});
