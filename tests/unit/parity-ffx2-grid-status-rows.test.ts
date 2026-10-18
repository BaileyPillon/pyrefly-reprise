/**
 * **Garment Grids that keep a status or an SOS set: which rows a grid lists** (re-parity RC10 lane XD1b; **FFX-2 only**).
 *
 * The oracle is the note, not the code: `tests/fixtures/parity/ffx2/grid_status.json` holds the eight (condition, ability) pairs of the game's `plate.bin` for all 64 plates and the gate
 * numbers of each card as numbers (cut from `FFX2-G09` grids.md; no kernel or engine file was read to make it), and the rows that keep a status or set an SOS set are the list of
 * `FFX2-G04` 3.4, typed here by hand. The rules are G09 3.5 (a pair is placed when its condition holds: 1 to 4 one gate, 5 gates 1+2, 6 gates 3+4, 7 gates 1+2+3, 100 every gate; condition 0 is
 * always on) and the order of the game's list (G04 3.3 / `abilityList`: gate slots first, the grid's always-on pairs after).
 *
 * 1. The plate table the engine holds (`kernel/dressphere-grids.ts`) equals the note's pairs for all 64 plates, and no plate uses conditions 7, 101 or 102.
 * 2. The rows that keep a status are exactly the note's list, and exactly ten plates carry one: 9, 10, 15, 23, 24, 25, 33, 50, 62, 63.
 * 3. For every plate and every set of crossed gates, the rows the engine lists for the grid equal the oracle's (first the gate rows in plate order, then the always-on rows).
 * 4. Double HP and Double MP: the pool holds follow the rows 0x8098 and 0x8099.
 */

import { describe, expect, it } from 'vitest';
import type { GateColour } from '../../src/battle/common/types.ts';
import { gateRows, gridPlateOf, keepsStatus, plateRows, type GridPlate } from '../../src/battle/ffx2/adapt/auto-grid.ts';
import { poolHolds } from '../../src/battle/ffx2/adapt/auto-layer.ts';
import { plateRow } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { GARMENT_GRID_LAYOUTS } from '../../src/data/ffx2/garment-grids/index.ts';
import fixture from '../fixtures/parity/ffx2/grid_status.json';

const PAIRS = fixture.pairs as unknown as Record<string, Array<[number, number]>>;
const GATES = fixture.gates as unknown as Record<string, number[]>;

/** FFX2-G04 3.4: the auto-ability rows that keep a status (kept) or set an SOS set. Typed by hand from the note's table. */
const KEEPS_BY_NOTE = new Set<number>([
  0x8069, // Super Ribbon: Slow
  0x806a, 0x806b, 0x806c, // Auto-Shell, Auto-Protect, Auto-Wall
  0x806d, 0x806e, 0x806f, // Auto-Reflect, Auto-Regen, Auto-Haste
  0x8070, 0x8071, // Critical, Spellspring
  0x8074, 0x8075, 0x8076, 0x8077, 0x8078, // SOS Shell, Protect, Reflect, Regen, Haste
  0x8079, 0x807a, 0x807b, // SOS Spellspring, the Cat Nip row, SOS Critical
  0x809b, // SOS Wall
  0x8095, 0x8096, // Kijo's Soul, Majo's Soul
  0x8098, 0x8099, // Double HP, Double MP
  0x809c, // the Minerva's Plate row
]);

/** The ten plates of the note (names in the note: Highroad Winds 9, Mounted Assault 10, Downtrodder 15, Selene Guard 23, Helios Guard 24, Shining Mirror 25, Wishbringer 33, Tempered Will 50, Peerless 62, Last Resort 63). */
const TEN = [9, 10, 15, 23, 24, 25, 33, 50, 62, 63];
const ENGINE_HAS = [9, 15, 50];

const COMMON: GateColour[] = ['red', 'green', 'yellow', 'blue'];

/** The oracle: rows listed for a plate with the gate numbers `crossed`, gate rows first (plate order), then the always-on ones. */
function oracle(plate: number, crossed: ReadonlySet<number>): { gate: number[]; always: number[] } {
  const all = (GATES[plate] as number[]).every((k) => crossed.has(k));
  const has = (k: number): boolean => crossed.has(k);
  const gate: number[] = [];
  const always: number[] = [];
  for (const [cond, id] of PAIRS[plate] as Array<[number, number]>) {
    if (!KEEPS_BY_NOTE.has(id)) continue;
    if (cond === 0) always.push(id);
    else if (cond >= 1 && cond <= 4 && has(cond)) gate.push(id);
    else if (cond === 5 && has(1) && has(2)) gate.push(id);
    else if (cond === 6 && has(3) && has(4)) gate.push(id);
    else if (cond === 7 && has(1) && has(2) && has(3)) gate.push(id);
    else if (cond === 100 && all) gate.push(id);
  }
  return { gate, always };
}

/** The engine's view of a plate: the data's layout when the engine has the grid, else common colours for the gate numbers the card has. */
function infoOf(plate: number): GridPlate {
  const layout = Object.values(GARMENT_GRID_LAYOUTS).find((l) => l.plate === plate);
  if (layout) return gridPlateOf(layout) as GridPlate;
  const gates = GATES[plate] as number[];
  return { plate, colourOfGate: [1, 2, 3, 4].map((k) => (gates.includes(k) ? (COMMON[k - 1] as GateColour) : null)), gates };
}

function subsets(ks: readonly number[]): number[][] {
  const out: number[][] = [];
  for (let m = 0; m < 1 << ks.length; m++) out.push(ks.filter((_, i) => (m >> i) & 1));
  return out;
}

describe('the plate table the engine holds is the note\'s', () => {
  it('the fixture holds 64 plates and the note\'s 259 non-blank pairs', () => {
    expect(Object.keys(PAIRS)).toHaveLength(64);
    expect(Object.values(PAIRS).reduce((n, p) => n + p.length, 0)).toBe(259);
  });

  it('every plate\'s non-blank pairs equal the engine\'s table, in order', () => {
    for (let n = 0; n < 64; n++) {
      const mine = plateRow(0x6000 + n).abilities.filter(([cond]) => cond !== 255).map(([cond, id]) => [cond, id]);
      expect(mine, `plate ${n}`).toEqual(PAIRS[n]);
    }
  });

  it('no plate uses a condition outside 0 to 6 and 100 (7, 101 and 102 are unused data, which is why "every dressphere node worn" is not tracked)', () => {
    const used = new Set(Object.values(PAIRS).flatMap((p) => p.map(([cond]) => cond)));
    expect([...used].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 100]);
  });
});

describe('which rows keep a status', () => {
  it('the engine\'s verdict on every auto-ability row (0x8000 to 0x80a1) is the note\'s list', () => {
    const got: number[] = [];
    for (let id = 0x8000; id <= 0x80a1; id++) if (keepsStatus(id)) got.push(id);
    expect(got).toEqual([...KEEPS_BY_NOTE].sort((a, b) => a - b));
  });

  it('exactly ten plates carry such a row, the note\'s ten; three of them are grids the engine has (9, 15, 50), seven are not (10, 23, 24, 25, 33, 62, 63)', () => {
    const carrying = Object.entries(PAIRS).filter(([, p]) => p.some(([, id]) => KEEPS_BY_NOTE.has(id))).map(([n]) => Number(n));
    expect(carrying).toEqual(TEN);
    const engineHas = new Set(Object.values(GARMENT_GRID_LAYOUTS).map((l) => l.plate));
    expect(TEN.filter((n) => engineHas.has(n))).toEqual(ENGINE_HAS);
  });
});

describe('the rows a grid lists, for every plate and every set of crossed gates', () => {
  it('64 plates: the rows listed by the gates crossed and by the grid worn equal the oracle\'s', () => {
    let cases = 0;
    let nonEmpty = 0;
    for (let plate = 0; plate < 64; plate++) {
      const info = infoOf(plate);
      expect(info.gates, `plate ${plate} gate numbers`).toEqual(GATES[plate]);
      for (const crossed of subsets(info.gates)) {
        const want = oracle(plate, new Set(crossed));
        const passed = crossed.map((k) => info.colourOfGate[k - 1] as GateColour);
        expect(gateRows(info, passed), `plate ${plate}, gates ${crossed.join(',')}`).toEqual(want.gate);
        expect(plateRows(info), `plate ${plate}`).toEqual(want.always);
        cases += 1;
        if (want.gate.length + want.always.length > 0) nonEmpty += 1;
      }
    }
    expect(cases).toBe(Object.values(GATES).reduce((n, g) => n + (1 << g.length), 0));
    expect(nonEmpty).toBe(36); // the oracle finds 36 (plate, gates) cases over the ten plates that list a row, so the comparison above is not vacuous
  });

  it('the hand cases: Highroad Winds lists SOS Haste only with all four gates; Downtrodder Double HP only with all three; Tempered Will Double MP at gate 1 and Double HP at gate 2', () => {
    const hw = infoOf(9);
    expect(gateRows(hw, ['red', 'green', 'yellow'])).toEqual([]);
    expect(gateRows(hw, ['red', 'green', 'yellow', 'blue'])).toEqual([0x8078]);
    expect(plateRows(hw)).toEqual([]); // its always-on pair is First Strike, which keeps no status
    const dt = infoOf(15);
    expect(gateRows(dt, ['red', 'green'])).toEqual([]);
    expect(gateRows(dt, ['red', 'green', 'yellow'])).toEqual([0x8098]);
    const tw = infoOf(50);
    expect(gateRows(tw, [])).toEqual([]);
    expect(gateRows(tw, ['red'])).toEqual([0x8099]);
    expect(gateRows(tw, ['green'])).toEqual([0x8098]);
    expect(gateRows(tw, ['green', 'red'])).toEqual([0x8099, 0x8098]);
  });

  it('the grids whose always-on pair keeps a status list it before any gate is crossed (Selene Guard\'s SOS Shell, Helios Guard\'s SOS Protect)', () => {
    expect(plateRows(infoOf(23))).toEqual([0x8074]);
    expect(plateRows(infoOf(24))).toEqual([0x8075]);
    expect(gateRows(infoOf(23), ['red'])).toEqual([0x806a]);
    expect(gateRows(infoOf(24), ['red'])).toEqual([0x806b]);
  });

  it('a colour the grid does not wear crosses nothing (Tempered Will has no blue gate)', () => {
    expect(gateRows(infoOf(50), ['blue', 'yellow'])).toEqual([]);
  });
});

describe('Double HP and Double MP', () => {
  it('the pool holds follow rows 0x8098 and 0x8099 and no other row', () => {
    expect(poolHolds([])).toEqual({ hp: false, mp: false });
    expect(poolHolds([0x8098])).toEqual({ hp: true, mp: false });
    expect(poolHolds([0x8099])).toEqual({ hp: false, mp: true });
    expect(poolHolds([0x8099, 0x8098])).toEqual({ hp: true, mp: true });
    for (let id = 0x8000; id <= 0x80a1; id++) {
      if (id === 0x8098 || id === 0x8099) continue;
      expect(poolHolds([id]), `row ${id.toString(16)}`).toEqual({ hp: false, mp: false });
    }
  });
});
