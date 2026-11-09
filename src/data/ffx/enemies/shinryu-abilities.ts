/**
 * Shinryu's move rows (FFX only; the hidden Shinryu chapter, number 48). **Source: the game's own move rows**, `research/re-ffx-shinryu.md` section 3 ("RE 3"; `[R]`: monster-magic-1 rows 240, 246 and 191), and every
 * command record below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`): the type, the two flag words, the damage class, the
 * critical bonus, the CTB rank (3 on all three), the shatter byte and the status chance bytes. `tests/unit/chapters/shinryu-data.test.ts` pins each one to the fixtures.
 *
 * | Row | Id | Used by (RE 2) | The row |
 * |---|---|---|---|
 * | Attack | `shinryu-attack` 0x40F0 | Shinryu's turn (a third of them) and **the counter to every hit that takes HP** | physical, formula 1, power 16, one target; crit 10; the 99,999 cap bit; accuracy formula 0 |
 * | Eraser | `shinryu-eraser` 0x40F6 | Shinryu's turn, a third, while more than one member lives | magical, formula 3, **power 0** (no damage), one target; **Petrify at 255**; the cap bit |
 * | Shining | `shinryu-shining` 0x40BF | Shinryu's turn, a third | magical, formula 3, power 9, **8 hits**; the cap 9,999 |
 *
 * **Chance 255 is "always lands, whatever the resistance"** (`research/re-ffx-ctb-status.md` section 6: the chance is 255, or the resistance is not 255 and ...; `battle/ffx/kernel/status-inflict.ts#statusLanding`), which is how the
 * guides' "Eraser ignores Ribbon and Stoneproof" is true; in this formation (the water flag) the Petrify that lands is a shatter (`adapt/status.ts`). The T0 check is `tests/unit/chapters/shinryu-engine.test.ts`.
 *
 * **Shining's targeting is a reading, said:** the script aims it at the whole front line (`performCommand` on the group), and the row's damage word is **0x8006 with damage flags 0x2**, the same words as Evrae Altana's
 * Photon Spray (0x604B: `flooded-ways-abilities.ts`), whose eight hits each re-roll their target among the front line (the guides and the airship note, `research/re-ffx-geosgaeno-evrae-altana.md` 4.3). So Shining is `random-enemy`
 * with 8 hits, as the Spray is; the note's own arithmetic stops at "one hit of eight" and "all eight on one target" (RE 4) and names the spread **unmapped**. The reading changes no number of the row.
 *
 * **Rule 5 (AGENTS.md): every row has accuracy formula 0, so none misses** (`canMiss: false`). The rows' animations and sounds are not modelled.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication } from '../../../battle/common/types.ts';
import { SHINRYU_ROWS } from '../shinryu-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> & Partial<Pick<AbilityDef, 'flags' | 'bonusCrit' | 'statusEffects' | 'shatterChance'>>;

/** The columns every row shares: a monster move of rank 3, no MP, no element, accuracy formula 0 (never misses). */
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
    canMiss: false, // accuracy formula 0 (RE 3; AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

const apply = (status: StatusApplication['status'], chance: number, duration = 254): StatusApplication => ({ status, chance, duration });
/** The shatter byte the record carries on all three rows (100: a Petrified target shatters on the hit), the record's own. */
const SHATTER = 100;

/** 0x40F0: physical, formula 1, power 16; crit bonus 10; the damage word 0x8D (physical, can crit, the equipment crit bonus, the 99,999 cap). */
export const shinryuAttack: AbilityDef = row({
  id: SHINRYU_ROWS.attack, name: 'Attack', power: 16, formula: 'strength', damageType: 'physical', targeting: 'single-enemy', hits: 1, bonusCrit: 10,
  flags: ['crit-eligible', 'adds-equipment-crit', 'always-break-damage-limit'], shatterChance: SHATTER,
});

/**
 * 0x40F6: magical, formula 3, power 0 (the Petrify is the whole of it), the 99,999 cap bit, Petrify at 255. **`formula: 'none'`, as the party's Shell is** (a status-only row: the game's record carries formula byte 3, Magic, which
 * `FORMULA_BYTE_OVERRIDES` in `battle/ffx/ai/command-formula.ts` keeps for the scripts that read it): a `'magic'` row of power 0 would emit a damage event of 0 on the victim, and the presenter draws that as a "0" numeral
 * (found by a probe; the Penance chapter's Mighty Guard has the same note).
 */
export const shinryuEraser: AbilityDef = row({
  id: SHINRYU_ROWS.eraser, name: 'Eraser', power: 0, formula: 'none', damageType: 'magical', targeting: 'single-enemy', hits: 1, flags: ['always-break-damage-limit'],
  statusEffects: [apply('petrify', 255)], shatterChance: SHATTER,
});

/** 0x40BF: magical, formula 3, power 9, eight hits, the 9,999 cap; each hit re-rolls its target among the front line (the Photon Spray's words; see the header). */
export const shinryuShining: AbilityDef = row({
  id: SHINRYU_ROWS.shining, name: 'Shining', power: 9, formula: 'magic', damageType: 'magical', targeting: 'random-enemy', hits: 8, shatterChance: SHATTER,
});

/** Every row, for the data index (`./hidden-ffx.ts`). */
export const SHINRYU_ABILITIES: Readonly<Record<string, AbilityDef>> = Object.fromEntries([shinryuAttack, shinryuEraser, shinryuShining].map((a) => [a.id, a]));

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (2 Petrify). `flagsMisc` 2 and 6 give accuracy formula 0; 32774 (0x8006) is the Photon Spray's word.
 */
export const COMMAND_RECORDS_SHINRYU: Readonly<Record<string, FFXCommandRecord>> = {
  [SHINRYU_ROWS.attack]: { id: 0x40f0, type: 0, flagsMisc: 2, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100 },
  [SHINRYU_ROWS.eraser]: { id: 0x40f6, type: 0, flagsMisc: 6, flagsDamage: 0x82, damageClass: 1, rank: 3, shatter: 100, chances: [[2, 255]] },
  [SHINRYU_ROWS.shining]: { id: 0x40bf, type: 0, flagsMisc: 32774, flagsDamage: 2, damageClass: 1, rank: 3, shatter: 100 },
};
