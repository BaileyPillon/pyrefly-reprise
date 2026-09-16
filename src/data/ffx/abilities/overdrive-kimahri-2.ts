/**
 * Kimahri's Ronso Rage Overdrives (2/2): Aqua Breath, Doom, White Wind, Bad
 * Breath, Mighty Guard, Nova. Learned via Lancet (learning is not this
 * file's concern; it only defines the abilities themselves).
 *
 * Source: `research/ffx-combat-core.md` §5.8. All rows `[verified: 2
 * sources]`. MP cost 0 for all, `minigame: 'kimahri-rage'` (a picker only —
 * no timed input at all, so none of these carry `extra.timedInputBonus`;
 * see the §5.2 note that Kimahri is explicitly excluded from that bonus).
 *
 * Formula spread in this half: Aqua Breath/Nova use `'special-magic'` (the
 * FormulaKey doc names these two, alongside Fire Breath in
 * `overdrive-kimahri-1.ts`, explicitly); Doom/Bad Breath/Mighty Guard use
 * `'magic'` as 0-damage status casts; White Wind uses `'healing'`.
 *
 * `damageType: 'other'` on every entry, including Doom and White Wind, per
 * the hard rule that all character Overdrives ignore Protect/Shell/
 * Strength+%/Magic+%/Power Break/Magic Break entirely.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /**
   * §5.8 [verified: 2 sources]. Rank 3, all enemies, 26 DmgCon, Water
   * element. `special-magic` formula: Magic Defense is always treated as 0.
   */
  'aqua-breath': {
    id: 'aqua-breath',
    name: 'Aqua Breath',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 26,
    formula: 'special-magic',
    damageType: 'other',
    element: ['water'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-aqua-breath',
    sfxKey: 'sfx-aqua-breath',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-aqua-breath' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, single enemy, 0 damage, `'magic'`
   * formula. Applies Doom at chance 254. `duration: 254` here is a
   * placeholder — the real countdown is per-target and comes from
   * `EnemyFields.doomTurns` (party default is 5), not a static value this
   * ability definition can carry; see `extra.doomTurns`.
   */
  doom: {
    id: 'doom',
    name: 'Doom',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'doom', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'kimahri-rage-doom',
    sfxKey: 'sfx-doom',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: {
      doomTurns: 'enemy default per encounter, see EnemyFields.doomTurns',
      vfxKey: 'vfx-doom',
    },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, all allies, `'healing'` formula,
   * DmgCon 40. Carries `heals`; `damageType: 'other'` per the hard rule that
   * character Overdrives ignore Shell (which would otherwise touch
   * magical healing).
   */
  'white-wind': {
    id: 'white-wind',
    name: 'White Wind',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 40,
    formula: 'healing',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['heals'],
    canReflect: false,
    animationKey: 'kimahri-rage-white-wind',
    sfxKey: 'sfx-white-wind',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-white-wind' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 4, all enemies, 0 damage, `'magic'`
   * formula. Tries Poison (chance 100, duration 254), Sleep (chance 100,
   * duration 10), Silence (chance 100, duration 10) and Darkness (chance
   * 100, duration 10). Kimahri's version of Bad Breath cannot inflict
   * Confuse, unlike the enemy move of the same name.
   */
  'bad-breath': {
    id: 'bad-breath',
    name: 'Bad Breath',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4,
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [
      { status: 'poison', chance: 100, duration: 254 },
      { status: 'sleep', chance: 100, duration: 10 },
      { status: 'silence', chance: 100, duration: 10 },
      { status: 'darkness', chance: 100, duration: 10 },
    ],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'kimahri-rage-bad-breath',
    sfxKey: 'sfx-bad-breath',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { note: "Kimahri's version cannot inflict Confuse", vfxKey: 'vfx-bad-breath' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 4, all allies, 0 damage, `'magic'`
   * formula. Applies Protect + Shell (chance 254, duration 254 each) plus
   * one charge each of NulBlaze/NulFrost/NulShock/NulTide. The four Nul
   * entries use `duration: 1` to carry the "1 charge" value — `AbilityDef`'s
   * `StatusApplication` has no separate charges field (that lives on the
   * runtime `StatusInstance.charges` instead), so `duration` is repurposed
   * here to mean "1 charge" rather than "1 turn" for these four statuses
   * specifically, matching how Nul statuses have no turn-based duration.
   */
  'mighty-guard': {
    id: 'mighty-guard',
    name: 'Mighty Guard',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 4,
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [
      { status: 'protect', chance: 254, duration: 254 },
      { status: 'shell', chance: 254, duration: 254 },
      { status: 'nulblaze', chance: 254, duration: 1 },
      { status: 'nulfrost', chance: 254, duration: 1 },
      { status: 'nulshock', chance: 254, duration: 1 },
      { status: 'nultide', chance: 254, duration: 1 },
    ],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'kimahri-rage-mighty-guard',
    sfxKey: 'sfx-mighty-guard',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-mighty-guard' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 7, all enemies, 70 DmgCon, no element.
   * `special-magic` formula: Magic Defense is always treated as 0. The
   * strongest Ronso Rage.
   */
  nova: {
    id: 'nova',
    name: 'Nova',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 7,
    power: 70,
    formula: 'special-magic',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-nova',
    sfxKey: 'sfx-nova',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-nova' },
  },
};

export default ABILITIES;
