/**
 * The presenter's half of D-224's phase lighting: every event is offered to
 * the canon table (`phaseCanon.ts`), and a canon beat is handed to the stage's
 * lighting port, `BattleStage.lighting` (a stage without one, a test fake,
 * ignores it). The port is the "phase port" of the iteration 2 plan; the
 * stage's own triggers (Vegnagun's links, Evrae's range) come from the state
 * it stages (`BattlePresenterStage.ts`).
 *
 * Game case: both (plumbing); each trigger is its own game's beat.
 * Same rules as the other beat modules: no `three`, no DOM, ports only.
 */

import type { BattleEvent } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { phaseCue, type PhaseMemo } from './phaseCanon.ts';

const memos = new WeakMap<EventCtx, PhaseMemo>();

/** Offer one event to the canon table; a canon beat turns the arena's light. */
export function cuePhase(ctx: EventCtx, event: BattleEvent): void {
  const lighting = ctx.stage.lighting;
  if (!lighting) return;
  let memo = memos.get(ctx);
  if (!memo) memos.set(ctx, (memo = {}));
  const cue = phaseCue(event, memo);
  if (cue !== null) lighting.cue(cue);
}
