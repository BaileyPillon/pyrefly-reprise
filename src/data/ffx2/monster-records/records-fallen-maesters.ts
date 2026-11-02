/**
 * The game's own monster rows for the four Fallen Maesters (the Via Infinito floors 20, 40, 60 and 80; the hidden chapter "The Fallen Maesters"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 221 (Aranea, id 0x10dd), 69 (Black Elemental, 0x1045), 232 (Concherer, 0x10e8) and 239 (Chac, 0x10ef)** of the Steam HD build, formation rows 1889 to 1892 (`stbv09_228`,
 * `_227`, `_226`, `_225`), read field by field by the RE parity session (`research/re-ffx2-fallen-maesters.md` §3 the column map, §4 the rows), numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`.
 * **The second stat block in `monster2.bin` (the Oversoul versions) is NOT used**: FM2 (a), normal versions only (`docs/handoff/ch-maesters.md`).
 *
 * What the rows say: Accuracy 95; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group-1 slots 0 to 8), and slots 17 and 18 immune on all four; **Eject** reads 100 (Black Elemental
 * and Aranea), 255 (Concherer) and 90 (Chac); group 2 Slow (5), Stop (6) and Doom (14) immune on all four, **and every stat stage (7 to 13) on Aranea, Concherer and Chac, none on the Black Elemental**; Shell, Protect,
 * Regen and Haste are not resisted and **Reflect (2) lands on the Black Elemental, which wears its own** (`../enemies/fallen-maesters.ts`, `autoStatuses`). The special words are 0x253, 0x25b, 0x2db and 0x99:
 * **Chac alone has neither the "a hit does not slow the gauge" bit nor the "no ATB damage" bit** (so she can be slowed and delayed), the other three have both and are immune to Interrupt.
 * The Zantetsu bytes are 30, 80, 200 and 90. Gravity is nulled on all four (Chac also absorbs Thunder and is weak to Ice: `../enemies/fallen-maesters.ts`).
 *
 * **Gaps, named (rule 6: nothing invented).** The RE note gives the steal and bribe items by NAME; an item id is laid here only where the repo already pairs that name with an id
 * (`research/re-ffx2-commands.md` "Items": Ether 0x2004, Turbo Ether 0x2005, Elixir 0x2008). **Rune Bracer (the Black Elemental's rare steal), Kinesis Badge (Aranea's rare steal) and every Bribe slot have no id in any
 * table of this repo**, so those slots are 0 (empty); the same goes for the drop items in `./kill-rewards.ts` (the four rows there hold only the item ids this repo already pairs with a name: Stamina Tonic 0x203b, Mythril Bangle 0x9002,
 * Crystal Gloves 0x900e, Pixie Dust 0x9012; Mana Tonic, Tetra Gloves, Blessed Gem and Shining Gem have none, so those slots are 0). The RE session can fill them from `item.bin` and `accessory.bin`. The species mask (+0x9a) is not given by the note and is 0, as in every record whose note leaves it out.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/fallen-maesters-data.test.ts` against `tests/fixtures/parity/ffx2/fallen_maesters_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { FLOOR_20_GROUP_ID, FLOOR_40_GROUP_ID, FLOOR_60_GROUP_ID, FLOOR_80_GROUP_ID, X2_ARANEA_ID, X2_BLACK_ELEMENTAL_ID, X2_CHAC_ID, X2_CONCHERER_ID } from '../../fallen-maesters-ids.ts';

/** Group 1, the same on all four rows but Eject (slot 10): Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse, and slots 17 and 18 (Itchy, Auto-Life in the engine's table). */
const GROUP1_IMMUNE: Readonly<Record<number, number>> = { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 17: 255, 18: 255 };

/** Group 2 of Aranea, Concherer and Chac: Slow (5), Stop (6), every stat stage (7 to 13) and Doom (14). */
const GROUP2_NO_STAGES: Readonly<Record<number, number>> = { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 };

/** `monster.bin` row 221: Aranea. */
const ARANEA_ROW: FFX2MonsterRecord = {
  row: 221,
  table: 1,
  acc: 95,
  resist1: { ...GROUP1_IMMUNE, 10: 100 },
  resist2: GROUP2_NO_STAGES,
  special: 0x25b,
  species: 0x0,
  zantetsu: 80,
  stealByte: 64,
  stealGil: 2200,
  steal: [0x2005, 0x1, 0x0, 0x0], // Turbo Ether x1; the rare slot (Kinesis Badge x1) has no id in this repo's tables
  bribe: [0x0, 0x0, 0x0, 0x0], // Black Lore x5 / Sword Tome x8 by name only
};

/** `monster.bin` row 69: Black Elemental. */
const BLACK_ELEMENTAL_ROW: FFX2MonsterRecord = {
  row: 69,
  table: 1,
  acc: 95,
  resist1: { ...GROUP1_IMMUNE, 10: 100 },
  resist2: { 5: 255, 6: 255, 14: 255 }, // Slow, Stop, Doom; Reflect and all seven stages land
  special: 0x253,
  species: 0x0,
  zantetsu: 30,
  stealByte: 64,
  stealGil: 1000,
  steal: [0x2004, 0x1, 0x0, 0x0], // Ether x1; the rare slot (Rune Bracer x1) has no id in this repo's tables
  bribe: [0x0, 0x0, 0x0, 0x0], // Arcane Lore x1 / x1 by name only
};

/** `monster.bin` row 232: Concherer. */
const CONCHERER_ROW: FFX2MonsterRecord = {
  row: 232,
  table: 1,
  acc: 95,
  resist1: { ...GROUP1_IMMUNE, 10: 255 },
  resist2: GROUP2_NO_STAGES,
  special: 0x2db,
  species: 0x0,
  zantetsu: 200,
  stealByte: 64,
  stealGil: 3000,
  steal: [0x2008, 0x1, 0x2008, 0x2], // Elixir x1 / Elixir x2
  bribe: [0x0, 0x0, 0x0, 0x0], // White Lore x28 / Bushido Tome x30 by name only
};

/** `monster.bin` row 239: Chac. */
const CHAC_ROW: FFX2MonsterRecord = {
  row: 239,
  table: 1,
  acc: 95,
  resist1: { ...GROUP1_IMMUNE, 10: 90 },
  resist2: GROUP2_NO_STAGES,
  special: 0x99,
  species: 0x0,
  zantetsu: 90,
  stealByte: 64,
  stealGil: 3300,
  steal: [0x2004, 0x1, 0x2004, 0x2], // Ether x1 / Ether x2
  bribe: [0x0, 0x0, 0x0, 0x0], // Supreme Gem x3 / x6 by name only
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_FALLEN_MAESTERS: Readonly<Record<string, FFX2MonsterRecord>> = {
  [`${FLOOR_20_GROUP_ID}/${X2_ARANEA_ID}`]: ARANEA_ROW,
  [`${FLOOR_40_GROUP_ID}/${X2_BLACK_ELEMENTAL_ID}`]: BLACK_ELEMENTAL_ROW,
  [`${FLOOR_60_GROUP_ID}/${X2_CONCHERER_ID}`]: CONCHERER_ROW,
  [`${FLOOR_80_GROUP_ID}/${X2_CHAC_ID}`]: CHAC_ROW,
};
