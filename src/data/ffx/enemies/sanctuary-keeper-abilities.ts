/**
 * The Sanctuary Keeper's three move rows (FFX only; the hidden Sanctuary Keeper chapter, number 39). **Source: the game's own move rows**, `research/re-ffx-sanctuary-keeper.md` section 5 ("RE 5"; `[bytes]`), and every
 * command record below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-2 table, rows 0x6042 to
 * 0x6044): the type, the two flag words, the damage class, the CTB rank (3 on all of them), the status chance and duration bytes, the extra-status word and the shatter byte.
 * `tests/unit/chapters/sanctuary-keeper-data.test.ts` pins each one to the fixtures.
 *
 * | Row | Id | Used by (RE 4) | The row |
 * |---|---|---|---|
 * | Photon Wings | `sanctuary-photon-wings` 0x6042 | the first turn of every cycle, on the whole front line | formula 9 (fixed), power 20, **neither physical nor magical** (flag word 0: Protect and Shell do not apply), accuracy formula 0 (**it never misses**); **Curse always** (extra word 0x400), and rolls for Confuse 25, Sleep 50, Silence 50, Darkness 50 (three turns each) |
 * | Mana Breath | `sanctuary-mana-breath` 0x6043 | the fourth turn of the cycle, on one living member (the script writes its MAG to 40 first) | formula 3 (magic), power 48, magical, accuracy formula 0 (**it never misses**), the **99,999 cap** (flag bit 0x80) |
 * | Tail Sweep | `sanctuary-tail-sweep` 0x6044 | the counter, on the whole front line | formula 1 (strength), power 12, physical, accuracy formula 2 on a byte of 100; **Delay Buster** (flag bit 0x4000: CTB damage of three times the target's tick speed); **removes Haste** (chance byte 255, a cleanse) |
 *
 * **The rows the script adds at init are not here**: Curaga 0x302D, Esuna 0x3033, Protect 0x303B, Reflect 0x303C, Regen 0x303E and the counter Haste 0x3036 are the player's own rows, used by their ids (`../sanctuary-keeper-ids.ts`
 * `SANCTUARY_ROWS`), as the Seymour, Evrae and possessed-aeon scripts do; so is the plain Attack 0x6000 (the enemy's `plainAttack`). Each is reflectable, which is the whole of the Keeper's Reflect trick.
 *
 * **Rule 5 (AGENTS.md):** Photon Wings and Mana Breath have accuracy formula 0, so they never miss (`canMiss: false`); Tail Sweep and the Attack roll (`accuracy` 100 and 90). Magic and every Overdrive always hit; here the one
 * magical row is Mana Breath, and it does.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication } from '../../../battle/common/types.ts';
import { SANCTUARY_ROWS } from '../sanctuary-keeper-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'bonusCrit' | 'statusEffects' | 'removesStatuses' | 'extra' | 'shatterChance' | 'canMiss' | 'accuracy' | 'rank'>>;

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

/**
 * 0x6042: formula 9 (fixed) power 20, flag word 0 (neither physical nor magical), accuracy formula 0 (never misses), Curse always, Confuse 25, Sleep 50, Silence 50, Darkness 50 (three turns each).
 * `groupTarget`: the script names the group (the front line), whatever the row's own multi flag says.
 */
export const photonWings: AbilityDef = row({
  id: SANCTUARY_ROWS.photonWings,
  name: 'Photon Wings',
  power: 20,
  formula: 'fixed',
  damageType: 'other',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  statusEffects: [apply('curse', 254), apply('confuse', 25), apply('sleep', 50, 3), apply('silence', 50, 3), apply('darkness', 50, 3)],
  extra: { groupTarget: true },
});

/** 0x6043: formula 3 (magic), power 48, magical, accuracy formula 0 (never misses), the 99,999 cap. */
export const manaBreath: AbilityDef = row({
  id: SANCTUARY_ROWS.manaBreath,
  name: 'Mana Breath',
  power: 48,
  formula: 'magic',
  damageType: 'magical',
  targeting: 'single-enemy',
  hits: 1,
  canMiss: false,
  flags: ['always-break-damage-limit'],
});

/**
 * 0x6044: formula 1, power 12, physical, accuracy formula 2 on a byte of 100, Delay Buster, and it takes Haste off (chance byte 255, a cleanse). `groupTarget`: the counter names the group (the front line).
 * `removesStatuses: ['haste']` and `strong-delay` restate the record for the intent line and the tests; the engine reads the record.
 */
export const tailSweep: AbilityDef = row({
  id: SANCTUARY_ROWS.tailSweep,
  name: 'Tail Sweep',
  power: 12,
  formula: 'strength',
  damageType: 'physical',
  targeting: 'all-enemies',
  hits: 1,
  accuracy: 100,
  flags: ['strong-delay', 'removes-statuses'],
  removesStatuses: ['haste'],
  extra: { groupTarget: true },
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const SANCTUARY_KEEPER_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [SANCTUARY_ROWS.photonWings]: photonWings,
  [SANCTUARY_ROWS.manaBreath]: manaBreath,
  [SANCTUARY_ROWS.tailSweep]: tailSweep,
};

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are `[status number, byte]`
 * (8 Confuse, 12 Sleep, 13 Silence, 14 Darkness, 23 Haste) and `durations` `[temporal slot, byte]` (0 Sleep, 1 Silence, 2 Darkness; 11 Haste). `flagsMisc` 6 and 6 and 0x4056 decide the accuracy formula (bits 3 to 5: 0, 0, 2) and
 * carry Delay Buster (0x4000). `extra` 0x400 is Curse.
 */
export const COMMAND_RECORDS_SANCTUARY_KEEPER: Readonly<Record<string, FFXCommandRecord>> = {
  [SANCTUARY_ROWS.photonWings]: { id: 0x6042, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 1, rank: 3, extra: 0x400, chances: [[8, 25], [12, 50], [13, 50], [14, 50]], durations: [[0, 3], [1, 3], [2, 3]] },
  [SANCTUARY_ROWS.manaBreath]: { id: 0x6043, type: 0, flagsMisc: 6, flagsDamage: 0x82, damageClass: 1, rank: 3 },
  [SANCTUARY_ROWS.tailSweep]: { id: 0x6044, type: 0, flagsMisc: 0x4056, flagsDamage: 0x21, damageClass: 1, rank: 3, chances: [[23, 255]], durations: [[11, 254]] },
};
