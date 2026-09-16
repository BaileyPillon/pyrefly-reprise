/**
 * FFX offensive items (via Use), part 2 of 2: the elemental
 * Wind/Fragment/Marble/Scale family. Source: `research/ffx-combat-core.md`
 * §8.3. See `offensive-1a.ts` for the shared file-header conventions
 * (rank 2, `ignores-armored` + `never-break-damage-limit`, `damageType:
 * 'other'`, `formula: 'fixed'`, `accuracy` undefined, `canReflect: false`,
 * `usableInBattle: true` / `usableInMenu: false` `[estimate]`, `price: 0`
 * placeholder, `[single source]`).
 *
 * Every item here is `single-enemy`, `hits: 1`, carries exactly one element,
 * and has no `statusEffects` or extra flags beyond the two universal item
 * flags — none of the eight are marked `crit-eligible` in §8.3 (unlike
 * Grenade/Frag Grenade in `offensive-1a.ts`).
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Antarctic Wind: single-enemy, fixed, DmgCon 12 (600 base damage), Ice.
const antarcticWindEffect: AbilityDef = {
  id: 'antarctic-wind',
  name: 'Antarctic Wind',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['ice'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-ice-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-ice-burst-small' },
};

// Bomb Fragment: single-enemy, fixed, DmgCon 12 (600 base damage), Fire.
const bombFragmentEffect: AbilityDef = {
  id: 'bomb-fragment',
  name: 'Bomb Fragment',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['fire'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-fire-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-fire-burst-small' },
};

// Electro Marble: single-enemy, fixed, DmgCon 12 (600 base damage), Lightning.
const electroMarbleEffect: AbilityDef = {
  id: 'electro-marble',
  name: 'Electro Marble',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['lightning'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-lightning-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-lightning-burst-small' },
};

// Fish Scale: single-enemy, fixed, DmgCon 12 (600 base damage), Water.
const fishScaleEffect: AbilityDef = {
  id: 'fish-scale',
  name: 'Fish Scale',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['water'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-water-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-water-burst-small' },
};

// Arctic Wind: single-enemy, fixed, DmgCon 20 (1000 base damage), Ice.
const arcticWindEffect: AbilityDef = {
  id: 'arctic-wind',
  name: 'Arctic Wind',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: ['ice'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-ice-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-ice-burst-large' },
};

// Bomb Core: single-enemy, fixed, DmgCon 20 (1000 base damage), Fire.
const bombCoreEffect: AbilityDef = {
  id: 'bomb-core',
  name: 'Bomb Core',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: ['fire'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-fire-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-fire-burst-large' },
};

// Lightning Marble: single-enemy, fixed, DmgCon 20 (1000 base damage), Lightning.
const lightningMarbleEffect: AbilityDef = {
  id: 'lightning-marble',
  name: 'Lightning Marble',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: ['lightning'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-lightning-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-lightning-burst-large' },
};

// Dragon Scale: single-enemy, fixed, DmgCon 20 (1000 base damage), Water.
const dragonScaleEffect: AbilityDef = {
  id: 'dragon-scale',
  name: 'Dragon Scale',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  element: ['water'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-water-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-water-burst-large' },
};

/** Elemental Wind/Fragment/Marble/Scale family, keyed by id. See `offensive-1a.ts` for the grenade family. */
export const ITEMS: Record<string, ItemDef> = {
  'antarctic-wind': {
    id: 'antarctic-wind',
    name: 'Antarctic Wind',
    game: 'ffx',
    effect: antarcticWindEffect,
    targeting: antarcticWindEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-antarctic-wind',
    description: 'Deals ice damage to one enemy.',
  },
  'bomb-fragment': {
    id: 'bomb-fragment',
    name: 'Bomb Fragment',
    game: 'ffx',
    effect: bombFragmentEffect,
    targeting: bombFragmentEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-bomb-fragment',
    description: 'Deals fire damage to one enemy.',
  },
  'electro-marble': {
    id: 'electro-marble',
    name: 'Electro Marble',
    game: 'ffx',
    effect: electroMarbleEffect,
    targeting: electroMarbleEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-electro-marble',
    description: 'Deals lightning damage to one enemy.',
  },
  'fish-scale': {
    id: 'fish-scale',
    name: 'Fish Scale',
    game: 'ffx',
    effect: fishScaleEffect,
    targeting: fishScaleEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-fish-scale',
    description: 'Deals water damage to one enemy.',
  },
  'arctic-wind': {
    id: 'arctic-wind',
    name: 'Arctic Wind',
    game: 'ffx',
    effect: arcticWindEffect,
    targeting: arcticWindEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-arctic-wind',
    description: 'Deals heavy ice damage to one enemy.',
  },
  'bomb-core': {
    id: 'bomb-core',
    name: 'Bomb Core',
    game: 'ffx',
    effect: bombCoreEffect,
    targeting: bombCoreEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-bomb-core',
    description: 'Deals heavy fire damage to one enemy.',
  },
  'lightning-marble': {
    id: 'lightning-marble',
    name: 'Lightning Marble',
    game: 'ffx',
    effect: lightningMarbleEffect,
    targeting: lightningMarbleEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-lightning-marble',
    description: 'Deals heavy lightning damage to one enemy.',
  },
  'dragon-scale': {
    id: 'dragon-scale',
    name: 'Dragon Scale',
    game: 'ffx',
    effect: dragonScaleEffect,
    targeting: dragonScaleEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-dragon-scale',
    description: 'Deals heavy water damage to one enemy.',
  },
};

export default ITEMS;
