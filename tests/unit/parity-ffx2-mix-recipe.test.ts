/**
 * The FFX-2 Mix recipe kernel (re-parity RC9, lane X2-G; **FFX-2 only**): `kernel/mix-recipe.ts` is the game's recipe function (`FFX-2.exe` 0x0075A470), proved here three ways.
 *
 * 1. **Against the game's own function.** The fixture `tests/fixtures/parity/ffx2/mix_recipe.json` holds what the real machine code answered in the harness (checked note
 *    FFX2-G06 section 3.8: 5,009 vectors, 0 mismatches, 0 draws): the note's first 400 vectors, the whole 68 x 68 table of ordered pairs, and the 385 out-of-range ids (the
 *    note's oracle, which the real function matched on every one). The kernel's three tables are the exe's tables, read back from the fixture.
 * 2. **Against facts the note states about the table**: the pair counts, the 496 order-dependent unordered pairs, the 53 distinct results, the worked examples.
 * 3. **Against an independent oracle**: the wiki's Priority and Type algorithm, restated from `research/ffx2-combat-core.md` 3.11 in `helpers/ffx2MixWiki.ts` (it imports nothing
 *    from the kernel). The note measured it equal to the game on 4,622 of 4,624 ordered pairs, the two misses being the Hero Drink first with the Poison Fang or the Candle of Life.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MIX_BLEND,
  MIX_ITEM_COUNT,
  MIX_ITEM_ROWS,
  MIX_NO_BLEND,
  MIX_RESULT_COMMANDS,
  MIX_RESULT_WORDS,
  mixClassLevel,
  mixRecipe,
  mixRowOf,
} from '../../src/battle/ffx2/kernel/mix-recipe.ts';
import { WIKI_ROWS, WIKI_TYPE_CLASS, wikiAgreement } from './helpers/ffx2MixWiki.ts';

interface Fixture {
  items: number[];
  classLevel: number[][];
  blend: number[][];
  results: number[];
  resultByPair: Record<string, number[]>;
  vectors: number[][];
  outOfRange: number[][];
  facts: { orderedPairs: number; viaMatrix: number; ties: number; byLevel: number; asymmetricUnorderedPairs: number; unorderedPairs: number; distinctResults: number };
}

const FIXTURE = JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/parity/ffx2/mix_recipe.json', import.meta.url)), 'utf8')) as Fixture;
const ITEM = (row: number): number => 0x2000 + row;
const rowOfName = (name: string): number => WIKI_ROWS.findIndex((i) => i.name === name);
const hex = (n: number): string => `0x${n.toString(16)}`;

describe('the kernel holds the exe\'s tables', () => {
  it('68 item rows, an 18 x 18 blend matrix and the result words are the fixture\'s, which is what the exe holds', () => {
    expect(MIX_ITEM_COUNT).toBe(68);
    expect(MIX_ITEM_ROWS).toHaveLength(68);
    expect(MIX_ITEM_ROWS.map((r) => [...r])).toEqual(FIXTURE.classLevel);
    expect(MIX_BLEND.map((r) => [...r])).toEqual(FIXTURE.blend);
    expect(MIX_RESULT_WORDS).toHaveLength(93);
    expect([...MIX_RESULT_WORDS]).toEqual(FIXTURE.results);
    expect(FIXTURE.items).toEqual(Array.from({ length: 68 }, (_, i) => ITEM(i)));
  });

  it('every class is 0 to 17 and every level 1 to 4; every blend byte is a result row 0 to 22 or 99; every used result word is one of the 53 rows', () => {
    for (const [c, l] of MIX_ITEM_ROWS) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(17);
      expect(l).toBeGreaterThanOrEqual(1);
      expect(l).toBeLessThanOrEqual(4);
    }
    expect(MIX_BLEND).toHaveLength(18);
    for (const row of MIX_BLEND) {
      expect(row).toHaveLength(18);
      for (const b of row) expect(b === MIX_NO_BLEND || (b >= 0 && b <= 22)).toBe(true);
    }
    expect(MIX_RESULT_WORDS[0], 'word 0 is never read').toBe(0);
    for (const w of MIX_RESULT_WORDS.slice(1)) expect(MIX_RESULT_COMMANDS).toContain(w);
  });

  it('the 53 result rows are 0x3183 to 0x31B8 except 0x31AD, and a result table cell exists for every row and level the matrix and the items can name', () => {
    const want: number[] = [];
    for (let id = 0x3183; id <= 0x31b8; id++) if (id !== 0x31ad) want.push(id);
    expect([...MIX_RESULT_COMMANDS]).toEqual(want);
    expect(MIX_RESULT_COMMANDS).toHaveLength(53);
    for (let row = 0; row <= 22; row++) {
      for (let level = 1; level <= 4; level++) expect(MIX_RESULT_COMMANDS, `row ${row} level ${level}`).toContain(MIX_RESULT_WORDS[level + 4 * row]);
    }
  });
});

describe('the kernel is the game\'s function: 5,009 vectors', () => {
  it('the whole 68 x 68 table of ordered pairs equals what the real function answered (4,624)', () => {
    let n = 0;
    for (const [key, row] of Object.entries(FIXTURE.resultByPair)) {
      const first = Number(key);
      row.forEach((answer, j) => {
        expect(mixRecipe(first, ITEM(j)), `${key} then ${hex(ITEM(j))}`).toBe(answer);
        n += 1;
      });
    }
    expect(n).toBe(4624);
  });

  it('the note\'s first 400 vectors replay', () => {
    expect(FIXTURE.vectors).toHaveLength(400);
    for (const [a, b, got] of FIXTURE.vectors as [number, number, number][]) expect(mixRecipe(a, b), `${hex(a as number)} then ${hex(b as number)}`).toBe(got);
  });

  it('385 ids outside the table (the nibble ignored, the low 12 bits read, a row past 67 falling back to row 0) answer as the note\'s oracle, which the real function matched', () => {
    expect(FIXTURE.outOfRange).toHaveLength(385);
    for (const [a, b, got] of FIXTURE.outOfRange as [number, number, number][]) expect(mixRecipe(a, b), `${hex(a)} then ${hex(b)}`).toBe(got);
  });

  it('the row of an id: the low 12 bits, row 0 when they are past the last row, whatever the nibble or the high bits', () => {
    expect(mixRowOf(0x2000)).toBe(0);
    expect(mixRowOf(0x2043)).toBe(67);
    expect(mixRowOf(0x2044)).toBe(0);
    expect(mixRowOf(0x3003)).toBe(3); // another nibble reads the same row
    expect(mixRowOf(0x12043)).toBe(67); // the high bits are not read
    expect(mixRowOf(0xffff)).toBe(0); // 0xfff
    expect(mixRowOf(0x7ffff006)).toBe(6);
    expect(mixRowOf(-1)).toBe(0); // a 32-bit wrap: 0xffffffff
    expect(mixClassLevel(0x2009)).toEqual([6, 4]); // the Megalixir
    expect(mixClassLevel(0x2300)).toEqual(mixClassLevel(0x2000)); // outside: the first row, the Potion
  });
});

describe('what the note states about the table', () => {
  it('4,624 ordered pairs: 1,060 through the blend matrix, 992 ties for the first item, 2,572 won by the higher level', () => {
    let viaMatrix = 0;
    let ties = 0;
    let byLevel = 0;
    for (let i = 0; i < 68; i++) {
      for (let j = 0; j < 68; j++) {
        const [ca, la] = MIX_ITEM_ROWS[i] as readonly [number, number];
        const [cb, lb] = MIX_ITEM_ROWS[j] as readonly [number, number];
        if ((MIX_BLEND[ca] as readonly number[])[cb] !== MIX_NO_BLEND) viaMatrix += 1;
        else if (la === lb) ties += 1;
        else byLevel += 1;
      }
    }
    expect({ viaMatrix, ties, byLevel }).toEqual({ viaMatrix: 1060, ties: 992, byLevel: 2572 });
    expect(FIXTURE.facts).toMatchObject({ viaMatrix: 1060, ties: 992, byLevel: 2572, orderedPairs: 4624, unorderedPairs: 2278 });
  });

  it('the order of the picks matters in 496 of the 2,278 unordered pairs of distinct items; the same item twice has one answer', () => {
    let different = 0;
    let unordered = 0;
    for (let i = 0; i < 68; i++) {
      for (let j = i + 1; j < 68; j++) {
        unordered += 1;
        if (mixRecipe(ITEM(i), ITEM(j)) !== mixRecipe(ITEM(j), ITEM(i))) different += 1;
      }
    }
    expect(unordered).toBe(2278);
    expect(different).toBe(496);
    expect(FIXTURE.facts.asymmetricUnorderedPairs).toBe(496);
  });

  it('the blend matrix is symmetric, so the order matters only through the no-blend tie: equal levels, different classes (which is why a transposed lookup is no fault the table could show)', () => {
    for (let r = 0; r < 18; r++) for (let c = 0; c < 18; c++) expect((MIX_BLEND[r] as readonly number[])[c], `[${r}][${c}]`).toBe((MIX_BLEND[c] as readonly number[])[r]);
    let ties = 0;
    for (let i = 0; i < 68; i++) {
      for (let j = i + 1; j < 68; j++) {
        if (mixRecipe(ITEM(i), ITEM(j)) === mixRecipe(ITEM(j), ITEM(i))) continue;
        const [ca, la] = MIX_ITEM_ROWS[i] as readonly [number, number];
        const [cb, lb] = MIX_ITEM_ROWS[j] as readonly [number, number];
        expect({ blend: (MIX_BLEND[ca] as readonly number[])[cb], sameLevel: la === lb, differentClass: ca !== cb }, `${i} and ${j}`).toEqual({ blend: MIX_NO_BLEND, sameLevel: true, differentClass: true });
        ties += 1;
      }
    }
    expect(ties).toBe(496);
  });

  it('there is no failure outcome: every ordered pair makes one of the 53 rows, and all 53 are made', () => {
    const made = new Set<number>();
    for (let i = 0; i < 68; i++) for (let j = 0; j < 68; j++) made.add(mixRecipe(ITEM(i), ITEM(j)));
    expect([...made].sort((a, b) => a - b)).toEqual([...MIX_RESULT_COMMANDS]);
    expect(FIXTURE.facts.distinctResults).toBe(53);
  });

  it('worked cases: the Hero Drink and the Potion in both orders (the note\'s example), opposite elements make Damage at the higher level whatever the levels, Holy absorbs, Dark Matter and the Megalixir tie for the first pick', () => {
    const hero = ITEM(rowOfName('Hero Drink'));
    const potion = ITEM(rowOfName('Potion'));
    expect(mixRecipe(hero, potion)).toBe(0x31b7); // the Hero Drink result: Hero Drink first, both level 1, no blend, the tie goes to the first
    expect(mixRecipe(potion, hero)).toBe(0x31a9); // the Hi-Potion mix: Potion first
    const fireGem = ITEM(rowOfName('Fire Gem'));
    const arctic = ITEM(rowOfName('Arctic Wind'));
    expect(mixRecipe(fireGem, arctic)).toBe(0x3185); // Cluster Bomb (plain damage at the higher level, 3), in either order
    expect(mixRecipe(arctic, fireGem)).toBe(0x3185);
    const holyWater = ITEM(rowOfName('Holy Water'));
    const iceGem = ITEM(rowOfName('Ice Gem'));
    expect(mixRecipe(holyWater, iceGem)).toBe(0x31a2); // Holy absorbs any element (level 3 from the Ice Gem): White Hole
    expect(mixRecipe(iceGem, holyWater)).toBe(0x31a2);
    const darkMatter = ITEM(rowOfName('Dark Matter'));
    const megalixir = ITEM(rowOfName('Megalixir'));
    expect(mixRecipe(darkMatter, megalixir)).toBe(0x31b8); // both level 4: the first item supplies the result, Dark Matter's row 17
    expect(mixRecipe(megalixir, darkMatter)).toBe(0x31ac); // the Megalixir's row 6 at level 4
    // two equal items: the item's own row and level
    expect(mixRecipe(potion, potion)).toBe(0x31a9);
  });
});

describe('an independent oracle: the wiki\'s Priority and Type algorithm, typed again from the research', () => {
  it('the research\'s Priority and Type are the exe\'s level and class for every item: level = 5 - Priority, class = the Type\'s class', () => {
    expect(WIKI_ROWS).toHaveLength(68);
    WIKI_ROWS.forEach((item, row) => {
      expect(MIX_ITEM_ROWS[row], `${item.name} (row ${row})`).toEqual([WIKI_TYPE_CLASS[item.type], 5 - item.priority]);
    });
  });

  it('it makes the game\'s result on 4,622 of the 4,624 ordered pairs, and the two it misses are exactly the Hero Drink first with the Poison Fang or the Candle of Life', () => {
    const wiki = wikiAgreement(mixRecipe);
    expect(wiki.blanks, 'the wiki\'s blank cells are unreachable').toBe(0);
    expect(wiki.pairs).toBe(4624);
    expect(wiki.exceptions).toHaveLength(2);
    const hero = rowOfName('Hero Drink');
    expect(wiki.exceptions.map((e) => [e.first, e.second, e.game]).sort()).toEqual(
      [[hero, rowOfName('Poison Fang'), 0x31b7], [hero, rowOfName('Candle of Life'), 0x31b7]].sort(),
    );
    for (const e of wiki.exceptions) expect(e.wiki, 'the wiki says Damage Status at priority 4').toBe('Blaster Mine');
  });

  it('the wiki\'s 53 result names and the game\'s 53 rows are one-to-one', () => {
    const wiki = wikiAgreement(mixRecipe);
    expect(wiki.names.size).toBe(53);
    expect([...wiki.names.keys()].sort((a, b) => a - b)).toEqual([...MIX_RESULT_COMMANDS]);
    expect(new Set(wiki.names.values()).size).toBe(53);
    // spot reads of the by-position names against the rows' own numbers (FFX2-G06 section 4.4: the damaging cells' power and hits agree with the research)
    expect(wiki.names.get(0x3183)).toBe('Pineapple');
    expect(wiki.names.get(0x3186)).toBe('Sunburst');
    expect(wiki.names.get(0x31a2)).toBe('White Hole');
    expect(wiki.names.get(0x31b8)).toBe('Miracle Drink');
  });
});
