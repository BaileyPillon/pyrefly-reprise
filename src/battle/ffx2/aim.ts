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

export function withAim(units: readonly Ffx2Unit[], actor: Ffx2Unit, def: AimDef, row: AvailableCommand): AvailableCommand {
  const byId = new Map(units.map((u) => [u.id, u] as const));
  const candidates = row.validTargets.flatMap((id) => {
    const u = byId.get(id);
    return u ? [u] : [];
  });
  const preferred = preferredTargetIds(def, row.targeting, actor.side, candidates);
  if (preferred) row.preferredTargets = preferred;
  return row;
}
