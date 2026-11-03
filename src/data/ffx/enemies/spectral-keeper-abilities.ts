/**
 * The Spectral Keeper's move rows (FFX only; the hidden Spectral Keeper chapter). **Source: the game's own move rows**, `research/re-ffx-spectral-keeper.md` section 1.4 ("RE 1.4"; `[R]`), and every command record below is
 * **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-2 table, rows 0x6045 to 0x604E, and the party table's
 * 0x3103): the type, the two flag words, the damage class, the CTB rank (3 on all of them), the status chance bytes, the extra-status word and the shatter byte. `tests/unit/chapters/spectral-keeper-data.test.ts` pins each one to the
 * fixtures.
 *
 * | Row | Id | Used by (RE 4 and 5) | The row |
 * |---|---|---|---|
 * | Berserk Tail | `keeper-berserk-tail` 0x6045 | the Keeper's turn | physical, formula 1, power 16, one target, accuracy formula 0 (**it never misses**); **Berserk 50** |
 * | Attack All | `keeper-attack-all` 0x6047 | the counter sweep | physical, formula 1, power 32, shatter 120, accuracy formula 2 on a byte of 126; the group is the script's |
 * | Glyph Mine | `keeper-glyph-mine` 0x604D | the Keeper arming a Circle | no hit record: nothing lands (its extra-status word 0x4000 is Doom, but with no hit it is never applied); the effect is the Circle's `onTargeted` |
 * | Mine blast | `keeper-mine-blast` 0x6048 | an armed Circle's turn | **formula 8 (a fraction of the maximum), power 16** (all of it), the 99,999 cap, **Death 255**, accuracy formula 0 |
 * | Mine fizzle | `keeper-mine-fizzle` 0x6049 | a mine on an empty platform | nothing: the Circle strikes itself |
 * | Aeon attack | `keeper-aeon-attack` 0x604E | the Keeper while an aeon is out | physical, formula 1, power 24, accuracy formula 2 on a byte of 100, critical 10 |
 * | Move | `move` 0x3103 | the party command | no hit record; the rank byte is 0 and the engine charges rank 3 |
 *
 * **Rule 5 (AGENTS.md):** the Tail, the blast and the fizzle have accuracy formula 0, so they never miss (`canMiss: false`); Attack All and the aeon Attack roll (`accuracy` 126 and 100). Death 255 lands whatever the target's
 * resistance byte (the status step's chance-255 rule, `kernel/status-inflict.ts`), so Deathproof does not help. The rows' animations and sounds are not modelled here; the Warp (0x606C) and the lit glyph (0x6001) are presentation and
 * have no row (the Move trigger writes the new platform itself).
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication } from '../../../battle/common/types.ts';
import { SPECTRAL_ROWS } from '../spectral-keeper-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'bonusCrit' | 'statusEffects' | 'extra' | 'shatterChance' | 'canMiss' | 'accuracy' | 'rank'>>;

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

const apply = (status: StatusApplication['status'], chance: number, duration = 254): StatusApplication => ({ status, chance, duration });

/** 0x6045: formula 1, power 16, accuracy formula 0 (never misses), Berserk byte 50. */
export const berserkTail: AbilityDef = row({ id: SPECTRAL_ROWS.tail, name: 'Berserk Tail', power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, canMiss: false, statusEffects: [apply('berserk', 50)] });

/**
 * 0x6047: formula 1, power 32, shatter 120, accuracy formula 2 on a byte of 126. `all-enemies` and `groupTarget`: the script names the group (the characters on the three platforms in front), the row's own
 * multi flag never decides it (and a Provoked Keeper's single-target redirect leaves it alone).
 */
export const attackAll: AbilityDef = row({
  id: SPECTRAL_ROWS.sweep, name: 'Attack All', power: 32, formula: 'strength', damageType: 'physical', targeting: 'all-enemies', hits: 1, accuracy: 126, extra: { groupTarget: true }, // no `shatterChance` of our own: the record's shatter byte is 120 (a Petrified target shatters when a draw % 101 < 120, so always) and the record is the one the engine reads; the contract's percentage cannot say 120
});

/** 0x604D: no hit record, so nothing lands; the Circle it reaches lights. `groupTarget`: the two (or one) Circles the script armed, whatever their targetable bit. */
export const glyphMine: AbilityDef = row({
  id: SPECTRAL_ROWS.mine, name: 'Glyph Mine', power: 0, formula: 'none', damageType: 'other', targeting: 'all-enemies', hits: 0, canMiss: false, extra: { groupTarget: true },
});

/** 0x6048: formula 8 (a fraction of the maximum), power 16 (the whole of it), the 99,999 cap, Death 255. */
export const mineBlast: AbilityDef = row({
  id: SPECTRAL_ROWS.blast, name: 'Glyph Mine', power: 16, formula: 'percent-total', damageType: 'other', targeting: 'single-enemy', hits: 1, canMiss: false, flags: ['always-break-damage-limit'], statusEffects: [apply('ko', 255)],
});

/** 0x6049: the Circle strikes itself; no hit, no effect. */
export const mineFizzle: AbilityDef = row({ id: SPECTRAL_ROWS.fizzle, name: 'Glyph Mine', power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 0, canMiss: false });

/** 0x604E: formula 1, power 24, accuracy formula 2 on a byte of 100, critical bonus 10. */
export const aeonAttack: AbilityDef = row({
  id: SPECTRAL_ROWS.aeonAttack, name: 'Attack', power: 24, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, accuracy: 100, bonusCrit: 10, flags: ['crit-eligible'],
});

/** 0x3103, the party's Move: a trigger, so the catalog row is read only for its label and its rank (`execute.ts`, the `trigger` case); the engine charges rank 3 for the record's rank byte 0. */
export const moveCommand: AbilityDef = row({
  // `targeting: 'self'`: the catalog row aims at nobody (the aim is the menu row's own `validTargets`, `platforms.ts#moveRows`, and the trigger handler reads the Circle from the command), so the target-word tables that walk the catalog leave it alone.
  id: SPECTRAL_ROWS.move, name: 'Move', category: 'special', power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 0, canMiss: false,
  extra: { resolvesAsCommandKind: 'trigger', triggerId: SPECTRAL_ROWS.move },
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const SPECTRAL_KEEPER_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [SPECTRAL_ROWS.tail]: berserkTail,
  [SPECTRAL_ROWS.sweep]: attackAll,
  [SPECTRAL_ROWS.mine]: glyphMine,
  [SPECTRAL_ROWS.blast]: mineBlast,
  [SPECTRAL_ROWS.fizzle]: mineFizzle,
  [SPECTRAL_ROWS.aeonAttack]: aeonAttack,
  [SPECTRAL_ROWS.move]: moveCommand,
};

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (0 Death, 9 Berserk). `flagsMisc` 6, 2 and 18 and 82 decide the accuracy formula (bits 3 to 5: 0, 0, 2 and 2). The party's Move is 0x3103 with the rank byte 0 (the engine charges 3).
 */
export const COMMAND_RECORDS_SPECTRAL_KEEPER: Readonly<Record<string, FFXCommandRecord>> = {
  [SPECTRAL_ROWS.tail]: { id: 0x6045, type: 0, flagsMisc: 6, flagsDamage: 1, damageClass: 1, rank: 3, chances: [[9, 50]] },
  [SPECTRAL_ROWS.sweep]: { id: 0x6047, type: 0, flagsMisc: 18, flagsDamage: 1, damageClass: 1, rank: 3, shatter: 120 },
  [SPECTRAL_ROWS.mine]: { id: 0x604d, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 0, rank: 3, extra: 16384 },
  [SPECTRAL_ROWS.blast]: { id: 0x6048, type: 0, flagsMisc: 2, flagsDamage: 128, damageClass: 1, rank: 3, chances: [[0, 255]] },
  [SPECTRAL_ROWS.fizzle]: { id: 0x6049, type: 0, flagsMisc: 2, flagsDamage: 0, damageClass: 0, rank: 3 },
  [SPECTRAL_ROWS.aeonAttack]: { id: 0x604e, type: 0, flagsMisc: 82, flagsDamage: 13, damageClass: 1, rank: 3 },
  [SPECTRAL_ROWS.move]: { id: 0x3103, type: 0, flagsMisc: 528390, flagsDamage: 0, damageClass: 0, rank: 0 },
};
