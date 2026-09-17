/**
 * Yuna's Grand Summon Overdrive.
 *
 * Source: `research/ffx-combat-core.md` §5.4, row 280. `[verified: 2
 * sources]`. Rank 5, costs the full gauge (mechanically represented
 * elsewhere by the Overdrive-fire path consuming `overdrive.gauge`, not by
 * `mpCost`, which stays 0 like every other character Overdrive).
 *
 * This ability deals no damage itself and has no target other than Yuna:
 * it summons her currently-owned aeon with a temporary full Overdrive
 * gauge. `formula: 'none'`, `power: 0`, `hits: 0`, `targeting: 'self'`.
 *
 * ACCURACY DECISION (2026-09-16): self-targeted with no damage, so whether
 * it "rolls accuracy" is moot either way — `canMiss: false` is set
 * explicitly for consistency with every other character Overdrive
 * (`research/ffx-bfa-yu-yevon.md` §1.3, `[estimate]`, same as the other
 * self/no-damage markers in this data set, e.g. the `mix` selector).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §5.4 row 280 [verified: 2 sources]. Summons Yuna's owned aeon with its
   * `AeonFields.temporaryOverdrive` gauge set to 100. After the aeon spends
   * that temporary gauge (firing its own Overdrive), its own stored gauge
   * value is restored rather than staying at 0 — see `AeonFields` in
   * `battle/common/types.ts`.
   */
  'grand-summon': {
    id: 'grand-summon',
    name: 'Grand Summon',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 0,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [estimate] — inert (self-target, no damage); see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-grand-summon',
    sfxKey: 'sfx-grand-summon',
    messageTemplate: '{user} uses {ability}',
    minigame: 'yuna-grand-summon',
    extra: {
      summonsOwnedAeonWithFullGauge: true,
      note: 'after the aeon spends the temporary full gauge its own stored gauge is restored — see AeonFields.temporaryOverdrive in types.ts',
    },
  },
};

export default ABILITIES;
