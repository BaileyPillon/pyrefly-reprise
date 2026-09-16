/**
 * FFX status-cure / utility items, part 3 of 3 (Mana Tonic, Three Stars,
 * Candle of Life, and the four Distillers). Source:
 * `research/ffx-combat-core.md` §8.2. See `cures-utility-1.ts` for the
 * shared file-header conventions (rank 2, `ignores-armored` +
 * `never-break-damage-limit`, `damageType: 'other'`, `accuracy` undefined,
 * `canReflect: false`, `usableInBattle: true` / `usableInMenu: true`
 * `[estimate]`, `price: 0` placeholder, `[verified: 2 sources]`).
 *
 * All items in this file use `formula: 'none'`, `power: 0` — none of them
 * deal damage or restore HP/MP.
 *
 * The four Distillers apply no `statusEffects` at all; their entire effect
 * is the `extra.forcesDrop` note (the targeted enemy is forced to drop that
 * sphere type on death). This is scripted death-reward behavior the battle
 * engine's reward code must read from `extra`, not a status or damage
 * amount — there is no dedicated `AbilityDef` field for it.
 */

import type { ItemDef, AbilityDef } from '../../../battle/common/types.ts';

// Mana Tonic: all-allies, doubles max MP for the whole party.
const manaTonicEffect: AbilityDef = {
  id: 'mana-tonic',
  name: 'Mana Tonic',
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
  statusEffects: [{ status: 'max-mp-x2', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow-party' },
};

// Three Stars: all-allies, makes all abilities cost 0 MP for the whole party.
const threeStarsEffect: AbilityDef = {
  id: 'three-stars',
  name: 'Three Stars',
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
  statusEffects: [{ status: 'mp-cost-zero', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-buff-party',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-stat-glow-party' },
};

// Candle of Life: single-enemy, applies Doom. Duration 254 is a placeholder
// per the task brief — the real countdown is per-enemy
// (`EnemyFields.doomTurns`), not a fixed status duration.
const candleOfLifeEffect: AbilityDef = {
  id: 'candle-of-life',
  name: 'Candle of Life',
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
  // duration: 254 [placeholder] — the actual Doom countdown is per-target;
  // see `extra.note` below and `EnemyFields.doomTurns` in the contract.
  statusEffects: [{ status: 'doom', chance: 254, duration: 254 }],
  removesStatuses: [],
  flags: ['ignores-armored', 'never-break-damage-limit'],
  animationKey: 'item-use',
  sfxKey: 'sfx-item-doom',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-doom-candle', note: 'actual doom countdown is per-enemy, see EnemyFields.doomTurns' },
};

// Power Distiller: single-enemy, no damage; forces a Power Sphere drop.
const powerDistillerEffect: AbilityDef = {
  id: 'power-distiller',
  name: 'Power Distiller',
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
  animationKey: 'item-use',
  sfxKey: 'sfx-item-distill',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-distill-sparkle', forcesDrop: 'power-sphere' },
};

// Mana Distiller: single-enemy, no damage; forces a Mana Sphere drop.
const manaDistillerEffect: AbilityDef = {
  id: 'mana-distiller',
  name: 'Mana Distiller',
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
  animationKey: 'item-use',
  sfxKey: 'sfx-item-distill',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-distill-sparkle', forcesDrop: 'mana-sphere' },
};

// Speed Distiller: single-enemy, no damage; forces a Speed Sphere drop.
const speedDistillerEffect: AbilityDef = {
  id: 'speed-distiller',
  name: 'Speed Distiller',
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
  animationKey: 'item-use',
  sfxKey: 'sfx-item-distill',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-distill-sparkle', forcesDrop: 'speed-sphere' },
};

// Ability Distiller: single-enemy, no damage; forces an Ability Sphere drop.
const abilityDistillerEffect: AbilityDef = {
  id: 'ability-distiller',
  name: 'Ability Distiller',
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
  animationKey: 'item-use',
  sfxKey: 'sfx-item-distill',
  messageTemplate: '{user} uses {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-item-distill-sparkle', forcesDrop: 'ability-sphere' },
};

/** Mana Tonic, Three Stars, Candle of Life and the four Distillers, keyed by id. */
export const ITEMS: Record<string, ItemDef> = {
  'mana-tonic': {
    id: 'mana-tonic',
    name: 'Mana Tonic',
    game: 'ffx',
    effect: manaTonicEffect,
    targeting: manaTonicEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mana-tonic',
    description: "Doubles the whole party's maximum MP for the rest of the battle.",
  },
  'three-stars': {
    id: 'three-stars',
    name: 'Three Stars',
    game: 'ffx',
    effect: threeStarsEffect,
    targeting: threeStarsEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-three-stars',
    description: "Makes the whole party's abilities cost no MP for the rest of the battle.",
  },
  'candle-of-life': {
    id: 'candle-of-life',
    name: 'Candle of Life',
    game: 'ffx',
    effect: candleOfLifeEffect,
    targeting: candleOfLifeEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-candle-of-life',
    description: 'Inflicts Doom on an enemy.',
  },
  'power-distiller': {
    id: 'power-distiller',
    name: 'Power Distiller',
    game: 'ffx',
    effect: powerDistillerEffect,
    targeting: powerDistillerEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-power-distiller',
    description: 'Forces a targeted enemy to drop a Power Sphere on defeat.',
  },
  'mana-distiller': {
    id: 'mana-distiller',
    name: 'Mana Distiller',
    game: 'ffx',
    effect: manaDistillerEffect,
    targeting: manaDistillerEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-mana-distiller',
    description: 'Forces a targeted enemy to drop a Mana Sphere on defeat.',
  },
  'speed-distiller': {
    id: 'speed-distiller',
    name: 'Speed Distiller',
    game: 'ffx',
    effect: speedDistillerEffect,
    targeting: speedDistillerEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-speed-distiller',
    description: 'Forces a targeted enemy to drop a Speed Sphere on defeat.',
  },
  'ability-distiller': {
    id: 'ability-distiller',
    name: 'Ability Distiller',
    game: 'ffx',
    effect: abilityDistillerEffect,
    targeting: abilityDistillerEffect.targeting,
    usableInBattle: true,
    usableInMenu: true,
    price: 0, // price not in ffx-combat-core.md — 0 placeholder, shop pricing is out of scope for this data agent
    iconKey: 'icon-ability-distiller',
    description: 'Forces a targeted enemy to drop an Ability Sphere on defeat.',
  },
};

export default ITEMS;
