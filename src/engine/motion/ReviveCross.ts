/**
 * THE REVIVE'S CROSS WITH AN EVEN SHARE (r74-revive, PR-0570; BOTH games: the KO run and the living mix are shared by FFX chapters 1 to 3 and FFX-2 chapters 4 to 6, and nothing in `research/` gives either game a
 * revive blend, so the shape is `[ours]` and one for both).
 *
 * **What the harness reads.** It follows a figure's head and feet as the average of its two planes' points weighted by their fades. A revive crosses the lying painting to the toppled standing one, whose head
 * is set on the lying head (`living.ts` `meeting`, release 69) and whose body is longer than the curled lying one, and the instrument's "feet" of a LYING painting is where its silhouette is lowest (Wakka's is at the
 * head end of the painting), not where its feet are: the two planes' tracked feet are 300 to 420 px apart for Wakka (at 1600 wide, the live camera), and the weighted feet travel that distance while the incoming
 * painting's share goes from 0 to 1. The old cross (`KoFall.KO_CROSS_MS` 75 ms, or the page's 100 ms under the demo motion, `koCrossMs()`: the standing painting in on a square, the lying one out linearly) is four to six
 * frames at 60 Hz and takes 0.31 of the share in each of the middle two of the four (0.24 at most in the page's six): in the page's world (demo motion on, the live stage's camera) Wakka steps 85 px in one frame at 60 Hz, Rikku 76.5, Kimahri 59.2,
 * Yuna 55.8, Auron 55.2, Songstress Yuna 50.4, Lulu 46.9, Rikku the thief 46.0, Paine 44.1 and Tidus 42.5 (offline with the real `PaintedActor`, the real masks and no neighbour, so no slide; the live Yunalesca fight,
 * FFX Chapter II, read 88, 89.7 and 90.6 for Wakka in four revives of four and 131.5 once, on a 2.6 ms frame). Nothing the player sees moves that far: two paintings fade, one out and one in. But the step is
 * what CHK-027 gates, and the cure is the same for the eye as for the instrument: no frame of the cross takes more than a twelfth of the way.
 *
 * **The cure.** An even share (`share(u) = u`, so each frame moves the weighted points the same distance) over a longer cross, with the old cross's cap on the lesser plane kept: the pair is
 * `(1 - u) * g` and `u * g` with a dip `g` that takes the sum down to `2 * KO_CROSS_PEAK` in the middle, so the lesser plane is `KO_CROSS_PEAK` (0.382) at its most and the double image stays under CHK-027's 0.40 at any
 * overlap. At 200 ms it is 12 frames at 60 Hz, 24 at 120 and 28.8 at 144: the largest one-frame step of the weighted feet or head, over the ten figures, is 35.5 px at 60 Hz (the FFX-2 songstress's head; Wakka's feet 34.8),
 * 37.3 on a live run's frame times (15.4 to 18.2 ms), 17.9 at 120 Hz and 14.8 at 144, where it was 42.5 to 85, 21.7 to 42.8 and 17.9 to 35.7. The price: both paintings show for 11 frames (183 ms) instead of 5 (83 ms) at 60 Hz,
 * each painting at 0.15 or more for 7 frames (117 ms) instead of 3 (50 ms), and the figure is up (upright, the lying painting gone) at 500 ms instead of 420 (the page's old revive; 395 headless), inside the
 * presenter's 520.
 *
 * Only the revive's own cross: a fall's cross (`KoFall.KO_CROSS_MS`) is unchanged, the held `?kotopple=eased` revive keeps its capped cross (its rise is 420 and the whole must stay inside `TIMING.revive`, 520), a figure that
 * never topples (an aeon, a giant, a foe) keeps the capped cross, and REDUCE MOTION plays no run at all. `?revive=today` plays release 73's cross. Pure: no `three`, no DOM.
 */

import { KO_CROSS_PEAK } from '../PoseBlend.ts';
import { queryWord } from './DemoGate.ts';

/**
 * How long the revive's cross takes under `?revive=even`, ms of REAL time (a hit-stop never freezes a half-mixed pair of paintings). 200 ms, twelve frames at 60 Hz: with an even share a frame moves the weighted
 * feet or head by (the gap between the two paintings' points) over (the frames in the cross), and the gap is the PAGE's, not the headless engine's (round 33b's review of the first r74 commit): the live stage draws
 * Wakka 460 to 474 px tall and its demo motion makes today's cross 100 ms, so the first commit's 160 ms cross read 43.4 px for Wakka at 60 Hz (44.7 on a live run's frame times), over the 40 px line, and 180 ms read 38.7 (39.9), too near it; 200 ms reads 34.8 (35.9) for Wakka and 35.5 (37.3) at
 * most for the other nine figures (the FFX-2 songstress's head). Plus {@link REVIVE_RISE_MS} it is 500, inside the presenter's 520 wait.
 */
export const REVIVE_CROSS_MS = 200;
/** The even revive's rise, ms of field time: 200 plus 300 is 500, 20 ms (a frame and a fifth at 60 Hz) inside the presenter's 520 wait for a revive; `KoFall.RISE_MS` (320) is release 73's rise, kept under `?revive=today`. */
export const REVIVE_RISE_MS = 300;

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

/** THE PICK AS DEFAULT (r74-revive, the driver's call under Bailey's delegation, his to overturn): what an address that names neither word reads. ONE line to flip, plus the pin of it in `revive-even-cross-run.test.ts` (every other test follows the default): `'today'` puts release 73's cross back everywhere. */
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
