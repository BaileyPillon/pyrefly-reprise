/**
 * **The Left Fin and the Right Fin** (Sin, links 1 and 2): constants, flags,
 * setup, counters, runtime marks and `SIN_FINS_ASSUMPTIONS`.
 *
 * **STUB with the final signatures**, written by package S so packages F, G and
 * P work on disjoint files (`docs/plans/sin-two-chapters-plan.md` §2.2, §2.3,
 * §7). Package F fills it from research/ffx-sin.md §4, §5.1 and §5.2 (the
 * §5.1.4 pseudocode, step for step). Until then every function here is a no-op,
 * so no battle changes.
 *
 * The aggregators that call this file are `sin-setup.ts` (setup, runtime marks)
 * and `sin-counters.ts` (counters); the names every Sin package shares are in
 * `sin-ids.ts`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import type { AbilityDef, CombatantId, FFXCombatant } from '../../common/types.ts';
import type { ActorRuntime, Ctx } from '../state.ts';
import type { SinCounter } from './sin-ids.ts';

export * from './sin-negation.ts';

/**
 * **Estimates carried by the Fin fights**, as data, so the handoff, the guide
 * and the tests can print them. Package F adds S-8, S-12 (`NEGATION_*`), S-19,
 * S-25 and S-27 here.
 *
 * `seam-lineup` is package S's (REVIEW must-change 6): `BattleScreenSetup.carryFfx`
 * keeps the build's `activeIds`, so links 2 and 3 reopen with **Tidus, Yuna and
 * Auron in front**, whoever ended the previous link there. Research §1.2 is
 * silent on it. It decides who stands in front at FAR, which members
 * Negation's leftmost and rightmost Protect weights read, and who is in front
 * to give Cid orders. **Our estimate**; bench B measures both readings.
 */
export const SIN_FINS_ASSUMPTIONS: ReadonlyArray<{ id: string; claim: string; value: unknown }> = [
  {
    id: 'seam-lineup',
    claim: "Links 2 and 3 reopen with the build's opening line-up (Tidus, Yuna, Auron), not the last link's front row (our estimate; research §1.2 is silent)",
    value: 'build',
  },
];

/** **STUB (package F).** Open the Fin fight: FAR (S-8), no order queued, the counted foe, Cid a non-combatant. */
export function applySinFinsSetup(ctx: Ctx): void {
  void ctx;
}

/**
 * **STUB (package F).** The runtime marks the Fin fights need, read off the
 * published flags alone so a rebuilt preview runtime (`simulate.ts`) gets them
 * too. Called by `sin-setup.ts#markSinRuntime`.
 */
export function markSinFinsRuntime(
  flags: Readonly<Record<string, unknown>>,
  actors: ReadonlyMap<CombatantId, ActorRuntime>,
): void {
  void flags;
  void actors;
}

/**
 * **STUB (package F).** The Fins' reactions to one player-side action: the hit
 * counter (§5.1.1) and Negation (§5.1.3). `collectBossCounters` has already
 * refused an enemy-side attacker and a counter's own action.
 */
export function collectSinFinsCounters(
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
