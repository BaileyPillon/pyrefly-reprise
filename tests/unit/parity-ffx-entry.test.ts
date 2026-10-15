/**
 * **Battle entry, the two kernels** (re-parity RC8, lane FFX-L; **FFX only**: FFX-2 has its own start-up, FFX2-G10).
 *
 * `research/re-ffx-battle-entry.md` is the spec; the game's own machine code was run in the harness (FFX.exe, Steam build 25501027):
 *
 * - the start-type roll (0x0078d090): 589,824 vectors, 0 mismatches. `tests/fixtures/parity/ffx/start_type.json` is a sample of 864 of
 *   them (every `x` the harness tried, with and without Initiative, the low byte of the draw from 0 to 255);
 * - the link rule of the monster load (0x00783680 with 0x00783990 / 0x00783b00) and the placement shuffle (0x007842f0): 20,000
 *   scenarios, 0 mismatches. `placement_shuffle.json` is the first 300 of them (monster words, the draws the game made with the raw
 *   value of each, and what it left in the eight slots), and the 28 real formation files below were run too.
 *
 * Three more layers sit on top: the real chapter formations (the streams the note lists), hand-worked cases for every corner of the
 * link rule, and an independent model of the draw order (written here from the note's wording, sharing no code with the kernel) run on
 * 1,000 generated formations.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { StartType, rollStartType } from '../../src/battle/ffx/kernel/rolls.ts';
import { MONSTER_SLOT_COUNT, linkMonsters, monsterFileId, placementShuffle } from '../../src/battle/ffx/kernel/placement-shuffle.ts';

const loadFixture = <T>(name: string): T =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/parity/ffx/${name}`, import.meta.url)), 'utf8')) as T;

// -------------------------------------------------------------------------------------------------- the start-type roll

interface StartTypeFixture {
  columns: string[];
  rows: Array<[number, number, number, number]>;
}

describe('the start-type roll (0x0078d090) on the emulator vectors', () => {
  const fx = loadFixture<StartTypeFixture>('start_type.json');

  it('replays all 864 sampled vectors: the answer for every x, draw and Initiative state', () => {
    expect(fx.columns).toEqual(['x', 'draw', 'anyInitiativeInBattle', 'startType']);
    expect(fx.rows.length).toBe(864);
    let ambush = 0;
    let preemptive = 0;
    let normal = 0;
    for (const [x, draw, init, want] of fx.rows) {
      let drawn = 0;
      const got = rollStartType(x, init === 1, () => (drawn++, draw));
      expect(got, `x ${x} draw ${draw} initiative ${init}`).toBe(want);
      expect(drawn, 'one draw, always').toBe(1);
      if (got === StartType.Ambush) ambush++;
      else if (got === StartType.Preemptive) preemptive++;
      else normal++;
    }
    // the sample holds all three answers (it is not a test of one branch)
    expect([ambush > 50, preemptive > 100, normal > 200]).toEqual([true, true, true]);
  });

  it('the odds the note gives over the 256 low bytes: 32 preemptive and 33 ambush; with Initiative 65 and none', () => {
    const count = (init: boolean): number[] => {
      const n = [0, 0, 0];
      for (let b = 0; b < 256; b++) n[rollStartType(0x20, init, () => b)]!++;
      return n;
    };
    expect(count(false)).toEqual([191, 32, 33]);
    expect(count(true)).toEqual([191, 65, 0]);
  });
});

// ------------------------------------------------------------------------------------------------ the placement shuffle

interface ShuffleFixture {
  rows: Array<{ words: number[]; parent: number[]; leader: number[]; place: number[]; draws: Array<[number, number]> }>;
}

describe('the link rule and the placement shuffle on the emulator vectors', () => {
  const fx = loadFixture<ShuffleFixture>('placement_shuffle.json');

  it('replays the 300 sampled scenarios: each draw on the stream the game used, and the slots as it left them', () => {
    expect(fx.rows.length).toBe(300);
    let linked = 0;
    let threeWay = 0;
    for (const [n, row] of fx.rows.entries()) {
      let cursor = 0;
      const result = placementShuffle(row.words, (stream, modulus) => {
        const rec = row.draws[cursor++];
        expect(rec, `scenario ${n}: the kernel draws more than the game did`).toBeDefined();
        expect(stream, `scenario ${n}, draw ${cursor}`).toBe(rec![0]);
        expect(modulus).toBeGreaterThanOrEqual(1);
        return rec![1]; // the raw 31-bit value the game's generator returned
      });
      expect(cursor, `scenario ${n}: every recorded draw is made`).toBe(row.draws.length);
      expect(result.parent, `scenario ${n} parents`).toEqual(row.parent);
      expect(result.leader.map(Number), `scenario ${n} leaders`).toEqual(row.leader);
      expect(result.place, `scenario ${n} stored positions`).toEqual(row.place);
      if (row.draws.length > 0) linked++;
      if (row.draws.length >= 6) threeWay++;
    }
    expect(linked).toBeGreaterThan(200);
    expect(threeWay).toBeGreaterThan(60);
  });

  it('the same scenarios with the draws already reduced to the modulus (what the engine passes) leave the same slots', () => {
    for (const [n, row] of fx.rows.entries()) {
      let cursor = 0;
      const result = placementShuffle(row.words, (stream, modulus) => {
        const rec = row.draws[cursor++]!;
        expect(stream).toBe(rec[0]);
        return rec[1] % modulus;
      });
      expect(result.parent, `scenario ${n}`).toEqual(row.parent);
      expect(result.place, `scenario ${n}`).toEqual(row.place);
    }
  });
});

// ----------------------------------------------------------------------------------- the real formations (the note's list)

/** FFX-G10 `logs/chapter-shuffle.txt`, typed in again: the 26 chapter formation files and the two neighbours the harness ran, with the streams it saw before the opening counters. */
const FORMATIONS: ReadonlyArray<readonly [string, readonly number[], readonly number[]]> = [
  ['bvyt09_10', [0x10f8, 0x111c], []],
  ['bvyt09_11', [0x10f8, 0x10fe], []],
  ['bvyt09_12', [0x10f8, 0x111f], []],
  ['dome06_00', [0x1082], []],
  ['hiku15_00', [0x1077, 0x1095, 0x10ff], []],
  ['kino02_00', [0x1075, 0x10a0, 0x10a1, 0x10a1], [30, 30, 30, 31]],
  ['kino03_00', [0x103c, 0x1018, 0x104f], []],
  ['kino03_10', [0x1075, 0x10a0, 0x10a1, 0x10a1], [30, 30, 30, 31]],
  ['lmyt01_05', [0x10fa, 0x1120, 0x110a], []],
  ['mcyt06_00', [0x108d, 0x107c, 0x108d, 0x107d], [28, 28, 28, 30]],
  ['mtgz02_00', [0x108e, 0x108f], []],
  ['nagi05_10', [0x10f9, 0x1120, 0x110a], []],
  ['sins03_00', [0x1083, 0x106a, 0x106a, 0x106a, 0x106a], [29, 29, 29, 29, 29, 30, 31, 32]],
  ['sins06_00', [0x1084, 0x10ae, 0x10ad], []],
  ['sins07_00', [0x10a3, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_01', [0x10a4, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_02', [0x10a5, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_03', [0x10a6, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_04', [0x10a7, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_05', [0x10a8, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_06', [0x10a9, 0x10ae, 0x10ad, 0x1074, 0x1112], []],
  ['sins07_07', [0x10b4, 0x10b3, 0x10b2, 0x10ae, 0x10ad, 0x1112], []],
  ['sins07_10', [0x10b0, 0x10ae, 0x10ad], []],
  ['ssbt00_00', [0x1088, 0x1095], []],
  ['ssbt01_00', [0x1089, 0x1095], []],
  ['ssbt02_00', [0x108b, 0x108a], []],
  ['ssbt03_00', [0x108c], []],
  ['stbv01_10', [0x107e, 0x107f], []],
];

/** A deterministic stand-in for the generator: a different 31-bit word for every call. */
function words31(): () => number {
  let state = 0x1234567;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state & 0x7fffffff;
  };
}

describe('the chapter formations: which spend draws before the opening counters, and on which streams', () => {
  it('28 formation files: exactly mcyt06_00, sins03_00, kino02_00 and kino03_10 draw, on the streams the note lists', () => {
    expect(FORMATIONS.length).toBe(28);
    const next = words31();
    for (const [name, words, streams] of FORMATIONS) {
      const seen: number[] = [];
      placementShuffle(words, (stream) => (seen.push(stream), next()));
      expect(seen, name).toEqual([...streams]);
    }
    expect(FORMATIONS.filter(([, , s]) => s.length > 0).map(([n]) => n)).toEqual(['kino02_00', 'kino03_10', 'mcyt06_00', 'sins03_00']);
  });
});

// ------------------------------------------------------------------------------------------- hand-worked corner cases

describe('the link rule and the shuffle, case by case (worked by hand from the note)', () => {
  const E = 0xffff;
  const record = (words: readonly number[], values: readonly number[]): { streams: number[]; moduli: number[]; r: ReturnType<typeof placementShuffle> } => {
    const streams: number[] = [];
    const moduli: number[] = [];
    let i = 0;
    const r = placementShuffle(words, (s, m) => (streams.push(s), moduli.push(m), values[i++] ?? 0));
    return { streams, moduli, r };
  };

  it('Seymour and two Guardians (words 108d 107c 108d 107d): slots 0 and 2 link; four draws, 28 28 28 30', () => {
    // the leader (slot 0, stream 28) draws twice: 6 & 3 = 2, then 5 & 3 + 8 = 9 -> the list [2, 9];
    // then slot 0 draws 3 % 2 = 1 -> takes 9; slot 2 (stream 30) draws 100 % 1 = 0 -> takes the 2.
    const { streams, moduli, r } = record([0x108d, 0x107c, 0x108d, 0x107d], [6, 5, 3, 100]);
    expect(streams).toEqual([28, 28, 28, 30]);
    expect(moduli).toEqual([4, 4, 2, 1]);
    expect(r.parent).toEqual([0x14, 0x15, 0x14, 0x17, 0x18, 0x19, 0x1a, 0x1b]);
    expect(r.leader).toEqual([true, true, false, true, true, true, true, true]);
    expect(r.place).toEqual([9, 0, 2, 0, 0, 0, 0, 0]);
  });

  it('three equal words: the FIRST is the leader of both others; 2n = 6 draws, three on the leader\'s stream then one for each member', () => {
    const { streams, r } = record([0x10a1, E, 0x10a1, E, 0x10a1], [1, 2, 3, 0, 0, 0]);
    expect(streams).toEqual([28, 28, 28, 28, 30, 32]);
    expect(r.parent).toEqual([0x14, 0x15, 0x14, 0x17, 0x14, 0x19, 0x1a, 0x1b]);
    // entries 1, 2+8, 3+16 -> [1, 10, 19]; slot 0 idx 0 -> 1; slot 2 idx 0 -> 10; slot 4 idx 0 -> 19
    expect(r.place).toEqual([1, 0, 10, 0, 19, 0, 0, 0]);
  });

  it('two linked groups draw in ascending leader order, each group completely before the next', () => {
    const { streams } = record([0x1001, 0x1002, 0x1001, 0x1002], []);
    expect(streams).toEqual([28, 28, 28, 30, 29, 29, 29, 31]);
  });

  it('a monster whose word has no file (class 2 or more, or a file id of 0) never links, and a later equal word cannot follow it', () => {
    expect(monsterFileId(0x106a)).toBe(0x6a);
    expect(monsterFileId(0x0006)).toBe(6);
    expect(monsterFileId(0x2007)).toBe(0);
    expect(monsterFileId(0x3009)).toBe(0);
    expect(monsterFileId(0x0000)).toBe(0);
    expect(monsterFileId(0x1000)).toBe(0);
    expect(monsterFileId(0xffff)).toBe(0);
    for (const words of [[0x2007, 0x2007], [0x0000, 0x0000], [0x1000, E, 0x1000], [0x3009, 0x3009, 0x3009]]) {
      expect(record(words, []).streams, JSON.stringify(words)).toEqual([]);
    }
  });

  it('a file the file system lacks skips the slot: nothing links to it, and the next equal word becomes a leader of its own', () => {
    const linked = linkMonsters([0x1005, 0x1005], (file) => file !== 5);
    expect(linked.leader).toEqual([true, true, true, true, true, true, true, true]);
    let calls = 0;
    placementShuffle([0x1005, 0x1005], () => (calls++, 0), (file) => file !== 5);
    expect(calls).toBe(0);
  });

  it('empty slots and short lists are ignored; an unlinked formation (and an empty one) draws nothing', () => {
    expect(record([], []).streams).toEqual([]);
    expect(record([E, E, E], []).streams).toEqual([]);
    expect(record([0x1001, 0x1002, 0x1003], []).streams).toEqual([]);
    expect(MONSTER_SLOT_COUNT).toBe(8);
  });

  it('the position takes `value & 3` plus 8 per draw, and the member picks use `value mod (entries left)`', () => {
    // n = 2, leader draws 7 (& 3 = 3) and 4 (& 3 = 0, +8 = 8) -> [3, 8]; the leader then draws 5 % 2 = 1 -> 8; the follower 9 % 1 -> 3.
    const { r } = record([0x1001, 0x1001], [7, 4, 5, 9]);
    expect(r.place.slice(0, 2)).toEqual([8, 3]);
  });
});

// ------------------------------------------------------------- an independent model of the draw order, on generated formations

/**
 * The note's section 3.3 as prose, written again as a table: group the slots by word, drop the words with no file, keep the
 * groups of two or more, each in ascending order of its first slot.
 */
function modelGroups(words: readonly number[]): number[][] {
  const groups = new Map<number, number[]>();
  words.forEach((w, slot) => {
    if (w === 0xffff) return;
    const cls = w >> 12;
    const file = w & 0xfff;
    if (cls > 1 || file === 0) return;
    const g = groups.get(w) ?? [];
    g.push(slot);
    groups.set(w, g);
  });
  return [...groups.values()].filter((g) => g.length >= 2).sort((a, b) => a[0]! - b[0]!);
}

/** A group of n draws n times on the first slot's stream (28 + slot), then once on each member's stream (28 + member slot), members in slot order. */
const modelStreams = (words: readonly number[]): number[] => modelGroups(words).flatMap((g) => [...g.map(() => 28 + g[0]!), ...g.map((slot) => 28 + slot)]);

describe('an independent model of the draw order', () => {
  it('1,000 generated formations (words with and without files, repeated words, empty slots): same streams in the same order, 2n draws per group', () => {
    const alphabet = [0x1001, 0x1002, 0x1003, 0x106a, 0x0007, 0x2007, 0x3009, 0x0000, 0x1000, 0xffff, 0xffff];
    const pick = words31();
    let withDraws = 0;
    let biggest = 0;
    for (let i = 0; i < 1000; i++) {
      const count = 1 + (pick() % 8);
      const words = Array.from({ length: count }, () => alphabet[pick() % alphabet.length]!);
      const want = modelStreams(words);
      const seen: number[] = [];
      const r = placementShuffle(words, (s, m) => (seen.push(s), pick() % m));
      expect(seen, JSON.stringify(words)).toEqual(want);
      // the parents are the model's first slots; every slot outside a group keeps itself and the position 0
      const inGroup = new Set<number>();
      for (const g of modelGroups(words)) {
        for (const slot of g) {
          inGroup.add(slot);
          expect(r.parent[slot], JSON.stringify(words)).toBe(0x14 + g[0]!);
          expect(r.leader[slot]).toBe(slot === g[0]);
        }
      }
      for (let slot = 0; slot < 8; slot++) {
        if (inGroup.has(slot)) continue;
        expect(r.parent[slot]).toBe(0x14 + slot);
        expect(r.leader[slot]).toBe(true);
        expect(r.place[slot]).toBe(0);
      }
      if (want.length > 0) withDraws++;
      biggest = Math.max(biggest, want.length);
    }
    expect(withDraws).toBeGreaterThan(300);
    expect(biggest).toBeGreaterThanOrEqual(8);
  });
});
