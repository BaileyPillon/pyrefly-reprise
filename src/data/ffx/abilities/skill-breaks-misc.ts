/**
 * Auron's Breaks, Wakka's Quick Hit, and Kimahri's Extract commands: Power
 * Break, Magic Break, Armor Break, Mental Break, Full Break, Quick Hit,
 * Extract Power, Extract Mana, Extract Speed, Extract Ability.
 * Source: `research/ffx-combat-core.md` §7.1, §7.3, §7.7
 * [decompiled, verified: 2 sources] — every row is a decompiled
 * `ffx_command.csv` entry ("All rows are decompiled `ffx_command.csv`
 * entries" per the §7 preamble), cross-checked against the Fandom command
 * tables for rank/MP/status duration.
 *
 * CATEGORY CONVENTION: every ability here uses `category: 'special'`, never
 * `'skill'` — see `special-buffs.ts` for the full rationale (this project
 * resolves the `AbilityCategory` ambiguity by putting every non-Attack/
 * non-magic/non-Overdrive command in `'special'`; `'skill'` is reserved for
 * FFX-2 dressphere abilities). This file's own filename ("skill-*") refers
 * only to the informal "Skill" grouping in the research, not the contract's
 * `'skill'` AbilityCategory value.
 *
 * Shared shape for every ability below: `formula: 'strength'`, `damageType:
 * 'physical'`, `targeting: 'single-enemy'`, `element: []`, `hits: 1`,
 * `flags: ['inherits-weapon-properties', 'adds-equipment-crit',
 * 'crit-eligible', 'affected-by-darkness']` (same as a normal Attack).
 * `removesStatuses: []` throughout.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const WEAPON_FLAGS = [
  'inherits-weapon-properties',
  'adds-equipment-crit',
  'crit-eligible',
  'affected-by-darkness',
] as const;

export const ABILITIES: Record<string, AbilityDef> = {
  // ffx-combat-core §7.3 — row 16, rank 4, MP 8, DmgCon 16. Power Break
  // status, chance 100, duration 254 (permanent for the battle, removable
  // only by Dispel per `battle/common/types.ts`'s status table).
  'power-break': {
    id: 'power-break',
    name: 'Power Break',
    game: 'ffx',
    category: 'special',
    mpCost: 8,
    rank: 4,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'power-break', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-power-break',
    sfxKey: 'sfx-power-break',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-power-break' },
  },

  // ffx-combat-core §7.3 — row 17, rank 4, MP 8, DmgCon 16. Magic Break
  // status, chance 100, duration 254.
  'magic-break': {
    id: 'magic-break',
    name: 'Magic Break',
    game: 'ffx',
    category: 'special',
    mpCost: 8,
    rank: 4,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'magic-break', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-magic-break',
    sfxKey: 'sfx-magic-break',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-magic-break' },
  },

  // ffx-combat-core §7.3 — row 18, rank 4, MP 12, DmgCon 16. Armor Break
  // status, chance 100, duration 254.
  'armor-break': {
    id: 'armor-break',
    name: 'Armor Break',
    game: 'ffx',
    category: 'special',
    mpCost: 12,
    rank: 4,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'armor-break', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-armor-break',
    sfxKey: 'sfx-armor-break',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-armor-break' },
  },

  // ffx-combat-core §7.3 — row 19, rank 4, MP 12, DmgCon 16. Mental Break
  // status, chance 100, duration 254.
  'mental-break': {
    id: 'mental-break',
    name: 'Mental Break',
    game: 'ffx',
    category: 'special',
    mpCost: 12,
    rank: 4,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'mental-break', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-mental-break',
    sfxKey: 'sfx-mental-break',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-mental-break' },
  },

  // ffx-combat-core §7.3 — row 89, rank 5, MP 99, DmgCon 16. All four Break
  // statuses at once, each chance 100 duration 254; can also shatter a
  // Petrified target at a flat 100% chance.
  'full-break': {
    id: 'full-break',
    name: 'Full Break',
    game: 'ffx',
    category: 'special',
    mpCost: 99,
    rank: 5,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [
      { status: 'power-break', chance: 100, duration: 254 },
      { status: 'magic-break', chance: 100, duration: 254 },
      { status: 'armor-break', chance: 100, duration: 254 },
      { status: 'mental-break', chance: 100, duration: 254 },
    ],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS, 'shatter'],
    shatterChance: 100,
    animationKey: 'skill-full-break',
    sfxKey: 'sfx-full-break',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-full-break' },
  },

  // ffx-combat-core §7.1 — row 21, rank 2, MP 36 (using the Int/HD table's
  // numbers, per the coordinator's instruction), DmgCon 16. Identical to a
  // normal Attack but with short recovery; no status.
  'quick-hit': {
    id: 'quick-hit',
    name: 'Quick Hit',
    game: 'ffx',
    category: 'special',
    mpCost: 36,
    rank: 2,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-quick-hit',
    sfxKey: 'sfx-quick-hit',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-quick-hit' },
  },

  // ffx-combat-core §7.7 — row 90, rank 3, MP 1, DmgCon 16. Attack plus a
  // Distiller drop on kill; the drop mechanic belongs to the engine, flagged
  // via `extra.distillerDrop`.
  'extract-power': {
    id: 'extract-power',
    name: 'Extract Power',
    game: 'ffx',
    category: 'special',
    mpCost: 1,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-extract-power',
    sfxKey: 'sfx-extract-power',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-extract-power', distillerDrop: 'power' },
  },

  // ffx-combat-core §7.7 — row 91, rank 3, MP 1, DmgCon 16.
  'extract-mana': {
    id: 'extract-mana',
    name: 'Extract Mana',
    game: 'ffx',
    category: 'special',
    mpCost: 1,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-extract-mana',
    sfxKey: 'sfx-extract-mana',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-extract-mana', distillerDrop: 'mana' },
  },

  // ffx-combat-core §7.7 — row 92, rank 3, MP 1, DmgCon 16.
  'extract-speed': {
    id: 'extract-speed',
    name: 'Extract Speed',
    game: 'ffx',
    category: 'special',
    mpCost: 1,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-extract-speed',
    sfxKey: 'sfx-extract-speed',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-extract-speed', distillerDrop: 'speed' },
  },

  // ffx-combat-core §7.7 — row 93, rank 3, MP 1, DmgCon 16.
  'extract-ability': {
    id: 'extract-ability',
    name: 'Extract Ability',
    game: 'ffx',
    category: 'special',
    mpCost: 1,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-extract-ability',
    sfxKey: 'sfx-extract-ability',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-extract-ability', distillerDrop: 'ability' },
  },
};
