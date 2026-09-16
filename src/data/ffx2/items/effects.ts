/**
 * Item-effect ability barrel [ffx2-combat-core §2.9.3, §5.5, verified: 2 sources].
 *
 * Per `docs/CONTRACT-CHANGES.md` orchestrator decision 7, `ItemDef.effect` is
 * always an `AbilityId` — items register their effect as an ability with
 * `category: 'item'`. The actual data is split three ways to stay under the
 * per-file line budget: `effects-recovery.ts`, `effects-status.ts`,
 * `effects-damage.ts`. This file only merges them.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

import { recoveryEffectAbilities } from './effects-recovery.ts';
import { statusEffectAbilities } from './effects-status.ts';
import { damageEffectAbilities } from './effects-damage.ts';

export const itemEffectAbilities: AbilityDef[] = [
  ...recoveryEffectAbilities,
  ...statusEffectAbilities,
  ...damageEffectAbilities,
];

export { recoveryEffectAbilities, statusEffectAbilities, damageEffectAbilities };

export default itemEffectAbilities;
