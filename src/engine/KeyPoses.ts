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
 * The lunge's contact, with the impact painting put up at the apex (after the wind-up). Only while
 * the action is still on: a lunge is never awaited, so its apex can come after `actionEnd` when the
 * playback runs ahead (seen in Chapter IV under the ATB), and the figure must not stay on its impact.
 */
export function impactAtApex(ctx: EventCtx, actorId: CombatantId, contact: LungeContact): LungeContact {
  return {
    hold: contact.hold,
    reached: () => {
      contact.reached();
      // r37 slot (FFX-2): a move with its own key painting puts that up at the apex instead of the impact painting.
      if (ctx.actingId === actorId && !odApex(ctx, actorId)) ctx.stage.actor(actorId)?.setPose('attack');
    },
  };
}

/**
 * The hit has landed: put up the attacker's follow-through painting. Returns how long the strike
 * should stay at full reach for it (0 when there is no painting or REDUCE MOTION is on).
 */
export function followThrough(ctx: EventCtx, attackerId: CombatantId): number {
  if (!keysOn(ctx) || ctx.stage?.paints?.(attackerId, 'follow') !== true) return 0;
  if (odKeyHolds(ctx, attackerId)) return 0; // r37 slot: the move's own key painting stays up
  ctx.stage.actor(attackerId)?.setPose('follow');
  return FOLLOW_BEAT_MS;
}
