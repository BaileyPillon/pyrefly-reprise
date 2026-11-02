/**
 * THE FAST-FORWARD FLOOR'S WORD (`?fastfloor=`; r73-fast review fix MAJOR-1, 2026-11-01; BOTH games, the house strike only; presentation, no number of a fight changes).
 *
 * The floor (`StrikeCurve.crossingFloors`) keeps a house strike's travel and way home at the length they have at normal speed, so the figure never crosses the stage in a few frames at the `fast` playback speed. It costs
 * fast-forward time (about 170 ms per house-strike attack to the blow, 483 ms against 317 per party figure's whole action: the speed-up drops from 3.0x to 2.0x), which is a feel question Bailey answers (rule 9). This word is
 * how he compares the three, one build, same seed, only the word changed. (The handoff's first guess for the middle, keeping 0.6, is NOT offered: measured on the real actor it reads a ratio of 3.7 to 4.6 and a jerk of 174 to 252 px at
 * reaches 3 and 4.4, over the detector's line; the step law is 1 / share but the detector reads the step against its neighbours, which does not scale with it.)
 *
 * | word | what the crossings keep of their length at normal speed | the step per frame at fast |
 * |---|---|---|
 * | `floor` (**default**) | all of it (1) | what the same strike takes at normal speed |
 * | `part` | 0.75 of it | 1 / 0.75 = 1.33 times normal's: the detector's ratio to the neighbours 2.3 to 2.5 (its line is 3) and no jerk over 100 px at 280 to 600 px drawn and reaches 1.4 to 4.4 (`r73-fast-review.test.ts`) |
 * | `today` | none (release 72's fast: the crossings take the speed) | 2.9 times normal's at fast (148, 307 and 441 px against 51, 104 and 151 at 420 px drawn); the whole reach in one frame at skip |
 *
 * Read once, like the other address words (`MoveSwitch.ts`); {@link setFastFloor} forces one for what starts from now on (tests). Chapter I and Chapter IV play real rows, which no word touches. Pure: no `three`, no DOM but
 * the address of the page (hard rule 1).
 */
import { queryWord } from './DemoGate.ts';

export type FastFloorWord = 'floor' | 'part' | 'today';

/** The share of its normal-speed length each crossing keeps, per word. */
export const FAST_FLOOR_KEEP: Readonly<Record<FastFloorWord, number>> = { floor: 1, part: 0.75, today: 0 };

/** The word the address names, else `floor` (pure). */
export function fastFloorFromSearch(search: string | undefined): FastFloorWord {
  const w = queryWord(search, 'fastfloor');
  return w === 'part' || w === 'today' ? w : 'floor';
}

let forced: FastFloorWord | null = null;
let read: FastFloorWord | null = null;

/** The word in force: a forced one, else the address's (read once). */
export function fastFloor(): FastFloorWord {
  if (forced !== null) return forced;
  if (read === null) read = fastFloorFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return read;
}

/** Tests: force the word (`null` reads the address again). */
export function setFastFloor(value: FastFloorWord | null): void {
  forced = value;
  if (value === null) read = null;
}

/** The share of its normal-speed length a crossing keeps now: 1 (`floor`), 0.75 (`part`), 0 (`today`: the speed takes it all). */
export function fastFloorKeep(): number {
  return FAST_FLOOR_KEEP[fastFloor()];
}
