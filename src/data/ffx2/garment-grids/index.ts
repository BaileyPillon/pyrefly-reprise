/**
 * FFX-2 Garment Grid registry, keyed by id [ffx2-combat-core §4].
 */

import type { GarmentGridId } from '../ids.ts';
import type { GarmentGridDef } from './types.ts';

import { earlyGarmentGrids } from './early.ts';
import { lateGarmentGrids } from './late.ts';

export const ALL_GARMENT_GRIDS: readonly GarmentGridDef[] = [...earlyGarmentGrids, ...lateGarmentGrids];

export const GARMENT_GRIDS: Record<GarmentGridId, GarmentGridDef> = Object.fromEntries(
  ALL_GARMENT_GRIDS.map((g) => [g.id, g]),
) as Record<GarmentGridId, GarmentGridDef>;

export { earlyGarmentGrids, lateGarmentGrids };
export type { GarmentGridDef, GarmentGridEffect, GarmentGridGateEffect, GarmentGridStatBonus } from './types.ts';

export default GARMENT_GRIDS;
