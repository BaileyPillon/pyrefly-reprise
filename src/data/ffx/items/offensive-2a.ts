/**
 * FFX offensive items (via Use), part 1 of 2 of §8.3's second table: the
 * elemental/pure-damage Gem family. Source: `research/ffx-combat-core.md`
 * §8.3 (continued). See `offensive-1a.ts` for the shared conventions (rank
 * 2, `ignores-armored` + `never-break-damage-limit`, `damageType: 'other'`,
 * `accuracy` undefined, `canReflect: false`, `usableInBattle: true` /
 * `usableInMenu: false` `[estimate]`, `price: 0` placeholder,
 * `[single source]`).
 *
 * This is split from the single `offensive-2.ts` the task brief named,
 * purely to stay under the project's ~380-line-per-file guidance. See
 * `offensive-2b.ts` for Purifying Salt, the Hourglasses, the Farplane items,
 * the Springs, and Dark Matter.
 *
 * The four elemental Gems (Ice/Fire/Lightning/Water) explicitly do **not**
 * carry `'crit-eligible'` — the task brief calls this out ("no crit") to
 * distinguish them from Grenade/Frag Grenade in `offensive-1a.ts`.
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Ice Gem: random-enemy, fixed, DmgCon 12, 5 hits (600 base damage per hit),
// Ice. No crit-eligible.
const iceGemEffect: AbilityDef = {
  id: 'ice-gem',
  name: 'Ice Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['ice'],
  targeting: 'random-enemy',
  hits: 5,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-ice-multi',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-ice-shards' },
};

// Fire Gem: random-enemy, fixed, DmgCon 12, 5 hits (600 base damage per hit),
// Fire. No crit-eligible.
const fireGemEffect: AbilityDef = {
  id: 'fire-gem',
  name: 'Fire Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['fire'],
  targeting: 'random-enemy',
  hits: 5,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-fire-multi',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-fire-shards' },
};

// Lightning Gem: random-enemy, fixed, DmgCon 12, 5 hits (600 base damage per
// hit), Lightning. No crit-eligible.
const lightningGemEffect: AbilityDef = {
  id: 'lightning-gem',
  name: 'Lightning Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['lightning'],
  targeting: 'random-enemy',
  hits: 5,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-lightning-multi',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-lightning-shards' },
};

// Water Gem: random-enemy, fixed, DmgCon 12, 5 hits (600 base damage per
// hit), Water. No crit-eligible.
const waterGemEffect: AbilityDef = {
  id: 'water-gem',
  name: 'Water Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 12,
  formula: 'fixed',
  damageType: 'other',
  element: ['water'],
  targeting: 'random-enemy',
  hits: 5,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-water-multi',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-water-shards' },
};

// Shadow Gem: all-enemies, percent-current, DmgCon 8 (50% of each target's
// current HP). No element.
const shadowGemEffect: AbilityDef = {
  id: 'shadow-gem',
  name: 'Shadow Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'percent-current',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-shadow-burst',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-shadow-veil' },
};

// Shining Gem: single-enemy, fixed, DmgCon 120 (6000 base damage). No element.
const shiningGemEffect: AbilityDef = {
  id: 'shining-gem',
  name: 'Shining Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 120,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-gem-burst-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-shining-flash' },
};

// Blessed Gem: single-enemy, fixed, DmgCon 160 (8000 base damage), Holy.
const blessedGemEffect: AbilityDef = {
  id: 'blessed-gem',
  name: 'Blessed Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 160,
  formula: 'fixed',
  damageType: 'other',
  element: ['holy'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-gem-burst-holy',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-blessed-pillar' },
};

// Supreme Gem: all-enemies, fixed, DmgCon 200 (10000 base damage, capped to
// 9999 by the universal `never-break-damage-limit` flag). No element.
const supremeGemEffect: AbilityDef = {
  id: 'supreme-gem',
  name: 'Supreme Gem',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 200,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-gem-burst-massive',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-supreme-flash' },
};

/** The Gem family, keyed by id. See `offensive-2b.ts` for the rest of §8.3's second table. */
export const ITEMS: Record<string, ItemDef> = {
  'ice-gem': {
    id: 'ice-gem',
    name: 'Ice Gem',
    game: 'ffx',
    effect: iceGemEffect,
    targeting: iceGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-ice-gem',
    description: 'Deals ice damage to five random enemies.',
  },
  'fire-gem': {
    id: 'fire-gem',
    name: 'Fire Gem',
    game: 'ffx',
    effect: fireGemEffect,
    targeting: fireGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-fire-gem',
    description: 'Deals fire damage to five random enemies.',
  },
  'lightning-gem': {
    id: 'lightning-gem',
    name: 'Lightning Gem',
    game: 'ffx',
    effect: lightningGemEffect,
    targeting: lightningGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-lightning-gem',
    description: 'Deals lightning damage to five random enemies.',
  },
  'water-gem': {
    id: 'water-gem',
    name: 'Water Gem',
    game: 'ffx',
    effect: waterGemEffect,
    targeting: waterGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-water-gem',
    description: 'Deals water damage to five random enemies.',
  },
  'shadow-gem': {
    id: 'shadow-gem',
    name: 'Shadow Gem',
    game: 'ffx',
    effect: shadowGemEffect,
    targeting: shadowGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-shadow-gem',
    description: 'Deals damage equal to half the current HP of every enemy.',
  },
  'shining-gem': {
    id: 'shining-gem',
    name: 'Shining Gem',
    game: 'ffx',
    effect: shiningGemEffect,
    targeting: shiningGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-shining-gem',
    description: 'Deals massive damage to one enemy.',
  },
  'blessed-gem': {
    id: 'blessed-gem',
    name: 'Blessed Gem',
    game: 'ffx',
    effect: blessedGemEffect,
    targeting: blessedGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-blessed-gem',
    description: 'Deals massive holy damage to one enemy.',
  },
  'supreme-gem': {
    id: 'supreme-gem',
    name: 'Supreme Gem',
    game: 'ffx',
    effect: supremeGemEffect,
    targeting: supremeGemEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-supreme-gem',
    description: 'Deals massive damage to all enemies.',
  },
};

export default ITEMS;
