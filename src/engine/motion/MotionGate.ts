/**
 * When BATTLE SPECTACLE's two motion looks may play (r38-motion, D-354; Bailey 2026-10-03 ~14:42 EDT,
 * "I'll go with all your recommendations thank you <3"): **SKILL TRAVEL** (a spell, skill or shot crosses the
 * field, both games) and **RUN-IN** (a girl runs to her target and home, FFX-2 only, sourced).
 *
 * One gate for both, so the rules cannot drift apart:
 *
 * - **BATTLE SPECTACLE is on**: the look's own switch on the EYE CANDY page (`eyeCandyOn('battleSpectacle')`, the
 *   look is master of its parts) *and* the stage's spectacle port (`BattleStage.fx.enabled()`, which also honours
 *   `?fx=`). FF7 never installs the port, so both looks are off there. No new setting and no save key: the two
 *   ids below are sub-effects of option C for captures and comparisons only (`?fxsub=-skilltravel,-runin`, or
 *   `__pyrefly.fx.sub(id, false)`), never a player path and never saved.
 * - **REDUCE MOTION plays today's version**: nothing flies, nothing runs, no camera truck.
 * - **Skip playback** shows no animation at all.
 * - **FFX-2 only: nothing plays over an open command menu** (`KeySlots.menuBlocks`, D-357: "keep the FFX-2 rule
 *   that nothing plays over an open command menu"). Under Active ATB a menu is often open, so those moves keep
 *   today's look; the gate is asked once at the move's start and again at each later step (the run home).
 *
 * Presentation only: no engine state, no RNG, no `three`, no DOM (hard rule 1).
 */
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { eyeCandy } from '../fx/EyeCandy.ts';
import { eyeCandyOn } from '../fx/eyeCandyFlags.ts';
import { menuBlocks, spectacleOn } from '../KeySlots.ts';

/** The two looks, as option C's sub-effect ids. */
export type MotionLook = 'skilltravel' | 'runin';

/** Does `look` play for the move now starting (or the step now due)? */
export function motionAllowed(ctx: EventCtx, look: MotionLook): boolean {
  if (!spectacleOn(ctx) || !eyeCandyOn('battleSpectacle') || !eyeCandy.sub('c', look)) return false;
  if (ctx.moments?.reducedMotion === true) return false;
  if (ctx.speed() === 'skip') return false;
  return !menuBlocks(ctx);
}
