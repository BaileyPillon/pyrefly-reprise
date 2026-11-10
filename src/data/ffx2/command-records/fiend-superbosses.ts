/**
 * The game's own command rows for the thirteen moves THIS chapter adds in the hidden chapter "The Fiend Arena Superbosses" (Almighty Shinra, then the Major Numerus: `monster.bin` rows 329 to 336). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/command.bin` (ids 0x3000 and up) of the Steam HD Remaster (the FFX-2 half), decoded by a script from the kernel tables
 * (`research/re-ffx2-fiend-arena-superbosses.md` §3 and §4: the moves each script queues), numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`. Every row is keyed by the
 * ability's own id (`../enemies/fiend-superbosses-abilities.ts`). The 22 other moves the scripts queue are rows other chapters already ship under their ids (`FS_ABILITY` in `../../fiend-superbosses-ids.ts`), so they have no
 * record here. `tests/unit/chapters/fiend-superbosses-data.test.ts` pins each row to `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json` field by field, and the 22 reused rows to the same fixture.
 *
 * - **Accuracy formula** (`flagsMisc` bits 3 to 5): 2 (the race with the monster's ACC) for Fireworks and Sparkler; 0 (always hits) for the rest.
 * - **The four Commands** (Radis 0x421a, Venam 0x421b, Fulmen 0x421c, Mortis 0x421d): a 220 charge, **flagsDamage 0x80 only: the 99,999 limit bit and neither the physical nor the magical bit**; Fulmen is formula 0 power 255 with
 *   element 4 (Thunder), the other three formula 1 (Defense ignored).
 * - **Multi-hit**: Clione is ten hits of power 24 with the random-target bit (`flagsMisc` 0x4000), spread over the girls.
 *
 * Confidence: [verified: the game's own tables, decoded by a script and pinned by `tests/unit/chapters/fiend-superbosses-data.test.ts`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_FIEND_SUPERBOSSES: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-fs-clione': { id: 0x4210, costAtb: 0, costCast: 180, category: 0, flagsTarget: 0x17, flagsMisc: 0x60204006, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 0, power: 24, hits: 10, shatter: 80, element: 0, killer: 0 }, // Clione
  'x2-fs-fireworks': { id: 0x3076, costAtb: 0, costCast: 90, category: 8, flagsTarget: 0x437, flagsMisc: 0x60210056, flagsDamage: 0x5, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 24, hits: 1, shatter: 100, element: 0, killer: 0 }, // Fireworks
  'x2-fs-haste': { id: 0x3176, costAtb: 0, costCast: 70, category: 2, flagsTarget: 0x431, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 4: 254 }, statusTime: { 4: 50 } }, // Haste
  'x2-fs-radis-command': { id: 0x421a, costAtb: 0, costCast: 220, category: 0, flagsTarget: 0x13, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 58, hits: 1, shatter: 100, element: 0, killer: 0 }, // Radis Command
  'x2-fs-sparkler': { id: 0x3075, costAtb: 0, costCast: 80, category: 8, flagsTarget: 0x433, flagsMisc: 0x60210056, flagsDamage: 0x5, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 24, hits: 1, shatter: 100, element: 0, killer: 0 }, // Sparkler
  'x2-fs-dispel': { id: 0x30b8, costAtb: 0, costCast: 60, category: 2, flagsTarget: 0x433, flagsMisc: 0x20208006, flagsDamage: 0x22, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 13: 254, 14: 254, 15: 254, 18: 254 }, status2: { 0: 254, 1: 254, 2: 254, 3: 254, 4: 254 }, statusTime: { 0: 127, 1: 127, 2: 127, 3: 127, 4: 127 } }, // Dispel
  'x2-fs-shell': { id: 0x30bb, costAtb: 0, costCast: 60, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254 }, statusTime: { 0: 110 } }, // Shell
  'x2-fs-protect': { id: 0x30bc, costAtb: 0, costCast: 60, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 1: 254 }, statusTime: { 1: 110 } }, // Protect
  'x2-fs-confuse': { id: 0x3083, costAtb: 0, costCast: 80, category: 9, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 6: 100 } }, // Confuse
  'x2-fs-silence': { id: 0x4071, costAtb: 60, costCast: 60, category: 0, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 3: 75 } }, // Silence
  'x2-fs-venam-command': { id: 0x421b, costAtb: 0, costCast: 220, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 30, hits: 1, shatter: 100, element: 0, killer: 0, status1: { 5: 254 } }, // Venam Command
  'x2-fs-fulmen-command': { id: 0x421c, costAtb: 0, costCast: 220, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 255, hits: 1, shatter: 100, element: 4, killer: 0 }, // Fulmen Command
  'x2-fs-mortis-command': { id: 0x421d, costAtb: 0, costCast: 220, category: 0, flagsTarget: 0x17, flagsMisc: 0x40000006, flagsDamage: 0x80, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 36, hits: 1, shatter: 100, element: 0, killer: 0 }, // Mortis Command
};
