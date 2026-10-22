/**
 * The QR reader the tests use (R61 booth flow; both games, no game content): reads a finished matrix back to its text the way a scanner does, from the standard's reading rules, so a
 * test can prove that what `encodeQr` drew decodes. See `qr.ts`.
 */

import { BLOCKS, ECC_PER_BLOCK, EC_ORDER, MAX_VERSION, blankGrid, drawFunctionPatterns, formatBits, maskFlips, rawDataModules, type EcLevel } from '../../../src/ui/demo/qr.ts';

/**
 * Read a finished matrix back to the text it encodes (byte mode, versions 1 to 10), as a scanner does: the format word names the level and mask,
 * the mask comes off, the codewords are read in the zigzag order, de-interleaved and the byte segment is read. Used by the tests as the check
 * that what was drawn is decodable. Returns null for anything it does not understand; it does not attempt error correction.
 */
export function decodeQr(modules: readonly (readonly boolean[])[]): string | null {
  const size = modules.length;
  if (size < 21 || (size - 17) % 4 !== 0) return null;
  const version = (size - 17) / 4;
  if (version > MAX_VERSION) return null;
  const at = (x: number, y: number): boolean => modules[y]![x]!;

  // Format word, from the first copy.
  let bits = 0;
  for (let i = 0; i <= 5; i++) bits |= (at(8, i) ? 1 : 0) << i;
  bits |= (at(8, 7) ? 1 : 0) << 6;
  bits |= (at(8, 8) ? 1 : 0) << 7;
  bits |= (at(7, 8) ? 1 : 0) << 8;
  for (let i = 9; i < 15; i++) bits |= (at(14 - i, 8) ? 1 : 0) << i;
  let found: { ec: EcLevel; mask: number } | null = null;
  for (const ec of EC_ORDER) for (let mask = 0; mask < 8; mask++) if (formatBits(ec, mask) === bits) found = { ec, mask };
  if (!found) return null;

  // The function-pattern map of this version, then the codewords in placement order.
  const g = blankGrid(version);
  drawFunctionPatterns(g, version, found.ec);
  const raw: boolean[] = [];
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!g.fn[y]![x]) raw.push(at(x, y) !== maskFlips(found.mask, x, y));
      }
    }
  }
  const words: number[] = [];
  for (let i = 0; i + 8 <= raw.length; i += 8) {
    let w = 0;
    for (let k = 0; k < 8; k++) w = (w << 1) | (raw[i + k] ? 1 : 0);
    words.push(w);
  }

  // De-interleave the data words.
  const blocks = BLOCKS[found.ec][version - 1]!;
  const eccLen = ECC_PER_BLOCK[found.ec][version - 1]!;
  const rawCount = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blocks - (rawCount % blocks);
  const shortLen = Math.floor(rawCount / blocks);
  const lens = Array.from({ length: blocks }, (_, i) => shortLen - eccLen + (i < shortBlocks ? 0 : 1));
  const parts: number[][] = lens.map(() => []);
  let k = 0;
  for (let i = 0; i < Math.max(...lens); i++) for (let j = 0; j < blocks; j++) if (i < lens[j]!) parts[j]!.push(words[k++]!);
  const data = parts.flat();

  // Byte-mode segment.
  const bitAt = (i: number): number => (data[i >>> 3]! >>> (7 - (i & 7))) & 1;
  const take = (from: number, n: number): number => {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | bitAt(from + i);
    return v;
  };
  if (take(0, 4) !== 0b0100) return null;
  const countBits = version <= 9 ? 8 : 16;
  const count = take(4, countBits);
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(take(4 + countBits + i * 8, 8));
  return new TextDecoder().decode(new Uint8Array(out));
}

