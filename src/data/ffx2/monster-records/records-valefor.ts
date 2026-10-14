/**
 * The game's own monster row for Valefor at Besaid Temple (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"; the hidden chapter "Valefor at Besaid"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **row 164** of the Steam HD build (id 0x10a4, formation 0393 `bsyt05_229`, the Besaid temple's trial room), read field by field by the RE parity session
 * (`research/re-ffx2-yojimbo-valefor.md` §3 the column map, §4 the rows, §5 the raw bytes), numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`. The second Valefor, **row 363**
 * (Lv 48, HP 38,000), is in no formation and is not used.
 *
 * What the row says: Accuracy 95; Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (group 1 slots 0 to 8) and Eject (slot 10) immune; group 2 Stop (6) and Doom (14)
 * immune, so Slow and every Break land; Shell, Protect, Reflect, Regen and Haste are not resisted; the special word 0x3c3 (immune to the percent formulas and to ATB damage, hit reactions do
 * not slow it); neutral to every element but Gravity (null); steal chance byte 128, Healing Spring x4 common and x6 rare (item 0x2034), Pilfer Gil 1,500; no Bribe slot; Zantetsu byte 80.
 *
 * **Deliberately NOT in the record**, because the note marks them "unmapped (raw N)" and the engine's slot table would wire them: group-1 resist slots 17 and 18 (raw 255, 255; the table reads
 * them as Itchy and Auto-Life). The special word is carried as the row has it (bits 7 and 8 are unmapped, bit 9 is the contested Bribe or magic-cancel bit); nothing here reads those bits, and
 * the species mask is the row's monster-type word, 0. The other aeon rows in `./records.ts` carry slots 17 and 18 at 255; they are not changed here.
 *
 * **Not read yet:** the command rows of her moves (`monmagic.bin` 0x4091 Energy Ray, 0x4092 Sonic Wings, 0x4093 Energy Blast): the note gives their ids and nothing else, so the three moves still
 * run on SinirothX's damage constants (`../enemies/valefor-abilities.ts`), and her AI script (`m164`) is not decompiled (the note's section 9), so `../../../battle/ffx2/ai/valefor.ts` is the research's tagged reading.
 * The plain Attack is the game's row 0x41da (the one every monster's `Attack` is, `./records.ts`).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/besaid-valefor-data.test.ts` against `tests/fixtures/parity/ffx2/besaid_valefor_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** `monster.bin` row 164, table 1. */
const VALEFOR_ROW: FFX2MonsterRecord = {
  row: 164,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x3c3,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 1500,
  steal: [0x2034, 0x4, 0x2034, 0x6],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 },
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_VALEFOR: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-besaid-valefor/x2-valefor': VALEFOR_ROW,
};
