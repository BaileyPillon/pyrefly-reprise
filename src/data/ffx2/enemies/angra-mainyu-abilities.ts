/**
 * The actions of Angra Mainyu, Zarich and Tawrich in the full fight (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter "Angra Mainyu", number 26, typed word `angra`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: **the game's own rows** (`research/re-ffx2-angra-mainyu.md` §4.3, §10 and the appendix, the RE parity session, 2026-10-14): the three
 * monsters' ability lists and the move rows, which `../command-records/angra-mainyu.ts` lays on these abilities by id, so the charge, the recovery, the target flags, the damage type, the hit rule, the
 * statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and pinned against them by
 * `tests/unit/chapters/angra-mainyu-data.test.ts`. What each move does in words is also the FF Wiki's and Jegged's (`research/ffx2-angra-mainyu.md` §3), which the rows agree with.
 *
 * - **Perdition's Flame** (0x412d, boss): **10 hits**, each on a random girl (the row's random-target bit), each **3/16 of that girl's maximum HP** (formula 7, power 3); **physical**, so Protect halves
 *   it and Shell does not; never rolls. **Osmose** (0x406d, the Leblanc Syndicate's row too): the MP class, formula 4, power 3: 3/16 of each girl's current MP, absorbed by the boss; aimed at the whole party.
 *   **Full-Life** (0x30ba): 100 percent of maximum HP and clears Death, 60 MP. **Curaga** (0x30b5): 2,019 to 2,280 HP, 20 MP. **Bio** (0x3085): Poison, 16 MP. **Demi** (0x3082): 25 percent of each
 *   girl's current HP, element Gravity, 10 MP. **Dispel** (0x30b8): cleanses one girl's buffs, 12 MP. **Flare** (0x3170): formula 2, power 55, 54 MP. All six are the party's own command rows, borrowed.
 * - **Glimmer of Despair** (0x412a, Zarich): the MP class, formula 2, power 8, the whole party, and **Strength -1, Magic -1, Defense -2, Magic Defense -2** (steps; the wiki says "one level" each).
 *   **Firaga, Waterga, Thundaga, Blizzaga** (0x41f1, 0x41f4, 0x41f3, 0x41f2, Zarich): formula 2, power 19, one living girl, 24 MP. (The four -ra spells of her capped, level 3 fight are not built.)
 * - **Punch** (0x4129, Tawrich): formula 0, power 12, physical, **the only move of the three that rolls to hit** (accuracy formula 1, byte 125). **Bloody Breath** (0x412b, Tawrich): formula 2, power 12,
 *   the whole party, **neither physical nor magical** (neither Shell nor Protect reduces it), and Silence, Darkness and Poison at 254, Confusion at 128.
 *
 * **Hit rule** (hard rule 5): Punch rolls; **every other move is `canMiss: false`, set explicitly** (the rows' accuracy formula is 0), because an unset field silently rolls and the engine reads only `canMiss === false`.
 * **Multi-target halving**: the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so none of these takes any.
 * Not built, because it is no part of the full fight: Unnatural Selection (0x412c, the capped fights' eject) and the Die row (0x412e, presentation only). Every id here is `x2-`-prefixed so nothing of the FFX data is touched.
 */

import type { AbilityDef, ElementId } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: accuracy formula 0 on every row but Punch's (Punch alone overrides this with `true`)
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const ANGRA_PERDITIONS_FLAME_ID = 'x2-angra-perditions-flame';
export const ANGRA_OSMOSE_ID = 'x2-angra-osmose';
export const ANGRA_FULL_LIFE_ID = 'x2-angra-full-life';
export const ANGRA_CURAGA_ID = 'x2-angra-curaga';
export const ANGRA_BIO_ID = 'x2-angra-bio';
export const ANGRA_DEMI_ID = 'x2-angra-demi';
export const ANGRA_DISPEL_ID = 'x2-angra-dispel';
export const ANGRA_FLARE_ID = 'x2-angra-flare';
export const ZARICH_GLIMMER_ID = 'x2-zarich-glimmer-of-despair';
export const TAWRICH_PUNCH_ID = 'x2-tawrich-punch';
export const TAWRICH_BLOODY_BREATH_ID = 'x2-tawrich-bloody-breath';

/** Zarich's four spells in the fixed order her script goes round them (index 1 to 3, then 4 wraps to 0): Firaga, Waterga, Thundaga, Blizzaga [RE §9.7]. */
export const ZARICH_SPELL_IDS = ['x2-zarich-firaga', 'x2-zarich-waterga', 'x2-zarich-thundaga', 'x2-zarich-blizzaga'] as const;

/** The name and element of each spell, by position in {@link ZARICH_SPELL_IDS} (the rows' element bits 0x1, 0x8, 0x4, 0x2). */
const SPELLS: ReadonlyArray<{ name: string; element: ElementId }> = [
  { name: 'Firaga', element: 'fire' },
  { name: 'Waterga', element: 'water' },
  { name: 'Thundaga', element: 'lightning' },
  { name: 'Blizzaga', element: 'ice' },
];

/** The three bodies' abilities. */
export const x2AngraMainyuAbilities: AbilityDef[] = [
  // ---- Angra Mainyu -------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: ANGRA_PERDITIONS_FLAME_ID,
    name: "Perdition's Flame",
    power: 3, // 3/16 of the girl's maximum HP a hit [row 0x412d: formula 7, power 3; wiki "3/16 of max HP", Jegged "18.75 percent"] [verified: 3 sources]
    formula: 'percent-total',
    damageType: 'physical', // damage flags 0x1: Protect halves it, Shell does not
    element: ['none'],
    targeting: 'random-enemy', // each hit a fresh random girl (the row's random-target bit 0x4000)
    hits: 10, // [row 0x412d]
    messageTemplate: "Angra Mainyu unleashes Perdition's Flame",
  },
  {
    ...base,
    id: ANGRA_OSMOSE_ID,
    name: 'Osmose',
    power: 3, // 3/16 of each girl's current MP, absorbed [row 0x406d: class 2, formula 4, power 3, the absorb bit]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies', // aimed at the whole party [RE §9.5 row 2, §9.6]
    flags: ['drains-mp'],
    extra: { mpOnly: true },
    messageTemplate: 'Angra Mainyu casts Osmose',
  },
  {
    ...base,
    id: ANGRA_FULL_LIFE_ID,
    name: 'Full-Life',
    mpCost: 60, // [row 0x30ba]
    power: 16, // 100 percent of maximum HP and clears Death [row 0x30ba: formula 7, power 16, Death chance 254]
    formula: 'percent-total',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-ally', // a fallen arm (by monster id)
    flags: ['heals', 'can-target-dead', 'misses-if-target-alive'],
    statusEffects: [],
    messageTemplate: 'Angra Mainyu casts Full-Life on {target}',
  },
  {
    ...base,
    id: ANGRA_CURAGA_ID,
    name: 'Curaga',
    mpCost: 20, // [row 0x30b5]
    power: 38, // heals 2,019 to 2,280 HP at his level and Magic [row 0x30b5: formula 6, power 38]
    formula: 'healing',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-ally', // Zarich or Tawrich, by monster id, even at full health [RE §9.5 roll 1]
    flags: ['heals'],
    messageTemplate: 'Angra Mainyu casts Curaga on {target}',
  },
  {
    ...base,
    id: ANGRA_BIO_ID,
    name: 'Bio',
    mpCost: 16, // [row 0x3085]
    power: 0,
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'poison', chance: 100, duration: 0 }], // the row's Poison byte, 100
    messageTemplate: 'Angra Mainyu casts Bio',
  },
  {
    ...base,
    id: ANGRA_DEMI_ID,
    name: 'Demi',
    mpCost: 10, // [row 0x3082]
    power: 4, // a quarter of each girl's current HP [row 0x3082: formula 4, power 4; wiki, Jegged] [verified: 3 sources]
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'], // element bit 0x10
    targeting: 'all-enemies',
    messageTemplate: 'Angra Mainyu casts Demi',
  },
  {
    ...base,
    id: ANGRA_DISPEL_ID,
    name: 'Dispel',
    mpCost: 12, // [row 0x30b8]
    power: 0,
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy', // one living girl, uniformly, only when every living girl has Reflect [RE §9.5 roll 0]
    removesStatuses: ['auto-life', 'shell', 'protect', 'reflect', 'regen', 'haste', 'spellspring'],
    flags: ['removes-statuses'],
    messageTemplate: 'Angra Mainyu casts Dispel on {target}',
  },
  {
    ...base,
    id: ANGRA_FLARE_ID,
    name: 'Flare',
    mpCost: 54, // [row 0x3170]
    power: 55, // [row 0x3170: formula 2, power 55; attacker term 9,027 at his level and Magic]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy', // the near-weighted pick of a living girl without Reflect
    messageTemplate: 'Angra Mainyu casts Flare on {target}',
  },

  // ---- Zarich (the left arm: magic) ---------------------------------------------------------------------------------------------
  {
    ...base,
    id: ZARICH_GLIMMER_ID,
    name: 'Glimmer of Despair',
    power: 8, // the MP class, formula 2, power 8 [row 0x412a]
    formula: 'magic',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    extra: { damagesPool: 'mp', mpOnly: true },
    // Strength -1, Magic -1, Defense -2 and Magic Defense -2 (group-2 slots 7 to 10, chance 255, steps -1, -1, -2, -2 [row 0x412a]; the wiki says "one level" each)
    statusEffects: [
      { status: 'str-down', chance: 255, duration: 255, stacks: 1 },
      { status: 'mag-down', chance: 255, duration: 255, stacks: 1 },
      { status: 'def-down', chance: 255, duration: 255, stacks: 2 },
      { status: 'mdef-down', chance: 255, duration: 255, stacks: 2 },
    ],
    messageTemplate: 'Zarich uses Glimmer of Despair',
  },
  ...SPELLS.map(
    (spell, i): AbilityDef => ({
      ...base,
      id: ZARICH_SPELL_IDS[i] as string,
      name: spell.name,
      mpCost: 24, // [rows 0x41f1 to 0x41f4]
      power: 19, // formula 2, power 19 [rows 0x41f1 to 0x41f4]
      formula: 'magic',
      damageType: 'magical',
      element: [spell.element],
      targeting: 'single-enemy', // one living girl, uniformly, in the full fight
      flags: ['reflectable'],
      messageTemplate: `Zarich casts ${spell.name} on {target}`,
    }),
  ),

  // ---- Tawrich (the right arm: strength) ----------------------------------------------------------------------------------------
  {
    ...base,
    id: TAWRICH_PUNCH_ID,
    name: 'Punch',
    power: 12, // formula 0, power 12 [row 0x4129]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy', // the near-weighted pick of a living girl
    canMiss: true, // **the only move of the three that rolls to hit**: accuracy formula 1, byte 125 [row 0x4129]
    messageTemplate: 'Tawrich punches {target}',
  },
  {
    ...base,
    id: TAWRICH_BLOODY_BREATH_ID,
    name: 'Bloody Breath',
    power: 12, // formula 2, power 12 [row 0x412b]
    formula: 'magic',
    damageType: 'other', // damage flags 0: neither Shell nor Protect reduces it
    element: ['none'],
    targeting: 'all-enemies',
    // Silence 254, Darkness 254, Poison 254, Confusion 128 [row 0x412b; the wiki and Jegged name the four]
    statusEffects: [
      { status: 'silence', chance: 254, duration: 0 },
      { status: 'darkness', chance: 254, duration: 0 },
      { status: 'poison', chance: 254, duration: 0 },
      { status: 'confuse', chance: 128, duration: 0 },
    ],
    messageTemplate: 'Tawrich uses Bloody Breath',
  },
];
