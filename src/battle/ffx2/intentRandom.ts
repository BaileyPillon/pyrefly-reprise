/**
 * PR-0153, FFX-2 side: the rolled-victim rows for `predictFFX2EnemyIntent`.
 * The measuring is shared (`../common/intentTargets.ts`); this is the X-2 glue
 * — the legal pool (`validTargetIds`) and the estimate aimed at one candidate.
 * Kept apart from `intent.ts` so neither twin grows past the house size.
 */

import type { AbilityDef, CombatantId, Command } from '../common/types.ts';
import {
  type RandomTarget,
  type RandomTargetRow,
  isRandomTargeting,
  randomTargetCandidates,
  randomTargetRows,
} from '../common/intentTargets.ts';
import type { Ffx2Unit } from './internal.ts';
import { validTargetIds } from './targeting.ts';

/**
 * Every candidate of `command`, estimated one at a time through `estimate`
 * (the predictor's own `estimateFFX2Command`, aimed), or `null` when the victim
 * is settled. `sampled` is the target list of each sample that rolled this move.
 */
export function ffx2RandomTarget<R extends RandomTargetRow>(
  units: readonly Ffx2Unit[],
  self: Ffx2Unit,
  command: Command,
  def: AbilityDef,
  sampled: readonly (readonly CombatantId[])[],
  estimate: (aimed: Command, aim: CombatantId) => readonly R[] | null,
): RandomTarget<R> | null {
  const ids = randomTargetCandidates(def.targeting, sampled, () => validTargetIds(units, self, def));
  if (!ids) return null;
  const perHit = isRandomTargeting(def.targeting) && def.hits > 1;
  // Aimed, every hit of a per-hit volley lands on the aim: divide back to one.
  return randomTargetRows(ids, def.hits, perHit, perHit ? def.hits : 1, (id) =>
    estimate({ ...command, targets: [id] } as Command, id),
  );
}
