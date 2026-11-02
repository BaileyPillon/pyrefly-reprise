/**
 * The game's own command rows for the moves of Aranea, Black Elemental, Concherer and Chac in their NORMAL versions (the Via Infinito floors 20, 40, 60 and 80; the hidden chapter "The Fallen Maesters"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/command.bin` (ids 0x3000 and up) of the Steam HD build 25501027, read byte by byte by the RE session (`research/re-ffx2-fallen-maesters.md` §8 and the appendix
 * "the move rows as numbers", 2026-10-19), numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * - **Ultima 0x3171 and Flare 0x3170** are rows the repo already holds (Trema's), taken by spread from `./enemies.ts` (a change there is a deliberate decision; `tests/unit/chapters/fallen-maesters-data.test.ts` pins each to the appendix).
 *   Ultima's row lacks the reflectable bit (0x80 of the misc word) and Flare's has it.
 * - **Absorb 0x304b** (the party's command table): class 3 (HP and MP), formula 9 (a Magic cubic), power 8, absorbed by the user (misc bit 0x100), shatter 20.
 * - **Attack 0x4003** (Aranea): two hits, power 8, accuracy formula 2 (the race with ACC, byte 200), crit byte 5, shatter 10. **Attack 0x400e** (Concherer and Chac): power 32, crit byte 15, **shatter 100**.
 * - **Spider Bite 0x40ca**: formula 1, power 32, charge 180, damage flags 0. **Gooey End 0x40c9**: formula 8, power 3, the whole party; Poison 254, Stop 254 for a counter of 25, STR and MAG stages -1 (255).
 * - **Berserk 0x406a**: Berserk 75. **Magic Up 0x41dd**: the MAG stage (group-2 slot 8) +2 at 255.
 * - **Megaton Press 0x40ba**: formula 1, power 254, damage flags 0x81 (physical, cap 99,999), always hits. **Gunk 0x40b9**: the MP class, formula 7, power 16 (all of the girl's maximum MP), Poison 254. **Broken shell 0x40bb**: no effect.
 * - **Stony Glare 0x401c**: Petrify 255. **Heaven's Cataract 0x405a**: formula 2, power 58, shatter 100, damage flags 0x82 (magical, cap 99,999), the stages DEF, MDEF, ACC, and slots 12 and 13 at -10 each (255).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/fallen-maesters-data.test.ts` against the appendix numbers].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';

/** A row that is one of the existing tables' (Ultima and Flare): the same numbers, taken by name from where the repo holds them. */
function borrowed(table: Readonly<Record<string, FFX2CommandRecord>>, key: string): FFX2CommandRecord {
  const record = table[key];
  if (record === undefined) throw new Error(`fallen-maesters command records: no row ${key}`);
  return { ...record };
}

const NO_KILLER = { killer: 0 } as const;

export const COMMAND_RECORDS_FALLEN_MAESTERS: Readonly<Record<string, FFX2CommandRecord>> = {
  // ---- Aranea -------------------------------------------------------------------------------------------------------------------
  'x2-aranea-attack': { id: 0x4003, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 200, power: 8, hits: 2, shatter: 10, element: 0, ...NO_KILLER },
  'x2-aranea-spider-bite': { id: 0x40ca, costAtb: 0, costCast: 180, category: 0, flagsTarget: 0x13, flagsMisc: 0x61000006, flagsDamage: 0x0, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 32, hits: 1, shatter: 0, element: 0, ...NO_KILLER },
  'x2-aranea-gooey-end': {
    id: 0x40c9, costAtb: 0, costCast: 10, category: 0, flagsTarget: 0x17, flagsMisc: 0x60000006, flagsDamage: 0x0, damageClass: 1, formula: 8, critByte: 0, accuracy: 0, power: 3, hits: 1, shatter: 0, element: 0, ...NO_KILLER,
    status1: { 5: 254 },
    status2: { 6: 254, 7: 255, 8: 255 },
    statusTime: { 6: 25, 7: -1, 8: -1 },
  },

  // ---- Black Elemental ----------------------------------------------------------------------------------------------------------
  'x2-black-elemental-absorb': { id: 0x304b, costAtb: 0, costCast: 80, category: 0, flagsTarget: 0x33, flagsMisc: 0x40200106, flagsDamage: 0x0, damageClass: 3, formula: 9, critByte: 0, accuracy: 0, power: 8, hits: 1, shatter: 20, element: 0, ...NO_KILLER },
  'x2-black-elemental-ultima': borrowed(COMMAND_RECORDS_ENEMIES, 'trema-ultima'), // 0x3171: formula 2, power 70, not reflectable
  'x2-black-elemental-flare': borrowed(COMMAND_RECORDS_ENEMIES, 'trema-flare'), // 0x3170: formula 2, power 55, reflectable
  'x2-black-elemental-berserk': {
    id: 0x406a, costAtb: 80, costCast: 100, category: 0, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, ...NO_KILLER,
    status1: { 7: 75 },
  },
  'x2-black-elemental-magic-up': {
    id: 0x41dd, costAtb: 0, costCast: 20, category: 0, flagsTarget: 0xd, flagsMisc: 0x10200006, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 10, element: 0, ...NO_KILLER,
    status2: { 8: 255 },
    statusTime: { 8: 2 },
  },

  // ---- Concherer ----------------------------------------------------------------------------------------------------------------
  'x2-concherer-attack': { id: 0x400e, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 15, accuracy: 200, power: 32, hits: 1, shatter: 100, element: 0, ...NO_KILLER },
  'x2-concherer-megaton-press': { id: 0x40ba, costAtb: 80, costCast: 80, category: 0, flagsTarget: 0x33, flagsMisc: 0x40000006, flagsDamage: 0x81, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 254, hits: 1, shatter: 0, element: 0, ...NO_KILLER },
  'x2-concherer-gunk': {
    id: 0x40b9, costAtb: 0, costCast: 120, category: 0, flagsTarget: 0x33, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 2, formula: 7, critByte: 0, accuracy: 0, power: 16, hits: 1, shatter: 0, element: 0, ...NO_KILLER,
    status1: { 5: 254 },
  },
  'x2-concherer-broken-shell': { id: 0x40bb, costAtb: 0, costCast: 0, category: 0, flagsTarget: 0x1, flagsMisc: 0x41000002, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 0, shatter: 0, element: 0, ...NO_KILLER },

  // ---- Chac ---------------------------------------------------------------------------------------------------------------------
  'x2-chac-attack': { id: 0x400e, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 15, accuracy: 200, power: 32, hits: 1, shatter: 100, element: 0, ...NO_KILLER },
  'x2-chac-stony-glare': {
    id: 0x401c, costAtb: 0, costCast: 120, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000006, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, ...NO_KILLER,
    status1: { 1: 255 },
  },
  'x2-chac-heavens-cataract': {
    id: 0x405a, costAtb: 80, costCast: 120, category: 0, flagsTarget: 0x37, flagsMisc: 0x60000006, flagsDamage: 0x82, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 58, hits: 1, shatter: 100, element: 0, ...NO_KILLER,
    status2: { 9: 255, 10: 255, 11: 255, 12: 255, 13: 255 },
    statusTime: { 9: -10, 10: -10, 11: -10, 12: -10, 13: -10 },
  },
};
