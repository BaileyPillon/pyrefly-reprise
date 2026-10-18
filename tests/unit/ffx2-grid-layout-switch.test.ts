/**
 * **`GRID_LAYOUTS = false` restores the ring estimate for every grid** (re-parity RC9 lane X2-I, follow-up D1; `FFX2-G09`; **FFX-2 only**).
 *
 * The switch (`src/battle/ffx2/constants.ts#GRID_LAYOUTS`) is the lane's rollback: false makes the registry ignore every layout the data carries and lay each grid out as it did before, a ring of its
 * node count with the gates spread one to a successive link. This file mocks the switch off and checks all 44 grids, the six that follow-up D1 corrected included, so that the rollback is proved
 * for the whole data and not only for the 39 the first lane covered. The corrected data (node counts, effects) stays: only the links go back to the ring.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/battle/ffx2/constants.ts', async (importOriginal) => {
  const m = await importOriginal<Record<string, unknown>>();
  return { ...m, GRID_LAYOUTS: false };
});

import { GRID_LAYOUTS } from '../../src/battle/ffx2/constants.ts';
import { garmentGridRegistryFrom } from '../../src/battle/ffx2/index.ts';
import type { DataGarmentGrid } from '../../src/battle/ffx2/index.ts';
import { GARMENT_GRIDS } from '../../src/data/ffx2/garment-grids/index.ts';

const grids = Object.values(GARMENT_GRIDS);
const registry = garmentGridRegistryFrom(grids as unknown as DataGarmentGrid[]);

describe('GRID_LAYOUTS = false: the old ring for every one of the 44 grids', () => {
  it('the mock took (the switch reads false here) and the data still carries a layout for every grid', () => {
    expect(GRID_LAYOUTS).toBe(false);
    expect(grids).toHaveLength(44);
    expect(grids.filter((g) => g.layout === undefined)).toHaveLength(0);
  });

  for (const grid of grids) {
    it(`${grid.id}: a ring of ${Math.max(2, Math.min(6, grid.nodeCount))} nodes, the data's gate colours one to a link in the data's order, the bonuses the data lists`, () => {
      const def = registry.get(grid.id);
      expect(def, grid.id).toBeDefined();
      const nodes = Math.max(2, Math.min(6, grid.nodeCount));
      expect(def?.nodes).toBe(nodes);
      const want: Array<{ from: number; to: number; gates: string[] }> = [];
      for (let i = 0; i < nodes; i++) {
        if (nodes === 2 && i === 1) break; // a two-node grid has the one link
        const gate = grid.gateColours[i];
        want.push({ from: i, to: (i + 1) % nodes, gates: gate ? [gate] : [] });
      }
      expect(def?.links).toEqual(want);
      expect(def?.bonuses.length, 'one bonus for the equip effect when there is one, one for each gate effect').toBe((grid.equip ? 1 : 0) + grid.gateEffects.length);
    });
  }
});
