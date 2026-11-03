/**
 * A virtual clock for the hidden chapters' typed words (r74-int fix pass, 2026-11-03; tests only, both games).
 *
 * The board's doors judge a typed word by the gap between its letters (`WordDoor`, `KEY_GAP_MS` = 2000 ms), and `ChapterSelectScreen` feeds them `performance.now()`, the wall clock, while every
 * other part of a door suite is driven by a fake frame clock. A door suite that mounts forty real boards in a loop (the "each word opens its own chapter" and "the first word to finish wins" cases,
 * fifteen doors at the r74 integration) therefore failed whenever the test process stalled for two seconds inside one word (a major garbage collection with forty boards and their `Input`s alive,
 * a busy PC with five workers): a different word lost in every run, `yrp` and `waker` most often because they come last in the table when the heap is fullest, and every case passed alone. Typing a word
 * is instant, so these cases need no real time at all: this clock moves one millisecond per read, so no word they type can be stale, whatever the machine is doing.
 *
 * Use it inside an `it`; `vi.restoreAllMocks()` in the suite's `afterEach` puts the real clock back. The cases that are ABOUT the gap (a pause over 2 s) set their own clock and do not use this one.
 */
import { vi } from 'vitest';

/** What each read of the clock adds, ms. Small enough that the most keys any case types in a row (a word and a word, with forty boards listening) never come near `KEY_GAP_MS`. */
export const DOOR_CLOCK_STEP_MS = 1;

/** Replace `performance.now` with a clock that starts at `startMs` and moves `DOOR_CLOCK_STEP_MS` per read. The spy is restored by `vi.restoreAllMocks()`. */
export function useDoorClock(startMs = 10_000): void {
  let t = startMs;
  vi.spyOn(performance, 'now').mockImplementation(() => (t += DOOR_CLOCK_STEP_MS));
}
