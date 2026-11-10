/**
 * The game's own monster rows for Ormi, Logos and Leblanc in the first fights of FFX-2's Chapter 1 (the docks of Luca; the hidden chapter "The Luca Opener"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 129, 130 and 131** of the Steam HD build (ids 0x1081, 0x1082 and 0x1083, formations 487 `lchb03_229` and 488 `lchb03_228`), read field by field by the research lane
 * (`research/re-ffx2-luca-opener.md` §0) and again by the reader that wrote `tests/fixtures/parity/ffx2/luca_opener_rows.json`, numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`.
 * These are NOT the Chateau Leblanc rows of the same three people (241 to 253): the group keys below are this chapter's own.
 *
 * What the rows say: Accuracy 95; **Ormi and Logos** are immune to Silence, Berserk, Curse, Eject, Itchy and Auto-Life (group 1 slots 3, 7, 8, 10, 17, 18) and to Stop and Doom (group 2 slots 6 and 14), but **not to Death**
 * (so they can be killed outright and their Death resist byte reads 0); **Leblanc's** walls are the same minus Silence (she can be silenced, put to Sleep, blinded, poisoned, confused or petrified); the special word 0x19b
 * (bits 0, 1, 3, 4, 7 and 8: immune to the percent formulas, hit reactions do not slow it, no Zantetsu, no Bribe) is the same on all three, so **all three can be delayed and interrupted**; each nulls Gravity; the steal chance
 * byte is 192 for all three (Iron Bangle, Silver Glasses and Silver Bracer), Pilfer Gil 200, 200 and 500; no Bribe slot; Zantetsu 50, 50 and 60. Their plain Attack is the row 0x41da for Ormi and the row 0x4000 for Leblanc;
 * Logos has none (his pistol is his only blow). The command rows of the other moves are in `../command-records/luca-opener.ts`; the scripts (`m129`, `m130`, `m131`) are `../../../battle/ffx2/ai/luca-opener.ts`.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/luca-opener-data.test.ts`].
 */

import type { FFX2CommandRecord, FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { LUCA_DOCK_LEBLANC_GROUP_ID, LUCA_DOCK_LOGOS_ORMI_GROUP_ID, X2_LUCA_LEBLANC_ID, X2_LUCA_LOGOS_ID, X2_LUCA_ORMI_ID } from '../../luca-opener-ids.ts';

/** The row 0x41da Attack (Ormi's). */
const ATTACK_41DA: FFX2CommandRecord = { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 };
/** The row 0x4000 Attack (Leblanc's). */
const ATTACK_4000: FFX2CommandRecord = { id: 0x4000, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 };

/** `monster.bin` row 129, table 1. */
const ORMI_ROW: FFX2MonsterRecord = {
  row: 129,
  table: 1,
  acc: 95,
  resist1: { 3: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x19b,
  species: 0x0,
  zantetsu: 50,
  stealByte: 192,
  stealGil: 200,
  steal: [0x9000, 0x1, 0x9000, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: ATTACK_41DA,
};

/** `monster.bin` row 130, table 1. */
const LOGOS_ROW: FFX2MonsterRecord = {
  row: 130,
  table: 1,
  acc: 95,
  resist1: { 3: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x19b,
  species: 0x0,
  zantetsu: 50,
  stealByte: 192,
  stealGil: 200,
  steal: [0x9049, 0x1, 0x9049, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 131, table 1. */
const LEBLANC_ROW: FFX2MonsterRecord = {
  row: 131,
  table: 1,
  acc: 95,
  resist1: { 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x19b,
  species: 0x0,
  zantetsu: 60,
  stealByte: 192,
  stealGil: 500,
  steal: [0x9004, 0x1, 0x9004, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: ATTACK_4000,
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_LUCA_OPENER: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${LUCA_DOCK_LOGOS_ORMI_GROUP_ID}/${X2_LUCA_ORMI_ID}`]: ORMI_ROW,
  [`${LUCA_DOCK_LOGOS_ORMI_GROUP_ID}/${X2_LUCA_LOGOS_ID}`]: LOGOS_ROW,
  [`${LUCA_DOCK_LEBLANC_GROUP_ID}/${X2_LUCA_LEBLANC_ID}`]: LEBLANC_ROW,
};
