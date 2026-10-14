/**
 * The game's own monster rows for Yojimbo and Daigoro in the Cavern of the Stolen Fayth (the optional FFX-2 mission "Tourist Trap"; the hidden chapter). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `battle/kernel/monster.bin` of the Steam HD build, **row 170 (Yojimbo)** and **row 174 (Daigoro)**, formation 1847 slots 1 and 2, read field by field by the RE parity session
 * (`research/re-ffx2-yojimbo-valefor.md` §3 to §5, numbers only) `[verified: the game's own table]`, pinned by `tests/unit/chapters/tourist-trap-engine.test.ts` against `tests/fixtures/parity/ffx2/tourist_trap_rows.json`.
 * Merged into `MONSTER_RECORDS` by `./records.ts`.
 *
 * What the rows say: Yojimbo: Accuracy 95; group 1 immune (255) to Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Curse (slots 0 to 8), Eject (slot 10), **Itchy (17) and Auto-Life (18)**; group 2
 * immune to Slow, Stop, the seven stat stages and Doom (slots 5 to 14); Shell, Protect, **Reflect**, Regen and Haste are NOT resisted (the wiki's Reflect immunity is not in the record); steal
 * byte 128 (50.2 percent), Power Wrist x1 common and x1 rare (item 0x9008); Pilfer Gil 2,000; no Bribe slot; Zantetsu 120. Daigoro: Accuracy 95; group 1 immune to Curse (8), Itchy (17) and Auto-Life (18) and nothing else; no steal, no gil.
 *
 * **Group 1 slots 17 and 18 are wired** (255 on both rows): slot 17 is Itchy and slot 18 Auto-Life, per the game's own `command.h`, so the engine's slot table (`adapt/slots.ts`) is right (RE session, answering this chapter's
 *   question, 2026-10-14: 369 of 370 rows carry 255 at both; the rows note's sections 3 and 5 are being corrected: their "unmapped" wording predates it). An earlier draft left both out on that wording.
 *
 * **What is deliberately NOT wired** (the RE note marks it unmapped, rule 6): **the monster-type word (+0x9a)**, read 0 (`species` is 0).
 *
 * **The special word is the game's own, 0x3c3** (RE review 2026-10-14, m170 / m174: "special word 0x3c3 for Yojimbo", Daigoro's 0): bits 0 (no percentage-HP formulas), 1 (a hit reaction does not slow its
 *   gauge), 6 (no ATB damage), 7 and 8 (unmapped, read by nothing here) and 9 ("immune to magic cancel" by the ATB note). **This engine reads bit 9 (0x200) as Bribe immunity** (`adapt/words.ts`, the W3 lane's reading,
 *   which the hit-status note disputes and the RE note leaves open); the row has no Bribe slot, so there is nothing a Bribe could give either way. An earlier draft of this file wired 0x43 (bits 0, 1 and 6) to keep
 *   Bribe unassumed; the review asked for the game's word.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/tourist-trap-engine.test.ts`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** Row 170 (`monster.bin`, table 1): Yojimbo. */
const YOJIMBO_ROW: FFX2MonsterRecord = {
  row: 170,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 },
  resist2: { 5: 255, 6: 255, 7: 255, 8: 255, 9: 255, 10: 255, 11: 255, 12: 255, 13: 255, 14: 255 },
  special: 0x3c3, // the row's word as it is (see the header)
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
  resist1: { 8: 255, 17: 255, 18: 255 },
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
