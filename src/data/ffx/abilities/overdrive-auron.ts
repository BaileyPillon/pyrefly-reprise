/**
 * Auron's Bushido Overdrives.
 *
 * Source: `research/ffx-combat-core.md` §5.5 (rank/DmgCon/hits) and §5.2
 * (timed-input bonus). All rows `[verified: 2 sources]`.
 *
 * Timed-input bonus (§5.2): `timerMs = 4000` for Auron; same runtime formula
 * as Tidus/Wakka, applied by the engine from the `auron-sequence` minigame
 * result. Marked here via `extra.timedInputBonus: true`.
 *
 * Three-row damage model: Bushido's button sequence can land clean (SUCCESS
 * row -> `power`/`hits`), be broken partway through (FAIL row ->
 * `extra.failPower`/`extra.failHits`), or land clean against a target that
 * resists/is immune to the rider status, which the decompile scores as its
 * own IMMUNE row (`extra.immunePower`/`extra.immuneHits`). Tornado carries no
 * rider status at all, so it has no immune row and omits those two fields.
 *
 * Crit: same rule as Tidus's Swordplay — every entry carries `crit-eligible`.
 *
 * ACCURACY DECISION (2026-09-16, closing the same review `overdrive-tidus.ts`
 * settled): `research/ffx-bfa-yu-yevon.md` §1.3 (lines 101, 107, 108)
 * decompiles three enemy Overdrives — `Strength` formula, `Other` damage
 * type, `category: 'overdrive'` — all flagged "always hits". Dragon Fang/
 * Shooting Star/Banishing Blade/Tornado share that exact signature
 * (`formula: 'strength'`, `damageType: 'other'`, `category: 'overdrive'`).
 * `canMiss: false` is set explicitly on all 4 records below, citing
 * ffx-bfa-yu-yevon.md §1.3 `[verified: 2 sources]`.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §5.5 row 1 [verified: 2 sources]. Rank 5, all enemies. Success 17 DmgCon
   * x1; fail 16 DmgCon x1; immune-row 19 DmgCon x1. Rider is Weak Delay,
   * which is the `'weak-delay'` ActionFlag, not a StatusApplication.
   */
  'dragon-fang': {
    id: 'dragon-fang',
    name: 'Dragon Fang',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 17,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'weak-delay'],
    canReflect: false,
    animationKey: 'overdrive-dragon-fang',
    sfxKey: 'sfx-dragon-fang',
    messageTemplate: '{user} uses {ability}',
    minigame: 'auron-sequence',
    extra: {
      timedInputBonus: true,
      failPower: 16,
      failHits: 1,
      immunePower: 19,
      immuneHits: 1,
      vfxKey: 'vfx-dragon-fang',
    },
  },

  /**
   * §5.5 row 2 [verified: 2 sources]. Rank 5, single enemy. Success 24
   * DmgCon x1; fail 24 DmgCon x1; immune-row 27 DmgCon x1. Rider tries to
   * Eject the target, chance 254 (always unless immune), duration 254.
   */
  'shooting-star': {
    id: 'shooting-star',
    name: 'Shooting Star',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 24,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [{ status: 'eject', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-shooting-star',
    sfxKey: 'sfx-shooting-star',
    messageTemplate: '{user} uses {ability}',
    minigame: 'auron-sequence',
    extra: {
      timedInputBonus: true,
      failPower: 24,
      failHits: 1,
      immunePower: 27,
      immuneHits: 1,
      vfxKey: 'vfx-shooting-star',
    },
  },

  /**
   * §5.5 row 3 [verified: 2 sources]. Rank 6, single enemy. Success 28
   * DmgCon x1; fail 28 DmgCon x1; immune-row 30 DmgCon x1. Rider applies all
   * four Breaks at chance 254, duration 254 each.
   */
  'banishing-blade': {
    id: 'banishing-blade',
    name: 'Banishing Blade',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 28,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [
      { status: 'power-break', chance: 254, duration: 254 },
      { status: 'magic-break', chance: 254, duration: 254 },
      { status: 'armor-break', chance: 254, duration: 254 },
      { status: 'mental-break', chance: 254, duration: 254 },
    ],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-banishing-blade',
    sfxKey: 'sfx-banishing-blade',
    messageTemplate: '{user} uses {ability}',
    minigame: 'auron-sequence',
    extra: {
      timedInputBonus: true,
      failPower: 28,
      failHits: 1,
      immunePower: 30,
      immuneHits: 1,
      vfxKey: 'vfx-banishing-blade',
    },
  },

  /**
   * §5.5 row 4 [verified: 2 sources]. Rank 7 on a successful chain (fail
   * rank 6), all enemies. Success (documented correction) is 20 DmgCon x2
   * hits; fail is 15 DmgCon x1. No rider status at all, so no immune row.
   */
  tornado: {
    id: 'tornado',
    name: 'Tornado',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 7,
    power: 20,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 2,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'overdrive-tornado',
    sfxKey: 'sfx-tornado',
    messageTemplate: '{user} uses {ability}',
    minigame: 'auron-sequence',
    extra: {
      timedInputBonus: true,
      failPower: 15,
      failHits: 1,
      failRank: 6, // rank on the fail branch; preserves the research's "(fail 6)" note
      vfxKey: 'vfx-tornado',
      // No immunePower/immuneHits: Tornado has no rider status, so the
      // immune-row branch does not apply per the coordinating agent's note.
    },
  },
};

export default ABILITIES;
