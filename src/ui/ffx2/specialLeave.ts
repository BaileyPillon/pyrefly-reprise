/**
 * The way-out row of a Special form (step D1 of the Special look; FFX-2 only: the three Special dresspheres exist only in FFX-2).
 *
 * Inside a form the main's one Change row is the engine's way out: a `spherechange` back to the dress she stood on, whose `label` is that dress's raw id and whose `help` reads
 * `Leave Floral Fallal`. Nothing printed that line before; the row read the old dress's name ("Gunner"). {@link leaveLabelOf} gives the menu the line, so the row and the help band
 * read "Leave <Special>". An ordinary Change row, and the Special Dress Up entry row, answer `null` and are drawn as they were.
 */

import type { AvailableCommand } from '../../battle/common/types.ts';

/** `Leave <Special>` for the way-out row of a form, else `null`. */
export function leaveLabelOf(c: AvailableCommand): string | null {
  const cmd = c.command;
  if (cmd.kind === 'spherechange' && !cmd.extra.specialDressUp && /^Leave /.test(c.help ?? '')) return c.help ?? null;
  return null;
}
