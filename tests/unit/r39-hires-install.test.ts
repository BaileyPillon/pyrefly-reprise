/**
 * Release 39 (both games, build plumbing): the hi-res installer. A 4x master keeps a ring of the figure's own colour under the
 * transparent pixels beside its silhouette, so bilinear and mip filtering never blend black or grey into an edge; the 3x derived from it
 * must keep that ring (a first version premultiplied and wrote one flat teal under every transparent pixel), and the plan must install only
 * what is safe: a master whose 1x file is unchanged, at exactly the scale, never over an existing file.
 */
import { existsSync, linkSync, mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { HELD_BACKDROPS, backdropKey, derive3, oneXPath, park, plan, sameFile } from '../../tools/hires-install.mjs';

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

describe('upgrade: the fixed library replaces what the old library installed (release 39 repair, both games, build plumbing)', () => {
  const sha = (p: string): string => createHash('sha256').update(readFileSync(p)).digest('hex');
  const png = (file: string, w: number, h: number, fill: number): Promise<unknown> => sharp(Buffer.alloc(w * h * 4, fill), { raw: { width: w, height: h, channels: 4 } }).png().toFile(file);

  /** An old library, an art folder that installed it by hard links (plus a pilot 2x of its own and a derived 3x), and a fixed library beside the old one. */
  async function world(): Promise<{ oldLib: string; newLib: string; art: string; parkDir: string }> {
    const root = tmp();
    const oldLib = join(root, 'old');
    const newLib = join(root, 'new');
    const art = join(root, 'art');
    const parkDir = join(root, 'park');
    for (const base of [oldLib, newLib]) for (const d of ['characters/hero', 'characters/pilot', 'backdrops']) mkdirSync(join(base, d), { recursive: true });
    for (const d of ['characters/hero', 'characters/pilot', 'backdrops']) mkdirSync(join(art, d), { recursive: true });
    await png(join(art, 'characters/hero/idle.png'), 10, 15, 1);
    await png(join(art, 'characters/pilot/idle.png'), 10, 15, 1);
    await png(join(art, 'backdrops/gagazet.png'), 8, 4, 1);
    await png(join(art, 'backdrops/room.png'), 8, 4, 1);
    const files: Array<[string, number, number, number]> = [
      ['characters/hero/idle@4x.png', 40, 60, 10], ['characters/hero/idle@2x.png', 20, 30, 11],
      ['characters/pilot/idle@4x.png', 40, 60, 12], ['characters/pilot/idle@2x.png', 20, 30, 13],
      ['backdrops/gagazet@2x.png', 16, 8, 14], ['backdrops/room@2x.png', 16, 8, 15],
    ];
    for (const [f, w, h, fill] of files) {
      await png(join(oldLib, f), w, h, fill);
      await png(join(newLib, f), w, h, fill + 100); // the fixed library: same sizes, different pixels
    }
    const manifest = (lib: string) => ({
      assets: Object.fromEntries([
        ['characters/hero/idle', [['characters/hero/idle@4x.png', 4, [40, 60]], ['characters/hero/idle@2x.png', 2, [20, 30]]], join(art, 'characters/hero/idle.png')],
        ['characters/pilot/idle', [['characters/pilot/idle@4x.png', 4, [40, 60]], ['characters/pilot/idle@2x.png', 2, [20, 30]]], join(art, 'characters/pilot/idle.png')],
        ['backdrops/gagazet', [['backdrops/gagazet@2x.png', 2, [16, 8]]], join(art, 'backdrops/gagazet.png')],
        ['backdrops/room', [['backdrops/room@2x.png', 2, [16, 8]]], join(art, 'backdrops/room.png')],
      ].map(([id, outs, one]) => [id, {
        id, status: 'ok', flags: [], source_sha256: sha(one as string),
        outputs: (outs as Array<[string, number, [number, number]]>).map(([path, scale, size]) => ({ path, scale, bytes_png: statSync(join(lib, path)).size, size })),
      }])),
    });
    writeFileSync(join(oldLib, 'manifest.json'), JSON.stringify(manifest(oldLib)));
    writeFileSync(join(newLib, 'manifest.json'), JSON.stringify(manifest(newLib)));
    // what the old install left: hard links of the old library, the pilot's own 2x (not the library's), and a derived 3x
    for (const f of ['characters/hero/idle@4x.png', 'characters/hero/idle@2x.png', 'characters/pilot/idle@4x.png', 'backdrops/gagazet@2x.png', 'backdrops/room@2x.png']) linkSync(join(oldLib, f), join(art, f));
    await png(join(art, 'characters/pilot/idle@2x.png'), 20, 30, 77); // an approved pilot master: never the library's
    await png(join(art, 'characters/hero/idle@3x.png'), 30, 45, 5); // derived from the old 4x, one link
    return { oldLib, newLib, art, parkDir };
  }

  it('knows the held-back backdrops and reads a key from a master path', () => {
    expect(Object.keys(HELD_BACKDROPS).sort()).toEqual(['garden-of-pain', 'gagazet', 'road-to-the-farplane', 'road-to-the-farplane-links', 'title', 'via-purifico'].sort());
    expect(backdropKey('backdrops/gagazet@2x.png')).toBe('gagazet');
    expect(backdropKey('backdrops/road-to-the-farplane-links@2x.png')).toBe('road-to-the-farplane-links');
    expect(backdropKey('characters/tidus/idle@4x.png')).toBeNull();
  });

  it('never installs a held-back backdrop, with or without an upgrade', async () => {
    const { oldLib, newLib, art } = await world();
    rmSync(join(art, 'backdrops/gagazet@2x.png'));
    const fresh = await plan({ lib: oldLib, art, only: ['backdrops/'], scales: [2], held: { gagazet: 'invented lines' } });
    expect(fresh.jobs).toEqual([]);
    expect(fresh.skipped.find((x) => x.id === 'backdrops/gagazet@2x.png')?.why).toBe('held back: invented lines (re-render owed)');
    const up = await plan({ lib: newLib, art, only: ['backdrops/'], scales: [2], replaceFrom: oldLib, held: { gagazet: 'invented lines' } });
    expect(up.jobs.map((j) => `${j.kind}:${j.id}`)).toEqual(['replace:backdrops/room@2x.png']);
  });

  it('takes an installed held-back master out when upgrading, and only when it is the old library\'s own file', async () => {
    const { oldLib, newLib, art } = await world();
    const up = await plan({ lib: newLib, art, only: ['backdrops/'], scales: [2], replaceFrom: oldLib, held: { gagazet: 'invented lines' } });
    expect(up.jobs.map((j) => `${j.kind}:${j.id}`).sort()).toEqual(['drop:backdrops/gagazet@2x.png', 'replace:backdrops/room@2x.png']);
    rmSync(join(art, 'backdrops/gagazet@2x.png'));
    await png(join(art, 'backdrops/gagazet@2x.png'), 16, 8, 99); // a different file under the same name: not ours to remove
    const other = await plan({ lib: newLib, art, only: ['backdrops/'], scales: [2], replaceFrom: oldLib, held: { gagazet: 'invented lines' } });
    expect(other.jobs.map((j) => j.kind)).not.toContain('drop');
  });

  it('replaces exactly the old library\'s files, keeps a pilot master, and derives the 3x again from the new 4x', async () => {
    const { oldLib, newLib, art } = await world();
    const r = await plan({ lib: newLib, art, only: ['characters/'], scales: [2, 3, 4], replaceFrom: oldLib });
    const ids = r.jobs.map((j) => `${j.kind}:${j.id}`).sort();
    expect(ids).toEqual([
      'derive3:characters/hero/idle@3x.png',
      'derive3:characters/pilot/idle@3x.png',
      'replace:characters/hero/idle@2x.png',
      'replace:characters/hero/idle@4x.png',
      'replace:characters/pilot/idle@4x.png',
    ]);
    // the pilot's own 2x is not the old library's file: kept, and said so
    expect(r.skipped.find((x) => x.id === 'characters/pilot/idle@2x.png')?.why).toMatch(/not the old library's file/);
    // without --replace-from nothing installed is touched
    const plain = await plan({ lib: newLib, art, only: ['characters/'], scales: [2, 3, 4] });
    expect(plain.jobs.map((j) => `${j.kind}:${j.id}`)).toEqual(['derive3:characters/pilot/idle@3x.png']);
  });

  it('a file already the new library\'s is left alone (the upgrade is idempotent)', async () => {
    const { oldLib, newLib, art } = await world();
    for (const f of ['characters/hero/idle@4x.png', 'characters/hero/idle@2x.png', 'characters/pilot/idle@4x.png']) {
      rmSync(join(art, f));
      linkSync(join(newLib, f), join(art, f));
    }
    expect(sameFile(join(art, 'characters/hero/idle@4x.png'), join(newLib, 'characters/hero/idle@4x.png'))).toBe(true);
    expect(sameFile(join(art, 'characters/hero/idle@4x.png'), join(oldLib, 'characters/hero/idle@4x.png'))).toBe(false);
    const r = await plan({ lib: newLib, art, only: ['characters/hero'], scales: [2, 4], replaceFrom: oldLib });
    expect(r.jobs).toEqual([]);
    expect(r.skipped.map((x) => x.why)).toEqual(['already installed', 'already installed']);
  });

  it('parks what it replaces: a link is recorded (its data stays in the library), a derived file is copied first', async () => {
    const { art, parkDir } = await world();
    const link = park(join(art, 'characters/hero/idle@4x.png'), art, parkDir);
    expect(link.links).toBeGreaterThan(1);
    expect(link.note).toMatch(/stays in that library/);
    expect(existsSync(join(parkDir, 'characters/hero/idle@4x.png'))).toBe(false);
    const derived = park(join(art, 'characters/hero/idle@3x.png'), art, parkDir);
    expect(derived.links).toBe(1);
    expect(derived.parkedTo).toBe(join(parkDir, 'characters/hero/idle@3x.png'));
    expect(sha(join(parkDir, 'characters/hero/idle@3x.png'))).toBe(sha(join(art, 'characters/hero/idle@3x.png')));
    expect(park(join(art, 'characters/hero/idle@3x.png'), art, null)).toEqual({ path: 'characters/hero/idle@3x.png', bytes: statSync(join(art, 'characters/hero/idle@3x.png')).size, links: 1 });
  });
});
