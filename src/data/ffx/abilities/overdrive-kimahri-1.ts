/**
 * Kimahri's Ronso Rage Overdrives (1/2): Jump, Fire Breath, Seed Cannon,
 * Self-Destruct, Thrust Kick, Stone Breath. Learned via Lancet (learning is
 * not this file's concern; it only defines the abilities themselves).
 *
 * Source: `research/ffx-combat-core.md` §5.8. All rows `[verified: 2
 * sources]`. MP cost 0 for all, `minigame: 'kimahri-rage'` (a picker only —
 * no timed input at all, so none of these carry `extra.timedInputBonus`;
 * see the §5.2 note that Kimahri is explicitly excluded from that bonus).
 *
 * Formula spread in this half: Jump/Seed Cannon/Thrust Kick/Stone Breath use
 * `'strength'` (the FormulaKey doc names "Kimahri's Jump and a few Rages"
 * under `strength`); Fire Breath uses `'special-magic'` (the FormulaKey doc
 * names it explicitly, alongside Aqua Breath and Nova in
 * `overdrive-kimahri-2.ts`); Self-Destruct uses `'user-max-hp'`.
 *
 * `damageType: 'other'` on every entry per the hard rule that all character
 * Overdrives ignore Protect/Shell/Strength+%/Magic+%/Power Break/Magic
 * Break entirely.
 *
 * ACCURACY DECISION (2026-09-16, closing the same review `overdrive-tidus.ts`
 * / `overdrive-auron.ts` settled): Jump, Seed Cannon and Thrust Kick use
 * `formula: 'strength'` and could look like they should roll accuracy the
 * way a physical Attack does. Checked specifically for a research row that
 * says otherwise — `research/ffx-combat-core.md` §5.8's full 12-row Ronso
 * Rage table carries no accuracy or hit-chance annotation for any Rage, and
 * no other research file (`ffx-bfa-yu-yevon.md`, which is where Kimahri's
 * Ronso Rage usage is discussed at line 544, `ffx-yunalesca.md`) gives any
 * of these a specific accuracy byte or a contradicting "rolls accuracy"
 * statement either. Absent that, the rule this project already established
 * for `Other`-damage-type Overdrives applies: `research/ffx-bfa-yu-yevon.md`
 * §1.3 (lines 101, 107, 108) decompiles three Strength-formula, `Other`
 * damage-type enemy Overdrives as all "always hits", and every Rage here is
 * `category: 'overdrive'`, `damageType: 'other'` — these ARE Overdrives
 * first, whatever their formula. `canMiss: false` is set explicitly on all
 * 6 records in this file, citing ffx-bfa-yu-yevon.md §1.3 `[verified: 2
 * sources]` for the pattern, `[estimate]` for the extension to a formula
 * (`strength`, `special-magic`, `user-max-hp`) or rider (Petrify on Stone
 * Breath, instant Eject on Self-Destruct) the three confirmed rows don't
 * exactly replicate.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

export const ABILITIES: Record<string, AbilityDef> = {
  /** §5.8 [verified: 2 sources]. Rank 3, single enemy, 32 DmgCon, plain damage. */
  jump: {
    id: 'jump',
    name: 'Jump',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 32,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-jump',
    sfxKey: 'sfx-kimahri-jump',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-jump' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, all enemies, 24 DmgCon, Fire
   * element. `special-magic` formula: Magic Defense is always treated as 0.
   */
  'fire-breath': {
    id: 'fire-breath',
    name: 'Fire Breath',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 24,
    formula: 'special-magic',
    damageType: 'other',
    element: ['fire'],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-fire-breath',
    sfxKey: 'sfx-fire-breath',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-fire-breath' },
  },

  /** §5.8 [verified: 2 sources]. Rank 3, single enemy, 33 DmgCon, plain damage. */
  'seed-cannon': {
    id: 'seed-cannon',
    name: 'Seed Cannon',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 33,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-seed-cannon',
    sfxKey: 'sfx-seed-cannon',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-seed-cannon' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, single enemy, DmgCon 30 against
   * Kimahri's own max HP (`user-max-hp` formula: `userMaxHP * DmgCon // 10`,
   * i.e. 3x his max HP). Carries `destroys-user`; Kimahri is Ejected after
   * resolving. Not crit-eligible.
   */
  'self-destruct': {
    id: 'self-destruct',
    name: 'Self-Destruct',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 30,
    formula: 'user-max-hp',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['destroys-user'],
    canReflect: false,
    animationKey: 'kimahri-rage-self-destruct',
    sfxKey: 'sfx-self-destruct',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-self-destruct', note: 'Kimahri is Ejected after resolving, per the destroys-user flag' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, single enemy, 33 DmgCon, plain
   * damage. In-game text implies an Eject/knockback, but per the research
   * this move does NOT eject the target — documented in `extra` rather than
   * modeled as a status/flag.
   */
  'thrust-kick': {
    id: 'thrust-kick',
    name: 'Thrust Kick',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 33,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible'],
    canReflect: false,
    animationKey: 'kimahri-rage-thrust-kick',
    sfxKey: 'sfx-thrust-kick',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-thrust-kick', note: 'does NOT eject the target despite in-game text' },
  },

  /**
   * §5.8 [verified: 2 sources]. Rank 3, all enemies, 0 damage — pure
   * Petrify at chance 254, duration 254. `strength` formula with DmgCon 0
   * evaluates to 0 damage by construction.
   */
  'stone-breath': {
    id: 'stone-breath',
    name: 'Stone Breath',
    game: 'ffx',
    category: 'overdrive',
    mpCost: 0,
    rank: 3,
    power: 0,
    formula: 'strength',
    damageType: 'other',
    element: [],
    targeting: 'all-enemies',
    hits: 1,
    canMiss: false, // ffx-bfa-yu-yevon.md §1.3 [verified: 2 sources]/[estimate] — always hits; see file header.
    statusEffects: [{ status: 'petrify', chance: 254, duration: 254 }],
    removesStatuses: [],
    flags: [],
    canReflect: false,
    animationKey: 'kimahri-rage-stone-breath',
    sfxKey: 'sfx-stone-breath',
    messageTemplate: '{user} uses {ability}',
    minigame: 'kimahri-rage',
    extra: { vfxKey: 'vfx-stone-breath' },
  },
};

export default ABILITIES;
