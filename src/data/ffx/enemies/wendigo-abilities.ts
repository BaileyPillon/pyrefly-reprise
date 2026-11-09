/**
 * The move rows of Wendigo and the Guado Guardians of frozen Lake Macalania (FFX only; the hidden Wendigo chapter, number 49). **Source: the game's own move rows**, `research/re-ffx-wendigo-lake-macalania.md` section 5
 * ("RE 5"; `[bytes]`): every command record below is the game's row word for word from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's
 * monster-magic-1, command and item tables). `tests/unit/chapters/wendigo-data.test.ts` pins each one to the fixtures.
 *
 * **Every Wendigo attack row is named just "Attack" in the game.** The names here ("Punch", "Double Punch", "Counter Punch", "Raise Arms", "Lower Arms") are the lane's labels, after the guides' words (Samurai Gamers: "Punch",
 * "Double Punch", "Raise Dukes"); which row carries which guide name is `[inferred]` from the numbers (RE 5).
 *
 * | Row | Id | Used by (RE 4) | The row |
 * |---|---|---|---|
 * | Punch | `wendigo-punch` 0x407F | above half HP, 2 turns in 3, on a random living member | formula 1, power 16, physical, accuracy formula 2 on a byte of **120**, Darkness applies, can crit, shatter 10 |
 * | Double Punch | `wendigo-haymaker` 0x4080 | 1 turn in 3 at any HP, on the **lowest-HP** member | formula 1, power **24**, physical, accuracy formula 0 (**never misses**), no crit, shatter 50 |
 * | Counter Punch | `wendigo-counter-punch` 0x4062 | the reply to a physical hit while the arms are up | formula 1, power **20**, physical, accuracy formula 0 (**never misses**), can crit, shatter 10 |
 * | Raise Arms | `wendigo-raise-arms` 0x403B ("Counterattack") | below half HP, after the cycle's turns | on itself, no damage; sets the stance (the engine's `wendigo.arms` flag, the game's status property 61) |
 * | Lower Arms | `wendigo-lower-arms` 0x4063 ("Cancel Counter") | three Wendigo turns later | on itself, no damage; ends it |
 * | Berserk | `lake-berserk` 0x400F | the Guardians, on Wendigo, and on a party member while the arms are up | status chance **120**, no duration byte (to the end of the battle); the Berserk byte of Wendigo is 0, so it lands |
 * | Auto-Potion | `lake-auto-potion` 0x4010 | a Guardian when hit (on itself), or 25 percent of its turns on Wendigo while Wendigo is Berserk | formula 6, power 20: **+1,000 HP**, no variance |
 * | Eye Drops | `lake-eye-drops` 0x200C | the Guardians, on Wendigo's Darkness | an **item** row (rank 2) a monster uses: cures Darkness |
 *
 * **The rows the scripts name that are the player's own** are used by their ids (`../wendigo-ids.ts` `WENDIGO_ROWS`): the Guardians' Blizzara 0x3046 and Thundara 0x3047, and the Protect 0x303B and Shell 0x303A they cast on
 * Wendigo when they die. Wendigo's plain Attack 0x4000 (accuracy 90, power 16, the default attack a Berserk or Provoked Wendigo throws, at x3/2 under Berserk) is the enemy's `plainAttack` (`./wendigo.ts`).
 *
 * **Rule 5 (AGENTS.md):** the Double Punch and the Counter Punch have accuracy formula 0, so they never miss (`canMiss: false`); the Punch and the plain Attack roll (`accuracy` 120 and 90). Berserk and the two heals have
 * accuracy formula 0 and are marked `canMiss: false` too. The Guardians' two spells are the player's rows, which already carry it.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import { WENDIGO_ROWS } from '../wendigo-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'bonusCrit' | 'statusEffects' | 'removesStatuses' | 'extra' | 'shatterChance' | 'canMiss' | 'accuracy' | 'rank' | 'messageTemplate'>>;

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

/** 0x407F: formula 1, power 16, accuracy formula 2 on a byte of 120, Darkness applies, can crit, shatter 10. */
export const wendigoPunch: AbilityDef = row({
  id: WENDIGO_ROWS.punch,
  name: 'Punch',
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  accuracy: 120,
  flags: ['crit-eligible', 'affected-by-darkness', 'shatter'],
  shatterChance: 10,
});

/** 0x4080: formula 1, power 24, accuracy formula 0 (never misses), no crit, shatter 50. */
export const wendigoHaymaker: AbilityDef = row({
  id: WENDIGO_ROWS.haymaker,
  name: 'Double Punch',
  power: 24,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  flags: ['shatter'],
  shatterChance: 50,
});

/** 0x4062: formula 1, power 20, accuracy formula 0 (never misses), can crit, shatter 10. Only ever a reply. */
export const wendigoCounterPunch: AbilityDef = row({
  id: WENDIGO_ROWS.counterPunch,
  name: 'Counter Punch',
  power: 20,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  flags: ['crit-eligible', 'shatter'],
  shatterChance: 10,
});

/** 0x403B ("Counterattack"): on itself, no damage. The stance itself is the script's flag (`ai/wendigo.ts`). */
export const wendigoRaiseArms: AbilityDef = row({
  id: WENDIGO_ROWS.raiseArms,
  name: 'Raise Arms',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'self',
  hits: 1,
  canMiss: false,
  messageTemplate: '{user} raises its arms',
});

/** 0x4063 ("Cancel Counter"): on itself, no damage. */
export const wendigoLowerArms: AbilityDef = row({
  id: WENDIGO_ROWS.lowerArms,
  name: 'Lower Arms',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'self',
  hits: 1,
  canMiss: false,
  messageTemplate: '{user} lowers its arms',
});

/** 0x400F: Berserk, chance 120 against Wendigo's byte of 0 (it lands) and a party member's own resistance; magical flag, no damage. */
export const lakeBerserk: AbilityDef = row({
  id: WENDIGO_ROWS.berserk,
  name: 'Berserk',
  power: 0,
  formula: 'none',
  damageType: 'magical',
  targeting: 'single-any',
  hits: 1,
  canMiss: false,
  statusEffects: [{ status: 'berserk', chance: 120, duration: 254 }],
  messageTemplate: '{user} casts {ability} on {target}',
});

/**
 * 0x4010: formula 6 (fixed, no variance), power 20, +1,000 HP. Neither physical nor magical. The Guardian's reaction when it is hit (on itself), and 25 percent of its turns on Wendigo while Wendigo is Berserk (RE 4.4).
 * `single-any`: the script names the target itself (its own body or Wendigo's).
 */
export const lakeAutoPotion: AbilityDef = row({
  id: WENDIGO_ROWS.autoPotion,
  name: 'Auto-Potion',
  power: 20,
  formula: 'fixed-no-variance',
  damageType: 'other',
  targeting: 'single-any',
  hits: 1,
  canMiss: false,
  flags: ['heals'],
  messageTemplate: '{user} uses {ability} on {target}',
});

/** 0x200C: Eye Drops, an item row (rank 2) the Guardian's script uses on Wendigo's Darkness: formula 6, cures Darkness (chance byte 254, duration byte 254). */
export const lakeEyeDrops: AbilityDef = row({
  id: WENDIGO_ROWS.eyeDrops,
  name: 'Eye Drops',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-any',
  hits: 1,
  rank: 2,
  canMiss: false,
  flags: ['removes-statuses'],
  removesStatuses: ['darkness'],
  messageTemplate: '{user} uses {ability} on {target}',
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const WENDIGO_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [WENDIGO_ROWS.punch]: wendigoPunch,
  [WENDIGO_ROWS.haymaker]: wendigoHaymaker,
  [WENDIGO_ROWS.counterPunch]: wendigoCounterPunch,
  [WENDIGO_ROWS.raiseArms]: wendigoRaiseArms,
  [WENDIGO_ROWS.lowerArms]: wendigoLowerArms,
  [WENDIGO_ROWS.berserk]: lakeBerserk,
  [WENDIGO_ROWS.autoPotion]: lakeAutoPotion,
  [WENDIGO_ROWS.eyeDrops]: lakeEyeDrops,
};

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are `[status number, byte]`
 * (9 Berserk, 14 Darkness) and `durations` `[temporal slot, byte]` (2 Darkness). `flagsMisc` 0x52 is the accuracy formula 2 (bits 3 to 5) with Darkness applying (bit 6); 2 is accuracy formula 0. `flagsDamage` 0xD is
 * physical, can crit, the crit chance is the row's byte; 1 is physical alone; 0x10 heals; 0x70 heals, cleanses and caps at 9,999.
 */
export const COMMAND_RECORDS_WENDIGO: Readonly<Record<string, FFXCommandRecord>> = {
  [WENDIGO_ROWS.punch]: { id: 0x407f, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1, shatter: 10, rank: 3 },
  [WENDIGO_ROWS.haymaker]: { id: 0x4080, type: 0, flagsMisc: 0x2, flagsDamage: 0x1, damageClass: 1, shatter: 50, rank: 3 },
  [WENDIGO_ROWS.counterPunch]: { id: 0x4062, type: 0, flagsMisc: 0x2, flagsDamage: 0xd, damageClass: 1, shatter: 10, rank: 3 },
  [WENDIGO_ROWS.raiseArms]: { id: 0x403b, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [WENDIGO_ROWS.lowerArms]: { id: 0x4063, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [WENDIGO_ROWS.berserk]: { id: 0x400f, type: 0, flagsMisc: 0x20006, flagsDamage: 0x2, damageClass: 0, rank: 3, chances: [[9, 120]] },
  [WENDIGO_ROWS.autoPotion]: { id: 0x4010, type: 0, flagsMisc: 0x6, flagsDamage: 0x10, damageClass: 1, rank: 3 },
  [WENDIGO_ROWS.eyeDrops]: { id: 0x200c, type: 0, flagsMisc: 0x10006, flagsDamage: 0x70, damageClass: 0, rank: 2, chances: [[14, 254]], durations: [[2, 254]] },
};
