/**
 * The looping HOLD of a clip (`?anim=proto&style=P2`; both games, presentation only; no `three`, no DOM, erasable TS so a Node tool may import it).
 *
 * FFX plays every cast and every item use as three motions of one family: a START (`_00`, once), a HOLD (`_01`, looping until something replaces it) and a RELEASE (`_02`)
 * (`research/re-ffx-party-motion-timing.md` sections 1 and 5: "how long the hold lasts is set by the spell effect, not by the clip"). A clip here is the same three parts in one timeline: the
 * segment that carries a `sustain` (`AnimClip.ts#Sustain`) is the hold, its `hold` ms the SHORTEST stay, and this track decides how long the clip really stays and what the pose does meanwhile:
 *
 *   - while the clip is in the hold, the pose swings from the segment's pose toward the sustain pose and back every `period` ms (0 at the start and at every period, so it leaves and returns exactly);
 *   - with `open` set (the engine keeps it there until its effect is ready) the clip's own clock stops at the end of the shortest stay and the swing goes on, until `release()` or {@link HOLD_MAX_MS};
 *   - with `open` clear the clip goes on after the shortest stay, and the swing's last value fades out over {@link RESID_MS} (a residual: the release does not jump).
 *
 * A pure function of the compiled clip, the clip's time and what the engine asked: no battle timer, no clock of its own.
 */
import type { CompiledClip } from './AnimClip.ts';

/** A hold never outlasts this, whatever the engine does (ms of the animator's clock): a cast whose effect never comes still lets go. */
export const HOLD_MAX_MS = 9000;
/** The swing's last value fades out over this after the hold, ms. */
export const RESID_MS = 140;

/** The swing at `h` ms into the hold: 0 at 0 and at every multiple of the period, 1 half a period in. */
export const swingAt = (period: number, h: number): number => 0.5 - 0.5 * Math.cos((2 * Math.PI * h) / Math.max(1, period));

export class HoldTrack {
  /** Ms spent in the hold (past the shortest stay while the engine keeps the clip there). */
  h = 0;
  /** The engine keeps the clip in its hold. */
  open = false;
  /** The hold is behind the clip. */
  passed = false;
  private extra = 0;
  private leave = 0;
  private since = 0;

  reset(): void {
    this.h = 0;
    this.extra = 0;
    this.passed = false;
    this.leave = 0;
    this.since = 0;
  }

  /** True while the clip is in its hold at clip time `t`. */
  holding(c: CompiledClip, t: number): boolean {
    return c.sustain !== null && !this.passed && t >= c.sustain.start;
  }

  /**
   * The clip time to use after the clock moved on to `t` (by `dtMs`): `t` itself, or the end of the shortest stay while the engine keeps the clip in the hold. Records the swing the hold left
   * off at when the clip leaves it.
   */
  advance(c: CompiledClip, t: number, dtMs: number): number {
    const s = c.sustain;
    if (!s) return t;
    if (this.passed) {
      this.since += dtMs;
      return t;
    }
    if (t < s.start) return t;
    const end = s.start + s.min;
    if (t < end) {
      this.h = t - s.start;
      return t;
    }
    if (this.open && this.h < HOLD_MAX_MS) {
      this.extra += Math.max(0, t - end + 1e-3);
      this.h = Math.min(HOLD_MAX_MS, s.min + this.extra);
      return end - 1e-3; // still inside the hold's segment (the next one starts AT `end`)
    }
    this.passed = true;
    this.leave = swingAt(s.period, s.min + this.extra);
    this.since = Math.max(0, t - end);
    return t;
  }

  /** Let go: the clip leaves the hold at the end of the shortest stay (at once when that has passed). */
  release(): void {
    this.open = false;
  }

  /** The swing's weight now: its value in the hold, its fading residual after it (0 for a clip with no hold, and long after). */
  weight(c: CompiledClip, t: number): number {
    const s = c.sustain;
    if (!s) return 0;
    if (this.passed) {
      const u = Math.min(1, this.since / RESID_MS);
      return this.leave * (1 - u * u * (3 - 2 * u));
    }
    return t >= s.start ? swingAt(s.period, this.h) : 0;
  }

  /** Add the swing to `out` (a pose of the clip's channels): `weight * (swing pose - the hold's pose)`. */
  apply(c: CompiledClip, t: number, out: Float64Array): void {
    const s = c.sustain;
    if (!s) return;
    const w = this.weight(c, t);
    if (w === 0) return;
    const base = c.target[s.seg]!;
    for (let i = 0; i < out.length; i++) out[i] = out[i]! + w * (s.target[i]! - base[i]!);
  }

  /** The glow level the clip asks for at clip time `t` in segment `seg`: the segment's own, plus what the hold has built. */
  charge(c: CompiledClip, seg: number): number {
    const s = c.sustain;
    const base = c.charge[seg] ?? 0;
    if (!s || seg !== s.seg || this.passed) return base;
    return base + s.grow * (1 - Math.exp(-this.h / s.growMs));
  }
}
