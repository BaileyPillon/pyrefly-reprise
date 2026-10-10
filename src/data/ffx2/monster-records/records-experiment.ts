/**
 * The game's own monster row for the Experiment (FFX-2 Chapter 5, Djose Temple; the hidden chapter "The Experiment"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` row 194 of the Steam HD build 25501027, read field by field by the new-chapters reverse-engineering lane (`research/re-ffx2-experiment.md` §2: the
 * record, §3: the levels), numbers only. Both acts' bodies carry the same row: the levels change only the body's STR, MAG, DEF and MDEF, which the battle script overwrites at the start of the
 * fight (`../enemies/experiment-levels.ts`); every other field is the same at all 125 states. Merged into `MONSTER_RECORDS` by `./records.ts`.
 *
 * What the row says: Accuracy 95 (the encyclopedia printed 0); Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group 1 slots 0 to 8), Eject (slot 10) and slots 17 and
 * 18 immune; group 2 slots 5 to 14 immune (Slow, Stop, the seven stage changes, Doom), so no Break lands; Shell, Protect, Reflect, Regen and Haste are not resisted; the special word 0x7c3 (immune to the
 * percent formulas and to ATB damage, hit reactions do not slow it); type machine; neutral to every element but Gravity (null); steal chance byte 255 (always succeeds once), Turbo Ether x1 common and
 * x2 rare (item 0x2005), Pilfer Gil 5,000; no Bribe slot; Zantetsu byte 180 (moot: the special word disables it).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/experiment-engine.test.ts` against `tests/fixtures/parity/ffx2/experiment_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** The one row both bodies carry (`monster.bin` row 194, table 1). */
const EXPERIMENT_ROW: FFX2MonsterRecord = {
  row: 194,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x7c3,
  species: 0x1,
  zantetsu: 180,
  stealByte: 255,
  stealGil: 5000,
  steal: [0x2005, 0x1, 0x2005, 0x2],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: { id: 0x41da, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 },
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_EXPERIMENT: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-djose-experiment-1/x2-experiment-prototype': EXPERIMENT_ROW, // Act I: the prototype at 1 / 1 / 1
  'ffx2-djose-experiment-2/x2-experiment': EXPERIMENT_ROW, // Act II: the full weapon at 5 / 5 / 5 (and every one-off formation the tests build at any level)
};
