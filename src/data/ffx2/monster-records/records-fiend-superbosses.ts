/**
 * The game's own monster rows for the nine actors of the hidden chapter "The Fiend Arena Superbosses": Almighty Shinra, the four heads of the Major Numerus and its body, pod and tail. Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 329 (Almighty Shinra, id 0x1149), 330 to 333 (Unum, Duo, Tria, Quattour: 0x114a to 0x114d) and 334 to 336 (the Major Numerus's body, pod and tail: 0x114e to 0x1150)** of the Steam HD
 * build, read field by field (`research/re-ffx2-fiend-arena-superbosses.md` §0), numbers only, by a script (`tests/fixtures/parity/ffx2/fiend_superbosses_rows.json`). Merged into `MONSTER_RECORDS` by
 * `./records.ts`. No formation of the archive names these rows (RE section 1: the arena builds them outside `btl.txt`), so there is no formation row to cite: the chapter's own formations
 * (`../enemies/fiend-superbosses.ts`) are ours.
 *
 * What the rows say: Accuracy 130 on Shinra and 255 on the four heads; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group-1 slots 0 to 8), Eject (10) and slots 17 and 18 immune on all five;
 * group 2 Slow (5), Stop (6), the seven stage slots (7 to 13) and Doom (14) immune on all five, **and Reflect (2) on Shinra alone**. The special words are 0x3db (Shinra) and 0x7c3 (the heads): the percent-immune, the
 * hit-reaction, the no-ATB-damage, the no-Zantetsu, the no-Bribe and the Interrupt-immune bits, and bit 10 on the heads, unmapped. The Zantetsu byte is 255 on all five; the steal byte is 64 on Shinra and 32 on the heads. The
 * body, pod and tail are Lv 1 with 1 HP, 1 in every stat, Eject, Itchy and Auto-Life at 255, and nothing else.
 *
 * **Gaps, named (rule 6: nothing invented).** The rare drop of Shinra (Ragnarok, 0x907d) and both drops of each head (Enterprise 0x907e or Invincible 0x907f common; Iron Duke 0x907c x5 rare) are accessories this repo's item
 * tables hold no entry for, so those slots are 0 in `./kill-rewards.ts` (the raw ids are in the fixture). The species word (+0x9a) is 0 on all eight rows.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/fiend-superbosses-data.test.ts` against `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import {
  ACT_1_GROUP_ID,
  ACT_2_GROUP_ID,
  X2_ALMIGHTY_SHINRA_ID,
  X2_NUMERUS_BODY_ID,
  X2_NUMERUS_DUO_ID,
  X2_NUMERUS_POD_ID,
  X2_NUMERUS_QUATTOUR_ID,
  X2_NUMERUS_TAIL_ID,
  X2_NUMERUS_TRIA_ID,
  X2_NUMERUS_UNUM_ID,
} from '../../fiend-superbosses-ids.ts';

/** `monster.bin` row 329: Almighty Shinra. */
const SHINRA_ROW: FFX2MonsterRecord = {
  row: 329,
  table: 1,
  acc: 130,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 2: 255, 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x3db,
  species: 0x0,
  zantetsu: 255,
  stealByte: 64,
  stealGil: 5000,
  steal: [0x2005, 0x1, 0x2005, 0x2],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 330: Unum. */
const UNUM_ROW: FFX2MonsterRecord = {
  row: 330,
  table: 1,
  acc: 255,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 32,
  stealGil: 3000,
  steal: [0x2003, 0x2, 0x2009, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 331: Duo. */
const DUO_ROW: FFX2MonsterRecord = {
  row: 331,
  table: 1,
  acc: 255,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 32,
  stealGil: 3000,
  steal: [0x2002, 0x2, 0x2009, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 332: Tria. */
const TRIA_ROW: FFX2MonsterRecord = {
  row: 332,
  table: 1,
  acc: 255,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 32,
  stealGil: 3000,
  steal: [0x2007, 0x2, 0x2009, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 333: Quattour. */
const QUATTOUR_ROW: FFX2MonsterRecord = {
  row: 333,
  table: 1,
  acc: 255,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x7c3,
  species: 0x0,
  zantetsu: 255,
  stealByte: 32,
  stealGil: 3000,
  steal: [0x2008, 0x2, 0x2009, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 334: the Major Numerus body. */
const BODY_ROW: FFX2MonsterRecord = {
  row: 334,
  table: 1,
  acc: 1,
  resist1: { 10: 255, 17: 255, 18: 255 },
  resist2: {  },
  special: 0x0,
  species: 0x0,
  zantetsu: 0,
  stealByte: 0,
  stealGil: 0,
  steal: [0x0, 0x0, 0x0, 0x0],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 335: the Major Numerus pod. */
const POD_ROW: FFX2MonsterRecord = {
  row: 335,
  table: 1,
  acc: 1,
  resist1: { 10: 255, 17: 255, 18: 255 },
  resist2: {  },
  special: 0x0,
  species: 0x0,
  zantetsu: 0,
  stealByte: 0,
  stealGil: 0,
  steal: [0x0, 0x0, 0x0, 0x0],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 336: the Major Numerus tail. */
const TAIL_ROW: FFX2MonsterRecord = {
  row: 336,
  table: 1,
  acc: 1,
  resist1: { 10: 255, 17: 255, 18: 255 },
  resist2: {  },
  special: 0x0,
  species: 0x0,
  zantetsu: 0,
  stealByte: 0,
  stealGil: 0,
  steal: [0x0, 0x0, 0x0, 0x0],
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_FIEND_SUPERBOSSES: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${ACT_1_GROUP_ID}/${X2_ALMIGHTY_SHINRA_ID}`]: SHINRA_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_UNUM_ID}`]: UNUM_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_DUO_ID}`]: DUO_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_TRIA_ID}`]: TRIA_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_QUATTOUR_ID}`]: QUATTOUR_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_BODY_ID}`]: BODY_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_POD_ID}`]: POD_ROW,
  [`${ACT_2_GROUP_ID}/${X2_NUMERUS_TAIL_ID}`]: TAIL_ROW,
};
