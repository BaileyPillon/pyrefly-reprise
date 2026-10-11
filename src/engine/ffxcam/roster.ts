/**
 * **The hidden Fayth chapter's roster**: who is who to FFX's camera programs. The programs name characters by FFX's own numbers (a selector: `0..6` the party, `0x1000 + n` a monster, `20..` the monsters of
 * the formation), our battle by combatant ids; the director's host (`./formation.ts`) keeps this table.
 *
 * - **The party** are the engine's player numbers (`playerChar`: 0 Tidus, 1 Yuna, 2 Auron, 3 Kimahri, 4 Wakka, 5 Lulu, 6 Rikku; the RE session's exact RAM reads agree). Chapter VIII has no Yuna. Tidus, Wakka
 *   and Rikku are the three on the field (`activeSlots` in `data/ffx/builds/fahrenheit.ts`); Lulu, Auron and Kimahri are the reserve (`'reserve'`: the programs' `-9..-12`, `-19`).
 * - **The monsters** are the formation `hiku15_00`'s (`POSITIONS.json` of the camera lane: monster ids 0x1077, 0x1095, 0x10ff are m119 Evrae, m149 Cid and m255 the Magic Urn), standing as characters 20, 21
 *   and 22 in that order; the programs read `readBtlChrProperty(20, 30)` as Evrae's distance. Cid is on the field in the engine (a turn-taker) but never drawn (`BattleScreenAirship.ts`), so the camera has
 *   no frame for him and a selector naming him resolves to nobody; the Magic Urn does not exist in our chapter.
 *
 * Numbers only: these are character numbers, not retail data. Game case: FFX only.
 */

import type { RosterEntry } from './formation.ts';

/** Our combatant ids against FFX's character numbers, for the Evrae fight on the Fahrenheit's deck. */
export const FAYTH_ROSTER: readonly RosterEntry[] = [
  { id: 'tidus', chr: 0, side: 'party' },
  { id: 'wakka', chr: 4, side: 'party' },
  { id: 'rikku', chr: 6, side: 'party' },
  { id: 'auron', chr: 2, side: 'reserve' },
  { id: 'kimahri', chr: 3, side: 'reserve' },
  { id: 'lulu', chr: 5, side: 'reserve' },
  { id: 'evrae', chr: 20, side: 'monster', monsterNumber: 119 },
  { id: 'cid', chr: 21, side: 'monster', monsterNumber: 149 },
];

/** The ids of the party's three on the field: Tidus's, Wakka's and Rikku's actors are the ones the camera frames (and the ones whose fall is the defeat). */
export const FAYTH_ACTIVE_PARTY: readonly string[] = ['tidus', 'wakka', 'rikku'];
