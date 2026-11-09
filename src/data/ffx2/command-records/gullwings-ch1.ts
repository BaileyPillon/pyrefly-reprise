/**
 * The game's own command rows for the moves of Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero (FFX-2 Chapter 1's hotspot missions; the hidden chapter "Gullwings, Chapter 1"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` of the Steam HD build 25501027, rows 0x4000, 0x4046, 0x40c7, 0x40c8, 0x40ca, 0x40d8, 0x40da, 0x41da, 0x4056, 0x4057 and 0x4232 to 0x4236, read by the research lane
 * (`research/re-ffx2-gullwings-chapter1.md` §4) and again, independently of the note's prose, by the reader that wrote `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`; numbers only, no game text and no game code.
 * Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`. Two rows are shared by name with another chapter's boss (Boris's Spider Bite 0x40ca is the Aranea's; the plain Attack 0x41da is every monster's) and carry the same numbers.
 * The four announcement rows (0x4232 to 0x4235: damage formula 0, power 0, no hits) have no record on purpose: they are scripted flavour turns on himself and the engine derives them from the ability
 * (`./index.ts` `NO_COMMAND_RECORD`).
 *
 * - **0x40c7, Spider Attack**: formula 0, power 16, **two hits**, accuracy formula 1 on the byte 95, crit 10; ATB 100.
 * - **0x40c8, Sticky End**: formula 8 (fixed, with variance), power 1, the whole party, damage flags 0; **Stop at 40 with a counter of 20**; cast 10.
 * - **0x40ca, Spider Bite**: formula 1 (no Defense term), power 32, one target, damage flags 0; cast 180.
 * - **0x41da, Attack**: formula 0, power 16, accuracy formula 2 (the race with the monster's ACC), crit 5, shatter 10; ATB 100.
 * - **0x40d8, Flame Breath**: formula 9, power 32, Fire, the whole party, magical (flags 0x2: Shell halves it); cast 140.
 * - **0x40da, Damocles Photon**: formula 7, power 8 = 8/16 of the target's maximum HP, the whole party, magical; cast 180.
 * - **0x4046, Curse**: Curse at 254, one target; cast 120.
 * - **0x4000, Attack** (YSLS-Zero's other Attack): the party-command row; formula 0, power 16, crit 5.
 * - **0x4056, Blast Punch**: formula 7, power 8 = half of one girl's maximum HP, damage flags 0, the delay bits set; cast 140.
 * - **0x4057, Haymaker**: formula 0, power 15, **two hits**, accuracy formula 0 (always hits), shatter 35; ATB 100.
 * - **0x4236, Time Up Meteor**: formula 5 (fixed, power x 50), power 200, 12 hits, everyone.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/gullwings-ch1-data.test.ts`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_GULLWINGS_CH1: Readonly<Record<string, FFX2CommandRecord>> = {
  // ---- Boris --------------------------------------------------------------------------------------------------------------------
  'x2-boris-spider-attack': { id: 0x40c7, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x6001004a, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 95, power: 16, hits: 2, shatter: 0, element: 0, killer: 0 },
  'x2-boris-sticky-end': {
    id: 0x40c8, costAtb: 0, costCast: 10, category: 0, flagsTarget: 0x17, flagsMisc: 0x60000006, flagsDamage: 0x0, damageClass: 1, formula: 8, critByte: 0, accuracy: 0, power: 1, hits: 1, shatter: 0, element: 0, killer: 0,
    status2: { 6: 40 },
    statusTime: { 6: 20 },
  },
  'x2-boris-spider-bite': { id: 0x40ca, costAtb: 0, costCast: 180, category: 0, flagsTarget: 0x13, flagsMisc: 0x61000006, flagsDamage: 0x0, damageClass: 1, formula: 1, critByte: 0, accuracy: 0, power: 32, hits: 1, shatter: 0, element: 0, killer: 0 },

  // ---- Flame Dragon -------------------------------------------------------------------------------------------------------------
  'x2-flame-dragon-flame-breath': { id: 0x40d8, costAtb: 0, costCast: 140, category: 0, flagsTarget: 0x17, flagsMisc: 0x60000006, flagsDamage: 0x2, damageClass: 1, formula: 9, critByte: 0, accuracy: 0, power: 32, hits: 1, shatter: 0, element: 1, killer: 0 },

  // ---- Guardian Beast -----------------------------------------------------------------------------------------------------------
  'x2-guardian-beast-damocles-photon': { id: 0x40da, costAtb: 0, costCast: 180, category: 0, flagsTarget: 0x17, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 8, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-guardian-beast-curse': {
    id: 0x4046, costAtb: 0, costCast: 120, category: 0, flagsTarget: 0x33, flagsMisc: 0x20008006, flagsDamage: 0x0, damageClass: 0, formula: 2, critByte: 0, accuracy: 0, power: 0, hits: 1, shatter: 0, element: 0, killer: 0,
    status1: { 8: 254 },
  },

  // ---- YSLS-Zero ----------------------------------------------------------------------------------------------------------------
  'x2-ysls-zero-attack': { id: 0x4000, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x20010052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 },
  'x2-ysls-zero-attack-no-cancel': { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, killer: 0 },
  'x2-ysls-zero-blast-punch': { id: 0x4056, costAtb: 0, costCast: 140, category: 0, flagsTarget: 0x13, flagsMisc: 0x61012006, flagsDamage: 0x0, damageClass: 1, formula: 7, critByte: 0, accuracy: 0, power: 8, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-ysls-zero-haymaker': { id: 0x4057, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x13, flagsMisc: 0x60010006, flagsDamage: 0x1, damageClass: 1, formula: 0, critByte: 0, accuracy: 0, power: 15, hits: 2, shatter: 35, element: 0, killer: 0 },

  // ---- The "battle too long" block, shared --------------------------------------------------------------------------------------
  'x2-gullwings-time-up-meteor': { id: 0x4236, costAtb: 0, costCast: 0, category: 0, flagsTarget: 0x17, flagsMisc: 0x41204006, flagsDamage: 0x0, damageClass: 1, formula: 5, critByte: 0, accuracy: 0, power: 200, hits: 12, shatter: 0, element: 0, killer: 0 },
};
