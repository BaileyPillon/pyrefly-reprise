/**
 * FFX player White Magic — Protect/Shell/Reflect and the four Nul-spells.
 * Source: `research/ffx-combat-core.md` §7.5 (Yuna's Wht Magic rows 46-49,
 * 58-60) plus the §4.2 status semantics table for durations. Sibling file
 * `whitemagic-haste-slow.ts` covers Haste/Hastega/Slow/Slowga — split in two
 * to stay under this project's ~380-line data file guideline.
 *
 * `accuracy` is left undefined throughout, matching `whitemagic-cure.ts`:
 * every ability here uses the normal player hit table.
 *
 * Reflectability convention: per `src/battle/common/types.ts`'s `'reflect'`
 * status doc ("Bounces one single-target Blk/Wht spell"), every spell below
 * is single-target and reflectable by default — marked `[estimate]` on each
 * since §7.5 has no explicit reflect column for any of them.
 *
 * `damageType: 'other'` is used throughout this file (rather than
 * `'magical'`) for every ability, matching this codebase's established
 * convention for `formula: 'none'` abilities — see e.g. the buff/Nul records
 * in `src/battle/ffx2/abilities.ts`. None of these abilities compute a
 * physical- or magical-damage number that Protect/Shell/Strength+%/Magic+%
 * would apply to, so `'other'` is the mechanically correct choice.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Protect / Shell / Reflect — §7.5 rows 59, 58, 60
// ---------------------------------------------------------------------------

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 59, rank 3, MP 12.
 * Applies Protect (chance 254, duration 254 = until end of battle per §4.2).
 */
export const protect: AbilityDef = {
  id: 'protect',
  name: 'Protect',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 12,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  // targeting: single-ally [estimate — no Target column in §7.5; standard FFX convention, all
  // single-target self/ally buffs in this list are single-target].
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'protect', chance: 254, duration: 254 }],
  removesStatuses: [],
  // reflectable [estimate] — see file header's reflectability convention.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-protect',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-protect-shield' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 58, rank 3, MP 10.
 * Applies Shell (chance 254, duration 254).
 */
export const shell: AbilityDef = {
  id: 'shell',
  name: 'Shell',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 10,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  // targeting: single-ally [estimate] — see Protect.
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'shell', chance: 254, duration: 254 }],
  removesStatuses: [],
  // reflectable [estimate] — see file header.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-shell',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-shell-shield' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 60, rank 3, MP 14.
 * Applies Reflect (chance 254, duration 254).
 */
export const reflect: AbilityDef = {
  id: 'reflect',
  name: 'Reflect',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 14,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'other',
  /**
   * **`single-any`**, not `single-ally`, and this one is sourced rather than
   * an `[estimate]` like its two neighbours.
   *
   * `research/ffx-bfa-yu-yevon.md` §3.5 lists it as one of the five documented
   * ways to end the Yu Yevon fight, in as many words: *"**Reflect** — Cast
   * Reflect on him; his Curaga bounces onto the party instead. Note the
   * Pagodas' Power Wave #210 strips Reflect"* `[verified: 2 sources]`. A
   * `single-ally` Reflect cannot be aimed at an enemy at all, so that route did
   * not exist: measured on the shipped board, the row came back
   * `validTargets` without `yu-yevon` on every one of Yuna's turns.
   *
   * Protect and Shell keep `single-ally`; nothing in the research asks for them
   * on an enemy, and this is the one row a sourced strategy turns on.
   */
  targeting: 'single-any',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'reflect', chance: 254, duration: 254 }],
  removesStatuses: [],
  // reflectable [estimate] — casting Reflect onto an already-Reflected ally bounces it, per the
  // same single-target-Wht-magic default used throughout this file.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-reflect',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-reflect-shimmer' },
};

// ---------------------------------------------------------------------------
// Nul-spells — §7.5 rows 47, 46, 48, 49
// ---------------------------------------------------------------------------

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 47, rank 2, MP 2. One
 * charge: chance 254, duration 1 (the `StatusApplication` shape has no
 * dedicated charge count, so per the task brief this file encodes "one
 * charge" as `duration: 1`; the engine's `StatusInstance.charges` field is
 * what actually tracks charge consumption at runtime).
 */
export const nulBlaze: AbilityDef = {
  id: 'nulblaze',
  name: 'NulBlaze',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 2,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  // targeting: single-ally [estimate] — see Protect.
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'nulblaze', chance: 254, duration: 1 }],
  removesStatuses: [],
  // reflectable [estimate] — see file header.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-nulblaze',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-nulblaze-ward' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 46, rank 2, MP 2. One
 * charge (see NulBlaze's doc comment for the `duration: 1` convention).
 */
export const nulFrost: AbilityDef = {
  id: 'nulfrost',
  name: 'NulFrost',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 2,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'nulfrost', chance: 254, duration: 1 }],
  removesStatuses: [],
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-nulfrost',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-nulfrost-ward' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 48, rank 2, MP 2. One
 * charge (see NulBlaze's doc comment).
 */
export const nulShock: AbilityDef = {
  id: 'nulshock',
  name: 'NulShock',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 2,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'nulshock', chance: 254, duration: 1 }],
  removesStatuses: [],
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-nulshock',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-nulshock-ward' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 49, rank 2, MP 2. One
 * charge (see NulBlaze's doc comment).
 */
export const nulTide: AbilityDef = {
  id: 'nultide',
  name: 'NulTide',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 2,
  rank: 2,
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'nultide', chance: 254, duration: 1 }],
  removesStatuses: [],
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-nultide',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-nultide-ward' },
};

/** Protect/Shell/Reflect and the four Nul-spells, keyed by id. */
export const ABILITIES: Record<string, AbilityDef> = {
  [protect.id]: protect,
  [shell.id]: shell,
  [reflect.id]: reflect,
  [nulBlaze.id]: nulBlaze,
  [nulFrost.id]: nulFrost,
  [nulShock.id]: nulShock,
  [nulTide.id]: nulTide,
};

export default ABILITIES;
