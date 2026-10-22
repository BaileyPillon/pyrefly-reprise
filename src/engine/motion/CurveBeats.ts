/**
 * The presenter's side of the new curves (motion pass, lane "core", step 1): the beats `BattlePresenterBeats` calls. Every function answers "not mine" (and the old code runs) unless
 * `CurvesSwitch.curvesOn()` is true and the actor has the optional port member, so the live game is unchanged by default. Ports only: no `three`, no DOM, no engine state, no RNG.
 *
 * Game case: both; the chapter's game picks the profile (`CurvesSwitch.curvesGame`). REDUCE MOTION does not gate any of these (Bailey: it turns off shake, punch, freeze and rumble only).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import type { ActorHandle } from '../BattlePresenterPorts.ts';
import { SPEED_SCALE } from '../BattlePresenterUtil.ts';
import type { LungeContact } from '../ContactBeat.ts';
import { LUNGE_MS } from '../StrikeBeat.ts';
import { heftOf } from './ActorCurves.ts';
import { curvesGame, curvesOn } from './CurvesSwitch.ts';

/** The presenter's playback speed scale for the move (1 normal, 0.32 fast, 0 skip), with the presenter's `timeScale`; floored so a skipped move still ends. */
export function moveScale(ctx: EventCtx): number {
  const speed = typeof ctx.speed === 'function' ? ctx.speed() : 'normal';
  return Math.max(0.02, SPEED_SCALE[speed] * (ctx.deps?.timeScale ?? 1));
}

/**
 * A physical attack's move. With the new curves on: the sampled strike (wind-up, arc, contact, hold, return, settle), which carries its own subtle squash. Otherwise exactly today's
 * `lunge` + 260 ms squash at 0.45 (FF7: its painted keys). `ranIn`: FFX-2's girl has run in (her leap already carried the lift, so the strike plays no arc).
 */
export function startAttackMove(ctx: EventCtx, actor: ActorHandle | undefined, plan: { distance: number; house: number }, contact: LungeContact, ranIn: boolean): void {
  if (curvesOn() && actor?.strike) {
    void actor.strike({ distance: plan.distance, game: curvesGame(), timeScale: moveScale(ctx), arc: !ranIn, contact, ...(contact.impact ? { marks: { travelPeak: contact.impact } } : {}) });
    return;
  }
  void Promise.all([actor?.lunge(plan.distance, LUNGE_MS, contact, plan.house), actor?.squash(260, 0.45)]);
}

/** A cast's lift as a share of the caster's height (`[ours]`; the sources do not describe one). */
export const CAST_LIFT = { ffx: 0.05, ffx2: 0.06 } as const;

/** The cast starts: the caster rises and holds (with the new curves on). A big body rises less. */
export function liftCaster(ctx: EventCtx, id: CombatantId): void {
  if (!curvesOn()) return;
  const a = ctx.stage.actor(id);
  if (!a?.liftTo) return;
  const h = Math.max(0.5, a.headPoint().y - a.position.y);
  a.liftTo(h * CAST_LIFT[curvesGame()] * (1 - 0.5 * heftOf(h)), 240 * moveScale(ctx));
}

/** The spell has landed (or the action is over): the caster comes down. Safe to call any number of times, in any mode. */
export function releaseCastLift(ctx: EventCtx, id: CombatantId | null | undefined): void {
  if (id) ctx.stage.actor(id)?.liftRelease?.();
}

/** FFX-2's run-in arc: a leap with the new curves on (take-off crouch, stretch, landing squash), else today's sine hop. */
export function arcFor(actor: ActorHandle, height: number, ms: number): Promise<void> {
  return curvesOn() && actor.leap ? actor.leap(height, ms) : actor.hop(height, ms);
}
