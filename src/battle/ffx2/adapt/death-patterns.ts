/**
 * The death pattern of each shipped boss (re-parity RC9, lane X2-E, row XE5; **FFX-2 only**).
 *
 * Every boss script's init entry opens with `setdeathpat` (stat id 211, `kernel/stat-setter.ts`), which stores one byte in the character (`Chr+0x2d8`, and the copy a revive
 * restores, `+0x2da`): 0 is the pattern that falls and **can be raised**; any other value (1 falls, 2 fades out, 3 pyreflies, 4 explodes, 5 and 8 break, 9 and 10 explode) is a
 * pattern that **cannot be raised**: the KO routine takes the character out of the battle at its death, and the Auto-Life check refuses it (note FFX2-G05 3.10; the Auto-Life test is
 * `kernel/status-timers-set.ts#hasAutoLife`, whose second argument is this byte being non-zero). A girl's pattern is never written (party slots are left alone) and stays the game's
 * default, 0.
 *
 * Keyed by the monster row (`table/row` of `monster.bin`, or `monster2.bin` for the Oversoul Paragon: the row is the compiled package's number, `m243` is row 243), which every shipped
 * enemy carries (`EnemyDef.ffx2Record`). Source: the first `setstat` of each compiled package's init (`tests/fixtures/parity/ffx2/stat_setter_usage.json`, FFX2-G05 4.1 and 4.2), pinned
 * row for row by `parity-ffx2-stat-setter-engine.test.ts`. Left out, not guessed: row 328 (the Fiend Arena's own package: it holds two actors that write 1 and 2, and which one the
 * monster is was not read; the arena Trema does not need it, because the engine builds it from the story's Trema and it wears that Trema's row 1/295 and so carries 1, which is inert), the Oversoul Paragon's own package (`o152` has no compiled package in the extract; the note reads the pattern, 1, from its source text), and every monster the
 * note's 36 packages do not include (Valefor at Besaid, Yojimbo, Daigoro, Angra Mainyu, Zarich and Tawrich): their packages were not read, so they keep 0 as before.
 */

import type { Ffx2Unit } from '../internal.ts';

/** `table/row` to the byte the package's init writes. */
export const DEATH_PATTERN_OF_ROW: Readonly<Record<string, number>> = {
  '1/135': 2, // Dr. Goon
  '1/138': 2, // Fem-Goon
  '1/152': 1, // Paragon
  '2/152': 1, // Oversoul Paragon (the note's reading of the source text)
  '1/166': 1, // Ixion
  '1/167': 1, // Shiva
  '1/168': 1, // Bahamut
  '1/169': 1, // Anima
  '1/171': 1, // Cindy
  '1/172': 1, // Sandy
  '1/173': 1, // Mindy
  '1/176': 1, // Baralai
  '1/177': 1, // Gippal
  '1/194': 1, // the Experiment
  '1/243': 1, // Ormi, Act I
  '1/244': 1, // Ormi, Act II
  '1/245': 2, // Ormi, Act III
  '1/249': 1, // Logos, Act II
  '1/250': 2, // Logos, Act III
  '1/253': 2, // Leblanc
  '1/258': 1, // Nooj
  '1/260': 2, // Shuyin
  '1/282': 1, // Vegnagun, the Tail
  '1/283': 1, // Vegnagun, the Leg
  '1/284': 4, // Node A
  '1/285': 4, // Node B
  '1/286': 4, // Node C
  '1/287': 1, // Vegnagun, the Body
  '1/288': 0, // the Right Bulwark: falls, and the Core raises it
  '1/289': 0, // the Left Bulwark
  '1/290': 1, // Vegnagun, the Head
  '1/291': 0, // the Right Redoubt: falls, and the Head raises it
  '1/292': 0, // the Left Redoubt
  '1/295': 1, // Trema
};

/** The byte this unit's script writes at init, or `undefined` when the engine has no source for it (see the header). */
export function deathPatternOf(unit: Ffx2Unit): number | undefined {
  const record = unit.enemy?.ffx2Record;
  return record === undefined ? undefined : DEATH_PATTERN_OF_ROW[`${record.table}/${record.row}`];
}

/** Does this unit leave the battle when it falls, so that no Raise and no Auto-Life finds it? Every pattern but 0. (That a Raise cannot find it is [I], FFX2-G05 section 8; the Auto-Life refusal is read.) */
export function leavesOnDeath(unit: Pick<Ffx2Unit, 'deathPattern'>): boolean {
  return (unit.deathPattern ?? 0) !== 0;
}
