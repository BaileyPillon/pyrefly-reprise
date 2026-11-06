/**
 * The actions of the three guardians of the Bevelle Underground in their NORMAL versions (Georapella and the Precepts Guard on floor 3, the first Baralai on floor 7; the hidden chapter "The Guardians of the
 * Bevelle Underground"). **FFX-2 only** [AGENTS.md rule 14].
 *
 * Source: **the game's own rows** (`research/re-ffx2-bevelle-underground.md` §7, the RE lane of 2026-11-06), which `../command-records/bevelle-guardians.ts` lays on these abilities by id, so the charge, the
 * recovery, the target flags, the damage type, the hit rule, the statuses and every other field the engine reads are the rows' own; the fields here are the ability's own reading, kept consistent with them and
 * pinned against them by `tests/unit/chapters/bevelle-guardians-data.test.ts`. Every id here is `x2-`-prefixed so nothing of the FFX data, the Den of Woe shade (`x2-den-baralai-*`) or the party's own commands is touched.
 *
 * - **Georapella** (`m262`): **Firaga, Blizzaga, Thundaga, Waterga** (0x41f1 to 0x41f4: formula 2, power 19, the whole party, 24 MP, a 3.3 s charge; reflectable) and **Osmose** (0x406d: 3/16 of a girl's current MP, taken
 *   by the user; the dead branch below 25 MP).
 * - **Precepts Guard** (`m263`): **Demi** (0x3082: a quarter of every girl's current HP, Gravity, not reflectable), **Bio** (0x3085: Poison on one girl), **Slow** (0x406c: the ATB class, formula 4, power 16, Slow 130; the
 *   row is single, the script aims it at the group), **Death** (0x3087: Death at chance 254 through the status race, accuracy formula 4), **Osmose** and **Drain** (0x3081: formula 9, power 12, absorbed).
 * - **Baralai** (`m175`): **Attack** (0x41da: power 16, the race with ACC), **Chain Attack** (0x4100: power 12, three strikes at fixed girls), **Glint** (0x4101: power 20, the whole party), **Looming Glacier**
 *   (0x4102: all of one girl's maximum MP, and Stop 254 with a counter of 126), **Drill Shot** (0x4103: formula 7, power 12, three quarters of the girl's MAXIMUM HP, physical-only so Protect halves it), **Demi**
 *   and **Absorb** (0x4040: HP and MP together, taken by him).
 *
 * **Hit rule** (hard rule 5): Baralai's Attack is the ONLY move of the three that can miss (accuracy formula 2, the race with his ACC), and sets `canMiss: true`; every other move carries `canMiss: false` explicitly
 * because its accuracy formula is 0 (or Death's formula 4, a status race the kernel decides), and an unset field silently rolls.
 * **Multi-target halving:** the FFX-2 engine halves only the *party's* Black and White Magic cast on all (`src/battle/ffx2/execute.ts`), so none of these takes any.
 * Confidence: [verified: the game's own table, read byte by byte by the RE lane and pinned by `tests/unit/chapters/bevelle-guardians-data.test.ts` against `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`].
 * **Not built here:** the Oversoul versions' moves (`o262`, `o263`: unreachable, `research/re-ffx2-bevelle-underground.md` §4.4, pick BG7) and the Den of Woe shade's (chapter 15 keeps them).
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
  canMiss: false as const, // rule 5: accuracy formula 0 on every row but Baralai's Attack (which overrides this with `true`); Death's formula 4 is a status race the kernel decides
};

/** The ability ids (the AI scripts and the tests name these, never a literal). */
export const GEORAPELLA_FIRAGA_ID = 'x2-georapella-firaga';
export const GEORAPELLA_BLIZZAGA_ID = 'x2-georapella-blizzaga';
export const GEORAPELLA_THUNDAGA_ID = 'x2-georapella-thundaga';
export const GEORAPELLA_WATERGA_ID = 'x2-georapella-waterga';
export const GEORAPELLA_OSMOSE_ID = 'x2-georapella-osmose';
export const PRECEPTS_DEMI_ID = 'x2-precepts-guard-demi';
export const PRECEPTS_BIO_ID = 'x2-precepts-guard-bio';
export const PRECEPTS_SLOW_ID = 'x2-precepts-guard-slow';
export const PRECEPTS_DEATH_ID = 'x2-precepts-guard-death';
export const PRECEPTS_OSMOSE_ID = 'x2-precepts-guard-osmose';
export const PRECEPTS_DRAIN_ID = 'x2-precepts-guard-drain';
export const BARALAI_ATTACK_ID = 'x2-baralai-attack';
export const BARALAI_CHAIN_ATTACK_ID = 'x2-baralai-chain-attack';
export const BARALAI_CHAIN_ATTACK_2_ID = 'x2-baralai-chain-attack-2';
export const BARALAI_CHAIN_ATTACK_3_ID = 'x2-baralai-chain-attack-3';
export const BARALAI_GLINT_ID = 'x2-baralai-glint';
export const BARALAI_LOOMING_GLACIER_ID = 'x2-baralai-looming-glacier';
export const BARALAI_DRILL_SHOT_ID = 'x2-baralai-drill-shot';
export const BARALAI_DEMI_ID = 'x2-baralai-demi';
export const BARALAI_ABSORB_ID = 'x2-baralai-absorb';

/** Georapella's four spells in the order the script goes round them: Thundaga, Waterga, Firaga, Blizzaga [RE §6.2]. */
export const GEORAPELLA_SPELL_IDS = [GEORAPELLA_THUNDAGA_ID, GEORAPELLA_WATERGA_ID, GEORAPELLA_FIRAGA_ID, GEORAPELLA_BLIZZAGA_ID] as const;

/** A Ga spell: formula 2, power 19, the whole party, 24 MP, reflectable [rows 0x41f1 to 0x41f4]. */
function ga(id: string, name: string, element: ElementId): AbilityDef {
  return {
    ...base,
    id,
    name,
    mpCost: 24,
    power: 19, // (MAG + 2L) x P x P / 64 = 197 at Georapella's MAG of 1: a modest tax, not the killer
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'all-enemies',
    flags: ['reflectable'],
    messageTemplate: `Georapella casts ${name}`,
  };
}

/** One Chain Attack strike: power 12, physical, always hits [row 0x4100]. The three strikes are one command each, the first carrying the other two as its sequence. */
function chainStrike(id: string, message: string): AbilityDef {
  return {
    ...base,
    id,
    name: 'Chain Attack',
    power: 12,
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: message,
  };
}

/** The abilities of the three guardians. */
export const x2BevelleGuardiansAbilities: AbilityDef[] = [
  // ---- Georapella (floor 3) ----------------------------------------------------------------------------------------------------------
  ga(GEORAPELLA_THUNDAGA_ID, 'Thundaga', 'lightning'),
  ga(GEORAPELLA_WATERGA_ID, 'Waterga', 'water'),
  ga(GEORAPELLA_FIRAGA_ID, 'Firaga', 'fire'),
  ga(GEORAPELLA_BLIZZAGA_ID, 'Blizzaga', 'ice'),
  {
    ...base,
    id: GEORAPELLA_OSMOSE_ID,
    name: 'Osmose',
    power: 3, // 3/16 of the girl's current MP, absorbed [row 0x406d: class 2, formula 4, power 3, the absorb bit]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // the living girl with the most MP; fires only below 25 MP, which 9,999 MP never reaches
    flags: ['drains-mp'],
    extra: { mpOnly: true },
    messageTemplate: 'Georapella casts Osmose on {target}',
  },

  // ---- Precepts Guard (floor 3) --------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: PRECEPTS_DEMI_ID,
    name: 'Demi',
    mpCost: 10, // [row 0x3082]
    power: 4, // a quarter of each girl's current HP [row 0x3082: formula 4, power 4]
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'], // element bit 0x10; not reflectable
    targeting: 'all-enemies',
    messageTemplate: 'Precepts Guard casts Demi',
  },
  {
    ...base,
    id: PRECEPTS_BIO_ID,
    name: 'Bio',
    mpCost: 16, // [row 0x3085]
    power: 0,
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy', // one girl who lacks Poison and Reflect, near-weighted; queued before a Drain
    flags: ['reflectable'],
    statusEffects: [{ status: 'poison', chance: 100, duration: 0 }], // the row's Poison byte, 100
    messageTemplate: 'Precepts Guard casts Bio on {target}',
  },
  {
    ...base,
    id: PRECEPTS_SLOW_ID,
    name: 'Slow',
    mpCost: 8, // [row 0x406c]
    power: 0, // the row is the ATB class, formula 4, power 16 (a share of the target's ATB pool); the engine runs on the row (`../command-records/bevelle-guardians.ts`), as the Left Redoubt's Slow does. Slow 130, counter 126
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'all-enemies', // the row is single; the script aims it at the group
    flags: ['reflectable'],
    statusEffects: [{ status: 'slow', chance: 130, duration: 0 }], // chance byte 130, not a percentage
    messageTemplate: 'Precepts Guard casts Slow',
  },
  {
    ...base,
    id: PRECEPTS_DEATH_ID,
    name: 'Death',
    mpCost: 24, // [row 0x3087]
    power: 0,
    formula: 'none',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy', // one living girl, uniformly
    flags: ['reflectable'],
    statusEffects: [{ status: 'ko', chance: 254, duration: 0 }], // Death 254 through the status race (accuracy formula 4)
    messageTemplate: 'Precepts Guard casts Death on {target}',
  },
  {
    ...base,
    id: PRECEPTS_OSMOSE_ID,
    name: 'Osmose',
    power: 3, // [row 0x406d]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // one living girl, uniformly
    flags: ['drains-mp'],
    extra: { mpOnly: true },
    messageTemplate: 'Precepts Guard casts Osmose on {target}',
  },
  {
    ...base,
    id: PRECEPTS_DRAIN_ID,
    name: 'Drain',
    mpCost: 8, // [row 0x3081]
    power: 12, // formula 9 (special magic), power 12, absorbed by the user [row 0x3081]
    formula: 'special-magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains', 'reflectable'],
    messageTemplate: 'Precepts Guard casts Drain on {target}',
  },

  // ---- Baralai (floor 7) -------------------------------------------------------------------------------------------------------------
  {
    ...base,
    id: BARALAI_ATTACK_ID,
    name: 'Attack',
    power: 16, // formula 0, power 16, one hit, crit byte 5, shatter 10, accuracy formula 2 (the race with his ACC) [row 0x41da]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy', // a near-weighted living girl
    canMiss: true,
    flags: ['crit-eligible'],
    messageTemplate: 'Baralai strikes {target}',
  },
  // Chain Attack x3: three commands at three fixed girls (Yuna, Rikku, Paine, each falling back as the script does), the first carrying the other two as its sequence (the Den of Woe shade's Triple Attack, the same
  // engine seam: `resolve.ts` `sequenceTargets`). Each strike is power 12, physical, never rolls and never crits [row 0x4100].
  {
    ...chainStrike(BARALAI_CHAIN_ATTACK_ID, 'Baralai uses Chain Attack'),
    extra: { sequence: [BARALAI_CHAIN_ATTACK_2_ID, BARALAI_CHAIN_ATTACK_3_ID], sequenceTargets: true },
  },
  chainStrike(BARALAI_CHAIN_ATTACK_2_ID, 'Baralai strikes {target}'),
  chainStrike(BARALAI_CHAIN_ATTACK_3_ID, 'Baralai strikes {target}'),
  {
    ...base,
    id: BARALAI_GLINT_ID,
    name: 'Glint',
    power: 20, // formula 0, power 20, the whole party, always hits [row 0x4101]
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'all-enemies',
    messageTemplate: 'Baralai uses Glint',
  },
  {
    ...base,
    id: BARALAI_LOOMING_GLACIER_ID,
    name: 'Looming Glacier',
    power: 16, // the MP class, formula 7, power 16: ALL of the girl's maximum MP, and Stop 254 with a counter of 126 [row 0x4102]
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // the girl with the most MP among those not already stopped
    extra: { damagesPool: 'mp', mpOnly: true },
    statusEffects: [{ status: 'stop', chance: 254, duration: 0 }],
    messageTemplate: 'Baralai uses Looming Glacier on {target}',
  },
  {
    ...base,
    id: BARALAI_DRILL_SHOT_ID,
    name: 'Drill Shot',
    power: 12, // formula 7, power 12: 12/16 = 75 percent of the girl's MAXIMUM HP, no Defense term, no variance, physical-only (Protect halves it) [row 0x4103]
    formula: 'percent-total',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy', // the girl who made the latest result on him, else a near-weighted living girl
    extra: { noVariance: true },
    messageTemplate: 'Baralai fires Drill Shot at {target}',
  },
  {
    ...base,
    id: BARALAI_DEMI_ID,
    name: 'Demi',
    mpCost: 10, // [row 0x3082]
    power: 4,
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    messageTemplate: 'Baralai casts Demi',
  },
  {
    ...base,
    id: BARALAI_ABSORB_ID,
    name: 'Absorb',
    power: 3, // HP and MP together (class 3), formula 4, power 3, absorbed by him [row 0x4040]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy', // a near-weighted living girl
    flags: ['drains'],
    extra: { mpFractionOfCurrent: 3 },
    messageTemplate: 'Baralai uses Absorb on {target}',
  },
];
