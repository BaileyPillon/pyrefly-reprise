/**
 * Parity tests for Rikku's Mix chart and resolver (`src/battle/ffx/kernel/mix-table.ts`, `mix.ts`; re-parity RC7, lane FFX-H).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the Mix resolver 0x007b0520 and the install's combination
 * table (112 x 112 cells); the private note `FFX-G05` sections 3.1, 3.2 and 4.1 and appendix A. The first blocks check the chart's shape and
 * statistics against the note's (82 groups, 64 results, 6,328 pairs and how many pairs make each result). The next replays every ordered pair of
 * the 112 items against what the real resolver wrote (`tests/fixtures/parity/ffx/mix_resolver.json`, `table`), then 300 whole-record runs of the real
 * machine code (the target picker, facing and menu rebuilds replaced by hooks, as in the note). A chart kept in groups must give back all 6,328 cells.
 */

import { describe, expect, it } from 'vitest';
import {
  MIX_FIRST_RESULT,
  MIX_GROUP_OF_ITEM,
  MIX_GROUP_ROWS,
  MIX_ITEM_COUNT,
  MIX_ITEM_IDS,
  MIX_RESULT_COUNT,
  MIX_RESULT_IDS,
  MIX_RESULT_TARGET_WORD,
} from '../../src/battle/ffx/kernel/mix-table.ts';
import { mixCommandIndex, mixResolve, mixResultCommand } from '../../src/battle/ffx/kernel/mix.ts';
import { MIX_RECIPES } from '../../src/data/ffx/mixes/recipes.ts';
import { type SparseSlots, bagOfSlots, slotsOfBag } from './helpers/ffxBagFixture.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { newBag } from '../../src/battle/ffx/kernel/bag.ts';

/** `Item pairs (of 6,328)` per result, 0x308b first (FFX-G05 section 4.1; the table of `results-table.md`). */
const PAIRS_PER_RESULT = [
  6, 10, 64, 110, 376, 242, 102, 225, 200, 363, 48, 43, 62, 35, 28, 49, 42, 62, 39, 24, 48, 43, 62, 39, 24, 48, 46, 62, 39, 24, 69, 9,
  73, 60, 104, 97, 41, 87, 16, 357, 648, 288, 24, 82, 41, 15, 62, 43, 200, 35, 3, 100, 99, 25, 148, 197, 3, 155, 170, 53, 93, 232, 48, 86,
];

const idx = (id: string): number => {
  const n = MIX_ITEM_IDS.indexOf(id);
  if (n < 0) throw new Error(`no item ${id}`);
  return n;
};
const item = (id: string): number => 0x2000 + idx(id);
const resultId = (a: string, b: string): string => MIX_RESULT_IDS[(mixResultCommand(item(a), item(b)) - MIX_FIRST_RESULT)] as string;

describe('the chart\'s shape', () => {
  it('has 112 items, 82 groups and 64 results, each result and item id distinct', () => {
    expect(MIX_ITEM_IDS).toHaveLength(MIX_ITEM_COUNT);
    expect(new Set(MIX_ITEM_IDS).size).toBe(112);
    expect(MIX_GROUP_OF_ITEM).toHaveLength(112);
    expect(new Set(MIX_GROUP_OF_ITEM).size).toBe(82);
    expect(MIX_GROUP_ROWS).toHaveLength(82);
    MIX_GROUP_ROWS.forEach((row, g) => expect(row, `row ${g}`).toHaveLength(g + 1));
    expect(MIX_RESULT_IDS).toHaveLength(MIX_RESULT_COUNT);
    expect(new Set(MIX_RESULT_IDS).size).toBe(64);
    expect(MIX_RESULT_TARGET_WORD).toHaveLength(64);
    // every group number 0..81 is used, numbered by first member
    const seen: number[] = [];
    for (const g of MIX_GROUP_OF_ITEM) if (!seen.includes(g)) seen.push(g);
    expect(seen).toEqual(Array.from({ length: 82 }, (_, i) => i));
  });

  it('makes every one of the 64 results, and each is a result id of our ability catalog\'s family', () => {
    const made = new Set<number>();
    for (const row of MIX_GROUP_ROWS) for (const r of row) made.add(r);
    expect([...made].sort((a, b) => a - b)).toEqual(Array.from({ length: 64 }, (_, i) => i));
    for (const id of MIX_RESULT_IDS) expect(id, id).toMatch(/^mix-[a-z0-9-]+$/);
  });

  it('puts the Mix results in the game\'s target classes: 33 opposing-side group results, 24 own-side group, 7 own-side single', () => {
    const side = (w: number): string => ((w >> 1) & 1 ? 'opposing' : 'own');
    const kind = (w: number): number => (w >> 2) & 3;
    const opposing = MIX_RESULT_TARGET_WORD.filter((w) => side(w) === 'opposing');
    const own = MIX_RESULT_TARGET_WORD.filter((w) => side(w) === 'own');
    expect(opposing).toHaveLength(33);
    expect(opposing.every((w) => kind(w) === 1)).toBe(true);
    expect(own.filter((w) => kind(w) === 1)).toHaveLength(24);
    expect(own.filter((w) => kind(w) === 0)).toHaveLength(7);
    // only Mega Phoenix, Final Phoenix and Final Elixir may target the KO'd
    const ko = MIX_RESULT_IDS.filter((_, i) => ((MIX_RESULT_TARGET_WORD[i] as number) & 0x40) !== 0);
    expect(ko).toEqual(['mix-mega-phoenix', 'mix-final-phoenix', 'mix-final-elixir']);
  });
});

describe('the chart\'s cells', () => {
  it('gives back every one of the 6,328 pairs: the number of pairs per result is the note\'s, and all are in 0x308b to 0x30ca', () => {
    const counts = new Array<number>(64).fill(0);
    let pairs = 0;
    for (let a = 0; a < 112; a++) {
      for (let b = 0; b <= a; b++) {
        const cmd = mixResultCommand(0x2000 + a, 0x2000 + b);
        const n = mixCommandIndex(cmd);
        expect(n, `pair ${a},${b}`).toBeDefined();
        counts[n as number] = (counts[n as number] as number) + 1;
        pairs++;
      }
    }
    expect(pairs).toBe(6328);
    expect(counts).toEqual(PAIRS_PER_RESULT);
  });

  it('is symmetric: A with B makes what B with A makes', () => {
    for (let a = 0; a < 112; a++) {
      for (let b = 0; b < 112; b++) expect(mixResultCommand(0x2000 + a, 0x2000 + b)).toBe(mixResultCommand(0x2000 + b, 0x2000 + a));
    }
  });

  it('equals what the real resolver wrote for all 12,544 ordered pairs of the 112 items', () => {
    const fx = loadFfxParityFixture('mix_resolver') as unknown as { table: number[][] } | null;
    expect(fx).not.toBeNull();
    const table = fx!.table;
    expect(table).toHaveLength(112);
    for (let a = 0; a < 112; a++) {
      expect(table[a]).toHaveLength(112);
      for (let b = 0; b < 112; b++) expect(mixResultCommand(0x2000 + a, 0x2000 + b), `${a},${b}`).toBe((table[a] as number[])[b]);
    }
  });

  it('keeps the 43 recipes the data layer already shipped: each pair makes the ability it names, cell by cell', () => {
    const entries = Object.entries(MIX_RECIPES);
    expect(entries).toHaveLength(43);
    for (const [key, ability] of entries) {
      const [a, b] = key.split('|') as [string, string];
      expect(resultId(a, b), key).toBe(ability);
    }
  });

  it('the examples the note gives: Potion twice is Ultra Potion, Hi-Potion twice is Vitality, a Phoenix Down twice is Mega Phoenix', () => {
    expect(resultId('potion', 'potion')).toBe('mix-ultra-potion');
    expect(resultId('hi-potion', 'hi-potion')).toBe('mix-vitality');
    expect(resultId('phoenix-down', 'phoenix-down')).toBe('mix-mega-phoenix');
    // any two items make something: a Map twice is a Potato Masher, a Fire Gem with a Shining Gem a Cluster Bomb
    expect(resultId('map', 'map')).toBe('mix-potato-masher');
    expect(resultId('fire-gem', 'shining-gem')).toBe('mix-cluster-bomb');
    // items of one group behave alike: Antidote, Soft, Eye Drops and Echo Screen
    expect(resultId('soft', 'power-sphere')).toBe(resultId('antidote', 'power-sphere'));
  });

  it('reads an id no item has the way the exe reads its table: a row past 111 falls to row 0 and the column index runs on through the words of the table', () => {
    // index 112 has no row: the lookup reads word 0 of the table (row 0, column 0 = Potion with Potion); index 4095 reads word 4095 = row 36, column 63,
    // which is above the diagonal and so empty
    expect(mixResultCommand(0x2070, 0x2000)).toBe(0x30ac);
    expect(mixResultCommand(0x2fff, 0x2fff)).toBe(0);
    // word 113 is row 1, column 1 (Hi-Potion with Hi-Potion = Vitality)
    expect(mixResultCommand(0x2071, 0x2071)).toBe(0x30bd);
  });
});

describe('the resolver (0x007b0520)', () => {
  const record = (...fields: number[]): { slots: number; fields: number[] } => ({ slots: Math.ceil(fields.length / 2), fields });
  const run = (
    rec: { slots: number; fields: number[] },
    stock: Array<[number, number]>,
    mask = 1 << 4,
    flags: { loading?: boolean; resolved?: boolean; animating?: boolean } = {},
  ): { out: ReturnType<typeof mixResolve>; bag: ReturnType<typeof newBag>; shared: number[]; picks: number[] } => {
    const bag = newBag();
    stock.forEach(([id, count], slot) => {
      bag.ids[slot] = id;
      bag.counts[slot] = count;
    });
    const shared = new Array<number>(16).fill(0);
    const picks: number[] = [];
    const out = mixResolve(
      { loading: flags.loading ?? false, resolved: flags.resolved ?? false, animating: flags.animating ?? false, user: 3, ...rec, bag, shared },
      (cmd) => {
        picks.push(cmd);
        return mask;
      },
    );
    return { out, bag, shared, picks };
  };

  it('two ingredients: one of each is deducted, the result is the chart cell, the record becomes one slot, and the result is learned (word 2 to 6)', () => {
    const potion = item('potion');
    const r = run(record(0x311e, potion, item('potion'), 0xff), [[potion, 5]]);
    // Potion twice from a stack of 5: both deductions come out of the one stack
    expect(r.bag.counts[0]).toBe(3);
    expect(r.out).toMatchObject({ ret: 0, slots: 1, field0: 0x30ac, field1: 0xff, targetMask: 1 << 4, resolved: true, ingredients: 2, learned: true });
    expect(r.picks).toEqual([0x30ac]);
    // Ultra Potion is 0x30ac: (0x30ac - 0x60) and 0xfff = 0x4c; word 4, bit 12
    expect(r.shared[4]).toBe(1 << 12);
  });

  it('with a single copy of a doubled item the second deduction fails silently and the Mix still resolves', () => {
    const potion = item('potion');
    const r = run(record(potion, potion), [[potion, 1]]);
    expect(r.bag.counts[0]).toBe(0);
    expect(r.out.field0).toBe(0x30ac);
    expect(r.out.ret).toBe(0);
  });

  it('a Mix whose pick finds nobody still costs both ingredients, returns 1 and records nothing as discovered', () => {
    const a = item('fire-gem');
    const b = item('ice-gem');
    const r = run(record(a, b), [[a, 3], [b, 1]], 0);
    expect(r.bag.counts.slice(0, 2)).toEqual([2, 0]);
    expect(r.out).toMatchObject({ ret: 1, field0: 0x308b, targetMask: 0, learned: false });
    expect(r.shared.every((w) => w === 0)).toBe(true);
  });

  it('one ingredient turns the record into a plain use of that item (one deduction, nothing learned); none leaves 0xff', () => {
    const potion = item('potion');
    const one = run(record(0x311e, potion), [[potion, 2]]);
    expect(one.bag.counts[0]).toBe(1);
    expect(one.out).toMatchObject({ field0: potion, ingredients: 1, learned: false, ret: 0 });
    const none = run(record(0x311e, 0xff), [[potion, 2]]);
    expect(none.out).toMatchObject({ field0: 0xff, ingredients: 0, learned: false });
    expect(none.bag.counts[0]).toBe(2);
  });

  it('a single ingredient is never learned, even one whose number looks like a Mix result and a target was found', () => {
    // 0x3070 is no item, but as a lone "ingredient" it is the result: the learn step needs TWO ingredients
    const r = run(record(0x311e, 0x3070), [], 1 << 4);
    expect(r.out).toMatchObject({ ret: 0, field0: 0x3070, ingredients: 1, learned: false });
    expect(r.shared.every((w) => w === 0)).toBe(true);
  });

  it('only the first two ingredients are used; the Mix, Item and empty fields are not ingredients', () => {
    const [a, b, c] = [item('potion'), item('hi-potion'), item('x-potion')];
    const r = run(record(0x311e, 0xff, 0x3001, a, b, c), [[a, 4], [b, 4], [c, 4]]);
    expect(r.bag.counts.slice(0, 3)).toEqual([3, 3, 4]);
    expect(r.out.ingredients).toBe(2);
  });

  it('waits while the table is loading, and once resolved returns 0 when the animation is clear and 1 while it runs, touching nothing', () => {
    const potion = item('potion');
    const wait = run(record(potion, potion), [[potion, 5]], 1, { loading: true });
    expect(wait.out).toMatchObject({ ret: 1, pick: undefined });
    expect(wait.bag.counts[0]).toBe(5);
    expect(run(record(potion, potion), [[potion, 5]], 1, { resolved: true }).out.ret).toBe(0);
    expect(run(record(potion, potion), [[potion, 5]], 1, { resolved: true, animating: true }).out.ret).toBe(1);
  });

  it('replays 300 whole-record runs of the real function (loading and resolved guards, two, one and no ingredients, no target, learn bits)', () => {
    const fx = loadFfxParityFixture('mix_resolver');
    expect(fx).not.toBeNull();
    expect(fx!.vectors.length).toBe(300);
    for (const v of fx!.vectors) {
      const i = v.in as {
        loading: number; resolved: number; animating: number; user: number; slots: number; fields: number[]; mask: number;
        bag: SparseSlots; obtained: number[]; lost: number[]; shared: number[];
      };
      const o = v.out as {
        ret: number; slots: number; field0: number; field1: number; targetMask: number; resolved: number; bag: SparseSlots;
        obtained: number[]; lost: number[]; shared: number[]; learned: boolean; picks: number[][]; itemRefreshes: number;
      };
      const bag = bagOfSlots(i.bag, i.obtained, i.lost);
      const shared = i.shared.slice();
      const asked: number[] = [];
      const out = mixResolve(
        { loading: i.loading !== 0, resolved: i.resolved !== 0, animating: i.animating !== 0, user: i.user, slots: i.slots, fields: i.fields, bag, shared },
        (cmd) => {
          asked.push(cmd);
          return i.mask;
        },
      );
      const why = `vector ${v.id} (${v.class}, ${i.slots} slots)`;
      expect(out.ret, why).toBe(o.ret);
      expect(out.slots, why).toBe(o.slots);
      expect(out.resolved ? 1 : 0, why).toBe(o.resolved);
      expect(slotsOfBag(bag), why).toEqual(o.bag);
      expect(bag.obtained, why).toEqual(o.obtained);
      expect(bag.lost, why).toEqual(o.lost);
      expect(shared, why).toEqual(o.shared);
      expect(out.learned, why).toBe(o.learned);
      // the picker: called once, after the ingredients, with the result command; the game passes the user, the command, -1 and 1
      expect(asked.length, why).toBe(o.picks.length);
      if (o.picks.length > 0) {
        const call = o.picks[0] as number[];
        expect(asked[0], why).toBe(call[1]);
        expect(out.pick, why).toEqual({ user: call[0], command: call[1] });
        expect([call[2], call[3]], why).toEqual([0xffffffff, 1]);
        expect(out.field0, why).toBe(o.field0);
        expect(out.field1, why).toBe(o.field1);
        expect(out.targetMask, why).toBe(o.targetMask);
      } else {
        expect(out.pick, why).toBeUndefined();
      }
    }
  });
});
