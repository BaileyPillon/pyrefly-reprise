/**
 * The Special Dress Up and its way out, as a `spherechange` command (FFX-2 only; behind the `specialDressUp` switch, OFF by default).
 *
 * `execute.ts` hands every `spherechange` here first. With the switch off this answers `false` at once and the ordinary change runs exactly as before. With it on, the two commands that are not a walk
 * along a link are settled here: the Special Dress Up (`extra.specialDressUp`, standing where she stands: the wheel's own command; the adjacency check of an ordinary change does not apply, the kernel's
 * mode 1) and the girl's way out (a change back to the dress she stood on, the kernel's mode 2). Anything else from a girl in a form, and a Special Dress Up the menu would not have offered, spends the
 * turn with a message, as an ordinary change into a node that is not linked does.
 */

import type { SpherechangeCommand } from '../../common/types.ts';
import type { Emit, Ffx2Unit, GarmentGridRegistry } from '../internal.ts';
import type { SpherechangeDeps } from '../spherechange.ts';
import { enterSpecialForm, leaveSpecialForm, recordOf, specialOn, type FormHost } from './enter.ts';
import { isEntry, specialRows } from './availability.ts';
import type { BattleState } from '../../common/types.ts';

export interface ChangeEnv {
  readonly units: Ffx2Unit[];
  readonly state: BattleState;
  readonly grids: GarmentGridRegistry;
  readonly gridNodes: SpherechangeDeps['gridNodes'];
  readonly deps: SpherechangeDeps;
  readonly emit: Emit;
}

/** True when the command was a Special matter and has been settled (the caller then spends the turn); false to let the ordinary change run. */
export function performSpecialChange(env: ChangeEnv, actor: Ffx2Unit, command: SpherechangeCommand): boolean {
  if (!specialOn(env.state)) return false;
  const host: FormHost = { units: env.units, state: env.state, grids: env.grids, emit: env.emit };
  const to = command.extra.toDressphere;
  const record = recordOf(actor);
  if (record !== undefined) {
    if (record.role === 'main' && to === record.returnTo && !actor.statuses.curse) return leaveSpecialForm(host, actor, env.deps);
    env.emit({ type: 'message', text: 'Not linked', kind: 'system' });
    return true;
  }
  if (!isEntry(actor, to, command.extra.specialDressUp)) return false;
  const offered = specialRows(actor, { grid: env.grids.get(actor.dresspheres?.garmentGrid.id ?? ''), gridNodes: env.gridNodes[actor.id] })[0];
  if (offered === undefined || !offered.enabled || !enterSpecialForm(host, actor)) {
    env.emit({ type: 'message', text: 'Not ready', kind: 'system' });
  }
  return true;
}
