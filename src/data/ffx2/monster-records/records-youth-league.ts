/**
 * The game's own monster rows for the fighters of the hidden chapter "The Youth League Tournament" (Yaibal, Lucil, Elma and the five League types). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source (`research/re-ffx2-youth-league-tournament.md` §3): `kernel/monster.bin` **rows 183 (Yaibal, id 0x10b7), 184 (Lucil, 0x10b8), 279 (Elma, 0x1117), 210 (League Warrior), 211 (League Veteran), 193 (League Slasher), 214 (League Mage) and 215 (League Master)** of the
 * Steam HD build, read field by field (`research/re-ffx2-youth-league-tournament.md` section 3), numbers only, by a script (`tests/fixtures/parity/ffx2/youth_league_rows.json`). Merged into `MONSTER_RECORDS` by
 * `./records.ts`. The seven formations of the mission are `kino01_217` to `_223` (formation rows 731 to 737, RE section 4); the chapter's own groups (`../enemies/youth-league.ts`) are ours, one per act, and a row is
 * worn by every fighter of its type (two Warriors in act 1 wear row 210 twice).
 *
 * What the rows say: Accuracy 95 on all eight; the three named fighters are immune to Death, Petrify, Sleep, Silence, Berserk, Curse (group-1 slots 0 to 3, 7, 8), Eject (10), Itchy and Auto-Life (17, 18) and to Slow, Stop
 * and Doom (group 2 slots 5, 6, 14), **Yaibal alone can be blinded and poisoned (20 each) and confused (100)**; the League types carry only Curse, Itchy and Auto-Life at 255 (the Warrior adds Sleep, the Slasher Silence,
 * the Veteran and the Master Death and Petrify at 50, a chance byte, not immunity). The special words are 0x3c3 (named: percent formulas, ATB damage and Interrupt do nothing; no Zantetsu; no Bribe) and 0x80 (the
 * League: no Zantetsu only, so **none of the five is immune to delay or Interrupt**).
 *
 * **Gaps, named (rule 6: nothing invented).** The species mask (+0x9a) is not given by the note and is 0.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/youth-league-data.test.ts` against `tests/fixtures/parity/ffx2/youth_league_rows.json`].
 */

import type { FFX2MonsterRecord } from '../../../battle/common/types.ts';
import { ACT_ENEMY_IDS, ACT_TYPES, YOUTH_LEAGUE_GROUP_IDS } from '../../youth-league-ids.ts';

const ROW: Readonly<Record<string, FFX2MonsterRecord>> = {
  yaibal: { row: 183, table: 1, acc: 95, resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 20, 5: 20, 6: 100, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 }, resist2: { 5: 255, 6: 255, 14: 255 }, special: 0x3c3, species: 0x0, zantetsu: 10, stealByte: 255, stealGil: 1000, steal: [0x202f, 0x1, 0x202f, 0x2], bribe: [0x0, 0x0, 0x0, 0x0] }, // Yaibal (id 0x10b7)
  lucil: { row: 184, table: 1, acc: 95, resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 }, resist2: { 5: 255, 6: 255, 14: 255 }, special: 0x3c3, species: 0x0, zantetsu: 10, stealByte: 255, stealGil: 3000, steal: [0x202f, 0x1, 0x202f, 0x2], bribe: [0x0, 0x0, 0x0, 0x0] }, // Lucil (id 0x10b8)
  elma: { row: 279, table: 1, acc: 95, resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 255, 17: 255, 18: 255 }, resist2: { 5: 255, 6: 255, 14: 255 }, special: 0x3c3, species: 0x0, zantetsu: 12, stealByte: 255, stealGil: 6000, steal: [0x2034, 0x2, 0x2034, 0x3], bribe: [0x0, 0x0, 0x0, 0x0] }, // Elma (id 0x1117)
  warrior: { row: 210, table: 1, acc: 95, resist1: { 2: 255, 8: 255, 17: 255, 18: 255 }, resist2: {  }, special: 0x80, species: 0x0, zantetsu: 0, stealByte: 255, stealGil: 180, steal: [0x2001, 0x1, 0x2011, 0x2], bribe: [0x2013, 0x4, 0x2013, 0x5] }, // League Warrior (id 0x10d2)
  veteran: { row: 211, table: 1, acc: 95, resist1: { 0: 50, 1: 50, 8: 255, 17: 255, 18: 255 }, resist2: {  }, special: 0x80, species: 0x0, zantetsu: 0, stealByte: 64, stealGil: 300, steal: [0x2013, 0x1, 0x2012, 0x1], bribe: [0x2012, 0xe, 0x2012, 0x14] }, // League Veteran (id 0x10d3)
  slasher: { row: 193, table: 1, acc: 95, resist1: { 3: 255, 8: 255, 17: 255, 18: 255 }, resist2: {  }, special: 0x80, species: 0x0, zantetsu: 0, stealByte: 64, stealGil: 550, steal: [0x2013, 0x1, 0x2012, 0x1], bribe: [0x2004, 0x10, 0x2004, 0x14] }, // League Slasher (id 0x10c1)
  mage: { row: 214, table: 1, acc: 95, resist1: { 8: 255, 17: 255, 18: 255 }, resist2: {  }, special: 0x80, species: 0x0, zantetsu: 0, stealByte: 255, stealGil: 450, steal: [0x2004, 0x1, 0x900f, 0x1], bribe: [0x9011, 0x1, 0x9011, 0x1] }, // League Mage (id 0x10d6)
  master: { row: 215, table: 1, acc: 95, resist1: { 0: 50, 1: 50, 8: 255, 17: 255, 18: 255 }, resist2: {  }, special: 0x80, species: 0x0, zantetsu: 0, stealByte: 255, stealGil: 550, steal: [0x2006, 0x1, 0x2006, 0x2], bribe: [0x2004, 0xc, 0x2004, 0xe] }, // League Master (id 0x10d7)
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them: every fighter of every act wears its type's row (a copy each, so a record laid on one never leaks into another). */
export const MONSTER_RECORDS_YOUTH_LEAGUE: Readonly<Record<string, FFX2MonsterRecord>> = Object.fromEntries(
  ACT_ENEMY_IDS.flatMap((ids, act) => ids.map((id, slot) => [`${YOUTH_LEAGUE_GROUP_IDS[act]}/${id}`, { ...ROW[ACT_TYPES[act]![slot]!]! }] as const)),
);
