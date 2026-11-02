/**
 * The actions of the four Fallen Maesters in their NORMAL versions (the Via Infinito floor fights 20, 40, 60 and 80: Aranea, Black Elemental, Concherer, Chac; the hidden chapter "The Fallen Maesters"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-fallen-maesters.md` §4.3, §8 and the appendix, the RE parity session, 2026-10-19), which `../command-records/fallen-maesters.ts` lays on these
 * abilities by id, so the charge, the recovery, the target flags, the damage type, the hit rule, the statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading,
 * kept consistent with them and pinned against them by `tests/unit/chapters/fallen-maesters-data.test.ts`. Every id here is `x2-`-prefixed so nothing of the FFX data is touched.
 *
 * - **Aranea** (`m221`): **Attack** (0x4003: two hits of power 8, the monster's own Attack row, not the generic one), **Spider Bite** (0x40ca: power 32, formula 1, no Defense term, an 8.7 s charge) and **Gooey End**
 *   (0x40c9: the whole party for 140 to 158 HP, Poison, Stop with a counter of 25, Strength and Magic down one stage).
 * - **Black Elemental** (`m069`): **Absorb** (0x304b: HP and MP together, taken by the user), **Ultima** (0x3171: power 70, the whole party, **not reflectable**), **Flare** (0x3170: power 55, one girl, reflectable), **Berserk**
 *   (0x406a) and **Magic Up** (0x41dd: its own Magic stage +2).
 * - **Concherer** (`m232`): **Attack** (0x400e: power 32, shatter 100), **Megaton Press** (0x40ba: power 254, formula 1 so no Defense term, cap 99,999), **Gunk** (0x40b9: all of one girl's maximum MP, and Poison) and
 *   **Broken shell** (0x40bb: a row with no effect, the presentation of the shell breaking; the engine announces it as a message).
 * - **Chac** (`m239`): **Attack** (0x400e again, shatter 100), **Stony Glare** (0x401c: Petrify at 255) and **Heaven's Cataract** (0x405a: power 58, the whole party, shatter 100, cap 99,999, and the five stages
 *   DEF, MDEF, ACC and the two slots 12 and 13 down ten each).
 *
 * **Hit rule** (hard rule 5): the two Attacks that roll (`accuracy formula 2`, the race with the monster's ACC) are the ONLY moves of the four that can miss, and each sets `canMiss: true`; every other move carries
 * `canMiss: false` explicitly because its accuracy formula is 0 or 1 (the rows read "always hits"), and an unset field silently rolls.
 * **Multi-target halving:** the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so none of these takes any.
 * **Not built here:** the Oversoul versions' moves (Dual Catalyst, Tempus Laxit, Slurp, Demi, Hunter's Gaze, Destroy Soft, Destroy Remedy, 10,000 Gil Smoosher and the rest of `research/re-ffx2-fallen-maesters.md` §9.3): FM2 (a), normal only.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false as const, // rule 5: accuracy formula 0 or 1 on every row but the two Attacks (which override this with `true`)
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const ARANEA_ATTACK_ID = 'x2-aranea-attack';
export const ARANEA_SPIDER_BITE_ID = 'x2-aranea-spider-bite';
export const ARANEA_GOOEY_END_ID = 'x2-aranea-gooey-end';
export const BLACK_ELEMENTAL_ABSORB_ID = 'x2-black-elemental-absorb';
export const BLACK_ELEMENTAL_ULTIMA_ID = 'x2-black-elemental-ultima';
export const BLACK_ELEMENTAL_FLARE_ID = 'x2-black-elemental-flare';
export const BLACK_ELEMENTAL_BERSERK_ID = 'x2-black-elemental-berserk';
export const BLACK_ELEMENTAL_MAGIC_UP_ID = 'x2-black-elemental-magic-up';
export const CONCHERER_ATTACK_ID = 'x2-concherer-attack';
export const CONCHERER_MEGATON_PRESS_ID = 'x2-concherer-megaton-press';
export const CONCHERER_GUNK_ID = 'x2-concherer-gunk';
export const CONCHERER_BROKEN_SHELL_ID = 'x2-concherer-broken-shell';
export const CHAC_ATTACK_ID = 'x2-chac-attack';
export const CHAC_STONY_GLARE_ID = 'x2-chac-stony-glare';
export const CHAC_HEAVENS_CATARACT_ID = 'x2-chac-heavens-cataract';

/** The abilities of the four fiends. */
export const x2FallenMaestersAbilities: AbilityDef[] = [
  // ---- Aranea (floor 20) ----------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: ARANEA_ATTACK_ID,
    name: 'Attack',
    power: 8, // two hits of power 8 [row 0x4003: formula 0, hits 2, power 8, crit byte 5, accuracy byte 200] (RE §8)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy', // the near-weighted pick of a living girl
    hits: 2,
    canMiss: true, // accuracy formula 2: the race with her ACC (RE §8: "race with ACC")
    messageTemplate: 'Aranea attacks {target}',
  },
  {
    ...base,
    id: ARANEA_SPIDER_BITE_ID,
    name: 'Spider Bite',
    power: 32, // formula 1 (no Defense term), power 32, charge 180 (8.68 s at AGI 72) [row 0x40ca] (RE §8)
    formula: 'piercing-strength',
    damageType: 'other', // the row's damage flags are 0x0 [appendix]: neither Protect nor Shell reduces it (RE §8's table text says "physical"; the row wins)
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Aranea uses Spider Bite on {target}',
  },
  {
    ...base,
    id: ARANEA_GOOEY_END_ID,
    name: 'Gooey End',
    power: 3, // formula 8 (fixed, with variance): 140 to 158 HP to each girl [row 0x40c9]
    formula: 'fixed',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    // Poison 254, Stop 254 with a counter of 25, Strength -1 and Magic -1 (255) [row 0x40c9; the record carries the counter and the steps]
    statusEffects: [
      { status: 'poison', chance: 254, duration: 0 },
      { status: 'stop', chance: 254, duration: 0 },
      { status: 'str-down', chance: 255, duration: 255, stacks: 1 },
      { status: 'mag-down', chance: 255, duration: 255, stacks: 1 },
    ],
    messageTemplate: 'Aranea uses Gooey End',
  },

  // ---- Black Elemental (floor 40) ---------------------------------------------------------------------------------------------------
  {
    ...base,
    id: BLACK_ELEMENTAL_ABSORB_ID,
    name: 'Absorb',
    mpCost: 3, // [row 0x304b] (RE §8)
    power: 8, // HP and MP together (class 3), formula 9 (a Magic cubic), power 8, taken by the user
    formula: 'special-magic',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // the living girl with the most current HP
    flags: ['drains'],
    messageTemplate: 'Black Elemental uses Absorb on {target}',
  },
  {
    ...base,
    id: BLACK_ELEMENTAL_ULTIMA_ID,
    name: 'Ultima',
    mpCost: 90, // [row 0x3171] (RE §8)
    power: 70, // formula 2, power 70, the whole party, shatter 100; **not reflectable** (the row lacks the reflectable bit)
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Black Elemental casts Ultima',
  },
  {
    ...base,
    id: BLACK_ELEMENTAL_FLARE_ID,
    name: 'Flare',
    mpCost: 54, // [row 0x3170] (RE §8)
    power: 55, // formula 2, power 55, one girl, shatter 100; reflectable
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    messageTemplate: 'Black Elemental casts Flare on {target}',
  },
  {
    ...base,
    id: BLACK_ELEMENTAL_BERSERK_ID,
    name: 'Berserk',
    mpCost: 6, // [row 0x406a] (RE §8)
    power: 0, // status only: Berserk 75
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy', // a living girl without Berserk
    flags: ['reflectable'],
    statusEffects: [{ status: 'berserk', chance: 75, duration: 0 }],
    messageTemplate: 'Black Elemental casts Berserk on {target}',
  },
  {
    ...base,
    id: BLACK_ELEMENTAL_MAGIC_UP_ID,
    name: 'Magic Up',
    power: 0, // its own Magic stage +2, chance 255 [row 0x41dd] (RE §8)
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    statusEffects: [{ status: 'mag-up', chance: 255, duration: 255, stacks: 2 }],
    messageTemplate: 'Black Elemental casts Magic Up',
  },

  // ---- Concherer (floor 60) ---------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: CONCHERER_ATTACK_ID,
    name: 'Attack',
    power: 32, // formula 0, power 32, one hit, crit byte 15, shatter 100 [row 0x400e] (RE §8)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true, // accuracy formula 2: the race with its ACC
    messageTemplate: 'Concherer attacks {target}',
  },
  {
    ...base,
    id: CONCHERER_MEGATON_PRESS_ID,
    name: 'Megaton Press',
    power: 254, // formula 1 (no Defense term), power 254, cap 99,999, always hits [row 0x40ba]: about 55,000 to 62,000, half through Protect
    formula: 'piercing-strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
    messageTemplate: 'Concherer uses Megaton Press on {target}',
  },
  {
    ...base,
    id: CONCHERER_GUNK_ID,
    name: 'Gunk',
    mpCost: 4, // [row 0x40b9] (RE §8)
    power: 16, // the MP class, formula 7, power 16: ALL of the girl's maximum MP, and Poison 254
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    extra: { damagesPool: 'mp', mpOnly: true },
    statusEffects: [{ status: 'poison', chance: 254, duration: 0 }],
    messageTemplate: 'Concherer uses Gunk on {target}',
  },
  {
    ...base,
    id: CONCHERER_BROKEN_SHELL_ID,
    name: 'Broken shell',
    power: 0, // an effect-less row on itself: the shell breaking, presentation only [row 0x40bb] (RE §8)
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 0,
    messageTemplate: "Concherer's shell breaks",
  },

  // ---- Chac (floor 80) --------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: CHAC_ATTACK_ID,
    name: 'Attack',
    power: 32, // the same row as Concherer's, 0x400e: shatter 100 (a petrified girl who is hit is destroyed)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Chac attacks {target}',
  },
  {
    ...base,
    id: CHAC_STONY_GLARE_ID,
    name: 'Stony Glare',
    power: 0, // status only: Petrify 255, through any resist [row 0x401c]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // a living girl who is not already stone
    statusEffects: [{ status: 'petrify', chance: 255, duration: 0 }],
    messageTemplate: 'Chac uses Stony Glare on {target}',
  },
  {
    ...base,
    id: CHAC_HEAVENS_CATARACT_ID,
    name: "Heaven's Cataract",
    mpCost: 12, // [row 0x405a] (RE §8)
    power: 58, // formula 2, power 58, the whole party, shatter 100, cap 99,999 [row 0x405a]
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
    // DEF, MDEF, ACC and the two slots 12 and 13 (Evasion and Luck by the wiki-level list, [I]) down ten stages each, chance 255 [row 0x405a]
    statusEffects: [
      { status: 'def-down', chance: 255, duration: 255, stacks: 10 },
      { status: 'mdef-down', chance: 255, duration: 255, stacks: 10 },
      { status: 'accu-down', chance: 255, duration: 255, stacks: 10 },
      { status: 'eva-down', chance: 255, duration: 255, stacks: 10 },
      { status: 'luck-down', chance: 255, duration: 255, stacks: 10 },
    ],
    messageTemplate: "Chac unleashes Heaven's Cataract",
  },
];
