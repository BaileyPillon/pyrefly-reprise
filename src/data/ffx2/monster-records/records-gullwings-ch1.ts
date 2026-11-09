/**
 * The game's own monster rows for Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero (FFX-2 Chapter 1's hotspot missions; the hidden chapter "Gullwings, Chapter 1"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monster.bin` **rows 132, 122, 162 and 47** of the Steam HD build (ids 0x1084, 0x107a, 0x10a2 and 0x102f), read field by field by the research lane (`research/re-ffx2-gullwings-chapter1.md` §0) and again by the
 * reader that wrote `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`, numbers only. Merged into `MONSTER_RECORDS` by `./records.ts`.
 *
 * What the rows say: Accuracy 95 on all four; **Boris** has the special word 0x18 (the percent formulas touch him and he can be delayed), walls on Death, Sleep, Poison, Confusion, Berserk, Curse, Itchy, Auto-Life, Stop and Doom,
 * Eject 100, and Petrify, Silence and Darkness land; the **Flame Dragon** (0x25b) walls Death, Petrify, Sleep, Silence, Confusion, Curse, Itchy, Auto-Life and Stop, Darkness 50, Eject 40, Poison and Berserk land; the **Guardian Beast**
 * (0x2db) walls Death, Petrify, Sleep, Silence, Poison, Confusion, Curse, Itchy, Auto-Life, Stop and Doom, Darkness 50, Berserk 60, Eject 200; **YSLS-Zero** (0x31b, species word 0x2) walls Death, Petrify, Sleep, Silence, Poison,
 * Confusion, Berserk, Curse, Itchy, Auto-Life, Stop and Doom, Eject 32, and Darkness lands. Steal chance bytes 255, 255, 128 and 128; Pilfer Gil 700, 800, 1,500 and 1,400; the steals Remedy (x1 or x2), Hi-Potion (x1 or x2),
 * Defense Veil and Mythril Gloves; the bribes Antidote x30 / Pretty Orb x1, Fire Gem x30 / x40, Oath Veil x1 and none (YSLS-Zero's special word has the no-Bribe bit); Zantetsu bytes 45, 15, 80 and 10.
 *
 * The command rows of their moves are in `../command-records/gullwings-ch1.ts`, laid on the abilities by id (`FFX2_COMMAND_RECORDS`); their AI scripts (`m132`, `m122`, `m162`, `m047`) are read:
 * `../../../battle/ffx2/ai/gullwings-ch1.ts`. The plain Attack is the game's row 0x41da (the one every monster's `Attack` is, `./records.ts`); Boris's waza list has none, so his record carries none.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/gullwings-ch1-data.test.ts`].
 */

import type { FFX2CommandRecord, FFX2MonsterRecord } from '../../../battle/common/types.ts';

/** The plain Attack every monster with 0x41da in its waza list carries. */
const PLAIN_ATTACK: FFX2CommandRecord = { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 };

/** `monster.bin` row 132, table 1: Boris. */
const BORIS_ROW: FFX2MonsterRecord = {
  row: 132,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 2: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 100, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x18,
  species: 0x0,
  zantetsu: 45,
  stealByte: 255,
  stealGil: 700,
  steal: [0x200f, 0x1, 0x200f, 0x2],
  bribe: [0x200a, 0x1e, 0x904f, 0x1],
};

/** `monster.bin` row 122, table 1: the Flame Dragon. */
const FLAME_DRAGON_ROW: FFX2MonsterRecord = {
  row: 122,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 50, 6: 255, 8: 255, 10: 40, 17: 255, 18: 255 },
  resist2: { 6: 255 },
  special: 0x25b,
  species: 0x0,
  zantetsu: 15,
  stealByte: 255,
  stealGil: 800,
  steal: [0x2001, 0x1, 0x2001, 0x2],
  bribe: [0x201b, 0x1e, 0x201b, 0x28],
  plainAttack: { ...PLAIN_ATTACK },
};

/** `monster.bin` row 162, table 1: the Guardian Beast. */
const GUARDIAN_BEAST_ROW: FFX2MonsterRecord = {
  row: 162,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 4: 50, 5: 255, 6: 255, 7: 60, 8: 255, 10: 200, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x2db,
  species: 0x0,
  zantetsu: 80,
  stealByte: 128,
  stealGil: 1500,
  steal: [0x9014, 0x1, 0x9014, 0x1],
  bribe: [0x9016, 0x1, 0x9016, 0x1],
  plainAttack: { ...PLAIN_ATTACK },
};

/** `monster.bin` row 47, table 1: YSLS-Zero. */
const YSLS_ZERO_ROW: FFX2MonsterRecord = {
  row: 47,
  table: 1,
  acc: 95,
  resist1: { 0: 255, 1: 255, 2: 255, 3: 255, 5: 255, 6: 255, 7: 255, 8: 255, 10: 32, 17: 255, 18: 255 },
  resist2: { 6: 255, 14: 255 },
  special: 0x31b,
  species: 0x2,
  zantetsu: 10,
  stealByte: 128,
  stealGil: 1400,
  steal: [0x900c, 0x1, 0x900c, 0x1],
  bribe: [0x0, 0x0, 0x0, 0x0],
  plainAttack: { ...PLAIN_ATTACK },
};

/** Keyed `group id / enemy id`, as `attachMonsterRecords` reads them. */
export const MONSTER_RECORDS_GULLWINGS_CH1: Readonly<Record<string, FFX2MonsterRecord>> = {
  'ffx2-gagazet-floating-ruins-boris/x2-boris': BORIS_ROW,
  'ffx2-besaid-cave-flame-dragon/x2-flame-dragon': FLAME_DRAGON_ROW,
  'ffx2-zanarkand-ruins-guardian-beast/x2-guardian-beast': GUARDIAN_BEAST_ROW,
  'ffx2-kilika-approach-ysls-zero/x2-ysls-zero': YSLS_ZERO_ROW,
};
