/**
 * **Sinspawn Genais and Sin's Core** (Sin, link 3): constants, setup, counters,
 * runtime marks, the liveness hook and `SIN_CORE_ASSUMPTIONS`.
 *
 * **STUB with the final signatures**, written by package S so packages F, G and
 * P work on disjoint files (`docs/plans/sin-two-chapters-plan.md` §2.2, §2.4,
 * §7). Package G fills it from research/ffx-sin.md §5.3. Until then every
 * function here is a no-op, so no battle changes.
 *
 * ## The liveness hook (REVIEW must-change 2)
 *
 * {@link syncGenaisCoreLiveness} runs at the top of every `afterAction`
 * (`reactions.ts#runMortibsorptionIfDown`, one added line), for every command
 * kind, enemy turns, counters' aftermath and a Doom KO at the start of a turn
 * alike. The marks that depend on Genais and the Core being alive (the Core's
 * `outOfMeleeReach` and `immune-to-magical-damage` while Genais lives,
 * `sin.core.down` and Genais a non-combatant once the Core falls) are
 * recomputed there from `isAlive`, so they cannot hang off the player-side
 * counter collector alone. Genais is **not** marked a non-combatant at setup:
 * the stalemate watch must keep counting its HP as progress.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../../common/types.ts';
import type { ActorRuntime, Ctx } from '../state.ts';
import type { SinCounter } from './sin-ids.ts';

/** **Estimates carried by link 3**, as data. Package G adds S-2, S-12 (the Core), S-13, S-15 and the rest. */
export const SIN_CORE_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [];

/** **STUB (package G).** Open link 3: the Core magic-immune and out of melee reach while Genais lives. */
export function applySinGenaisCoreSetup(ctx: Ctx): void {
  void ctx;
}

/**
 * **STUB (package G).** Runtime marks read off the published flags alone (Genais
 * a non-combatant once `sin.core.down`), so a rebuilt preview runtime gets them
 * too. Called by `sin-setup.ts#markSinRuntime`.
 */
export function markSinGenaisCoreRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  void flags;
  void actors;
}

/** **STUB (package G).** Recompute the Genais- and Core-dependent marks from `isAlive` (see the header). */
export function syncGenaisCoreLiveness(ctx: Ctx): void {
  void ctx;
}

/**
 * **STUB (package G).** Link 3's reactions to one player-side action: Waterga on
 * the caster (return the caster in `targets`), Cura in the shell, "Magic
 * absorbed.", the Core's Negation and its element cycle.
 */
export function collectSinGenaisCoreCounters(
  ctx: Ctx,
  attacker: FFXCombatant,
  def: AbilityDef,
  damagedEnemyIds: readonly CombatantId[],
): SinCounter[] {
  void ctx;
  void attacker;
  void def;
  void damagedEnemyIds;
  return [];
}
