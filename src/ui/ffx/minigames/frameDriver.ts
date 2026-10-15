import { framesDue } from '../../../battle/ffx/kernel/minigame-timer.ts';

/**
 * Runs a game controller one battle frame at a time while an overlay is open (re-parity RC9, lane FFX-A; **FFX only**).
 *
 * The game calls Swordplay, Bushido and Fury once for every battle frame and reads the pad once per frame, so a press is seen by the NEXT
 * frame, never in between. This keeps that rule on a browser's clock: `pump` runs every frame that has come due at the overlay's elapsed
 * time, in order, and `press` first runs the frames due up to now (so the press cannot be seen by a frame that already went by) and then
 * queues the press for the next one. The overlay supplies the queue's contents when its frame runs.
 *
 * `elapsedMs` is the overlay's own clock (`OverdriveOverlay.elapsedMs`, `performance.now()` since the timer started). Pure of the DOM apart
 * from the `requestAnimationFrame` loop `start` runs.
 */
export class FrameDriver {
  /** Frames run so far. */
  frame = 0;
  private rafId = 0;
  private running = false;

  constructor(
    private readonly elapsedMs: () => number,
    private readonly onFrame: (frame: number) => void,
  ) {}

  /** Run every frame that has come due. Returns how many ran. */
  pump(): number {
    const due = framesDue(this.elapsedMs());
    let ran = 0;
    while (this.frame < due && this.running) {
      this.frame += 1;
      ran += 1;
      this.onFrame(this.frame);
    }
    return ran;
  }

  /** Call before queueing a press: the frames due up to now have gone by without it. */
  catchUp(): void {
    this.pump();
  }

  /** Run one frame now, due or not (the frame that finds the limit gone, when the overlay's ring runs out). */
  forceFrame(): void {
    if (!this.running) return;
    this.frame += 1;
    this.onFrame(this.frame);
  }

  /** Begin: frames run on the animation-frame clock until `stop`. */
  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = (): void => {
      if (!this.running) return;
      this.pump();
      if (this.running) this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
