/**
 * FFX offensive items (via Use), part 1 of 2: the grenade/powder family plus
 * Poison Fang. Source: `research/ffx-combat-core.md` §8.3.
 *
 * Split from the single `offensive-1.ts` the task brief named, purely to
 * stay under the project's ~380-line-per-file guidance once every item's
 * effect is inlined per `docs/CONTRACT-CHANGES.md` §7. See `offensive-1b.ts`
 * for the elemental Wind/Fragment/Marble/Scale family.
 *
 * Conventions applied to every item in this file:
 * - `game: 'ffx'`, `category: 'item'`, `mpCost: 0`, `rank: 2`.
 * - `flags` always include `'ignores-armored'` and `'never-break-damage-limit'`
 *   per the §8 preamble.
 * - `damageType: 'other'` throughout; `formula: 'fixed'` unless noted
 *   (`DmgCon * 50 * (rng + 240) // 256`), except Petrify Grenade which deals
 *   no damage at all (`formula: 'none'`).
 * - `accuracy` left undefined; `canReflect: false` throughout.
 * - `usableInMenu: false` throughout `[estimate]` — offensive items have no
 *   field-menu use; their only legal use is the battle Item/Use command.
 *   `usableInBattle: true` throughout.
 * - `price: 0` placeholder throughout — price is not in
 *   `research/ffx-combat-core.md` §8; shop pricing is out of scope here.
 * - Confidence tag: `[single source]` throughout, per the §8 preamble's split
 *   between "marquee values" (files 1-2, `[verified: 2 sources]`) and "raw
 *   DmgCon bytes" — these are exactly the raw numeric offensive-item
 *   constants the preamble calls out.
 * - `hits: 1` throughout; no item in this file carries an `element` (the
 *   elemental items live in `offensive-1b.ts`).
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Grenade: all-enemies, fixed, DmgCon 7 (350 base damage), crit-eligible.
const grenadeEffect: AbilityDef = {
  id: 'grenade',
  name: 'Grenade',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 7,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-explosion-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-explosion-small' },
};

// Frag Grenade: all-enemies, fixed, DmgCon 16 (800 base damage),
// crit-eligible, applies Armor Break.
const fragGrenadeEffect: AbilityDef = {
  id: 'frag-grenade',
  name: 'Frag Grenade',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 16,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'armor-break', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'crit-eligible'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-explosion-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-explosion-shrapnel' },
};

// Sleeping Powder: all-enemies, fixed, DmgCon 15 (750 base damage), applies
// Sleep (duration 5).
const sleepingPowderEffect: AbilityDef = {
  id: 'sleeping-powder',
  name: 'Sleeping Powder',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 15,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'sleep', chance: 254, duration: 5 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-powder',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-powder-cloud' },
};

// Dream Powder: all-enemies, fixed, DmgCon 20 (1000 base damage), applies
// Sleep (duration 8).
const dreamPowderEffect: AbilityDef = {
  id: 'dream-powder',
  name: 'Dream Powder',
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
  statusEffects: [{ status: 'sleep', chance: 254, duration: 8 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-powder',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-powder-cloud' },
};

// Silence Grenade: all-enemies, fixed, DmgCon 15 (750 base damage), applies
// Silence (duration 8).
const silenceGrenadeEffect: AbilityDef = {
  id: 'silence-grenade',
  name: 'Silence Grenade',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 15,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'silence', chance: 254, duration: 8 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-explosion-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-explosion-silence' },
};

// Smoke Bomb: all-enemies, fixed, DmgCon 15 (750 base damage), applies
// Darkness (duration 8).
const smokeBombEffect: AbilityDef = {
  id: 'smoke-bomb',
  name: 'Smoke Bomb',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 15,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'darkness', chance: 254, duration: 8 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-smoke',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-smoke-cloud' },
};

// Petrify Grenade: all-enemies, no damage, applies Petrify.
const petrifyGrenadeEffect: AbilityDef = {
  id: 'petrify-grenade',
  name: 'Petrify Grenade',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [{ status: 'petrify', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-explosion-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-petrify-cloud' },
};

// Poison Fang: single-enemy, fixed, DmgCon 40 (2000 base damage), applies
// Poison.
const poisonFangEffect: AbilityDef = {
  id: 'poison-fang',
  name: 'Poison Fang',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 40,
  formula: 'fixed',
  damageType: 'other',
  element: [],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [{ status: 'poison', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-throw',
  sfxKey: 'sfx-item-poison-bite',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-poison-splash' },
};

/** Grenade family plus Poison Fang, keyed by id. See `offensive-1b.ts` for the elemental family. */
export const ITEMS: Record<string, ItemDef> = {
  grenade: {
    id: 'grenade',
    name: 'Grenade',
    game: 'ffx',
    effect: grenadeEffect,
    targeting: grenadeEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-grenade',
    description: 'Deals damage to all enemies.',
  },
  'frag-grenade': {
    id: 'frag-grenade',
    name: 'Frag Grenade',
    game: 'ffx',
    effect: fragGrenadeEffect,
    targeting: fragGrenadeEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-frag-grenade',
    description: 'Deals heavy damage to all enemies and breaks their armor.',
  },
  'sleeping-powder': {
    id: 'sleeping-powder',
    name: 'Sleeping Powder',
    game: 'ffx',
    effect: sleepingPowderEffect,
    targeting: sleepingPowderEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-sleeping-powder',
    description: 'Deals damage to all enemies and may put them to sleep.',
  },
  'dream-powder': {
    id: 'dream-powder',
    name: 'Dream Powder',
    game: 'ffx',
    effect: dreamPowderEffect,
    targeting: dreamPowderEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-dream-powder',
    description: 'Deals damage to all enemies and puts them into a deeper sleep.',
  },
  'silence-grenade': {
    id: 'silence-grenade',
    name: 'Silence Grenade',
    game: 'ffx',
    effect: silenceGrenadeEffect,
    targeting: silenceGrenadeEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-silence-grenade',
    description: 'Deals damage to all enemies and may silence them.',
  },
  'smoke-bomb': {
    id: 'smoke-bomb',
    name: 'Smoke Bomb',
    game: 'ffx',
    effect: smokeBombEffect,
    targeting: smokeBombEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-smoke-bomb',
    description: 'Deals damage to all enemies and may blind them.',
  },
  'petrify-grenade': {
    id: 'petrify-grenade',
    name: 'Petrify Grenade',
    game: 'ffx',
    effect: petrifyGrenadeEffect,
    targeting: petrifyGrenadeEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-petrify-grenade',
    description: 'May turn all enemies to stone. Deals no damage.',
  },
  'poison-fang': {
    id: 'poison-fang',
    name: 'Poison Fang',
    game: 'ffx',
    effect: poisonFangEffect,
    targeting: poisonFangEffect.targeting,
    usableInBattle: true,
    usableInMenu: false, // [estimate] offensive items have no field-menu use
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-poison-fang',
    description: 'Deals heavy damage to one enemy and may poison it.',
  },
};

export default ITEMS;
