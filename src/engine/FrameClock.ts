import { frameClockMax } from './PoseSwap.ts';

/**
 * THE FRAME'S OWN TIME, HANDED DOWN TO THE CLOCKS THE RENDERER READS (post-conference motion-fluidity pass, lane "mf-l4-freezes", MF-20; both games, shared render plumbing; no change of look at an even frame rate).
 *
 * The look rig's ambient and grain clock (`look/LookRig.ts`), the golden-hour glow (`fx/a/GoldenHour.ts`), the stone-shard burst (`StoneShards.ts`) and the grade pass's `time` read `performance.now()` inside the
 * render, so the interval they advanced by was the gap between two calls at a varying phase of the frame, and after a hitch they stepped up to 0.1 s in one frame against the 25 ms (1/40 s) every other animation
 * of the battle gets (`PoseSwap.battleFrameClocks`). `App.step` now notes the browser's frame timestamp (the one `requestAnimationFrame` hands `App.tick`, the same for every reader in the frame), the readers ask
 * {@link frameSeconds} for it and step by {@link frameStep}, which clamps at the animation clock's own limit (`frameClockMax`: 1/40 s, 1/20 s under `?motion=classic`).
 *
 * Not changed: these clocks still run while the game is paused (the grain and the shimmer are the picture's, not the battle's); only the size of a step after a stall and the phase inside the frame.
 */

let stamp = NaN;

/** `App.step` notes the frame's timestamp (ms, the page clock) before anything renders. */
export function noteFrameTime(nowMs: number): void {
  stamp = nowMs;
}

/** The frame's time in seconds: the noted timestamp, else the page clock (a renderer driven outside `App`, a test). */
export function frameSeconds(): number {
  if (Number.isFinite(stamp)) return stamp / 1000;
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
}

/** The step from `prev` to `now` (seconds): 0 for the first frame (`prev` of 0), never negative, never over the animation clock's clamp. */
export function frameStep(prev: number, now: number, clamp: number = frameClockMax()): number {
  if (!prev) return 0;
  return Math.max(0, Math.min(clamp, now - prev));
}

/** For the tests: forget the noted frame. */
export function resetFrameTime(): void {
  stamp = NaN;
}
