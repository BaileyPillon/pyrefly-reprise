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
 * **FFX-2's "no motion over an open command menu" (D-357, `MotionGate`, `KeySlots.menuBlocks`) covers the punch, the short hit-stop and the rumble** (integration, 2026-10-22; the lane's review F7
 * had left the stop and the rumble out, on the reading that the stop holds only the field clock and the rumble is felt, not seen; the driver's rule is that no new piece plays over an open menu): the
 * camera punch reads `HitInfo.menuOpen` and is zero under a menu, so does the short stop (`SpectacleRules.planHit`), and {@link allowed} reads `menuBlocks` for the pad. Asked when a blow lands, like
 * the other looks. The contact shadow is ground contact, not a motion look.
 *
 * Ports only: no `three`, no DOM, no engine state, no RNG.
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import type { EventCtx } from '../BattlePresenterEvents.ts';
import { menuBlocks } from '../KeySlots.ts';
import { rumbleOn } from './FeelSwitch.ts';
import { rumbleForCharge, rumbleForHit, rumbleForOpen, rumbleForWin, sendRumble } from './Rumble.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

function allowed(ctx: EventCtx): boolean {
  return rumbleOn() && ctx.speed() === 'normal' && ctx.moments?.reducedMotion !== true && !menuBlocks(ctx); // FFX-2: nothing new plays over an open command menu (D-357; integration: the pad is held with the looks)
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

/** A boss's charge reaches its last step (`BattlePresenterBossFx.chargeFx`): a light pulse, with the same gates as every other (the lane "fx" beat does not rumble itself: `motion/FxWiring.ts`). */
export function rumbleCharge(ctx: EventCtx): void {
  if (allowed(ctx)) sendRumble(rumbleForCharge());
}

/**
 * The win. The caller sends it for a POSED win only (`presenterHooks.fxVictory`, `kind === 'pose'`): where the sources withhold the celebration (`VictoryPose`, `chapter-meta.victoryPose
 * === 'hold'`: FFX-2 Chapter IV after Bahamut, `research/ffx-vs-ffx2-presentation.md` 2.2) the pad stays still too. Review fix F2; whether the withheld win should give a soft opening pulse
 * is a question for Bailey (`docs/handoff/motion-feel.md`, open questions).
 */
export function rumbleWin(ctx: EventCtx): void {
  if (allowed(ctx)) sendRumble(rumbleForWin());
}
