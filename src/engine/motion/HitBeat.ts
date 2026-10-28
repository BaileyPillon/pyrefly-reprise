/**
 * THE PRESENTER'S SIDE OF THE HIT REACTION (motion-fluidity pass, lane L2, item MF-03; both games; `HitReaction.ts` has the whole picture). The one call `BattlePresenterBeats.damage` makes where a damaging
 * blow lands on a figure: with `?hit=today` (the default) it does exactly what that line did before, `target.shake(0.1 | 0.16, 340)` and `target.recoil(ms, 0.22 | 0.34)`; with `?hit=ramp` the shake is the
 * ramped, seeded rattle; with `?hit=knock` the shake and the recoil's push give way to one directional, power-scaled knock-back (the recoil still brings the `hurt` painting, the tint and the smear's hint).
 *
 * Ports only: no `three`, no DOM, no engine state, no RNG (hard rule 1). A figure without the optional `hitReact` member (a test double, FF7's sprites) and REDUCE MOTION (the actor answers false) play today's.
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import type { ActorHandle } from '../BattlePresenterPorts.ts';
import { hitPower } from './DemoHit.ts';
import { PEAK_MS, hitSeed, knockAmplitude, squashFor } from './HitReaction.ts';
import { moveWord } from './MoveSwitch.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

/** Which way along the stage the struck figure is pushed: away from the attacker when both stand on the field, else back from the side it stands on (the party at the left faces right). */
export function pushDirection(ctx: EventCtx, event: Damage, target: ActorHandle): 1 | -1 {
  const src = event.sourceId !== undefined && event.sourceId !== event.targetId ? ctx.stage.actor(event.sourceId) : undefined;
  if (src) {
    const dx = target.position.x - src.position.x;
    if (Math.abs(dx) > 0.05) return dx > 0 ? 1 : -1;
  }
  return ctx.stage.sideOf(event.targetId) === 'enemy' ? 1 : -1;
}

/** MF-12: how long the hurt painting may stay up while the rest of a string of blows comes, ms (the next blow's flinch takes it over; the last one lets go on its own timer). */
export const STRING_HOLD_MS = 1400;

/**
 * MF-12 (`?hurtstring=hold`): when the action still has a damaging blow for THIS target after the one in hand, the long hold ({@link STRING_HOLD_MS}); else undefined (the flinch's own timer). Read from the burst the event
 * is played in; when the burst is not the one the event came from (FFX-2's ATB can overlap two), nothing is held.
 */
export function stringHold(ctx: EventCtx, event: Damage): number | undefined {
  const burst = ctx.burst;
  if (moveWord('hurtstring') !== 'hold' || !burst || burst.events[burst.at] !== (event as unknown)) return undefined;
  for (let i = burst.at + 1; i < burst.events.length; i++) {
    const e = burst.events[i]!;
    if ((e.type === 'action-end' || e.type === 'action-start') && e.actorId === event.sourceId) return undefined;
    if (e.type === 'damage' && e.targetId === event.targetId && e.amount > 0 && e.sourceId === event.sourceId) return STRING_HOLD_MS;
  }
  return undefined;
}

/** A blow lands on `target`: the reaction `?hit=` asks for. `recoilMs` is the recoil's length (the presenter's, or `?curves=real`'s). */
export function hitReact(ctx: EventCtx, event: Damage, target: ActorHandle | undefined, recoilMs: number): void {
  if (!target) return;
  const crit = event.crit === true;
  const distance = crit ? 0.34 : 0.22;
  const word = moveWord('hit');
  const hold = stringHold(ctx, event);
  if (word !== 'today' && target.hitReact) {
    const seed = hitSeed(event.targetId, event.sourceId, event.hitIndex, event.amount, event.seq);
    if (word === 'ramp') {
      if (target.hitReact({ style: 'ramp', amp: crit ? 0.16 : 0.1, ms: 340, dirX: 1, seed })) {
        void recoilOf(target, recoilMs, distance, undefined, hold);
        return;
      }
    } else {
      const power = hitPower(event.amount, ctx.hpMaxOf?.(event.targetId));
      const amp = knockAmplitude(power, crit, target.strikeHeft?.() ?? 0);
      if (target.hitReact({ style: 'knock', amp, dirX: pushDirection(ctx, event, target), seed, squash: squashFor(power, crit) })) {
        void recoilOf(target, recoilMs, distance, { reach: amp, ms: PEAK_MS }, hold); // the push is the reaction's; the recoil keeps the hurt painting, the tint and the smear's hint
        return;
      }
    }
  }
  target.shake(crit ? 0.16 : 0.1, 340);
  void recoilOf(target, recoilMs, distance, undefined, hold);
}

/** `recoil` with only the arguments that were asked for, so the default call is the one the presenter always made. */
function recoilOf(target: ActorHandle, ms: number, distance: number, knock: { reach: number; ms: number } | undefined, hold: number | undefined): Promise<void> {
  if (hold !== undefined) return target.recoil(ms, distance, knock, hold);
  return knock ? target.recoil(ms, distance, knock) : target.recoil(ms, distance);
}
