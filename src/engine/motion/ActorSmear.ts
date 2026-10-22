/**
 * ONE FIGURE'S SMEAR STATE (conference demo, motion pass, lane "core", step 2; pure: no `three`, no DOM, no clock of its own; both games).
 *
 * `PaintedActor` owns one. It answers the two things the planner (`SmearPlan.ts`) needs and holds the window the render reads:
 *
 * - **How fast is the figure moving?** {@link ActorSmear.track} is handed the figure's motion offset (`PaintedActor.update`: the lunge, the recoil, the strike curve and the lift, before the shake)
 *   every frame and smooths the velocity over {@link TAU_MS}; a hit-stop (a frame of zero field time) leaves it as it was. {@link ActorSmear.hint} lets a move that has not begun to move yet
 *   say which way and how fast it is about to go (a recoil's first frame is its fastest, and the hurt swap is made on it).
 * - **How long is a frame of this display?** an average of the real frame times, so a window is never a single frame at 60 Hz.
 * - **The window:** {@link ActorSmear.begin} takes a plan and the direction of travel; {@link ActorSmear.frame}(u) is the amount and the streak for `u` (0 to 1) of the way through it. `u` comes from the
 *   owner: the pose blend's progress for a painting set, the rig move's time for a rig.
 */
import { smearAmount, type SmearPlan } from './SmearPlan.ts';

/** The velocity is smoothed over this long, ms. */
export const TAU_MS = 30;
/** The frame time is averaged with this weight. */
const FRAME_WEIGHT = 0.1;

/** What the render needs for one frame. */
export interface SmearFrame {
  /** 0 (nothing) to 1 (full streak). */
  amount: number;
  /** The unit direction of travel in the world: x along the stage, y up. */
  dirX: number;
  dirY: number;
  style: 'paint' | 'blur';
  /** The streak's length at amount 1, a share of the plane's width. */
  length: number;
}

export class ActorSmear {
  private vx = 0;
  private vy = 0;
  private lastX = 0;
  private lastY = 0;
  private have = false;
  private hintDir = 1;
  private hintSpeed = 0;
  private hintLeft = 0;
  private frame = 0;
  private plan: SmearPlan | null = null;
  private dirX = 1;
  private dirY = 0;

  /** The recent frame time of the display, ms (0 until a frame has been seen). */
  get frameMs(): number {
    return this.frame;
  }

  /**
   * One frame's motion offset (world units, the figure's motion group before the shake). `dt` is the field's seconds (0 in a hit-stop: the velocity is left alone), `realDt` the unscaled
   * seconds (the frame time and the hint's life).
   */
  track(x: number, y: number, dt: number, realDt: number): void {
    if (realDt > 0) {
      const ms = Math.min(50, Math.max(2, realDt * 1000));
      this.frame = this.frame === 0 ? ms : this.frame + (ms - this.frame) * FRAME_WEIGHT;
      if (this.hintLeft > 0) this.hintLeft = Math.max(0, this.hintLeft - realDt * 1000);
    }
    if (this.have && dt > 0) {
      const k = 1 - Math.exp(-(dt * 1000) / TAU_MS);
      this.vx += ((x - this.lastX) / dt - this.vx) * k;
      this.vy += ((y - this.lastY) / dt - this.vy) * k;
    }
    this.lastX = x;
    this.lastY = y;
    this.have = true;
  }

  /** A move that is about to start moving: it goes `dirX` (+1 or -1 along the stage) at `speed` body heights a second for the next `ms` of real time. */
  hint(dirX: number, speed: number, ms: number): void {
    this.hintDir = dirX < 0 ? -1 : 1;
    this.hintSpeed = Math.max(0, speed);
    this.hintLeft = Math.max(0, ms);
  }

  /** How fast the figure moves, body heights a second: the measured speed, or the hint's while it is the larger. */
  speed(worldHeight: number): number {
    const measured = Math.hypot(this.vx, this.vy) / Math.max(1e-6, worldHeight);
    return this.hintLeft > 0 ? Math.max(measured, this.hintSpeed) : measured;
  }

  /** The unit direction of travel now (the hint's while it is faster, else the measured one; along the stage when the figure is still). */
  direction(worldHeight: number, out: { x: number; y: number } = { x: 1, y: 0 }): { x: number; y: number } {
    const measured = Math.hypot(this.vx, this.vy);
    if (this.hintLeft > 0 && this.hintSpeed * worldHeight >= measured) {
      out.x = this.hintDir;
      out.y = 0;
    } else if (measured > 1e-4) {
      out.x = this.vx / measured;
      out.y = this.vy / measured;
    } else {
      out.x = this.hintDir;
      out.y = 0;
    }
    return out;
  }

  /** Begin a window for `plan`, travelling `(dirX, dirY)` (a unit vector). */
  begin(plan: SmearPlan, dirX: number, dirY: number): void {
    this.plan = plan;
    this.dirX = dirX;
    this.dirY = dirY;
  }

  /** The window is over (the blend finished, or another change took the figure). */
  end(): void {
    this.plan = null;
  }

  get active(): boolean {
    return this.plan !== null;
  }

  /** The render's frame for `u` (0 to 1) of the way through the window; amount 0 when no window runs. */
  sample(u: number, out?: SmearFrame): SmearFrame {
    const f = out ?? { amount: 0, dirX: 1, dirY: 0, style: 'paint', length: 0 };
    const p = this.plan;
    f.amount = p ? p.strength * smearAmount(u) : 0;
    f.dirX = this.dirX;
    f.dirY = this.dirY;
    f.style = p?.style ?? 'paint';
    f.length = p?.length ?? 0;
    return f;
  }
}

/**
 * The streak's vector for a plane `planeW` by `planeH` world units, in the plane's own coordinates (fractions of its width and height): along the stage a share `length` of the width (flipped on a
 * mirrored plane, whose texture runs the other way), up a world length of the same size over the height. Written into `out`.
 */
export function figureVector(f: Pick<SmearFrame, 'dirX' | 'dirY' | 'length'>, planeW: number, planeH: number, mirror: 1 | -1, out: { x: number; y: number }): { x: number; y: number } {
  out.x = f.dirX * mirror * f.length;
  out.y = (f.dirY * f.length * planeW) / Math.max(1e-6, planeH);
  return out;
}
