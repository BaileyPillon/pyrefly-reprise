/**
 * THE STRIKE'S CLOCK (conference demo, motion pass, lane "core", step 1; pure: no `three`, no DOM, no timer).
 *
 * Walks a {@link StrikeShape} (`StrikeCurve.ts`) on ACCUMULATED PACED TIME: the actor hands it `dt * 1000 * paceRate('action')` every frame (zero in a hit-stop, so the move holds
 * exactly as the tweens do), and it samples the curve analytically. Frame-rate independence is by construction: a frame of any length lands on the same curve, and the time
 * left over at a phase boundary carries into the next phase (the chained tween legs of the old lunge dropped it: up to a frame per leg).
 *
 * Three phases, because the contact hold has no fixed length (`ContactBeat.ts` holds the strike up until the blow lands and the follow-through beat has run):
 * `pre` (wind-up and travel) runs to the contact mark; `hold` waits there at least the shape's hold and then for {@link StrikeRun.release}; `post` is the return and the settle.
 * Marks are callbacks (`on`), fired once each, in order, on the frame that crosses them, at their own time: the sound, the smear cut and the camera punch schedule on these.
 *
 * Interrupting: a strike begun while another is in flight (FFX-2's overlapping ATB actions) folds the old strike's last values out over {@link FOLD_MS} instead of snapping.
 */
import { MARK_NAMES, sampleAt, smoother, strikeMarks, travelPeakU, type MarkName, type StrikeMarks, type StrikeSample, type StrikeShape } from './StrikeCurve.ts';

/** The world-unit result of one sample: x in world units (before the actor's facing), lift in world units, scale Y (scale X is `1 / sy`), lean in radians. */
export interface StrikePose {
  x: number;
  lift: number;
  sy: number;
  lean: number;
}

/** A strike begun over another folds the old one's last values out over this long, paced ms. */
export const FOLD_MS = 120;

/** Rounding slack for comparing accumulated milliseconds. */
const EPS = 1e-6;

export class StrikeRun {
  readonly marks: StrikeMarks;
  private phase: 'pre' | 'hold' | 'post' = 'pre';
  private local = 0;
  private elapsed = 0;
  private released = false;
  private finished = false;
  private cancelled = false;
  private readonly fired = new Set<MarkName>();
  private readonly listeners: Partial<Record<MarkName, Array<() => void>>> = {};
  private readonly scratch: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 };
  private readonly contactAt: number;
  private readonly peakAt: number;

  /**
   * @param shape the resolved strike
   * @param distance the lunge distance, world units (x = 1 is the touch point)
   * @param height the figure's height, world units (lift is a share of it)
   * @param carry the pose the figure was in when this strike began over another one, folded out; none for a figure at rest
   * @param autoRelease no contact will release the hold: it ends at the shape's minimum
   */
  constructor(
    readonly shape: StrikeShape,
    readonly distance: number,
    readonly height: number,
    private readonly carry: StrikePose | null = null,
    autoRelease = false,
  ) {
    this.marks = strikeMarks(shape);
    this.contactAt = shape.windupMs + shape.travelMs;
    this.peakAt = shape.windupMs + travelPeakU(shape.bias) * shape.travelMs;
    this.released = autoRelease;
  }

  get done(): boolean {
    return this.finished || this.cancelled;
  }
  get phaseName(): 'pre' | 'hold' | 'post' {
    return this.phase;
  }
  /** Paced ms since the strike began. */
  get time(): number {
    return this.elapsed;
  }
  /** True once the contact mark has been crossed. */
  get atContact(): boolean {
    return this.phase !== 'pre';
  }

  /** Schedule `fn` on a mark (fires once, in order, on the frame that crosses it; a mark already crossed fires at once). */
  on(name: MarkName, fn: () => void): this {
    if (this.fired.has(name)) fn();
    else (this.listeners[name] ??= []).push(fn);
    return this;
  }

  /** The blow has landed (and its follow-through beat has run): the strike may go home once its minimum hold is over. */
  release(): void {
    this.released = true;
  }

  /** Stop where it is (the actor was disposed or the move replaced): no more marks. */
  cancel(): void {
    this.cancelled = true;
  }

  private fire(name: MarkName): void {
    if (this.fired.has(name)) return;
    this.fired.add(name);
    const l = this.listeners[name];
    if (l) {
      delete this.listeners[name];
      for (const fn of l) fn();
    }
  }

  /** Advance by `ms` of paced time (>= 0). The leftover at each phase boundary carries on into the next phase. */
  advance(ms: number): void {
    let left = ms > 0 ? ms : 0;
    for (let guard = 0; guard < 6 && !this.done; guard++) {
      const s = this.shape;
      if (this.phase === 'pre') {
        const room = this.contactAt - this.local;
        const step = Math.min(left, room);
        this.step(step);
        left -= step;
        if (this.local >= s.windupMs - EPS) this.fire('windupEnd');
        if (this.local >= this.peakAt - EPS) this.fire('travelPeak');
        if (this.local < this.contactAt - EPS) return;
        this.phase = 'hold';
        this.local = 0;
        this.fire('contact');
      } else if (this.phase === 'hold') {
        if (!this.released) {
          this.step(left);
          return;
        }
        const room = Math.max(0, s.holdMs - this.local);
        if (left < room - EPS) {
          this.step(left);
          return;
        }
        this.step(room);
        left -= room;
        this.phase = 'post';
        this.local = 0;
        this.fire('holdEnd');
      } else {
        const total = s.returnMs + s.settleMs;
        const room = total - this.local;
        const step = Math.min(left, room);
        this.step(step);
        left -= step;
        if (this.local >= 0.5 * s.returnMs - EPS) this.fire('settlePeak');
        if (this.local < total - EPS) return;
        this.finished = true;
        this.fire('end');
        return;
      }
    }
  }

  private step(ms: number): void {
    this.local += ms;
    this.elapsed += ms;
  }

  /** The pose now, in world units (allocation-free: writes into `out`). */
  sample(out: StrikePose = { x: 0, lift: 0, sy: 1, lean: 0 }): StrikePose {
    const r = this.finished ? sampleAt(this.shape, 'post', Number.MAX_VALUE, this.scratch) : sampleAt(this.shape, this.phase, this.local, this.scratch);
    out.x = r.x * this.distance;
    out.lift = r.lift * this.height;
    out.sy = r.sy;
    out.lean = r.lean;
    const c = this.carry;
    if (c) {
      const fold = 1 - smoother(this.elapsed / FOLD_MS);
      if (fold > 0) {
        out.x += c.x * fold;
        out.lift += c.lift * fold;
        out.sy *= 1 + (c.sy - 1) * fold;
        out.lean += c.lean * fold;
      }
    }
    return out;
  }
}

export { MARK_NAMES };
