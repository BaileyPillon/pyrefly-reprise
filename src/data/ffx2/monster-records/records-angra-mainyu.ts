/**
 * The game's own monster rows for Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter "Angra Mainyu"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 268 (Angra Mainyu, id 0x110c), 269 (Zarich, 0x110d) and 270 (Tawrich, 0x110e)** of the Steam HD build, formation rows 1241, 1284, 1313, 1350 and 1384 (`bika08_229`,
 * `bika07_229`, `bika09_229`, `bika14_229`, `bika13_229`: the same three monsters in five desert maps), read field by field by the RE parity session (`research/re-ffx2-angra-mainyu.md` §3 the column map, §4
 * the rows, §6 the unmapped columns), numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`. **The second stat block in `monster2.bin` (boss Lv 56, HP 350,116, AGI 88) is NOT used**: all three rows
 * have Oversoul type 0, so nothing in our notes says the game reads it for these monsters (the note's §5 and §12 item 8).
 *
 * What the rows say: Accuracy 95; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group-1 slots 0 to 8), Eject (10) and slots 17 and 18 immune on all three; group 2 Slow (5), Stop
 * (6), the Defense and Magic Defense stages (9, 10) and Doom (14) immune on all three, **and Reflect (2) immune on the two arms alone** (it lands on the body); Shell, Protect, Regen and Haste are not resisted;
 * the special word 0x7c3 on all three (immune to the percent formulas and to ATB damage, a hit reaction does not slow the gauge, and bits 7 to 10, so Interrupt and Bribe do nothing); Gravity nulled on all three and
 * **Zarich halves Fire, Ice, Thunder, Water and Holy** (0x2f); Zantetsu 255; no Bribe slot. **Only the body has rewards**: steal chance byte 255 (it always succeeds on its one attempt), Megalixir x1 in both slots
 * (item 0x2009), Pilfer Gil 2,000; the arms' bytes are all 0. The automatic statuses (group 2, slots 15 and 16, amount 127) are laid on the arms as `autoStatuses` (`../enemies/angra-mainyu.ts`).
 *
 * **The command rows** of the moves (`monmagic.bin` 0x4129 to 0x412d, 0x41f1 to 0x41f4, 0x406d, and the party's `command.bin` 0x3082 to 0x3170) are in `../command-records/angra-mainyu.ts`, laid on the abilities by id
 * (`FFX2_COMMAND_RECORDS`). None of the three has a plain Attack (0x41da) in its list, so no `plainAttack` is carried.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/angra-mainyu-data.test.ts` against `tests/fixtures/parity/ffx2/angra_mainyu_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** Group 1, the same on all three rows: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, and slots 17 and 18 (Itchy, Auto-Life in the engine's table). */
const GROUP1_IMMUNE: Readonly<Record<number, number>> = { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 };

/** `monster.bin` row 268, table 1: the body. */
const ANGRA_MAINYU_ROW: FFX2MonsterRecord = {
  row: 268,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: { 5: 255, 6: 255, 9: 255, 10: 255, 14: 255 }, // Slow, Stop, the Defense and Magic Defense stages, Doom; **Reflect reads 0 (it lands)**
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 255,
  stealGil: 2000,
  steal: [0x2009, 0x1, 0x2009, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 269, table 1: Zarich, the left arm. */
const ZARICH_ROW: FFX2MonsterRecord = {
  row: 269,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: { 2: 255, 5: 255, 6: 255, 9: 255, 10: 255, 14: 255 }, // as the body's, and Reflect
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 0,
  stealGil: 0,
  steal: [0x0, 0x0, 0x0, 0x0],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 270, table 1: Tawrich, the right arm. */
const TAWRICH_ROW: FFX2MonsterRecord = {
  row: 270,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: { 2: 255, 5: 255, 6: 255, 9: 255, 10: 255, 14: 255 },
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 0,
  stealGil: 0,
  steal: [0x0, 0x0, 0x0, 0x0],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_ANGRA_MAINYU: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-bikanel-angra-mainyu/x2-angra-mainyu': ANGRA_MAINYU_ROW,
  'ffx2-bikanel-angra-mainyu/x2-zarich': ZARICH_ROW,
  'ffx2-bikanel-angra-mainyu/x2-tawrich': TAWRICH_ROW,
};
