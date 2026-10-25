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
import { curvesGame, curvesOn } from './motion/CurvesSwitch.ts';
import { PROFILES, defaultPaceFactor, heftFactors } from './motion/StrikeCurve.ts';

/** The lunge's duration, ms at timeScale 1 (`actor.lunge(distance, LUNGE_MS, ...)`). */
export const LUNGE_MS = 440;

/** The strike's impact, ms after the lunge starts at timeScale 1 (about 255). */
export const STRIKE_BEAT_MS = Math.round(LUNGE_MS * ATTACK_IMPACT);

/**
 * The strike's beat NOW, ms at timeScale 1 and pace 1 (what `BattlePresenterSfx` multiplies by the speed and the pace): today's {@link STRIKE_BEAT_MS}, or with the new curves on
 * (motion pass, lane "core") the contact of the sampled strike: wind-up plus travel of the chapter's game's profile, written at the default pace, so divided by it here. The sound
 * lead stays on the blow. `heft` (0 for a party-sized figure up to 1 for a default-size foe; `ActorHandle.strikeHeft`): a heavy body's wind-up and travel run longer (`heftFactors`), so a
 * boss's blow lands later than the party's and its sound must be asked for later too (review MAJOR-2: Seymour Flux's swing led his blow by 116 ms).
 */
export function strikeBeatNow(heft = 0, realContactMs?: number): number {
  if (!curvesOn()) return STRIKE_BEAT_MS;
  if (realContactMs !== undefined) return realContactMs; // `?curves=real` / `real-snappy` (`motion/RealBeats.realContactMsOf`): the real clip's contact frame, with the table's own times (no heft stretch on a real boss)
  const p = PROFILES[curvesGame()];
  return Math.round(((p.windupMs + p.travelMs) * heftFactors(heft).time) / defaultPaceFactor(p.game));
}
