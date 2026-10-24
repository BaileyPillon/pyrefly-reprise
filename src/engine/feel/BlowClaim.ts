/**
 * ONE STOP, ONE PUNCH, ONE PULSE PER BIG BLOW (integration of the lanes "feel" and "fx"; both games, presentation only; pure: no `three`, no DOM).
 *
 * The lane "fx" names two big moments in a fight: an Overdrive's opening blow and a boss's headline blow (`spellfx/FxMotionAdapter.ts`, `FX_BEATS['od-strike' | 'boss-big']`: "hit-stop 4 frames,
 * punch 0.025 to 0.03, rumble"). The lane "feel" already gives a blow its short hit-stop, camera punch and pulse from its own rules (`feel/HitStopShort.shortStopMs`, `PunchCurve.newPunchFraction`,
 * `Rumble.rumbleForHit`: the last blow of an Overdrive or Special and a boss's headline move: 4 frames, 0.03, a pulse). Registering a second stop, punch and rumble on the adapter's hooks
 * would stack two of each on the same blow. So the fx beat does not apply them; it CLAIMS the blow, and the feel rules read the claim and treat it as the finisher of a big action
 * (`HitInfo.fxBig`). One mechanism, one stop, and every gate stays where it was: REDUCE MOTION, playback speed, an open FFX-2 command menu, the per-piece switches
 * (`?hitstop=`, `?punch=`, `?rumble=`). With feel's pieces on `today` or off the claim changes nothing.
 */

const claimed = new WeakSet<object>();

/** The fx beat names this damage event an Overdrive's opening blow or a boss's headline blow. */
export function claimBigBlow(event: object): void {
  claimed.add(event);
}

/** Did the fx beat claim this damage event? */
export function bigBlowClaimed(event: object): boolean {
  return claimed.has(event);
}
