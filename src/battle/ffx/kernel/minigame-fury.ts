/**
 * Lulu's Fury, the game's controller: how far the stick (or the digital pad) has been turned, call by call.
 *
 * **Game case: FFX only** (FFX-2 has no Fury). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; the private note
 * `FFX-G01` section 6.4. The controller is VA 0x00891B80 (set-up 0x00897F70 and 0x00898BF0, thresholds from `./minigame-fury-tables.ts`,
 * limit timer 0x00891AC0 from `./minigame-timer.ts`, digital fallback 0x00645EB0). Proven against the game's own machine code run in an
 * emulator over scripted pad streams (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/minigame_fury.json`:
 * analog and digital scripts, and the rotation ladder 0 to 40 in both directions; the full set was 3,500 scripts and 1,722 ladder runs,
 * 0 mismatches against an independent model).
 *
 * The dispatcher calls the controller once a battle frame, and a second time after an extra pad poll while the "extra poll" flag is set.
 * The frame's order: the limit timer ticks, the controller is called, and (flag set) the pad advances and it is called again. The states:
 * 1 and 2 are intro frames, 3 starts the timer and sets the flag, 4 is play, 6 ends the move (the timer words are reset BEFORE the result
 * call, so the result passes A = B = 0), 7 is done. In play, input is taken for ticks 0 to 119 (a 4 second limit) and the call whose tick makes
 * `A` zero ends the move.
 *
 * **Analog pad.** Each call reads two stick samples, the one before the newest and the newest. A sample is a diagonal quadrant only when
 * BOTH axes are past the dead zone (0xA0 or above, or below 0x60): 4 is x high and y low, 5 x high and y high, 6 x low and y high, 7 x low
 * and y low; a straight direction is no sample. Distinct consecutive quadrants are appended to a history. When it holds five entries it
 * is one rotation if the five are a cyclic run in either direction, and in every case the history is then emptied (no sliding window). A
 * rotation adds 1 to the progress counter; the casts go up by one (never more in a call) when the counter reaches the next threshold.
 * Casts stop at 16.
 *
 * **Digital pad** (no analog pad). A "step" is a left-only reading and a right-only reading both seen before the stall clock clears them
 * (both in the same reading sets neither). A reading is a button NEWLY pressed: the reader 0x00630CF0 is true when the bit is set in the pad's current word
 * and was not in the previous one (the code at 0x00631360, read from the disassembly), so a held key counts once. The clock: when a call finds no quadrant and more than 0.5001 s have passed since the last clear,
 * both flags are cleared and the clock restarts. One step adds 1 to the counter, and the casts go up by one when `(counter + 1) / 2`
 * (integer division) reaches the next threshold, so two steps are worth one rotation.
 *
 * The caller drives frames; the controller reads nothing from the world. Pure, DOM-free, deterministic.
 */

import { timerA } from './minigame-timer.ts';
import { FURY_MAX_CASTS } from './minigame-fury-tables.ts';

/** The pad a controller call reads, by the pad ring-buffer index the dispatcher has advanced to. */
export interface FuryPad {
  /** The stick sample at `index` (axes 0 to 255, centre 128). */
  stick(index: number): readonly [x: number, y: number];
  /** The digital left and right readings at `index`: whether each button was newly pressed at that poll. */
  buttons(index: number): readonly [left: boolean, right: boolean];
}

/** Flaws the proof switches on to show its vectors can catch them; every field's default is the game's rule. */
export interface FuryTweaks {
  /** The dead-zone edge: an axis counts at this value or above (0xA0), or below 0x60. */
  quadEdge?: number;
  /** Seconds after which the stall clock clears the digital flags (0.5001). */
  stallSeconds?: number;
  /** Digital casts use `(counter + 1) / 2` (true) or the bare counter. */
  halveDigital?: boolean;
  /** Counted as a rotation only the increasing run (false) or both directions (true). */
  bothDirections?: boolean;
  /** Added to the next threshold in the analog test. */
  thresholdBias?: number;
}

/** The diagonal quadrant (4 to 7) of one stick sample, or `null` for a straight direction or the dead zone. */
export function furyQuadrant(x: number, y: number, edge = 0xa0): 4 | 5 | 6 | 7 | null {
  if (x >= edge) {
    if (y < 0x60) return 4;
    if (y >= edge) return 5;
    return null;
  }
  if (x < 0x60) {
    if (y >= edge) return 6;
    if (y < 0x60) return 7;
  }
  return null;
}

/** Five quadrants in cyclic order (4, 5, 6, 7, 4 ... or 7, 6, 5, 4, 7 ...). */
export function isFuryCycle(history: readonly number[], bothDirections = true): boolean {
  const h0 = history[0] as number;
  const up = history.every((q, i) => q === 4 + ((((h0 - 4 + i) % 4) + 4) % 4));
  const down = history.every((q, i) => q === 4 + ((((h0 - 4 - i) % 4) + 4) % 4));
  return up || (down && bothDirections);
}

const f32 = Math.fround;

/** One Fury move in progress. */
export class FuryController {
  /** Casts reached: 1 to 16. */
  level = 1;
  /** The progress counter (a byte). */
  counter: number;
  /** The history of diagonal quadrants (at most 5 kept). */
  hist: number[] = [];
  /** State of the controller: 1 and 2 intro, 3 start, 4 play, 6 end, 7 done. */
  state: number;
  /** Limit timer ticks so far. */
  ticks = 0;
  /** The timer value A after the last tick (float32 seconds). */
  a: number;
  /** The result the controller handed over (casts), once it has. */
  result: { level: number; a: number; b: number } | null = null;
  /** Controller calls made so far. */
  calls = 0;
  /** Battle frames run so far. */
  frames = 0;
  /** Digital steps taken so far. */
  steps = 0;

  private fl = false;
  private fr = false;
  private last = 0;
  private poll = false;
  private timerRunning = false;
  private k = 0;
  private now = 0;
  private readonly t: readonly number[];
  private readonly tw: Required<FuryTweaks>;

  /**
   * @param thresholds the 16 cumulative thresholds of the spell at Lulu's Magic (`furyThresholds`)
   * @param limitSeconds the time limit (4)
   * @param analog whether an analog pad is present (the digital fallback otherwise)
   * @param startInPlay start in the play state with the timer running, as the game stands after its three intro frames
   */
  constructor(
    thresholds: readonly number[],
    private readonly limitSeconds: number,
    private readonly analog: boolean,
    private readonly pal = false,
    startInPlay = false,
    tweaks: FuryTweaks = {},
  ) {
    this.t = thresholds;
    this.counter = thresholds[0] as number;
    this.a = f32(limitSeconds);
    this.state = startInPlay ? 4 : 1;
    if (startInPlay) {
      this.timerRunning = true;
      this.poll = true;
    }
    this.tw = {
      quadEdge: tweaks.quadEdge ?? 0xa0,
      stallSeconds: tweaks.stallSeconds ?? 0.5001,
      halveDigital: tweaks.halveDigital ?? true,
      bothDirections: tweaks.bothDirections ?? true,
      thresholdBias: tweaks.thresholdBias ?? 0,
    };
  }

  /** True once the controller has handed over its result. */
  get done(): boolean {
    return this.result !== null;
  }

  /** Full rotations the counter stands for: an analog counter step is a rotation, a digital one is half a rotation. */
  rotations(): number {
    const progress = this.counter - (this.t[0] as number);
    return this.analog ? progress : Math.floor(progress / 2);
  }

  /** One battle frame at clock time `now` (seconds): the timer tick, the controller, and (flag set) a second pad poll and call. */
  frame(now: number, pad: FuryPad): void {
    if (this.done) return;
    this.frames += 1;
    this.now = now;
    this.k += 1;
    if (this.timerRunning) {
      this.ticks += 1;
      this.a = timerA(this.limitSeconds, this.ticks, this.pal);
    }
    this.call(pad);
    this.calls += 1;
    if (this.poll) {
      this.k += 1;
      this.call(pad);
      this.calls += 1;
    }
  }

  private call(pad: FuryPad): void {
    // the clock part runs before the state switch, in every state
    if (this.last === 0) this.last = f32(this.now);
    switch (this.state) {
      case 1:
        this.state = 2;
        return;
      case 2:
        this.state = 3;
        return;
      case 3:
        this.timerRunning = true;
        this.poll = true;
        this.state = 4;
        return;
      case 4:
        if (!(this.a > 0)) {
          this.state = 6;
          return;
        }
        this.play(pad);
        return;
      case 6:
        if (this.poll) {
          this.last = 0;
          this.fl = false;
          this.fr = false;
        }
        this.poll = false;
        this.timerRunning = false;
        this.result = { level: this.level, a: 0, b: 0 }; // the timer words are reset before the result call
        this.state = 7;
        return;
      default:
    }
  }

  private play(pad: FuryPad): void {
    const dt = f32(f32(this.now) - this.last);
    let quadrant: number | null = null;
    for (let it = 0; it < 2; it++) {
      let x = 0x80;
      let y = 0x80;
      if (this.analog) {
        [x, y] = pad.stick(it === 0 ? this.k - 1 : this.k);
      } else {
        const [left, right] = pad.buttons(this.k);
        if (!left) {
          if (right) this.fr = true;
        } else if (!right) {
          this.fl = true;
        }
      }
      const q = furyQuadrant(x, y, this.tw.quadEdge);
      let skipInsert = false;
      if (q !== null) {
        quadrant = q;
      } else if (dt > f32(this.tw.stallSeconds)) {
        this.fl = false;
        this.last = f32(this.now);
        this.fr = false;
        skipInsert = true;
      }
      if (!skipInsert && this.fl && this.fr) {
        // a digital step; it leaves the loop
        this.fl = false;
        this.fr = false;
        this.steps += 1;
        if (this.level >= FURY_MAX_CASTS) {
          this.level = FURY_MAX_CASTS;
        } else {
          this.counter = (this.counter + 1) & 0xff;
          const reached = this.tw.halveDigital ? Math.floor((this.counter + 1) / 2) : this.counter;
          if (reached >= (this.t[this.level] as number)) this.level += 1;
        }
        break;
      }
      if (quadrant !== null) {
        const h = this.hist;
        if (h.length === 0 || h[h.length - 1] !== quadrant) h.push(quadrant);
      }
    }
    if (this.hist.length >= 5) {
      if (isFuryCycle(this.hist.slice(0, 5), this.tw.bothDirections)) {
        if (this.level >= FURY_MAX_CASTS) {
          this.level = FURY_MAX_CASTS;
        } else {
          this.counter = (this.counter + 1) & 0xff;
          if (this.counter >= (this.t[this.level] as number) + this.tw.thresholdBias) this.level += 1;
        }
      }
      this.hist = [];
    }
  }
}

/** Run a whole script the way the proof does: frames at `frameSeconds` until the controller hands over its result (or `maxFrames`). */
export function runFury(
  c: FuryController,
  pad: FuryPad,
  frameSeconds = 1 / 30,
  maxFrames = 400,
): { level: number; counter: number; frames: number; calls: number; result: { level: number; a: number; b: number } | null } {
  for (let f = 0; f < maxFrames && !c.done; f++) c.frame(f * frameSeconds, pad);
  return { level: c.level, counter: c.counter, frames: c.frames, calls: c.calls, result: c.result };
}
