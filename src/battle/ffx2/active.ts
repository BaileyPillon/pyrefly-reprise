/**
 * **Active ATB** — the policy bits that let the FFX-2 clock run past an open
 * command menu. **FFX-2 ONLY.**
 *
 * The owner's decision, verbatim (`docs/target/decisions.json` D-009,
 * 2026-09-21): *"For ffx-2 I choose active."* — Active only, no Wait toggle.
 * The mechanic itself is `research/ffx2-combat-core.md` §1.5, Active row:
 * *"Time never stops, including while browsing the item list or a magic
 * submenu."* FFX is CTB and has no clock to run
 * (`research/ffx-vs-ffx2-presentation.md` §4.3), so none of this reaches it —
 * `tests/unit/ffx-no-active-clock.test.ts` is the absence test (AGENTS.md
 * rule 14 / CHK-021).
 *
 * Lives beside `engine.ts` rather than inside it because `engine.ts` is already
 * over the 400-line house limit (DEV.md "House rules") and must not grow.
 * Pure, DOM-free and deterministic like everything under `src/battle/**`.
 *
 * See `docs/plans/ffx2-active-atb-review.md` §4 for the design this implements
 * and §3.3 for the two sourced rules it deliberately leaves out.
 */

import type { AbilityDef, CombatantId, Command } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { isActionLocked } from './chain.ts';
import { isReady } from './gauges.ts';
import { canAct } from './statuses.ts';

/** Options on {@link FFX2Engine.tick}. `throughInput` is Active mode's whole ask. */
export interface TickOptions {
  /**
   * Keep sub-stepping even though a girl is standing ready for a command.
   * She is *queued for input*, not acting, so she does not stop the clock —
   * but everybody else's gauge, every status second, every chain window and
   * every enemy turn carries on exactly as it does between turns.
   */
  throughInput?: boolean;
}

/**
 * Whether this unit, if it came up next, would open a command menu rather than
 * resolve itself.
 *
 * A Berserked girl is *not* awaiting input: §2.8 says she "can only use the
 * basic Attack command; **player loses control**", so the engine takes her turn
 * (`runBerserkTurn`). A girl suspended on a timed-Overdrive overlay still
 * belongs to the player and keeps her own path.
 */
export function awaitsPlayerInput(unit: Ffx2Unit, minigamePending: boolean): boolean {
  if (unit.controller !== 'player') return false;
  return !(unit.statuses.berserk && !minigamePending);
}

/**
 * The three predicates that decide whose turn it is, in one place so
 * `nextActor` and {@link inputStillValid} can never drift apart.
 */
export function canTakeTurn(unit: Ffx2Unit): boolean {
  if (!isReady(unit) || !canAct(unit)) return false;
  // A chained target cannot start its own action. §1.7
  if (isActionLocked(unit)) return false;
  if (unit.side === 'enemy' && (unit.thinkingTicks ?? 0) > 0) return false;
  return true;
}

/**
 * Is the command menu that is open for `actorId` still answerable?
 *
 * New with Active, and not a canon rule but a mechanical necessity: under Wait
 * nothing could happen to the owner while her menu was up. Now she can be KO'd,
 * Stopped, Slept, Petrified, chained into an action lock or Berserked, or the
 * battle can end under her — and in every one of those cases the menu has to go
 * (preflight §4.3). Deliberately *not* implemented: the single-sourced
 * "an enemy hit closes the menu and delays her" rule (§3.3), which is an open
 * question for Bailey.
 */
export function inputStillValid(
  units: readonly Ffx2Unit[],
  actorId: CombatantId,
  battleOver: boolean,
  minigamePending: boolean,
): boolean {
  if (battleOver) return false;
  const unit = units.find((u) => u.id === actorId);
  if (!unit) return false;
  if (!canTakeTurn(unit)) return false;
  return awaitsPlayerInput(unit, minigamePending);
}

/**
 * Every target this command named is gone.
 *
 * Unreachable under Wait — nothing resolved while a menu was open — and
 * ordinary under Active: you aim at a fiend, a chained hit or a charged ability
 * kills it, you press confirm, and `targetForHit` finds an empty pool while
 * `beginRecovery` still spends the turn. The preflight's answer (§4.4 (a)) is
 * **refuse and reopen**: the command does not execute and the turn is not
 * spent. `can-target-dead` abilities (Phoenix Down, Life) are the whole reason
 * this asks the ability rather than just looking at `alive`.
 */
export function allTargetsGone(
  units: readonly Ffx2Unit[],
  command: Command,
  ability: AbilityDef | undefined,
): boolean {
  const targets = command.targets;
  if (!targets || targets.length === 0) return false;
  if (ability?.flags.includes('can-target-dead')) {
    return targets.every((id) => {
      const unit = units.find((u) => u.id === id);
      return !unit || unit.removed;
    });
  }
  return targets.every((id) => {
    const unit = units.find((u) => u.id === id);
    return !unit || unit.removed || !unit.alive;
  });
}

/**
 * How big the next sub-step may be.
 *
 * `soonest` is ticks until the next scheduled state change anywhere, or
 * `Infinity` when nothing is scheduled at all. Under `throughInput` that last
 * case is reachable in a way it never was before — every unit ready or frozen
 * while a menu is open — and clamping it to one tick would burn the sub-step
 * budget without advancing the clock, so an idle stretch is consumed whole.
 */
export function substepTicks(remaining: number, soonest: number): number {
  if (!Number.isFinite(soonest) || soonest <= 0) return remaining;
  return Math.min(remaining, soonest);
}
