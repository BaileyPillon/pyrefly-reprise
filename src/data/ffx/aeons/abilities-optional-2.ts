/**
 * FFX Aeon actions — continuation of `aeons/abilities-optional.ts` (the
 * Magus Sisters: Cindy/Sandy/Mindy, plus the three shared aeon
 * sub-commands Shield/Boost/Dismiss), split out to stay under this
 * project's ~380-line data file guideline. See `abilities-optional.ts`'s
 * header for the full deviation notes quoted from `research/ffx-combat-
 * core.md` §6.2/§6.3 `[verified: 2 sources]`; summary relevant to this
 * file:
 * - **Delta Attack** (shared Magus Sisters Overdrive) uses
 *   `formula:'strength'`, not the usual `'special-magic'` — §6.3 states
 *   this explicitly ("Int/HD version" 6-hit variant), matching Anima's
 *   Oblivion exception in the sibling file.
 * - **Shield/Boost** apply the like-named status to the user (self);
 *   duration `1` is a placeholder for "until the aeon's next turn" (see
 *   `StatusId` doc comment for `shield`/`boost` in
 *   `battle/common/types.ts`) since `StatusApplication` has no dedicated
 *   "until next turn" duration enum.
 * - **Dismiss**'s raw rank byte is `0`; stored as `0` here rather than
 *   pre-resolved to 3, per `AbilityDef.rank`'s documented fallback.
 * - `minigame: null` on every entry.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  // ---------------------------------------------------------------------
  // Magus Sisters — optional aeon (Remiem Temple), one summon / three
  // actors (Cindy, Sandy, Mindy). Each has her own Attack + Special; all
  // three share Nul-All and the Delta Attack Overdrive.
  // ---------------------------------------------------------------------

  'cindy-attack': {
    id: 'cindy-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 5,
    power: 14, // DmgCon 14 [ffx-combat-core §6.3, verified: 2 sources]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-cindy-attack' },
  },

  'sandy-attack': {
    id: 'sandy-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 5,
    power: 14, // DmgCon 14
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-sandy-attack' },
  },

  'mindy-attack': {
    id: 'mindy-attack',
    name: 'Attack',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 5,
    power: 14, // DmgCon 14
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'piercing'],
    animationKey: 'aeon-attack',
    sfxKey: 'sfx-aeon-attack',
    messageTemplate: '{user} attacks {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-mindy-attack' },
  },

  camisade: {
    id: 'camisade',
    name: 'Camisade',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 5,
    power: 21, // DmgCon 21
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-cindy',
    sfxKey: 'sfx-camisade',
    messageTemplate: '{user} uses Camisade on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-camisade' },
  },

  razzia: {
    id: 'razzia',
    name: 'Razzia',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 5,
    power: 21, // DmgCon 21
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-sandy',
    sfxKey: 'sfx-razzia',
    messageTemplate: '{user} uses Razzia on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-razzia' },
  },

  passado: {
    id: 'passado',
    name: 'Passado',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 2, // DmgCon 2 per hit
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 15,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-special-mindy',
    sfxKey: 'sfx-passado',
    messageTemplate: '{user} uses Passado on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-passado' },
  },

  'nul-all-aeon': {
    id: 'nul-all-aeon',
    name: 'Nul-All',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-ally',
    element: [],
    hits: 1,
    // One charge of each of the four Nul statuses, matching the existing
    // NulBlaze/NulFrost/NulShock/NulTide modelling convention (chance 254,
    // duration 1 = one charge placeholder) [estimate: §6.3 describes the
    // effect in prose, not as an explicit chance/duration byte pair].
    statusEffects: [
      { status: 'nulblaze', chance: 254, duration: 1 },
      { status: 'nulfrost', chance: 254, duration: 1 },
      { status: 'nulshock', chance: 254, duration: 1 },
      { status: 'nultide', chance: 254, duration: 1 },
    ],
    removesStatuses: [],
    flags: [],
    animationKey: 'aeon-special-magus-sisters',
    sfxKey: 'sfx-nul-all',
    messageTemplate: '{user} uses Nul-All on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-nul-all' },
  },

  'delta-attack': {
    id: 'delta-attack',
    name: 'Delta Attack',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 5,
    power: 10, // DmgCon 10 per hit (Int/HD 6-hit version)
    // Exception: shared with Oblivion — Strength, not Special Magic.
    formula: 'strength',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // [estimate] — not restated beyond DmgCon in §6.3.
    hits: 6,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    animationKey: 'aeon-overdrive-magus-sisters',
    sfxKey: 'sfx-delta-attack',
    messageTemplate: '{user} uses Delta Attack on {target}',
    minigame: null,
    extra: { vfxKey: 'vfx-delta-attack' },
  },

  // ---------------------------------------------------------------------
  // Shared aeon sub-commands — every aeon has these three [ffx-combat-core
  // §6.2, verified: 2 sources]. Category 'aeon', rank 3, targeting 'self'.
  // ---------------------------------------------------------------------

  shield: {
    id: 'shield',
    name: 'Shield',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    // All damage AND healing received //4 (-75%); Overdrive gain negated
    // entirely while active. Duration 1 = "until the aeon's next turn"
    // placeholder (see file header).
    statusEffects: [{ status: 'shield', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [],
    animationKey: 'aeon-shield',
    sfxKey: 'sfx-aeon-shield',
    messageTemplate: '{user} uses Shield',
    minigame: null,
    extra: { vfxKey: 'vfx-aeon-shield' },
  },

  boost: {
    id: 'boost',
    name: 'Boost',
    game: 'ffx',
    category: 'aeon',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    // All damage/healing received x1.5; Overdrive gauge fills x1.5 too.
    statusEffects: [{ status: 'boost', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [],
    animationKey: 'aeon-boost',
    sfxKey: 'sfx-aeon-boost',
    messageTemplate: '{user} uses Boost',
    minigame: null,
    extra: { vfxKey: 'vfx-aeon-boost' },
  },

  dismiss: {
    id: 'dismiss',
    name: 'Dismiss',
    game: 'ffx',
    category: 'aeon',
    // Raw rank byte is 0 -> engine fallback rank 3 (AbilityDef.rank doc
    // comment); stored as 0 to exercise that fallback rather than
    // pre-resolving it here.
    mpCost: 0,
    rank: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: [],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    animationKey: 'aeon-dismiss',
    sfxKey: 'sfx-aeon-dismiss',
    messageTemplate: '{user} returns to the Farplane',
    minigame: null,
    extra: {},
  },
};

export default ABILITIES;
