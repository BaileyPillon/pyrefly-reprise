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
 * and the game's numbers both. The last block rehearses the colour flip (the common colours and red and blue swapped in those five grids' data) and shows it is mechanical.
 */

import { describe, expect, it } from 'vitest';
import type { GateColour } from '../../src/battle/common/types.ts';
import { activeGateBonuses, garmentGridRegistryFrom, gateStatTotal } from '../../src/battle/ffx2/index.ts';
import type { DataGarmentGrid } from '../../src/battle/ffx2/index.ts';
import { plateRow } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { GARMENT_GRIDS, GARMENT_GRID_LAYOUTS } from '../../src/data/ffx2/garment-grids/index.ts';
import type { GarmentGridDef, GarmentGridLayout } from '../../src/data/ffx2/garment-grids/index.ts';
import { KEYS, UP_AT, plateTotal, subsets, type Stats } from './helpers/ffx2GridOracle.ts';

const covered = Object.entries(GARMENT_GRID_LAYOUTS).map(([id, layout]) => ({ id, layout, def: GARMENT_GRIDS[id as keyof typeof GARMENT_GRIDS] as GarmentGridDef }));

/** A known omission in the data, not corrected here (no build uses the grid): `white-signet` has no gate effects at all; the game's plate row pays Magic +15 at every gate and a White Magic wait-down on every gate. */
const OMITTED = ['white-signet'];
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
  return { str: sum.str ?? 0, def: sum.def ?? 0, mag: sum.mag ?? 0, mdef: sum.mdef ?? 0 };
}

describe('the covered grids: what the layout says about the data\'s own grid', () => {
  it('covers 39 of the data\'s 44 grids, each on its own plate', () => {
    expect(covered).toHaveLength(39);
    expect(Object.keys(GARMENT_GRIDS)).toHaveLength(44);
    for (const g of covered) expect(g.def, g.id).toBeDefined();
    expect(new Set(covered.map((g) => g.layout.plate)).size).toBe(39);
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
      // the equip bonus: the data's four stats are the plate row's always-on bytes; no other byte is set on a covered grid
      const row = plateRow(0x6000 + layout.plate);
      for (const k of KEYS) expect(def.equip?.statBonus?.[k] ?? 0, `equip ${k}`).toBe(row.up[UP_AT[k]]);
      expect([row.up[0], row.up[1], row.up[6], row.up[7], row.up[8], row.up[9]], 'HP %, MP %, AGI, ACC, EVA, LUCK bytes').toEqual([0, 0, 0, 0, 0, 0]);
    });
  }
});

describe('the pay-off by gate number: the engine\'s colour-keyed data against the game\'s plate row, for every set of gates crossed', () => {
  for (const { id, layout, def } of covered) {
    const ks = numbersOf(layout);
    it(`${id}: the four stats after each of the ${1 << ks.length} sets of crossed gates equal the plate row's`, () => {
      if (OMITTED.includes(id)) {
        expect(def.gateEffects, `${id}: the data lists no gate effect (a pre-existing omission: remove this exemption when the data has them)`).toEqual([]);
        expect(plateTotal(layout.plate, new Set([1]), false).mag, 'the plate row pays Magic +15 at gate 1').toBe(15);
        return;
      }
      for (const set of subsets(ks)) {
        const want = plateTotal(layout.plate, new Set(set), set.length === ks.length);
        const got = engineTotal(def as unknown as DataGarmentGrid, layout, set);
        expect(got, `${id} with gates ${set.join('+') || 'none'}`).toEqual(want);
      }
    });
  }

  it('the stat grids really do pay a stat at some gate (the check above is not vacuous): 15 covered grids have a stat at a gate, 6 of them the physical/magical split', () => {
    let withStat = 0;
    let split = 0;
    for (const { layout } of covered) {
      const ks = numbersOf(layout);
      const gateOnly = ks.map((k) => plateTotal(layout.plate, new Set([k]), ks.length === 1));
      const base = plateTotal(layout.plate, new Set(), false);
      const moved = gateOnly.filter((t) => KEYS.some((k) => t[k] !== base[k]));
      if (moved.length > 0) withStat += 1;
      const stats = new Set(moved.map((t) => KEYS.filter((k) => t[k] !== base[k]).join('')));
      if (stats.size === 2) split += 1;
    }
    expect(withStat).toBe(15);
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
  it("each of the 39 single-colour effects that is not a stat sits on the plate row's ability for that colour's gate number (a one-gate grid: on the every-gate condition)", () => {
    expect(SINGLE_GATE_PINS).toHaveLength(39);
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
    expect(n).toBe(39);
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

describe('the five grids the lane leaves out: the data still disagrees with the cards (nothing was corrected)', () => {
  const OUT = ['healing-wind', 'ray-of-hope', 'seething-cauldron', 'strength-of-one', 'howling-wind'] as const;

  it('they have no layout, so the engine keeps the ring estimate for them', () => {
    for (const id of OUT) expect(GARMENT_GRIDS[id].layout, id).toBeUndefined();
    expect(Object.keys(GARMENT_GRID_LAYOUTS).some((id) => (OUT as readonly string[]).includes(id))).toBe(false);
  });

  it('and each really disagrees with its plate row: the node count (ray-of-hope 4 against 6, seething-cauldron and strength-of-one 5 against 4), the gate colours (healing-wind lists three, the card has two gates), the equip byte (howling-wind: MAG +10 against AGI +5)', () => {
    const plate = { 'healing-wind': 29, 'ray-of-hope': 39, 'seething-cauldron': 35, 'strength-of-one': 34, 'howling-wind': 38 } as const;
    expect([GARMENT_GRIDS['ray-of-hope'].nodeCount, plateRow(0x6000 + plate['ray-of-hope']).bonus]).toEqual([4, 6]);
    expect([GARMENT_GRIDS['seething-cauldron'].nodeCount, plateRow(0x6000 + plate['seething-cauldron']).bonus]).toEqual([5, 4]);
    expect([GARMENT_GRIDS['strength-of-one'].nodeCount, plateRow(0x6000 + plate['strength-of-one']).bonus]).toEqual([5, 4]);
    // healing-wind: the data lists red, blue and yellow gates; the plate row's conditions name gates 4 and "every gate" (the card has the gates 1 and 4)
    expect(GARMENT_GRIDS['healing-wind'].gateColours).toHaveLength(3);
    expect(plateRow(0x6000 + plate['healing-wind']).abilities.map(([c]) => c).filter((c) => c !== 255 && c !== 0)).toEqual([4, 100]);
    // howling-wind: the data's equip says MAG +10, the plate row's always-on bytes say AGI +5
    expect(GARMENT_GRIDS['howling-wind'].equip?.statBonus?.mag).toBe(10);
    expect(plateRow(0x6000 + plate['howling-wind']).up).toEqual([0, 0, 0, 0, 0, 0, 5, 0, 0, 0]);
  });
});
