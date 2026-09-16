/**
 * FFX offensive items (via Use), part 2 of 2 of §8.3's second table:
 * Purifying Salt, the Hourglasses, the Farplane items, the Springs, and Dark
 * Matter. Source: `research/ffx-combat-core.md` §8.3 (continued). See
 * `offensive-2a.ts` for the shared conventions (rank 2, `damageType:
 * 'other'`, `accuracy` undefined, `canReflect: false`, `usableInBattle:
 * true` / `usableInMenu: false` `[estimate]`, `price: 0` placeholder,
 * `[single source]`).
 *
 * Dark Matter is this project's **one documented exception** to the
 * universal "every item carries `never-break-damage-limit`" rule: per the
 * §8 preamble ("all items ... (except Dark Matter) never_break_damage_limit"),
 * Dark Matter instead carries `'always-break-damage-limit'` and sets
 * `breaksDamageLimit: true`. Every other item in this file still carries
 * `'ignores-armored'` + `'never-break-damage-limit'` like every other item
 * in the four files.
 *
 * Silver Hourglass uses `formula: 'ctb'` to *damage* the CTB pool (delaying
 * the target) rather than reduce it — unlike Chocobo Feather/Wing in
 * `cures-utility-1.ts`, it does **not** carry the `'heals'` flag, since the
 * increase to the target's CTB counter is the intended (harmful) effect.
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Purifying Salt: single-enemy, fixed, DmgCon 22 (1100 base damage). ALSO
// removes Shell, Protect, Reflect, all four Nul statuses, Regen and Haste
// from the target — an unusual damage-AND-debuff-removal combo, so it
// carries both the damage flags and 'removes-statuses'.
const purifyingSaltEffect: AbilityDef = {
  id: 'purifying-salt',
  name: 'Purifying Salt',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 22,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['shell', 'protect', 'reflect', 'nulblaze', 'nulfrost', 'nulshock', 'nultide', 'regen', 'haste'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-salt-scatter',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-salt-sparkle' },
};

// Silver Hourglass: all-enemies, ctb formula, DmgCon 8 (+50% of each
// target's current CTB — bad for the target, so NO 'heals' flag), applies
// Slow.
const silverHourglassEffect: AbilityDef = {
  id: 'silver-hourglass',
  name: 'Silver Hourglass',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'slow', chance: 254, duration: 254 }],
  removesStatuses: [],
  // No 'heals' flag: this increases (damages) the target's CTB pool rather
  // than reducing it — the opposite of Chocobo Feather/Wing.
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-hourglass',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-hourglass-sand' },
};

// Gold Hourglass: all-enemies, fixed, DmgCon 20 (1000 base damage), applies
// Slow.
const goldHourglassEffect: AbilityDef = {
  id: 'gold-hourglass',
  name: 'Gold Hourglass',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'slow', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-hourglass',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-hourglass-sand-gold' },
};

// Farplane Shadow: single-enemy, no damage formula; instead carries a
// scripted Death chance. `StatusApplication` has no "instant death" case
// (Death is not a status per `src/battle/common/types.ts`'s doc comments),
// so this is modeled via `extra.deathChance` rather than `statusEffects`.
const farplaneShadowEffect: AbilityDef = {
  id: 'farplane-shadow',
  name: 'Farplane Shadow',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-death-shadow',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-death-shadow-wisp', deathChance: 100 },
};

// Farplane Wind: random-enemy, no damage formula, 4 hits, same Death-chance
// modeling as Farplane Shadow.
const farplaneWindEffect: AbilityDef = {
  id: 'farplane-wind',
  name: 'Farplane Wind',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'random-enemy',
  hits: 4,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-death-wind',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-death-wind-wisp', deathChance: 100 },
};

// Mana Spring: single-enemy, fixed, DmgCon 20 (1000 MP drained from the
// target to the user).
const manaSpringEffect: AbilityDef = {
  id: 'mana-spring',
  name: 'Mana Spring',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'drains-mp'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-drain-mp',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-drain-mp-spring', restoresPool: 'mp' },
};

// Stamina Spring: single-enemy, fixed, DmgCon 8 (400 HP drained from the
// target to the user).
const staminaSpringEffect: AbilityDef = {
  id: 'stamina-spring',
  name: 'Stamina Spring',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'drains'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-drain-hp',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-drain-hp-spring' },
};

// Soul Spring: single-enemy, fixed, DmgCon 30 (1500 HP AND 1500 MP drained
// from the target to the user).
const soulSpringEffect: AbilityDef = {
  id: 'soul-spring',
  name: 'Soul Spring',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 30,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'drains', 'drains-mp'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-drain-both',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-drain-both-spring', restoresPool: 'both' },
};

// Dark Matter: all-enemies, fixed, DmgCon 255 (12750 base damage). The ONE
// exception to the universal never-break-damage-limit rule: carries
// 'always-break-damage-limit' instead, and sets breaksDamageLimit: true.
const darkMatterEffect: AbilityDef = {
  id: 'dark-matter',
  name: 'Dark Matter',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 255,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  // 'always-break-damage-limit' REPLACES 'never-break-damage-limit' here —
  // the one documented exception among all 69 items in this data set.
  flags: ['ignores-armored', 'always-break-damage-limit'],
  breaksDamageLimit: true,
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-dark-matter-detonate',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-dark-matter-void' },
};

/** Purifying Salt, the Hourglasses, the Farplane items, the Springs and Dark Matter, keyed by id. */
export const ITEMS: Record<string, ItemDef> = {
  'purifying-salt': {
    id: 'purifying-salt',
    name: 'Purifying Salt',
    game: 'ffx',
    effect: purifyingSaltEffect,
    targeting: purifyingSaltEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-purifying-salt',
    description: "Deals damage to one enemy and strips its buffs.",
  },
  'silver-hourglass': {
    id: 'silver-hourglass',
    name: 'Silver Hourglass',
    game: 'ffx',
    effect: silverHourglassEffect,
    targeting: silverHourglassEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-silver-hourglass',
    description: 'Delays all enemies and may slow them.',
  },
  'gold-hourglass': {
    id: 'gold-hourglass',
    name: 'Gold Hourglass',
    game: 'ffx',
    effect: goldHourglassEffect,
    targeting: goldHourglassEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-gold-hourglass',
    description: 'Deals damage to all enemies and may slow them.',
  },
  'farplane-shadow': {
    id: 'farplane-shadow',
    name: 'Farplane Shadow',
    game: 'ffx',
    effect: farplaneShadowEffect,
    targeting: farplaneShadowEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-farplane-shadow',
    description: 'May instantly defeat one enemy.',
  },
  'farplane-wind': {
    id: 'farplane-wind',
    name: 'Farplane Wind',
    game: 'ffx',
    effect: farplaneWindEffect,
    targeting: farplaneWindEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-farplane-wind',
    description: 'May instantly defeat up to four random enemies.',
  },
  'mana-spring': {
    id: 'mana-spring',
    name: 'Mana Spring',
    game: 'ffx',
    effect: manaSpringEffect,
    targeting: manaSpringEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mana-spring',
    description: "Drains MP from one enemy to the user.",
  },
  'stamina-spring': {
    id: 'stamina-spring',
    name: 'Stamina Spring',
    game: 'ffx',
    effect: staminaSpringEffect,
    targeting: staminaSpringEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-stamina-spring',
    description: "Drains HP from one enemy to the user.",
  },
  'soul-spring': {
    id: 'soul-spring',
    name: 'Soul Spring',
    game: 'ffx',
    effect: soulSpringEffect,
    targeting: soulSpringEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-soul-spring',
    description: "Drains HP and MP from one enemy to the user.",
  },
  'dark-matter': {
    id: 'dark-matter',
    name: 'Dark Matter',
    game: 'ffx',
    effect: darkMatterEffect,
    targeting: darkMatterEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-dark-matter',
    description: 'Deals catastrophic damage to all enemies, ignoring the normal damage cap.',
  },
};

export default ITEMS;
