/**
 * The game's own command rows for the moves of Angra Mainyu, Zarich and Tawrich (FFX-2 Chapter 5, the mission "Showdown in the Sands"; the hidden chapter "Angra Mainyu"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/command.bin` (ids 0x3000 and up) of the Steam HD build 25501027, read byte by byte by the RE session
 * (`research/re-ffx2-angra-mainyu.md` §10 and the appendix "the move rows as numbers", 2026-10-14), numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * - **The boss borrows six party rows** (the appendix: Full-Life 0x30ba, Demi 0x3082, Bio 0x3085, Curaga 0x30b5, Dispel 0x30b8, Flare 0x3170) and the Leblanc Syndicate's Osmose (0x406d): they are **the same rows
 *   the repo already holds** for the White Mage, the Dark Knight, Trema and Leblanc, so they are taken from those tables by spread, not copied (a change there is a deliberate decision, and
 *   `tests/unit/chapters/angra-mainyu-data.test.ts` pins each one to the appendix's numbers). The appendix does not carry the menu `category` byte; the existing rows do, and it is read from them.
 * - **Perdition's Flame 0x412d**: 10 hits, formula 7 (a fraction of the target's maximum HP), power 3, the whole party with the random-target bit (0x4000), physical (damage flags 0x1: Protect halves it, Shell does
 *   not), never rolls (accuracy formula 0); recovery 100 (5.11 s at AGI 68), charge 120 (6.14 s).
 * - **Glimmer of Despair 0x412a** (Zarich): the MP class, formula 2, power 8, the whole party; Strength, Magic, Defense and Magic Defense (group-2 slots 7 to 10) at chance 255 with steps -1, -1, -2, -2.
 * - **Firaga, Waterga, Thundaga, Blizzaga 0x41f1, 0x41f4, 0x41f3, 0x41f2** (Zarich): formula 2, power 19, one target, shatter 20, charge 70; the Fire, Water, Thunder and Ice bits (0x1, 0x8, 0x4, 0x2).
 * - **Punch 0x4129** (Tawrich): formula 0, power 12, one target, physical, **rolls to hit: accuracy formula 1 (flags misc 0x4100000a, bits 3 to 5 = 1) and accuracy byte 125**, the only row of the three that does.
 * - **Bloody Breath 0x412b** (Tawrich): formula 2, power 12, the whole party, **damage flags 0 (neither physical nor magical)**, never rolls; Silence, Darkness and Poison at 254 and Confusion at 128.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/angra-mainyu-data.test.ts` against the appendix numbers in `tests/fixtures/parity/ffx2/angra_mainyu_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';
import { COMMAND_RECORDS_PARTY } from './party.ts';

/** A row that is one of the existing tables' (the boss's borrowed party rows and Osmose): the same numbers, taken by name from where the repo holds them. */
function borrowed(table: Readonly<Record<string, FFX2CommandRecord>>, key: string): FFX2CommandRecord {
  const record = table[key];
  if (record === undefined) throw new Error(`angra-mainyu command records: no row ${key}`);
  return { ...record };
}

/** The fields every monmagic row of the three shares in the appendix. */
const NO_KILLER = { killer: 0, critByte: 0 } as const;

export const COMMAND_RECORDS_ANGRA_MAINYU: Readonly<Record<string, FFX2CommandRecord>> = {
  // ---- Angra Mainyu -------------------------------------------------------------------------------------------------------------
  'x2-angra-perditions-flame': { id: 0x412d, costAtb: 100, costCast: 120, category: 0, flagsTarget: 0x17, flagsMisc: 0x41004006, flagsDamage: 0x1, damageClass: 1, formula: 7, ...NO_KILLER, accuracy: 0, power: 3, hits: 10, shatter: 0, element: 0 },
  'x2-angra-osmose': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-leblanc-osmose'), // 0x406d: the MP class, formula 4, power 3, absorbed
  'x2-angra-full-life': borrowed(COMMAND_RECORDS_PARTY, 'x2-white-mage-full-life'), // 0x30ba: formula 7, power 16, clears Death
  'x2-angra-curaga': borrowed(COMMAND_RECORDS_PARTY, 'x2-white-mage-curaga'), // 0x30b5: formula 6, power 38
  'x2-angra-bio': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-bio'), // 0x3085: Poison at 100
  'x2-angra-demi': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-demi'), // 0x3082: formula 4, power 4, Gravity
  'x2-angra-dispel': borrowed(COMMAND_RECORDS_PARTY, 'x2-white-mage-dispel'), // 0x30b8: cleanses the buffs
  'x2-angra-flare': borrowed(COMMAND_RECORDS_ENEMIES, 'trema-flare'), // 0x3170: formula 2, power 55

  // ---- Zarich -------------------------------------------------------------------------------------------------------------------
  'x2-zarich-glimmer-of-despair': {
    id: 0x412a, costAtb: 80, costCast: 120, category: 0, flagsTarget: 0x17, flagsMisc: 0x41000006, flagsDamage: 0x0, damageClass: 2, formula: 2, ...NO_KILLER, accuracy: 0, power: 8, hits: 1, shatter: 0, element: 0,
    status2: { 7: 255, 8: 255, 9: 255, 10: 255 },
    statusTime: { 7: -1, 8: -1, 9: -2, 10: -2 },
  },
  'x2-zarich-firaga': { id: 0x41f1, costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 0x1 },
  'x2-zarich-waterga': { id: 0x41f4, costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 0x8 },
  'x2-zarich-thundaga': { id: 0x41f3, costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 0x4 },
  'x2-zarich-blizzaga': { id: 0x41f2, costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 0x2 },

  // ---- Tawrich ------------------------------------------------------------------------------------------------------------------
  'x2-tawrich-punch': { id: 0x4129, costAtb: 80, costCast: 20, category: 0, flagsTarget: 0x33, flagsMisc: 0x4100000a, flagsDamage: 0x1, damageClass: 1, formula: 0, ...NO_KILLER, accuracy: 125, power: 12, hits: 1, shatter: 0, element: 0 },
  'x2-tawrich-bloody-breath': {
    id: 0x412b, costAtb: 80, costCast: 120, category: 0, flagsTarget: 0x17, flagsMisc: 0x41000006, flagsDamage: 0x0, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 12, hits: 1, shatter: 0, element: 0,
    status1: { 3: 254, 4: 254, 5: 254, 6: 128 },
  },
};
