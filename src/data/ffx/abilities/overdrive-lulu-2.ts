/**
 * Lulu's Fury Overdrives (2/2): the remaining -ga tiers plus the seven
 * "special" Fury spells (Bio/Demi/Death/Drain/Osmose/Flare/Ultima).
 *
 * Source: `research/ffx-combat-core.md` §5.7. All rows `[verified: 2
 * sources]`.
 *
 * Shared traits (see `overdrive-lulu-1.ts` header for the full rationale):
 * `formula: 'magic'` except Demi Fury (`'percent-current'`); `damageType:
 * 'other'`; `targeting: 'random-enemy'` except Demi Fury and Ultima Fury
 * (`'all-enemies'`); `minigame: 'lulu-fury'`; `hits: 16` as the cast-count
 * cap, not a fixed number; no `crit-eligible`; no `timedInputBonus` (Lulu's
 * timer always reaches 0); `canReflect: false`.
 *
 * Death Fury status modeling: matches this project's Black Magic `death`
 * convention (`blackmagic-advanced.ts`) — Death is not a `FFXStatusId`
 * literal, it is the same `'ko'` outcome a depleted HP bar produces, and its
 * chance-80 roll is a flat byte, not the standard `chance - resistance >
 * rng % 101` formula a `StatusApplication` implies. So `death-fury` ships
 * `statusEffects: []` and the raw chance byte lives at `extra.deathChance:
 * 80`; the engine rolls that on its own Death-specific path and applies
 * `'ko'` directly on success, not via the generic status pipeline.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 18, Thunder element (`'lightning'`). */
  'thundaga-fury': {
    id: 'thundaga-fury',
    name: 'Thundaga Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 18,
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
    sfxKey: 'sfx-thundaga-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-thundaga-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 5, DmgCon 18, Water element. */
  'waterga-fury': {
    id: 'waterga-fury',
    name: 'Waterga Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 18,
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
    sfxKey: 'sfx-waterga-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-waterga-fury' },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 5, DmgCon 0, non-elemental. Pure
   * status: tries Poison at chance 80, duration 254.
   */
  'bio-fury': {
    id: 'bio-fury',
    name: 'Bio Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [{ status: 'poison', chance: 80, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-bio-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-bio-fury' },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 6, DmgCon 2, non-elemental, all
   * enemies. The one Fury that overrides the shared `formula: 'magic'` to
   * `'percent-current'`: damage = `targetCurrentHP * DmgCon // 16` (DmgCon 2
   * = 12.5% of current HP).
   */
  'demi-fury': {
    id: 'demi-fury',
    name: 'Demi Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 6,
    power: 2,
    formula: 'percent-current',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-demi-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-demi-fury' },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 5, DmgCon 0, non-elemental. Tries to
   * instantly KO the target at a flat chance of 80 — see the file header's
   * "Death Fury status modeling" note for why this is `extra.deathChance`
   * rather than a `StatusApplication` entry.
   */
  'death-fury': {
    id: 'death-fury',
    name: 'Death Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [], // Death is not a StatusApplication here — see file header.
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-death-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: {
      deathChance: 80, // raw chance byte; engine rolls it on the Death-specific KO path, not the generic status pipeline
      vfxKey: 'vfx-death-fury',
    },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 4, DmgCon 9, non-elemental. Damage
   * dealt is added to Lulu's own HP via the `drains` flag.
   */
  'drain-fury': {
    id: 'drain-fury',
    name: 'Drain Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4,
    power: 9,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains'],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-drain-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-drain-fury' },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 4, DmgCon 4, non-elemental. As Drain
   * Fury, but against the target's MP pool, credited to Lulu's own MP via
   * the `drains-mp` flag.
   */
  'osmose-fury': {
    id: 'osmose-fury',
    name: 'Osmose Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4,
    power: 4,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: ['drains-mp'],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-osmose-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-osmose-fury' },
  },

  /** §5.7 [verified: 2 sources]. Rank 7, DmgCon 22, non-elemental. */
  'flare-fury': {
    id: 'flare-fury',
    name: 'Flare Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 7,
    power: 22,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-flare-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-flare-fury' },
  },

  /**
   * §5.7 [verified: 2 sources]. Rank 10, DmgCon 26, non-elemental, all
   * enemies — the strongest Fury spell.
   */
  'ultima-fury': {
    id: 'ultima-fury',
    name: 'Ultima Fury',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 10,
    power: 26,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 16,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'overdrive-lulu-fury',
    sfxKey: 'sfx-ultima-fury-cast',
    messageTemplate: '{user} uses {ability}',
    minigame: 'lulu-fury',
    extra: { vfxKey: 'vfx-ultima-fury' },
  },
};

export default ABILITIES;
