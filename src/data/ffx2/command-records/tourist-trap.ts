/**
 * The game's own command rows for the actions of the optional FFX-2 mission "Tourist Trap" (Yojimbo and Daigoro in the Cavern of the Stolen Fayth; the hidden chapter). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` rows 0x40a1 to 0x40a5 of the Steam HD build, read by the RE parity session's review of Yojimbo's and Daigoro's scripts (**RE review 2026-10-14, m170 / m174, rows 170 / 174**; the
 * note `research/re-ffx2-ai-tourist-trap.md` follows on `origin/re-ffx2-yojimbo-valefor`; the monster rows themselves are `research/re-ffx2-yojimbo-valefor.md`). Numbers only, no game text and no
 * game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * - **0x40a1, Kozuka**: one enemy (target flags 0x13), damage formula 4 (a fraction of the CURRENT value), power 4 (a quarter), damage class 2 (the MP pool), no damage-type bit (so Protect and Shell
 *   do not reduce it), Poison at status byte 100 (group 1 slot 5); rest 120, no charge.
 * - **0x40a2, Wakizashi A**: one enemy (0x13), physical, formula 0, power 16; rest 120, no charge. **0x40a3, Wakizashi B**: ALL enemies (0x17), physical, formula 0, power 13; rest 120, no charge.
 * - **0x40a4, Zanmato**: all enemies (0x17), no damage-type bit, damage formula 10 (0x0a: the target's HP minus 1), power 1, damage class 3 (HP and MP): the whole party to 1 HP and 1 MP; **charge 120, rest 200**.
 * - **0x40a5, Daigoro's bite**: one enemy (0x13), physical, formula 0, power 16; misc word 0x41000006 (the others' is 0x41200006); rest 100, no charge. Daigoro's own command.
 * - All five: one hit, **accuracy formula 0 (the misc word's bits 3 to 5: they never roll to hit)**, accuracy byte 0, element 0, no crit (crit byte 0, no crit bits in the damage word).
 *
 * **Not given by the review, so not wired** (rule 6): the shatter chance (0: none), the species-killer mask (0) and the sub-menu category (0, as every enemy row of the earlier chapters).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/tourist-trap-engine.test.ts` against `tests/fixtures/parity/ffx2/tourist_trap_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

/** The values every one of the five rows shares: no hit roll, one hit, no element, no crit, nothing the review did not give. */
const COMMON = { category: 0, accuracy: 0, hits: 1, shatter: 0, element: 0, killer: 0, critByte: 0 } as const;

export const COMMAND_RECORDS_TOURIST_TRAP: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-yojimbo-kozuka': { ...COMMON, id: 0x40a1, costAtb: 120, costCast: 0, flagsTarget: 0x13, flagsMisc: 0x41200006, flagsDamage: 0x0, damageClass: 2, formula: 4, power: 4, status1: { 5: 100 } },
  'x2-yojimbo-wakizashi-a': { ...COMMON, id: 0x40a2, costAtb: 120, costCast: 0, flagsTarget: 0x13, flagsMisc: 0x41200006, flagsDamage: 0x1, damageClass: 1, formula: 0, power: 16 },
  'x2-yojimbo-wakizashi-b': { ...COMMON, id: 0x40a3, costAtb: 120, costCast: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x1, damageClass: 1, formula: 0, power: 13 },
  'x2-yojimbo-zanmato': { ...COMMON, id: 0x40a4, costAtb: 200, costCast: 120, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x0, damageClass: 3, formula: 10, power: 1 },
  'x2-daigoro-bite': { ...COMMON, id: 0x40a5, costAtb: 100, costCast: 0, flagsTarget: 0x13, flagsMisc: 0x41000006, flagsDamage: 0x1, damageClass: 1, formula: 0, power: 16 },
};
