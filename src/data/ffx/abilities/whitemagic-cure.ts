/**
 * FFX player White Magic — the Cure line plus Esuna/Dispel. Source:
 * `research/ffx-combat-core.md` §7.5 (Yuna's Wht Magic + Pray list) and §2.8
 * (the shared `healing` formula worked table). Revival (Life/Full-Life/
 * Auto-Life) and Regen/Holy live in the sibling file `whitemagic-revival.ts`
 * — this file was split in two to stay under this project's ~380-line data
 * file guideline.
 *
 * `accuracy` is left undefined throughout: every ability in this file uses
 * the normal player hit table rather than an action-owned accuracy byte
 * (that byte is an enemy-only mechanism per `AbilityDef.accuracy`'s own doc
 * comment).
 *
 * Reflectability convention used across this file: per
 * `src/battle/common/types.ts`'s `'reflect'` status doc ("Bounces one
 * single-target Blk/Wht spell"), every single-target spell in this file is
 * reflectable unless the research explicitly says otherwise (Dispel is the
 * one exception here).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

// ---------------------------------------------------------------------------
// Cure line — §2.8 `healing` formula, §7.5 rows 43-45
// ---------------------------------------------------------------------------

// ffx-combat-core §7.5 [verified: 2 sources] — row 43, rank 3, MP 4, Healing formula DmgCon 24.
export const cure: AbilityDef = {
  id: 'cure',
  name: 'Cure',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 4,
  rank: 3,
  power: 24,
  formula: 'healing',
  damageType: 'magical',
  // targeting: single-ally [estimate] — the §7.5 table has no Target column; FFX's Cure line is
  // single-target in the decompile/standard convention (no party-wide Cure variant exists).
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'reflectable', 'crit-eligible'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-cure',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-cure-sparkle' },
};

// ffx-combat-core §7.5 [verified: 2 sources] — row 44, rank 3, MP 10, Healing formula DmgCon 40.
export const cura: AbilityDef = {
  id: 'cura',
  name: 'Cura',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 10,
  rank: 3,
  power: 40,
  formula: 'healing',
  damageType: 'magical',
  // targeting: single-ally [estimate] — same reasoning as Cure; no Target column in §7.5.
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'reflectable', 'crit-eligible'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-cura',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-cura-sparkle' },
};

// ffx-combat-core §7.5 [verified: 2 sources] — row 45, rank 3, MP 20, Healing formula DmgCon 80.
export const curaga: AbilityDef = {
  id: 'curaga',
  name: 'Curaga',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 20,
  rank: 3,
  power: 80,
  formula: 'healing',
  damageType: 'magical',
  // targeting: single-ally [estimate] — same reasoning as Cure; no Target column in §7.5.
  // (Vanilla FFX's Curaga is single-target, unlike FFX-2's party-wide Curaga.)
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: ['heals', 'reflectable', 'crit-eligible'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-curaga',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-curaga-burst' },
};

// ---------------------------------------------------------------------------
// Status cleansing / removal — §7.5 rows 51, 61
// ---------------------------------------------------------------------------

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 51, rank 3, MP 5. Pure
 * removal, no `statusEffects`. Removes Petrify, Poison, Confuse, Berserk,
 * Sleep, Silence, Darkness, Slow. Explicitly does NOT remove Zombie or Curse
 * per the source table.
 */
export const esuna: AbilityDef = {
  id: 'esuna',
  name: 'Esuna',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 5,
  rank: 3,
  power: 0,
  formula: 'none',
  // damageType: 'other' [estimate] — pure status-removal, no damage/healing amount;
  // matches this codebase's convention for every other `formula: 'none'` ability
  // (see e.g. `slowga-counter` in seymour-flux-abilities.ts).
  damageType: 'other',
  // targeting: single-ally [estimate] — no Target column in §7.5; Esuna is used to cure a
  // party member's ailments, matching the Cure line's convention.
  targeting: 'single-ally',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: ['petrify', 'poison', 'confuse', 'berserk', 'sleep', 'silence', 'darkness', 'slow'],
  // reflectable [estimate] — "Esuna is reflectable per general Wht Magic convention" per the
  // task brief; no explicit table entry either way.
  flags: ['removes-statuses', 'reflectable'],
  canReflect: true,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-esuna',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-esuna-cleanse' },
};

/**
 * ffx-combat-core §7.5 [verified: 2 sources] — row 61, rank 3, MP 12.
 * Removes all four Breaks, Shell, Protect, Reflect, all four Nul statuses,
 * Regen, Haste and Curse. Explicitly NOT reflectable per the source table.
 */
export const dispel: AbilityDef = {
  id: 'dispel',
  name: 'Dispel',
  game: 'ffx',
  category: 'whitemagic',
  mpCost: 12,
  rank: 3,
  power: 0,
  formula: 'none',
  // damageType: 'other' [estimate] — see Esuna; matches this codebase's `formula: 'none'` convention.
  damageType: 'other',
  // targeting: single-any [estimate — my own inference, no Target column in §7.5]. Dispel's
  // removal list mixes things normally inflicted on the party (the four Breaks, Curse) with
  // things normally worn by enemies as buffs (Shell/Protect/Reflect/Nul/Regen/Haste), so unlike
  // the other buff/cure spells it must be legal against either side. Standard FFX convention:
  // Dispel is usable on any single combatant.
  targeting: 'single-any',
  element: [],
  hits: 1,
  statusEffects: [],
  removesStatuses: [
    'power-break',
    'magic-break',
    'armor-break',
    'mental-break',
    'shell',
    'protect',
    'reflect',
    'nulblaze',
    'nulfrost',
    'nulshock',
    'nultide',
    'regen',
    'haste',
    'curse',
  ],
  // NOT reflectable — explicit in the §7.5 table.
  flags: ['removes-statuses'],
  canReflect: false,
  animationKey: 'cast-white-magic',
  sfxKey: 'sfx-dispel',
  messageTemplate: '{user} casts {ability}',
  minigame: null,
  extra: { vfxKey: 'vfx-dispel-shatter' },
};

/** Cure-line and cleanse White Magic abilities, keyed by id. */
export const ABILITIES: Record<string, AbilityDef> = {
  [cure.id]: cure,
  [cura.id]: cura,
  [curaga.id]: curaga,
  [esuna.id]: esuna,
  [dispel.id]: dispel,
};

export default ABILITIES;
