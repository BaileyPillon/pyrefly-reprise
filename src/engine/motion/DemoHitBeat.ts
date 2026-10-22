/**
 * DEMO MOTION, PART 4: HIT FEEL, AT THE BEAT (`?motion=demo`; `DemoMotion.ts` has the switch and the whole picture, `DemoHit.ts` the numbers; both games). The two places
 * `BattlePresenterBeats.damage` decides what a blow does to the picture, moved here so the switch is one call each and the old behaviour sits beside the new:
 *
 * - {@link blowFlash}: the struck figure's flash. Today a warm 200 ms flash (white for 260 ms on a crit); under the switch a 0.08 s white one for every damaging blow, at full strength on a party-sized
 *   figure and capped on a big one (`DemoHit.demoFlashPeak`: it stacked with option C's impact bloom into a white blob on a boss). **REDUCE FLASHES skips the white flash** (release 60); the caller's
 *   own rule (`blowFlashes`: the first blow of an action only) and the actor's softening (`PaintedActor.flash`) still apply to what is left.
 * - {@link holdBlow}: what happens after the numeral. Today a camera shake and, on a heavy blow, the presenter's own hit-stop sleep (or option C's, when BATTLE SPECTACLE is on); under the
 *   switch the stop and the shake grow with the blow. With BATTLE SPECTACLE on, option C has already frozen the field and shaken the camera (`SpectacleRules.planHit`, demo branch) and the beat
 *   waits out the stop it made; with it off the beat shakes the camera itself and sleeps the stop, which holds the presenter's timeline but not the field (a held frame needs option C's clock).
 *
 * The presenter's timeline and the field clock are the presentation's; the engine, its RNG and the ATB pump never see either. Pure: no `three`, no DOM, ports only (hard rule 1).
 */
import type { BattleEvent } from '../../battle/common/types.ts';
import { TIMING, type EventCtx } from '../BattlePresenterEvents.ts';
import { DEMO_FLASH_MS, TODAY_LIGHT_HOLD_MS, demoFlashPeak, demoShakeAmplitude, demoStopMs, hitPower } from './DemoHit.ts';
import { demoMotionOn } from './DemoMotion.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

/** Whatever answers `flash` (a `PaintedActor`, or the stub of a test). `poseSize` is the plane showing, in world units (a `PaintedActor` has it; a stub may not). */
interface Flashable {
  flash(colour?: number | string, ms?: number, peak?: number): void;
  readonly poseSize?: readonly [number, number];
}

/**
 * The flash on the struck figure. `reduceFlashes` is the player's REDUCE FLASHES row (`ctx.moments?.reducedFlashes`): under the demo motion it skips the 0.08 s white flash altogether, where
 * today's warm flash (which the actor softens to 0.35) is the path without the switch.
 */
export function blowFlash(target: Flashable | undefined, event: Damage, reduceFlashes = false): void {
  if (!target) return;
  if (demoMotionOn()) {
    if (reduceFlashes) return;
    const size = target.poseSize;
    target.flash(0xffffff, DEMO_FLASH_MS, demoFlashPeak(size ? Math.abs(size[0] * size[1]) : undefined));
  } else target.flash(event.crit ? 0xffffff : 0xffd0c0, event.crit ? 260 : 200, event.crit ? 1 : 0.8);
}

/**
 * After the numeral: the camera shake and the hold. `fxc` is option C's answer (null when it is off): its wait in ms and whether it shook the camera.
 * Without the switch this is exactly what `damage` did inline before.
 */
export async function holdBlow(ctx: EventCtx, event: Damage, heavy: boolean, fxc: { waitMs: number; shook: boolean } | null): Promise<void> {
  if (!demoMotionOn()) {
    if (heavy) {
      if (!fxc?.shook) ctx.stage.camera.shake(0.16, 340);
      await ctx.sleep(Math.max(TIMING.hitStop, fxc?.waitMs ?? 0));
    } else if (event.hitIndex === 0 && !fxc?.shook) {
      ctx.stage.camera.shake(0.08, 220);
    }
    return;
  }
  if (fxc) {
    if (fxc.waitMs > 0) await ctx.sleep(fxc.waitMs); // option C froze the field and shook the camera for this blow; hold the timeline for as long
    return;
  }
  // BATTLE SPECTACLE is off: the beat does the shake itself and sleeps the stop (REDUCE MOTION and playback speed other than normal keep today's nothing).
  const still = ctx.moments?.reducedMotion === true || ctx.speed() !== 'normal';
  const facts = {
    crit: event.crit === true,
    heavy,
    big: false,
    hitIndex: event.hitIndex ?? 0,
    hitCount: event.hitCount ?? 1,
    last: (event.hitIndex ?? 0) >= (event.hitCount ?? 1) - 1,
    power: hitPower(event.amount, ctx.hpMaxOf?.(event.targetId)),
  };
  const stop = still ? 0 : demoStopMs(facts, TODAY_LIGHT_HOLD_MS.ffx2); // no game here: the lower of option C's two light holds (today the beat holds an ordinary blow for nothing)
  if (!still && (facts.hitIndex === 0 || facts.last)) ctx.stage.camera.shake(demoShakeAmplitude(facts), 220 + stop);
  if (stop > 0) await ctx.sleep(stop);
}
