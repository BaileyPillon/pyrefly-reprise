/**
 * Lulu's Fury Overdrives (1/2): the 12 elemental tiers (Fire/Blizzard/
 * Thunder/Water through their -ra and -ga tiers).
 *
 * Source: `research/ffx-combat-core.md` §5.7. All rows `[verified: 2
 * sources]`.
 *
 * Every Fury spell — this file and `overdrive-lulu-2.ts` together, all 19 —
 * shares these traits:
 * - `formula: 'magic'` (Demi Fury alone overrides to `'percent-current'`,
 *   see the other file), `damageType: 'other'`.
 * - `targeting: 'random-enemy'` (Demi Fury and Ultima Fury alone target
 *   `'all-enemies'`, see the other file).
 * - `minigame: 'lulu-fury'`, `hits: 16` — this is the cast-count CAP, not a
 *   fixed hit count. The actual number of casts per use of the Overdrive
 *   comes from the `lulu-fury` minigame's `FuryResult` at runtime
 *   (`min(16, sweptDegrees / degreesPerCast)`), not from this static field.
 * - No `crit-eligible` flag: nothing in the research states Fury can crit.
 * - No `timedInputBonus`: "Lulu's timer always reaches 0, so Fury gets no
 *   [§5.2] bonus" — Fury is excluded from the Tidus/Auron/Wakka timed-input
 *   bonus entirely.
 * - `canReflect: false` — Fury bypasses Shell/Reflect like every character
 *   Overdrive; `damageType: 'other'` already covers Shell.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 5, Fire element. */
  'fire-fury': {
    id: 'fire-fury',
    name: 'Fire Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 5,
    formula: 'magic',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-fire-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-fire-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 5, Ice element. */
  'blizzard-fury': {
    id: 'blizzard-fury',
    name: 'Blizzard Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 5,
    formula: 'magic',
    damageType: 'other',
    element: ['ice'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-blizzard-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-blizzard-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 5, Thunder element (`'lightning'`). */
  'thunder-fury': {
    id: 'thunder-fury',
    name: 'Thunder Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 5,
    formula: 'magic',
    damageType: 'other',
    element: ['lightning'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-thunder-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-thunder-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 5, Water element. */
  'water-fury': {
    id: 'water-fury',
    name: 'Water Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 5,
    formula: 'magic',
    damageType: 'other',
    element: ['water'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-water-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-water-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 10, Fire element. */
  'fira-fury': {
    id: 'fira-fury',
    name: 'Fira Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 10,
    formula: 'magic',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-fira-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-fira-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 10, Ice element. */
  'blizzara-fury': {
    id: 'blizzara-fury',
    name: 'Blizzara Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 10,
    formula: 'magic',
    damageType: 'other',
    element: ['ice'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-blizzara-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-blizzara-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 10, Thunder element (`'lightning'`). */
  'thundara-fury': {
    id: 'thundara-fury',
    name: 'Thundara Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 10,
    formula: 'magic',
    damageType: 'other',
    element: ['lightning'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-thundara-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-thundara-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 10, Water element. */
  'watera-fury': {
    id: 'watera-fury',
    name: 'Watera Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 10,
    formula: 'magic',
    damageType: 'other',
    element: ['water'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-watera-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-watera-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 18, Fire element. */
  'firaga-fury': {
    id: 'firaga-fury',
    name: 'Firaga Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 18,
    formula: 'magic',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-firaga-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-firaga-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 18, Ice element. */
  'blizzaga-fury': {
    id: 'blizzaga-fury',
    name: 'Blizzaga Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 18,
    formula: 'magic',
    damageType: 'other',
    element: ['ice'],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-blizzaga-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-blizzaga-fury' },
  },
};

export default ABILITIES;
