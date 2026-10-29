/**
 * THE SPHERE GRID THAT GLIDES (MF-13 / TB-13, motion-fluidity pass lane L3; game case: FFX only: the Sphere Grid is the FFX party-prep screen; look change, so behind `?gridease=on` or
 * `?fluidui=on`, default today's snap).
 *
 * Today a keyboard move that takes the cursor off the edge, a wheel step, a zoom button and CENTRE set the pan and zoom on the spot, so the whole grid jumps. With the word on, the same moves
 * become a glide of {@link GLIDE_MS} from where the grid is drawn to where the move leaves it. A move made during a glide builds on the glide's end (a spin of the wheel adds up) and starts from
 * what is drawn. A drag is the player's hand: it stops the glide where it is. The view already redraws every frame (`SphereGridView.startLoop`), so the glide is one `step` before that draw.
 *
 * Pure: no DOM, no timers.
 */

import { fluidWord, reduceMotionNow } from '../../common/fluidUi.ts';

/** Long enough to read as a move and short enough that the next key press is not waiting for it, ms. */
export const GLIDE_MS = 160;

export interface View {
  x: number;
  y: number;
  z: number;
}

let forced: boolean | null = null;
/** Tests and tools: force the switch (`null` reads the address again). */
export function setGridEase(on: boolean | null): void {
  forced = on;
}

/**
 * Does the grid glide? Only when asked for (`?gridease=on` or `?fluidui=on`: the glide is HELD in release 68, `FLUID_DEFAULTS.gridease` is off until a clip of it exists) or forced by a test, and never under the
 * player's REDUCE MOTION (it beats the word: the grid snaps as it did). Asked at each move, so the pause can turn REDUCE MOTION on or off mid-screen.
 */
export function gridEaseOn(search: string | undefined = globalThis.location?.search): boolean {
  return !reduceMotionNow() && (forced ?? fluidWord('gridease', 'on', search));
}

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t);

const same = (a: View, b: View): boolean => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.z - b.z) < 1e-5;

export class GridGlide {
  private from: View | null = null;
  private to: View | null = null;
  private t0 = 0;

  /** Where the glide in flight ends, or null. */
  target(): View | null {
    return this.to ? { ...this.to } : null;
  }

  get active(): boolean {
    return this.to !== null;
  }

  /** Glide from what is drawn (`live`) to where the move left the view (`end`), starting at `nowMs`. A move that goes nowhere stops any glide. */
  start(live: View, end: View, nowMs: number): void {
    if (same(live, end)) {
      this.cancel();
      return;
    }
    this.from = { ...live };
    this.to = { ...end };
    this.t0 = nowMs;
  }

  cancel(): void {
    this.from = this.to = null;
  }

  /**
   * Run `move`, which sets the view where it should end, as a glide from what is drawn now. A move made mid-glide builds on the glide's end (a spin of the wheel adds up) and the draw
   * keeps going from where it is. `get` and `set` read and write the view's own pan and zoom.
   */
  run(get: () => View, set: (v: View) => void, move: () => void, nowMs: number): void {
    const live = get();
    set(this.to ?? live);
    move();
    const end = get();
    set(live);
    this.start(live, end, nowMs);
  }

  /** The view to draw at `nowMs`, or null when nothing is gliding. The frame that reaches the end returns the end exactly and clears the glide. */
  step(nowMs: number): View | null {
    if (!this.from || !this.to) return null;
    const p = Math.min(1, Math.max(0, (nowMs - this.t0) / GLIDE_MS));
    if (p >= 1) {
      const end = this.to;
      this.cancel();
      return { ...end };
    }
    const e = easeOut(p);
    return { x: this.from.x + (this.to.x - this.from.x) * e, y: this.from.y + (this.to.y - this.from.y) * e, z: this.from.z + (this.to.z - this.from.z) * e };
  }
}
