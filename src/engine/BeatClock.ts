/**
 * THE BEAT CLOCK (MF-08 / TB-01, motion-fluidity pass lane L3; game case: both games, shared presentation timebase).
 *
 * Every wait of the battle presenter used to be a `setTimeout`, while every picture (a figure's tween, the camera, the spell, the blend between two paintings) runs on the frame
 * clock. Two clocks meant: a chain of moves differed by about a frame from fight to fight (sd 0.3 to 0.9 frame), a long frame left the figure behind the numeral and the sound, a
 * pause in the middle of a move spent the sleep that was left, and a hidden window let the fight run on throttled timers over a frozen picture.
 *
 * One clock: a sleep is an entry `{ due }` in this clock's own time, and `BattleScreen.update` ticks it with the animation `dt` (the 1/40 s clamp) beside the scene, so a beat and the
 * picture it waits for always agree. Nothing ticks it while the screen is not updated (the pause overlay, a hidden window), so the remaining time is kept and resumes exactly.
 * A beat resolves on the first tick that reaches its end and hands the part of that tick it did not need (`BeatLead`) to the move that starts next.
 *
 * Not for the ATB pump: the Active engine reads real time and keeps its wall sleep. A wait of zero or less is a macrotask yield (a resolved promise is a microtask, and a whole battle of
 * those would never return to the event loop, `BattlePresenterUtil.defaultSleep`), never a frame.
 *
 * Pure: no DOM, no three (hard rule 1).
 */

import { leadNow, noteLead, resetLead } from './BeatLead.ts';

export { claimLead, releaseLead } from './BeatLead.ts'; // the screen that owns a clock claims the lead with it

interface Beat {
  /** The clock time, seconds, at which this beat ends. */
  due: number;
  seq: number;
  resolve: () => void;
}

/** Floating-point slack: six frames of 1/60 s are 0.09999999999999999 s, and a 100 ms beat has ended. */
const EPS = 1e-9;

export class BeatClock {
  private t = 0;
  private seq = 0;
  private beats: Beat[] = [];

  /** Seconds of clock time that have been ticked. */
  get now(): number {
    return this.t;
  }

  /** Beats still waiting. */
  get pending(): number {
    return this.beats.length;
  }

  /**
   * Wait `ms` of clock time. The wait starts when the thing the caller was waiting for ended (`BeatLead`), which is up to a frame before now.
   * `ms` of zero, a negative or a non-finite number is a macrotask yield.
   */
  sleep(ms: number): Promise<void> {
    if (!(ms > 0) || !Number.isFinite(ms)) return new Promise<void>((r) => setTimeout(r, 0));
    return new Promise<void>((resolve) => {
      this.beats.push({ due: this.t + ms / 1000 - leadNow(), seq: this.seq++, resolve });
    });
  }

  /** One frame of `dt` seconds (the animation clock). A frame of no time (a frozen capture) ticks nothing. */
  tick(dt: number): void {
    resetLead();
    if (!(dt > 0)) return;
    this.t += dt;
    if (this.beats.length === 0) return;
    const limit = this.t + EPS;
    let due: Beat[] | null = null;
    let keep = 0;
    for (let i = 0; i < this.beats.length; i++) {
      const b = this.beats[i]!;
      if (b.due <= limit) (due ??= []).push(b);
      else this.beats[keep++] = b;
    }
    this.beats.length = keep;
    if (!due) return;
    due.sort((a, b) => a.due - b.due || a.seq - b.seq);
    for (const b of due) {
      noteLead(this.t - b.due);
      b.resolve();
    }
  }

  /** Resolve every waiting beat now, in the order they were due (a torn-down presenter must never be left parked). */
  releaseAll(): void {
    const all = this.beats;
    this.beats = [];
    all.sort((a, b) => a.due - b.due || a.seq - b.seq);
    for (const b of all) b.resolve();
  }
}
