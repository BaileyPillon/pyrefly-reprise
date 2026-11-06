/**
 * The game's own command rows for the moves of the possessed Rikku and the possessed Paine (the two duels of the hidden chapter "Yuna's Ballad"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/item.bin` (ids 0x2000 and up) of the Steam HD build 25501027, read byte by byte by the RE session (`research/re-ffx2-yunas-ballad.md` §4.3 and §7,
 * 2026-11-06), numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * - **Spider Attack 0x40c7** (Rikku): formula 0, two hits of power 16, accuracy formula 1 (the race with the row's own byte 95), crit byte 10, no shatter, 100 recovery, no charge.
 * - **Bomb Core 0x201a, Arctic Wind 0x201d, Lightning Marble 0x2020, Dragon Scale 0x2023** (the script's strong throws): formula 8, power 6, one girl, damage flags 0x40 (no type bit), shatter 50, elements 1, 2, 4, 8
 *   (Fire, Ice, Thunder, Water), 40 charge and 40 recovery.
 * - **Grenade 0x2011**: the item row the party's own Grenade is (`./items.ts`, `x2-item-grenade`): formula 8, power 4, the whole party, damage flags 0x41 (physical), shatter 30; repeated here under the enemy ability's own id.
 * - **Attack 0x41da** (Paine): formula 0, one hit of power 16, the race with ACC 95, crit byte 5, shatter 10, 100 recovery: the row `tests/fixtures/parity/ffx2/command_rows.json` already holds.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/yunas-ballad-data.test.ts` against `tests/fixtures/parity/ffx2/yunas_ballad_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';

const NO_KILLER = { killer: 0 } as const;

/** An elemental throw: the item.bin shape of 0x201a, 0x201d, 0x2020 and 0x2023, differing in id and element only. */
function throwRow(id: number, element: number): FFX2CommandRecord {
  return { id, costAtb: 40, costCast: 40, category: 4, flagsTarget: 0x33, flagsMisc: 0x20000006, flagsDamage: 0x40, damageClass: 1, formula: 8, critByte: 0, accuracy: 0, power: 6, hits: 1, shatter: 50, element, ...NO_KILLER };
}

export const COMMAND_RECORDS_YUNAS_BALLAD: Readonly<Record<string, FFX2CommandRecord>> = {
  // ---- Possessed Rikku ----------------------------------------------------------------------------------------------------------
  'x2-possessed-rikku-spider-attack': { id: 0x40c7, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x6001004a, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 10, accuracy: 95, power: 16, hits: 2, shatter: 0, element: 0, ...NO_KILLER },
  'x2-possessed-rikku-bomb-core': throwRow(0x201a, 0x1),
  'x2-possessed-rikku-arctic-wind': throwRow(0x201d, 0x2),
  'x2-possessed-rikku-lightning-marble': throwRow(0x2020, 0x4),
  'x2-possessed-rikku-dragon-scale': throwRow(0x2023, 0x8),
  'x2-possessed-rikku-grenade': { id: 0x2011, costAtb: 40, costCast: 40, category: 4, flagsTarget: 0x37, flagsMisc: 0x20000006, flagsDamage: 0x41, damageClass: 1, formula: 8, critByte: 0, accuracy: 0, power: 4, hits: 1, shatter: 30, element: 0, ...NO_KILLER },

  // ---- Possessed Paine ----------------------------------------------------------------------------------------------------------
  'x2-possessed-paine-attack': { id: 0x41da, costAtb: 100, costCast: 0, category: 0, flagsTarget: 0x33, flagsMisc: 0x60000052, flagsDamage: 0xd, damageClass: 1, formula: 0, critByte: 5, accuracy: 95, power: 16, hits: 1, shatter: 10, element: 0, ...NO_KILLER },
};
