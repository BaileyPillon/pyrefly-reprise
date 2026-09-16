/**
 * Lulu's elemental Black Magic: the four base spells and their `-ra`/`-ga`
 * tiers (Fire, Blizzard, Thunder, Water x3 tiers each = 12 abilities).
 * Source: `research/ffx-combat-core.md` §7.4.
 *
 * Shared rules applied to every entry below, per §7.4:
 * - Formula `magic`: POWER = `(mag^2 // 6 + DmgCon) * DmgCon // 4`, offensive
 *   stat MAG + Focus stacks.
 * - "FFX Thunder" is spelled `'lightning'` in this codebase's `ElementId`
 *   union [`battle/common/types.ts` §1] — Thunder/Thundara/Thundaga all carry
 *   `element: ['lightning']`.
 * - "All single-target Blk Magic is reflectable and Silence-blocked" — every
 *   spell here is single-target, so all twelve carry the `reflectable` flag
 *   and `canReflect: true`.
 * - Magic can crit per §2.12 and nothing excludes Black Magic, so every spell
 *   carries `crit-eligible`.
 * - Only the tier-1 spells (Fire/Blizzard/Thunder/Water) carry a shatter
 *   chance against Petrified targets; the `-ra`/`-ga` tiers do not.
 *
 * All rows are `[verified: 2 sources]` per §7.4 unless noted otherwise inline.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ---------------------------------------------------------------------
  // Tier 1: rank 3, MP 4, DmgCon 12, shatterChance 10 [ffx-combat-core §7.4]
  // ---------------------------------------------------------------------

  fire: {
    id: 'fire',
    name: 'Fire',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 4,
    rank: 3,
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    element: ['fire'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible', 'shatter'],
    shatterChance: 10,
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-fire-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-fire-hit' },
  },

  blizzard: {
    id: 'blizzard',
    name: 'Blizzard',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 4,
    rank: 3,
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    element: ['ice'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible', 'shatter'],
    shatterChance: 10,
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-blizzard-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-blizzard-hit' },
  },

  thunder: {
    // NOTE: FFX "Thunder" -> ElementId 'lightning' per battle/common/types.ts §1.
    id: 'thunder',
    name: 'Thunder',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 4,
    rank: 3,
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    element: ['lightning'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible', 'shatter'],
    shatterChance: 10,
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-thunder-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-thunder-hit' },
  },

  water: {
    id: 'water',
    name: 'Water',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 4,
    rank: 3,
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    element: ['water'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible', 'shatter'],
    shatterChance: 10,
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-water-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-water-hit' },
  },

  // ---------------------------------------------------------------------
  // Tier 2 (-ra): rank 3, MP 8, DmgCon 24, no shatter [ffx-combat-core §7.4]
  // ---------------------------------------------------------------------

  fira: {
    id: 'fira',
    name: 'Fira',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 8,
    rank: 3,
    power: 24,
    formula: 'magic',
    damageType: 'magical',
    element: ['fire'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-fira-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-fira-hit' },
  },

  blizzara: {
    id: 'blizzara',
    name: 'Blizzara',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 8,
    rank: 3,
    power: 24,
    formula: 'magic',
    damageType: 'magical',
    element: ['ice'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-blizzara-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-blizzara-hit' },
  },

  thundara: {
    id: 'thundara',
    name: 'Thundara',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 8,
    rank: 3,
    power: 24,
    formula: 'magic',
    damageType: 'magical',
    element: ['lightning'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-thundara-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-thundara-hit' },
  },

  watera: {
    id: 'watera',
    name: 'Watera',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 8,
    rank: 3,
    power: 24,
    formula: 'magic',
    damageType: 'magical',
    element: ['water'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-watera-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-watera-hit' },
  },

  // ---------------------------------------------------------------------
  // Tier 3 (-ga): rank 3, MP 16, DmgCon 42, no shatter [ffx-combat-core §7.4]
  // ---------------------------------------------------------------------

  firaga: {
    id: 'firaga',
    name: 'Firaga',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 16,
    rank: 3,
    power: 42,
    formula: 'magic',
    damageType: 'magical',
    element: ['fire'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-firaga-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-firaga-hit' },
  },

  blizzaga: {
    id: 'blizzaga',
    name: 'Blizzaga',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 16,
    rank: 3,
    power: 42,
    formula: 'magic',
    damageType: 'magical',
    element: ['ice'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-blizzaga-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-blizzaga-hit' },
  },

  thundaga: {
    id: 'thundaga',
    name: 'Thundaga',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 16,
    rank: 3,
    power: 42,
    formula: 'magic',
    damageType: 'magical',
    element: ['lightning'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-thundaga-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-thundaga-hit' },
  },

  waterga: {
    id: 'waterga',
    name: 'Waterga',
    game: 'ffx',
    category: 'blackmagic',
    mpCost: 16,
    rank: 3,
    power: 42,
    formula: 'magic',
    damageType: 'magical',
    element: ['water'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['reflectable', 'crit-eligible'],
    canReflect: true,
    animationKey: 'cast-black-magic',
    sfxKey: 'sfx-waterga-cast',
    messageTemplate: '{user} casts {ability}',
    extra: { vfxKey: 'vfx-waterga-hit' },
  },
};

export default ABILITIES;
