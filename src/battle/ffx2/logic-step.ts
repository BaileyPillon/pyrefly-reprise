/**
 * One LOGIC STEP of an FFX-2 battle (re-parity W4; **FFX-2 only**).
 *
 * The game advances everything once per step (`pp_battle_logic_step`, exe 0x0061e440), in this order: the battle-end
 * evaluation (the engine does it after the step), the ATB process (the speeds, every character's recovery, thinking and
 * ready state, the hand-off), the action dispatcher (the charge countdown of a cast that is on the purple bar), and the
 * status process (the status clocks, Poison, Regen and Doom). The chain windows, which stand in for the game's hit
 * reaction, run first. Nothing else changes a gauge or a status clock but a command's own effects.
 *
 * What the step does NOT do: choose a command. A girl's menu, a monster's script and a Berserked girl's pick are answered
 * by the engine after the step (`engine.ts`), in the game's order of readiness; a cast that comes due is fired through the
 * `fire` callback, and a command whose action time has run out completes through `complete`. Pure and DOM-free.
 */

import type { AiContext, Emit, Ffx2Unit } from './internal.ts';
import { advanceChainWindows } from './chain.ts';
import { dropAction, runAtbProcess, tickCharges } from './atb-engine.ts';
import { advanceStatusClocks } from './status-clock.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';
import { has } from './adapt/words.ts';
import { canAct } from './statuses.ts';
import type { ResolveContext } from './resolve-hp.ts';

/** What one step needs from the engine. */
export interface StepHost {
  /** The number of this logic step (the battle's step counter, already advanced). */
  step: number;
  /** Every unit. */
  units: readonly Ffx2Unit[];
  /** The units in kernel-slot order (the order the game visits characters). */
  ordered: readonly Ffx2Unit[];
  /** Units a logic step takes off a gauge at the Config speed (70 / 95 / 120). */
  baseSpeed: number;
  emit: Emit;
  resolveCtx(): ResolveContext;
  aiContext(unit: Ffx2Unit): AiContext;
  /** A cast came due: fire it (the engine resolves the command the unit was charging). */
  fire(unit: Ffx2Unit): void;
  /** A command's action time ran out: it completes. */
  complete(unit: Ffx2Unit): void;
}

/** `MsResetDefenseStatus` (exe 0x006368d0): Defense lasts until the recovery that follows ends. */
function resetDefense(u: Ffx2Unit, emit: Emit): void {
  if (u.statuses['defend'] === undefined) return;
  delete u.statuses['defend'];
  emit({ type: 'status-remove', targetId: u.id, status: 'defend', reason: 'expired' });
}

/**
 * Bring the gauge states in line with the statuses after anything may have changed them. A girl whose menu was open
 * when she fell asleep, was Stopped, KO'd, petrified, ejected or Berserked has it closed and goes back to IDLE
 * (`FUN_00634040`, called from `pp_result_apply`); a unit with a command in flight loses it when it is Stopped,
 * petrified or ejected (the game clears the command queue then).
 */
export function settleGauges(units: readonly Ffx2Unit[]): void {
  for (const u of units) {
    if (u.gauge.state === Ffx2AtbState.WaitCommand && (!canAct(u) || has(u, 'berserk'))) u.gauge.state = Ffx2AtbState.Idle;
    if (u.atb.charging !== null && (has(u, 'stop') || has(u, 'petrify') || u.removed)) dropAction(u);
  }
}

/** Run one logic step. */
export function logicStep(host: StepHost): void {
  advanceChainWindows(host.units, 1, host.emit);

  const process = runAtbProcess(host.ordered, host.baseSpeed);
  for (const u of process.recoveryEnded) resetDefense(u, host.emit);
  // The ready list is served lowest recovery counter first; the engine hands out turns in that order (`gauges.ts nextReady`).
  process.readyOrder.forEach((u, rank) => {
    u.gauge.readyKey = host.step * 64 + rank;
  });
  for (const u of host.ordered) if (u.gauge.hitReaction > 0) u.gauge.hitReaction -= 1; // this step's ticks were halved; the reaction wears off

  // The action dispatcher: a command in its action time counts down, then the casts on the purple bar.
  for (const u of host.ordered) {
    if (u.gauge.executing <= 0 || u.atb.charging !== null || u.gauge.state !== Ffx2AtbState.Executing) continue;
    u.gauge.executing -= 1;
    if (u.gauge.executing <= 0) host.complete(u);
  }
  for (const u of tickCharges(host.ordered)) host.fire(u);

  advanceStatusClocks(host.ordered, host.emit, host.resolveCtx(), (u) => host.aiContext(u));
  settleGauges(host.units);
}
