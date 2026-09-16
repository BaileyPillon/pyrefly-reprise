/**
 * FFX status-cure / utility items, part 2 of 3 (Lunar Curtain through Stamina
 * Tonic). Source: `research/ffx-combat-core.md` §8.2. See
 * `cures-utility-1.ts` for the shared file-header conventions (rank 2,
 * `ignores-armored` + `never-break-damage-limit`, `damageType: 'other'`,
 * `accuracy` undefined, `canReflect: false`, `usableInBattle: true` /
 * `usableInMenu: true` `[estimate]`, `price: 0` placeholder,
 * `[verified: 2 sources]`).
 *
 * All items in this file use `formula: 'none'`, `power: 0` — they are pure
 * status applications with no damage/healing component. `Stamina Tablet`,
 * `Mana Tablet`, `Twin Stars` and `Stamina Tonic` apply the three mix/tonic
 * flag statuses (`'max-hp-x2'`, `'max-mp-x2'`, `'mp-cost-zero'`) that exist
 * verbatim as `FFXStatusId` literals per `src/battle/common/types.ts`.
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Curtains — ffx-combat-core §8.2 [verified: 2 sources]
// Each grants its named buff at chance 254, duration 254 (until battle end,
// per the status semantics table in `src/battle/common/types.ts`).
// ---------------------------------------------------------------------------

// Lunar Curtain: single-ally, grants Shell.
const lunarCurtainEffect: AbilityDef = {
  id: 'lunar-curtain',
  name: 'Lunar Curtain',
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
  statusEffects: [{ status: 'shell', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-shell-glow' },
};

// Light Curtain: single-ally, grants Protect.
const lightCurtainEffect: AbilityDef = {
  id: 'light-curtain',
  name: 'Light Curtain',
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
  statusEffects: [{ status: 'protect', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-protect-glow' },
};

// Star Curtain: single-ally, grants Reflect.
const starCurtainEffect: AbilityDef = {
  id: 'star-curtain',
  name: 'Star Curtain',
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
  statusEffects: [{ status: 'reflect', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-reflect-glow' },
};

// Healing Spring: single-ally, grants Regen (10 turns per the status
// semantics table). Chance 254 is `[estimate — "assume" per the task brief]`,
// since §8.2 does not print an explicit chance byte for this item.
const healingSpringEffect: AbilityDef = {
  id: 'healing-spring',
  name: 'Healing Spring',
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
  // chance: 254 [estimate] — assumed per the task brief ("chance 254(assume)").
  statusEffects: [{ status: 'regen', chance: 254, duration: 10 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-regen-glow' },
};

// ---------------------------------------------------------------------------
// Mix/tonic flag items — ffx-combat-core §8.2 [verified: 2 sources]
// No immediate heal; each applies one whole-battle flag status.
// ---------------------------------------------------------------------------

// Stamina Tablet: single-ally, doubles max HP (no immediate heal).
const staminaTabletEffect: AbilityDef = {
  id: 'stamina-tablet',
  name: 'Stamina Tablet',
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
  statusEffects: [{ status: 'max-hp-x2', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow' },
};

// Mana Tablet: single-ally, doubles max MP.
const manaTabletEffect: AbilityDef = {
  id: 'mana-tablet',
  name: 'Mana Tablet',
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
  statusEffects: [{ status: 'max-mp-x2', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow' },
};

// Twin Stars: single-ally, makes all abilities cost 0 MP.
const twinStarsEffect: AbilityDef = {
  id: 'twin-stars',
  name: 'Twin Stars',
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
  statusEffects: [{ status: 'mp-cost-zero', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow' },
};

// Stamina Tonic: all-allies, doubles max HP for the whole party.
const staminaTonicEffect: AbilityDef = {
  id: 'stamina-tonic',
  name: 'Stamina Tonic',
  game: 'ffx',
  category: 'item',
  mpCost: 0,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  element: [],
  targeting: 'all-allies',
  hits: 1,
  statusEffects: [{ status: 'max-hp-x2', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow-party' },
};

/** Lunar Curtain through Stamina Tonic, keyed by id. See `cures-utility-1.ts` / `-3.ts` for the rest of §8.2. */
export const ITEMS: Record<string, ItemDef> = {
  'lunar-curtain': {
    id: 'lunar-curtain',
    name: 'Lunar Curtain',
    game: 'ffx',
    effect: lunarCurtainEffect,
    targeting: lunarCurtainEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-lunar-curtain',
    description: 'Grants Shell to one ally.',
  },
  'light-curtain': {
    id: 'light-curtain',
    name: 'Light Curtain',
    game: 'ffx',
    effect: lightCurtainEffect,
    targeting: lightCurtainEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-light-curtain',
    description: 'Grants Protect to one ally.',
  },
  'star-curtain': {
    id: 'star-curtain',
    name: 'Star Curtain',
    game: 'ffx',
    effect: starCurtainEffect,
    targeting: starCurtainEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-star-curtain',
    description: 'Grants Reflect to one ally.',
  },
  'healing-spring': {
    id: 'healing-spring',
    name: 'Healing Spring',
    game: 'ffx',
    effect: healingSpringEffect,
    targeting: healingSpringEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-healing-spring',
    description: 'Grants Regen to one ally.',
  },
  'stamina-tablet': {
    id: 'stamina-tablet',
    name: 'Stamina Tablet',
    game: 'ffx',
    effect: staminaTabletEffect,
    targeting: staminaTabletEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-stamina-tablet',
    description: "Doubles one ally's maximum HP for the rest of the battle.",
  },
  'mana-tablet': {
    id: 'mana-tablet',
    name: 'Mana Tablet',
    game: 'ffx',
    effect: manaTabletEffect,
    targeting: manaTabletEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mana-tablet',
    description: "Doubles one ally's maximum MP for the rest of the battle.",
  },
  'twin-stars': {
    id: 'twin-stars',
    name: 'Twin Stars',
    game: 'ffx',
    effect: twinStarsEffect,
    targeting: twinStarsEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-twin-stars',
    description: "Makes one ally's abilities cost no MP for the rest of the battle.",
  },
  'stamina-tonic': {
    id: 'stamina-tonic',
    name: 'Stamina Tonic',
    game: 'ffx',
    effect: staminaTonicEffect,
    targeting: staminaTonicEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-stamina-tonic',
    description: "Doubles the whole party's maximum HP for the rest of the battle.",
  },
};

export default ITEMS;
