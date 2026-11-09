/**
 * The move rows of the Oblitzerator and the Luca crane (FFX only; the hidden Oblitzerator chapter, number 50). **Source: the game's own move rows**, `research/re-ffx-oblitzerator-crane.md` sections 1.1, 4.1, 4.2 and 4.5
 * ("RE n"; `[bytes]`): every command record below is the game's row word for word from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's
 * monster-magic-2 and command tables). `tests/unit/chapters/oblitzerator-data.test.ts` pins each one to the fixtures.
 *
 * | Row | Id | Used by (RE 4) | The row |
 * |---|---|---|---|
 * | Blitzball Rush | `blitzball-rush` 0x600C | its one turn, on the whole living front line | formula 1 (strength), power **4**, **10 hits spread at random over the set** (flag word 0x8006: bit 15 is the random spread, accuracy formula 0, so **it never misses**), damage type 0 (**neither Protect nor Shell halves it**; the target's Cheer does), rank 3 |
 * | Doze Ball | `doze-ball` 0x600D | its counter to a command of formula 2 (**no player command has one**, RE 4.3) | formula 1, power 7, one hit, Sleep 254 (duration code 1) |
 * | Blind Ball | `blind-ball` 0x600E | its counter to a command of formula 1, one time in three | formula 1, power **10**, one hit, Darkness 254 (duration code 1) |
 * | Mute Ball | `mute-ball` 0x600F | its counter to a command of formula 3, one time in three | formula 1, power 7, one hit, Silence 254 (duration code 1) |
 * | Crane | `crane-lift` 0x6012 | the crane's, on the Oblitzerator, when "Use crane" is used on the powered crane | formula 5 (a share of the target's **current** HP), power **15** (15/16), **physical**, accuracy formula 0 (never misses), no variance |
 * | Use crane | `use-crane` 0x3102 | Tidus's Trigger Command (`battle/ffx/ai/luca-crane.ts`) | a trigger: the catalog row is read only for its label and its rank; the aim is the menu row's own `validTargets` |
 *
 * **The rows the scripts name that are the player's own** are used by their ids (`../oblitzerator-ids.ts` `OBLITZERATOR_ROWS`): Thunder 0x3043 and Thunder Fury 0x307a, which the crane's script counts. The two message rows
 * the crane queues ("The crane responds.", "Crane activated.") and Special 1 (the Oblitzerator's exit animation) carry no effect and are not modelled as rows: the chapter's banners (`OBLITZERATOR_CALLOUTS`) stand for them.
 *
 * **Rule 5 (AGENTS.md):** every row here has accuracy formula 0 (flag words 0x8006, 6, 6, 6, 2), so each is `canMiss: false`.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import { OBLITZERATOR_ROWS } from '../oblitzerator-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'statusEffects' | 'extra' | 'canMiss' | 'accuracy' | 'rank' | 'messageTemplate'>>;

/** The columns every row shares: a monster move of rank 3, no MP, no element. */
function row(fields: Fields): AbilityDef {
  return {
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3,
    element: ['none'],
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

/** 0x600C: formula 1, power 4, ten hits, the random spread (the misc word's bit 15), accuracy formula 0. Damage type 0: Protect and Shell do not touch it. */
export const blitzballRush: AbilityDef = row({
  id: OBLITZERATOR_ROWS.rush,
  name: 'Blitzball Rush',
  power: 4,
  formula: 'strength',
  damageType: 'other',
  targeting: 'random-enemy',
  hits: 10,
  canMiss: false,
});

/** 0x600D: formula 1, power 7, Sleep 254 for duration code 1. The counter to a command of formula 2 (none exists among the player's commands). */
export const dozeBall: AbilityDef = row({
  id: OBLITZERATOR_ROWS.doze,
  name: 'Doze Ball',
  power: 7,
  formula: 'strength',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  statusEffects: [{ status: 'sleep', chance: 254, duration: 1 }],
});

/** 0x600E: formula 1, power 10, Darkness 254 for duration code 1. The counter to a physical-formula command. */
export const blindBall: AbilityDef = row({
  id: OBLITZERATOR_ROWS.blind,
  name: 'Blind Ball',
  power: 10,
  formula: 'strength',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  statusEffects: [{ status: 'darkness', chance: 254, duration: 1 }],
});

/** 0x600F: formula 1, power 7, Silence 254 for duration code 1. The counter to a magic-formula command. */
export const muteBall: AbilityDef = row({
  id: OBLITZERATOR_ROWS.mute,
  name: 'Mute Ball',
  power: 7,
  formula: 'strength',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  statusEffects: [{ status: 'silence', chance: 254, duration: 1 }],
});

/**
 * 0x6012 "Crane": formula 5, power 15, physical, accuracy formula 0. **It is cast by the crane on the Oblitzerator, a monster of its own side**, so it is `single-ally` (the crane's allies are the enemy side; the
 * Oblitzerator is the one it names). Fifteen sixteenths of the Oblitzerator's CURRENT HP: 5,625 from full, 2,812 from 3,000, and no more than 32 short of everything it has left.
 */
export const craneLift: AbilityDef = row({
  id: OBLITZERATOR_ROWS.lift,
  name: 'Crane',
  power: 15,
  formula: 'percent-current',
  damageType: 'physical',
  targeting: 'single-ally',
  hits: 1,
  canMiss: false,
  messageTemplate: 'The crane lifts the {target}',
});

/**
 * 0x3102, Tidus's Use crane: a trigger, so the catalog row is read only for its label and its rank (`execute.ts`, the `trigger` case). `targeting: 'self'`: the catalog row aims at nobody (the aim is the menu row's own
 * `validTargets`, `ai/luca-crane.ts#useCraneRows`, and the trigger handler reads the crane from the command), as the Keeper's Move and the Flooded Ways' Open lock do.
 */
export const useCrane: AbilityDef = row({
  id: OBLITZERATOR_ROWS.useCrane,
  name: 'Use crane',
  category: 'special',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'self',
  hits: 0,
  canMiss: false,
  extra: { resolvesAsCommandKind: 'trigger', triggerId: OBLITZERATOR_ROWS.useCrane },
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const OBLITZERATOR_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries(
  [blitzballRush, dozeBall, blindBall, muteBall, craneLift, useCrane].map((a) => [a.id, a]),
);

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (12 Sleep, 13 Silence, 14 Darkness) and `durations` `[temporal slot, byte]` (0 Sleep, 1 Silence, 2 Darkness). `flagsMisc` 0x8006 is the random spread (bit 15) with accuracy formula 0; 6 and 2
 * are accuracy formula 0; 528390 (0x80046) is the Trigger Command's. `flagsDamage` 0 is damage type 0 (neither physical nor magical), 1 physical.
 */
export const COMMAND_RECORDS_OBLITZERATOR: Readonly<Record<string, FFXCommandRecord>> = {
  [OBLITZERATOR_ROWS.rush]: { id: 0x600c, type: 0, flagsMisc: 32774, flagsDamage: 0, damageClass: 1, rank: 3 },
  [OBLITZERATOR_ROWS.doze]: { id: 0x600d, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 1, rank: 3, chances: [[12, 254]], durations: [[0, 1]] },
  [OBLITZERATOR_ROWS.blind]: { id: 0x600e, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 1, rank: 3, chances: [[14, 254]], durations: [[2, 1]] },
  [OBLITZERATOR_ROWS.mute]: { id: 0x600f, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 1, rank: 3, chances: [[13, 254]], durations: [[1, 1]] },
  [OBLITZERATOR_ROWS.lift]: { id: 0x6012, type: 0, flagsMisc: 2, flagsDamage: 1, damageClass: 1, rank: 3 },
  [OBLITZERATOR_ROWS.useCrane]: { id: 0x3102, type: 0, flagsMisc: 528390, flagsDamage: 0, damageClass: 0 }, // no rank byte in the table (0): the game then uses 3, which is the ability row's own
};
