/**
 * Status-inflicting weapon Skills: Dark/Silence/Sleep Attack & Buster,
 * Triple Foul, Zombie Attack, Delay Attack, Delay Buster.
 * Source: `research/ffx-combat-core.md` §7.1, §7.2, §7.3
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
 * Shared shape for every ability below (Wakka's Attack/Buster commands,
 * Auron's Zombie/Delay commands): `formula: 'strength'` (POWER =
 * `(str^3 // 32) + 30`, then `x DmgCon/16`), `damageType: 'physical'`,
 * `targeting: 'single-enemy'`, `element: []`, `hits: 1`,
 * `flags: ['inherits-weapon-properties', 'adds-equipment-crit',
 * 'crit-eligible', 'affected-by-darkness']` (the same set as a normal
 * Attack), plus `'weak-delay'`/`'strong-delay'` on top for the two Delay
 * commands. `removesStatuses: []` throughout — none of these clear anything.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const WEAPON_FLAGS = [
  'inherits-weapon-properties',
  'adds-equipment-crit',
  'crit-eligible',
  'affected-by-darkness',
] as const;

export const ABILITIES: Record<string, AbilityDef> = {
  // ffx-combat-core §7.2 — row 8, rank 3, MP 5, DmgCon 16. Sleep, chance
  // 100, duration 3 (victim's own turns).
  'sleep-attack': {
    id: 'sleep-attack',
    name: 'Sleep Attack',
    game: 'ffx',
    category: 'special',
    mpCost: 5,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'sleep', chance: 100, duration: 3 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-sleep-attack',
    sfxKey: 'sfx-sleep-attack',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-sleep-attack' },
  },

  // ffx-combat-core §7.2 — row 9, rank 3, MP 5, DmgCon 16. Silence, chance
  // 100, duration 3.
  'silence-attack': {
    id: 'silence-attack',
    name: 'Silence Attack',
    game: 'ffx',
    category: 'special',
    mpCost: 5,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'silence', chance: 100, duration: 3 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-silence-attack',
    sfxKey: 'sfx-silence-attack',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-silence-attack' },
  },

  // ffx-combat-core §7.2 — row 10, rank 3, MP 5, DmgCon 16. Darkness, chance
  // 100, duration 3.
  'dark-attack': {
    id: 'dark-attack',
    name: 'Dark Attack',
    game: 'ffx',
    category: 'special',
    mpCost: 5,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'darkness', chance: 100, duration: 3 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-dark-attack',
    sfxKey: 'sfx-dark-attack',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-dark-attack' },
  },

  // ffx-combat-core §7.3 — row 11, rank 3, MP 10, DmgCon 16. Zombie status,
  // chance 100, duration 254 (permanent for the battle). NOTE: this decompile
  // lists Zombie Attack under Auron's §7.3 table, not Wakka's, despite common
  // series memory of it as a Wakka move — kept as researched.
  'zombie-attack': {
    id: 'zombie-attack',
    name: 'Zombie Attack',
    game: 'ffx',
    category: 'special',
    mpCost: 10,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'zombie', chance: 100, duration: 254 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-zombie-attack',
    sfxKey: 'sfx-zombie-attack',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-zombie-attack' },
  },

  // ffx-combat-core §7.2 — row 12, rank 3, MP 10, DmgCon 16. Sleep, chance
  // 254 (guaranteed unless immune), duration 1.
  'sleep-buster': {
    id: 'sleep-buster',
    name: 'Sleep Buster',
    game: 'ffx',
    category: 'special',
    mpCost: 10,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'sleep', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-sleep-buster',
    sfxKey: 'sfx-sleep-buster',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-sleep-buster' },
  },

  // ffx-combat-core §7.2 — row 13, rank 3, MP 10, DmgCon 16. Silence, chance
  // 254, duration 1.
  'silence-buster': {
    id: 'silence-buster',
    name: 'Silence Buster',
    game: 'ffx',
    category: 'special',
    mpCost: 10,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'silence', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-silence-buster',
    sfxKey: 'sfx-silence-buster',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-silence-buster' },
  },

  // ffx-combat-core §7.2 — row 14, rank 3, MP 10, DmgCon 16. Darkness, chance
  // 254, duration 1.
  'dark-buster': {
    id: 'dark-buster',
    name: 'Dark Buster',
    game: 'ffx',
    category: 'special',
    mpCost: 10,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [{ status: 'darkness', chance: 254, duration: 1 }],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-dark-buster',
    sfxKey: 'sfx-dark-buster',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-dark-buster' },
  },

  // ffx-combat-core §7.2 — row 15, rank 3, MP 24, DmgCon 16. Sleep + Silence
  // + Darkness, each chance 100 duration 3.
  'triple-foul': {
    id: 'triple-foul',
    name: 'Triple Foul',
    game: 'ffx',
    category: 'special',
    mpCost: 24,
    rank: 3,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [
      { status: 'sleep', chance: 100, duration: 3 },
      { status: 'silence', chance: 100, duration: 3 },
      { status: 'darkness', chance: 100, duration: 3 },
    ],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS],
    animationKey: 'skill-triple-foul',
    sfxKey: 'sfx-triple-foul',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-triple-foul' },
  },

  // ffx-combat-core §7.1/§7.3 — row 6, rank 6, MP 8, DmgCon 16. No status;
  // `weak-delay` flag pushes the target's CTB by +1.5x its base value.
  'delay-attack': {
    id: 'delay-attack',
    name: 'Delay Attack',
    game: 'ffx',
    category: 'special',
    mpCost: 8,
    rank: 6,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS, 'weak-delay'],
    animationKey: 'skill-delay-attack',
    sfxKey: 'sfx-delay-attack',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-delay-attack' },
  },

  // ffx-combat-core §7.1/§7.3 — row 7, rank 8, MP 18, DmgCon 16. No status;
  // `strong-delay` flag pushes the target's CTB by +3x its base value.
  'delay-buster': {
    id: 'delay-buster',
    name: 'Delay Buster',
    game: 'ffx',
    category: 'special',
    mpCost: 18,
    rank: 8,
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    element: [],
    targeting: 'single-enemy',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [...WEAPON_FLAGS, 'strong-delay'],
    animationKey: 'skill-delay-buster',
    sfxKey: 'sfx-delay-buster',
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-delay-buster' },
  },
};
