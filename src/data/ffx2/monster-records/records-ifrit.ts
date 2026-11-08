/**
 * The game's own monster row for Ifrit at Kilika Temple (FFX-2 Chapter 3, the mission "Pest Control"; the hidden chapter "Ifrit at Kilika Temple"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **row 165** of the Steam HD build (id 0x10a5, formation 483 `klyt11_229`, the Kilika Temple trial), read field by field by the research lane (`research/re-ffx2-ifrit-kilika.md` §0) and again by the
 * reader that wrote `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`, numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`. The only other formation that holds him is the test scene `zzzz01_65`.
 *
 * What the row says: Accuracy 95; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group 1 slots 0 to 8), Eject (slot 10) and slots 17 and 18 (Itchy, Auto-Life) immune; group 2 Stop (6) and Doom
 * (14) immune, so Slow and every Break land; the special word 0x3c3 (immune to the percent formulas and to ATB damage, hit reactions do not slow it, no Interrupt and no Bribe: the same word as Valefor's); absorbs Fire,
 * weak to Ice, Gravity nulled; steal chance byte 128, Fiery Gleam x1 in both slots (accessory 0x9020), Pilfer Gil 1,800; no Bribe slot; Zantetsu byte 80. His automatic status word is 0x2000 in group 1, "uses no MP" (see
 * `../enemies/ifrit-abilities.ts`: the engine does not read it, and 9,999 MP pays Firaga 416 times).
 *
 * The command rows of his moves are in `../command-records/ifrit.ts`, laid on the abilities by id (`FFX2_COMMAND_RECORDS`); his AI script (`m165`) is read: `../../../battle/ffx2/ai/ifrit.ts`. The plain Attack is the game's
 * row 0x41da (the one every monster's `Attack` is, `./records.ts`).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/ifrit-kilika-data.test.ts`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** `monster.bin` row 165, table 1. */
const IFRIT_ROW: FFX2MonsterRecord = {
  row: 165,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x3c3,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 1800,
  steal: [0x9020, 0x1, 0x9020, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 },
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_IFRIT: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-kilika-ifrit/x2-ifrit': IFRIT_ROW,
};
