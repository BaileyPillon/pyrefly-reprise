/**
 * Penance's and the arms' move rows (FFX only; the hidden Penance chapter, number 35). **Source: the game's own move rows**, `research/re-ffx-penance.md` section 4.1 ("RE 4.1"; `[bytes]`), and every command record
 * below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-1 table, rows 0x411F to 0x412A):
 * the type, the two flag words, the damage class, the CTB rank (3 on all of them), the status chance and duration bytes, the extra-status word and the shatter byte. `tests/unit/chapters/penance-data.test.ts` pins
 * each one to the fixtures.
 *
 * | Row | Id | Used by (RE 4 and 5) | The row |
 * |---|---|---|---|
 * | Obliteration | `penance-obliteration` 0x4120 | Penance, phase 1, every turn | physical, formula 1, power 24, the whole front line; Slow at 254 |
 * | Immolation | `penance-immolation` 0x411F | Penance, phase 2 | physical, formula 1, power 32, one target; **HP and MP**; Armor Break and Mental Break at 254 |
 * | Judgment Day | `penance-judgment-day` 0x4121 | Penance, the counter at 20 and both arms up | formula 15 (the Magic cube, no defence), power 240, the whole front line; **HP and MP**; **neither physical nor magical**: no Protect or Shell halving |
 * | Separation | `penance-separation` 0x4122 | Penance on itself at the change | no hit: a scene row |
 * | Death | `penance-death` 0x4124 | Penance's death | no hit: a scene row |
 * | Regeneration | `penance-regeneration` 0x4125 | an arm's return | no hit: a scene row |
 * | Atrophy | `penance-atrophy` 0x4126 | an arm's death | no hit: a scene row |
 * | Tera Graviton | `penance-tera-graviton` 0x4129 | the Left Arm, 1 in 3 | magical, formula 8 (a fraction of the maximum), power 12 (12/16, three quarters), the whole front line; Sleep, Silence, Darkness and Slow at 254; **Doom** |
 * | Mighty Guard | `penance-mighty-guard` 0x412A | the Right Arm, 1 in 3 when Penance has no Regen | no damage; Shell, Protect and Regen at 254 on the script's group |
 *
 * **Not here, reused:** the Right Arm's Attack 0x4127 (Petrify), Calamity 0x4104 and the Left Arm's dispelling Attack 0x412B are the Dark Aeons' rows, the same game rows (`dark-sandy-attack`, `dark-calamity`,
 * `dark-cindy-attack`: `./dark-aeons-abilities.ts`; the Left Arm's name table shows a placeholder, "Extra 44"); the Left Arm's Slowga 0x3039 is the party's own row (`slowga`, `../abilities/whitemagic-haste-slow.ts`).
 * Attack 0x4000 and Appearance 0x4123 sit in the three command lists and no hook calls them (RE 4.1), so they have no row here.
 *
 * **Rule 5 (AGENTS.md): every row has accuracy formula 0, so it never misses** (`canMiss: false`). **The 99,999 cap:** every damaging row sets the record's cap bit (bit 7 of the damage word), so `always-break-damage-limit`
 * is on each of them and an Armor-Broken member takes 99,999 from the next physical hit. The rows' animations and sounds are not modelled.
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';
import { PENANCE_ROWS } from '../penance-ids.ts';

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> & Partial<Pick<AbilityDef, 'flags' | 'statusEffects' | 'extra' | 'shatterChance'>>;

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
    flags: ['always-break-damage-limit'], // the record's cap bit 7
    canMiss: false, // accuracy formula 0 (RE 4.1; AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

const apply = (status: StatusId, duration = 254): StatusApplication => ({ status, chance: 254, duration });
/** The shatter byte of the rows that carry one (100: a Petrified target shatters on the hit), the record's own. */
const SHATTER = 100;

const single: Targeting = 'single-enemy'; // "enemy" is the user's opposite side: the party, for a monster
const group: Targeting = 'all-enemies';
/** A row with no hit record at all: a scene the script plays (Separation, Death, Regeneration, Atrophy). */
const scene = (id: string, name: string): AbilityDef => row({ id, name, power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 0, flags: [] });

/** 0x4120: formula 1, power 24, shatter 100, Slow 254 (duration 254), the whole front line. */
export const obliteration: AbilityDef = row({
  id: PENANCE_ROWS.obliteration, name: 'Obliteration', power: 24, formula: 'strength', damageType: 'physical', targeting: group, hits: 1, statusEffects: [apply('slow')], shatterChance: SHATTER,
});
/** 0x411F: formula 1, power 32, shatter 100, HP and MP (damage class 3), Armor Break and Mental Break 254. */
export const immolation: AbilityDef = row({
  id: PENANCE_ROWS.immolation, name: 'Immolation', power: 32, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, statusEffects: [apply('armor-break'), apply('mental-break')], shatterChance: SHATTER,
});
/** 0x4121: formula 15 (the Magic cube, no defence term), power 240, HP and MP, **neither physical nor magical** (the damage word is the cap bit alone), the whole front line. */
export const judgmentDay: AbilityDef = row({
  id: PENANCE_ROWS.judgmentDay, name: 'Judgment Day', power: 240, formula: 'special-magic', damageType: 'other', targeting: group, hits: 1, shatterChance: SHATTER,
});
export const separation: AbilityDef = scene(PENANCE_ROWS.separation, 'Separation');
export const death: AbilityDef = scene(PENANCE_ROWS.death, 'Death');
export const regeneration: AbilityDef = scene(PENANCE_ROWS.regeneration, 'Regeneration');
export const atrophy: AbilityDef = scene(PENANCE_ROWS.atrophy, 'Atrophy');
/** 0x4129: formula 8 (a fraction of the target's maximum), power 12, magical, the whole front line; Sleep, Silence and Darkness for 99, Slow 254; the extra word 0x4000 is Doom. */
export const teraGraviton: AbilityDef = row({
  id: PENANCE_ROWS.teraGraviton, name: 'Tera Graviton', power: 12, formula: 'percent-total', damageType: 'magical', targeting: group, hits: 1,
  statusEffects: [apply('sleep', 99), apply('silence', 99), apply('darkness', 99), apply('slow')],
});
/**
 * 0x412A: no damage, Shell, Protect and Regen at 254 on the script's own group (Penance, the Right Arm itself, and the Left Arm while it stands): `all-allies` with `groupTarget`, so the script names who it reaches
 * and the row's own multi flag never decides it. **`formula: 'none'`, as the party's Shell is** (a status spell: the game's record carries formula byte 3, Magic, which `FORMULA_BYTE_OVERRIDES` in
 * `battle/ffx/ai/command-formula.ts` keeps for the scripts that read it): a `'magic'` row of power 0 would emit a damage event of 0 on each of the three, and the presenter draws that as a "0" numeral.
 */
export const mightyGuard: AbilityDef = row({
  id: PENANCE_ROWS.mightyGuard, name: 'Mighty Guard', power: 0, formula: 'none', damageType: 'other', targeting: 'all-allies', hits: 1, flags: [],
  statusEffects: [apply('shell'), apply('protect'), apply('regen')], extra: { groupTarget: true },
});

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (6 Armor Break, 7 Mental Break, 12 Sleep, 13 Silence, 14 Darkness, 15 Shell, 16 Protect, 22 Regen, 24 Slow) and `durations` `[slot, byte]` (0 Sleep, 1 Silence, 2 Darkness, 3 Shell, 4 Protect,
 * 10 Regen, 12 Slow); `extra` is the extra-status word (0x4000 Doom). Rank 3 on all of them.
 */
export const COMMAND_RECORDS_PENANCE: Readonly<Record<string, FFXCommandRecord>> = {
  [PENANCE_ROWS.immolation]: { id: 0x411f, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 3, rank: 3, shatter: 100, chances: [[6, 254], [7, 254]] },
  [PENANCE_ROWS.obliteration]: { id: 0x4120, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100, chances: [[24, 254]], durations: [[12, 254]] },
  [PENANCE_ROWS.judgmentDay]: { id: 0x4121, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 3, rank: 3, shatter: 100 },
  [PENANCE_ROWS.separation]: { id: 0x4122, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [PENANCE_ROWS.death]: { id: 0x4124, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [PENANCE_ROWS.regeneration]: { id: 0x4125, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [PENANCE_ROWS.atrophy]: { id: 0x4126, type: 0, flagsMisc: 0x2, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [PENANCE_ROWS.teraGraviton]: {
    id: 0x4129, type: 0, flagsMisc: 0x4000006, flagsDamage: 0x82, damageClass: 1, rank: 3, chances: [[12, 254], [13, 254], [14, 254], [24, 254]], durations: [[0, 99], [1, 99], [2, 99], [12, 254]], extra: 0x4000,
  },
  [PENANCE_ROWS.mightyGuard]: { id: 0x412a, type: 0, flagsMisc: 0x4000006, flagsDamage: 0x0, damageClass: 0, rank: 3, chances: [[15, 254], [16, 254], [22, 254]], durations: [[3, 254], [4, 254], [10, 254]] },
};

/** Every new row, for the data index (`./hidden-ffx.ts`). */
export const PENANCE_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [PENANCE_ROWS.obliteration]: obliteration,
  [PENANCE_ROWS.immolation]: immolation,
  [PENANCE_ROWS.judgmentDay]: judgmentDay,
  [PENANCE_ROWS.separation]: separation,
  [PENANCE_ROWS.death]: death,
  [PENANCE_ROWS.regeneration]: regeneration,
  [PENANCE_ROWS.atrophy]: atrophy,
  [PENANCE_ROWS.teraGraviton]: teraGraviton,
  [PENANCE_ROWS.mightyGuard]: mightyGuard,
};
