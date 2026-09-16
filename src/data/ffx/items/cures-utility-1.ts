/**
 * FFX status-cure items, part 1 of 3 (Antidote through Chocobo Wing).
 * Source: `research/ffx-combat-core.md` §8.2.
 *
 * Split from the single `cures-utility.ts` the task brief named, purely to
 * stay under the project's ~380-line-per-file guidance once every item's
 * effect is inlined per `docs/CONTRACT-CHANGES.md` §7. See
 * `cures-utility-2.ts` (Curtains, Tablets, Twin Stars, Stamina Tonic) and
 * `cures-utility-3.ts` (Mana Tonic, Three Stars, Candle of Life, the four
 * Distillers) for the rest of §8.2.
 *
 * Conventions applied to every item in this file (matching `restoratives-1.ts`):
 * - `game: 'ffx'`, `category: 'item'`, `mpCost: 0`, `rank: 2`.
 * - `flags` always include `'ignores-armored'` and `'never-break-damage-limit'`
 *   per the §8 preamble, even for these zero-damage status-only items — the
 *   research states the rule applies to "all items", not just damaging ones.
 * - `damageType: 'other'` throughout.
 * - `accuracy` left undefined; `canReflect: false` throughout.
 * - `usableInBattle: true` and `usableInMenu: true` for every item in this
 *   file (status cures are usable from both the battle Item menu and the
 *   prep-menu Item screen) — `[estimate]`, since §8.2 doesn't spell out menu
 *   usability per item, but nothing marks these as battle-only.
 * - `price: 0` placeholder throughout — price is not in
 *   `research/ffx-combat-core.md` §8; shop pricing is out of scope here.
 * - Confidence tag: `[verified: 2 sources]` throughout, per the §8 preamble's
 *   "marquee values" bucket (see `restoratives-1.ts`'s header for the split
 *   rationale versus the `[single source]` offensive-item files).
 * - Pure-removal items use `formula: 'none'`, `power: 0`, empty
 *   `statusEffects`, and `flags` including `'removes-statuses'` alongside the
 *   two universal item flags.
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Single-status cures — ffx-combat-core §8.2 [verified: 2 sources]
// ---------------------------------------------------------------------------

// Antidote: single-ally, removes Poison.
const antidoteEffect: AbilityDef = {
  id: 'antidote',
  name: 'Antidote',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['poison'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle' },
};

// Soft: single-ally, removes Petrify.
const softEffect: AbilityDef = {
  id: 'soft',
  name: 'Soft',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['petrify'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle' },
};

// Eye Drops: single-ally, removes Darkness.
const eyeDropsEffect: AbilityDef = {
  id: 'eye-drops',
  name: 'Eye Drops',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['darkness'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle' },
};

// Echo Screen: single-ally, removes Silence.
const echoScreenEffect: AbilityDef = {
  id: 'echo-screen',
  name: 'Echo Screen',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['silence'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle' },
};

// Holy Water: single-ally, removes Zombie AND Curse.
const holyWaterEffect: AbilityDef = {
  id: 'holy-water',
  name: 'Holy Water',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['zombie', 'curse'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle' },
};

// Remedy: single-ally, removes Zombie, Petrify, Poison, Confuse, Berserk,
// Sleep, Silence, Darkness, Slow.
const remedyEffect: AbilityDef = {
  id: 'remedy',
  name: 'Remedy',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: ['zombie', 'petrify', 'poison', 'confuse', 'berserk', 'sleep', 'silence', 'darkness', 'slow'],
  flags: ['ignores-armored', 'never-break-damage-limit', 'removes-statuses'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-cure-all',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-cure-sparkle-full' },
};

// ---------------------------------------------------------------------------
// Chocobo Feather / Wing — ffx-combat-core §8.2 [verified: 2 sources]
// `ctb` formula, DmgCon 8: `targetCTB * DmgCon // 16` = halves current CTB.
// The `'heals'` flag inverts the sign so the computed amount *reduces* the
// target's CTB counter instead of adding to it (per `ActionFlag.heals`'s own
// doc comment: "On `ctb` this *reduces* the target's counter").
// ---------------------------------------------------------------------------

// Chocobo Feather: single-ally, halves current CTB and grants Haste.
const chocoboFeatherEffect: AbilityDef = {
  id: 'chocobo-feather',
  name: 'Chocobo Feather',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [{ status: 'haste', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-haste',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-haste-feather' },
};

// Chocobo Wing: all-allies, same as Chocobo Feather but party-wide.
const chocoboWingEffect: AbilityDef = {
  id: 'chocobo-wing',
  name: 'Chocobo Wing',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [{ status: 'haste', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-haste-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-haste-feather-party' },
};

/** Antidote through Chocobo Wing, keyed by id. See `cures-utility-2.ts` / `-3.ts` for the rest of §8.2. */
export const ITEMS: Record<string, ItemDef> = {
  antidote: {
    id: 'antidote',
    name: 'Antidote',
    game: 'ffx',
    effect: antidoteEffect,
    targeting: antidoteEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-antidote',
    description: 'Cures Poison.',
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    game: 'ffx',
    effect: softEffect,
    targeting: softEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-soft',
    description: 'Cures Petrification.',
  },
  'eye-drops': {
    id: 'eye-drops',
    name: 'Eye Drops',
    game: 'ffx',
    effect: eyeDropsEffect,
    targeting: eyeDropsEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-eye-drops',
    description: 'Cures Darkness.',
  },
  'echo-screen': {
    id: 'echo-screen',
    name: 'Echo Screen',
    game: 'ffx',
    effect: echoScreenEffect,
    targeting: echoScreenEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-echo-screen',
    description: 'Cures Silence.',
  },
  'holy-water': {
    id: 'holy-water',
    name: 'Holy Water',
    game: 'ffx',
    effect: holyWaterEffect,
    targeting: holyWaterEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-holy-water',
    description: 'Cures Zombie and Curse.',
  },
  remedy: {
    id: 'remedy',
    name: 'Remedy',
    game: 'ffx',
    effect: remedyEffect,
    targeting: remedyEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-remedy',
    description: 'Cures most negative statuses at once.',
  },
  'chocobo-feather': {
    id: 'chocobo-feather',
    name: 'Chocobo Feather',
    game: 'ffx',
    effect: chocoboFeatherEffect,
    targeting: chocoboFeatherEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-chocobo-feather',
    description: "Halves one ally's recovery time and grants Haste.",
  },
  'chocobo-wing': {
    id: 'chocobo-wing',
    name: 'Chocobo Wing',
    game: 'ffx',
    effect: chocoboWingEffect,
    targeting: chocoboWingEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-chocobo-wing',
    description: "Halves the whole party's recovery time and grants Haste to everyone.",
  },
};

export default ITEMS;
