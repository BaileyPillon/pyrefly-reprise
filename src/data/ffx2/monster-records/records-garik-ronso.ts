/**
 * The game's own monster rows for Garik Ronso and the Ronso Youth (the summit fight of FFX-2 Chapter 3, "Battle Blockade"; the hidden chapter "Garik Ronso"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 182 (Garik Ronso, id 0x10b6) and 181 (Ronso Youth, id 0x10b5)** of the Steam HD build 25501027, formation rows 1622 and 1621 (`mtgz10_228`, `mtgz10_229`), read field by field by the RE
 * session (`research/re-ffx2-garik-ronso.md` section 0, 2026-11-07) and again by the script that wrote `tests/fixtures/parity/ffx2/garik_ronso_rows.json`, numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`. The weapon
 * prop row (206, "Spear") is an invisible actor with no action, not in battle, and is not authored.
 *
 * Confidence: [single source], the game's own monster table (`research/re-ffx2-garik-ronso.md` §0); the species mask is a [gap] and is 0.
 *
 * What the rows say. **Garik**: Death, Petrify, Sleep, Silence, Berserk, Curse, Eject, Itchy and Auto-Life (group-1 slots 0, 1, 2, 3, 7, 8, 10, 17 and 18) at 255, **Darkness and Poison (slots 4 and 5) at 20**, Slow, Stop and Doom
 * (group-2 slots 5, 6 and 14) at 255; Confusion, every stat stage, Shell, Protect, Reflect, Regen and Haste are not resisted. Special word 0x3c3 (bits 0, 1, 6, 7, 8 and 9): the percent formulas do nothing, a hit does not slow him,
 * no ATB damage, no Interrupt, the Bribe bit with no bribe items. Zantetsu byte 20. **The Youth**: Death, Petrify, Sleep, Silence, Curse, Itchy and Auto-Life at 255, Darkness at 20, Doom at 255; **Poison, Confusion, Berserk, Eject, Slow
 * and Stop land.** Special word 0x181 (bits 0, 7 and 8): the percent formulas do nothing, no Bribe; the Youth's hits slow it and its gauge takes ATB damage, so it can be delayed. Zantetsu byte 0. Gravity is nulled on both.
 *
 * **Gaps, named (rule 6: nothing invented).** The species mask (+0x9a) is not given by the note and is 0. The steal items are laid as the rows have them: Garik's Icy Gleam (0x9024) and the Youth's Mythril Bangle (0x9002); the
 * guide prints a rare Mythril Bangle x2 for the Youth where the row says x1 and x1, and **the row wins**. No Bribe slot is filled (both rows are empty).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/garik-ronso-data.test.ts` against `tests/fixtures/parity/ffx2/garik_ronso_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import {
  GARIK_FRIENDLY_GROUP_ID,
  GARIK_HOSTILE_GROUP_ID,
  X2_GARIK_BOUT_ID,
  X2_GARIK_ID,
  X2_YOUTH_A_ID,
  X2_YOUTH_B_ID,
  X2_YOUTH_BOUT_ID,
} from '../../garik-ronso-ids.ts';

/** `monster.bin` row 182: Garik Ronso. */
const GARIK_ROW: FFX2MonsterRecord = {
  row: 182,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 20, 5: 20, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 14: 255 },
  special: 0x3c3,
  species: 0x0,
  zantetsu: 20,
  stealByte: 64,
  stealGil: 130,
  steal: [0x9024, 0x1, 0x9024, 0x1], // Icy Gleam x1 / x1
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 181: Ronso Youth. */
const YOUTH_ROW: FFX2MonsterRecord = {
  row: 181,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 20, 8: 255, 17: 255, 18: 255 },
  resist2: { 14: 255 },
  special: 0x181,
  species: 0x0,
  zantetsu: 0,
  stealByte: 64,
  stealGil: 80,
  steal: [0x9002, 0x1, 0x9002, 0x1], // Mythril Bangle x1 / x1
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_GARIK_RONSO: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${GARIK_HOSTILE_GROUP_ID}/${X2_YOUTH_A_ID}`]: YOUTH_ROW,
  [`${GARIK_HOSTILE_GROUP_ID}/${X2_YOUTH_B_ID}`]: YOUTH_ROW,
  [`${GARIK_HOSTILE_GROUP_ID}/${X2_GARIK_ID}`]: GARIK_ROW,
  [`${GARIK_FRIENDLY_GROUP_ID}/${X2_YOUTH_BOUT_ID}`]: YOUTH_ROW,
  [`${GARIK_FRIENDLY_GROUP_ID}/${X2_GARIK_BOUT_ID}`]: GARIK_ROW,
};
