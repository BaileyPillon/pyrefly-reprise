/**
 * Painted key poses around an attack: the wind-up and the follow-through (D-313, Bailey 2026-10-01
 * "all your recommendations"; both games, presentation only, ports only: no `three`, no DOM, no
 * engine state, no RNG).
 *
 * A figure's wind-up painting is installed as its `ready` pose, which the presenter already shows
 * while that member's command menu is open (`BattlePresenter.ts`, `setPose('ready')`). An attack
 * then plays its keys in order:
 *
 * 1. **wind-up** (`ready`) from the action's start until the lunge reaches its apex;
 * 2. **impact** (`attack`, which falls back to `ready` for a figure with no attack painting) at the apex;
 * 3. **follow-through** (`follow`) when the hit lands (`ContactBeat.meetContact`), held at full reach
 *    for {@link FOLLOW_BEAT_MS} before the strike goes home; `actionEnd` returns it to `idle`.
 *
 * Each step happens only when the figure has its **own** painting for it (`BattleStage.paints`),
 * so a figure without the new keys plays exactly as before. REDUCE MOTION keeps today's behaviour:
 * no wind-up lead, no follow-through beat.
 */
import type { CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import type { LungeContact } from './ContactBeat.ts';
import { odApex, odKeyHolds } from './KeySlots.ts';
import { curvesOn } from './motion/CurvesSwitch.ts'; // motion pass (lane "core")

/** How long the follow-through holds at full reach before the strike goes home, ms at timeScale 1. */
export const FOLLOW_BEAT_MS = 180;

/** A ctx built without moments or a stage (a unit test's) has no keys to play. */
function keysOn(ctx: EventCtx): boolean {
  return ctx.moments?.reducedMotion === false;
}

/** Does this attack open on the wind-up painting? Only an attack, only with a painted `ready`. */
export function windUpLeads(ctx: EventCtx, actorId: CombatantId, pose: string): boolean {
  return pose === 'attack' && keysOn(ctx) && ctx.stage?.paints?.(actorId, 'ready') === true;
}

/**
 * The pose the blow lands in while the wind-up (`ready`) is still up, for the reach solver (`motion/StrikeReach.ts`, r391-reach): the impact painting, the blow's key
 * frame, which goes up at the lunge's apex as the hit lands (`impactAtApex`); the follow-through that holds after it carries on from there, a little further in. `undefined`
 * without a wind-up: the pose showing is the one the blow lands in.
 */
export function blowPose(windUp: boolean): string | undefined {
  return windUp ? 'attack' : undefined;
}

/**
 * The lunge's contact, with the impact painting put up at the apex (after the wind-up). Only while
 * the action is still on: a lunge is never awaited, so its apex can come after `actionEnd` when the
 * playback runs ahead (seen in Chapter IV under the ATB), and the figure must not stay on its impact.
 */
export function impactAtApex(ctx: EventCtx, actorId: CombatantId, contact: LungeContact): LungeContact {
  const impact = (): void => {
    // r37 slot (FFX-2): a move with its own key painting puts that up at the apex instead of the impact painting.
    if (ctx.actingId === actorId && !odApex(ctx, actorId)) ctx.stage.actor(actorId)?.setPose('attack');
  };
  // Motion pass (lane "core"): the sampled strike reaches its contact with the blow already landing on it, so a painting put up AT the contact would be replaced by the follow-through in
  // the same frame and never be seen. It goes up on the strike's `travelPeak` mark instead (the fastest frame, where a swap is hidden best), and `reached` only marks the contact. Step 2: the
  // way out is a swap on a mark too: the impact painting is held through the blow and the 0.2 s hold, and goes to the follow-through (or the idle) on the `settlePeak` mark, the fastest frame home.
  if (curvesOn()) {
    marksSwaps(ctx).add(actorId);
    return { hold: contact.hold, reached: contact.reached, impact, settle: () => settleSwap(ctx, actorId) };
  }
  return {
    hold: contact.hold,
    reached: () => {
      contact.reached();
      impact();
    },
  };
}

/**
 * The hit has landed: put up the attacker's follow-through painting. Returns how long the strike
 * should stay at full reach for it (0 when there is no painting or REDUCE MOTION is on).
 */
export function followThrough(ctx: EventCtx, attackerId: CombatantId): number {
  if (marksSwaps(ctx).has(attackerId)) return 0; // motion pass, step 2: the way out is swapped on the strike's `settlePeak` mark (below), not at the blow
  if (!keysOn(ctx) || ctx.stage?.paints?.(attackerId, 'follow') !== true) return 0;
  if (odKeyHolds(ctx, attackerId)) return 0; // r37 slot: the move's own key painting stays up
  ctx.stage.actor(attackerId)?.setPose('follow');
  return FOLLOW_BEAT_MS;
}

// ------------------------------------------------------------------ motion pass, step 2: the way out, swapped on a mark

/** The attackers whose key poses are swapped on the strike's marks (the new curves are on and their wind-up painting led), per playback. */
const onMarks = new WeakMap<EventCtx, Set<CombatantId>>();
function marksSwaps(ctx: EventCtx): Set<CombatantId> {
  let s = onMarks.get(ctx);
  if (!s) onMarks.set(ctx, (s = new Set()));
  return s;
}

/** An action is over: nothing is waiting on a mark any more (`actionEnd`). */
export function clearMarksSwaps(ctx: EventCtx): void {
  onMarks.get(ctx)?.clear();
}

/**
 * The strike has turned for home (its `settlePeak` mark, the fastest frame of the way back): the impact painting goes to the follow-through when the figure has one (D-313), else to the
 * idle. Only while the action is still on and the move's own key painting (an Overdrive's) is not what holds the figure; `actionEnd` still puts the idle up at the very end.
 */
export function settleSwap(ctx: EventCtx, actorId: CombatantId): void {
  marksSwaps(ctx).delete(actorId);
  if (ctx.actingId !== actorId || odKeyHolds(ctx, actorId)) return;
  const actor = ctx.stage.actor(actorId);
  actor?.setPose(keysOn(ctx) && ctx.stage?.paints?.(actorId, 'follow') === true ? 'follow' : 'idle');
}
