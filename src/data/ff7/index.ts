/**
 * The FF7 registry the app hands to the FF7 engine (the engine never imports
 * `src/data`, AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { Ff7Registry } from '../../battle/ff7/defs.ts';
import { FF7_ABILITIES } from './abilities.ts';
import { FF7_EQUIPMENT } from './equipment.ts';
import { FF7_ITEMS } from './items.ts';
import { FF7_LIMIT_TABLES } from './limits.ts';
import { FF7_MATERIA } from './materia.ts';

export { sector1ReactorBuild } from './builds/sector1-reactor.ts';
export { guardScorpion, guardScorpionGroup } from './enemies/guard-scorpion.ts';

/** Build the registry. A fresh object each call; the records are shared read-only data. */
export function ff7Registry(): Ff7Registry {
  return {
    abilities: FF7_ABILITIES,
    items: FF7_ITEMS,
    materia: FF7_MATERIA,
    equipment: FF7_EQUIPMENT,
    limits: FF7_LIMIT_TABLES,
  };
}
