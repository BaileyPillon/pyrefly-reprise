/**
 * FFX-2's half of the shared cursor-opening rule (`battle/common/aim.ts`): a
 * command row learns which of its `validTargets` the cursor should open on.
 *
 * Most X-2 skills are `single-any` — Power Break, Drain, Doom, Cheap Shot,
 * Flametongue — so they list the girls as well as the fiends, and the menu
 * opened on Yuna at the left of the field (Bailey, live build, 2026-09-24).
 * Both games share the rule; this file only resolves X-2's units.
 */

import type { AvailableCommand } from '../common/types.ts';
import { type AimDef, preferredTargetIds } from '../common/aim.ts';
import type { Ffx2Unit } from './internal.ts';

/** Adds `preferredTargets` to a row; returns the row. */
export type Aim = (def: AimDef, row: AvailableCommand) => AvailableCommand;

/**
 * One aimer per `buildCommands` call: the id lookup is built at most once per
 * menu (and only if a row can use it), not once per row — the AI and the
 * simulations build menus thousands of times a battle.
 */
export function aimer(units: readonly Ffx2Unit[], actor: Ffx2Unit): Aim {
  let byId: Map<string, Ffx2Unit> | undefined;
  return (def, row) => {
    const t = row.targeting;
    if (row.validTargets.length < 2 || (t !== 'single-any' && t !== 'single-ally' && t !== 'single-enemy')) return row;
    byId ??= new Map(units.map((u) => [u.id, u] as const));
    const lookup = byId;
    const candidates = row.validTargets.flatMap((id) => {
      const u = lookup.get(id);
      return u ? [u] : [];
    });
    const preferred = preferredTargetIds(def, t, actor.side, candidates);
    if (preferred) row.preferredTargets = preferred;
    return row;
  };
}
