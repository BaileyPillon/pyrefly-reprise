/**
 * The game's own command rows for the moves of Garik Ronso and the Ronso Youth (FFX-2 Chapter 3, the mission "Battle Blockade"; the hidden chapter "Garik Ronso"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/command.bin` (ids 0x3000 and up) of the Steam HD build 25501027, decoded by a script from the kernel tables (`research/re-ffx2-garik-ronso.md` sections 2 and 3: the
 * moves the two scripts queue), numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`. Every row is keyed by the ability's own id (`../enemies/garik-ronso-abilities.ts`), so the party rows
 * Garik queues on himself (Shell 0x30bb, Protect 0x30bc) are the game's rows on enemy-side abilities, never the player's own ability objects. `tests/unit/chapters/garik-ronso-data.test.ts` pins each row to
 * `tests/fixtures/parity/ffx2/garik_ronso_rows.json` field by field.
 *
 * Confidence: every row is [single source], the game's own kernel table decoded by script (`research/re-ffx2-garik-ronso.md` §2 and §3), numbers only.
 *
 * - **Accuracy formula** (`flagsMisc` bits 3 to 5): 2 (the race with the monster's ACC) for the two plain Attacks; 1 (the race with the row's own byte) for Bane Lance (110) and MP Blowout (120); 0 (never rolls) for the rest.
 * - **Bane Lance 0x411c**: Curse at 254 (group 1 slot 8). **MP Blowout 0x411d**: the MP class, formula 7, power 16 (all of the girl's maximum MP). **Blind 0x406f**: Darkness 75 (slot 4).
 * - **Mighty Guard 0x4084**: every monster (target flags 0x35); group 2 slots 0, 1, 3, 4, 9, 10 and 12 at chance 254, the counters 126, 126, 90, 90 and the stages +2, +2 and +1.
 * - **Time Up Meteor 0x4236**: formula 5 (fixed, power x 50), power 200, 12 hits, everyone, damage flags 0. The four announcement rows (0x4232 to 0x4235: damage formula 0, power 0, no hits) have no record on purpose: they are
 *   scripted flavour turns on himself and the engine derives them from the ability (the Ifrit chapter's and Bahamut's Countdown are the precedent).
 *
 * Confidence: [verified: the game's own tables, decoded by a script and pinned by `tests/unit/chapters/garik-ronso-data.test.ts`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_GARIK_RONSO: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-garik-attack': { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 }, // Attack
  'x2-garik-bane-lance': { id: 0x411c, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x6000004e, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 110, power: 16, hits: 1, shatter: 10, element: 0, killer: 0, status1: { 8: 254 } }, // Bane Lance
  'x2-garik-blind': { id: 0x406f, costAtb: 60, costCast: 60, category: 0, flagsTarget: 0x433, flagsMisc: 0x20208086, flagsDamage: 0x0, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status1: { 4: 75 } }, // Blind
  'x2-garik-mighty-guard': { id: 0x4084, costAtb: 80, costCast: 120, category: 0, flagsTarget: 0x35, flagsMisc: 0x20000006, flagsDamage: 0x2, damageClass: 0, formula: 2, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254, 1: 254, 3: 254, 4: 254, 9: 254, 10: 254, 12: 254 }, statusTime: { 0: 126, 1: 126, 3: 90, 4: 90, 9: 2, 10: 2, 12: 1 } }, // Mighty Guard
  'x2-garik-shell': { id: 0x30bb, costAtb: 0, costCast: 60, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 0: 254 }, statusTime: { 0: 110 } }, // Shell
  'x2-garik-protect': { id: 0x30bc, costAtb: 0, costCast: 60, category: 2, flagsTarget: 0x435, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 0, formula: 0, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0, status2: { 1: 254 }, statusTime: { 1: 110 } }, // Protect
  'x2-ronso-youth-attack': { id: 0x4000, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 }, // Attack
  'x2-ronso-youth-mp-blowout': { id: 0x411d, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x6000004e, flagsDamage: 0xd, damageClass: 2, formula: 7, critByte: 255, accuracy: 120, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 }, // MP Blowout
  'x2-ronso-time-up-meteor': { id: 0x4236, costAtb: 0, costCast: 0, category: 0, flagsTarget: 0x17, flagsMisc: 0x41204006, flagsDamage: 0x0, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 200, hits: 12, shatter: 0, element: 0, killer: 0 }, // Time Up Meteor
};
