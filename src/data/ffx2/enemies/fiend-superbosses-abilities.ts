/**
 * The ability definitions THIS chapter adds for the hidden chapter "The Fiend Arena Superbosses" (Almighty Shinra, then the Major Numerus: `monster.bin` rows 329 to 336). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-fiend-arena-superbosses.md` sections 3 and 4), which `../command-records/fiend-superbosses.ts` lays on these abilities by id, so the charge, the recovery, the target
 * flags, the damage type, the hit rule, the statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and pinned against them by
 * `tests/unit/chapters/fiend-superbosses-data.test.ts` (against `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json`, which a script decoded from the kernel tables). Every id is `x2-fs-`-prefixed so nothing of the
 * FFX data is touched, and the list of what each script queues is `FS_ABILITY` in `../../fiend-superbosses-ids.ts`.
 *
 * **Why thirteen definitions and not thirty-five.** The five scripts queue 35 distinct moves (36 rows with the Die row of the death handler, which is not a move here: the parts are `isPart`). Twenty-two of them are rows another
 * chapter already ships with the right target and an explicit hit rule (the Cup's Seymour Ultima, Black Sky, Meteor, Demi, Slowga, Break and Absorb; the Paragon's Final Impact, Holy and the four -agas; the Fiend Arena Trema's
 * Flare and Ultima; Angra Mainyu's Bio; Elma's Sleep; the Black Elemental's Berserk; Garik's Blind; the Cup's Auron Full Break and Tidus Attack; Cindy's White Highwind): those are **reused by id** and pinned equal to the
 * fixture. The thirteen below are the eight rows no chapter holds (Clione, Fireworks, Haste, Sparkler and the four Commands) and the five another chapter holds with the wrong target for these scripts (Dispel, Shell and Protect
 * aimed at one girl or at the monster side; Confuse and Silence on one girl, where the Cup's Confuse is fanned out to the party and the Fiend Arena Baralai's Silence reaches all three).
 *
 * - **Clione** (Shinra, 0x4210): ten hits of power 24 spread over the girls, 180 charge, no accuracy roll.
 * - **Fireworks** (Shinra and Quattour, 0x3076) and **Sparkler** (Unum, 0x3075): Defense-ignoring physical blows (formula 1, power 24), accuracy formula 2; Fireworks on all, Sparkler on one.
 * - **Haste** (Shinra, 0x3176): Haste 254 for a count of 50 on himself.
 * - **The four Commands** (0x421a Radis, 0x421b Venam, 0x421c Fulmen, 0x421d Mortis): a 220 charge, **no physical and no magical bit in the damage flags (so Protect and Shell are not asked)**, and the **99,999 damage-limit bit**
 *   (`flagsDamage & 0x80`). Radis is formula 1 power 58 on one girl, Venam formula 1 power 30 on all with Poison 254, Fulmen formula 0 power **255** Thunder on all, Mortis formula 1 power 36 on all.
 * - **Dispel, Shell, Protect, Confuse, Silence**: the rows 0x30b8, 0x30bb, 0x30bc, 0x3083 and 0x4071 with the targets the scripts give them.
 *
 * **Hit rule** (hard rule 5): `canMiss` follows the row's accuracy formula (`flagsMisc` bits 3 to 5): `true` for Fireworks and Sparkler (formula 2), `false` for every other move, set explicitly because an unset field silently rolls.
 * Source: `research/re-ffx2-fiend-arena-superbosses.md` §3 (the scripts) and §4 (the moves).
 * Confidence: [verified: the game's own table, decoded by a script and pinned by `tests/unit/chapters/fiend-superbosses-data.test.ts`]; where a field is `[I]` it says so.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { FS_ABILITY } from '../../fiend-superbosses-ids.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: set to `true` below only where the row's accuracy formula is not 0
};

/** What Dispel strips (the row's status words: Shell, Protect, Reflect, Regen and Haste, and the four "always" statuses, of which the engine has Spellspring and Auto-Life) [row 0x30b8]. */
const DISPEL_STRIPS = ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring'] as const;

export const x2FiendSuperbossesAbilities: AbilityDef[] = [
  // ---- Almighty Shinra ----------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FS_ABILITY.clione,
    name: 'Clione',
    mpCost: 30, // [row 0x4210]; Shinra's Spellspring makes it 0
    power: 24, // formula 0, power 24, TEN hits spread on random girls (the random-target bit 0x4000), cast 180, crit 10, shatter 80
    hits: 10,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'random-enemy',
    messageTemplate: '{user} unleashes Clione',
  },
  {
    ...base,
    id: FS_ABILITY.fireworks,
    name: 'Fireworks',
    mpCost: 18, // [row 0x3076] (a party row)
    power: 24, // formula 1 (ignores Defense), power 24, all girls, cast 90; accuracy formula 2 (the race with ACC)
    formula: 'piercing-strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: true,
    messageTemplate: '{user} uses Fireworks',
  },
  {
    ...base,
    id: FS_ABILITY.haste,
    name: 'Haste',
    mpCost: 16, // [row 0x3176]
    power: 0, // himself: Haste 254 for a count of 50; magical, reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['reflectable'],
    statusEffects: [{ status: 'haste', chance: 254, duration: 0 }],
    messageTemplate: '{user} casts Haste',
  },

  // ---- Unum ---------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FS_ABILITY.radisCommand,
    name: 'Radis Command',
    power: 58, // formula 1 (ignores Defense), power 58, ONE girl, cast 220 (about 4.5 s of warning); damage flags 0x80: no physical and no magical bit, and the 99,999 limit bit
    formula: 'piercing-strength',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
    messageTemplate: '{user} unleashes Radis Command on {target}',
  },
  {
    ...base,
    id: FS_ABILITY.sparkler,
    name: 'Sparkler',
    mpCost: 12, // [row 0x3075] (a party row)
    power: 24, // formula 1 (ignores Defense), power 24, one girl, cast 80; accuracy formula 2
    formula: 'piercing-strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: '{user} uses Sparkler on {target}',
  },
  {
    ...base,
    id: FS_ABILITY.dispel,
    name: 'Dispel',
    mpCost: 12, // [row 0x30b8]
    power: 0, // ONE girl (the row's target is single; the script aims it at "a living girl", RE section 3.2): Shell, Protect, Reflect, Regen, Haste and the "always" statuses off at chance 254
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    removesStatuses: [...DISPEL_STRIPS],
    flags: ['removes-statuses'],
    messageTemplate: '{user} casts Dispel on {target}',
  },
  {
    ...base,
    id: FS_ABILITY.shell,
    name: 'Shell',
    mpCost: 10, // [row 0x30bb]
    power: 0, // the monster side (the script casts it "on all monsters if any monster lacks Shell"): Shell 254 for a count of 110; magical, reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-allies',
    flags: ['reflectable'],
    statusEffects: [{ status: 'shell', chance: 254, duration: 0 }],
    messageTemplate: '{user} casts Shell',
  },
  {
    ...base,
    id: FS_ABILITY.protect,
    name: 'Protect',
    mpCost: 12, // [row 0x30bc]
    power: 0, // the monster side: Protect 254 for a count of 110; magical, reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-allies',
    flags: ['reflectable'],
    statusEffects: [{ status: 'protect', chance: 254, duration: 0 }],
    messageTemplate: '{user} casts Protect',
  },

  // ---- Duo ----------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FS_ABILITY.confuse,
    name: 'Confuse',
    mpCost: 12, // [row 0x3083]
    power: 0, // ONE girl: Confusion 100 (the Cup's Seymour fans the same row out to the party; Duo's script aims at "the girls" and the row is single, RE section 3.3, so the engine picks one)
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    statusEffects: [{ status: 'confuse', chance: 100, duration: 0 }],
    messageTemplate: '{user} casts Confuse on {target}',
  },
  {
    ...base,
    id: FS_ABILITY.silence,
    name: 'Silence',
    mpCost: 8, // [row 0x4071]
    power: 0, // ONE girl: Silence 75; damage flags 0 (neither physical nor magical); reflectable
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    statusEffects: [{ status: 'silence', chance: 75, duration: 0 }],
    messageTemplate: '{user} casts Silence on {target}',
  },
  {
    ...base,
    id: FS_ABILITY.venamCommand,
    name: 'Venam Command',
    power: 30, // formula 1 (ignores Defense), power 30, all girls, cast 220, Poison 254; the 99,999 limit bit
    formula: 'piercing-strength',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
    statusEffects: [{ status: 'poison', chance: 254, duration: 0 }],
    messageTemplate: '{user} unleashes Venam Command',
  },

  // ---- Tria ---------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FS_ABILITY.fulmenCommand,
    name: 'Fulmen Command',
    power: 255, // formula 0, power 255 (the strongest attack in the game), THUNDER, all girls, cast 220; the 99,999 limit bit; no accuracy roll
    formula: 'strength',
    damageType: 'other',
    element: ['lightning'],
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
    messageTemplate: '{user} unleashes Fulmen Command',
  },

  // ---- Quattour -----------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FS_ABILITY.mortisCommand,
    name: 'Mortis Command',
    power: 36, // formula 1 (ignores Defense), power 36, all girls, cast 220; the 99,999 limit bit
    formula: 'piercing-strength',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
    messageTemplate: '{user} unleashes Mortis Command',
  },
];
