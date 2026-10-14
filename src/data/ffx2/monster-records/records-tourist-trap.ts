/**
 * The game's own monster rows for Yojimbo and Daigoro in the Cavern of the Stolen Fayth (the optional FFX-2 mission "Tourist Trap"; the hidden chapter). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `battle/kernel/monster.bin` of the Steam HD build, **row 170 (Yojimbo)** and **row 174 (Daigoro)**, formation 1847 slots 1 and 2, read field by field by the RE parity session
 * (`research/re-ffx2-yojimbo-valefor.md` sections 3 to 5, numbers only), pinned by `tests/unit/chapters/tourist-trap-engine.test.ts` against `tests/fixtures/parity/ffx2/tourist_trap_rows.json`.
 * Merged into `MONSTER_RECORDS` by `./records.ts`.
 *
 * What the rows say: Yojimbo: Accuracy 95; group 1 immune (255) to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8) and Eject (slot 10); group 2
 * immune to Slow, Stop, the seven stat stages and Doom (slots 5 to 14); Shell, Protect, **Reflect**, Regen and Haste are NOT resisted (the wiki's Reflect immunity is not in the record); steal
 * byte 128 (50.2 percent), Power Wrist x1 common and x1 rare (item 0x9008); Pilfer Gil 2,000; no Bribe slot; Zantetsu 120. Daigoro: Accuracy 95; immune to Curse only; no steal, no gil.
 *
 * **What is deliberately NOT wired** (the RE note marks it unmapped, or leaves its meaning open; rule 6):
 * - **Group 1 slots 17 and 18** (255 on both rows): "unmapped (raw 255, 255)" in the note's section 5. They have no status slot in the engine, so leaving them out changes nothing in a fight.
 * - **The special word's bits 7, 8 and 9.** The rows hold 0x3c3 (Yojimbo; 0 for Daigoro): bits 0, 1, 6, 7, 8, 9. Bits 0 (no percentage-HP formulas), 1 (a hit reaction does not slow its gauge) and 6 (no ATB
 *   damage) have meanings an earlier checked note proves, so the wired word is **0x43**. Bits 7 and 8 are unmapped. Bit 9 is "immune to magic cancel" by the ATB note and "Bribe immune" by the
 *   hit-status note, and this engine reads bit 9 (0x200) as Bribe immunity: the RE note leaves it open, so, per the driver's rule ("assume neither"), it is left out.
 * - **The monster-type word (+0x9a)**, read 0 and unmapped: `species` is 0.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/tourist-trap-engine.test.ts`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** Row 170 (`monster.bin`, table 1): Yojimbo. */
const YOJIMBO_ROW: FFX2MonsterRecord = {
  row: 170,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x43, // the row's 0x3c3 reduced to the proven bits 0, 1 and 6 (see the header)
  species: 0,
  zantetsu: 120,
  stealByte: 128,
  stealGil: 2000,
  steal: [0x9008, 1, 0x9008, 1], // Power Wrist x1 common, x1 rare
  bribe: [0, 0, 0, 0], // no Bribe slot
};

/** Row 174 (`monster.bin`, table 1): Daigoro. */
const DAIGORO_ROW: FFX2MonsterRecord = {
  row: 174,
  table: 1,
  acc: 95,
  resist1: { 8: 255 },
  resist2: {},
  special: 0,
  species: 0,
  zantetsu: 0,
  stealByte: 0,
  stealGil: 0,
  steal: [0, 0, 0, 0],
  bribe: [0, 0, 0, 0],
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_TOURIST_TRAP: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-cavern-yojimbo/x2-yojimbo': YOJIMBO_ROW,
  'ffx2-cavern-yojimbo/x2-daigoro': DAIGORO_ROW,
};
