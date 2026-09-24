/**
 * **Active and Wait ATB** — the policy bits that decide whether the FFX-2
 * clock runs past an open command menu. **FFX-2 ONLY.**
 *
 * The owner's decision, verbatim (`docs/target/decisions.json` D-029,
 * 2026-09-22 21:45 EDT, superseding D-009's "Active only"): *"1. C Wait mode.
 * Also I want the default to be wait mode instead of active mode please."* —
 * both modes, **Wait by default** ({@link AtbMode}). The mechanic is
 * `research/ffx2-combat-core.md` §1.5: Active *"Time never stops, including
 * while browsing the item list or a magic submenu"*; Wait freezes time in a
 * submenu (the reading built — the whole menu, top level included — and why:
 * `docs/plans/ffx2-wait-mode-review.md` §2). FFX is CTB and has no clock to run
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

import type { AbilityDef, CombatantId, Command, Rng } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { isActionLocked } from './chain.ts';
import { isReady } from './gauges.ts';
import { rollDefault } from './minigames.ts';
import { canAct } from './statuses.ts';

/**
 * FFX-2's Config "ATB Mode" (§1.5). `'wait'` is the default (D-029): the clock
 * stops while a command menu is open. `'active'` keeps it running (D-009's
 * build, `docs/handoff/ffx2-active-atb.md`).
 */
export type AtbMode = 'wait' | 'active';

/** The engine's default ATB mode (Bailey, D-029). */
export const DEFAULT_ATB_MODE: AtbMode = 'wait';

/**
 * Where the cursor of an open FFX-2 command menu is: the **top-level** command
 * list, or anywhere below it (a submenu, the Change screen, the target cursor).
 * Only the HUD knows; it reports through `HudPort.onMenuLevel` and the
 * presenter tells the engine (`FFX2Engine.setMenuLevel`). A menu nobody has
 * reported on reads as `'deep'`, held: a HUD or wrapper that never says
 * degrades to the forgiving whole-menu hold, never to Active.
 */
export type MenuLevel = 'top' | 'deep';

/**
 * **The Wait split is on by default** (D-029 follow-up 2, built 2026-09-24 after
 * Bailey's live report: *"none of the attacks/moves i select take place until
 * after i select moves for all 3 girls then all of them go at once? is it
 * supposed to be like that?"*). `false` restores the whole-menu hold, the dark
 * launch `docs/plans/ffx2-wait-split-review.md` recommended until he rules on
 * its measured cost (§4 there, and the build-pass table in the handoff).
 */
export const DEFAULT_WAIT_SPLIT = true;

/**
 * Whether the clock is held still by an open command menu: **Wait mode** with a
 * `'player-input'` decision handed out and not yet answered, and — with the
 * split (`research/ffx2-combat-core.md` §1.5, Wait: *"Time runs while the
 * top-level Main Command Window is open, but freezes the moment any submenu is
 * entered"*) — the cursor below the top-level list. Then `tick` moves nothing
 * at all: no gauge, no charge, no status second, no chain window, no enemy turn,
 * nothing carried over. On the top list under the split the clock runs exactly
 * as Active's does (`throughInput`), so Active's held-command and menu-owner
 * rules (15385ab, PR-0076/0080) are reachable under Wait too.
 *
 * `level` and `split` default to the whole-menu hold (the D-029 build,
 * `docs/plans/ffx2-wait-mode-review.md` §3).
 */
export function clockHeldByMenu(
  mode: AtbMode,
  inputOwner: CombatantId | null,
  level: MenuLevel = 'deep',
  split = false,
): boolean {
  if (mode !== 'wait' || inputOwner === null) return false;
  return !(split && level === 'top');
}

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
 * Whether this unit could hold an open command menu: ready, able to act, and
 * not an enemy still thinking — {@link canTakeTurn} **without** the chain lock.
 *
 * The difference is the whole of critic round 08 PR-0076 / PR-0080. §1.7 says a
 * chained target *"cannot start executing its own action"*; it does not say she
 * stops being the one choosing. Treating the lock as "she can no longer answer"
 * tore her menu down the instant an enemy hit chained her and put the next
 * ready girl's list in its place — four in five of the menus chapter 5 lost at
 * human decision speed. So the lock gates *starting* the action (see
 * {@link HeldCommand}), never *owning* the menu.
 */
export function ownsInput(unit: Ffx2Unit): boolean {
  if (!isReady(unit) || !canAct(unit)) return false;
  if (unit.side === 'enemy' && (unit.thinkingTicks ?? 0) > 0) return false;
  return true;
}

/**
 * The predicates that decide whose turn it is, in one place so `nextActor` and
 * {@link inputStillValid} can never drift apart.
 */
export function canTakeTurn(unit: Ffx2Unit): boolean {
  if (!ownsInput(unit)) return false;
  // A chained target cannot start its own action. §1.7
  return !isActionLocked(unit);
}

/**
 * A command confirmed by a girl who was chain-locked at the time. **FFX-2 only.**
 *
 * §1.7's lock stops her *starting* an action, so the command waits and fires as
 * her — and as nobody else — in the first sub-step after the window closes.
 * Engine-internal like `inputOwner`: no `BattleState` field, no event shape, no
 * save shape. `docs/plans/ffx2-active-menu-review.md` §3.
 */
export interface HeldCommand {
  actorId: CombatantId;
  command: Command;
}

/**
 * Whether a held command can still fire for `unit` one day: she is alive, can
 * act and is not Berserked (§2.8 takes control away). A KO, Stop, Sleep or
 * Petrify drops it — nothing is spent, and she chooses again when she is back.
 */
export function heldStillPending(unit: Ffx2Unit | undefined): boolean {
  if (!unit || unit.removed || !unit.alive) return false;
  if (unit.statuses.berserk) return false;
  return canAct(unit);
}

/**
 * The command a held girl actually fires.
 *
 * A timed-input command (Trigger Happy, Lady Luck's reels) cannot suspend on an
 * overlay here — it fires from inside a running clock, under whatever menu is
 * open by then — so its outcome is the engine's own seeded default, exactly the
 * roll an automated run gets (`docs/CONTRACTS.md`, "Minigame protocol"). An
 * outcome already attached is kept. Open question for Bailey, in the handoff.
 */
export function withDefaultTimedInput(
  command: Command,
  ability: AbilityDef | undefined,
  rng: Rng,
  minigamesOn: boolean,
): Command {
  if (!minigamesOn || !ability?.minigame || command.kind !== 'overdrive' || command.extra) return command;
  const extra = rollDefault(ability.minigame, rng);
  return extra ? { ...command, extra } : command;
}

/**
 * Is the command menu that is open for `actorId` still answerable?
 *
 * New with Active, and not a canon rule but a mechanical necessity: under Wait
 * nothing could happen to the owner while her menu was up. Now she can be KO'd,
 * Stopped, Slept, Petrified or Berserked, or the battle can end under her — and
 * in every one of those cases the menu has to go (preflight §4.3). A §1.7 chain
 * lock is **not** one of them (critic round 08 PR-0080): she keeps the menu, and
 * a command she confirms while chained is held ({@link HeldCommand}). Deliberately *not* implemented: the single-sourced
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
  // Chained is still hers: see {@link ownsInput}.
  if (!ownsInput(unit)) return false;
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
