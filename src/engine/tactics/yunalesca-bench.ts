/**
 * Chapter 2, Yunalesca: the Zombie carrier for the last form (re-parity RC6, FFX only; Zombie, Hellbiter and Mega Death are FFX's, and the
 * FFX-2 and FF7 engines never import this file).
 *
 * **Why.** Form III opens with Mega Death and repeats it every fifth ordinary turn, and only a Zombie is certain to live through it. Since RC5 a KO
 * takes the Zombie away (the game's own status reset), so a zombified member who dies comes back plain and has to be zombified again by Hellbiter,
 * and the line fell from 476 to 398 wins of 500. Hellbiter is the only thing that makes a Zombie, and it lands on a character at the chance 100 minus
 * the armour's Zombie resistance: Tidus, Yuna and Auron wear Zombie Ward (resistance 50, so about half of Hellbiters miss each of them; the preset
 * carries it over from Mt. Gagazet, `src/data/ffx/builds/zanarkand.ts`), and Wakka wears none, so Hellbiter always lands on him. His armour also carries a
 * Death Ward, so even a plain Wakka lives through a Mega Death about half the time (`research/ffx-yunalesca.md` 10.8, 10.10).
 *
 * **The rule.** On his first turn in Form III, Tidus hands the turn to Wakka (the free switch: the incoming member takes the turn happening now,
 * `research/ffx-combat-core.md` 1.7). Tidus has already done his two jobs by then, Hastega in Form I and the Cheer ladder, and Wakka is the Zombie
 * carrier the guide asks for: "keep at least one character a Zombie" (Jegged, in our words on the guide page: "think twice about blocking Zombie").
 *
 * **Measured, not sourced.** No guide names Wakka or the turn; the choice is derived from the armour above and measured over the first 1,000 seeds
 * (`tests/unit/re-parity-rc6-ch2-ladder.test.ts`, `docs/handoff/re-parity-rc6-ch2.md`): Chapter II 398 and 405 wins of 500 before, 453 and 457 with it;
 * the same swap in Form I or II, or Kimahri, Rikku or Lulu in his place, or Auron leaving instead, all win less.
 */

import type { AvailableCommand, Command, CombatantId } from '../../battle/common/types.ts';

/** The member who makes way, and who comes in. */
export const SWAPS_OUT: CombatantId = 'tidus';
export const CARRIER: CombatantId = 'wakka';

/** Form III (`formIndex` 2). */
const LAST_FORM = 2;

/**
 * The switch to the carrier, when it is Tidus's turn in Form III and the engine offers the row (the carrier is on the bench and able to fight).
 * `null` otherwise: the rest of the tactic plays the turn. Once he has swapped, Tidus is on the bench and this never fires again.
 */
export function zombieCarrierSwap(actorId: CombatantId, commands: AvailableCommand[], form: number): Command | null {
  if (form !== LAST_FORM || actorId !== SWAPS_OUT) return null;
  const row = commands.find((c) => c.enabled && c.command.kind === 'switch' && c.command.extra.inId === CARRIER);
  return row ? ({ ...row.command } as Command) : null;
}
