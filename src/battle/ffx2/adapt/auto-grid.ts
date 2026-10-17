/**
 * The auto-ability rows a Garment Grid lists for a girl (re-parity RC10, lane XD1b; **FFX-2 only**).
 *
 * The game lists a girl's auto-abilities from five sources (`kernel/dressphere-abilities.ts#abilityList`, note FFX2-G09 3.5): her dressphere, the eight **gate slots**,
 * the grid's own **always-on pairs** (condition 0), and her accessories. A grid's plate row holds eight (condition, ability) pairs. A pair with condition 0 is listed as
 * soon as the grid is worn; a pair with a gate condition is listed once the gate evaluation (`0x005f4170`, run when a dress change lands) finds its gates crossed:
 * conditions 1 to 4 one gate, 5 gates 1 and 2, 6 gates 3 and 4, 7 gates 1, 2 and 3, 100 every gate, 101 every dressphere node worn, 102 both.
 *
 * The engine keeps the crossed gates as **colours** (`GarmentGridState.passedGates`), and the layout of each grid says which colour its gate number 1, 2, 3, 4 wears
 * (`data/ffx2/garment-grids/layouts.ts#colourOfGate`), so a gate number is crossed when its colour is. This module turns one into the other and asks the kernel for the rest
 * (`gateSlotsAfter`, `plateAbilityGroup`): it adds no rule of its own. It draws nothing and changes nothing.
 *
 * Only the rows that **keep a status or set an SOS set** are returned (the ten plates of note FFX2-G04 3.4); a row that is a First Strike, a Magic Booster or a stat is the
 * stat builder's and the menu's, not the status layer's, and listing it would only build a layer with nothing in it.
 */

import type { GateColour } from '../../common/types.ts';
import { applyAbilityEffects, emptyChrTables } from '../kernel/ability-effects.ts';
import { plateAbilityGroup } from '../kernel/dressphere-abilities.ts';
import { gateSlotsAfter, type Ffx2GateState } from '../kernel/spherechange.ts';

/** What the engine needs to know about a grid to list its rows: the game's plate number, which colour each gate number wears, and the gate numbers the card has. */
export interface GridPlate {
  /** The game's plate number n (the plate id is `0x6000 + n`). */
  readonly plate: number;
  /** The colour gate number 1, 2, 3, 4 wears on this grid (`null`: no such gate). */
  readonly colourOfGate: ReadonlyArray<GateColour | null>;
  /** The gate numbers (1 to 4) of the card's gate nodes. */
  readonly gates: readonly number[];
}

/** The plate info of a layout, or `undefined` when the layout names no plate. */
export function gridPlateOf(layout: { readonly plate?: number; readonly colourOfGate: ReadonlyArray<GateColour | null>; readonly nodes: ReadonlyArray<readonly [gate: number, x: number, y: number]> }): GridPlate | undefined {
  if (layout.plate === undefined) return undefined;
  const gates = [...new Set(layout.nodes.map(([gate]) => gate).filter((gate) => gate >= 1 && gate <= 4))].sort((a, b) => a - b);
  return { plate: layout.plate, colourOfGate: layout.colourOfGate, gates };
}

/**
 * The gate state the game's evaluation reads (`kernel/grid-path.ts#gateState`): gate k crossed when the colour it wears has been passed; every gate crossed when
 * each of the card's gate nodes is. "Every dressphere node worn" (conditions 101 and 102) is **false**: no plate row uses it (note FFX2-G09 3.5: "7, 101 and 102 are unused
 * data"; `tests/unit/parity-ffx2-grid-status.test.ts` pins that over all 64 plates), and the engine tracks dresspheres worn, not nodes visited.
 */
export function gateStateOf(info: GridPlate, passed: readonly GateColour[]): Ffx2GateState {
  const crossed = (number: number): boolean => {
    const colour = info.colourOfGate[number - 1];
    return colour !== null && colour !== undefined && passed.includes(colour);
  };
  return {
    gates: [crossed(1), crossed(2), crossed(3), crossed(4)],
    allGates: info.gates.every(crossed),
    allJobs: false,
  };
}

const KEEPS = new Map<number, boolean>();

/** Does this auto-ability row keep a status (an ordinary row with a kept mask or count) or set an SOS set (an SOS row)? */
export function keepsStatus(id: number): boolean {
  const known = KEEPS.get(id);
  if (known !== undefined) return known;
  const tables = applyAbilityEffects([id], emptyChrTables());
  const keeps = tables.autoMask1 !== 0 || tables.autoTimes.some((count) => count !== 0) || tables.sosFlag !== 0;
  KEEPS.set(id, keeps);
  return keeps;
}

/** A category 8 id (an auto-ability row) that keeps a status. */
const isStatusRow = (id: number): boolean => id >> 12 === 8 && keepsStatus(id);

/**
 * The rows the gates she has crossed put in her eight gate slots (the kernel's gate evaluation, the slots empty before it), in plate order. A walk only ever adds
 * crossed gates, so the slots the game keeps from an earlier evaluation (stale ones) are always rewritten and the empty start is exact.
 */
export function gateRows(info: GridPlate, passed: readonly GateColour[]): number[] {
  return gateSlotsAfter([], 0x6000 + info.plate, gateStateOf(info, passed)).slots.filter(isStatusRow);
}

const NO_ENV = { level: 0, learned: () => false, keyItem: () => false, gateSlots: [] as number[] };

/** The rows the grid lists as soon as it is worn (the plate row's pairs with condition 0; no mastery is needed). */
export function plateRows(info: GridPlate): number[] {
  return plateAbilityGroup(0x6000 + info.plate, NO_ENV).filter(isStatusRow);
}
