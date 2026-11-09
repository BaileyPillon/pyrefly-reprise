/**
 * The game's own command rows for Ifrit's moves (FFX-2 Chapter 3, Kilika Temple; the hidden chapter "Ifrit at Kilika Temple"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` of the Steam HD build 25501027, rows 0x4094 (Hellfire), 0x4095 (Meteor Strike), 0x41f1 (Firaga) and 0x4236 (Time Up Meteor), read by the research lane (`research/re-ffx2-ifrit-kilika.md` §1) and
 * again, independently of the note's prose, by the reader that wrote `tests/fixtures/parity/ffx2/ifrit_kilika_rows.json`; numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 * His plain Attack is the game's row 0x41da, which the monster record carries (`../monster-records/records-ifrit.ts`). The four announcement rows (0x4232 to 0x4235: damage formula 0, power 0, no hits) have no record on
 * purpose: they are scripted flavour turns on himself and the engine derives them from the ability (Bahamut's Countdown is the precedent).
 *
 * - **0x4094, Hellfire**: formula 2 (magic), power 24, Fire; **magical** (damage flags 0x2: Shell halves it); the whole party (target flags 0x17); never rolls to hit; ATB 100, cast 180 (6.0 s at his Agility 114).
 * - **0x4095, Meteor Strike**: formula 2, power 25, non-elemental, magical (flags 0x2), one target (0x13); never rolls; ATB 80, cast 100.
 * - **0x41f1, Firaga**: formula 2, power 19, Fire, magical, all three (target flags 0x4b3, "can target all"); MP 24; ATB 0, cast 70; reflectable and silenceable bits in the misc word.
 * - **0x4236, Time Up Meteor**: formula 5 (fixed, power x 50), power 200, 12 hits, everyone (0x17), damage flags 0 (neither physical nor magical), ATB 0, cast 0.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/ifrit-kilika-data.test.ts`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_IFRIT: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-ifrit-hellfire': { id: 0x4094, costAtb: 100, costCast: 180, category: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 24, hits: 1, shatter: 0, element: 1, killer: 0 },
  'x2-ifrit-meteor-strike': { id: 0x4095, costAtb: 80, costCast: 100, category: 0, flagsTarget: 0x13, flagsMisc: 0x41200006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 25, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-ifrit-firaga': { id: 0x41f1, costAtb: 0, costCast: 70, category: 0, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 19, hits: 1, shatter: 20, element: 1, killer: 0 },
  'x2-ifrit-time-up-meteor': { id: 0x4236, costAtb: 0, costCast: 0, category: 0, flagsTarget: 0x17, flagsMisc: 0x41204006, flagsDamage: 0x0, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 200, hits: 12, shatter: 0, element: 0, killer: 0 },
};
