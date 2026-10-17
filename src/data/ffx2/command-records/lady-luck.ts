/**
 * The game's command rows of Lady Luck's Two Dice (re-parity RC10; **FFX-2 only**; FFX2-H04 sections 3.9 and 4.3): the base row 0x30EB and the two rows the die
 * result swaps it for, 0x317D when the dice agree on 2 to 6 and 0x317E when both show a one. All three are "power x level" (formula 0x12), special damage
 * (neither physical nor magical, so no Protect, Shell or critical), accuracy formula 0 (never rolls), one hit per target before the dice's sum replaces it, single
 * target, cast cost 100. Only the base row costs MP (4); the swap rows cost none in the game because the base row has paid.
 *
 * Source: the Steam HD build's `command.bin` (build 25501027), read field by field from the three language copies, which agree on these rows; numbers only, no
 * game text and no game code. `tests/unit/parity-ffx2-minigames.test.ts` pins each record against `tests/fixtures/parity/ffx2/lady_luck_rows.json`.
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_LADY_LUCK: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-lady-luck-two-dice': { id: 0x30eb, costAtb: 0, costCast: 100, category: 11, flagsTarget: 0x433, flagsMisc: 0x60200006, flagsDamage: 0x0, damageClass: 1, formula: 18, critByte: 0, accuracy: 0, power: 2, hits: 1, shatter: 0, element: 0, killer: 0 }, // Two Dice
  'x2-lady-luck-two-dice-pair': { id: 0x317d, costAtb: 0, costCast: 100, category: 0, flagsTarget: 0x433, flagsMisc: 0x60000006, flagsDamage: 0x0, damageClass: 1, formula: 18, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 0, element: 0, killer: 0 }, // Two Dice, both dice 2 to 6 alike
  'x2-lady-luck-two-dice-ones': { id: 0x317e, costAtb: 0, costCast: 100, category: 0, flagsTarget: 0x433, flagsMisc: 0x60000006, flagsDamage: 0x0, damageClass: 1, formula: 18, critByte: 0, accuracy: 0, power: 40, hits: 1, shatter: 0, element: 0, killer: 0 }, // Two Dice, both dice a one
};
