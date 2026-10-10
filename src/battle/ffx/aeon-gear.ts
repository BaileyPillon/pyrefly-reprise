/**
 * What an aeon's fixed gear gives it, and how long it stays away after a wipe (re-parity W5; **FFX only**).
 *
 * The game builds an aeon's battle character with the same stat function as a party member's, and every aeon wears two
 * fixed pieces of gear (a weapon and an armour, `Save+0x2d` and `+0x2e`). Running that function for each aeon with its starting
 * gear gives (`research/re-ffx-overdrive-steal-aeons.md` sections 4.5, 4.6 and 4.8; FFX.exe build 25501027, the
 * party-stats builder at VA 0x0079c5f0 and the recovery value in `ply_rom` byte 0x2b):
 *
 * - **the equipment critical bonus is 6 for every aeon** (3 from each piece), so an aeon's critical chance is
 *   `Luck - target Luck + 6` on the commands that take the bonus (the earlier note, `re-ffx-commands.md` section 5, said 0);
 * - **auto-ability word A** (`Chr+0x6bc`) is 0x2001 for every aeon but Valefor (0x0001): Pierce (bit 0x2000) on nine of the ten;
 * - **auto-ability word B** (`Chr+0x6be`) is 0x0600 (Break HP Limit and Break MP Limit) for all, and 0x0e00 (Break Damage Limit
 *   as well, bit 0x800) for Bahamut, Anima and the three Magus Sisters, so every hit of those five can pass 9,999;
 * - **the recovery count** is the number of battles a fallen aeon stays away: Valefor 8, Ifrit 12, Ixion 20, Shiva 20,
 *   Bahamut 24, Anima 24, Yojimbo 24 and each Magus Sister 30.
 *
 * The Aeon Ribbon's immunities and the elemental absorbs of Ifrit, Ixion and Shiva are the same facts read from the same
 * gear; the engine already carries them (`setup.ts`: `AEON_INNATE_IMMUNITIES`, `AEON_INNATE_AFFINITIES`, identical to the
 * game's, `research/re-ffx-overdrive-steal-aeons.md` A5). The stat rows stay the authored Yuna aeon rows, which equal the
 * kernel's output for the declared Yuna profiles in all 300 numbers (A1).
 */

import type { FFXCombatant } from '../common/types.ts';

/** One aeon's fixed gear, as the stat builder reads it. */
export interface AeonGear {
  /** `Chr+0x5d8`: the equipment critical bonus, a percentage point count. */
  critBonus: number;
  /** `Chr+0x6bc`: auto-ability word A. */
  autoA: number;
  /** `Chr+0x6be`: auto-ability word B (the gauge bits 0x1 to 0x8 are never set by an aeon's gear). */
  autoB: number;
  /** `ply_rom` byte 0x2b: the battles a fallen aeon stays away. */
  recovery: number;
}

const PIERCE = 0x2001;
const BREAK_HP_MP = 0x0600;
const BREAK_ALL = 0x0e00;

/** The ten aeons, by engine id. */
export const AEON_GEAR: Readonly<Record<string, AeonGear>> = {
  valefor: { critBonus: 6, autoA: 0x0001, autoB: BREAK_HP_MP, recovery: 8 },
  ifrit: { critBonus: 6, autoA: PIERCE, autoB: BREAK_HP_MP, recovery: 12 },
  ixion: { critBonus: 6, autoA: PIERCE, autoB: BREAK_HP_MP, recovery: 20 },
  shiva: { critBonus: 6, autoA: PIERCE, autoB: BREAK_HP_MP, recovery: 20 },
  bahamut: { critBonus: 6, autoA: PIERCE, autoB: BREAK_ALL, recovery: 24 },
  anima: { critBonus: 6, autoA: PIERCE, autoB: BREAK_ALL, recovery: 24 },
  yojimbo: { critBonus: 6, autoA: PIERCE, autoB: BREAK_HP_MP, recovery: 24 },
  cindy: { critBonus: 6, autoA: PIERCE, autoB: BREAK_ALL, recovery: 30 },
  sandy: { critBonus: 6, autoA: PIERCE, autoB: BREAK_ALL, recovery: 30 },
  mindy: { critBonus: 6, autoA: PIERCE, autoB: BREAK_ALL, recovery: 30 },
};

/** The gear of an aeon combatant. An aeon this table does not know is an error: nothing is guessed. */
export function aeonGearOf(c: FFXCombatant): AeonGear {
  const gear = AEON_GEAR[c.id];
  if (gear === undefined) throw new Error(`FFX engine: aeon '${c.id}' has no fixed gear row (aeon-gear.ts)`);
  return gear;
}
