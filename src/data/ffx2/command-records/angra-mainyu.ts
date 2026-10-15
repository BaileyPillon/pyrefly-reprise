/**
 * The command rows Angra Mainyu, Tawrich and Zarich run on (FFX-2 Chapter 5, the Bikanel excavation camp; the hidden chapter "Angra Mainyu"). Re-parity W3's shape; **FFX-2 only**.
 *
 * **Stand-in rows, not theirs** (`research/ffx2-angra-mainyu.md` §3, §0.2: no row of these three monsters was read). Each record below is **another monster's row of the game's own table**, already in
 * this repository and pinned against the Steam HD build's fixture (`tests/fixtures/parity/ffx2/command_rows.json`, `tests/unit/data-ffx2-command-records.test.ts`), copied from that monster's entry so the
 * two can never drift: the charge, the recovery and every flag the engine reads are that row's. Which row stands in for which move, and why, is research §3; every one is `[estimate]` as a choice and
 * `[verified: the game's own table]` as numbers.
 *
 * | Ours | Row | Whose row it is |
 * |---|---|---|
 * | Demi | 0x3082 | Trema's, Paragon's, Cindy's and the Left Redoubt's |
 * | Flare | 0x41fa | the Nodes' and the Right Redoubt's |
 * | Curaga | 0x30b5 | the party's White Magic |
 * | Full-Life | 0x4069 | the Vegnagun Core's and the Redoubts' |
 * | Osmose | 0x406d | Leblanc's |
 * | Fira, Blizzara, Thundara, Watera | 0x41ed to 0x41f0 | Leblanc's and the goons' |
 * | Firaga, Blizzaga, Thundaga, Waterga | 0x41f1 to 0x41f4 | Mindy's and the Nodes' |
 *
 * Perdition's Flame, Punch, Bloody Breath and Glimmer of Despair have **no row** here: no row of the game's table is theirs or close enough to borrow, so the engine derives each from the ability's own
 * fields (`battle/ffx2/adapt/command.ts#deriveRecord`), which `../enemies/angra-mainyu-abilities.ts` sets from the research (§3).
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';
import { ANGRA_ABILITY, ZARICH_ABILITY } from '../../angra-mainyu-ids.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';
import { COMMAND_RECORDS_PARTY } from './party.ts';

/** A copy of the row another ability already carries (the table is the source; a missing key is a build error, not a silent derive). */
function standIn(fromId: string): FFX2CommandRecord {
  const row = COMMAND_RECORDS_ENEMIES[fromId] ?? COMMAND_RECORDS_PARTY[fromId];
  if (!row) throw new Error(`angra-mainyu: no stand-in row ${fromId}`);
  return structuredClone(row);
}

const ARA_FROM = ['x2-leblanc-fira', 'x2-leblanc-blizzara', 'x2-leblanc-thundara', 'x2-leblanc-watera'] as const;
const AGA_FROM = ['x2-mindy-firaga', 'x2-mindy-blizzaga', 'x2-mindy-thundaga', 'x2-mindy-waterga'] as const;

export const COMMAND_RECORDS_ANGRA_MAINYU: Readonly<Record<string, FFX2CommandRecord>> = {
  [ANGRA_ABILITY.demi]: standIn('trema-demi'),
  [ANGRA_ABILITY.flare]: standIn('x2-node-flare'),
  [ANGRA_ABILITY.curaga]: standIn('x2-white-mage-curaga'),
  [ANGRA_ABILITY.fullLife]: standIn('x2-vegnagun-core-full-life'),
  [ANGRA_ABILITY.osmose]: standIn('x2-leblanc-osmose'),
  ...Object.fromEntries(ZARICH_ABILITY.ara.map((id, i) => [id, standIn(ARA_FROM[i]!)])),
  ...Object.fromEntries(ZARICH_ABILITY.aga.map((id, i) => [id, standIn(AGA_FROM[i]!)])),
};

/** Which stand-in each of ours copies (the data test reads it). */
export const ANGRA_STAND_IN_FROM: Readonly<Record<string, string>> = {
  [ANGRA_ABILITY.demi]: 'trema-demi',
  [ANGRA_ABILITY.flare]: 'x2-node-flare',
  [ANGRA_ABILITY.curaga]: 'x2-white-mage-curaga',
  [ANGRA_ABILITY.fullLife]: 'x2-vegnagun-core-full-life',
  [ANGRA_ABILITY.osmose]: 'x2-leblanc-osmose',
  ...Object.fromEntries(ZARICH_ABILITY.ara.map((id, i) => [id, ARA_FROM[i]!])),
  ...Object.fromEntries(ZARICH_ABILITY.aga.map((id, i) => [id, AGA_FROM[i]!])),
};
