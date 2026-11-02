/**
 * TEXT WIDTHS FROM A SHIPPED FONT FILE, WITHOUT A BROWSER (r74-fins, 2026-11-02): the Fin plate's width is its charge line's, and the charge line is set in Chakra Petch Bold, so the test that says whether the plate fits the band
 * between the F1 boss ribbon and the F1 turn strip reads the font the page loads (`public/fonts/**.woff2`, committed) instead of guessing a character width. It parses the WOFF2 table directory, Brotli-decompresses the stream
 * (`node:zlib`), and reads `head` (units per em), `hhea` + `hmtx` (advances) and `cmap` (format 4 or 12). No kerning (the charge line is uppercase with letter-spacing, where a face's pair kerning is a few units at most) and no
 * shaping: the width is the sum of the advances plus the letter-spacing per character, which is what a browser lays out for a Latin string with `letter-spacing` set (it also turns ligatures off).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliDecompressSync } from 'node:zlib';

const ROOT = join(__dirname, '..', '..', '..');

/** The WOFF2 known-tag table (the specification's order); index 63 means the tag follows in four bytes. */
const KNOWN = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];

interface Table {
  off: number;
  transformed: boolean;
}

export interface FontMetrics {
  /** Units per em of the face. */
  upm: number;
  /** The advance of one character at a font size, px (0 for a character the face lacks: see {@link FontMetrics.has}). */
  advance(ch: string, px: number): number;
  /** Does the face draw this character? */
  has(ch: string): boolean;
}

/** Read a font's metrics from a `.woff2` under the repository root (`rel` is relative to it). */
export function fontMetrics(rel: string): FontMetrics {
  const b = readFileSync(join(ROOT, rel));
  if (b.toString('latin1', 0, 4) !== 'wOF2') throw new Error(`${rel} is not a WOFF2 file`);
  const numTables = b.readUInt16BE(12);
  const compressed = b.readUInt32BE(20);
  let o = 48;
  const base128 = (): number => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const c = b[o++]!;
      v = ((v << 7) | (c & 0x7f)) >>> 0;
      if ((c & 0x80) === 0) return v;
    }
    throw new Error('bad UIntBase128');
  };
  const dir: Array<{ tag: string; len: number; transformed: boolean }> = [];
  for (let i = 0; i < numTables; i++) {
    const flags = b[o++]!;
    const index = flags & 0x3f;
    const version = flags >> 6;
    let tag: string;
    if (index === 63) {
      tag = b.toString('latin1', o, o + 4);
      o += 4;
    } else tag = KNOWN[index]!;
    const orig = base128();
    const transformed = tag === 'glyf' || tag === 'loca' ? version === 0 : version !== 0;
    dir.push({ tag, len: transformed ? base128() : orig, transformed });
  }
  const data = brotliDecompressSync(b.subarray(o, o + compressed));
  const tables = new Map<string, Table>();
  let p = 0;
  for (const t of dir) {
    tables.set(t.tag, { off: p, transformed: t.transformed });
    p += t.len;
  }
  const at = (tag: string): number => {
    const t = tables.get(tag);
    if (t === undefined) throw new Error(`${rel} has no ${tag} table`);
    if (t.transformed && tag === 'hmtx') throw new Error(`${rel}: a transformed hmtx is not read here`);
    return t.off;
  };
  const upm = data.readUInt16BE(at('head') + 18);
  const hmetrics = data.readUInt16BE(at('hhea') + 34);
  const hmtx = at('hmtx');
  const advanceOf = (gid: number): number => data.readUInt16BE(hmtx + 4 * Math.min(gid, hmetrics - 1));
  const cmap = at('cmap');
  let sub = -1;
  for (let i = 0, n = data.readUInt16BE(cmap + 2); i < n; i++) {
    const platform = data.readUInt16BE(cmap + 4 + 8 * i);
    const encoding = data.readUInt16BE(cmap + 6 + 8 * i);
    if ((platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0) {
      sub = cmap + data.readUInt32BE(cmap + 8 + 8 * i);
      if (encoding === 10) break;
    }
  }
  if (sub < 0) throw new Error(`${rel} has no Unicode cmap`);
  const format = data.readUInt16BE(sub);
  const gidOf = (cp: number): number => {
    if (format === 4) {
      const segX2 = data.readUInt16BE(sub + 6);
      const endAt = sub + 14;
      const startAt = endAt + segX2 + 2;
      const deltaAt = startAt + segX2;
      const rangeAt = deltaAt + segX2;
      for (let i = 0; i < segX2 / 2; i++) {
        if (cp > data.readUInt16BE(endAt + 2 * i)) continue;
        const start = data.readUInt16BE(startAt + 2 * i);
        if (cp < start) return 0;
        const delta = data.readInt16BE(deltaAt + 2 * i);
        const range = data.readUInt16BE(rangeAt + 2 * i);
        if (range === 0) return (cp + delta) & 0xffff;
        const g = data.readUInt16BE(rangeAt + 2 * i + range + 2 * (cp - start));
        return g === 0 ? 0 : (g + delta) & 0xffff;
      }
      return 0;
    }
    if (format === 12) {
      for (let i = 0, n = data.readUInt32BE(sub + 12); i < n; i++) {
        const start = data.readUInt32BE(sub + 16 + 12 * i);
        if (cp >= start && cp <= data.readUInt32BE(sub + 20 + 12 * i)) return data.readUInt32BE(sub + 24 + 12 * i) + (cp - start);
      }
      return 0;
    }
    throw new Error(`${rel}: cmap format ${format} is not read here`);
  };
  return {
    upm,
    advance: (ch, px) => (advanceOf(gidOf(ch.codePointAt(0)!)) / upm) * px,
    has: (ch) => gidOf(ch.codePointAt(0)!) !== 0,
  };
}

/** The width of a string, px: the advances at `px` plus `letterSpacingEm` x `px` after every character (CSS `letter-spacing` adds it after each, the last one too). */
export function textWidth(m: FontMetrics, text: string, px: number, letterSpacingEm = 0): number {
  let w = 0;
  for (const ch of text) w += m.advance(ch, px) + letterSpacingEm * px;
  return w;
}
