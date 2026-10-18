/**
 * FFX-2 Garment Grid registry, keyed by id [ffx2-combat-core §4].
 */

import type { GarmentGridId } from '../ids.ts';
import type { GarmentGridDef } from './types.ts';

import { earlyGarmentGrids } from './early.ts';
import { lateGarmentGrids } from './late.ts';
import { GARMENT_GRID_LAYOUTS } from './layouts.ts';

/** Every Grid, with the game's layout (`layouts.ts`) attached where the data covers it (re-parity RC9 lane X2-I). */
export const ALL_GARMENT_GRIDS: readonly GarmentGridDef[] = [...earlyGarmentGrids, ...lateGarmentGrids].map((g) => {
  const layout = GARMENT_GRID_LAYOUTS[g.id];
  return layout ? { ...g, layout } : g;
});

export const GARMENT_GRIDS: Record<GarmentGridId, GarmentGridDef> = Object.fromEntries(
  ALL_GARMENT_GRIDS.map((g) => [g.id, g]),
) as Record<GarmentGridId, GarmentGridDef>;

export { earlyGarmentGrids, lateGarmentGrids, GARMENT_GRID_LAYOUTS };
export type { GarmentGridDef, GarmentGridEffect, GarmentGridGateEffect, GarmentGridLayout, GarmentGridStatBonus } from './types.ts';

export default GARMENT_GRIDS;
