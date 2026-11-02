/**
 * THE REVIVE'S CROSS WITH AN EVEN SHARE (r74-revive, PR-0570; BOTH games: the KO run and the living mix are shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6, and nothing in `research/` gives either game a
 * revive blend, so the shape is `[ours]` and one for both).
 *
 * **What the harness reads.** It follows a figure's head and feet as the average of its two planes' points weighted by their fades. A revive crosses the lying painting to the toppled standing one, whose head
 * is set on the lying head (`living.ts` `meeting`, release 69) and whose body is longer than the curled lying one, and the instrument's "feet" of a LYING painting is where its silhouette is lowest (Wakka's is at the
 * head end of the painting), not where its feet are: with the real paintings the two planes' tracked feet are about 300 px apart for Wakka (at 1600 wide), and the weighted feet travel that distance while the incoming
 * painting's share goes from 0 to 1. The old cross (`KoFall.KO_CROSS_MS`, 75 ms: the standing painting in on a square, the lying one out linearly) is four frames at 60 Hz and takes 0.31 of the share in each of its two
 * middle frames: Wakka 92.8 px, Rikku 83.4, Kimahri 66.9, Yuna 64.3, Auron 63.5 and Lulu 53.7 in one frame at 60 Hz (the offline run with the real `PaintedActor`, the real masks and no neighbour, so no slide; the
 * live Yunalesca fight, FFX Chapter II, read 83 to 88 px for Wakka in four revives of four and 131.5 once, on a 2.6 ms frame). Nothing the player sees moves that far: two paintings fade, one out and one in. But the step is
 * what CHK-027 gates, and the cure is the same for the eye as for the instrument: no frame of the cross takes more than a ninth of the way.
 *
 * **The cure.** An even share (`share(u) = u`, so each frame moves the weighted points the same distance) over a longer cross, with the old cross's cap on the lesser plane kept: the pair is
 * `(1 - u) * g` and `u * g` with a dip `g` that takes the sum down to `2 * KO_CROSS_PEAK` in the middle, so the lesser plane is `KO_CROSS_PEAK` (0.382) at its most and the double image stays under CHK-027's 0.40 at any
 * overlap (the harness reads 0.22 to 0.32 for five figures, 0.18 to 0.28 with the old cross). At 160 ms it is 9.6 frames at 60 Hz, 19.2 at 120 and 23 at 144: the largest one-frame step of the weighted feet or head is
 * 34.7 px or less at 60 Hz (Wakka) and 17.6 or less at 120 Hz, where it was 53.7 to 92.8 and 27.2 to 47.8. The price: both paintings show for 6 frames (100 ms) instead of 2 (33 ms), and the figure is up
 * (upright, the lying painting gone) at 480 ms instead of 395, inside the presenter's 520.
 *
 * Only the revive's own cross: a fall's cross (`KoFall.KO_CROSS_MS`) is unchanged, the held `?kotopple=eased` revive keeps its 75 ms (its rise is 420 and the whole must stay inside `TIMING.revive`, 520), a figure that never
 * topples (an aeon, a giant, a foe) keeps the capped cross, and REDUCE MOTION plays no run at all. `?revive=today` plays release 73's cross. Pure: no `three`, no DOM.
 */

import { KO_CROSS_PEAK } from '../PoseBlend.ts';
import { queryWord } from './DemoGate.ts';

/** How long the revive's cross takes under `?revive=even`, ms of REAL time (a hit-stop never freezes a half-mixed pair of paintings): 160 plus the rise's 320 is 480, inside the presenter's 520 wait for a revive. */
export const REVIVE_CROSS_MS = 160;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * The fades of the lying painting (`from`) and the standing one (`to`) at progress `u` of the cross: the incoming painting's share of the pair is `u` itself, and the lesser fade is never above
 * `KO_CROSS_PEAK` (reached at `u` = 0.5, where both are 0.382). `from` is 1 and `to` 0 at the start, `from` 0 and `to` 1 at the end.
 */
export function reviveCross(u: number): { from: number; to: number } {
  const x = clamp01(u);
  const dip = 1 - (1 - 2 * KO_CROSS_PEAK) * 4 * x * (1 - x); // 1 at both ends, 2 * KO_CROSS_PEAK in the middle
  return { from: (1 - x) * dip, to: x * dip };
}

// ------------------------------------------------------------------ the switch

/** The words of `?revive=`: `today` is release 73's capped 75 ms cross, `even` the cross above. */
export type ReviveWord = 'today' | 'even';

/** THE PICK AS DEFAULT (r74-revive, the driver's call under Bailey's delegation, his to overturn): what an address that names neither word reads. ONE line to flip: `'today'` puts release 73's cross back everywhere. */
export const REVIVE_DEFAULT: ReviveWord = 'even';

let forced: ReviveWord | null = null;
let read: ReviveWord | null = null;

/** The word from a search string (pure): a listed word (`today` or `even`), else {@link REVIVE_DEFAULT}. */
export function reviveWordFromSearch(search: string | undefined): ReviveWord {
  const w = queryWord(search, 'revive');
  return w === 'today' || w === 'even' ? w : REVIVE_DEFAULT;
}

/** The word in force: a forced one (tests), else the address's, read once like the other URL switches. */
export function reviveWord(): ReviveWord {
  if (forced !== null) return forced;
  read ??= reviveWordFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return read;
}

/** Tests: force the word (`null` reads the address again). */
export function setReviveWord(value: ReviveWord | null): void {
  forced = value;
  if (value === null) read = null;
}

/** Does a revive play the longer even cross on this page? Both games, every chapter (the step is in the pose cross, not in a treatment); `?revive=today` is release 73's. */
export const reviveEvenOn = (): boolean => reviveWord() === 'even';
