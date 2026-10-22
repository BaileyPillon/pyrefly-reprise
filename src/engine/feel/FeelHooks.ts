/**
 * THE PRESENTER'S SIDE OF THE FEEL SWITCHES (motion program, lane "feel"). The beats call these at the moments they decorate (`fx/c/presenterHooks.ts` forwards them); each
 * checks its own switch first, so with `?rumble=` unnamed, outside the two demo chapters, and in every unit test, each one is a no-op and the beat does what it always did.
 *
 * Only the rumble lives here: the camera punch and the hit-stop are `fx/c/SpectacleRules.planHit`'s (they extend the spectacle's own), the shadow is the actor's.
 *
 * Gates, all of which must hold for a pad to rumble: the switch is on in the running chapter (`FeelSwitch.rumbleOn`); the playback speed is `normal` (nothing happens at `fast` or
 * `skip`, the same rule as the hit-stop); REDUCE MOTION is off (Bailey: it turns off "Shake, punch, freeze, rumble"); and, in the page-side sink, the last thing the player pressed
 * was a pad ("never on keyboard play") and a pad with a `vibrationActuator` is connected.
 *
 * Ports only: no `three`, no DOM, no engine state, no RNG.
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { rumbleOn } from './FeelSwitch.ts';
import { rumbleForHit, rumbleForOpen, rumbleForWin, sendRumble } from './Rumble.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

function allowed(ctx: EventCtx): boolean {
  return rumbleOn() && ctx.speed() === 'normal' && ctx.moments?.reducedMotion !== true;
}

/** A blow lands. `mark` is the action's facts (`presenterHooks.ActionMark`); `last` is the blow the action shows last. */
export function rumbleHit(
  ctx: EventCtx,
  event: Damage,
  heavy: boolean,
  mark: { kind: 'overdrive' | 'special' | 'other'; bossBig: boolean } | undefined,
  last: boolean,
): void {
  if (!allowed(ctx)) return;
  const side = ctx.stage.sideOf?.(event.targetId);
  sendRumble(
    rumbleForHit({
      crit: event.crit === true,
      heavy,
      big: mark !== undefined && mark.kind !== 'other',
      special: mark?.kind === 'special',
      last,
      bossBig: mark?.bossBig === true,
      taken: side === 'party' || side === 'aeon',
    }),
  );
}

/** An Overdrive or Special opens. */
export function rumbleOpen(ctx: EventCtx, kind: 'overdrive' | 'special' | 'other'): void {
  if (allowed(ctx)) sendRumble(rumbleForOpen(kind));
}

/** The win. */
export function rumbleWin(ctx: EventCtx): void {
  if (allowed(ctx)) sendRumble(rumbleForWin());
}
