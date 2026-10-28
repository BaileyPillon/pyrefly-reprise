/**
 * The portable save's hash and canonical text (`src/app/savePortSha256.ts`) against Node's own `crypto`: a wrong
 * round constant or a padding slip cannot hide behind a round trip that is wrong the same way both times.
 *
 * Both games: shared plumbing (the save file).
 */
import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { canonicalJson, sha256Hex } from '../../src/app/savePortSha256.ts';

const node = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');

describe('sha256Hex agrees with Node crypto', () => {
  it('the published vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('the padding edges: 0, 1, 55, 56, 57, 63, 64, 65, 119, 120, 121 bytes', () => {
    for (const n of [0, 1, 55, 56, 57, 63, 64, 65, 119, 120, 121, 127, 128, 129]) {
      const text = 'x'.repeat(n);
      expect(sha256Hex(text), `${n} bytes`).toBe(node(text));
    }
  });

  it('multi-byte text is hashed as UTF-8', () => {
    for (const text of ['Yuna — Spira', 'スピラ', '🔥 pyre', 'café'.repeat(40)]) {
      expect(sha256Hex(text)).toBe(node(text));
    }
  });

  it('three hundred random ASCII inputs of random lengths', () => {
    for (let i = 0; i < 300; i++) {
      const len = randomBytes(2).readUInt16BE(0) % 400;
      const text = randomBytes(len).toString('base64').slice(0, len);
      expect(sha256Hex(text)).toBe(node(text));
    }
  });

  it('a 300 KB input', () => {
    const text = randomBytes(225_000).toString('base64');
    expect(text.length).toBeGreaterThanOrEqual(300_000);
    expect(sha256Hex(text)).toBe(node(text));
  });
});

describe('canonicalJson', () => {
  it('sorts keys at every depth and leaves no whitespace', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: null } })).toBe('{"a":{"c":null,"d":[3,{"y":2,"z":1}]},"b":1}');
  });

  it('is the same text whatever order the keys were made in, integer-like keys included', () => {
    const one = { '10': 'a', '2': 'b', k: 1, j: 2 };
    const two = { j: 2, k: 1, '2': 'b', '10': 'a' };
    expect(canonicalJson(one)).toBe(canonicalJson(two));
  });

  it('drops undefined and function members of an object and reads them as null in an array, like JSON.stringify', () => {
    expect(canonicalJson({ a: undefined, b: () => 1, c: 1 })).toBe('{"c":1}');
    expect(canonicalJson([undefined, () => 1, 2])).toBe('[null,null,2]');
  });

  it('reads a non-finite number as null and -0 as 0', () => {
    expect(canonicalJson([Number.NaN, Number.POSITIVE_INFINITY, -0])).toBe('[null,null,0]');
  });

  it('survives a stringify and parse round trip unchanged', () => {
    const value = { chapters: { 'seymour-flux': { id: 'seymour-flux', cleared: true, bestTimeMs: 91_500.5, bestTurns: null } }, list: ['a', 'b\n"c"'], n: 1e21, f: 0.1 };
    expect(canonicalJson(JSON.parse(JSON.stringify(value)))).toBe(canonicalJson(value));
  });
});
