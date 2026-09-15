import { describe, expect, it } from 'vitest';
import {
  SeededRng,
  byteRoll,
  damageRng,
  makeRng,
  percentRoll,
} from '../../src/battle/common/rng.ts';

/** Draw `n` floats from a fresh generator at `seed`. */
function stream(seed: number, n: number): number[] {
  const rng = new SeededRng(seed);
  return Array.from({ length: n }, () => rng.next());
}

describe('SeededRng', () => {
  it('is deterministic for a given seed', () => {
    expect(stream(12345, 20)).toEqual(stream(12345, 20));
  });

  it('produces different streams for different seeds', () => {
    expect(stream(1, 10)).not.toEqual(stream(2, 10));
  });

  it('rewinds when re-seeded with the same value', () => {
    const rng = new SeededRng(999);
    const first = [rng.next(), rng.next(), rng.next()];
    rng.seed(999);
    expect([rng.next(), rng.next(), rng.next()]).toEqual(first);
  });

  it('reports the seed it is using', () => {
    const rng = new SeededRng(7);
    expect(rng.currentSeed).toBe(7);
    rng.seed(8);
    expect(rng.currentSeed).toBe(8);
  });

  it('normalises non-integer and negative seeds into uint32', () => {
    expect(new SeededRng(-1).currentSeed).toBe(0xffffffff);
    expect(new SeededRng(3.9).currentSeed).toBe(3);
    expect(new SeededRng(0).currentSeed).toBe(0);
  });

  it('keeps next() inside [0, 1)', () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 20000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('has a roughly uniform mean', () => {
    const rng = new SeededRng(2024);
    let sum = 0;
    const n = 50000;
    for (let i = 0; i < n; i++) sum += rng.next();
    expect(sum / n).toBeGreaterThan(0.49);
    expect(sum / n).toBeLessThan(0.51);
  });

  it('does not repeat immediately (no short cycle at small seeds)', () => {
    const seen = new Set(stream(0, 5000));
    expect(seen.size).toBe(5000);
  });
});

describe('SeededRng.int', () => {
  it('is inclusive on both ends', () => {
    const rng = new SeededRng(5);
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) seen.add(rng.int(0, 3));
    expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it('never leaves the range', () => {
    const rng = new SeededRng(11);
    for (let i = 0; i < 20000; i++) {
      const v = rng.int(-5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(5);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('handles a single-value range', () => {
    const rng = new SeededRng(3);
    expect(rng.int(4, 4)).toBe(4);
  });

  it('tolerates swapped bounds', () => {
    const rng = new SeededRng(3);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(9, 2);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('is roughly uniform across a byte range', () => {
    const rng = new SeededRng(777);
    const counts = new Array<number>(256).fill(0);
    const n = 256 * 400;
    for (let i = 0; i < n; i++) counts[rng.int(0, 255)]! += 1;
    const expected = n / 256;
    for (const c of counts) {
      expect(c).toBeGreaterThan(expected * 0.7);
      expect(c).toBeLessThan(expected * 1.3);
    }
  });
});

describe('SeededRng.pick / shuffle / weighted', () => {
  it('picks only from the array', () => {
    const rng = new SeededRng(1);
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 500; i++) expect(items).toContain(rng.pick(items));
  });

  it('throws on an empty array', () => {
    expect(() => new SeededRng(1).pick([])).toThrow(/empty/);
  });

  it('shuffles without mutating the input and keeps every element', () => {
    const rng = new SeededRng(31);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('shuffles deterministically', () => {
    expect(new SeededRng(31).shuffle([1, 2, 3, 4, 5])).toEqual(
      new SeededRng(31).shuffle([1, 2, 3, 4, 5]),
    );
  });

  it('respects weights', () => {
    const rng = new SeededRng(64);
    let a = 0;
    for (let i = 0; i < 10000; i++) if (rng.weighted(['a', 'b'], [9, 1]) === 'a') a += 1;
    expect(a / 10000).toBeGreaterThan(0.85);
    expect(a / 10000).toBeLessThan(0.95);
  });

  it('never returns a zero-weight entry', () => {
    const rng = new SeededRng(65);
    for (let i = 0; i < 2000; i++) expect(rng.weighted(['a', 'b'], [1, 0])).toBe('a');
  });

  it('rejects mismatched or all-zero weights', () => {
    const rng = new SeededRng(1);
    expect(() => rng.weighted(['a', 'b'], [1])).toThrow(/length/);
    expect(() => rng.weighted(['a', 'b'], [0, 0])).toThrow(/zero/);
  });
});

describe('state snapshots', () => {
  it('restores a saved state exactly', () => {
    const rng = new SeededRng(500);
    rng.next();
    const snapshot = rng.saveState();
    const after = [rng.next(), rng.next()];
    rng.restoreState(snapshot);
    expect([rng.next(), rng.next()]).toEqual(after);
  });
});

describe('FFX roll helpers', () => {
  it('damageRng stays in 0..31 and covers both ends', () => {
    const rng = makeRng(2);
    const seen = new Set<number>();
    for (let i = 0; i < 20000; i++) {
      const v = damageRng(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(31);
      seen.add(v);
    }
    expect(seen.size).toBe(32);
  });

  it('damageRng 16 is exactly x1.0 in the variance term', () => {
    // dmg * (roll + 240) // 256 with roll = 16 -> dmg * 256 // 256.
    expect((16 + 240) / 256).toBe(1);
  });

  it('damageRng bounds match the researched x0.9375..x1.0586 band', () => {
    expect((0 + 240) / 256).toBeCloseTo(0.9375, 6);
    expect((31 + 240) / 256).toBeCloseTo(1.05859375, 6);
  });

  it('percentRoll stays in 0..100 and covers both ends', () => {
    const rng = makeRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 40000; i++) {
      const v = percentRoll(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
      seen.add(v);
    }
    expect(seen.size).toBe(101);
  });

  it('byteRoll stays in 0..255 and gives ~74.6% escape success', () => {
    const rng = makeRng(4);
    let success = 0;
    const n = 40000;
    for (let i = 0; i < n; i++) {
      const v = byteRoll(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
      if (v < 191) success += 1;
    }
    // 191/256 = 0.74609
    expect(success / n).toBeGreaterThan(0.73);
    expect(success / n).toBeLessThan(0.76);
  });
});
