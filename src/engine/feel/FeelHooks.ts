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
 * **FFX-2's "no motion over an open command menu" (D-357, `MotionGate`, `KeySlots.menuBlocks`) reaches the VISIBLE looks only** (review F7, 2026-10-22): the camera punch reads `HitInfo.menuOpen`
 * and is zero under a menu. The hit-stop does not: it holds the field clock and the presenter's waits (`ctx.sleep`), never the Active ATB pump (`pace.ts`) and never the menu, so nothing
 * on screen moves under it. The rumble does not either: it is felt, not seen, and tells the player a blow landed while they were choosing. The contact shadow is ground contact, not a
 * motion look. If Bailey wants the pad quiet under a menu too, it is one `menuBlocks` read in {@link allowed} (open question S3-3 in `docs/handoff/motion-feel.md`).
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
      first: (event.hitIndex ?? 0) === 0,
      taken: side === 'party' || side === 'aeon',
    }),
  );
}

/** An Overdrive or Special opens. */
export function rumbleOpen(ctx: EventCtx, kind: 'overdrive' | 'special' | 'other'): void {
  if (allowed(ctx)) sendRumble(rumbleForOpen(kind));
}

/**
 * The win. The caller sends it for a POSED win only (`presenterHooks.fxVictory`, `kind === 'pose'`): where the sources withhold the celebration (`VictoryPose`, `chapter-meta.victoryPose
 * === 'hold'`: FFX-2 Chapter IV after Bahamut, `research/ffx-vs-ffx2-presentation.md` 2.2) the pad stays still too. Review fix F2; whether the withheld win should give a soft opening pulse
 * is a question for Bailey (`docs/handoff/motion-feel.md`, open questions).
 */
export function rumbleWin(ctx: EventCtx): void {
  if (allowed(ctx)) sendRumble(rumbleForWin());
}
