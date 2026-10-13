/**
 * Fixtures for the strip-thumbnail tests (r44-thumbs): pictures big enough to be reduced (a 1280 x 720 scene, a 500 x 900 boss with soft
 * edges), one too small to have a thumbnail, one the tool refuses, and one the list names that is not there. Synthetic images in a temporary
 * folder, built with sharp; no real art, no real cache. Both games: shared build plumbing.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

import { chunk, png, putFile, sprite, withChunk } from './artFixtures.ts';

/**
 * An opaque picture a lossless WebP still shrinks, and cheap to encode: crossed gradients with bands. (A blocky pattern made the encoder take
 * seconds a picture and noise a second; nothing here needs either, only that the WebP stays well above the 64-byte floor.)
 */
function scene(w: number, h: number, seed: number): Buffer {
  const b = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      b[i] = (Math.floor(x * 0.37) + y + seed * 40) & 255;
      b[i + 1] = (Math.floor(x * 0.9) + Math.floor(y * 0.5) + seed * 17) & 255;
      b[i + 2] = (90 + (((y >> 5) + seed) & 7) * 12) & 255;
    }
  return b;
}

/** The strip list of the fixtures, in the order a build reads it (sorted). */
export const STRIP_FIXTURE_LIST = [
  'art/backdrops/dusk.png', // 1280 x 720, opaque: a WebP thumbnail, 768 x 432
  'art/backdrops/gamma.png', // carries a gAMA chunk: refused, no thumbnail
  'art/backdrops/missing.png', // named by the list, not in public/art
  'art/backdrops/wide.png', // 1500 x 1000, opaque: 768 x 512
  'art/characters/boss/idle.png', // 500 x 900, soft edges: a PNG thumbnail, 320 x 576
  'art/characters/tiny/idle.png', // 300 x 400: no larger than a thumbnail would be, none
] as const;

/** The pictures, written into `pub`; returns the master bytes by name. */
export async function makeStripArt(pub: string): Promise<Record<string, Buffer>> {
  const made: Record<string, Buffer> = {};
  const put = (rel: string, data: Buffer): void => {
    putFile(pub, rel, data);
    made[rel] = data;
  };
  put('art/backdrops/dusk.png', await png(scene(1280, 720, 1), 1280, 720, 3));
  put('art/backdrops/wide.png', await png(scene(1500, 1000, 2), 1500, 1000, 3));
  put('art/backdrops/gamma.png', withChunk(await png(scene(1000, 560, 3), 1000, 560, 3), 'gAMA', Buffer.from([0, 1, 0x86, 0xa0])));
  put('art/characters/boss/idle.png', await png(sprite(500, 900), 500, 900, 4));
  put('art/characters/tiny/idle.png', await png(sprite(300, 400), 300, 400, 4));
  // Things a build also holds, so the gates have something to ignore.
  put('art/manifest.json', Buffer.from('{"version":1}'));
  return made;
}

/** Write the strip list where the build looks for it (`<root>/src/data/art/strip-art.json`) and return its path. */
export function writeStripList(root: string, masters: readonly string[] = STRIP_FIXTURE_LIST): string {
  const file = join(root, 'src/data/art/strip-art.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ masters }));
  return file;
}

/** A small lossless WebP of a flat colour at the given size, for tampering with a build. */
export const flatWebp = (w: number, h: number, rgb: [number, number, number] = [10, 200, 90]): Promise<Buffer> =>
  sharp({ create: { width: w, height: h, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } } }).webp({ lossless: true }).toBuffer();

export { chunk };
