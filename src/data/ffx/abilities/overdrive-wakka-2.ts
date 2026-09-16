/**
 * Wakka's Slots Overdrives — resolved shot sub-abilities (2/2).
 *
 * Source: `research/ffx-combat-core.md` §5.6. All rows `[verified: 2
 * sources]`.
 *
 * These 10 abilities are engine-internal (`minigame: null`) and are never
 * chosen directly by the player; `overdrive-wakka-1.ts`'s reel-set commands
 * resolve to one of these once the spun symbols are known. Because a shot is
 * not its own CTB-queue entry (the parent reel-set command already consumed
 * the turn), every entry here omits `rank` entirely rather than guessing a
 * value the research does not give it.
 *
 * All 10 use `formula: 'strength'`, `damageType: 'other'`, no
 * `crit-eligible` flag (Slots never crits), and `targeting: 'random-enemy'`
 * unless noted (Aurochs Shot hits all enemies).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /** §5.6 [verified: 2 sources]. 34 DmgCon x1, Fire element. */
  'fire-shot': {
    id: 'fire-shot',
    name: 'Fire Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: ['fire'],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-fire',
    sfxKey: 'sfx-wakka-shot-fire',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-fire-shot' },
  },

  /** §5.6 [verified: 2 sources]. 34 DmgCon x1, Ice element. */
  'ice-shot': {
    id: 'ice-shot',
    name: 'Ice Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: ['ice'],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-ice',
    sfxKey: 'sfx-wakka-shot-ice',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-ice-shot' },
  },

  /** §5.6 [verified: 2 sources]. 34 DmgCon x1, Water element. */
  'water-shot': {
    id: 'water-shot',
    name: 'Water Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: ['water'],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-water',
    sfxKey: 'sfx-wakka-shot-water',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-water-shot' },
  },

  /** §5.6 [verified: 2 sources]. 34 DmgCon x1, Thunder element (`'lightning'`). */
  'thunder-shot': {
    id: 'thunder-shot',
    name: 'Thunder Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: ['lightning'],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-thunder',
    sfxKey: 'sfx-wakka-shot-thunder',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-thunder-shot' },
  },

  /**
   * §5.6 [verified: 2 sources]. 34 DmgCon x1, non-elemental. Tries Poison
   * (chance 254, duration 254) plus Sleep/Silence/Darkness (each chance 100,
   * duration 3), all unless the target is immune to that particular status.
   */
  'havoc-shot': {
    id: 'havoc-shot',
    name: 'Havoc Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [
      { status: 'poison', chance: 254, duration: 254 },
      { status: 'sleep', chance: 100, duration: 3 },
      { status: 'silence', chance: 100, duration: 3 },
      { status: 'darkness', chance: 100, duration: 3 },
    ],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-havoc',
    sfxKey: 'sfx-wakka-shot-havoc',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-havoc-shot' },
  },

  /**
   * §5.6 [verified: 2 sources]. 34 DmgCon x1, non-elemental. Tries all four
   * Breaks at chance 100, duration 254 each.
   */
  'break-shot': {
    id: 'break-shot',
    name: 'Break Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [
      { status: 'power-break', chance: 100, duration: 254 },
      { status: 'magic-break', chance: 100, duration: 254 },
      { status: 'armor-break', chance: 100, duration: 254 },
      { status: 'mental-break', chance: 100, duration: 254 },
    ],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-break',
    sfxKey: 'sfx-wakka-shot-break',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-break-shot' },
  },

  /**
   * §5.6 [verified: 2 sources]. 34 DmgCon x1, non-elemental. Tries Petrify
   * at chance 100, duration 254. On a resist, the research documents a
   * secondary effect — Weak Delay plus a Slow application (chance 100,
   * duration 0) that also strips Haste — that cannot be expressed as a
   * single `StatusApplication` entry; it is documented in `extra.onResist`
   * for the engine to special-case instead of being modeled in
   * `statusEffects`.
   */
  'time-shot': {
    id: 'time-shot',
    name: 'Time Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 34,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [{ status: 'petrify', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-time',
    sfxKey: 'sfx-wakka-shot-time',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: {
      onResist:
        'weak-delay + Slow(100, duration 0) which also strips Haste — not representable as a single StatusApplication, document in extra',
      vfxKey: 'vfx-time-shot',
    },
  },

  /**
   * §5.6 [verified: 2 sources]. 72 DmgCon x1, non-elemental, all enemies —
   * the 3-Aurochs-symbols payoff of `aurochs-reels`.
   */
  'aurochs-shot': {
    id: 'aurochs-shot',
    name: 'Aurochs Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 72,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-aurochs',
    sfxKey: 'sfx-wakka-shot-aurochs',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-aurochs-shot' },
  },

  /**
   * §5.6 [verified: 2 sources]. 32 DmgCon x1, non-elemental, 1 random
   * enemy — the "no match" fallback for every reel set, described as double
   * the attack power of a normal attack.
   */
  'power-shot': {
    id: 'power-shot',
    name: 'Power Shot',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 32,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-power',
    sfxKey: 'sfx-wakka-shot-power',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: { vfxKey: 'vfx-power-shot', note: 'double the attack power of a normal attack' },
  },

  /**
   * §5.6 [verified: 2 sources]. 10 DmgCon per hit, non-elemental, 1 random
   * enemy per hit — the `attack-reels` payoff. Hit count is variable and
   * computed by the engine from the minigame result; `hits: 12` here is only
   * the nominal cap (a perfect 2-2-2 roll), per `extra.hitCountRule`.
   */
  'attack-reels-hit': {
    id: 'attack-reels-hit',
    name: 'Attack Reels Hit',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    power: 10,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'random-enemy',
    hits: 12,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'wakka-shot-attack-reels',
    sfxKey: 'sfx-wakka-shot-attack-reels',
    messageTemplate: '{user} uses {ability}',
    minigame: null,
    extra: {
      hitCountRule: 'n = sum of 3 symbols (Miss=0,1Hit=1,2Hit=2); if all 3 identical, n*=2; max 12 from a perfect 2-2-2',
      vfxKey: 'vfx-attack-reels-hit',
    },
  },
};

export default ABILITIES;
