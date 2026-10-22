/**
 * THE PRESENTER'S SIDE OF THE MOTION SOUNDS (motion program, lane "feel", step 2): the beats the presenter owns call these; a figure's own beats (a lunge begins, a hop lands) are
 * reported by the figure (`PaintedActor`). Each one only builds a {@link MotionBeat} and hands it to {@link motionBeat}, which does nothing unless the page installed its sink and
 * `?motionsfx=` (or `?pack=demo`) is on in Chapter I or Chapter IV (`app/motionSfxSink.ts`), so with the switch off the beat does what it always did.
 *
 * Ports only: no `three`, no DOM, no engine state, no RNG.
 */
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { heftOfHeight, motionBeat } from './MotionBeats.ts';

/** How heavy a figure is from its head's height over its feet; 0 for a stage double that has no head (a party member's weight). Never throws. */
export function actorHeft(actor: { headPoint?: () => { y: number }; position?: { y: number } } | undefined | null): number {
  try {
    if (actor?.headPoint && actor.position) return heftOfHeight(actor.headPoint().y - actor.position.y);
  } catch {
    /* a stage double with no head */
  }
  return 0;
}

/** A cast begins (`cue(ctx, 'cast')`): the cloth rustle of the caster's arms and robes, lower for a bigger body. */
export function castBeat(ctx: EventCtx): void {
  let heft = 0;
  try {
    const id = ctx.actingId;
    heft = actorHeft(id ? ctx.stage.actor(id) : undefined);
  } catch {
    /* a stage with no actors: a party member's rustle */
  }
  motionBeat({ kind: 'cast', heft });
}
