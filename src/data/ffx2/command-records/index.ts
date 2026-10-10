/**
 * The game's own command records for every FFX-2 ability the seven chapters can reach (re-parity W3; **FFX-2 only**).
 *
 * One table per source family (`items.ts`, `party.ts`, `enemies.ts`), merged here and attached to the ability catalog by
 * `src/data/ffx2/index.ts` (`attachFfx2CommandRecords`). The record carries the whole command row the FFX-2 kernels read
 * (`FFX2CommandRecord`). Source and method: `research/re-ffx2-commands.md`.
 *
 * An ability with no game row is listed in {@link NO_COMMAND_RECORD} with the reason; the FFX-2 engine derives the same
 * fields for it from its own flags (`src/battle/ffx2/adapt/command.ts`). An ability that is not in the seven chapters'
 * reach and is in neither table is also derived; `tests/unit/data-ffx2-command-records.test.ts` names those.
 */

import type { AbilityDef, FFX2CommandRecord } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';
import { COMMAND_RECORDS_EXPERIMENT } from './experiment.ts';
import { COMMAND_RECORDS_ITEMS } from './items.ts';
import { COMMAND_RECORDS_PARTY } from './party.ts';

/** Every ability id with a game row, mapped to that row. */
export const FFX2_COMMAND_RECORDS: Readonly<Record<string, FFX2CommandRecord>> = {
  ...COMMAND_RECORDS_ITEMS,
  ...COMMAND_RECORDS_PARTY,
  ...COMMAND_RECORDS_ENEMIES,
  ...COMMAND_RECORDS_EXPERIMENT, // the hidden chapter's Experiment (new-chapters RE lane, 2026-10-10)
};

/** The reachable abilities that have no game row, and why. */
export const NO_COMMAND_RECORD: Readonly<Record<string, string>> = {
  'x2-gunner-attack': 'the generic Attack is resolved per user (src/battle/ffx2/adapt/command.ts); the sphere ids are never submitted',
  'x2-warrior-attack': 'the generic Attack is resolved per user',
  'x2-dark-knight-attack': 'the generic Attack is resolved per user',
  'x2-gun-mage-attack': 'the generic Attack is resolved per user',
  'x2-alchemist-attack': 'the generic Attack is resolved per user',
  'x2-gunner-darkproof': 'a passive auto-ability, not a command',
  'x2-gunner-sleepproof': 'a passive auto-ability, not a command',
  'x2-dark-knight-poisonproof': 'a passive auto-ability, not a command',
  'x2-dark-knight-stoneproof': 'a passive auto-ability, not a command',
  'x2-dark-knight-curseproof': 'a passive auto-ability, not a command',
  'x2-gunner-trigger-happy-lv2': 'a menu marker (the skillset level), not a command',
  'x2-gunner-trigger-happy-lv3': 'a menu marker, not a command',
  'x2-white-mage-lv2': 'a menu marker, not a command',
  'x2-white-mage-lv3': 'a menu marker, not a command',
  'x2-alchemist-items-lv2': 'a menu marker, not a command',
  'x2-alchemist-chemist': 'a menu marker, not a command',
  'x2-alchemist-elementalist': 'a menu marker, not a command',
  'x2-bahamut-countdown': 'script state (the AI counts turns); the game has no command by that name',
};

/**
 * Attach each ability's game record, in place. The catalog's objects are shared (an item's effect is the same object as
 * its catalog entry), so this runs once, where the catalog is assembled.
 */
export function attachFfx2CommandRecords(abilities: readonly AbilityDef[]): void {
  for (const ability of abilities) {
    const record = FFX2_COMMAND_RECORDS[ability.id];
    if (record !== undefined) ability.ffx2Record = record;
  }
}
