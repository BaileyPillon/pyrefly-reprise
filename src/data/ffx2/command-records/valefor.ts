/**
 * The game's own command rows for Valefor's three special moves (FFX-2 Chapter 3, Besaid Temple; the hidden chapter "Valefor at Besaid"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` of the Steam HD build 25501027, rows 0x4091 (Energy Ray), 0x4092 (Sonic Wings) and 0x4093 (Energy Blast), read byte by byte by the RE session
 * (`research/re-ffx2-ai-valefor.md` §3 the rows and §3.1 the cadence, the appendix "the three move rows as numbers"; "RE review 2026-10-14, m164, row 164, pos_bsyt05_229"), numbers only, no game text and no
 * game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`. Her plain Attack is the game's row 0x41da, which the monster record carries (`../monster-records/records-valefor.ts`).
 *
 * - **0x4091, Energy Ray**: formula 2 (magic, the Magic Defense term), power 20; **magical** (damage flags 0x2: Shell halves it); the whole party (target flags 0x17, no "can target all" bit, so no multi-target halving);
 *   **never rolls to hit** (accuracy formula 0); no status, no Delay, no random spread, not reflectable; charge 120 (3.37 s at her Agility 125), recovery 100 (2.80 s).
 * - **0x4092, Sonic Wings**: formula 0 (the physical formula, the Defense term), power 2, **MP damage only** (class 2), physical (damage flags 0x1: Protect halves it), one target (0x13), **never rolls to hit**
 *   (accuracy formula 0, no Darkness bit), no critical; charge 100 (2.80 s), recovery 80 (2.24 s).
 * - **0x4093, Energy Blast**: formula 2, power 25, the whole party (0x17); **damage flags 0x0: neither physical nor magical, so neither Shell nor Protect reduces it**; never rolls; charge 120 (3.37 s), recovery 100 (2.80 s).
 *   The three rows share the misc word 0x41200006 (the same word as Ixion's Aerospark and Thor's Hammer).
 *
 * No "160 degree arc" is in either multi-target row or in her script (the review's §4.4): Energy Ray and Energy Blast have identical target and misc flags. If the game has the arc it is in effect or animation data,
 * which was not read; the chapter aims both at every living girl (every girl is in front of her in the start formation).
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/besaid-valefor-data.test.ts` against the rows in `tests/fixtures/parity/ffx2/besaid_valefor_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

export const COMMAND_RECORDS_VALEFOR: Readonly<Record<string, FFX2CommandRecord>> = {
  'x2-valefor-energy-ray': { id: 0x4091, costAtb: 100, costCast: 120, category: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x2, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 20, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-valefor-sonic-wings': { id: 0x4092, costAtb: 80, costCast: 100, category: 0, flagsTarget: 0x13, flagsMisc: 0x41200006, flagsDamage: 0x1, damageClass: 2, formula: 0, critByte: 0, accuracy: 0, power: 2, hits: 1, shatter: 0, element: 0, killer: 0 },
  'x2-valefor-energy-blast': { id: 0x4093, costAtb: 100, costCast: 120, category: 0, flagsTarget: 0x17, flagsMisc: 0x41200006, flagsDamage: 0x0, damageClass: 1, formula: 2, critByte: 0, accuracy: 0, power: 25, hits: 1, shatter: 0, element: 0, killer: 0 },
};
