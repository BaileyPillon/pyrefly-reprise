/**
 * FFX-2 item registry — every `ItemDef` this project ships, keyed by id.
 *
 * Each `ItemDef.effect` resolves into `abilities/index.ts`'s `FFX2_ABILITIES`
 * table (orchestrator decision 7 in `docs/CONTRACT-CHANGES.md`); this module
 * does not duplicate the effect data, only the shop/menu metadata.
 */

import type { AbilityDef, AbilityId, ItemDef, ItemId } from '../../../battle/common/types.ts';

import { recoveryItems } from './recovery.ts';
import { statusItems } from './status.ts';
import { damageItems } from './damage.ts';
import { itemEffectAbilities } from './effects.ts';

export const ALL_FFX2_ITEMS: readonly ItemDef[] = [...recoveryItems, ...statusItems, ...damageItems];

export const FFX2_ITEMS: Record<ItemId, ItemDef> = Object.fromEntries(ALL_FFX2_ITEMS.map((i) => [i.id, i]));

/** Every item-effect `AbilityDef` (the `x2-item-*` ids every `ItemDef.effect` points at). */
export const FFX2_ITEM_EFFECT_ABILITIES: Record<AbilityId, AbilityDef> = Object.fromEntries(
  itemEffectAbilities.map((a) => [a.id, a]),
);

export { recoveryItems, statusItems, damageItems, itemEffectAbilities };

export default FFX2_ITEMS;
