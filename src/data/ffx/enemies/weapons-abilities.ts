/**
 * The move rows of Ultima Weapon, Omega Weapon and Nemesis (FFX only; the hidden Omega Ruins chapter, number 43). **Source: the game's own move rows**, `research/re-ffx-omega-ultima-nemesis.md` section 5 ("RE 5";
 * `[bytes]`), and every command record below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-1
 * and monster-magic-2 tables): the type, the two flag words, the damage class, the CTB rank (3 on all of them), the status chance and duration bytes, the extra-status word and the shatter byte.
 * `tests/unit/chapters/omega-ruins-data.test.ts` pins each one to the fixtures.
 *
 * | Row | Id | Used by (RE 4) | The row |
 * |---|---|---|---|
 * | Attack (Ultima) | `ruins-ultima-attack` 0x407F | Ultima Weapon, turns 1 and 5 | strength, power 16, physical, **accuracy formula 2 on a byte of 120** (it misses a party with Evasion 255), can crit, shatter 10 |
 * | Core Energy | `ruins-core-energy` 0x4022 | Ultima and Omega | magic, power 44, magical, never misses |
 * | Shimmering Rain | `ruins-shimmering-rain` 0x4023 | Ultima and Omega, on the front line | magic, power 30, **neither physical nor magical** (Protect and Shell do not lessen it), never misses |
 * | Break | `ruins-break` 0x604F | Ultima, Omega | **Petrify 254**, reflectable, no damage |
 * | Silence / Confuse / Sleep | `ruins-silence` 0x606E, `ruins-confuse` 0x6072, `ruins-sleep` 0x6071 | Ultima (Confuse also Omega) | Silence 100 (three turns), Confuse 100, Sleep 100 (three turns), reflectable |
 * | Attack (Omega) | `ruins-omega-attack` 0x410F | Omega, a third of its turns | strength, power 16, physical, **accuracy formula 0 (always hits)**, crit bonus 25, **the 99,999 cap** |
 * | Nova (Omega's own) | `ruins-nova` 0x4067 | Omega, at counter 30, on the front line | magic, power 60, special, never misses. **Not Kimahri's Nova** (0x3073, Ronso Rage, power 70) |
 * | Attack (Nemesis) | `ruins-nemesis-attack` 0x40F0 | Nemesis | strength, power 16, physical, always hits, crit bonus 10, the 99,999 cap |
 * | Ethereal Cannon | `ruins-ethereal-cannon` 0x40D8 | Nemesis, one target | magic, power 255, magical, never misses, the 99,999 cap |
 * | Ultra Spark | `ruins-ultra-spark` 0x40D9 | Nemesis, the front line | strength, power 32, special, the 99,999 cap; **Poison, Power Break, Slow (254 turns) and Curse** |
 * | Armageddon | `ruins-armageddon` 0x40F4 | Nemesis, at counter 20, the front line | formula 2 (strength with the defence ignored), power 36, special, the 99,999 cap |
 * | Ultima (Nemesis's) | `ruins-nemesis-ultima` 0x40F3 | the reply to a special command | magic, power 70, magical, pierces Armored, the 99,999 cap, not reflectable |
 *
 * **The rows the scripts add are not here**: Holy 0x303F (Ultima Weapon's fourth turn), Ultima 0x3053 and Demi 0x304E (Omega's fourth step) are the player's own rows, used by their ids (`../omega-ruins-ids.ts`
 * `WEAPON_ROWS`), as the Keeper and Evrae scripts do. Rule 5 (AGENTS.md): every row whose accuracy formula is 0 never misses (`canMiss: false`); Ultima's Attack is the only row that rolls.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication } from '../../../battle/common/types.ts';
import { WEAPON_ROWS } from '../omega-ruins-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'bonusCrit' | 'statusEffects' | 'removesStatuses' | 'extra' | 'shatterChance' | 'canMiss' | 'canReflect' | 'accuracy' | 'rank' | 'messageTemplate'>>;

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

/** 0x407F: strength 16, physical, accuracy formula 2 on a byte of 120, can crit, Darkness applies, shatter 10. */
export const ultimaAttack: AbilityDef = row({
  id: WEAPON_ROWS.ultimaAttack,
  name: 'Attack',
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  accuracy: 120,
  flags: ['crit-eligible', 'affected-by-darkness', 'shatter'],
  shatterChance: 10,
});

/** 0x4022: magic 44, magical, accuracy formula 0. */
export const coreEnergy: AbilityDef = row({
  id: WEAPON_ROWS.coreEnergy,
  name: 'Core Energy',
  power: 44,
  formula: 'magic',
  damageType: 'magical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
});

/** 0x4023: magic 30, neither physical nor magical (flag word 0), the whole front line, accuracy formula 0. `groupTarget`: the script names the group. */
export const shimmeringRain: AbilityDef = row({
  id: WEAPON_ROWS.shimmeringRain,
  name: 'Shimmering Rain',
  power: 30,
  formula: 'magic',
  damageType: 'other',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  extra: { groupTarget: true },
});

/** 0x604F: Petrify 254, no damage, reflectable. */
export const weaponBreak: AbilityDef = row({
  id: WEAPON_ROWS.break,
  name: 'Break',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  canReflect: true,
  flags: ['reflectable'],
  statusEffects: [apply('petrify', 254)],
  messageTemplate: '{user} casts Break',
});

/** 0x606E: Silence 100 for three turns, reflectable. */
export const weaponSilence: AbilityDef = row({
  id: WEAPON_ROWS.silence,
  name: 'Silence',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  canReflect: true,
  flags: ['reflectable'],
  statusEffects: [apply('silence', 100, 3)],
  messageTemplate: '{user} casts Silence',
});

/** 0x6072: Confuse 100, reflectable. */
export const weaponConfuse: AbilityDef = row({
  id: WEAPON_ROWS.confuse,
  name: 'Confuse',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  canReflect: true,
  flags: ['reflectable'],
  statusEffects: [apply('confuse', 100)],
  messageTemplate: '{user} casts Confuse',
});

/** 0x6071: Sleep 100 for three turns, reflectable. */
export const weaponSleep: AbilityDef = row({
  id: WEAPON_ROWS.sleep,
  name: 'Sleep',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  canReflect: true,
  flags: ['reflectable'],
  statusEffects: [apply('sleep', 100, 3)],
  messageTemplate: '{user} casts Sleep',
});

/** 0x410F: strength 16, physical, accuracy formula 0 (always hits), crit bonus 25, the 99,999 cap, shatter 100. */
export const omegaAttack: AbilityDef = row({
  id: WEAPON_ROWS.omegaAttack,
  name: 'Attack',
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  bonusCrit: 25,
  flags: ['crit-eligible', 'always-break-damage-limit', 'shatter'],
  shatterChance: 100,
});

/** 0x4067: Omega's own Nova: magic 60, special, the whole front line, accuracy formula 0. */
export const omegaNova: AbilityDef = row({
  id: WEAPON_ROWS.nova,
  name: 'Nova',
  power: 60,
  formula: 'magic',
  damageType: 'other',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  extra: { groupTarget: true },
});

/** 0x40F0: strength 16, physical, always hits, crit bonus 10, the 99,999 cap, shatter 100. */
export const nemesisAttack: AbilityDef = row({
  id: WEAPON_ROWS.nemesisAttack,
  name: 'Attack',
  power: 16,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  bonusCrit: 10,
  flags: ['crit-eligible', 'always-break-damage-limit', 'shatter'],
  shatterChance: 100,
});

/** 0x40D8: magic 255, magical, one target, the 99,999 cap. */
export const etherealCannon: AbilityDef = row({
  id: WEAPON_ROWS.etherealCannon,
  name: 'Ethereal Cannon',
  power: 255,
  formula: 'magic',
  damageType: 'magical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  flags: ['always-break-damage-limit'],
  shatterChance: 100,
});

/** 0x40D9: strength 32, special, the whole front line, the 99,999 cap; Poison, Power Break, Slow (254 turns) and Curse, each 254. */
export const ultraSpark: AbilityDef = row({
  id: WEAPON_ROWS.ultraSpark,
  name: 'Ultra Spark',
  power: 32,
  formula: 'strength',
  damageType: 'other',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  flags: ['always-break-damage-limit'],
  shatterChance: 100,
  statusEffects: [apply('poison', 254), apply('power-break', 254), apply('slow', 254), apply('curse', 254)],
  extra: { groupTarget: true },
});

/** 0x40F4: formula 2 (strength with the defence ignored), power 36, special, the whole front line, the 99,999 cap. Protect, Shell and Shield do not matter. */
export const armageddon: AbilityDef = row({
  id: WEAPON_ROWS.armageddon,
  name: 'Armageddon',
  power: 36,
  formula: 'piercing-strength',
  damageType: 'other',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  flags: ['always-break-damage-limit'],
  shatterChance: 100,
  extra: { groupTarget: true },
});

/** 0x40F3: Nemesis's own Ultima: magic 70, magical, the whole front line, pierces Armored (a restatement; the record carries it), the 99,999 cap, not reflectable. */
export const nemesisUltima: AbilityDef = row({
  id: WEAPON_ROWS.nemesisUltima,
  name: 'Ultima',
  power: 70,
  formula: 'magic',
  damageType: 'magical',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  flags: ['always-break-damage-limit', 'ignores-armored'],
  shatterChance: 100,
  extra: { groupTarget: true },
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const WEAPON_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [WEAPON_ROWS.ultimaAttack]: ultimaAttack,
  [WEAPON_ROWS.coreEnergy]: coreEnergy,
  [WEAPON_ROWS.shimmeringRain]: shimmeringRain,
  [WEAPON_ROWS.break]: weaponBreak,
  [WEAPON_ROWS.silence]: weaponSilence,
  [WEAPON_ROWS.confuse]: weaponConfuse,
  [WEAPON_ROWS.sleep]: weaponSleep,
  [WEAPON_ROWS.omegaAttack]: omegaAttack,
  [WEAPON_ROWS.nova]: omegaNova,
  [WEAPON_ROWS.nemesisAttack]: nemesisAttack,
  [WEAPON_ROWS.etherealCannon]: etherealCannon,
  [WEAPON_ROWS.ultraSpark]: ultraSpark,
  [WEAPON_ROWS.armageddon]: armageddon,
  [WEAPON_ROWS.nemesisUltima]: nemesisUltima,
};

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are `[status number, byte]`
 * (2 Petrify, 3 Poison, 4 Power Break, 8 Confuse, 12 Sleep, 13 Silence, 24 Slow) and `durations` `[temporal slot, byte]` (0 Sleep, 1 Silence, 12 Slow). `flagsMisc` 0x52 carries accuracy formula 2 (bits 3 to 5) and Darkness
 * applies (0x40); 0x20086 is the Silence-gated flag with the reflectable bit; 0x15230006 pierces Armored. `flagsDamage` 0x80 is the 99,999 cap; `extra` 0x400 is Curse.
 */
export const COMMAND_RECORDS_WEAPONS: Readonly<Record<string, FFXCommandRecord>> = {
  [WEAPON_ROWS.ultimaAttack]: { id: 0x407f, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1, shatter: 10, rank: 3 },
  [WEAPON_ROWS.coreEnergy]: { id: 0x4022, type: 0, flagsMisc: 0x6, flagsDamage: 0x2, damageClass: 1, rank: 3 },
  [WEAPON_ROWS.shimmeringRain]: { id: 0x4023, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [WEAPON_ROWS.break]: { id: 0x604f, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0, rank: 3, chances: [[2, 254]] },
  [WEAPON_ROWS.silence]: { id: 0x606e, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0, rank: 3, chances: [[13, 100]], durations: [[1, 3]] },
  [WEAPON_ROWS.confuse]: { id: 0x6072, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0, rank: 3, chances: [[8, 100]] },
  [WEAPON_ROWS.sleep]: { id: 0x6071, type: 0, flagsMisc: 0x20086, flagsDamage: 0x0, damageClass: 0, rank: 3, chances: [[12, 100]], durations: [[0, 3]] },
  [WEAPON_ROWS.omegaAttack]: { id: 0x410f, type: 0, flagsMisc: 0x2, flagsDamage: 0x85, damageClass: 1, shatter: 100, rank: 3 },
  [WEAPON_ROWS.nova]: { id: 0x4067, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 },
  [WEAPON_ROWS.nemesisAttack]: { id: 0x40f0, type: 0, flagsMisc: 0x2, flagsDamage: 0x8d, damageClass: 1, shatter: 100, rank: 3 },
  [WEAPON_ROWS.etherealCannon]: { id: 0x40d8, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1, shatter: 100, rank: 3 },
  [WEAPON_ROWS.ultraSpark]: { id: 0x40d9, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, shatter: 100, rank: 3, extra: 0x400, chances: [[3, 254], [4, 254], [24, 254]], durations: [[12, 254]] },
  [WEAPON_ROWS.armageddon]: { id: 0x40f4, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, shatter: 100, rank: 3 },
  [WEAPON_ROWS.nemesisUltima]: { id: 0x40f3, type: 0, flagsMisc: 0x15230006, flagsDamage: 0x82, damageClass: 1, shatter: 100, rank: 3 },
};
