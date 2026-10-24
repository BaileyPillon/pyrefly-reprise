/**
 * When a pad button last changed (r64-fixes, Chapter I FFX and Chapter IV FFX-2, the conference demo; both games, input plumbing).
 *
 * `Input` writes it when its poll sees a button go down or come up, in a frame or in its background sample (`Input.sample`); the demo's warm reads it
 * (`demoWarm.idle`) so that it does not START a step that can hold the page for 100 to 600 ms (a program link waiting on the GPU process, a 5376 x 3072
 * upload) in the second after a press: a player's presses come in runs (the cursor, the cursor, the pick), and the first of a run is the only one a step
 * can still swallow. Pure module: no DOM, no `navigator`; the clock is a parameter for a test.
 */

let lastChangeAt = Number.NEGATIVE_INFINITY;

/** A pad button changed state at `at` (the page's `performance.now()` clock). */
export function notePadActivity(at: number = typeof performance !== 'undefined' ? performance.now() : 0): void {
  lastChangeAt = at;
}

/** Milliseconds since a pad button last changed; `Infinity` when none has. */
export function msSincePadActivity(at: number = typeof performance !== 'undefined' ? performance.now() : 0): number {
  return at - lastChangeAt;
}

/** For a test: forget everything. */
export function resetPadActivity(): void {
  lastChangeAt = Number.NEGATIVE_INFINITY;
}
