/**
 * The actions of Garik Ronso and the Ronso Youths (FFX-2 Chapter 3, the mission "Battle Blockade" at the top of Mt. Gagazet; the hidden chapter "Garik Ronso", number 47). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-garik-ronso.md` sections 2 and 3, `monmagic.bin` 0x41da, 0x4000, 0x411c, 0x411d, 0x406f, 0x4084 and 0x4232 to 0x4236, `command.bin` 0x30bb and 0x30bc), which
 * `../command-records/garik-ronso.ts` lays on these abilities by id, so the charge, the recovery, the target flags, the damage type, the hit rule, the element and every other field the engine reads are the rows' own; the
 * fields here are the ability's own reading, kept consistent with them and pinned against them by `tests/unit/chapters/garik-ronso-data.test.ts` (and the numbers-only fixture `tests/fixtures/parity/ffx2/garik_ronso_rows.json`).
 * Every id is `x2-garik-` or `x2-ronso-` prefixed so nothing of the party's own data (the Gun Mage's Mighty Guard, the White Mage's Shell and Protect) is touched. The FFX Ronso (Kimahri, Biran, Yenke) are other monsters of
 * another game and **no number of them is used**; the Cup versions of Garik (row 324, Lv 67) are the Fiend Arena's, another fight.
 *
 * - **Garik** (`m182`): **Attack** (the plain row 0x41da, no cancel), **Bane Lance** (0x411c: a physical blow with the race against accuracy 110, power 16, **Curse** at 254; MP 8), **Blind** (0x406f: Darkness 75, reflectable; MP 8),
 *   **Mighty Guard** (0x4084: Shell and Protect 126 units, Regen and Haste 90, Defense and Magic Defense up two stages, Evasion up one, on every monster; MP 18) and, on himself, **Shell** and **Protect** (0x30bb, 0x30bc: 110
 *   units; MP 10 and 12).
 * - **The Ronso Youth** (`m181`): **Attack** (0x4000) and **MP Blowout** (0x411d: the MP class, formula 7, power 16: all of one girl's maximum MP, after the race against accuracy 120; MP 10).
 * - **The "battle too long" block** (both scripts; **inert in play**, the rows are carried and no script queues them, `ai/garik-ronso.ts`): four announcements (0x4232 to 0x4235: damage formula 0, power 0, no hits; scripted flavour turns on himself, in our own words) and **Time Up Meteor** (0x4236, formula 5, power
 *   200, 12 hits, everyone, neither physical nor magical).
 *
 * **Hit rule** (hard rule 5): the two Attacks, Bane Lance and MP Blowout roll (the race against the row's accuracy byte, formula 1 or 2: `canMiss: true`); Blind, Mighty Guard, Shell, Protect and Time Up Meteor have accuracy
 * formula 0 ("never rolls") and carry `canMiss: false` explicitly, because an unset field silently rolls. **Multi-target halving:** the FFX-2 engine halves only the party's own Black and White Magic cast on all
 * (`resolve-strike.ts`), so Mighty Guard and Time Up Meteor take none. Confidence: [verified: the game's own table].
 */

import type { AbilityDef, StatusApplication } from '../../../battle/common/types.ts';

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

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const GARIK_ATTACK_ID = 'x2-garik-attack';
export const GARIK_BANE_LANCE_ID = 'x2-garik-bane-lance';
export const GARIK_BLIND_ID = 'x2-garik-blind';
export const GARIK_MIGHTY_GUARD_ID = 'x2-garik-mighty-guard';
export const GARIK_SHELL_ID = 'x2-garik-shell';
export const GARIK_PROTECT_ID = 'x2-garik-protect';
export const YOUTH_ATTACK_ID = 'x2-ronso-youth-attack';
export const YOUTH_MP_BLOWOUT_ID = 'x2-ronso-youth-mp-blowout';
/** The "battle too long" block: four announcements in order, then Time Up Meteor every poll (both scripts). */
export const RONSO_ANGRY_ID = 'x2-ronso-angry';
export const RONSO_FURIOUS_ID = 'x2-ronso-furious';
export const RONSO_ABOUT_TO_BLOW_ID = 'x2-ronso-about-to-blow';
export const RONSO_ENDS_NOW_ID = 'x2-ronso-ends-now';
export const RONSO_TIME_UP_METEOR_ID = 'x2-ronso-time-up-meteor';
export const RONSO_ANNOUNCEMENT_IDS = [RONSO_ANGRY_ID, RONSO_FURIOUS_ID, RONSO_ABOUT_TO_BLOW_ID, RONSO_ENDS_NOW_ID] as const;

/** Mighty Guard's rider statuses, the row's status words (group 2 slots 0, 1, 3, 4, 9, 10 and 12, all at chance 254): the timed ones' counters are the record's (126, 126, 90, 90); the three stages are +2, +2, +1. */
export const MIGHTY_GUARD_STATUSES: readonly StatusApplication[] = [
  { status: 'shell', chance: 254, duration: 0 },
  { status: 'protect', chance: 254, duration: 0 },
  { status: 'regen', chance: 254, duration: 0 },
  { status: 'haste', chance: 254, duration: 0 },
  { status: 'def-up', chance: 254, duration: 255, stacks: 2 },
  { status: 'mdef-up', chance: 254, duration: 255, stacks: 2 },
  { status: 'eva-up', chance: 254, duration: 255, stacks: 1 },
];

/** A scripted flavour turn on himself: no damage, no status; the engine shows the banner. */
function announcement(id: string, name: string, line: string): AbilityDef {
  return {
    ...base,
    id,
    name,
    power: 0, // the row: damage formula 0, power 0, no hits [RE §3]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    messageTemplate: line,
  };
}

/** Garik's and the Youth's abilities. */
export const x2GarikRonsoAbilities: AbilityDef[] = [
  // ---- Garik --------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: GARIK_ATTACK_ID,
    name: 'Attack',
    power: 16, // row 0x41da: formula 0, power 16, crit 5, shatter 10, accuracy formula 2 (the race with his ACC 95)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Garik attacks {target}',
  },
  {
    ...base,
    id: GARIK_BANE_LANCE_ID,
    name: 'Bane Lance',
    mpCost: 8, // [row 0x411c]
    power: 16, // formula 0, power 16, crit 5, shatter 10; accuracy formula 1 with the row's byte 110; Curse 254 ("cannot change dressphere")
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    statusEffects: [{ status: 'curse', chance: 254, duration: 0 }],
    messageTemplate: 'Garik uses Bane Lance on {target}',
  },
  {
    ...base,
    id: GARIK_BLIND_ID,
    name: 'Blind',
    mpCost: 8, // [row 0x406f]
    power: 0, // status only: Darkness 75, reflectable, accuracy formula 0; the row's damage flags are 0 (neither type)
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['reflectable'],
    statusEffects: [{ status: 'darkness', chance: 75, duration: 0 }],
    messageTemplate: 'Garik casts Blind on {target}',
  },
  {
    ...base,
    id: GARIK_MIGHTY_GUARD_ID,
    name: 'Mighty Guard',
    mpCost: 18, // [row 0x4084]
    power: 0, // every monster on the field, himself and both Youths: Shell, Protect, Regen, Haste, Defense up 2, Magic Defense up 2, Evasion up 1
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-allies',
    statusEffects: [...MIGHTY_GUARD_STATUSES],
    messageTemplate: 'Garik casts Mighty Guard',
  },
  {
    ...base,
    id: GARIK_SHELL_ID,
    name: 'Shell',
    mpCost: 10, // [row 0x30bb]
    power: 0, // himself: Shell 254 for a counter of 110; reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['reflectable'],
    statusEffects: [{ status: 'shell', chance: 254, duration: 0 }],
    messageTemplate: 'Garik casts Shell',
  },
  {
    ...base,
    id: GARIK_PROTECT_ID,
    name: 'Protect',
    mpCost: 12, // [row 0x30bc]
    power: 0, // himself: Protect 254 for a counter of 110; reflectable
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'self',
    flags: ['reflectable'],
    statusEffects: [{ status: 'protect', chance: 254, duration: 0 }],
    messageTemplate: 'Garik casts Protect',
  },

  // ---- The Ronso Youth ----------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: YOUTH_ATTACK_ID,
    name: 'Attack',
    power: 16, // row 0x4000: formula 0, power 16, crit 5, shatter 10, accuracy formula 2
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'The Youth attacks {target}',
  },
  {
    ...base,
    id: YOUTH_MP_BLOWOUT_ID,
    name: 'MP Blowout',
    mpCost: 10, // [row 0x411d]
    power: 16, // the MP class, formula 7, power 16: ALL of the girl's maximum MP, after the race against accuracy 120 (formula 1)
    formula: 'percent-total',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    extra: { damagesPool: 'mp', mpOnly: true },
    messageTemplate: 'The Youth uses MP Blowout on {target}',
  },

  // ---- The "battle too long" block (both scripts) -------------------------------------------------------------------------------
  announcement(RONSO_ANGRY_ID, 'Ronso Grows Restless', '{user} grows restless'), // rows 0x4232 to 0x4235, our own words
  announcement(RONSO_FURIOUS_ID, 'Ronso Rages', '{user} rages'),
  announcement(RONSO_ABOUT_TO_BLOW_ID, 'Ronso About to Blow', '{user} is about to blow'),
  announcement(RONSO_ENDS_NOW_ID, 'Ronso Ends It', '{user} ends this now'),
  {
    ...base,
    id: RONSO_TIME_UP_METEOR_ID,
    name: 'Time Up Meteor',
    hits: 12, // the row: 12 hits [RE §3]
    power: 200, // formula 5 (fixed, power x 50 = 10,000 a hit before the 9,999 cap), power 200 [row 0x4236]
    formula: 'fixed-no-variance',
    damageType: 'other', // flags 0x0: neither Shell nor Protect reduces it
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: '{user} calls down Time Up Meteor',
  },
];
