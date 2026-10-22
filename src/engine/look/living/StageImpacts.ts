/**
 * The hits the living room reacts to (release 62, decision 173a, FFX-2's Bevelle cathedral: soft ripples in the floor's reflection when someone is hit).
 *
 * `PaintedActor.recoil` is the one call every landed blow makes on its target (`BattlePresenterBeats.damage`: "the presenter calls this on every hit"), so it is the seam: it notes `(this, heavy)` here and
 * the look (`LookLiving`), which knows where each actor's feet are on the frame, reads the notes once a frame and starts a ripple at the right feet. The cell is a queue of at most eight and does nothing at all
 * unless the look asked for it (`impactsWanted(true)`, only while the living room runs): no look, no cost, no list that grows. It holds the actor object only to be matched against the look's own list of
 * figures; nothing is drawn or moved from here. Pure (no DOM, no `three`).
 */

export interface Impact {
  /** The actor that was hit (a `PaintedActor`; matched by identity). */
  actor: object;
  /** A critical or a heavy knock-back: the ring is stronger. */
  heavy: boolean;
}

const MAX_QUEUE = 8;
const queue: Impact[] = [];
let wanted = false;

/** The look turns the cell on while the living room runs and off when it does not (which also drops what is waiting). */
export function impactsWanted(on: boolean): void {
  wanted = on;
  if (!on) queue.length = 0;
}

/** Note a landed blow. A no-op unless the look wants it. */
export function noteImpact(actor: object, heavy = false): void {
  if (!wanted) return;
  if (queue.length >= MAX_QUEUE) queue.shift();
  queue.push({ actor, heavy });
}

const NONE: readonly Impact[] = [];

/** The notes since the last call, oldest first (the queue is emptied). */
export function takeImpacts(): readonly Impact[] {
  return queue.length === 0 ? NONE : queue.splice(0, queue.length);
}

/** Tests: is the cell on, and what waits. */
export const impactsState = (): { wanted: boolean; waiting: number } => ({ wanted, waiting: queue.length });
