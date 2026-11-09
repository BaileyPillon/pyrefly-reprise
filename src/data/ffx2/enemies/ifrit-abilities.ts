/**
 * Ifrit's actions at Kilika Temple (FFX-2 Chapter 3, the mission "Pest Control"; the hidden chapter "Ifrit at Kilika Temple", number 46).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Sources: the game's own rows and script, `research/re-ffx2-ifrit-kilika.md` §1 to §3 (`monster.bin` row 165, `monmagic.bin` 0x4094, 0x4095, 0x41da, 0x41f1 and 0x4232 to 0x4236,
 * pinned field by field by `tests/unit/chapters/ifrit-kilika-data.test.ts` against `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`), and `research/ffx2-fallen-aeons.md` §7.1 (SinirothX + the FF Wiki's AI dump,
 * `[verified: 2 sources]`: Normal Attack DC 16, Meteor Strike DC 25, Firaga DC 19, Hellfire DC 24), which the rows equal. The FFX Ifrit (Yuna's aeon, Belgemine's, the Dark Ifrit; `src/data/ffx/**`) is a different monster of
 * a different game and **no number of it is used**; every id here is `x2-ifrit-` prefixed so the two games never meet in one lookup.
 *
 * The nine rows, move by move (**the game's own command rows are laid on all but the Attack by `../command-records/ifrit.ts`, so the charge, the recovery and every flag the engine reads are the rows' own; the Attack
 * runs on the monster record's plain Attack, `../monster-records/records-ifrit.ts`**):
 *
 * - **Attack**, DC 16, physical, the only move that rolls to hit (accuracy formula 2 on the row's byte 95), on a near-weighted living girl.
 * - **Firaga**, magic, Fire, DC 19, all three girls; its MP cost of 24 is the row's and is free for him (his automatic status is "uses no MP"; the engine does not read that word, and his 9,999 MP pays it 416 times over, which a
 *   test pins). Cast 70, no ATB cost of its own. Reflectable in the row; the party carries no Reflect in this chapter's preset.
 * - **Meteor Strike**, magic (Shell applies), non-elemental, DC 25, one girl: the one farthest from him. ATB 80, cast 100.
 * - **Hellfire**, magic (Shell applies), Fire, DC 24, all three; the Overdrive of the gauge. ATB 100, cast 180 (the longest cast he has: the girls see it coming).
 * - **The four announcements** and **Time Up Meteor**: the "battle too long" block (`../../../battle/ffx2/ai/ifrit.ts`). The four rows have damage formula 0, power 0 and no hits; each only names a stage. They are scripted
 *   flavour turns on himself (Bahamut's Countdown is the precedent), in **our own words** (the game's strings are not copied). **Time Up Meteor** is formula 5 (fixed, power x 50 = 10,000 a hit), power 200, 12 hits, everyone, not
 *   physical and not magical (neither Shell nor Protect reduces it): nothing survives it.
 *
 * **Hit rule** (hard rule 5): Firaga, Meteor Strike, Hellfire and Time Up Meteor are `canMiss: false`; only the plain Attack rolls. No multi-target halving: the FFX-2 engine halves only the party's own Black and White Magic cast on all
 * (`resolve-strike.ts`), never an enemy's scripted move.
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
};

/** The ability ids (the AI and the tests name these, never a literal). */
export const IFRIT_ATTACK_ID = 'x2-ifrit-attack';
export const IFRIT_FIRAGA_ID = 'x2-ifrit-firaga';
export const IFRIT_METEOR_STRIKE_ID = 'x2-ifrit-meteor-strike';
export const IFRIT_HELLFIRE_ID = 'x2-ifrit-hellfire';
/** The "battle too long" block: four announcements in order, then Time Up Meteor every poll. */
export const IFRIT_ANGRY_ID = 'x2-ifrit-angry';
export const IFRIT_FURIOUS_ID = 'x2-ifrit-furious';
export const IFRIT_ABOUT_TO_BLOW_ID = 'x2-ifrit-about-to-blow';
export const IFRIT_ENDS_NOW_ID = 'x2-ifrit-ends-now';
export const IFRIT_TIME_UP_METEOR_ID = 'x2-ifrit-time-up-meteor';

/** The four announcements in the order the script shows them. */
export const IFRIT_ANNOUNCEMENT_IDS = [IFRIT_ANGRY_ID, IFRIT_FURIOUS_ID, IFRIT_ABOUT_TO_BLOW_ID, IFRIT_ENDS_NOW_ID] as const;

/** The damage constants, research §7.1 `[verified: 2 sources]`; the rows' own powers are the same (16, 19, 25, 24) and Time Up Meteor's is 200 [RE §1]. */
export const IFRIT_DC = { attack: 16, firaga: 19, meteorStrike: 25, hellfire: 24, timeUpMeteor: 200 } as const;

/** Firaga's MP cost, the row's (`monmagic.bin` 0x41f1); free for Ifrit [RE §0, §1]. */
export const IFRIT_FIRAGA_MP = 24;

/** A scripted flavour turn on himself: no damage, no status; the engine shows the banner. */
function announcement(id: string, name: string, line: string): AbilityDef {
  return {
    ...base,
    id,
    name,
    power: 0, // the row: damage formula 0, power 0, no hits [RE §1]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    canMiss: false,
    messageTemplate: line,
  };
}

/** Ifrit, research §7.1 and the RE note. */
export const x2IfritAbilities: AbilityDef[] = [
  {
    ...base,
    id: IFRIT_ATTACK_ID,
    name: 'Attack', // Normal Attack
    category: 'attack',
    power: IFRIT_DC.attack, // DC 16, physical [SinirothX + wiki]; the game's plain Attack row 0x41da (accuracy formula 2, byte 95)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Ifrit attacks {target}',
  },
  {
    ...base,
    id: IFRIT_FIRAGA_ID,
    name: 'Firaga',
    mpCost: IFRIT_FIRAGA_MP, // the row's own cost; free for him (automatic status "uses no MP")
    power: IFRIT_DC.firaga, // DC 19, magic, Fire, all three [SinirothX + wiki; row 0x41f1]
    formula: 'magic',
    damageType: 'magical',
    element: ['fire'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: magic always hits
    messageTemplate: 'Ifrit casts Firaga',
  },
  {
    ...base,
    id: IFRIT_METEOR_STRIKE_ID,
    name: 'Meteor Strike',
    power: IFRIT_DC.meteorStrike, // DC 25, magic, one girl: the one farthest from him [SinirothX + wiki; row 0x4095]
    formula: 'magic',
    damageType: 'magical', // flags 0x2: Shell applies
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: 'Ifrit uses Meteor Strike on {target}',
  },
  {
    ...base,
    id: IFRIT_HELLFIRE_ID,
    name: 'Hellfire',
    power: IFRIT_DC.hellfire, // DC 24, magic, Fire, all three; the Overdrive of the gauge at 100 [SinirothX + wiki; row 0x4094]
    formula: 'magic',
    damageType: 'magical', // flags 0x2: Shell applies
    element: ['fire'],
    targeting: 'all-enemies',
    canMiss: false, // hard rule 5: every Overdrive always hits
    messageTemplate: 'Ifrit unleashes Hellfire',
  },
  announcement(IFRIT_ANGRY_ID, 'Ifrit Grows Restless', 'Ifrit grows restless'), // rows 0x4232 to 0x4235, our own words
  announcement(IFRIT_FURIOUS_ID, 'Ifrit Rages', 'Ifrit rages'),
  announcement(IFRIT_ABOUT_TO_BLOW_ID, 'Ifrit About to Blow', 'Ifrit is about to blow'),
  announcement(IFRIT_ENDS_NOW_ID, 'Ifrit Ends It', 'Ifrit ends this now'),
  {
    ...base,
    id: IFRIT_TIME_UP_METEOR_ID,
    name: 'Time Up Meteor',
    hits: 12, // the row: 12 hits [RE §1]
    power: IFRIT_DC.timeUpMeteor, // formula 5 (fixed, power x 50 = 10,000 a hit), power 200 [RE §1; row 0x4236]
    formula: 'fixed-no-variance',
    damageType: 'other', // flags 0x0: neither Shell nor Protect reduces it
    element: ['none'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Ifrit calls down Time Up Meteor',
  },
];
