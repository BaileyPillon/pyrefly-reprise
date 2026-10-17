/**
 * **The Garment Grid layouts agree with the game's own plate rows, grid by grid** (re-parity RC9 lane X2-I; `FFX2-G09`; **FFX-2 only**).
 *
 * The data (`src/data/ffx2/garment-grids/`) keys a gate's pay-off by a colour; the game keys it by a gate number 1 to 4. The mapping number to colour is inferred
 * (1 red, 2 green, 3 yellow, 4 blue: 36 of 36 gate sets agree) and **not applied** here: each layout carries its own table (`colourOfGate`), and this file proves, for
 * every covered grid and every set of gates crossed, that the colour-keyed data pays what the game's plate row pays at the same gate numbers. The oracle imports no
 * grid, layout or adapter code: it reads the game's rows (`plateRow`, `abilityRow`: numbers read from `plate.bin` and `a_ability.bin`) and counts by itself.
 *
 * On the five older stat grids (`vanguard`, `bum-rush`, `flash-of-steel`, `protection-halo`, `hour-of-need`) today's data pays the physical stat on red and yellow and
 * the magical one on blue and green, and the game pays the physical stat at the numbers 3 and 4: their tables read blue, green, yellow, red, which keeps today's colours
 * and the game's numbers both. One block rehearses the colour flip (the common colours and red and blue swapped in those five grids' data) and shows it is mechanical.
 *
 * Follow-up D1 (2026-10-16): all 44 grids are covered. The six whose data disagreed with the game's plate rows or lacked its gate effects (`healing-wind`, `ray-of-hope`,
 * `seething-cauldron`, `strength-of-one`, `howling-wind`, `white-signet`) were corrected; the last block pins the game's own numbers for them, written out as literals. The totals
 * are over six stats now (Agility and Luck too: Howling Wind and Ray of Hope are the two rows that pay them).
 */

import { describe, expect, it } from 'vitest';
import type { GateColour } from '../../src/battle/common/types.ts';
import { activeGateBonuses, garmentGridRegistryFrom, gateStatTotal, waitDownPercent } from '../../src/battle/ffx2/index.ts';
import type { DataGarmentGrid } from '../../src/battle/ffx2/index.ts';
import { plateRow } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { abilityRow } from '../../src/battle/ffx2/kernel/dressphere-rows.ts';
import { GARMENT_GRIDS, GARMENT_GRID_LAYOUTS } from '../../src/data/ffx2/garment-grids/index.ts';
import type { GarmentGridDef, GarmentGridLayout } from '../../src/data/ffx2/garment-grids/index.ts';
import { ALL_KEYS, UP_AT, cardOf, plateTotal, subsets, type Stats } from './helpers/ffx2GridOracle.ts';

const covered = Object.entries(GARMENT_GRID_LAYOUTS).map(([id, layout]) => ({ id, layout, def: GARMENT_GRIDS[id as keyof typeof GARMENT_GRIDS] as GarmentGridDef }));

const STAT_FIVE = ['vanguard', 'bum-rush', 'flash-of-steel', 'protection-halo', 'hour-of-need'];
const COMMON: ReadonlyArray<GateColour> = ['red', 'green', 'yellow', 'blue'];
const SWAPPED: ReadonlyArray<GateColour> = ['blue', 'green', 'yellow', 'red'];

const numbersOf = (layout: GarmentGridLayout): number[] => [1, 2, 3, 4].filter((k) => layout.colourOfGate[k - 1] !== null);
const gateNodesOf = (layout: GarmentGridLayout): number[] => layout.nodes.flatMap(([gate]) => (gate === 0 ? [] : [gate]));

/** What the engine's colour-keyed bonuses pay for the colours these gate numbers wear on this grid. */
function engineTotal(grid: DataGarmentGrid, layout: GarmentGridLayout, crossed: readonly number[]): Stats {
  const registry = garmentGridRegistryFrom([grid]);
  const def = registry.get(grid.id);
  if (!def) throw new Error(`no grid ${grid.id}`);
  const passed = crossed.map((k) => layout.colourOfGate[k - 1]).filter((c): c is GateColour => c !== null);
  const sum = gateStatTotal(activeGateBonuses(def, passed));
  return { str: sum.str ?? 0, def: sum.def ?? 0, mag: sum.mag ?? 0, mdef: sum.mdef ?? 0, agi: sum.agi ?? 0, luck: sum.luck ?? 0 };
}

describe('the covered grids: what the layout says about the data\'s own grid', () => {
  it('covers all 44 of the data\'s grids, each on its own plate (the first lane covered 39 and left five out; follow-up D1 corrected them)', () => {
    expect(covered).toHaveLength(44);
    expect(Object.keys(GARMENT_GRIDS)).toHaveLength(44);
    expect(covered.map((g) => g.id).sort()).toEqual(Object.keys(GARMENT_GRIDS).sort());
    for (const g of covered) expect(g.def, g.id).toBeDefined();
    expect(new Set(covered.map((g) => g.layout.plate)).size).toBe(44);
  });

  for (const { id, layout, def } of covered) {
    it(`${id} (plate ${layout.plate}): the data's grid carries this layout, the node count and the gate colours are the card's, the equip bytes are the plate row's`, () => {
      expect(def.layout, 'attached by the data index').toBe(layout);
      const dress = layout.nodes.filter(([gate]) => gate === 0).length;
      expect(dress, 'dressphere nodes').toBe(def.nodeCount);
      expect(garmentGridRegistryFrom([def as unknown as DataGarmentGrid]).get(id)?.nodes, "the engine's grid counts dressphere nodes only (not the gate nodes)").toBe(def.nodeCount);
      expect(plateRow(0x6000 + layout.plate).bonus, "the plate row's node field").toBe(def.nodeCount);
      // the gate numbers the card has are exactly the entries of the colour table, and the colours are exactly the data's colour set
      expect(gateNodesOf(layout).sort()).toEqual(numbersOf(layout));
      const colours = layout.colourOfGate.filter((c): c is GateColour => c !== null);
      expect(new Set(colours).size, 'no colour twice').toBe(colours.length);
      expect([...colours].sort()).toEqual([...def.gateColours].sort());
      // the equip bonus: the data's six stats are the plate row's always-on bytes (Agility on Howling Wind, Luck on Ray of Hope, the other four as before); no other byte is set on any grid
      const row = plateRow(0x6000 + layout.plate);
      for (const k of ALL_KEYS) expect(def.equip?.statBonus?.[k] ?? 0, `equip ${k}`).toBe(row.up[UP_AT[k]]);
      expect([row.up[0], row.up[1], row.up[7], row.up[8]], 'HP %, MP %, ACC, EVA bytes').toEqual([0, 0, 0, 0]);
    });
  }
});

describe('the pay-off by gate number: the engine\'s colour-keyed data against the game\'s plate row, for every set of gates crossed', () => {
  for (const { id, layout, def } of covered) {
    const ks = numbersOf(layout);
    it(`${id}: the four stats after each of the ${1 << ks.length} sets of crossed gates equal the plate row's`, () => {
      for (const set of subsets(ks)) {
        const want = plateTotal(layout.plate, new Set(set), set.length === ks.length);
        const got = engineTotal(def as unknown as DataGarmentGrid, layout, set);
        expect(got, `${id} with gates ${set.join('+') || 'none'}`).toEqual(want);
      }
    });
  }

  it('the stat grids really do pay a stat at some gate (the check above is not vacuous): 19 covered grids have a stat at a gate (15 before follow-up D1, and the four it added: Strength of One, Seething Cauldron, Howling Wind, Ray of Hope), 6 of them the physical/magical split', () => {
    let withStat = 0;
    let split = 0;
    for (const { layout } of covered) {
      const ks = numbersOf(layout);
      const gateOnly = ks.map((k) => plateTotal(layout.plate, new Set([k]), ks.length === 1));
      const base = plateTotal(layout.plate, new Set(), false);
      const moved = gateOnly.filter((t) => ALL_KEYS.some((k) => t[k] !== base[k]));
      if (moved.length > 0) withStat += 1;
      const stats = new Set(moved.map((t) => ALL_KEYS.filter((k) => t[k] !== base[k]).join('')));
      if (stats.size === 2) split += 1;
    }
    expect(withStat).toBe(19);
    expect(split).toBe(6);
  });

  it('the effects keyed by several colours sit on a condition the plate row has: one gate on its number, gates 1 + 2 on 5, gates 3 + 4 on 6, every gate on 100; a per-gate entry on each gate\'s own number', () => {
    for (const { id, layout, def } of covered) {
      const ks = numbersOf(layout);
      const conds = new Set(plateRow(0x6000 + layout.plate).abilities.map(([c]) => c));
      for (const effect of def.gateEffects) {
        const nums = effect.gates.map((c) => layout.colourOfGate.indexOf(c) + 1).sort();
        expect(nums.every((n) => n >= 1), `${id}: ${effect.gates.join('+')} are all this grid's colours`).toBe(true);
        if (effect.effect.perGatePassed) {
          for (const k of ks) expect(conds.has(k), `${id}: per-gate entry needs condition ${k}`).toBe(true);
          continue;
        }
        const key = nums.join('');
        const allKey = [...ks].sort().join('');
        const accepted = new Set<number>();
        if (nums.length === 1) accepted.add(nums[0] ?? 0);
        if (key === '12') accepted.add(5);
        if (key === '34') accepted.add(6);
        if (key === '123') accepted.add(7);
        if (key === allKey) accepted.add(100);
        expect([...accepted].some((c) => conds.has(c)), `${id}: ${effect.gates.join('+')} (${key}) needs one of the conditions ${[...accepted].join(', ')}; the row has ${[...conds].join(', ')}`).toBe(true);
      }
    }
  });
});


/**
 * The single-colour effects of the data that are not a stat, and the ability (or abilities) the game's plate row puts at that colour's gate number: the ids are the game's
 * (commands 0x30xx, auto-abilities 0x80xx); each was matched to our description by the game's own names when the tables were written (private text, not kept). They pin the
 * colour tables where a stat cannot (which of red and green carries Double MP and which Double HP; Slow-proof against Stop-proof; the four proofs of Scourgebane).
 */
const SINGLE_GATE_PINS: ReadonlyArray<readonly [id: string, colour: GateColour, abilities: readonly number[], description: string]> = [
  ['heart-of-flame', 'yellow', [0x802a], 'Firestrike'],
  ['menace-of-the-deep', 'yellow', [0x8036], 'Waterstrike'],
  ['thunder-spawn', 'yellow', [0x8032], 'Lightningstrike'],
  ['ice-queen', 'yellow', [0x802e], 'Icestrike'],
  ['restless-sleep', 'green', [0x804e], 'Sleepproof'],
  ['restless-sleep', 'yellow', [0x8054], 'Poisonproof'],
  ['heart-reborn', 'blue', [0x30b4], 'Use Cura'],
  ['healing-wind', 'blue', [0x30b4], 'Use Cura'], // follow-up D1: plate 29's one single-gate pair
  ['healing-light', 'red', [0x30b4], 'Use Cura'],
  ['healing-light', 'green', [0x30b9], 'Use Life'],
  ['healing-light', 'yellow', [0x30b5], 'Use Curaga'],
  ['downtrodder', 'green', [0x803a], 'Gravitystrike'],
  ['downtrodder', 'red', [0x3082], 'Use Demi'],
  ['covetous', 'red', [0x317b], 'Use Osmose'],
  ['covetous', 'blue', [0x3081], 'Use Drain'],
  ['highroad-winds', 'green', [0x805f], 'Slowproof'],
  ['highroad-winds', 'red', [0x8061], 'Stopproof'],
  ['highroad-winds', 'yellow', [0x3176], 'Use Haste'],
  ['treasure-hunt', 'red', [0x8010], 'Double Items'],
  ['raging-giant', 'green', [0x8056], 'Confuseproof'],
  ['raging-giant', 'yellow', [0x8058], 'Berserkproof'],
  ['tempered-will', 'green', [0x8098], 'Double HP'],
  ['tempered-will', 'red', [0x8099], 'Double MP'],
  ['tricks-of-the-trade', 'red', [0x8080], 'Black Magic wait down'],
  ['tricks-of-the-trade', 'yellow', [0x8081], 'White Magic wait down'],
  ['tricks-of-the-trade', 'green', [0x807e], 'Arcana wait down'],
  ['scourgebane', 'green', [0x804e, 0x8054], 'Sleepproof + Poisonproof'],
  ['scourgebane', 'red', [0x8050, 0x8052], 'Silenceproof + Darkproof'],
  ['scourgebane', 'yellow', [0x8056, 0x8058], 'Confuseproof + Berserkproof'],
  ['scourgebane', 'blue', [0x805b, 0x805d], 'Curseproof + Itchyproof'],
  ['disaster-in-bloom', 'green', [0x804d], 'Sleeptouch'],
  ['disaster-in-bloom', 'red', [0x804f], 'Silencetouch'],
  ['disaster-in-bloom', 'yellow', [0x8051], 'Darktouch'],
  ['disaster-in-bloom', 'blue', [0x8053], 'Poisontouch'],
  ['immortal-soul', 'green', [0x30b4], 'Use Cura'],
  ['immortal-soul', 'yellow', [0x30b5], 'Use Curaga'],
  ['bitter-farewell', 'green', [0x804a], 'Deathproof'],
  ['bitter-farewell', 'yellow', [0x805a], 'Doomproof'],
  ['covenant-of-growth', 'blue', [0x8009], 'Double AP'],
  ['covenant-of-growth', 'yellow', [0x8011], 'Double EXP'],
];

describe('the colour tables (the tripwire for the colour flip)', () => {
  it("each of the 40 single-colour effects that is not a stat sits on the plate row's ability for that colour's gate number (a one-gate grid: on the every-gate condition)", () => {
    expect(SINGLE_GATE_PINS).toHaveLength(40);
    for (const [id, colour, abilities, description] of SINGLE_GATE_PINS) {
      const { layout, def } = covered.find((g) => g.id === id)!;
      const effect = def.gateEffects.find((e) => e.gates.length === 1 && e.gates[0] === colour);
      expect(effect?.effect.description, `${id} ${colour}`).toBe(description);
      const number = layout.colourOfGate.indexOf(colour) + 1;
      const only = numbersOf(layout).length === 1; // a one-gate grid keeps its effect on the every-gate condition
      const ids = plateRow(0x6000 + layout.plate).abilities.filter(([c]) => c === (only ? 100 : number)).map(([, a]) => a);
      expect(ids, `${id}: ${description} on ${colour} (gate ${number})`).toEqual([...abilities]);
    }
  });

  it('every single-colour effect of a covered grid that is not a stat is one of the pins above (none escapes the check)', () => {
    let n = 0;
    for (const { id, def } of covered) {
      for (const e of def.gateEffects) {
        if (e.gates.length !== 1 || e.effect.perGatePassed || e.effect.statBonus) continue;
        n += 1;
        expect(SINGLE_GATE_PINS.some(([pid, colour]) => pid === id && colour === e.gates[0]), `${id} ${e.gates[0]}`).toBe(true);
      }
    }
    expect(n).toBe(40);
  });

  it('the five older stat grids read blue, green, yellow, red; every other covered grid reads red, green, yellow, blue where it has the gate', () => {
    for (const { id, layout } of covered) {
      const want = (STAT_FIVE.includes(id) ? SWAPPED : COMMON).map((c, i) => (layout.nodes.some(([gate]) => gate === i + 1) ? c : null));
      expect([...layout.colourOfGate], id).toEqual(want);
    }
  });

  it('on those five grids the data pays the physical stat at red and yellow and the magical one at blue and green, and the game pays it at the numbers 3 and 4 and 1 and 2', () => {
    for (const id of STAT_FIVE) {
      const { layout, def } = covered.find((g) => g.id === id)!;
      const phys = (c: GateColour): boolean => def.gateEffects.some((e) => e.gates.length === 1 && e.gates[0] === c && (e.effect.statBonus?.str !== undefined || e.effect.statBonus?.def !== undefined));
      expect(COMMON.map(phys), `${id}: today's data, by colour red, green, yellow, blue`).toEqual([true, false, true, false]);
      expect([1, 2, 3, 4].map((k) => phys(layout.colourOfGate[k - 1] as GateColour)), `${id}: by gate number`).toEqual([false, false, true, true]);
    }
  });

  it('REHEARSAL OF THE FLIP: the common colours on those five grids and red and blue swapped in their data pay exactly what the tables above pay, by number', () => {
    const swapColour = (c: GateColour): GateColour => (c === 'red' ? 'blue' : c === 'blue' ? 'red' : c);
    for (const id of STAT_FIVE) {
      const { layout, def } = covered.find((g) => g.id === id)!;
      const flipped = {
        ...def,
        layout: { ...layout, colourOfGate: layout.colourOfGate.map((_, i) => (layout.nodes.some(([gate]) => gate === i + 1) ? COMMON[i] : null)) as unknown as GarmentGridLayout['colourOfGate'] },
        gateEffects: def.gateEffects.map((e) => ({ ...e, gates: e.gates.map(swapColour) })),
      } as unknown as DataGarmentGrid;
      const lay = flipped.layout as unknown as GarmentGridLayout;
      const ks = numbersOf(lay);
      for (const set of subsets(ks)) {
        const want = plateTotal(lay.plate, new Set(set), set.length === ks.length);
        expect(engineTotal(flipped, lay, set), `${id} flipped, gates ${set.join('+') || 'none'}`).toEqual(want);
      }
    }
  });
});

/**
 * Follow-up D1 (2026-10-16): the six grids the first lane left out or found incomplete, corrected to the game's plate rows. The literals below are the game's numbers (the plate row and
 * the card: `FFX2-G09` §4.1 to §4.3 and Appendix A; the rows are `kernel/dressphere-grids.ts` 0x601d, 0x6022, 0x6023, 0x6026, 0x6027 and 0x602c), written out on purpose: the checks above
 * compare the data with the row table through the oracle, these fail when the data or the row table moves.
 */
interface GameGrid {
  id: 'healing-wind' | 'strength-of-one' | 'seething-cauldron' | 'howling-wind' | 'ray-of-hope' | 'white-signet';
  plate: number;
  /** Dressphere nodes on the card, which is also the plate row's node field. */
  dress: number;
  /** The gate numbers the card has. */
  gates: readonly number[];
  /** The always-on stat bytes (a stat not listed is 0). */
  equip: Partial<Stats>;
  /** What each different gate crossed pays (one ability on the conditions 1 to 4: "the stacking quirk", FFX2-G09 §4.3). */
  perGate: Partial<Stats>;
}

const GAME_GRIDS: readonly GameGrid[] = [
  { id: 'healing-wind', plate: 29, dress: 3, gates: [1, 4], equip: {}, perGate: {} },
  { id: 'strength-of-one', plate: 34, dress: 4, gates: [1, 2, 3, 4], equip: { str: 10 }, perGate: { str: 15 } },
  { id: 'seething-cauldron', plate: 35, dress: 4, gates: [1, 2, 3, 4], equip: { mag: 10 }, perGate: { mag: 15 } },
  { id: 'howling-wind', plate: 38, dress: 4, gates: [1, 2, 3, 4], equip: { agi: 5 }, perGate: { agi: 5 } },
  { id: 'ray-of-hope', plate: 39, dress: 6, gates: [1, 2, 3, 4], equip: { luck: 30 }, perGate: { luck: 30 } },
  { id: 'white-signet', plate: 44, dress: 6, gates: [1, 2, 3, 4], equip: {}, perGate: { mag: 15 } },
];

/** The (condition, ability) pairs of a plate row that are not blank (condition 255), in the row's order. */
const pairsOf = (plate: number): Array<readonly [number, number]> => plateRow(0x6000 + plate).abilities.filter(([cond]) => cond !== 255);

describe('follow-up D1: the six corrected grids are the game\'s, number for number', () => {
  const ZERO: Stats = { str: 0, def: 0, mag: 0, mdef: 0, agi: 0, luck: 0 };
  const plus = (a: Stats, b: Partial<Stats>, times: number): Stats => {
    const out: Stats = { ...a };
    for (const k of ALL_KEYS) out[k] += (b[k] ?? 0) * times;
    return out;
  };

  for (const g of GAME_GRIDS) {
    const { layout, def } = covered.find((c) => c.id === g.id)!;

    it(`${g.id} (plate ${g.plate}): ${g.dress} dressphere nodes and the gate numbers ${g.gates.join(', ')} on the card, in the plate row's node field and in the data`, () => {
      expect(layout.plate).toBe(g.plate);
      const card = cardOf(g.plate);
      expect(card.nodes.filter(([gate]) => gate === 0), 'dressphere nodes on the card').toHaveLength(g.dress);
      expect(card.nodes.flatMap(([gate]) => (gate === 0 ? [] : [gate])).sort(), 'gate numbers on the card').toEqual([...g.gates]);
      expect(plateRow(0x6000 + g.plate).bonus, "the plate row's node field").toBe(g.dress);
      expect(def.nodeCount, "the data's node count").toBe(g.dress);
      expect(def.gateColours, 'the data lists as many gate colours as the card has gates').toHaveLength(g.gates.length);
      expect(layout.nodes.filter(([gate]) => gate === 0), 'dressphere nodes in the layout').toHaveLength(g.dress);
    });

    it(`${g.id}: ${JSON.stringify(g.equip)} always on and ${JSON.stringify(g.perGate)} for each different gate crossed, for every set of gates: the plate row and the data both`, () => {
      for (const set of subsets(g.gates)) {
        const want = plus(plus(ZERO, g.equip, 1), g.perGate, set.length);
        const label = `${g.id}, gates ${set.join('+') || 'none'}`;
        expect(plateTotal(g.plate, new Set(set), set.length === g.gates.length), `${label}: the game's row`).toEqual(want);
        expect(engineTotal(def as unknown as DataGarmentGrid, layout, set), `${label}: the data`).toEqual(want);
      }
    });
  }

  it('the four grids that pay one ability at every gate (the stacking quirk) have exactly that shape in the row and in the data: the same ability on the conditions 1 to 4, one per-gate entry on all four colours', () => {
    const shapes = [
      ['strength-of-one', 34, 0x808a],
      ['seething-cauldron', 35, 0x808b],
      ['howling-wind', 38, 0x8093],
      ['ray-of-hope', 39, 0x8094],
    ] as const;
    for (const [id, plate, ability] of shapes) {
      expect(pairsOf(plate), `${id}: the plate row's pairs`).toEqual([[1, ability], [2, ability], [3, ability], [4, ability]]);
      const grid = GARMENT_GRIDS[id];
      expect(grid.gateEffects, `${id}: one entry`).toHaveLength(1);
      const [entry] = grid.gateEffects;
      expect([...(entry?.gates ?? [])].sort(), `${id}: on all four colours`).toEqual(['blue', 'green', 'red', 'yellow']);
      expect(entry?.effect.perGatePassed, `${id}: per gate passed`).toBe(true);
      expect(entry?.effect.autoAbilityTags, `${id}: no status or tag effect`).toBeUndefined();
    }
  });

  it('ray-of-hope: the effects the data used to list (Dismissal, Butterfingers, Evasion +50) are gone; the game\'s row pays Luck +30 and nothing else', () => {
    const ray = GARMENT_GRIDS['ray-of-hope'];
    expect(ray.nodeCount).toBe(6);
    expect(ray.equip?.statBonus).toEqual({ luck: 30 });
    expect(ray.gateEffects.flatMap((e) => e.effect.autoAbilityTags ?? [])).toEqual([]);
    expect(ray.gateEffects.map((e) => e.effect.description)).toEqual(['LUCK +30 per gate passed']);
    expect(plateRow(0x6027).up, 'always on: the Luck byte').toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 30]);
  });

  it('howling-wind: the always-on effect is Agility +5, not Magic +10 (the row\'s Agility byte), and nothing else is always on', () => {
    const wind = GARMENT_GRIDS['howling-wind'];
    expect(wind.nodeCount).toBe(4);
    expect(wind.equip?.statBonus).toEqual({ agi: 5 });
    expect(plateRow(0x6026).up).toEqual([0, 0, 0, 0, 0, 0, 5, 0, 0, 0]);
  });

  it('seething-cauldron and strength-of-one: four nodes (the card and the row), not five; the always-on stat was right (Magic +10, Strength +10)', () => {
    expect([GARMENT_GRIDS['seething-cauldron'].nodeCount, plateRow(0x6023).bonus, plateRow(0x6023).up[4]]).toEqual([4, 4, 10]);
    expect([GARMENT_GRIDS['strength-of-one'].nodeCount, plateRow(0x6022).bonus, plateRow(0x6022).up[2]]).toEqual([4, 4, 10]);
  });

  it('healing-wind: two gate colours (red and blue) for the card\'s two gates, not three; Use Cure always on, Use Cura on gate 4, Use Curaga once both gates are crossed: the three pairs of plate 29, with the ability ids Heart Reborn and Healing Light use for the same game abilities', () => {
    const wind = GARMENT_GRIDS['healing-wind'];
    expect(pairsOf(29)).toEqual([[0, 0x30b3], [4, 0x30b4], [100, 0x30b5]]);
    expect(wind.gateColours).toEqual(['red', 'blue']);
    expect(wind.equip?.grantsAbilityIds, 'Use Cure (0x30b3 always on, as on Healing Light)').toEqual(GARMENT_GRIDS['healing-light'].equip?.grantsAbilityIds);
    expect(wind.equip?.grantsAbilityIds).toEqual(['x2-white-mage-cure']);
    const heart = GARMENT_GRIDS['heart-reborn'].gateEffects;
    const cura = wind.gateEffects.find((e) => e.gates.length === 1);
    expect(cura?.gates, 'gate 4 wears blue, as on Heart Reborn').toEqual(['blue']);
    expect(cura?.effect.grantsAbilityIds, 'Use Cura (0x30b4 on gate 4, as on Heart Reborn)').toEqual(heart.find((e) => e.gates.length === 1)?.effect.grantsAbilityIds);
    const all = wind.gateEffects.find((e) => e.gates.length === 2);
    expect([...(all?.gates ?? [])].sort(), 'every gate').toEqual(['blue', 'red']);
    expect(all?.effect.grantsAbilityIds, 'Use Curaga (0x30b5 once every gate is crossed, as on Heart Reborn)').toEqual(heart.find((e) => e.gates.length === 2)?.effect.grantsAbilityIds);
    expect(wind.gateEffects).toHaveLength(2);
  });

  it('white-signet: Magic +15 on each of the four gates (60 in all) and the White Magic wait-down once every gate is crossed, the pairs of plate 44; the row\'s always-on pair (the White Magic command, 0x3024) is the one thing left out of the data (Rule 6: no ability id of ours is provable from the row)', () => {
    const signet = GARMENT_GRIDS['white-signet'];
    expect(pairsOf(44)).toEqual([[0, 0x3024], [1, 0x808b], [2, 0x808b], [3, 0x808b], [4, 0x808b], [100, 0x8081]]);
    expect(plateTotal(44, new Set([1, 2, 3, 4]), true).mag, 'the game pays 60, not the 40 the fallback table pays').toBe(60);
    expect(signet.gateEffects.map((e) => e.effect.description)).toEqual(['MAG +15 per gate passed', 'White Magic wait down']);
    const registry = garmentGridRegistryFrom([signet as unknown as DataGarmentGrid]).get('white-signet')!;
    const waitDown = (passed: GateColour[]): number => waitDownPercent(activeGateBonuses(registry, passed));
    expect(waitDown([]), 'no gate').toBe(0);
    expect(waitDown(['red', 'green', 'blue']), 'three gates: the row pays the wait-down on every gate only (condition 100)').toBe(0);
    expect(waitDown(['red', 'green', 'blue', 'yellow']), 'every gate: the adapter turns the data\'s wait-down tag into the engine\'s existing -40% CT on every cast').toBe(40);
    expect(signet.equip, 'known gap, pinned so that adding it is noticed').toBeUndefined();
  });

  it('no plate row of the 64 pays anything outside the six stats: the HP %, MP %, Accuracy and Evasion bytes are 0 on every row and on every auto-ability a row pays, and only plates 38 and 39 pay Agility or Luck', () => {
    const agiLuck: number[] = [];
    for (let plate = 0; plate < 64; plate++) {
      const row = plateRow(0x6000 + plate);
      expect([row.up[0], row.up[1], row.up[7], row.up[8]], `plate ${plate} row`).toEqual([0, 0, 0, 0]);
      let paysAgiLuck = row.up[6] !== 0 || row.up[9] !== 0;
      for (const [cond, ability] of row.abilities) {
        if (cond === 255 || ability >> 12 !== 8) continue;
        const up = abilityRow(ability).up;
        expect([up[0], up[1], up[7], up[8]], `plate ${plate}, ability 0x${ability.toString(16)}`).toEqual([0, 0, 0, 0]);
        if (up[6] !== 0 || up[9] !== 0) paysAgiLuck = true;
      }
      if (paysAgiLuck) agiLuck.push(plate);
    }
    expect(agiLuck).toEqual([38, 39]);
  });
});
