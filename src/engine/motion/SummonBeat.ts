/**
 * AN AEON ARRIVES AND LEAVES (motion-fluidity pass, lane L2 "moves", item MF-15; curves audit C-04; FFX only as played: Chapter I's summons, FFX-2 has none; the code is shared). Behind `?summon=` (`today`
 * default, `leap`, `MoveSwitch.ts`). Ports only: no `three`, no DOM, no engine state (hard rule 1).
 *
 * **What was wrong (measured, r64, Ixion in Chapter I):** the aeon fades in on its spot over 620 ms with no movement, and only when the fade is done does `hop(0.5, 520)` lift it, a sine arc that leaves the floor at
 * 10 px a frame with no crouch and comes down at 10.4 px a frame on a stop with no landing squash. On the way out it fades 520 ms, THEN the party starts to fade back (620 ms), so for 8 frames (130 ms) nobody
 * is on the player's side. The same build does a proper crouch, stretch and landing squash for the victory cheer.
 *
 * **`?summon=leap`:** the arrival is the leap (`CurveDriver.LeapRun`: a crouch, a lift that leaves and meets the floor at rest, a stretch, a landing squash) and it starts when the fade has passed
 * {@link LEAP_AT} of its length, so the aeon is already rising as it solidifies; the party crosses back in while the aeon fades out, starting {@link CROSS_AT} of the way through its fade, so the player's
 * side is never empty and the whole dismissal is 390 ms shorter.
 */
import type { ActorHandle } from '../BattlePresenterPorts.ts';
import { moveWord } from './MoveSwitch.ts';

/** The aeon's arrival fade and hop, ms (`BattlePresenterBeats.summon`'s own numbers). */
export const ARRIVE_FADE_MS = 620;
export const ARRIVE_HOP_MS = 520;
/** The height of the arrival, world units. */
export const ARRIVE_HEIGHT = 0.5;
/** `leap`: the leap starts when the fade is this far through. */
export const LEAP_AT = 0.6;
/** `leap`: the party starts to fade back in when the aeon's fade-out is this far through. */
export const CROSS_AT = 0.25;

/**
 * Called as the aeon's fade-in starts. Returns what to do when the fade is done: today the sine hop; with `?summon=leap` the leap is scheduled on the aeon's own clock for {@link LEAP_AT} of the fade (so
 * nothing is left to do when it ends).
 */
export function arrival(actor: ActorHandle | undefined): () => void {
  if (actor && moveWord('summon') === 'leap' && actor.leap && actor.waitMs) {
    void actor.waitMs(ARRIVE_FADE_MS * LEAP_AT).then(() => actor.leap!(ARRIVE_HEIGHT, ARRIVE_HOP_MS, { smooth: true }));
    return () => undefined;
  }
  return () => void actor?.hop(ARRIVE_HEIGHT, ARRIVE_HOP_MS);
}
