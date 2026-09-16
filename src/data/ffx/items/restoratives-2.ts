/**
 * FFX restorative items, part 2 of 2 (Megalixir, revival items, Al Bhed
 * Potion, Healing Water, Tetra Elemental). Source:
 * `research/ffx-combat-core.md` §8.1. See `restoratives-1.ts` for the file
 * header explaining the split and the conventions shared by every item here
 * (rank 2, `ignores-armored` + `never-break-damage-limit`, `damageType:
 * 'other'`, `accuracy` undefined, `canReflect: false`, `usableInBattle: true`
 * / `usableInMenu: true`, `price: 0` placeholder, `[verified: 2 sources]`).
 *
 * Revival items (Phoenix Down, Mega Phoenix) additionally carry
 * `'misses-if-target-alive'` and `'can-target-dead'` alongside `'heals'` —
 * they fail against a living target, but a living **Zombie** is still
 * processed and killed by the same flag interaction (engine behavior, not
 * extra data modeled here).
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Megalixir: all-allies, percent-total, DmgCon 16 (full HP and MP, party-wide).
const megalixirEffect: AbilityDef = {
  id: 'megalixir',
  name: 'Megalixir',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 16,
  formula: 'percent-total',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-full-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst-party', restoresPool: 'both' },
};

// Phoenix Down: single-any (targets a KO'd ally), percent-total, DmgCon 8
// (revive at 50% max HP).
const phoenixDownEffect: AbilityDef = {
  id: 'phoenix-down',
  name: 'Phoenix Down',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'percent-total',
  damageType: 'other',
  element: [],
  targeting: 'single-any',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals', 'misses-if-target-alive', 'can-target-dead'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-revive',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-revive-feather' },
};

// Mega Phoenix: all-allies, percent-total, DmgCon 16 (revive at 100% max HP,
// party-wide; same Zombie-killing behavior as Phoenix Down).
const megaPhoenixEffect: AbilityDef = {
  id: 'mega-phoenix',
  name: 'Mega Phoenix',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 16,
  formula: 'percent-total',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals', 'misses-if-target-alive', 'can-target-dead'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-revive-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-revive-feather-party' },
};

// Al Bhed Potion: all-allies, fixed-no-variance, DmgCon 20 (+1000 HP AND
// removes Petrify, Poison, Silence). Both heals AND removes statuses, so it
// carries both 'heals' and 'removes-statuses'.
const albhedPotionEffect: AbilityDef = {
  id: 'al-bhed-potion',
  name: 'Al Bhed Potion',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['petrify', 'poison', 'silence'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-cure-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst-party' },
};

// Healing Water: all-allies, percent-total, DmgCon 16 (full HP, party-wide).
const healingWaterEffect: AbilityDef = {
  id: 'healing-water',
  name: 'Healing Water',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 16,
  formula: 'percent-total',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-full-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst-party' },
};

// Tetra Elemental: single-ally, percent-total, DmgCon 16 (full HP) plus one
// charge each of NulBlaze/NulFrost/NulShock/NulTide. `StatusApplication` has
// no dedicated "charges" field (that lives on `StatusInstance.charges`
// instead), so `duration: 1` stands in for "1 charge" here per the task
// brief's "duration/charges 1" guidance.
const tetraElementalEffect: AbilityDef = {
  id: 'tetra-elemental',
  name: 'Tetra Elemental',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 16,
  formula: 'percent-total',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [
    { status: 'nulblaze', chance: 254, duration: 1 },
    { status: 'nulfrost', chance: 254, duration: 1 },
    { status: 'nulshock', chance: 254, duration: 1 },
    { status: 'nultide', chance: 254, duration: 1 },
  ],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-elemental',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-elemental-shield' },
};

/** Megalixir, revival items, Al Bhed Potion, Healing Water and Tetra Elemental, keyed by id. */
export const ITEMS: Record<string, ItemDef> = {
  megalixir: {
    id: 'megalixir',
    name: 'Megalixir',
    game: 'ffx',
    effect: megalixirEffect,
    targeting: megalixirEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-megalixir',
    description: 'Fully restores HP and MP to the whole party.',
  },
  'phoenix-down': {
    id: 'phoenix-down',
    name: 'Phoenix Down',
    game: 'ffx',
    effect: phoenixDownEffect,
    targeting: phoenixDownEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-phoenix-down',
    description: 'Revives a fallen ally with a little HP.',
  },
  'mega-phoenix': {
    id: 'mega-phoenix',
    name: 'Mega Phoenix',
    game: 'ffx',
    effect: megaPhoenixEffect,
    targeting: megaPhoenixEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mega-phoenix',
    description: 'Revives all fallen allies at full HP.',
  },
  'al-bhed-potion': {
    id: 'al-bhed-potion',
    name: 'Al Bhed Potion',
    game: 'ffx',
    effect: albhedPotionEffect,
    targeting: albhedPotionEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-al-bhed-potion',
    description: 'Restores HP and cures Petrify, Poison and Silence for the whole party.',
  },
  'healing-water': {
    id: 'healing-water',
    name: 'Healing Water',
    game: 'ffx',
    effect: healingWaterEffect,
    targeting: healingWaterEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-healing-water',
    description: 'Fully restores HP to the whole party.',
  },
  'tetra-elemental': {
    id: 'tetra-elemental',
    name: 'Tetra Elemental',
    game: 'ffx',
    effect: tetraElementalEffect,
    targeting: tetraElementalEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-tetra-elemental',
    description: 'Fully restores HP and shields against all four elements.',
  },
};

export default ITEMS;
