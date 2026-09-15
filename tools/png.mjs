/**
 * Self-contained PNG writer and a tiny RGBA image buffer.
 *
 * Node built-ins only (`zlib.deflateSync` + a CRC-32 table). No dependencies,
 * deliberately: the sprite tools must run on a bare checkout.
 */

import { deflateSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'latin1'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

/**
 * Encode 8-bit RGBA pixels as a PNG.
 *
 * @param {number} width
 * @param {number} height
 * @param {Uint8Array|Uint8ClampedArray} rgba row-major, `width * height * 4` bytes
 * @returns {Buffer}
 */
export function encodePng(width, height, rgba) {
  if (rgba.length < width * height * 4) throw new Error('encodePng: pixel buffer too small');
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none — keeps output byte-identical run to run
    for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** A mutable RGBA image with just enough drawing for preview sheets. */
export class Image {
  constructor(width, height, fill = [0, 0, 0, 0]) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
    if (fill[3] > 0) this.fillRect(0, 0, width, height, fill);
  }

  set(x, y, rgba) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    if (rgba[3] === 0) return;
    const i = (y * this.width + x) * 4;
    if (rgba[3] === 255) {
      this.data[i] = rgba[0];
      this.data[i + 1] = rgba[1];
      this.data[i + 2] = rgba[2];
      this.data[i + 3] = 255;
      return;
    }
    const a = rgba[3] / 255;
    const inv = 1 - a;
    this.data[i] = rgba[0] * a + this.data[i] * inv;
    this.data[i + 1] = rgba[1] * a + this.data[i + 1] * inv;
    this.data[i + 2] = rgba[2] * a + this.data[i + 2] * inv;
    this.data[i + 3] = Math.max(this.data[i + 3], rgba[3]);
  }

  fillRect(x, y, w, h, rgba) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, rgba);
  }

  /** Blit a `{ width, height, data }` raster, nearest-neighbour upscaled by `scale`. */
  blit(raster, dx, dy, scale = 1) {
    for (let y = 0; y < raster.height * scale; y++) {
      const sy = (y / scale) | 0;
      for (let x = 0; x < raster.width * scale; x++) {
        const sx = (x / scale) | 0;
        const si = (sy * raster.width + sx) * 4;
        this.set(dx + x, dy + y, [
          raster.data[si],
          raster.data[si + 1],
          raster.data[si + 2],
          raster.data[si + 3],
        ]);
      }
    }
  }

  toPng() {
    return encodePng(this.width, this.height, this.data);
  }
}

/** `#rrggbb` / `#rrggbbaa` -> `[r, g, b, a]`. */
export function rgba(hex) {
  let s = hex.replace('#', '');
  if (s.length === 6) s += 'ff';
  const n = parseInt(s, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}
