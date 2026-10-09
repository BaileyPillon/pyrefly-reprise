/**
 * The game's own command records for every FFX ability this project ships (re-parity W1; **FFX only**).
 *
 * One table per source family (`items.ts`, `player.ts`, `enemies.ts`), merged here and attached to the
 * ability catalog by `src/data/ffx/index.ts` (`attachCommandRecords`). The record carries the five fields the
 * parity kernels read and an `AbilityDef`'s other fields do not: the command type, the two flag words and the
 * damage classes (`FFXCommandRecord`). Source and method: `research/re-ffx-commands.md`.
 *
 * An ability with no game record (one of ours) is listed in {@link NO_COMMAND_RECORD} with the reason; the FFX
 * engine derives the same fields for it from its own flags (`src/battle/ffx/adapt/command.ts`), which is what it
 * always did.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';
import { COMMAND_RECORDS_ITEMS } from './items.ts';
import { COMMAND_RECORDS_PLAYER } from './player.ts';

/** Every ability id with a game record, mapped to that record. */
export const COMMAND_RECORDS: Readonly<Record<string, FFXCommandRecord>> = {
  ...COMMAND_RECORDS_ITEMS,
  ...COMMAND_RECORDS_PLAYER,
  ...COMMAND_RECORDS_ENEMIES,
};

/** The abilities that have no game record, and why. They are our own: nothing in the game's tables is theirs. */
export const NO_COMMAND_RECORD: Readonly<Record<string, string>> = {
  'close-in': 'an Evrae chapter Trigger Command (ours)',
  'mac-seymour-idle': 'a scripted idle line of the Macalania Seymour (ours)',
  'omnis-volley': "the engine's volley wrapper for Seymour Omnis's four disc spells (ours); the four spells have their own records",
};

/** An ability whose own `rank` the game's record replaced (re-parity W2): the engine charges the recovery of the record's rank. */
export interface RankChange {
  abilityId: string;
  /** The rank our data carried (a raw 0 counts as 3, the game's own rule). */
  ours: number;
  /** The game's rank byte (a raw 0 counts as 3). */
  game: number;
}

/** Every ability whose rank the attach step changed. `tests/unit/data-ffx-command-records.test.ts` pins this list. */
export const RANK_CHANGES: RankChange[] = [];

/**
 * Attach each ability's game record, in place. The catalog's objects are shared (an item's effect is the same
 * object as its catalog entry), so this runs once, where the catalog is assembled.
 *
 * The record's CTB rank (byte 0x24; 0 means 3) becomes the ability's `rank`: it is the number the exe charges the
 * recovery of, and it keeps one source for the engine and the interface. An ability of ours with no record keeps its own.
 */
export function attachCommandRecords(abilities: readonly AbilityDef[]): void {
  for (const ability of abilities) {
    const record = COMMAND_RECORDS[ability.id];
    if (record === undefined) continue;
    ability.record = record;
    if (record.rank === undefined) continue;
    const game = record.rank === 0 ? 3 : record.rank;
    const ours = (ability.rank ?? 0) <= 0 ? 3 : (ability.rank as number);
    if (ours !== game) RANK_CHANGES.push({ abilityId: ability.id, ours, game });
    ability.rank = game;
  }
}
