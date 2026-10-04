/**
 * Fixtures for the art derivation tests (release 38, "r38-bytes"): tiny synthetic images in a temporary folder, a build output
 * as Vite leaves it, and the PNG chunks the real art never carries (gAMA, a text chunk, sixteen bits). No real art, no real cache.
 */
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import sharp from 'sharp';

/** A temporary world: `root` holds `public/` (`pub`), a cache folder and, once made, a build output `out`. */
export function makeWorld(): { root: string; pub: string; cache: string } {
  const root = mkdtempSync(join(tmpdir(), 'pyrefly-art-derive-'));
  return { root, pub: join(root, 'public'), cache: join(root, 'cache') };
}

export const removeWorld = (root: string): void => rmSync(root, { recursive: true, force: true });

/** A repeatable stream of bytes that does not compress (xorshift32). */
export function noise(n: number, seed = 7): Buffer {
  const b = Buffer.alloc(n);
  let x = seed | 0 || 1;
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    b[i] = (x >>> 8) & 0xff;
  }
  return b;
}

/** RGBA with a soft silhouette, and colour under the fully transparent pixels that a WebP must keep. */
export function sprite(w: number, h: number): Buffer {
  const b = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inside = (x - w / 2) ** 2 + (y - h / 2) ** 2 < (w / 3) ** 2;
      b[i] = Math.floor((x * 255) / w);
      b[i + 1] = Math.floor((y * 255) / h);
      b[i + 2] = 120 + ((x ^ y) & 7);
      b[i + 3] = inside ? 255 - ((x + y) & 15) : 0;
    }
  return b;
}

export const png = (raw: Buffer, w: number, h: number, channels: 1 | 2 | 3 | 4, options: Parameters<ReturnType<typeof sharp>['png']>[0] = {}) =>
  sharp(raw, { raw: { width: w, height: h, channels } }).png(options).toBuffer();

/** One PNG chunk: length, type, data, CRC. */
export function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'latin1'), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** A PNG with one extra chunk placed before its first IDAT. */
export function withChunk(file: Buffer, type: string, data: Buffer): Buffer {
  const at = file.indexOf('IDAT') - 4;
  return Buffer.concat([file.subarray(0, at), chunk(type, data), file.subarray(at)]);
}

/** A 16-bit grey PNG, as the depth maps were before release 38, written by hand. */
export function grey16Png(w: number, h: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 16; // bit depth; colour type 0 (grey) and the three zero bytes follow
  const rows = Buffer.alloc((1 + w * 2) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rows.writeUInt16BE((x * 257 + y * 3) & 0xffff, y * (1 + w * 2) + 1 + x * 2);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}


/** Write a file under `pub`. */
export function putFile(pub: string, rel: string, data: Buffer | string): void {
  const f = join(pub, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, data);
}

/** What Vite leaves in the output before the plugins' closeBundle: public copied whole, the unshipped files pruned. */
export function makeBuild(pub: string, root: string, extra: Record<string, string> = {}): string {
  const out = join(root, 'out');
  cpSync(pub, out, { recursive: true });
  for (const rel of ['art/characters/hero/idle.raw.png', 'art/characters/hero/idle.1.png']) rmSync(join(out, rel), { force: true });
  for (const [rel, body] of Object.entries({ 'index.html': '<html></html>', ...extra })) {
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), body);
  }
  return out;
}

/** The art most tests start from: a sprite and its 2x master, a backdrop, a grey portrait, a pause plate with its lossy 2x, and what must not ship. */
export async function makeStandardArt(pub: string): Promise<void> {
  const put = (rel: string, data: Buffer | string) => putFile(pub, rel, data);
  put('art/characters/hero/idle.png', await png(sprite(64, 96), 64, 96, 4));
  put('art/characters/hero/idle@2x.png', await png(sprite(128, 192), 128, 192, 4));
  // Gradients with a ripple: a bare gradient encodes to a lossless WebP of 46 to 64 bytes, which sits on the 64-byte floor (`MIN_WEBP_BYTES`) and would ship as a PNG.
  put('art/backdrops/sky.png', await png(Buffer.from(Array.from({ length: 96 * 54 * 3 }, (_, i) => (Math.floor(((i / 3) % 96) * 2.5) + ((i * 2654435761) >>> 28)) & 255)), 96, 54, 3));
  put('art/portraits/grey.png', await png(Buffer.from(Array.from({ length: 40 * 40 }, (_, i) => ((i % 40) * 5 + Math.floor(i / 40) * 3 + ((i * 2654435761) >>> 27)) & 255)), 40, 40, 1));
  put('art/characters/hero/idle.raw.png', Buffer.from('raw render'));
  put('art/characters/hero/idle.1.png', Buffer.from('numbered take'));
  put('art/pause/x.png', await png(sprite(60, 34), 60, 34, 4));
  put('art/pause/x.2x.webp', await sharp(sprite(120, 68), { raw: { width: 120, height: 68, channels: 4 } }).webp({ quality: 80 }).toBuffer());
  put('art/characters/hero/idle.json', '{"width":64,"height":96,"prompt":"public/art/characters/hero/idle.png"}');
  put('art/manifest.json', '{"version":1}');
}
