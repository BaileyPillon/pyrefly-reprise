/**
 * Adapter: a Garment Grid's layout (`data/ffx2/garment-grids/layouts.ts`, numbers only) into the engine's grid links (re-parity RC9, lane X2-I; FFX-2 only).
 *
 * The engine already asks two things of a grid: which nodes a girl can move to from her node (`adjacentNodes`), and which gates a move passes (`gatesBetween`), both read off
 * `GarmentGridDef.links`.  The game's rule is the path finder over the card (`kernel/grid-path.ts`): a direct join, or a route through exactly one gate node.  So the links of a
 * real grid are exactly the pairs of dressphere nodes the path finder joins, each with the gate it passes, and nothing else in the engine has to change.
 *
 * **Engine node `i` is the i-th dressphere node of the grid along its ring** (`ringOrder` in the kernel: our numbering, chosen so that the builds, which place their dresspheres for a ring, keep every
 * join they were written for; the cards number gate nodes among the dressphere nodes, the engine's `nodePosition`, its `gridNodes` and the builds' dress placement count dressphere nodes only).
 * Gates wear the colour the layout's own `colourOfGate` names (see `layouts.ts`: not the inferred 1 red, 2 green, 3 yellow, 4 blue for all grids).  No random draw (the grid rules draw nothing).
 */

import type { GateColour } from '../../common/types.ts';
import { dressNodes, gateNumber, movePairs, ringOrder, type Ffx2GridLayout } from '../kernel/grid-path.ts';
import type { GarmentGridDef } from '../internal.ts';

/** A layout as the data ships it: the card's two arrays and the colour each gate number wears on this grid. */
export interface GridLayoutInput extends Ffx2GridLayout {
  readonly colourOfGate: ReadonlyArray<GateColour | null>;
}

/** The colour a gate node wears on this grid; a layout whose table has no colour for one of its own gates is a data error. */
function colourOf(layout: GridLayoutInput, node: number): GateColour {
  const number = gateNumber(layout, node);
  const colour = layout.colourOfGate[number - 1];
  if (!colour) throw new Error(`garment grid layout: gate number ${number} (node ${node}) has no colour`);
  return colour;
}

/** The number of dressphere nodes of a layout (the engine's `GarmentGridDef.nodes`). */
export function layoutNodeCount(layout: Ffx2GridLayout): number {
  return dressNodes(layout).length;
}

/**
 * The engine links of a layout: one per pair of dressphere nodes a move can join, each with the gate colour it crosses (none for a direct join), `from` below `to` in engine nodes and
 * ascending by (from, to), so that the Change rows of any node come out in ascending destination order (`menu.ts` lists them in link order).
 */
export function linksFromLayout(layout: GridLayoutInput): GarmentGridDef['links'] {
  const rank = new Map(ringOrder(layout).map((node, i) => [node, i] as const));
  return movePairs(layout)
    .map(({ a, b, gateNode }) => {
      const x = rank.get(a) ?? 0;
      const y = rank.get(b) ?? 0;
      return { from: Math.min(x, y), to: Math.max(x, y), gates: gateNode === null ? [] : [colourOf(layout, gateNode)] };
    })
    .sort((p, q) => p.from - q.from || p.to - q.to);
}
