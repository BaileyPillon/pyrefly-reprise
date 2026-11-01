/**
 * The strike's beat, for the sound that leads it (SFX parity phase 2; `audio/sfxV2/beatTiming.ts`).
 *
 * Every physical action starts a lunge at `action-start` (`BattlePresenterBeats.actionStart`) and its impact is at
 * `ATTACK_IMPACT` of the move (`BattlePresenterActors.ts`; `ContactBeat.ts` makes the blow wait for it). So the swing
 * is asked for this long before the beat its sound belongs on: the mixer starts a recorded swing so that its PEAK
 * lands here instead of on the ask. Nothing else in the presenter reads these two numbers' product; the lunge's
 * duration lives here so the beat and the move cannot drift apart.
 *
 * Presentation only; imports one constant, no `three`, no DOM. Game case: both (FF7 has no sound voice).
 */

import { ATTACK_IMPACT } from './BattlePresenterActors.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { curvesGame, curvesOn } from './motion/CurvesSwitch.ts';
import { PROFILES, crossingFloors, defaultPaceFactor, heftFactors } from './motion/StrikeCurve.ts';

/** The lunge's duration, ms at timeScale 1 (`actor.lunge(distance, LUNGE_MS, ...)`). */
export const LUNGE_MS = 440;

/** The strike's impact, ms after the lunge starts at timeScale 1 (about 255). */
export const STRIKE_BEAT_MS = Math.round(LUNGE_MS * ATTACK_IMPACT);

/**
 * The strike's beat NOW, ms at timeScale 1 and pace 1 (what `BattlePresenterSfx` multiplies by the speed and the pace): today's {@link STRIKE_BEAT_MS}, or with the new curves on
 * (motion pass, lane "core") the contact of the sampled strike: wind-up plus travel of the chapter's game's profile, written at the default pace, so divided by it here. The sound
 * lead stays on the blow. `heft` (0 for a party-sized figure up to 1 for a default-size foe; `ActorHandle.strikeHeft`): a heavy body's wind-up and travel run longer (`heftFactors`), so a
 * boss's blow lands later than the party's and its sound must be asked for later too (review MAJOR-2: Seymour Flux's swing led his blow by 116 ms). `speed` (r73-fast): the playback scale the caller multiplies this by
 * (`playbackScaleOf`); under 1 the house strike's travel keeps its normal length, so the contact falls {@link strikeLagMs} later than the scale alone puts it, and the beat is written in the same units.
 */
export function strikeBeatNow(heft = 0, realContactMs?: number, speed = 1): number {
  if (!curvesOn()) return STRIKE_BEAT_MS;
  if (realContactMs !== undefined) return realContactMs; // `?curves=real` / `real-snappy` (`motion/RealBeats.realContactMsOf`): the real clip's contact frame, with the table's own times (no heft stretch on a real boss)
  const p = PROFILES[curvesGame()];
  return Math.round(((p.windupMs + p.travelMs) * heftFactors(heft).time) / defaultPaceFactor(p.game)) + strikeLagMs(heft, speed);
}

/**
 * r73-fast (both games): how much later the HOUSE strike's contact falls under a playback scale below 1 than (wind-up + travel) x scale, ms at scale 1 and pace 1 (the unit of {@link strikeBeatNow} and of the contact beat's
 * waits, which the presenter then multiplies by the scale). `resolveStrike` keeps the travel at its normal length at `fast` (the return is not waited on), so the contact is wind-up x scale + travel: a wait written for (wind-up + travel) x scale would
 * give up on the strike 170 ms before it lands (the blow on air, VP-1001-06) and the swing sound would peak that much early. Zero at scale 1 or more, with the curves off, and (the caller passes none) for a real strike.
 */
export function strikeLagMs(heft = 0, speed = 1): number {
  if (!curvesOn() || !(speed > 0) || speed >= 1) return 0;
  return Math.round(crossingFloors(PROFILES[curvesGame()], heftFactors(heft)).travelMs * (1 / speed - 1));
}

/** The playback scale the presenter's own waits take (`SPEED_SCALE` of the speed times the `timeScale`; 0 under `skip`): what `strikeBeatNow`'s and `strikeLagMs`'s `speed` is. A test double may carry no speed. */
export function playbackScaleOf(ctx: Pick<EventCtx, 'speed' | 'deps'>): number {
  const speed = typeof ctx.speed === 'function' ? ctx.speed() : 'normal';
  return SPEED_SCALE[speed] * (ctx.deps?.timeScale ?? 1);
}
