/**
 * FFX player White Magic — Life/Full-Life/Auto-Life, Regen, and Holy. Source:
 * `research/ffx-combat-core.md` §7.5 (Yuna's Wht Magic list, rows 52/53/64,
 * 62, 63). Sibling file to `whitemagic-cure.ts` (Cure line, Esuna, Dispel) —
 * split in two to stay under this project's ~380-line data file guideline.
 *
 * `accuracy` is left undefined throughout, matching `whitemagic-cure.ts`:
 * every ability here uses the normal player hit table.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Revival — §7.5 rows 52, 53, 64
// ---------------------------------------------------------------------------

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 52, rank 3, MP 18,
 * `percent-total` formula DmgCon 8 (revive at 50% max HP). `misses-if-target-
 * alive` + `can-target-dead` per the standard revival-spell shape; a living
 * Zombie is still processed and killed (engine behavior via the Zombie sign
 * flip, per §4.2 — not modelled as an extra flag here).
 */
export const life: AbilityDef = {
  id: 'life',
  name: 'Life',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 18,
  rank: 3,
  power: 8,
  formula: 'percent-total',
  damageType: 'magical',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'misses-if-target-alive', 'can-target-dead', 'crit-eligible'],
  // canReflect: false [estimate] — conservative call. A living-Zombie-kill / KO'd-ally-revive
  // spell being reflected onto an enemy is a well-known FFX edge case the source doesn't confirm
  // either way for this decompile, so this data file marks it NOT reflectable rather than guess.
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-life',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-life-revive' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 53, rank 3, MP 60,
 * `percent-total` formula DmgCon 16 (revive at 100% max HP). Same Zombie
 * behaviour as Life.
 *
 * COORDINATOR FIX (integration pass, id collision): the enemy-data agent's
 * `src/data/ffx/enemies/seymour-flux-abilities.ts` independently defines a
 * mechanically DIFFERENT enemy-only ability also named "Full-Life" (targets
 * a random Zombie-afflicted party member: kills a living Zombie outright or
 * fully revives a KO'd one, category 'enemy') under the same bare id
 * `'full-life'`. Since both records cannot share one id in the merged
 * lookup, this player-castable White Magic spell is renamed `full-life-spell`
 * here. The enemy file is owned by a different agent and was left untouched.
 */
export const fullLife: AbilityDef = {
  id: 'full-life-spell',
  name: 'Full-Life',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 60,
  rank: 3,
  power: 16,
  formula: 'percent-total',
  damageType: 'magical',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'misses-if-target-alive', 'can-target-dead', 'crit-eligible'],
  // canReflect: false [estimate] — see Life; same conservative call.
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-full-life',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-full-life-revive' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 64, rank 3, MP 97. Applies
 * the `auto-life` status (chance 254, duration 255 = permanent/undispellable
 * per §4.2's semantics table, consumed on the next KO). No `heals` flag: this
 * cast applies a status rather than restoring HP directly. The later
 * consumed-effect (row 287, `percent-total` DmgCon 4, revive at 25% max HP)
 * belongs to the engine's KO-recovery code, not to this cast ability — per
 * the task brief this file only defines the cast. Explicitly NOT reflectable
 * per the source table.
 */
export const autoLife: AbilityDef = {
  id: 'auto-life',
  name: 'Auto-Life',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 97,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'magical',
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'auto-life', chance: 254, duration: 255 }],
  removesStatuses: [],
  flags: ['crit-eligible'],
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-auto-life',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-auto-life-halo' },
};

// ---------------------------------------------------------------------------
// Regen and Holy — §7.5 rows 62, 63
// ---------------------------------------------------------------------------

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 62, rank 3, MP 40. Applies
 * Regen (chance 100, duration 10 turns, matching §4.2's semantics table). The
 * periodic Regen tick itself is `'magical'` per the project convention
 * (`Shell` halves "magical damage AND magical healing", which covers Regen's
 * tick), but that tick is applied by the engine's status-upkeep code, not by
 * this cast ability — this record only represents casting Regen onto a
 * target, which is a pure status application.
 */
export const regen: AbilityDef = {
  id: 'regen',
  name: 'Regen',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 40,
  rank: 3,
  power: 0,
  formula: 'none',
  // damageType: 'other' [estimate] — see whitemagic-cure.ts's Esuna note; the cast itself applies
  // no damage/healing amount (the periodic tick it causes is a separate, engine-owned effect).
  damageType: 'other',
  // targeting: single-ally [estimate — no Target column in §7.5; standard convention, matches
  // the other buff spells in whitemagic-buffs.ts].
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [{ status: 'regen', chance: 100, duration: 10 }],
  removesStatuses: [],
  // reflectable [estimate] — single-target Wht Magic default (see whitemagic-buffs.ts's file
  // header); no explicit table entry either way for Regen specifically.
  flags: ['reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-regen',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-regen-glow' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 63, rank 4, MP 85, `magic`
 * formula DmgCon 100, Holy element, shatterChance 100.
 */
export const holy: AbilityDef = {
  id: 'holy',
  name: 'Holy',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 85,
  rank: 4,
  power: 100,
  formula: 'magic',
  damageType: 'magical',
  targeting: 'single-enemy',
  element: ['holy'],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  // reflectable [estimate — either way is plausible; some vanilla-FFX versions do not let Holy be
  // reflected, but the research doc doesn't confirm this decompile's behaviour either way]. Picked
  // `true` for consistency with the general "all single-target Blk/Wht magic is reflectable"
  // default the research doc states elsewhere for Black Magic. The `shatter` flag is added
  // alongside `shatterChance` per this codebase's convention (see `AbilityDef.shatterChance`'s
  // doc comment: "Only meaningful with the `shatter` flag") even though the task brief's flag
  // list for Holy didn't spell it out — see report for this deviation.
  flags: ['crit-eligible', 'reflectable', 'shatter'],
  shatterChance: 100,
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-holy',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-holy-pillar' },
};

/** Revival and Regen/Holy White Magic abilities, keyed by id. */
export const ABILITIES: Record<string, AbilityDef> = {
  [life.id]: life,
  [fullLife.id]: fullLife,
  [autoLife.id]: autoLife,
  [regen.id]: regen,
  [holy.id]: holy,
};

export default ABILITIES;
