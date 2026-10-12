/**
 * The streams plumbing both engines draw through (`src/battle/common/streams.ts`), checked against restatements of the two games'
 * generators and seeding routines written out again here, in BigInt, from `research/re-ffx-rng-hit.md` sections 1 and 3 and
 * `research/re-ffx2-hit-status.md` section 1 (the constant tables are the kernels', which `parity-ffx-rng.test.ts` and
 * `parity-ffx2-rng.test.ts` prove against the exes' own code on thousands of emulator vectors; the ARITHMETIC is the part
 * restated).
 *
 * Game case: **both** (plumbing); each game's seeding and generator is its own.
 */

import { describe, expect, it } from 'vitest';
import { AUX_STREAM, pickDrawn, sampleSnapshot } from '../../src/battle/common/streams.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { makeFfxRng, FFX_STREAM_GAME } from '../../src/battle/ffx/adapt/streams.ts';
import { makeFfx2Rng, FFX2_STREAM_GAME } from '../../src/battle/ffx2/adapt/streams.ts';
import { RNG_MULT, RNG_XOR16 } from '../../src/battle/ffx/kernel/rng.ts';
import { FFX2_RNG_ADD, FFX2_RNG_MULT } from '../../src/battle/ffx2/kernel/rng.ts';

const M32 = (1n << 32n) - 1n;
const u32 = (x: bigint): bigint => x & M32;
const asInt32 = (x: bigint): bigint => (u32(x) >= 1n << 31n ? u32(x) - (1n << 32n) : u32(x));
/** `(x as int32 >> 16) + (x << 16)`, modulo 2^32: the step shape both games share. */
const mix = (x: bigint): bigint => u32((asInt32(x) >> 16n) + (u32(x) << 16n));

/** FFX's generator, restated: the new state of stream `s`. */
function ffxNext(s: number, state: bigint): bigint {
  return mix(u32(BigInt(RNG_MULT[s]!) * state) ^ BigInt(RNG_XOR16[s]!));
}
/** FFX-2's generator, restated: `n = mult * state * 5 + add + 1`. */
function ffx2Next(s: number, state: bigint): bigint {
  return mix(u32(BigInt(FFX2_RNG_MULT[s]!) * state * 5n + BigInt(FFX2_RNG_ADD[s]!) + 1n));
}
/** The seeding LCG both games use: `x * 0x5d588b65 + 0x3c35`, then the same mix. */
const lcg = (x: bigint): bigint => mix(u32(x * 0x5d588b65n + 0x3c35n));

/** FFX's New Game seeding for the seed product `k` (section 3), restated. */
function ffxSeed(k: number): bigint[] {
  let x = u32(BigInt(k >>> 0) * 0x420c56d7n + 0x2e0an);
  x = lcg(x);
  const out: bigint[] = [];
  for (let i = 0; i < 68; i++) {
    x = lcg(x);
    out.push(x & 0x7fffffffn);
  }
  return out;
}
/** FFX-2's battle-start seeding for the seed product `p` (section 1.2), restated. */
function ffx2Seed(p: number): bigint[] {
  let x = mix(u32(0x8e81d427n - u32(BigInt(p >>> 0) * 0x4913002dn)));
  const out: bigint[] = [];
  for (let i = 0; i < 68; i++) {
    x = lcg(x);
    out.push(x & 0x7fffffffn);
  }
  return out;
}

const SEEDS = [0, 1, 2, 7, 12345, 0x7fffffff, 0x80000001, 0xdeadbeef];

describe('a run seed is the game\'s seed product, through the game\'s own seeding routine', () => {
  it('FFX: the worked example of the note (k = 1: stream 0 starts at 1520130368, stream 1 at 846530240)', () => {
    const rng = makeFfxRng(1);
    expect(rng.states[0]).toBe(1520130368);
    expect(rng.states[1]).toBe(846530240);
  });

  it('FFX: every state equals the restated routine, for several seeds', () => {
    for (const seed of SEEDS) {
      const want = ffxSeed(seed);
      const got = makeFfxRng(seed).states;
      for (let s = 0; s < 68; s++) expect(BigInt(got[s]!), `seed ${seed} stream ${s}`).toBe(want[s]);
    }
  });

  it('FFX-2: every state equals the restated routine, for several seeds', () => {
    for (const seed of SEEDS) {
      const want = ffx2Seed(seed);
      const got = makeFfx2Rng(seed).states;
      for (let s = 0; s < 68; s++) expect(BigInt(got[s]!), `seed ${seed} stream ${s}`).toBe(want[s]);
    }
  });

  it('every seeded state is below 2^31, as the games\' own are, and no two small seeds share a state set', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      for (const rng of [makeFfxRng(seed), makeFfx2Rng(seed)]) {
        for (const w of rng.states) expect(w).toBeLessThan(0x80000000);
      }
      seen.add(`a${makeFfxRng(seed).states.join(',')}`);
      seen.add(`b${makeFfx2Rng(seed).states.join(',')}`);
    }
    expect(seen.size).toBe(120);
  });

  it('the two games seed alike (FFX-2 writes in closed form what FFX does with a discarded step) but draw differently: neither generator stands in for the other', () => {
    for (const seed of [0, 1, 5, 99]) {
      expect(Array.from(makeFfx2Rng(seed).states)).toEqual(Array.from(makeFfxRng(seed).states));
      expect(makeFfx2Rng(seed).draw(20)).not.toBe(makeFfxRng(seed).draw(20));
    }
  });
});

describe('one draw of stream s is the game\'s generator step on that stream and no other', () => {
  for (const [name, make, next, game] of [
    ['FFX', makeFfxRng, ffxNext, FFX_STREAM_GAME],
    ['FFX-2', makeFfx2Rng, ffx2Next, FFX2_STREAM_GAME],
  ] as const) {
    it(`${name}: 200 draws on each of 8 streams equal the restated generator, in any interleaving`, () => {
      const rng = make(31337);
      const mirror = Array.from(rng.states, (w) => BigInt(w));
      const streams = [0, 2, 4, 5, 10, 20, 27, 44];
      let pick = 0;
      for (let i = 0; i < 1600; i++) {
        pick = (pick * 5 + 3) % 8; // a fixed, scrambled interleaving
        const s = streams[pick]!;
        mirror[s] = next(s, mirror[s]!);
        expect(BigInt(rng.draw(s)), `${name} draw ${i} on stream ${s}`).toBe(mirror[s]! & 0x7fffffffn);
      }
      // The streams never touched did not move.
      const fresh = make(31337);
      for (let s = 0; s < 68; s++) if (!streams.includes(s)) expect(rng.states[s]).toBe(fresh.states[s]);
      expect(game.count).toBe(68);
    });

    it(`${name}: on(s).int(0, n - 1) is the value modulo n of one draw, and int(lo, hi) is lo + value % span`, () => {
      const a = make(99);
      const b = make(99);
      for (let i = 0; i < 300; i++) {
        const s = i % 68;
        const raw = b.draw(s);
        const n = 2 + (i % 130);
        expect(a.on(s).int(0, n - 1)).toBe(raw % n);
        const raw2 = b.draw(s);
        expect(a.on(s).int(5, 9)).toBe(5 + (raw2 % 5));
      }
    });

    it(`${name}: a power-of-two modulus is the mask the games use (& 31, & 0xff, & 0xffff)`, () => {
      const a = make(4);
      const b = make(4);
      for (let i = 0; i < 200; i++) {
        const raw = b.draw(20);
        expect(a.on(20).int(0, 31)).toBe(raw & 31);
        const raw2 = b.draw(20);
        expect(a.on(20).int(0, 255)).toBe(raw2 & 0xff);
        const raw3 = b.draw(20);
        expect(a.on(20).int(0, 0xffff)).toBe(raw3 & 0xffff);
      }
    });

    it(`${name}: the engine-side stream cannot move a game stream, and a game stream cannot move it`, () => {
      const a = make(8);
      const b = make(8);
      for (let i = 0; i < 50; i++) a.aux.int(0, 99);
      for (let s = 0; s < 68; s++) expect(a.states[s]).toBe(b.states[s]);
      const c = make(8);
      const d = make(8);
      for (let i = 0; i < 50; i++) c.aux.int(0, 99);
      for (let i = 0; i < 50; i++) d.aux.int(0, 99);
      for (let i = 0; i < 20; i++) d.draw(i);
      expect(d.aux.int(0, 1_000_000)).toBe(c.aux.int(0, 1_000_000));
    });

    it(`${name}: the tap sees every draw with its stream, the engine-side ones as AUX_STREAM`, () => {
      const rng = make(2);
      const seen: Array<[number, number]> = [];
      rng.tap = (s, v) => seen.push([s, v]);
      const v1 = rng.on(4).int(0, 9);
      rng.on(2).int(0, 0xffff);
      rng.aux.int(0, 9);
      expect(seen.map(([s]) => s)).toEqual([4, 2, AUX_STREAM]);
      expect(v1).toBe(seen[0]![1] % 10);
    });
  }
});

describe('snapshots', () => {
  it('a snapshot restores every stream and the engine-side one; a fork starts where it was told', () => {
    for (const make of [makeFfxRng, makeFfx2Rng]) {
      const a = make(77);
      for (let i = 0; i < 40; i++) {
        a.draw(i % 68);
        a.aux.int(0, 9);
      }
      const snap = a.saveState();
      expect(Array.isArray(snap)).toBe(true);
      expect((snap as readonly number[]).length).toBe(69);
      const b = a.fork(123, snap);
      for (let i = 0; i < 100; i++) {
        expect(b.draw(i % 68)).toBe(a.draw(i % 68));
        expect(b.aux.int(0, 99)).toBe(a.aux.int(0, 99));
      }
    }
  });

  it('a fork seeded differently and not restored is another battle', () => {
    const a = makeFfxRng(1);
    const f = a.fork(2);
    expect(f.draw(20)).not.toBe(makeFfxRng(1).draw(20));
    expect(f.currentSeed).toBe(2);
  });

  it('a one-number snapshot is refused by a game generator, and an array by a one-stream generator', () => {
    expect(() => makeFfxRng(1).restoreState(5)).toThrow(TypeError);
    expect(() => new SeededRng(1).restoreState([1, 2, 3])).toThrow(TypeError);
  });

  it('seed() re-seeds all of it: the same draws come back', () => {
    const a = makeFfx2Rng(5);
    const first = [a.draw(3), a.draw(20), a.aux.int(0, 99)];
    a.draw(3);
    a.seed(5);
    expect([a.draw(3), a.draw(20), a.aux.int(0, 99)]).toEqual(first);
  });

  it('sampleSnapshot: sample 0 is the position itself; the others move every stream, deterministically', () => {
    const snap = makeFfxRng(3).saveState() as readonly number[];
    expect(sampleSnapshot(snap, 0)).toBe(snap);
    const s1 = sampleSnapshot(snap, 1) as readonly number[];
    const s1b = sampleSnapshot(snap, 1) as readonly number[];
    const s2 = sampleSnapshot(snap, 2) as readonly number[];
    expect(s1).toEqual(s1b);
    expect(s1).toHaveLength(69);
    for (let j = 0; j < 69; j++) {
      expect(s1[j]).not.toBe(snap[j]);
      expect(s2[j]).not.toBe(s1[j]);
    }
    expect(sampleSnapshot(5, 0)).toBe(5);
    expect(sampleSnapshot(5, 1)).not.toBe(5);
  });
});

describe('a one-stream generator is every stream at once', () => {
  it('on(s) is itself, aux is itself, and fork keeps the kind', () => {
    const r = new SeededRng(4);
    expect(r.on(5)).toBe(r);
    expect(r.on(60)).toBe(r);
    expect(r.aux).toBe(r);
    expect(r.fork(9)).toBeInstanceOf(SeededRng);
    r.int(0, 9);
    const f = r.fork(9, r.saveState());
    expect(f.int(0, 99)).toBe(r.int(0, 99));
  });
});

describe('the game\'s target picker', () => {
  it('draws nothing under two candidates and indexes value % count otherwise', () => {
    const rng = makeFfxRng(6);
    const mirror = makeFfxRng(6);
    const taps: number[] = [];
    rng.tap = (s) => taps.push(s);
    expect(pickDrawn(rng.on(4), [])).toBeUndefined();
    expect(pickDrawn(rng.on(4), ['only'])).toBe('only');
    expect(taps).toEqual([]);
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 50; i++) expect(pickDrawn(rng.on(4), items)).toBe(items[mirror.draw(4) % 3]);
    expect(taps).toHaveLength(50);
    expect(taps.every((s) => s === 4)).toBe(true);
  });
});
