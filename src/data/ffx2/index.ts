/**
 * FFX-2 data — top-level lookup tables for `BattleSetup`.
 *
 * `docs/encounters.ts` imports the five chapter records directly from
 * `builds/*.ts` and `enemies/*.ts` (see those files); this module is the
 * single place the FFX-2 engine (`src/battle/ffx2/**`) can pull every
 * `AbilityDef`, `ItemDef`, dressphere and Garment Grid this project ships,
 * keyed by id, plus the two chapters' `EnemyGroupDef`s.
 *
 * Per the FFX-2 engine's own `docs/CONTRACT-CHANGES.md` entry (2026-09-15,
 * "`BattleResult.nextGroupId` and `FFX2MemberBuild.statuses`"), boot code
 * wires the engine up with `FFX2_ABILITIES`, `FFX2_ITEMS`,
 * `STANDARD_DRESSPHERES` and `GARMENT_GRIDS` — this module exports exactly
 * those names (`FFX2_ABILITIES`/`FFX2_ITEMS` are the complete, merged tables:
 * standard + special-dressphere + shared/Garment-Grid-granted + item-effect +
 * boss abilities, not just the standard-dressphere subset that
 * `abilities/index.ts` alone provides). `statsAtLevel` for the `statsFn`
 * argument is re-exported from `dresspheres/index.ts` (via `growth.ts`).
 */

import type { AbilityDef, AbilityId, ItemDef, ItemId } from '../../battle/common/types.ts';

import { FFX2_ABILITIES as STANDARD_ABILITIES, ALL_FFX2_ABILITIES as STANDARD_ABILITY_LIST } from './abilities/index.ts';
import { FFX2_ITEMS, ALL_FFX2_ITEMS, itemEffectAbilities } from './items/index.ts';
import { STANDARD_DRESSPHERES, SPECIAL_DRESSPHERES, statsAtLevel, statAtLevel } from './dresspheres/index.ts';
import { GARMENT_GRIDS, ALL_GARMENT_GRIDS } from './garment-grids/index.ts';
import { ENEMY_GROUPS, ENEMY_GROUPS_BY_ID, ALL_BOSS_ABILITIES } from './enemies/index.ts';
import { bevelleBuild } from './builds/bevelle.ts';
import { farplaneBuild } from './builds/farplane.ts';

/** Every AbilityDef this project ships (standard/special dresspheres, shared, item effects, and bosses), keyed by id. */
export const ALL_ABILITIES: readonly AbilityDef[] = [...STANDARD_ABILITY_LIST, ...itemEffectAbilities, ...ALL_BOSS_ABILITIES];
export const ABILITIES: Record<AbilityId, AbilityDef> = {
  ...STANDARD_ABILITIES,
  ...Object.fromEntries(itemEffectAbilities.map((a) => [a.id, a])),
  ...Object.fromEntries(ALL_BOSS_ABILITIES.map((a) => [a.id, a])),
};

/** Every ItemDef this project ships, keyed by id. */
export const ITEMS: Record<ItemId, ItemDef> = FFX2_ITEMS;

/** Aliases matching the FFX-2 engine's own boot-wiring names (`docs/CONTRACT-CHANGES.md`). */
export const FFX2_ABILITIES: Record<AbilityId, AbilityDef> = ABILITIES;
export { FFX2_ITEMS };

export {
  STANDARD_DRESSPHERES,
  SPECIAL_DRESSPHERES,
  GARMENT_GRIDS,
  ALL_GARMENT_GRIDS,
  ENEMY_GROUPS,
  ENEMY_GROUPS_BY_ID,
  ALL_FFX2_ITEMS,
  bevelleBuild,
  farplaneBuild,
  statsAtLevel,
  statAtLevel,
};

export default {
  ABILITIES,
  ITEMS,
  FFX2_ABILITIES,
  FFX2_ITEMS,
  STANDARD_DRESSPHERES,
  SPECIAL_DRESSPHERES,
  GARMENT_GRIDS,
  ENEMY_GROUPS_BY_ID,
};
