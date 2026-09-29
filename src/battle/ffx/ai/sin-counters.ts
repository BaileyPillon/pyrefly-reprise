/**
 * **Sin's reactions, aggregated** (FFX only): Overdrive Sin's Gaze (link 4), the
 * Fins' hit counter and Negation (links 1 and 2), and link 3's Waterga, Cura,
 * "Magic absorbed." and the Core's counters, collected once per player-side
 * action through the one line `reactions.ts` swapped in place
 * (`docs/plans/sin-two-chapters-plan.md` §2.1):
 *
 * ```
 * for (const c of collectSinCounters(ctx, attacker, def, damagedEnemyIds)) { ... targets: c.targets ?? [] ... }
 * ```
 *
 * `targets` carries a counter's aim (REVIEW must-change 1): Waterga goes to the
 * caster (§3.2, `[verified: 4 sources]`), which an empty aim on a
 * `single-enemy` row would turn into a random party member. Every collector
 * that shipped before leaves it unset, so its counters resolve as before.
 *
 * {@link runSinLivenessHooks} is the second hook (REVIEW must-change 2): one
 * line at the top of `reactions.ts#runMortibsorptionIfDown`, which the engine
 * calls at the start of every `afterAction`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../../common/types.ts';
import type { Ctx } from '../state.ts';
import { collectOverdriveSinCounters } from './overdrive-sin-rules.ts';
import { collectSinFinsCounters } from './sin-fins-rules.ts';
import { collectSinGenaisCoreCounters, syncGenaisCoreLiveness } from './sin-genais-core-rules.ts';
import type { SinCounter } from './sin-ids.ts';

/**
 * Every Sin counter one player-side action provoked, in a fixed order (link 4
 * first, exactly as before this aggregator existed). `collectBossCounters` has
 * already refused an enemy-side attacker and a counter's own action.
 */
export function collectSinCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): SinCounter[] {
  return [
    ...collectOverdriveSinCounters(ctx, attacker),
    ...collectSinFinsCounters(ctx, attacker, def, damagedEnemyIds),
    ...collectSinGenaisCoreCounters(ctx, attacker, def, damagedEnemyIds),
  ];
}

/** Recompute the Sin marks that depend on who is alive, for every action (link 3; a no-op elsewhere). */
export function runSinLivenessHooks(ctx: Ctx): void {
  syncGenaisCoreLiveness(ctx);
}
