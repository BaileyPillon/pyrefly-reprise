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

/** The lunge's duration, ms at timeScale 1 (`actor.lunge(distance, LUNGE_MS, ...)`). */
export const LUNGE_MS = 440;

/** The strike's impact, ms after the lunge starts at timeScale 1 (about 255). */
export const STRIKE_BEAT_MS = Math.round(LUNGE_MS * ATTACK_IMPACT);
