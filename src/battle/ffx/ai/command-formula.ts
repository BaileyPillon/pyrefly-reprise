/**
 * **The damage-formula byte of a command, as the boss scripts read it** (re-parity, AI lane C; **FFX only**).
 *
 * Two scripts of the Evrae / Sin lane branch on `readCommandProperty(command, damageFormula)`
 * (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` sections 2.5 and 6.3):
 *
 * - **Evrae's Stone Gaze counter** rises by 2 for a command whose formula byte is 1 and by 1 for one whose byte is 3; every
 *   other byte counts nothing. A command that uses the character's weapon reads Evrae's own record, whose byte is 1.
 * - **Sinspawn Genais** answers a command whose byte is 3 with Waterga, when it is out of its shell.
 *
 * The byte is not our `AbilityDef.formula`: the ability data was authored from the damage chain, and a status-only spell
 * (Shell, Esuna, Scan ...) has `formula: 'none'` there while the game's record carries the Magic formula, 3; Wakka's reels and
 * Zanmato are minigame shells in our data and Attack-formula (1) rows in the game's. {@link FORMULA_BYTE_OVERRIDES} lists the
 * records where the two readings fall in different classes (1, 3 or other), keyed by the game's command id, numbers only; for
 * every other ability our formula number is the game's class, which `tests/unit/re-parity-ai-evrae-gaze.test.ts` proves for all
 * 451 shipped abilities that carry a record against the game's command tables (the table is the scratch evidence outside the
 * repo: `D:\Tools\ffx-parity\ai\ffx-evrae-yojimbo-isaaru-sin\q-gaze.mjs`).
 */

import type { AbilityDef, FFXCombatant } from '../../common/types.ts';
import { resolveCommand } from '../adapt/command.ts';

/** Record word 0x1c, bit 18: the command uses the user's weapon (the game's `weaponProps`). */
const USES_WEAPON = 0x40000;

/** The damage-formula byte for the records where our formula number would put the command in the wrong class. */
export const FORMULA_BYTE_OVERRIDES: Readonly<Record<number, number>> = {
  0x2038: 3, // Lunar Curtain
  0x2039: 3, // Light Curtain
  0x203a: 3, // Star Curtain
  0x203b: 3, // Healing Spring
  0x3020: 3, // Lancet
  0x302e: 3, // NulFrost
  0x302f: 3, // NulBlaze
  0x3030: 3, // NulShock
  0x3031: 3, // NulTide
  0x3032: 3, // Scan
  0x3033: 3, // Esuna
  0x303a: 3, // Shell
  0x303b: 3, // Protect
  0x303c: 3, // Reflect
  0x303d: 3, // Dispel
  0x303e: 3, // Regen
  0x3040: 3, // Auto,Life
  0x3074: 1, // Element Reels
  0x3075: 1, // Attack Reels
  0x3076: 1, // Status Reels
  0x3077: 1, // Aurochs Reels
  0x30ad: 1, // Panacea
  0x30b5: 3, // NulAll
  0x30b6: 3, // Mega NulAll
  0x30b7: 3, // Hyper NulAll
  0x30b8: 3, // Ultra NulAll
  0x30b9: 3, // Mighty Wall
  0x30ba: 3, // Mighty G
  0x30bb: 3, // Super Mighty G
  0x30bc: 3, // Hyper Mighty G
  0x30bd: 3, // Vitality
  0x30be: 3, // Mega Vitality
  0x30bf: 3, // Hyper Vitality
  0x30c0: 3, // Mana
  0x30c1: 3, // Mega Mana
  0x30c2: 3, // Hyper Mana
  0x30c3: 3, // Freedom
  0x30c4: 3, // Freedom X
  0x30c5: 3, // Quartet of 9
  0x30c6: 3, // Trio of 9999
  0x30c7: 3, // Hero Drink
  0x30c8: 3, // Miracle Drink
  0x30c9: 3, // Hot Spurs
  0x30ca: 3, // Eccentrick
  0x30e2: 1, // Zanmato
  0x312d: 3, // NulAll
  0x4038: 3, // Stone Gaze
  0x6040: 3, // Remedy
  0x6041: 3, // Shremedy
  0x604f: 3, // Break
  0x6050: 3, // Banish
  0x6062: 3, // Stone Gaze (Evrae's own record, which re-parity W2 attached to the ability by its status bytes; 0x4038 is the Petrify-50 record of the same name)
  0x606e: 3, // Silence
  0x6070: 3, // Blind
  0x6071: 3, // Sleep
  0x6082: 3, // Mega Death
  0x60df: 1, // Oblivion
};

/** The formula byte the game's scripts see for this command when `user` uses it. */
export function formulaByteOf(def: AbilityDef, user: FFXCombatant): number {
  const resolved = resolveCommand(def, user);
  if ((resolved.flagsMisc & USES_WEAPON) !== 0) return 1;
  const recordId = def.record?.id;
  const override = recordId === undefined ? undefined : FORMULA_BYTE_OVERRIDES[recordId];
  return override ?? resolved.formula;
}

/** Evrae's Stone Gaze counter step for a command (note section 2.5): byte 1 is 2, byte 3 is 1, the rest 0. */
export function gazeStepOf(def: AbilityDef, user: FFXCombatant): 0 | 1 | 2 {
  const f = formulaByteOf(def, user);
  return f === 1 ? 2 : f === 3 ? 1 : 0;
}

/** True when the game reads this command's formula byte as 3 (spells, Lancet, Scan and the support spells with that byte). */
export function isFormulaThree(def: AbilityDef, user: FFXCombatant): boolean {
  return formulaByteOf(def, user) === 3;
}
