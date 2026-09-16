/** Special dressphere registry [ffx2-combat-core §3.15]. */

import type { SpecialDressphereId } from '../../ids.ts';
import type { SpecialDressphereDef } from './types.ts';

import { floralFallal } from './floral-fallal.ts';
import { machinaMaw } from './machina-maw.ts';
import { fullThrottle } from './full-throttle.ts';

export const SPECIAL_DRESSPHERES: Record<SpecialDressphereId, SpecialDressphereDef> = {
  'floral-fallal': floralFallal,
  'machina-maw': machinaMaw,
  'full-throttle': fullThrottle,
};

export { floralFallal, machinaMaw, fullThrottle };
export { nodeScale } from './types.ts';
export type { SpecialDressphereDef, SpecialPartGrowth } from './types.ts';

export default SPECIAL_DRESSPHERES;
