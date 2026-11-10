/**
 * The actions of Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero (FFX-2 Chapter 1's hotspot missions; the hidden chapter "Gullwings, Chapter 1", number 51). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Sources: **the game's own rows and scripts**, `research/re-ffx2-gullwings-chapter1.md` §0, §3 and §4 (`monster.bin` rows 132, 122, 162 and 47; `monmagic.bin` rows 0x4000, 0x4046, 0x40c7, 0x40c8, 0x40ca, 0x40d8, 0x40da, 0x41da,
 * 0x4056, 0x4057 and 0x4232 to 0x4236), pinned field by field by `tests/unit/chapters/gullwings-ch1-data.test.ts` against `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`. `../command-records/gullwings-ch1.ts` lays
 * the rows on these abilities by id, so the charge, the recovery, the target flags, the hit rule and the statuses are the rows' own; the fields here are the ability's own reading, kept consistent with them. The FFX
 * Sanctuary Keeper (which the guides say the Flame Dragon recalls) is a different monster of a different game and **no number of it is used**; every id here is `x2-` prefixed.
 *
 * - **Boris** (`m132`): **Spider Attack** (0x40c7: two hits of power 16, accuracy formula 1 on the byte 95, crit 10), **Sticky End** (0x40c8: formula 8, power 1, all three, cast 10; Stop with a base of 40 and a counter of 20) and
 *   **Spider Bite** (0x40ca: formula 1 so no Defense term, power 32, cast 180: the Aranea's row).
 * - **Flame Dragon** (`m122`): the plain **Attack** (0x41da, the monster record's row) and **Flame Breath** (0x40d8: formula 9, power 32, Fire, all three, cast 140, MP 30). Its Tail Smash (0x40d9) is in the source inside a
 *   commented-out block and in no worker: it is not built.
 * - **Guardian Beast** (`m162`): the plain **Attack**, **Curse** (0x4046: Curse at 254, cast 120) and **Damocles Photon** (0x40da: formula 7, power 8 = **half of each girl's maximum HP**, magical, all three, cast 180, MP 28).
 *   Its death row (0x40dc) is an animation and nothing else.
 * - **YSLS-Zero** (`m047`): **Attack** (0x4000, the party-command row) and **Attack, no cancel** (0x41da), **Blast Punch** (0x4056: formula 7, power 8 = half of one girl's maximum HP, cast 140, delay bits set) and **Haymaker**
 *   (0x4057: two hits of power 15, accuracy formula 0 so it always hits, shatter 35).
 * - **The "battle too long" block** (rows 0x4232 to 0x4236, shared by the four): four announcements and **Time Up Meteor** (formula 5, power 200, 12 hits, everyone). The four announcements have damage formula 0, power 0 and
 *   no hits; they are scripted flavour turns on himself in **our own words** (the game's strings are not copied).
 *
 * **Hit rule** (hard rule 5): the moves whose accuracy formula is 1 or 2 (Spider Attack, the three plain Attacks) roll and carry `canMiss: true`; every other move carries `canMiss: false` explicitly (accuracy formula 0: the
 * rows read "always hits"; Haymaker is accuracy formula 0 and always hits). No multi-target halving: the FFX-2 engine halves only the party's own Black and White Magic cast on all (`resolve-strike.ts`), never an enemy's scripted move.
 *
 * Confidence: [verified: the game's own table, read byte by byte by the research lane and again by the reader that wrote the fixture]; the Oversoul forms (own scripts, unread) are not built (DR6).
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
  canMiss: false as const, // rule 5: set explicitly on the rows that roll
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const BORIS_SPIDER_ATTACK_ID = 'x2-boris-spider-attack';
export const BORIS_STICKY_END_ID = 'x2-boris-sticky-end';
export const BORIS_SPIDER_BITE_ID = 'x2-boris-spider-bite';
export const FLAME_DRAGON_ATTACK_ID = 'x2-flame-dragon-attack';
export const FLAME_DRAGON_FLAME_BREATH_ID = 'x2-flame-dragon-flame-breath';
export const GUARDIAN_BEAST_ATTACK_ID = 'x2-guardian-beast-attack';
export const GUARDIAN_BEAST_DAMOCLES_PHOTON_ID = 'x2-guardian-beast-damocles-photon';
export const GUARDIAN_BEAST_CURSE_ID = 'x2-guardian-beast-curse';
export const YSLS_ZERO_ATTACK_ID = 'x2-ysls-zero-attack';
export const YSLS_ZERO_ATTACK_NO_CANCEL_ID = 'x2-ysls-zero-attack-no-cancel';
export const YSLS_ZERO_BLAST_PUNCH_ID = 'x2-ysls-zero-blast-punch';
export const YSLS_ZERO_HAYMAKER_ID = 'x2-ysls-zero-haymaker';
/** The "battle too long" block, shared by the four: four announcements in order, then Time Up Meteor every poll. */
export const GULLWINGS_ANGRY_ID = 'x2-gullwings-angry';
export const GULLWINGS_FURIOUS_ID = 'x2-gullwings-furious';
export const GULLWINGS_ABOUT_TO_BLOW_ID = 'x2-gullwings-about-to-blow';
export const GULLWINGS_ENDS_NOW_ID = 'x2-gullwings-ends-now';
export const GULLWINGS_TIME_UP_METEOR_ID = 'x2-gullwings-time-up-meteor';

/** The four announcements in the order the script shows them. */
export const GULLWINGS_ANNOUNCEMENT_IDS = [GULLWINGS_ANGRY_ID, GULLWINGS_FURIOUS_ID, GULLWINGS_ABOUT_TO_BLOW_ID, GULLWINGS_ENDS_NOW_ID] as const;

/** The damage constants of the rows (`power`), numbers only. */
export const GULLWINGS_DC = {
  spiderAttack: 16, stickyEnd: 1, spiderBite: 32, attack: 16, flameBreath: 32, damoclesPhoton: 8, haymaker: 15, blastPunch: 8, timeUpMeteor: 200,
} as const;

/** The MP the rows cost (Flame Breath 30 of the Dragon's 620; Damocles Photon 28 of the Beast's 1,000). */
export const FLAME_BREATH_MP = 30;
export const DAMOCLES_PHOTON_MP = 28;

/** Stop's base chance and counter on Sticky End (the row: 40 and 20). The status roll is `draw % 101 < base + 5 * (lvA - lvT) - resist`, so the base is a percent-scale number, lowered for a girl above Boris's level. */
export const STICKY_END_STOP_CHANCE = 40;
export const STICKY_END_STOP_COUNTER = 20;

/** A scripted flavour turn on himself: no damage, no status; the engine shows the banner. */
function announcement(id: string, name: string, line: string): AbilityDef {
  return {
    ...base,
    id,
    name,
    power: 0, // the row: damage formula 0, power 0, no hits [RE §5]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    messageTemplate: line,
  };
}

/** The seventeen rows of the four bosses and the shared block. */
export const x2GullwingsCh1Abilities: AbilityDef[] = [
  // ---- Boris (the spider-fiend of the Floating Ruins) ----------------------------------------------------------
  {
    ...base,
    id: BORIS_SPIDER_ATTACK_ID,
    name: 'Spider Attack',
    power: GULLWINGS_DC.spiderAttack, // two hits of power 16 [row 0x40c7: formula 0, hits 2, accuracy formula 1 on the byte 95, crit 10]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy', // a near-weighted living girl
    hits: 2,
    accuracy: 95,
    canMiss: true,
    messageTemplate: 'Boris attacks {target}',
  },
  {
    ...base,
    id: BORIS_STICKY_END_ID,
    name: 'Sticky End',
    power: GULLWINGS_DC.stickyEnd, // formula 8 (fixed, with variance), power 1: 46 to 52 on a girl of Lv 20; Stop at 40, counter 20 [row 0x40c8]
    formula: 'fixed',
    damageType: 'other', // the row's damage flags are 0x0: neither Protect nor Shell reduces it
    element: ['none'],
    targeting: 'all-enemies',
    statusEffects: [{ status: 'stop', chance: STICKY_END_STOP_CHANCE, duration: 0 }],
    messageTemplate: 'Boris spits Sticky End',
  },
  {
    ...base,
    id: BORIS_SPIDER_BITE_ID,
    name: 'Spider Bite',
    power: GULLWINGS_DC.spiderBite, // formula 1 (no Defense term), power 32, charge 180 [row 0x40ca: the Aranea's row]
    formula: 'piercing-strength',
    damageType: 'other', // the row's damage flags are 0x0: neither Protect nor Shell reduces it
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Boris uses Spider Bite on {target}',
  },

  // ---- Flame Dragon ----------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: FLAME_DRAGON_ATTACK_ID,
    name: 'Attack',
    category: 'attack', // the generic Attack: it runs on the monster record's plain Attack (0x41da)
    power: GULLWINGS_DC.attack, // the girl with the most current HP [row 0x41da: formula 0, power 16, accuracy formula 2, crit 5]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Flame Dragon attacks {target}',
  },
  {
    ...base,
    id: FLAME_DRAGON_FLAME_BREATH_ID,
    name: 'Flame Breath',
    mpCost: FLAME_BREATH_MP, // [row 0x40d8]
    power: GULLWINGS_DC.flameBreath, // formula 9 (a Magic cubic), power 32, Fire, all three, cast 140 [row 0x40d8]
    formula: 'special-magic',
    damageType: 'magical', // flags 0x2: Shell applies
    element: ['fire'],
    targeting: 'all-enemies',
    messageTemplate: 'Flame Dragon breathes fire',
  },

  // ---- Guardian Beast --------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: GUARDIAN_BEAST_ATTACK_ID,
    name: 'Attack',
    category: 'attack', // the generic Attack: the monster record's plain Attack (0x41da)
    power: GULLWINGS_DC.attack,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'Guardian Beast attacks {target}',
  },
  {
    ...base,
    id: GUARDIAN_BEAST_DAMOCLES_PHOTON_ID,
    name: 'Damocles Photon',
    mpCost: DAMOCLES_PHOTON_MP, // [row 0x40da]
    power: GULLWINGS_DC.damoclesPhoton, // formula 7, power 8: 8/16 = half of each girl's MAXIMUM HP, no Defense term, no variance, magical (Shell halves it), all three, cast 180 [row 0x40da]
    formula: 'percent-total',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies',
    extra: { noVariance: true },
    messageTemplate: 'Guardian Beast looses Damocles Photon',
  },
  {
    ...base,
    id: GUARDIAN_BEAST_CURSE_ID,
    name: 'Curse',
    power: 0, // no damage: Curse at 254 on one girl, cast 120 [row 0x4046]
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // the first girl who does not carry it
    statusEffects: [{ status: 'curse', chance: 254, duration: 0 }],
    messageTemplate: 'Guardian Beast curses {target}',
  },

  // ---- YSLS-Zero -------------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: YSLS_ZERO_ATTACK_ID,
    name: 'Attack',
    power: GULLWINGS_DC.attack, // row 0x4000: formula 0, power 16, crit 5, accuracy formula 2 (the party-command row; the same numbers as 0x41da)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'YSLS-Zero attacks {target}',
  },
  {
    ...base,
    id: YSLS_ZERO_ATTACK_NO_CANCEL_ID,
    name: 'Attack',
    power: GULLWINGS_DC.attack, // row 0x41da: the same numbers; the hit does not cancel the target's cast (an unmodelled bit)
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: true,
    messageTemplate: 'YSLS-Zero attacks {target}',
  },
  {
    ...base,
    id: YSLS_ZERO_BLAST_PUNCH_ID,
    name: 'Blast Punch',
    power: GULLWINGS_DC.blastPunch, // formula 7, power 8: half of one girl's MAXIMUM HP, no Defense term, damage flags 0 (neither Protect nor Shell reduces it), cast 140, the delay bits set [row 0x4056]
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // the girl at the greatest distance (a uniform pick: the scene's position file is empty)
    extra: { noVariance: true },
    flags: ['strong-delay'],
    messageTemplate: 'YSLS-Zero fires Blast Punch at {target}',
  },
  {
    ...base,
    id: YSLS_ZERO_HAYMAKER_ID,
    name: 'Haymaker',
    power: GULLWINGS_DC.haymaker, // two hits of power 15, accuracy formula 0 (always hits), shatter 35 [row 0x4057]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    hits: 2,
    messageTemplate: 'YSLS-Zero swings Haymaker at {target}',
  },

  // ---- The "battle too long" block (rows 0x4232 to 0x4236), shared ---------------------------------------------------------------
  announcement(GULLWINGS_ANGRY_ID, 'Grows Restless', '{user} grows restless'), // rows 0x4232 to 0x4235, our own words
  announcement(GULLWINGS_FURIOUS_ID, 'Rages', '{user} rages'),
  announcement(GULLWINGS_ABOUT_TO_BLOW_ID, 'About to Blow', '{user} is about to blow'),
  announcement(GULLWINGS_ENDS_NOW_ID, 'Ends It', '{user} ends this now'),
  {
    ...base,
    id: GULLWINGS_TIME_UP_METEOR_ID,
    name: 'Time Up Meteor',
    hits: 12, // the row: 12 hits [RE §5]
    power: GULLWINGS_DC.timeUpMeteor, // formula 5 (fixed, power x 50 = 10,000 a hit), power 200 [row 0x4236]
    formula: 'fixed-no-variance',
    damageType: 'other', // flags 0x0: neither Shell nor Protect reduces it
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: '{user} calls down Time Up Meteor',
  },
];
