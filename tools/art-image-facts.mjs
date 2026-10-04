/**
 * What an art file's pixels and bytes say about whether every decoder draws it the same (release 38, "r38-bytes", repair of the
 * independent check of 2026-10-03). Pure functions over a decoded RGBA buffer or a PNG's bytes, no dependencies, so the library
 * (`art-derive-lib.mjs`), the gates (`art-verify.mjs`) and the tests all read a picture the same way.
 *
 * **Why transparency decides it.** A browser may hand the page a decoded image premultiplied: colour * alpha / 255, rounded. At alpha
 * 255 that is the identity. At alpha 0 it is (0, 0, 0): the colour hidden under a fully transparent texel is lost, unless it was zero
 * already. Anywhere between, the rounding differs from decoder to decoder, so the same straight RGBA drawn through the DOM or a 2D
 * canvas can come out a step apart (Chromium's libwebp against its PNG decoder), or much further apart once the game reads it back
 * and un-premultiplies it (`PaintedMatte.cleanMatte`: drawImage, getImageData, putImageData; up to 124 in 255 for Yunalesca's 2x
 * master), and WebKit keeps the colour under alpha 0 for a PNG and drops it for a WebP. A picture is therefore **decoder
 * independent** only when premultiplying is the identity on every pixel: every alpha is 255, or 0 with no colour under it. For
 * such a picture a lossless WebP and its PNG are the same on every path, whatever the engine and whatever the page does with it.
 *
 * Game case: both (shared build plumbing; no game content).
 */

/** `opaque` (every alpha 255), `binary` (only 0 and 255) or `translucent` (any other alpha). */
export const ALPHA_CLASSES = Object.freeze(['opaque', 'binary', 'translucent']);

/**
 * The transparency of raw 8-bit RGBA bytes: its class, how many texels are fully transparent, and how many of those still carry
 * colour (a non-zero R, G or B under alpha 0), which is the part a premultiplying decoder throws away.
 */
export function alphaInfoOf(rgba) {
  let alpha = 'opaque';
  let transparent = 0;
  let hidden = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    const a = rgba[i];
    if (a === 255) continue;
    if (a === 0) {
      transparent++;
      if (rgba[i - 3] | rgba[i - 2] | rgba[i - 1]) hidden++;
      if (alpha === 'opaque') alpha = 'binary';
    } else alpha = 'translucent';
  }
  return { alpha, transparent, hidden };
}

/** The class alone (`alphaInfoOf(rgba).alpha`). */
export const alphaClassOf = (rgba) => alphaInfoOf(rgba).alpha;

/**
 * Is a picture with this transparency drawn identically by every decoder? Only when it is opaque, or binary with nothing hidden
 * under alpha 0 (`hidden` is exactly 0: an unknown count is not a yes). See the file header.
 */
export const decoderIndependent = (alpha, hidden) => alpha === 'opaque' || (alpha === 'binary' && hidden === 0);

/** Chunks that can change how a decoder reads or orients the pixels: a recompressed file must not gain one its master lacks. */
export const COLOUR_CHUNKS = Object.freeze(['iCCP', 'gAMA', 'cHRM', 'sRGB', 'sBIT', 'cICP', 'mDCV', 'cLLI', 'eXIf']);

/** The chunk types of a PNG before its first IDAT: what could change colour (`iCCP`, `gAMA`, `cHRM`) is visible here. */
export function pngChunkTypes(buf) {
  const types = [];
  for (let i = 8; i + 8 <= buf.length; ) {
    const type = buf.toString('latin1', i + 4, i + 8);
    if (type === 'IDAT') break;
    types.push(type);
    i += 12 + buf.readUInt32BE(i);
  }
  return types;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** What decides the pixels: the critical chunks and the transparency of a palette or grey image. Everything else is metadata. */
const PIXEL_CHUNKS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);

/** Every chunk of a PNG in order, as `{ type, start, end }` (`end` exclusive, CRC included), up to IEND. Throws on a file that is not a PNG. */
export function pngChunks(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('not a PNG file');
  const out = [];
  for (let i = 8; i + 12 <= buf.length; ) {
    const type = buf.toString('latin1', i + 4, i + 8);
    const end = i + 12 + buf.readUInt32BE(i);
    if (end > buf.length) throw new Error(`PNG chunk ${type} runs past the end of the file`);
    out.push({ type, start: i, end });
    i = end;
    if (type === 'IEND') break;
  }
  return out;
}

/**
 * The same PNG without its metadata chunks (`pHYs`, `tEXt`, ...): the signature, the critical chunks and `tRNS`, each byte for byte, so
 * the compressed picture is untouched and a decoder has nothing but pixels to read. libvips writes a `pHYs` chunk to every PNG it saves.
 */
export function stripAncillaryChunks(buf) {
  return Buffer.concat([PNG_SIGNATURE, ...pngChunks(buf).filter((c) => PIXEL_CHUNKS.has(c.type)).map((c) => buf.subarray(c.start, c.end))]);
}
