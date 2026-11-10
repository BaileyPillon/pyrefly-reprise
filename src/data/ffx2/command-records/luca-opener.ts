/**
 * The game's own command rows for the moves of the hidden chapter **The Luca Opener** (Ormi's shield throw, Logos' pistol and Potion, Leblanc's Thunder). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` of the Steam HD build 25501027, rows 0x40e4, 0x40e7, 0x40f1 and 0x41eb, read by the research lane (`research/re-ffx2-luca-opener.md` §4) and again, independently of the note's prose, by
 * the reader that wrote `tests/fixtures/parity/ffx2/luca_opener_rows.json`; numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`. The two plain Attacks (0x41da and 0x4000) are the
 * monster records' `plainAttack` (`../monster-records/records-luca-opener.ts`), the way every monster's Attack is.
 *
 * - **0x40e4, Pirouette Pitch** (Ormi): formula 0 (physical), power 26, one target (0x13); never rolls to hit (accuracy formula 0); crit 40, shatter 100; cast 180, no ATB cost of its own.
 * - **0x40e7, 1H Pistol** (Logos): formula 0, power 8, **two hits**, one target; accuracy formula 1 on byte 140; crit 20; ATB 40, no charge, so he fires fast.
 * - **0x40f1, Potion, the weak one** (Logos): damage formula 15 (the power itself: a fixed 20), the heal bit (flags 0x10), one friend (0x31); never rolls; ATB 100.
 * - **0x41eb, Thunder** (Leblanc): formula 2 (magic), power 7, Thunder, MP 4, cast 70, reflectable and silenceable bits in the misc word.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/luca-opener-data.test.ts`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_LUCA_OPENER: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-luca-ormi-pirouette-pitch': { id: 0x40e4, costAtb: 0, costCast: 180, category: 0, flagsTarget: 0x13, flagsMisc: 0x40000006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 40, accuracy: 0, power: 26, hits: 1, shatter: 100, element: 0, killer: 0 },
  'x2-luca-logos-pistol': { id: 0x40e7, costAtb: 40, costCast: 0, category: 0, flagsTarget: 0x13, flagsMisc: 0x6000044a, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 20, accuracy: 140, power: 8, hits: 2, shatter: 0, element: 0, killer: 0 },
  'x2-luca-logos-potion': { id: 0x40f1, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x31, flagsMisc: 0x40000006, flagsDamage: 0x10, damageClass: 1, formula: 15, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-luca-leblanc-thunder': { id: 0x41eb, costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 7, hits: 1, shatter: 20, element: 4, killer: 0 },
};
