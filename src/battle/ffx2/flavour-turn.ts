/**
 * How a **flavour turn** (a poll whose `decide` returned null) is paid for in the ATB gauge (RC3; **FFX-2 only** [AGENTS.md rule 14]).
 * Split out of `engine-core.ts#runAiTurn` as a pure move (house rule 7, every source file under 400 lines); the events and the gauge
 * come out byte for byte as they did inline. The keys it reads and clears are the ones `ai/idle.ts` documents and the scripts set
 * (`idleFor`, `speakTurn`).
 *
 * Pure TypeScript: no DOM, no Three.js, no randomness.
 */

import type { Ffx2Unit } from './internal.ts';
import { mem } from './internal.ts';
import { AI_IDLE_STEPS, AI_IDLE_WAKE, AI_NO_INTENT, AI_POLL_COST, AI_REPOLL } from './ai/idle.ts';
import { ATB_BASE_VALUE } from './constants.ts';
import { completeCommand } from './atb-engine.ts';
import { Ffx2AtbState } from './kernel/atb-gauge.ts';

/**
 * Whether a poll whose `decide` returned null was **not a turn** (FFX-2 only; the Tourist Trap): the script marked it `AI_REPOLL` (Yojimbo's "dog" pick, which raises a flag and is polled again on the very next step) or
 * `AI_NO_INTENT` (Daigoro asleep until the flag wakes him). The game polls a ready monster every step and counts none of these as a turn, so `engine-core.ts#runAiTurn` takes back the turn count and the `turn-start`
 * it had already drafted, and plays no `action-end`: `result.turns` (the results screen's TURNS) and the presenter's per-turn beat count real turns only. Only those two scripts set the keys, so no other unit is affected.
 */
export function pollIsNotATurn(actor: Ffx2Unit): boolean {
  return mem(actor, AI_REPOLL) === 1 || mem(actor, AI_NO_INTENT) === 1;
}

/**
 * Settle the ATB slot of a poll that played no command. [ffx2-vegnagun-shuyin §5] It waits the standard gauge, unless the script said
 * what the poll stood for (`AI_POLL_COST`: a voice line's speak command, 60) or asked for an idle wait (`AI_IDLE_STEPS`: a countdown of
 * polls, one a logic step): then the unit sits it out executing and is ready the step it ends. Clears the three keys either way.
 */
export function settleFlavourTurn(actor: Ffx2Unit, units: Ffx2Unit[]): void {
  const idleSteps = mem(actor, AI_IDLE_STEPS);
  const pollCost = mem(actor, AI_POLL_COST, ATB_BASE_VALUE);
  const wake = mem(actor, AI_IDLE_WAKE);
  if (actor.aiMemory) {
    delete actor.aiMemory[AI_IDLE_STEPS];
    delete actor.aiMemory[AI_IDLE_WAKE];
    delete actor.aiMemory[AI_POLL_COST];
  }
  if (idleSteps > 1) {
    // "The next poll is idleSteps steps from now": the unit executes for idleSteps - 1 steps, the step after the last one it is ready.
    actor.gauge.costAtb = 0;
    actor.gauge.executing = idleSteps - 1;
    actor.gauge.idleWait = true;
    actor.gauge.idleWake = wake;
    actor.gauge.state = Ffx2AtbState.Executing;
  } else if (idleSteps === 1) {
    completeCommand(actor, 0, units, true); // polled again on the very next step
  } else {
    completeCommand(actor, pollCost, units);
  }
}
