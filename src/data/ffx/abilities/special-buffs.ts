/**
 * Stacking party buffs: Cheer, Focus, Aim, Reflex, Luck, Jinx.
 * Source: `research/ffx-combat-core.md` §2.9 [verified: 2 sources].
 *
 * CATEGORY CONVENTION: every ability in ALL FIVE ffx/abilities data files
 * authored alongside this one uses `category: 'special'`, never `'skill'` —
 * `AbilityCategory` in `battle/common/types.ts` names Cheer, Focus, Aim,
 * Reflex, Luck, Jinx, Pray, Guard, Sentinel, Steal and Use as `'special'` in
 * its own doc comment, and this project extends that same bucket to every
 * other non-Attack/non-magic/non-Overdrive command; `'skill'` is reserved for
 * FFX-2 dressphere abilities.
 *
 * All six are rank-2, 0-MP, party-wide Special commands (decompile rows
 * 26-31) that add +1 stack per use, capped at 5 by the engine. Five are
 * self-buffs targeting the CASTER's own whole party (`all-allies`); Jinx
 * alone targets the enemy side (`all-enemies`) per §7.7: "Jinx +1 on all
 * enemies (max 5)". None deal damage, none roll to hit (`canMiss: false`),
 * none are reflectable (Skill/Special, not Blk/Wht Magic).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ffx-combat-core §2.9 [verified: 2 sources] — row 26. +1 Strength/stack
  // (attacker); physical damage received x(15-stacks)/15 (defender).
  cheer: {
    id: 'cheer',
    name: 'Cheer',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'cheer', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-cheer',
    sfxKey: 'sfx-cheer',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-cheer' },
  },

  // ffx-combat-core §2.9 [verified: 2 sources] — row 27. +10 hit chance/stack.
  aim: {
    id: 'aim',
    name: 'Aim',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'aim', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-aim',
    sfxKey: 'sfx-aim',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-aim' },
  },

  // ffx-combat-core §2.9 [verified: 2 sources] — row 28. +1 Magic/stack;
  // magical/healing damage received x(15-stacks)/15.
  focus: {
    id: 'focus',
    name: 'Focus',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'focus', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-focus',
    sfxKey: 'sfx-focus',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-focus' },
  },

  // ffx-combat-core §2.9 [verified: 2 sources] — row 29. -10 attacker's hit
  // chance/stack (defensive).
  reflex: {
    id: 'reflex',
    name: 'Reflex',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'reflex', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-reflex',
    sfxKey: 'sfx-reflex',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-reflex' },
  },

  // ffx-combat-core §2.9 [verified: 2 sources] — row 30. +1 hit, +10 crit
  // chance/stack.
  luck: {
    id: 'luck',
    name: 'Luck',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'luck', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-luck',
    sfxKey: 'sfx-luck',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-luck' },
  },

  // ffx-combat-core §2.9 [verified: 2 sources] — row 31, cross-referenced with
  // §7.7 ("Jinx +1 on all enemies (max 5)"). +1 attackers' hit vs target,
  // -10 target's effective Luck for crit/stack. Unlike the other five, this
  // targets the ENEMY side.
  jinx: {
    id: 'jinx',
    name: 'Jinx',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [{ status: 'jinx', chance: 254, duration: 254, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    animationKey: 'buff-jinx',
    sfxKey: 'sfx-jinx',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-jinx' },
  },
};
