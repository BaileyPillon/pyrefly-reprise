/**
 * PR-0153, FFX side: the rolled-victim rows for `predictEnemyIntent`. The
 * measuring is shared (`../common/intentTargets.ts`); this is the FFX glue —
 * the legal pool (`validTargets`, which already honours Chapter XII's
 * never-random discs) and the estimate aimed at one candidate.
 */

import type { AbilityDef, CombatantId, Command } from '../common/types.ts';
import {
  type RandomTarget,
  isRandomTargeting,
  randomTargetCandidates,
  randomTargetRows,
} from '../common/intentTargets.ts';
import type { Ctx } from './state.ts';
import { tryActor } from './state.ts';
import { validTargets } from './targeting.ts';
import { orderedAction } from './orders.ts';
import { type TargetEstimate, estimateCommand } from './estimate.ts';

/**
 * Every candidate of `command`, estimated one at a time, or `null` when the
 * victim is settled. `sampled` is the target list of each dry-run sample that
 * rolled this same move.
 */
export function ffxRandomTarget(
  ctx: Ctx,
  enemyId: CombatantId,
  command: Command,
  def: AbilityDef,
  sampled: readonly (readonly CombatantId[])[],
): RandomTarget<TargetEstimate> | null {
  const self = tryActor(ctx, enemyId);
  if (!self) return null;
  // A row that orders another actor (Yojimbo's "Daigoro") lands through the
  // ordered row, whose own targeting picks the victim [orders.ts].
  const order = orderedAction(ctx, self, def);
  const picker = order?.actor ?? self;
  const pickDef = (order && ctx.content.ability(order.command.kind === 'ability' ? order.command.id : '')) || def;
  const ids = randomTargetCandidates(pickDef.targeting, sampled, () => validTargets(ctx, picker, pickDef));
  if (!ids) return null;
  const perHit = isRandomTargeting(pickDef.targeting) && pickDef.hits > 1;
  // Aimed, every hit of a per-hit volley lands on the aim, so the row is the
  // whole volley and divides back to one hit. Natus's Multi-ra
  // (`distinctTargetsPerHit`) already sends every later hit elsewhere.
  const divisor = perHit && pickDef.extra?.['distinctTargetsPerHit'] !== true ? pickDef.hits : 1;
  return randomTargetRows(ids, pickDef.hits, perHit, divisor, (id) =>
    estimateCommand(ctx.state, enemyId, { ...command, targets: [id] } as Command, def, ctx.content, id)?.perTarget ?? null,
  );
}
