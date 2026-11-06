/**
 * The game's own monster rows for the possessed Rikku and the possessed Paine (the Den of Woe's first two fights; the hidden chapter "Yuna's Ballad"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 254 (Rikku, id 0x10fe) and 256 (Paine, id 0x1100)** of the Steam HD build 25501027, formation rows 1806 and 1805 (`kino13_228`, `kino13_229`), read field by field by the RE session
 * (`research/re-ffx2-yunas-ballad.md` §3 and §4, 2026-11-06), numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`. The weapon prop rows 255 and 257 are invisible actors with no action and no
 * cursor, not in battle (the prop scripts switch those off), and are not authored.
 *
 * What the rows say: Accuracy 95; **Death, Petrify, Silence, Poison, Curse and Eject (group-1 slots 0, 1, 3, 5, 8 and 10) and Itchy and Auto-Life (17 and 18) are immune on both, and Stop (6) and Doom (14) of group 2;
 * Sleep, Darkness, Confusion and Berserk read 0 and LAND, as does Slow, and every stat stage, Shell, Protect, Reflect, Regen and Haste.** That is what lets one girl answer the duels (Split_Infinity, the wiki). The special word is 0x3c3 on both
 * (bits 0, 1, 6, 7, 8 and 9): the percent formulas do nothing, a hit does not slow the gauge, no ATB damage, no Interrupt; the Bribe bit is set with no bribe items. Gravity is nulled on both. The Zantetsu byte is 80.
 *
 * **Gaps, named (rule 6: nothing invented).** The RE note gives the steal items by NAME (Bushido Lore for Rikku, Sword Lore for Paine); an item id is laid here only where the repo already pairs that name with an
 * id, and neither Lore has one, so the steal slots are 0 (empty) here and in the enemy data (the Pilfer Gil figure and the steal byte 128 are the row's). The drop slots of `./kill-rewards.ts` hold Paine's Champion Belt
 * (0x901a) and Rikku's Black Lore (0x9066) is 0. The species mask (+0x9a) is not given by the note and is 0.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/yunas-ballad-data.test.ts` against `tests/fixtures/parity/ffx2/yunas_ballad_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { PAINE_DUEL_GROUP_ID, RIKKU_DUEL_GROUP_ID, X2_POSSESSED_PAINE_ID, X2_POSSESSED_RIKKU_ID } from '../../yunas-ballad-ids.ts';

/** Group 1, the same on both rows: Death (0), Petrify (1), Silence (3), Poison (5), Curse (8), Eject (10), and slots 17 and 18 (Itchy, Auto-Life in the engine's table). Sleep (2), Darkness (4), Confusion (6) and Berserk (7) read 0. */
const GROUP1_IMMUNE: Readonly<Record<number, number>> = { 0: 255, 1: 255, 3: 255, 5: 255, 8: 255, 10: 255, 17: 255, 18: 255 };

/** Group 2, the same on both rows: Stop (6) and Doom (14). Slow, every stat stage, Shell, Protect, Reflect, Regen and Haste are not resisted. */
const GROUP2_IMMUNE: Readonly<Record<number, number>> = { 6: 255, 14: 255 };

/** `monster.bin` row 254: Rikku. */
const RIKKU_ROW: FFX2MonsterRecord = {
  row: 254,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: GROUP2_IMMUNE,
  special: 0x3c3,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 300,
  steal: [0x0, 0x0, 0x0, 0x0], // Bushido Lore x1 / x1 by name only
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 256: Paine. */
const PAINE_ROW: FFX2MonsterRecord = {
  row: 256,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: GROUP2_IMMUNE,
  special: 0x3c3,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 300,
  steal: [0x0, 0x0, 0x0, 0x0], // Sword Lore x1 / x1 by name only
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_YUNAS_BALLAD: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${RIKKU_DUEL_GROUP_ID}/${X2_POSSESSED_RIKKU_ID}`]: RIKKU_ROW,
  [`${PAINE_DUEL_GROUP_ID}/${X2_POSSESSED_PAINE_ID}`]: PAINE_ROW,
};
