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

/** Every player character the roster knows, in the order the party list takes them: whoever of these is on the field is the party. */
export const FAYTH_PLAYERS: readonly string[] = ['tidus', 'wakka', 'rikku', 'auron', 'kimahri', 'lulu'];

/** Evrae's combatant id: the one monster the camera frames. */
export const FAYTH_BOSS = 'evrae';

/**
 * The roster with each player character's side set by who is on the field: those standing on the deck are the party, **in the order of their slots** (the programs' `Character#1..#3`, `FrontlineChars`), the
 * rest the reserve in the table's order. The FFX engine's party is whoever is in the fight, and a switch (Lulu for Wakka) changes it, her place being the one he stood in; the table above is the starting line-up.
 */
export function rosterFor(onField: readonly string[]): readonly RosterEntry[] {
  const entry = (id: string): RosterEntry => FAYTH_ROSTER.find((e) => e.id === id)!;
  const party = onField.filter((id) => FAYTH_PLAYERS.includes(id)).map((id) => ({ ...entry(id), side: 'party' as const }));
  const reserve = FAYTH_PLAYERS.filter((id) => !onField.includes(id)).map((id) => ({ ...entry(id), side: 'reserve' as const }));
  return [...party, ...reserve, ...FAYTH_ROSTER.filter((e) => !FAYTH_PLAYERS.includes(e.id))];
}
