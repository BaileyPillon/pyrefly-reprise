/**
 * The move rows of the hidden Flooded Ways chapter (FFX only; number 36): Geosgaeno's four, Evrae Altana's three, and the two commands the party is given in these fights (the held character's Struggle, the key to the
 * Gate Locks). **Source: the game's own move rows**, `research/re-ffx-geosgaeno-evrae-altana.md` section 5 ("RE 5"; `[bytes]`), and every command record below is **the game's row word for word** from the two kernel fixtures
 * (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`): the type, the two flag words, the damage class, the CTB rank, the status chance bytes and the extra-status word.
 * `tests/unit/chapters/flooded-ways-data.test.ts` pins each one to the fixtures.
 *
 * | Row | Id | Used by | The row |
 * |---|---|---|---|
 * | Stone Punch | `geosgaeno-stone-punch` 0x6032 | Geosgaeno, three times in a cycle | physical, formula 1, power 16; accuracy formula 2 on a byte of 100; **Petrify 50** (a shatter in water) |
 * | KO Punch | `geosgaeno-ko-punch` 0x6033 | Geosgaeno below half HP, in place of 69 percent of the punches | as Stone Punch with **Death 50 and Curse (always)** |
 * | Swallow | `geosgaeno-swallow` 0x602E | Geosgaeno, after its punches | no hit record; the script does the work (the hold, `ai/geosgaeno-hold.ts`) |
 * | Regurgitate | `geosgaeno-regurgitate` 0x602F | Geosgaeno's spit-out, a Struggle's answer, its death | **formula 16 (the user's maximum HP, no variance), power 10, the 99,999 cap**; the script aims it and rewrites the maximum |
 * | Attack | `evrae-altana-attack` 0x6000 | Evrae Altana's counter (areas 1 and 2) | physical, formula 1, power 16; accuracy formula 2 on a byte of 90 |
 * | Stone Gaze | `evrae-altana-stone-gaze` 0x604C | Evrae Altana, every other turn while three stand | magical, formula 3, power 16; accuracy formula 0; **Petrify 50, Sleep 50** (the row gives Sleep no duration byte: RE 5 note) |
 * | Photon Spray | `evrae-altana-photon-spray` 0x604B | Evrae Altana, the turns between | magical, formula 3, power 4, **8 hits**, each on a random member; accuracy formula 0 |
 * | Struggle | `struggle` 0x3109 | the swallowed character | a **piercing weapon strike** (formula 1, power 17, uses the weapon, accuracy formula 0) at the monster holding them; its hit is what Geosgaeno answers |
 * | Open lock | `open-lock` 0x312F | Tidus, Wakka, Rikku in the Via Purifico | a trigger command (formula 6, power 1, a fixed 50) at a Gate Lock; the lock's script sets its HP to 0 |
 *
 * **Rule 5 (AGENTS.md):** Stone Gaze, Photon Spray, Regurgitate and the Struggle have accuracy formula 0, so they never miss (`canMiss: false`); the punches and Evrae Altana's Attack roll (`accuracy` 100, 90). The
 * 99,999 cap bit and the status chance bytes are each row's own. The twin Photon Spray row (0x606B, the third area's) is identical in every mapped field and is carried once.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication } from '../../../battle/common/types.ts';
import { FLOODED_ROWS } from '../flooded-ways-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'bonusCrit' | 'statusEffects' | 'extra' | 'canMiss' | 'accuracy'>>;

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

/** 0x6032: formula 1, power 16, accuracy formula 2 on a byte of 100, Petrify 50. The critical bit is not set on the row (flags word 1), so it never crits. */
export const stonePunch: AbilityDef = row({
  id: FLOODED_ROWS.stonePunch, name: 'Stone Punch', power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, accuracy: 100, bonusCrit: 10, statusEffects: [apply('petrify', 50)],
});

/** 0x6033: as Stone Punch with Death 50 and the Curse bit (the record's extra word 0x400, always). */
export const koPunch: AbilityDef = row({
  id: FLOODED_ROWS.koPunch, name: 'KO Punch', power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, accuracy: 100, bonusCrit: 10, statusEffects: [apply('ko', 50)],
});

/** 0x602E: no hit record, so nothing lands; the script puts the target in the monster. `groupTarget`: the character the script named, whatever their targetable bit (the hold makes them untargetable). */
export const swallow: AbilityDef = row({
  id: FLOODED_ROWS.swallow, name: 'Swallow', power: 0, formula: 'none', damageType: 'other', targeting: 'single-enemy', hits: 0, canMiss: false, extra: { groupTarget: true },
});

/**
 * 0x602F: formula 16 (the user's maximum HP times power over ten, no variance), power 10 (the whole of it), the 99,999 cap. `groupTarget`: the script names the whole front line (the spit-out), one character (a Struggle's answer)
 * or the front line again (the death). The script writes the amount into Geosgaeno's maximum HP around the hit and puts the real one back, as the game does (`ai/geosgaeno-hold.ts`).
 */
export const regurgitate: AbilityDef = row({
  id: FLOODED_ROWS.regurgitate, name: 'Regurgitate', power: 10, formula: 'user-max-hp', damageType: 'other', targeting: 'all-enemies', hits: 1, canMiss: false, flags: ['always-break-damage-limit'],
  extra: { groupTarget: true },
});

/** 0x6000: formula 1, power 16, accuracy formula 2 on a byte of 90 (Evrae Altana's counter). */
export const altanaAttack: AbilityDef = row({
  id: FLOODED_ROWS.altanaAttack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, accuracy: 90,
});

/** 0x604C: formula 3, power 16, accuracy formula 0; Petrify 50 and Sleep 50. */
export const stoneGaze: AbilityDef = row({
  id: FLOODED_ROWS.stoneGaze, name: 'Stone Gaze', power: 16, formula: 'magic', damageType: 'magical', targeting: 'single-enemy', hits: 1, canMiss: false, statusEffects: [apply('petrify', 50), apply('sleep', 50, 0)], // the row's Sleep has no duration byte (the record's durations are empty): 0, as the record says
});

/** 0x604B (and 0x606B): formula 3, power 4, eight hits, accuracy formula 0. `random-enemy`: each hit re-rolls its target among the party (RE 4.3; the guides say so, the target byte only says "random character"). */
export const photonSpray: AbilityDef = row({
  id: FLOODED_ROWS.photonSpray, name: 'Photon Spray', power: 4, formula: 'magic', damageType: 'magical', targeting: 'random-enemy', hits: 8, canMiss: false,
});

/** 0x3109: the held character's strike: formula 1, power 17, uses the weapon, pierces Armored (record flag word 0x51042), can crit with the gear's bonus. */
export const struggle: AbilityDef = row({
  id: FLOODED_ROWS.struggle, name: 'Struggle', category: 'special', power: 17, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, canMiss: false, // accuracy formula 0 (flag word 0x51042, bits 3 to 5)
  flags: ['crit-eligible', 'adds-equipment-crit', 'ignores-armored'],
});

/**
 * 0x312F, the party's Open lock: a trigger, so the catalog row is read only for its label and its rank (`execute.ts`, the `trigger` case). `targeting: 'self'`: the catalog row aims at nobody (the aim is the menu row's
 * own `validTargets`, `ai/gate-locks.ts#openLockRows`, and the trigger handler reads the lock from the command), as the Keeper's Move does.
 */
export const openLock: AbilityDef = row({
  id: FLOODED_ROWS.openLock, name: 'Open lock', category: 'special', power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 0, canMiss: false,
  extra: { resolvesAsCommandKind: 'trigger', triggerId: FLOODED_ROWS.openLock },
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const FLOODED_WAYS_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries(
  [stonePunch, koPunch, swallow, regurgitate, altanaAttack, stoneGaze, photonSpray, struggle, openLock].map((a) => [a.id, a]),
);

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (0 Death, 2 Petrify, 12 Sleep); `extra` is the extra-status word (0x400 Curse). `flagsMisc` 86 and 82 decide the accuracy formula (bits 3 to 5: 2 and 2), 6 and 2 give 0.
 */
export const COMMAND_RECORDS_FLOODED_WAYS: Readonly<Record<string, FFXCommandRecord>> = {
  [FLOODED_ROWS.stonePunch]: { id: 0x6032, type: 0, flagsMisc: 86, flagsDamage: 1, damageClass: 1, rank: 3, chances: [[2, 50]] },
  [FLOODED_ROWS.koPunch]: { id: 0x6033, type: 0, flagsMisc: 86, flagsDamage: 1, damageClass: 1, rank: 3, extra: 1024, chances: [[0, 50]] },
  [FLOODED_ROWS.swallow]: { id: 0x602e, type: 0, flagsMisc: 2, flagsDamage: 0, damageClass: 0, rank: 3 },
  [FLOODED_ROWS.regurgitate]: { id: 0x602f, type: 0, flagsMisc: 2, flagsDamage: 128, damageClass: 1, rank: 3 },
  [FLOODED_ROWS.altanaAttack]: { id: 0x6000, type: 0, flagsMisc: 82, flagsDamage: 1, damageClass: 1, rank: 3 },
  [FLOODED_ROWS.stoneGaze]: { id: 0x604c, type: 0, flagsMisc: 6, flagsDamage: 2, damageClass: 1, rank: 3, chances: [[2, 50], [12, 50]] },
  [FLOODED_ROWS.photonSpray]: { id: 0x604b, type: 0, flagsMisc: 32774, flagsDamage: 2, damageClass: 1, rank: 3 },
  [FLOODED_ROWS.struggle]: { id: 0x3109, type: 0, flagsMisc: 331842, flagsDamage: 13, damageClass: 1, rank: 3 },
  [FLOODED_ROWS.openLock]: { id: 0x312f, type: 0, flagsMisc: 528390, flagsDamage: 0, damageClass: 1, rank: 3 },
};
