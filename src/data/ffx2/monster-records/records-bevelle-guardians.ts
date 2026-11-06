/**
 * The game's own monster rows for the three guardians of the Bevelle Underground (Georapella, the Precepts Guard and the first Baralai; the hidden chapter "The Guardians of the Bevelle Underground"). Re-parity W3's
 * shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 262 (Georapella, id 0x1106), 263 (Precepts Guard, 0x1107) and 175 (Baralai, 0x10af)** of the Steam HD build, formation rows 1415, 1416 and 1436 (`stbv03_228`, `stbv03_227`,
 * `stbv06_229`), read field by field by the RE lane (`research/re-ffx2-bevelle-underground.md` §3 the column map, §4 the rows), numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`.
 * **The second stat block in `monster2.bin` (the Oversoul versions of 262 and 263) is NOT used**: BG7, they cannot be reached in a normal run (`research/re-ffx2-bevelle-underground.md` §4.4).
 *
 * What the rows say: Accuracy 95; Death, Petrify, Sleep, Silence, Confusion, Berserk, Curse (group-1 slots 0 to 3 and 6 to 8), Eject (10) and slots 17 and 18 immune on all three; **Darkness (4) and Poison (5) are
 * immune on Georapella and the Precepts Guard and LAND on Baralai** (unlike the Den of Woe shade; the RE note's §4.2 prose names only Darkness, **the row wins**: the byte of Poison reads 0); group 2 Stop (6) and Doom (14)
 * immune on all three, **Slow (5) immune on the Precepts Guard and Baralai but not on Georapella**; every stat stage lands on all three. The special words are 0x183, 0x183 and 0x3c3: **Georapella and the Precepts Guard have neither the "no ATB damage" bit (6) nor the Interrupt bit (9)**, so they can
 * be delayed and interrupted; Baralai has both set. The Zantetsu bytes are 80, 100 and 100. Gravity is nulled on all three and Holy is the weakness of the first two (`../enemies/bevelle-guardians.ts`).
 *
 * **Item ids** are the rows' own (the RE lane named them from the US item, accessory and important tables): Water Gem 0x2024, Mana Tablet 0x203a and Charm Bangle 0x9072 to steal; the three drops are in
 * `./kill-rewards.ts` (NulTide Ring 0x902e, Regen Bangle 0x905a, Pearl Necklace 0x904e). No Bribe slot is set on any row. The species mask (+0x9a) is not given by the note and is 0, as in every record whose note
 * leaves it out.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/bevelle-guardians-data.test.ts` against `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { BARALAI_GROUP_ID, GEORAPELLA_GROUP_ID, PRECEPTS_GUARD_GROUP_ID, X2_BARALAI_ID, X2_GEORAPELLA_ID, X2_PRECEPTS_GUARD_ID } from '../../bevelle-guardians-ids.ts';

/** Group 1 of the two floor-3 guardians: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, Eject, and slots 17 and 18 (Itchy, Auto-Life in the engine's table). */
const GROUP1_IMMUNE: Readonly<Record<number, number>> = { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 };

/** `monster.bin` row 262: Georapella. */
const GEORAPELLA_ROW: FFX2MonsterRecord = {
  row: 262,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: { 6: 255, 14: 255 }, // Stop, Doom: Slow lands
  special: 0x183,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 1300,
  steal: [0x2024, 0x1, 0x2024, 0x2], // Water Gem x1 / Water Gem x2
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 263: Precepts Guard. */
const PRECEPTS_GUARD_ROW: FFX2MonsterRecord = {
  row: 263,
  table: 1,
  acc: 95,
  resist1: GROUP1_IMMUNE,
  resist2: { 5: 255, 6: 255, 14: 255 }, // Slow, Stop, Doom
  special: 0x183,
  species: 0x0,
  zantetsu: 100,
  stealByte: 128,
  stealGil: 1600,
  steal: [0x203a, 0x1, 0x203a, 0x2], // Mana Tablet x1 / Mana Tablet x2
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** `monster.bin` row 175: Baralai (the first, living one). */
const BARALAI_ROW: FFX2MonsterRecord = {
  row: 175,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 }, // Darkness (4) and Poison (5) land: he can be blinded and poisoned
  resist2: { 5: 255, 6: 255, 14: 255 }, // Slow, Stop, Doom
  special: 0x3c3,
  species: 0x0,
  zantetsu: 100,
  stealByte: 255,
  stealGil: 2000,
  steal: [0x9072, 0x1, 0x9072, 0x1], // Charm Bangle x1 / Charm Bangle x1
  bribe: [0x0, 0x0, 0x0, 0x0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_BEVELLE_GUARDIANS: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${GEORAPELLA_GROUP_ID}/${X2_GEORAPELLA_ID}`]: GEORAPELLA_ROW,
  [`${PRECEPTS_GUARD_GROUP_ID}/${X2_PRECEPTS_GUARD_ID}`]: PRECEPTS_GUARD_ROW,
  [`${BARALAI_GROUP_ID}/${X2_BARALAI_ID}`]: BARALAI_ROW,
};
