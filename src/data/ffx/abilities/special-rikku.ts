/**
 * Rikku's Special commands: Steal, Mug, Bribe, Pilfer Gil, Nab Gil, Quick
 * Pockets, Copycat, Doublecast, Use.
 * Source: `research/ffx-combat-core.md` §7.6 (Doublecast is Lulu's ability,
 * §7.4, but is grouped into this file per the coordinator's file split).
 *
 * CATEGORY CONVENTION: every ability here uses `category: 'special'`, never
 * `'skill'` — see `special-buffs.ts` for the full rationale (this project
 * resolves the `AbilityCategory` ambiguity by putting every non-Attack/
 * non-magic/non-Overdrive command in `'special'`; `'skill'` is reserved for
 * FFX-2 dressphere abilities).
 *
 * Blanket rule for every no-damage command below (all except Mug/Nab Gil,
 * which resolve a physical attack first): `damageType: 'other'`, `hits: 1`,
 * `statusEffects: []`, `removesStatuses: []`, `canMiss: false` (no hit roll
 * — these are rolls/menus, not attacks) and `canReflect: false` (Skill/
 * Special commands are never reflectable).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ffx-combat-core §7.6 — row 22, rank 3, MP 0, single-enemy. Steals an
  // item, no damage. `canMiss: false` because success/failure is governed by
  // its own roll model (not a hit-table check) — the exact model is in
  // `extra.stealRoll` [verified: 2 sources] per §7.8.1.
  steal: {
    id: 'steal',
    name: 'Steal',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-steal',
    sfxKey: 'sfx-steal',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-steal',
      stealRoll:
        'chance = monster.steal.baseChance >> successfulSteals (integer halving), independent 32/256 rare-vs-common roll on success — ffx-combat-core §7.8.1 [verified: 2 sources]',
    },
  },

  // ffx-combat-core §7.6 — row 20, rank 3, MP 10, single-enemy. Strength
  // formula, DmgCon 16, physical, standard weapon-property flags. The attack
  // resolves first, then an identical steal roll sharing Steal's own
  // per-monster counter (`extra.sharesStealCounterWith`).
  mug: {
    id: 'mug',
    name: 'Mug',
    game: 'ffx',
    category: 'special',
    mpCost: 10,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['inherits-weapon-properties', 'adds-equipment-crit', 'crit-eligible', 'affected-by-darkness'],
    animationKey: 'special-mug',
    sfxKey: 'sfx-mug',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-mug', sharesStealCounterWith: 'steal' },
  },

  // ffx-combat-core §7.6 — row 42, rank 3, MP 0, single-enemy. Bribe roll:
  // `chance = int(gil*256/maxHP/20)-64`, 0% below 5x maxHP, 100% at 25x
  // maxHP — ffx-combat-core §7.8.2 [verified: 2 sources]. The actual gil
  // amount comes from the runtime ItemCommand/prompt, not this AbilityDef.
  // [estimate] `canMiss: false`: like Steal, success/failure is governed
  // entirely by the bribe roll in `extra`, not a hit-table check — research
  // does not restate "always hits" for Bribe explicitly, but the mechanic is
  // structurally identical to Steal's.
  bribe: {
    id: 'bribe',
    name: 'Bribe',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['ignores-armored'],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-bribe',
    sfxKey: 'sfx-bribe',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-bribe',
      bribeRoll:
        'chance = int(gil*256/maxHP/20)-64, 0% below 5x maxHP, 100% at 25x maxHP — ffx-combat-core §7.8.2 [verified: 2 sources]',
    },
  },

  // ffx-combat-core §7.6 — row 88, rank 3, MP 20, single-enemy. Steals gil
  // using the same roll model as Steal, but tracked on a SEPARATE
  // per-monster counter from Steal's item counter.
  'pilfer-gil': {
    id: 'pilfer-gil',
    name: 'Pilfer Gil',
    game: 'ffx',
    category: 'special',
    mpCost: 20,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-pilfer-gil',
    sfxKey: 'sfx-pilfer-gil',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-pilfer-gil',
      stealRoll: 'same formula as Steal, separate per-monster gil-steal counter',
    },
  },

  // ffx-combat-core §7.6 — row 94, rank 3, MP 30, single-enemy. Strength
  // formula, DmgCon 16, physical, standard weapon-property flags. Attack
  // resolves first, then a Pilfer-Gil-style roll sharing ITS OWN counter
  // (`extra.sharesStealCounterWith: 'pilfer-gil'`).
  'nab-gil': {
    id: 'nab-gil',
    name: 'Nab Gil',
    game: 'ffx',
    category: 'special',
    mpCost: 30,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['inherits-weapon-properties', 'adds-equipment-crit', 'crit-eligible', 'affected-by-darkness'],
    animationKey: 'special-nab-gil',
    sfxKey: 'sfx-nab-gil',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-nab-gil', sharesStealCounterWith: 'pilfer-gil' },
  },

  // ffx-combat-core §7.6 — row 95, rank 1 (not the usual rank 2), MP 70,
  // self. Opens the Item menu at rank 1 instead of the normal rank 2.
  'quick-pockets': {
    id: 'quick-pockets',
    name: 'Quick Pockets',
    game: 'ffx',
    category: 'special',
    mpCost: 70,
    rank: 1,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-quick-pockets',
    sfxKey: 'sfx-quick-pockets',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-quick-pockets', opensItemMenuAtRank: 1 },
  },

  // ffx-combat-core §7.6 — row 40, rank 3, MP 28, single-any. Repeats
  // whatever the previous ally action targeted (`extra.repeatsPreviousAllyAction`).
  copycat: {
    id: 'copycat',
    name: 'Copycat',
    game: 'ffx',
    category: 'special',
    mpCost: 28,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-copycat',
    sfxKey: 'sfx-copycat',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-copycat', repeatsPreviousAllyAction: true, fixedRank: 3 },
  },

  // ffx-combat-core §7.4 — row 41, rank 3, MP 0 (the two chosen Black Magic
  // spells pay their own MP separately, per `extra.note`). This is Lulu's
  // ability, not Rikku's, but is grouped into this file by the coordinator's
  // file split.
  doublecast: {
    id: 'doublecast',
    name: 'Doublecast',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-doublecast',
    sfxKey: 'sfx-doublecast',
    messageTemplate: '{user} uses {ability}',
    extra: {
      vfxKey: 'vfx-doublecast',
      castsTwoBlackMagicSpells: true,
      fixedRank: 3,
      note: 'MP cost is 0 here; the two chosen spells own MP costs are paid separately by the engine',
    },
  },

  // ffx-combat-core §7.6 — row 23, rank 2, MP 0, self. Opens the
  // "special items" submenu (gems/tablets/distillers/springs).
  use: {
    id: 'use',
    name: 'Use',
    game: 'ffx',
    category: 'special',
    mpCost: 0,
    rank: 2,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    animationKey: 'special-use',
    sfxKey: 'sfx-use',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-use', opensSubmenu: 'special-items' },
  },
};
