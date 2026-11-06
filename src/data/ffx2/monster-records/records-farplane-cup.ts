/**
 * The game's own monster rows for the three duelists of the hidden chapter "The Farplane Cup" (the Fiend Arena block). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 311 (Auron, id 0x1137), 317 (the masked name of Tidus, 0x113d) and 319 (Seymour, 0x113f)** of the Steam HD build, read field by field (`research/re-ffx2-farplane-cup.md` §3 the
 * column map, §4 the rows), numbers only, by a script (`tests/fixtures/parity/ffx2/farplane_cup_rows.json`). Merged into `MONSTER_RECORDS` by `./records.ts`. The cup rows are used by no formation in the archive
 * (RE §5), so there is no formation row to cite: the chapter's own formations (`../enemies/farplane-cup.ts`) are ours.
 *
 * What the rows say: Accuracy 112, 139 and 105; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group-1 slots 0 to 8), Eject (10), and slots 17 and 18 immune on all three; **Silence reads 250
 * on Auron and Darkness 250 on Seymour**; group 2 Slow (5), Stop (6) and Doom (14) immune on all three, **and Reflect (2) on Tidus**; no stat stage is resisted. The special words are 0x3db (Auron, Tidus) and 0x2db
 * (Seymour, without the Bribe bit): both carry the no-ATB-damage and Interrupt-immune bits (6 and 9). The Zantetsu bytes are 220, 220 and 180; the steal byte is 128 on all three.
 *
 * **Gaps, named (rule 6: nothing invented).** The rare drop of each row (Bushido Lore 0x9063, Sword Lore 0x9062, Arcane Lore 0x9064) is a numbered item this repo's item tables hold no entry for, so those slots are 0 in
 * `./kill-rewards.ts`. The Bribe slots are laid (Seymour's two, the Crystal Ball and Soul of Thamasa the repo already pairs with a name; the other two rows read none), although Seymour's Bribe bit is clear and no chapter
 * offers a Bribe on these. The species mask (+0x9a) is not given by the note and is 0.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/farplane-cup-data.test.ts` against `tests/fixtures/parity/ffx2/farplane_cup_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { DUEL_1_GROUP_ID, DUEL_2_GROUP_ID, DUEL_3_GROUP_ID, X2_CUP_AURON_ID, X2_CUP_SEYMOUR_ID, X2_CUP_TIDUS_ID } from '../../farplane-cup-ids.ts';

/** Group 1, the same on all three rows but the two 250s: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, and slots 17 and 18 (Itchy, Auto-Life in the engine's table). */
const GROUP1_IMMUNE: Readonly<Record<number, number>> = { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 };

/** `monster.bin` row 311: Auron. */
const AURON_ROW: FFX2MonsterRecord = {
  row: 311,
  table: 1,
  acc: 112,
  resist1: { ...GROUP1_IMMUNE, 3: 250 },
  resist2: { 5: 255, 6: 255, 14: 255 },
  special: 0x3db,
  species: 0x0,
  zantetsu: 220,
  stealByte: 128,
  stealGil: 1000,
  steal: [0x2007, 0x1, 0x2008, 0x1], // Mega Phoenix x1 / Elixir x1
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 317: the masked name; Tidus. */
const TIDUS_ROW: FFX2MonsterRecord = {
  row: 317,
  table: 1,
  acc: 139,
  resist1: { ...GROUP1_IMMUNE },
  resist2: { 2: 255, 5: 255, 6: 255, 14: 255 }, // Reflect, Slow, Stop, Doom
  special: 0x3db,
  species: 0x0,
  zantetsu: 220,
  stealByte: 128,
  stealGil: 2000,
  steal: [0x2002, 0x1, 0x2008, 0x1], // X-Potion x1 / Elixir x1
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 319: Seymour. */
const SEYMOUR_ROW: FFX2MonsterRecord = {
  row: 319,
  table: 1,
  acc: 105,
  resist1: { ...GROUP1_IMMUNE, 4: 250 },
  resist2: { 5: 255, 6: 255, 14: 255 },
  special: 0x2db,
  species: 0x0,
  zantetsu: 180,
  stealByte: 128,
  stealGil: 2000,
  steal: [0x2001, 0x12, 0x2008, 0x1], // Hi-Potion x18 / Elixir x1
  bribe: [0x9013, 0x1, 0x9074, 0x2], // Crystal Ball x1 / Soul of Thamasa x2
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_FARPLANE_CUP: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${DUEL_1_GROUP_ID}/${X2_CUP_AURON_ID}`]: AURON_ROW,
  [`${DUEL_2_GROUP_ID}/${X2_CUP_TIDUS_ID}`]: TIDUS_ROW,
  [`${DUEL_3_GROUP_ID}/${X2_CUP_SEYMOUR_ID}`]: SEYMOUR_ROW,
};
