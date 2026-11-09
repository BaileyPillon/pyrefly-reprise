/**
 * Spherimorph's seven move rows (FFX only; the hidden Spherimorph chapter, number 41). **Source: the game's own move rows**, `research/re-ffx-spherimorph.md` section 5 ("RE 5"; `[bytes]`), and every command
 * record below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-2 table, rows 0x6036,
 * 0x6039 to 0x603C and 0x603F): the type, the two flag words, the damage class, the CTB rank (3 on all of them), the status chance and duration bytes. `tests/unit/chapters/spherimorph-data.test.ts` pins each one to the
 * fixtures.
 *
 * | Row | Id | Used by (RE 4) | The row |
 * |---|---|---|---|
 * | Fire, Blizzard, Thunder, Water | `spherimorph-fire` 0x6039, `-blizzard` 0x603A, `-thunder` 0x603B, `-water` 0x603C | the monster-side answer to magic and to Scan, on the whole front line | formula 3 (magic), power 16, magical, accuracy formula 0 (**never misses**), one element each, reflectable |
 * | Press | `spherimorph-press` 0x603F | its own turn below half HP, 50.03 percent of the turns, on the whole front line | formula 5 (a share of the target's **current** HP), power 8 (half), **physical** (Protect halves it), accuracy formula 0 (never misses), no variance |
 * | Elemental Shift | `spherimorph-elemental-shift` 0x6036 | the no-damage action it queues on itself after a shift | no formula, no power, no hits |
 *
 * **The rows the script adds at init and uses on the attacker are not here**: Blizzard 0x3041, Fire 0x3042, Thunder 0x3043 and Water 0x3044 are the player's own rows (formula 3, power 12, MP 4, reflectable), used
 * by their ids (`../spherimorph-ids.ts` `SPHERIMORPH_ROWS`), as the Seymour, Anima and Keeper scripts use theirs; so is the plain Attack 0x6000 (the enemy's `plainAttack`). The row 0x6067 "Death" (forced on death) is
 * not modelled: the death animation is "Boss" (the body stays), which the engine's victory already is.
 *
 * **Rule 5 (AGENTS.md):** the spells and Press have accuracy formula 0, so they never miss (`canMiss: false`); the Attack rolls.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import { SPHERIMORPH_ROWS } from '../spherimorph-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> &
  Partial<Pick<AbilityDef, 'category' | 'flags' | 'element' | 'statusEffects' | 'removesStatuses' | 'extra' | 'canMiss' | 'accuracy' | 'rank' | 'messageTemplate'>>;

/** The columns every row shares: a monster move of rank 3, no MP, no element unless the row names one. */
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

/** One of the four monster-side spells: formula 3, power 16, magical, never misses; the script names the front line (`groupTarget`). */
function spell(id: string, name: string, element: 'fire' | 'ice' | 'lightning' | 'water'): AbilityDef {
  return row({ id, name, power: 16, formula: 'magic', damageType: 'magical', targeting: 'all-enemies', hits: 1, canMiss: false, element: [element], extra: { groupTarget: true } });
}

/** 0x6039 Fire. */
export const spherimorphFire: AbilityDef = spell(SPHERIMORPH_ROWS.fire, 'Fire', 'fire');
/** 0x603A Blizzard. */
export const spherimorphBlizzard: AbilityDef = spell(SPHERIMORPH_ROWS.blizzard, 'Blizzard', 'ice');
/** 0x603B Thunder. */
export const spherimorphThunder: AbilityDef = spell(SPHERIMORPH_ROWS.thunder, 'Thunder', 'lightning');
/** 0x603C Water. */
export const spherimorphWater: AbilityDef = spell(SPHERIMORPH_ROWS.water, 'Water', 'water');

/**
 * 0x603F: formula 5 (a share of the target's current HP), power 8 (8 of 16, half), physical, accuracy formula 0 (never misses). No variance, so it is exactly half of the target's HP at the moment it lands, and it
 * never kills. Protect halves it (physical class). `groupTarget`: the script names the group (the front line).
 */
export const spherimorphPress: AbilityDef = row({
  id: SPHERIMORPH_ROWS.press,
  name: 'Press',
  power: 8,
  formula: 'percent-current',
  damageType: 'physical',
  targeting: 'all-enemies',
  hits: 1,
  canMiss: false,
  extra: { groupTarget: true },
});

/** 0x6036: no formula, no power, no hits; aimed at itself. It changes nothing by itself (the shift is written by the script at once); it is the action the shift plays. */
export const spherimorphShift: AbilityDef = row({
  id: SPHERIMORPH_ROWS.shift,
  name: 'Elemental Shift',
  power: 0,
  formula: 'none',
  damageType: 'other',
  targeting: 'self',
  hits: 0,
  canMiss: false,
  messageTemplate: '{user} uses Elemental Shift',
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const SPHERIMORPH_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [SPHERIMORPH_ROWS.fire]: spherimorphFire,
  [SPHERIMORPH_ROWS.blizzard]: spherimorphBlizzard,
  [SPHERIMORPH_ROWS.thunder]: spherimorphThunder,
  [SPHERIMORPH_ROWS.water]: spherimorphWater,
  [SPHERIMORPH_ROWS.press]: spherimorphPress,
  [SPHERIMORPH_ROWS.shift]: spherimorphShift,
};

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. The four spells carry
 * flag word 0x20086 (bit 0x80 reflectable, bit 0x20000 gated by Silence), damage flags 2 (magical) and damage class 1 (HP); Press carries flag word 6, damage flags 1 (physical) and damage class 1; the shift carries
 * flag word 6 and no damage at all.
 */
export const COMMAND_RECORDS_SPHERIMORPH: Readonly<Record<string, FFXCommandRecord>> = {
  [SPHERIMORPH_ROWS.fire]: { id: 0x6039, type: 0, flagsMisc: 0x20086, flagsDamage: 2, damageClass: 1, rank: 3 },
  [SPHERIMORPH_ROWS.blizzard]: { id: 0x603a, type: 0, flagsMisc: 0x20086, flagsDamage: 2, damageClass: 1, rank: 3 },
  [SPHERIMORPH_ROWS.thunder]: { id: 0x603b, type: 0, flagsMisc: 0x20086, flagsDamage: 2, damageClass: 1, rank: 3 },
  [SPHERIMORPH_ROWS.water]: { id: 0x603c, type: 0, flagsMisc: 0x20086, flagsDamage: 2, damageClass: 1, rank: 3 },
  [SPHERIMORPH_ROWS.press]: { id: 0x603f, type: 0, flagsMisc: 6, flagsDamage: 1, damageClass: 1, rank: 3 },
  [SPHERIMORPH_ROWS.shift]: { id: 0x6036, type: 0, flagsMisc: 6, flagsDamage: 0, damageClass: 0, rank: 3 },
};
