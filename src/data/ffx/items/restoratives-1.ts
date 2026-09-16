/**
 * FFX restorative items, part 1 of 2 (Potion line, Ether line, Elixir).
 * Source: `research/ffx-combat-core.md` §8.1.
 *
 * This is split from the single `restoratives.ts` the task brief named,
 * purely to stay under the project's ~380-line-per-file guidance once every
 * item's effect is inlined per `docs/CONTRACT-CHANGES.md` §7 (items register
 * their effect as an ability with `category: 'item'`, inlined directly on
 * `ItemDef.effect` rather than via a separate ability registry). See
 * `restoratives-2.ts` for the rest of §8.1 (Megalixir onward).
 *
 * Conventions applied to every item in this file:
 * - `game: 'ffx'`, `category: 'item'`, `mpCost: 0`, `rank: 2` (all items are
 *   rank 2 per the §8 preamble).
 * - `flags` always include `'ignores-armored'` and `'never-break-damage-limit'`
 *   — "All items are rank 2, all carry ignores_armored and (except Dark
 *   Matter) never_break_damage_limit" [ffx-combat-core §8 preamble,
 *   verified: 2 sources]. Dark Matter (the sole exception) lives in
 *   `offensive-2b.ts`, not this file.
 * - `damageType: 'other'` throughout — items never interact with
 *   Protect/Shell/Berserk/Power-Break/Magic-Break; they use their own
 *   dedicated rank-2 / ignores-armored / never-break-damage-limit rules
 *   instead of the physical/magical modifier chain.
 * - `accuracy` is left undefined for every item (items don't use the
 *   action-owned accuracy byte).
 * - `canReflect: false` throughout — items are never reflectable.
 * - Every HP/MP-restoring item also carries the `'heals'` flag so the engine
 *   flips the computed `fixed-no-variance` / `percent-total` amount to
 *   negative (healing) rather than damage. This also means a HP-restoring
 *   item damages a Zombie for the same amount, per the engine's existing
 *   Zombie sign-flip — no extra data needed here for that rule.
 * - `usableInBattle: true` and `usableInMenu: true` for every item in this
 *   file (restoratives are usable from both the battle Item menu and the
 *   prep-menu Item screen).
 * - `price: 0` placeholder throughout — price is not in
 *   `research/ffx-combat-core.md` §8, and shop pricing is out of scope for
 *   this data agent.
 * - Confidence tag: every item in this file cites `[verified: 2 sources]`
 *   per the §8 preamble's split between "marquee values" (the well-known
 *   named consumable effects transcribed in §8.1/§8.2) and "raw DmgCon
 *   bytes" (the offensive items' numeric constants in §8.3, tagged
 *   `[single source]` in `offensive-1a.ts` etc. instead).
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Potion line — ffx-combat-core §8.1 [verified: 2 sources]
// ---------------------------------------------------------------------------

// Potion: single-ally, fixed-no-variance, DmgCon 4 (+200 HP flat).
const potionEffect: AbilityDef = {
  id: 'potion',
  name: 'Potion',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 4,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-sparkle' },
};

// Hi-Potion: single-ally, fixed-no-variance, DmgCon 20 (+1000 HP flat).
const hiPotionEffect: AbilityDef = {
  id: 'hi-potion',
  name: 'Hi-Potion',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 20,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-medium',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-sparkle' },
};

// X-Potion: single-ally, percent-total, DmgCon 16 (full HP).
const xPotionEffect: AbilityDef = {
  id: 'x-potion',
  name: 'X-Potion',
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
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-full',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst' },
};

// Mega-Potion: all-allies, fixed-no-variance, DmgCon 40 (+2000 HP each).
const megaPotionEffect: AbilityDef = {
  id: 'mega-potion',
  name: 'Mega-Potion',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 40,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst-party' },
};

// ---------------------------------------------------------------------------
// Ether line — ffx-combat-core §8.1 [verified: 2 sources]
// Both restore the MP pool rather than HP; `formula` is still
// `fixed-no-variance`, applied to MP instead of HP. `AbilityDef` has no
// separate "pool" field, so the pool is noted via `extra.restoresPool`.
// ---------------------------------------------------------------------------

// Ether: single-ally, fixed-no-variance, DmgCon 2 (+100 MP flat).
const etherEffect: AbilityDef = {
  id: 'ether',
  name: 'Ether',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 2,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-mp-small',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-mp-sparkle', restoresPool: 'mp' },
};

// Turbo Ether: single-ally, fixed-no-variance, DmgCon 10 (+500 MP flat).
const turboEtherEffect: AbilityDef = {
  id: 'turbo-ether',
  name: 'Turbo Ether',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 10,
  formula: 'fixed-no-variance',
  damageType: 'other',
  element: [],
  targeting: 'single-ally',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-mp-large',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-mp-sparkle', restoresPool: 'mp' },
};

// Elixir: single-ally, percent-total, DmgCon 16 (full HP AND full MP).
const elixirEffect: AbilityDef = {
  id: 'elixir',
  name: 'Elixir',
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
  statusEffects: [],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit', 'heals'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-heal-full',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-heal-burst', restoresPool: 'both' },
};

/** Potion/Ether/Elixir-line items, keyed by id. See `restoratives-2.ts` for the rest of §8.1. */
export const ITEMS: Record<string, ItemDef> = {
  potion: {
    id: 'potion',
    name: 'Potion',
    game: 'ffx',
    effect: potionEffect,
    targeting: potionEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-potion',
    description: 'Restores a small amount of HP to one ally.',
  },
  'hi-potion': {
    id: 'hi-potion',
    name: 'Hi-Potion',
    game: 'ffx',
    effect: hiPotionEffect,
    targeting: hiPotionEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-hi-potion',
    description: 'Restores a moderate amount of HP to one ally.',
  },
  'x-potion': {
    id: 'x-potion',
    name: 'X-Potion',
    game: 'ffx',
    effect: xPotionEffect,
    targeting: xPotionEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-x-potion',
    description: 'Fully restores HP to one ally.',
  },
  'mega-potion': {
    id: 'mega-potion',
    name: 'Mega-Potion',
    game: 'ffx',
    effect: megaPotionEffect,
    targeting: megaPotionEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mega-potion',
    description: 'Restores a large amount of HP to the whole party.',
  },
  ether: {
    id: 'ether',
    name: 'Ether',
    game: 'ffx',
    effect: etherEffect,
    targeting: etherEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-ether',
    description: 'Restores a small amount of MP to one ally.',
  },
  'turbo-ether': {
    id: 'turbo-ether',
    name: 'Turbo Ether',
    game: 'ffx',
    effect: turboEtherEffect,
    targeting: turboEtherEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-turbo-ether',
    description: 'Restores a large amount of MP to one ally.',
  },
  elixir: {
    id: 'elixir',
    name: 'Elixir',
    game: 'ffx',
    effect: elixirEffect,
    targeting: elixirEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-elixir',
    description: 'Fully restores HP and MP to one ally.',
  },
};

export default ITEMS;
