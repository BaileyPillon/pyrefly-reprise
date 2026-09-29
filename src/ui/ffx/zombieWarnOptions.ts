/**
 * fb-0929 OPTIONS for Bailey, **both off** (AGENTS.md rules 9 and 10: they change the feel and the
 * look beyond the documented intent, so they are built, shown, and not shipped on). **FFX only.**
 *
 * The defect fix is separate and on (the Zombie pip is drawn and coloured, `statusPips.ts`; the
 * target plate says "Zombie: 1,000 damage", `zombieTargetNote.ts`). These two go further, for the
 * mouse player the friend was: a click on a target bracket or a turn-list tile selects **and
 * confirms** in one go, so a player who clicks Kimahri never sees the plate's note at all.
 *
 * - `guard`: a click that would confirm a command which hurts a living Zombie ally only aims it
 *   the first time (the plate shows the warning); a second click, or Enter, confirms.
 * - `word`: the party plate spells the status out, a small "Zombie" after the pips, in the pip's
 *   colour, for as long as the Zombie is on.
 *
 * Turn either on for a capture with `?zombiewarn=guard`, `?zombiewarn=word` or
 * `?zombiewarn=guard,word`; flip the constant to ship one once Bailey says yes.
 */

import './zombie-warn.css';

export type ZombieWarnOption = 'guard' | 'word';

/** The shipped state: both off until Bailey picks. */
export const ZOMBIE_WARN_ON: Readonly<Record<ZombieWarnOption, boolean>> = { guard: false, word: false };

/** True when `which` is on: the constant, or `?zombiewarn=` naming it. */
export function zombieWarnOn(which: ZombieWarnOption): boolean {
  if (ZOMBIE_WARN_ON[which]) return true;
  try {
    const raw = new URLSearchParams(globalThis.location?.search ?? '').get('zombiewarn') ?? '';
    return raw.split(',').map((s) => s.trim()).includes(which);
  } catch {
    return false;
  }
}

/** Does this plate note say the command will hurt a Zombie (`zombieTargetNote.ts`'s wording)? */
export function noteWarnsZombieHarm(note: string | undefined): boolean {
  return note !== undefined && /^Zombie: /.test(note);
}
