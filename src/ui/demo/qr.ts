/**
 * A small QR Code encoder (R61 booth flow, the conference demo; both games, shared plumbing, no game content).
 *
 * The demo's title and fight picker carry a QR code to https://echoesofspira.com (Bailey, 2026-10-21, decision 169o) and the repo had no QR library, so this is
 * the dependency written out instead of installed: byte mode, versions 1 to 10, the four levels, the eight masks, the standard's penalty scoring (ISO/IEC 18004).
 * `qrSvg.ts` draws one; the test reader (`tests/unit/helpers/qrRead.ts`) reads one back. Proved in `tests/unit/demo-qr.test.ts` against an independent encoder's output (reportlab) and by
 * decoding every version and level. Pure: no DOM, no timers, no randomness; the same text always gives the same matrix.
 */

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrCode {
  /** Modules per side: `version * 4 + 17`. */
  readonly size: number;
  readonly version: number;
  readonly ec: EcLevel;
  readonly mask: number;
  /** `modules[y][x]` is true for a dark module. */
  readonly modules: readonly (readonly boolean[])[];
}

export interface QrOptions {
  /** Error correction. Default `'M'` (15 percent damage survives). */
  ec?: EcLevel;
  /** Force a mask 0 to 7 instead of choosing the lowest-penalty one (tests only). */
  mask?: number;
  /** The smallest version to use (tests only). */
  minVersion?: number;
}

/** Format-word bits of each level. */
const EC_FORMAT_BITS: Readonly<Record<EcLevel, number>> = { L: 1, M: 0, Q: 3, H: 2 };
export const EC_ORDER: readonly EcLevel[] = ['L', 'M', 'Q', 'H'];

/** Error-correction codewords per block, versions 1 to 10 (index 0 is version 1), per level. */
export const ECC_PER_BLOCK: Readonly<Record<EcLevel, readonly number[]>> = {
  L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
  M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
  Q: [13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
  H: [17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
};

/** Error-correction blocks, versions 1 to 10, per level. */
export const BLOCKS: Readonly<Record<EcLevel, readonly number[]>> = {
  L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
  M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
  Q: [1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
  H: [1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
};

export const MAX_VERSION = 10;

// ---------------------------------------------------------------- geometry

/** Modules that can hold data or error correction (everything but the function patterns), for a version. */
export function rawDataModules(version: number): number {
  let n = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    n -= (25 * align - 10) * align - 55;
    if (version >= 7) n -= 36;
  }
  return n;
}

/** Data codewords a version holds at a level. */
export function dataCodewords(version: number, ec: EcLevel): number {
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[ec][version - 1]! * BLOCKS[ec][version - 1]!;
}

/** The most bytes a version holds at a level in byte mode. */
export function byteCapacity(version: number, ec: EcLevel): number {
  const countBits = version <= 9 ? 8 : 16;
  return Math.floor((dataCodewords(version, ec) * 8 - 4 - countBits) / 8);
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const out = [6];
  for (let pos = size - 7; out.length < count; pos -= step) out.splice(1, 0, pos);
  return out;
}

// ------------------------------------------------------- Reed-Solomon, GF(256)

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;
}

/** The generator polynomial of the given degree, highest term first without the leading 1. */
function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] = next[j]! ^ poly[j]!;
      next[j + 1] = next[j + 1]! ^ gfMul(poly[j]!, EXP[i]!);
    }
    poly = next;
  }
  return poly.slice(1);
}

function eccOf(data: readonly number[], degree: number): number[] {
  const gen = generator(degree);
  const rem = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift()!;
    rem.push(0);
    for (let i = 0; i < degree; i++) rem[i] = rem[i]! ^ gfMul(gen[i]!, factor);
  }
  return rem;
}

// ---------------------------------------------------------------- data words

function utf8(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

/** The bit string of a byte-mode segment, padded out to exactly `capacity` codewords. */
function dataWords(bytes: readonly number[], version: number, capacity: number): number[] {
  const bits: number[] = [];
  const push = (value: number, count: number): void => {
    for (let i = count - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  const room = capacity * 8;
  push(0, Math.min(4, room - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let w = 0;
    for (let j = 0; j < 8; j++) w = (w << 1) | bits[i + j]!;
    words.push(w);
  }
  for (let pad = 0xec; words.length < capacity; pad ^= 0xec ^ 0x11) words.push(pad);
  return words;
}

/** Split into blocks, add each block's error correction and interleave: every block's data words column by column, then every block's error-correction words column by column (the standard's order). */
function interleaved(data: readonly number[], version: number, ec: EcLevel): number[] {
  const blocks = BLOCKS[ec][version - 1]!;
  const eccLen = ECC_PER_BLOCK[ec][version - 1]!;
  const raw = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const dataParts: number[][] = [];
  const eccParts: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const len = shortLen - eccLen + (i < shortBlocks ? 0 : 1);
    const part = data.slice(k, k + len);
    k += len;
    dataParts.push(part);
    eccParts.push(eccOf(part, eccLen));
  }
  const out: number[] = [];
  const longest = shortLen - eccLen + (shortBlocks < blocks ? 1 : 0);
  for (let i = 0; i < longest; i++) for (const part of dataParts) if (i < part.length) out.push(part[i]!);
  for (let i = 0; i < eccLen; i++) for (const part of eccParts) out.push(part[i]!);
  return out;
}

// ------------------------------------------------------------------ the grid

export interface Grid {
  size: number;
  m: boolean[][];
  fn: boolean[][];
}

export function blankGrid(version: number): Grid {
  const size = version * 4 + 17;
  const make = (): boolean[][] => Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  return { size, m: make(), fn: make() };
}

function setFn(g: Grid, x: number, y: number, dark: boolean): void {
  if (x < 0 || y < 0 || x >= g.size || y >= g.size) return;
  g.m[y]![x] = dark;
  g.fn[y]![x] = true;
}

function drawFinder(g: Grid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setFn(g, cx + dx, cy + dy, dist !== 2 && dist !== 4);
    }
  }
}

function drawAlignment(g: Grid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setFn(g, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
}

export function formatBits(ec: EcLevel, mask: number): number {
  const data = (EC_FORMAT_BITS[ec] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  return (version << 12) | rem;
}

function drawFormat(g: Grid, ec: EcLevel, mask: number): void {
  const bits = formatBits(ec, mask);
  const bit = (i: number): boolean => ((bits >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i++) setFn(g, 8, i, bit(i));
  setFn(g, 8, 7, bit(6));
  setFn(g, 8, 8, bit(7));
  setFn(g, 7, 8, bit(8));
  for (let i = 9; i < 15; i++) setFn(g, 14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) setFn(g, g.size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) setFn(g, 8, g.size - 15 + i, bit(i));
  setFn(g, 8, g.size - 8, true); // the always-dark module
}

function drawVersion(g: Grid, version: number): void {
  if (version < 7) return;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const dark = ((bits >>> i) & 1) !== 0;
    const a = g.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFn(g, a, b, dark);
    setFn(g, b, a, dark);
  }
}

export function drawFunctionPatterns(g: Grid, version: number, ec: EcLevel): void {
  for (let i = 0; i < g.size; i++) {
    setFn(g, 6, i, i % 2 === 0);
    setFn(g, i, 6, i % 2 === 0);
  }
  drawFinder(g, 3, 3);
  drawFinder(g, g.size - 4, 3);
  drawFinder(g, 3, g.size - 4);
  const pos = alignmentPositions(version);
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const corner = (i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0);
      if (!corner) drawAlignment(g, pos[i]!, pos[j]!);
    }
  }
  drawFormat(g, ec, 0); // reserves the area; redrawn with the real mask
  drawVersion(g, version);
}

function placeCodewords(g: Grid, words: readonly number[]): void {
  let i = 0;
  for (let right = g.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < g.size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? g.size - 1 - vert : vert;
        if (!g.fn[y]![x] && i < words.length * 8) {
          g.m[y]![x] = ((words[i >>> 3]! >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }
}

/** True when mask `mask` flips the module at (x, y). */
export function maskFlips(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return ((((x * y) % 2) + ((x * y) % 3)) % 2) === 0;
    default: return ((((x + y) % 2) + ((x * y) % 3)) % 2) === 0;
  }
}

function applyMask(g: Grid, mask: number): void {
  for (let y = 0; y < g.size; y++) for (let x = 0; x < g.size; x++) if (!g.fn[y]![x] && maskFlips(mask, x, y)) g.m[y]![x] = !g.m[y]![x];
}

// ------------------------------------------------------------------ penalty

function runPenalty(line: readonly boolean[]): number {
  let score = 0;
  let run = 1;
  for (let i = 1; i <= line.length; i++) {
    if (i < line.length && line[i] === line[i - 1]) run++;
    else {
      if (run >= 5) score += 3 + (run - 5);
      run = 1;
    }
  }
  // Finder-like 1:1:3:1:1 with four light modules on either side (rule 3).
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
  for (let i = 0; i + 11 <= line.length; i++) {
    let a = true;
    let b = true;
    for (let k = 0; k < 11; k++) {
      if (line[i + k] !== pat1[k]) a = false;
      if (line[i + k] !== pat2[k]) b = false;
    }
    if (a) score += 40;
    if (b) score += 40;
  }
  return score;
}

/** The standard's four-rule penalty of a finished matrix. */
export function penalty(m: readonly (readonly boolean[])[]): number {
  const size = m.length;
  let score = 0;
  for (let y = 0; y < size; y++) score += runPenalty(m[y]!);
  for (let x = 0; x < size; x++) score += runPenalty(m.map((row) => row[x]!));
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = m[y]![x];
      if (c === m[y]![x + 1] && c === m[y + 1]![x] && c === m[y + 1]![x + 1]) score += 3;
    }
  }
  let dark = 0;
  for (const row of m) for (const c of row) if (c) dark++;
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

// ---------------------------------------------------------------------- API

/**
 * Encode `text` (UTF-8, byte mode). Chooses the smallest version that holds it at the level, and the lowest-penalty mask. Throws when the text
 * does not fit version 10 at the level (about 150 characters at `M`): this module is for a short address, not a document.
 */
export function encodeQr(text: string, options: QrOptions = {}): QrCode {
  const ec = options.ec ?? 'M';
  if (!EC_ORDER.includes(ec)) throw new Error(`unknown error-correction level ${String(ec)}`);
  const bytes = utf8(text);
  let version = Math.max(1, options.minVersion ?? 1);
  while (version <= MAX_VERSION && byteCapacity(version, ec) < bytes.length) version++;
  if (version > MAX_VERSION) throw new Error(`QR: ${bytes.length} bytes do not fit version ${MAX_VERSION} at level ${ec}`);

  const words = interleaved(dataWords(bytes, version, dataCodewords(version, ec)), version, ec);
  const build = (mask: number): Grid => {
    const g = blankGrid(version);
    drawFunctionPatterns(g, version, ec);
    placeCodewords(g, words);
    applyMask(g, mask);
    drawFormat(g, ec, mask);
    return g;
  };
  let best = options.mask ?? -1;
  if (best < 0) {
    let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const score = penalty(build(mask).m);
      if (score < bestScore) {
        bestScore = score;
        best = mask;
      }
    }
  }
  if (best < 0 || best > 7) throw new Error(`QR: mask ${best} is not 0 to 7`);
  const grid = build(best);
  return { size: grid.size, version, ec, mask: best, modules: grid.m };
}

/** The matrix as rows of `#` (dark) and `.` (light), for fixtures and diffs. */
export function qrRows(code: QrCode): string[] {
  return code.modules.map((row) => row.map((d) => (d ? '#' : '.')).join(''));
}
