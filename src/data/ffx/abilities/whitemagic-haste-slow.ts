/**
 * FFX player White Magic — Haste/Hastega/Slow/Slowga. Source:
 * `research/ffx-combat-core.md` §7.1 (Tidus's command rows 54-57) plus the
 * §4.2 status semantics table for durations. Sibling file to
 * `whitemagic-protect.ts` (Protect/Shell/Reflect/the four Nuls) — split in
 * two to stay under this project's ~380-line data file guideline.
 *
 * Ownership note: §7.1 researches these as Tidus command rows (decompile-
 * verified), not under Yuna's §7.5 Wht Magic list. This project's convention
 * is to categorize an ability by its mechanical family, not by which
 * character's Sphere Grid node currently teaches it — Haste/Hastega/Slow/
 * Slowga behave exactly like White Magic (reflectable per the rules below,
 * and blocked by Silence via `category: 'whitemagic'`), so they ship here
 * with `category: 'whitemagic'`, per instruction from the coordinating
 * agent.
 *
 * `accuracy` is left undefined throughout, matching `whitemagic-cure.ts`:
 * every ability here uses the normal player hit table.
 *
 * Reflectability: Haste/Slow are reflectable per an EXPLICIT statement in
 * §7.1 ("Reflectable"), not an estimate. Hastega/Slowga are party-wide and
 * therefore NOT reflectable, per `src/battle/common/types.ts`'s `'reflect'`
 * status doc ("Not party-wide spells...") — also a direct contract rule, not
 * an estimate.
 *
 * `damageType: 'other'` is used for all four abilities here, matching this
 * codebase's established convention for `formula: 'ctb'` abilities — see
 * `slowgaCounter` in `src/data/ffx/enemies/seymour-flux-abilities.ts`, a
 * `formula: 'ctb'` ability that also uses `damageType: 'other'`. CTB
 * manipulation is neither physical nor magical damage, so `'other'` is the
 * mechanically correct choice (it is not touched by Protect/Shell/
 * Strength+%/Magic+%).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

/**
 * ffx-combat-core §7.1 [verified: 2 sources] — row 54, rank 4, MP 8. `ctb`
 * formula, DmgCon 8, `heals` flag: per `ActionFlag.heals`'s doc comment, on a
 * `ctb` formula this REDUCES the target's CTB counter (halves current CTB),
 * which is how Haste's speed boost is modelled. Also applies Haste (chance
 * 254, duration 254). Explicitly reflectable and Silence-blocked per §7.1;
 * Silence-blocking falls out of `category: 'whitemagic'` (see file header),
 * no separate flag needed. Base targeting is single-ally — see the note in
 * §7.1 about the reflect-bounce case, which is ordinary engine reflect
 * behaviour, not a distinct `Targeting` value.
 */
export const haste: AbilityDef = {
  id: 'haste',
  name: 'Haste',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 8,
  rank: 4,
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'haste', chance: 254, duration: 254 }],
  removesStatuses: [],
  // reflectable — EXPLICIT per §7.1 ("Reflectable, Silence-blocked"), not an estimate.
  flags: ['heals', 'reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-haste',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-haste-blur' },
};

/**
 * ffx-combat-core §7.1 [verified: 2 sources] — row 55, rank 6, MP 30. Same
 * effect as Haste, whole party. Party-wide spells are NOT reflectable per
 * `src/battle/common/types.ts`'s `'reflect'` status doc ("Not party-wide
 * spells...") — this is a direct contract rule, not an estimate.
 */
export const hastega: AbilityDef = {
  id: 'hastega',
  name: 'Hastega',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 30,
  rank: 6,
  power: 8,
  formula: 'ctb',
  damageType: 'other',
  targeting: 'all-allies',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'haste', chance: 254, duration: 254 }],
  removesStatuses: [],
  // NOT reflectable — party-wide spell, per the contract's reflect-status doc comment.
  flags: ['heals'],
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-hastega',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-hastega-blur' },
};

/**
 * ffx-combat-core §7.1 [verified: 2 sources] — row 56, rank 3, MP 12. `ctb`
 * formula, DmgCon 16, no `heals` flag: adds 100% of the target's current CTB
 * (pushes their turn back). Also applies Slow (chance 100, duration 254 per
 * §4.2's semantics table). Explicitly reflectable per §7.1, not an estimate.
 */
export const slow: AbilityDef = {
  id: 'slow',
  name: 'Slow',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 12,
  rank: 3,
  power: 16,
  formula: 'ctb',
  damageType: 'other',
  targeting: 'single-enemy',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'slow', chance: 100, duration: 254 }],
  removesStatuses: [],
  // reflectable — EXPLICIT per §7.1, not an estimate.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-slow',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-slow-chain' },
};

/**
 * ffx-combat-core §7.1 [verified: 2 sources] — row 57, rank 4, MP 20. Same
 * effect as Slow, whole enemy party. NOT reflectable — party-wide spell, per
 * the same contract rule as Hastega.
 */
export const slowga: AbilityDef = {
  id: 'slowga',
  name: 'Slowga',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 20,
  rank: 4,
  power: 16,
  formula: 'ctb',
  damageType: 'other',
  targeting: 'all-enemies',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'slow', chance: 100, duration: 254 }],
  removesStatuses: [],
  // NOT reflectable — party-wide spell, per the contract's reflect-status doc comment.
  flags: [],
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-slowga',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-slowga-chain' },
};

/** Haste/Hastega/Slow/Slowga, keyed by id. */
export const ABILITIES: Record<string, AbilityDef> = {
  [haste.id]: haste,
  [hastega.id]: hastega,
  [slow.id]: slow,
  [slowga.id]: slowga,
};

export default ABILITIES;
