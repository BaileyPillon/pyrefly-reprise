/**
 * **Finding a shot in the table** (`../../data/ffx/camera/shotTypes.ts`; FFX only): the pure half of the table director (`./tableDirector.ts`). A beat names an action (an ability or item id, or the plain Attack of a
 * side) and the director knows who acts, whom the action is about and which range the airship is in; this turns that into the table's own words and finds the cell.
 *
 * - **The row**: the plain Attack of the actor's side (`@attack.party`, `@attack.monster`), else the ability or item by id.
 * - **The slot**: `0` to `2` for a party member by where he stands on the deck (the line-up, nearest the near camera first), `m` for a monster.
 * - **The target**: `e` Evrae, `s` the actor itself, `a0` to `a2` one other party member by slot, `p` two or more party members, `x` both sides.
 * - **The cell**: the exact one (`<range><slot><target>`), then each form with a `*` for what the route does not depend on; none is none (the camera keeps the shot it had).
 *
 * Game case: FFX only.
 */

import type { Branch, Cells } from '../../data/ffx/camera/shotTypes.ts';
import type { ShotAction, ShotSubject } from '../ShotDirector.ts';

/** An own property of `table`, or undefined: a lookup by an id the data did not choose (an ability id from the engine) never reaches the prototype. */
export const own = <T>(table: Readonly<Record<string, T>>, key: string): T | undefined => (Object.hasOwn(table, key) ? table[key] : undefined);

/** The action's row: the plain Attack of its side, else the ability or item by id (undefined when the beat names none). */
export function rowOf(actor: ShotSubject, action: ShotAction): string | undefined {
  if (action.commandKind === 'attack') return actor.side === 'enemy' ? '@attack.monster' : '@attack.party';
  return action.abilityId;
}

/** Where the actor stands: its slot on the deck for a party member (0 when it is not in the line-up), `m` for a monster. */
export function slotCode(actor: ShotSubject, lineup: readonly string[]): string {
  return actor.side === 'enemy' ? 'm' : String(Math.max(0, lineup.indexOf(actor.id)));
}

/** Whom the action is about, as the table's cells say it (see the file header). Cid and Evrae are the boss's side. */
export function targetCode(actor: ShotSubject, targets: readonly ShotSubject[], lineup: readonly string[]): string {
  const ids = targets.map((t) => t.id);
  if (ids.length === 0) return 'e';
  if (ids.length === 1 && ids[0] === actor.id) return 's';
  const boss = ids.some((id) => id === 'evrae' || id === 'cid');
  const party = ids.filter((id) => id !== 'evrae' && id !== 'cid');
  if (boss) return party.length === 0 ? 'e' : 'x';
  if (party.length === 1) {
    const slot = lineup.indexOf(party[0]!);
    return slot >= 0 ? `a${slot}` : 'p';
  }
  return 'p';
}

/** The branches of the context's cell: the exact one, then each form with a `*` for what the route does not depend on. `range` is `n` or `f`. */
export function cellOf(cells: Cells, range: 'n' | 'f', slot: string, target: string): readonly Branch[] | undefined {
  for (const key of [`${range}${slot}${target}`, `${range}${slot}*`, `${range}*${target}`, `*${slot}${target}`, `${range}**`, `*${slot}*`, `**${target}`, '***']) {
    const found = own(cells, key);
    if (found) return found;
  }
  return undefined;
}
