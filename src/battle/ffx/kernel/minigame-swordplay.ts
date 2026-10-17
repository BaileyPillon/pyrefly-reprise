/**
 * Tidus's Swordplay, the game's controller: a marker bouncing along a bar, a window that has to be hit, one frame at a time.
 *
 * **Game case: FFX only** (FFX-2 has no Swordplay). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D; the private note
 * `FFX-G01` section 6.2. The controller is VA 0x00892320 (set-up 0x00898180 and 0x00898CA0, limit timer 0x00891AC0, see
 * `./minigame-timer.ts`). Proven against the game's own machine code run in an emulator over scripted presses
 * (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/minigame_swordplay.json`: 2,000 scripts, every single
 * press frame from 1 to 99 and random multi-press scripts, with and without the PAL tick rate, 0 mismatches against an independent model).
 *
 * What the game does, per frame (the frame counter starts at 1 on the first frame the controller is in its input state):
 *  1. The timer runs first. If the value before this frame's tick (`A` after `frame - 1` ticks) is not above 0 the move FAILS: the
 *     result is (grade 0, A = 0).
 *  2. A press counts if the pad's pressed-edge word has bit 0x20 in the previous or the newest sample (both are tested each frame).
 *     The marker, as it stands BEFORE this frame's move, is compared with the window, ends inclusive. In the window: the move SUCCEEDS
 *     (grade 1, A = the timer value after this frame's tick, so `limit - frame / 30`). Outside it: a miss. A miss is not a failure: the
 *     marker goes back to the left end of the bar and sets off to the right again, the timer is not touched, and the move can be tried
 *     again until the limit.
 *  3. The marker then moves by its speed, reflecting at the left end of the bar and at the right end.
 *
 * The bar is 275 units wide in a 512-wide virtual screen, starting at unit 118; the window is centred on the bar. Per move (category
 * byte `Cmd+0x58`): Spiral Cut 0x20 limit 3 s, speed 11, window 24 wide; Slice and Dice 0x30 3 s, 12, 20; Energy Rain 0x40 3 s, 13, 20;
 * Blitz Ace 0x50 2 s, 14, 18. As a share of the bar the window is 8.7, 7.3, 7.3 and 6.5 per cent; a sweep takes 25.0, 22.9, 21.2 and
 * 19.6 frames. The win is graded by `A`: the damage grows by `A / (2 * limit)` (`../kernel/modifiers.ts#damageScaleOverride`).
 *
 * Pure, DOM-free, deterministic: no clock and no random number is read.
 */

import { timerA } from './minigame-timer.ts';

/** The Overdrive family byte of the four Swordplay moves. */
export const SwordplayCategory = { SpiralCut: 0x20, SliceAndDice: 0x30, EnergyRain: 0x40, BlitzAce: 0x50 } as const;

/** The geometry of one move's bar, in the game's virtual screen units. */
export interface SwordplayGeometry {
  /** Time limit `B`, in seconds. */
  limit: number;
  /** Marker speed, units a frame. */
  speed: number;
  /** Window width. */
  width: number;
  /** Left end of the bar. */
  x0: number;
  /** Bar width. */
  bar: number;
  /** Window, inclusive: the marker position before a frame's move must lie in `[lo, hi]`. */
  lo: number;
  hi: number;
}

/** The left end of the bar: `int(float32(446 * 512 / 1920))` (the set-up's placement through the screen scaler 0x006447E0). */
const BAR_X0 = 118;
/** The bar width: `int(float32(1032 * 512 / 1920))`. */
const BAR_WIDTH = 275;

/** limit (s), speed, window width per move: the immediates of 0x00A5CB30 (window), 0x00A5CB80 (speed) and the limit table 0x00C86BF0. */
const MOVES: Readonly<Record<number, readonly [limit: number, speed: number, width: number]>> = {
  [SwordplayCategory.SpiralCut]: [3.0, 11, 24],
  [SwordplayCategory.SliceAndDice]: [3.0, 12, 20],
  [SwordplayCategory.EnergyRain]: [3.0, 13, 20],
  [SwordplayCategory.BlitzAce]: [2.0, 14, 18],
};

/** The four categories, weakest first. */
export const SWORDPLAY_CATEGORIES: readonly number[] = [0x20, 0x30, 0x40, 0x50];

/** The bar of one Swordplay move (`category` 0x20, 0x30, 0x40 or 0x50). */
export function swordplayGeometry(category: number): SwordplayGeometry {
  const m = MOVES[category];
  if (!m) throw new RangeError(`not a Swordplay category: ${category}`);
  const [limit, speed, width] = m;
  const lo = (Math.trunc(BAR_WIDTH / 2) - Math.trunc(width / 2)) + BAR_X0;
  const hi = Math.trunc(width / 2) + Math.trunc(BAR_WIDTH / 2) + BAR_X0;
  return { limit, speed, width, x0: BAR_X0, bar: BAR_WIDTH, lo, hi };
}

/** The controller's state between frames. */
export interface SwordplayState {
  /** Frames processed so far (the next frame is `frame + 1`). */
  frame: number;
  /** Marker position, in units. */
  pos: number;
  /** Marker velocity (the sign is its direction). */
  vel: number;
  /** Presses outside the window so far. */
  misses: number;
}

/** What one frame decided: still going, or the result the controller hands to the result entry (0x007B0470). */
export type SwordplayFrame =
  | { done: false }
  | {
      done: true;
      /** 1 for a hit, 0 for the limit running out. */
      grade: 0 | 1;
      /** The timer value `A` passed with the result (float32 seconds): 0 on a fail. */
      a: number;
      /** The frame the controller ended in (a hit: the press frame). */
      frame: number;
    };

/** The state before the first frame: the marker at the left end, set off to the right. */
export function swordplayStart(g: SwordplayGeometry): SwordplayState {
  return { frame: 0, pos: g.x0, vel: g.speed, misses: 0 };
}

/**
 * One frame. `pressed` is whether a press edge was seen this frame. Changes `state` in place.
 * The marker position a hit is judged on is the one in `state.pos` when the frame starts.
 */
export function swordplayFrame(state: SwordplayState, g: SwordplayGeometry, pressed: boolean, pal = false): SwordplayFrame {
  state.frame += 1;
  const frame = state.frame;
  if (!(timerA(g.limit, frame - 1, pal) > 0)) return { done: true, grade: 0, a: 0, frame };
  if (pressed) {
    if (state.pos >= g.lo && state.pos <= g.hi) return { done: true, grade: 1, a: timerA(g.limit, frame, pal), frame };
    state.misses += 1;
    state.vel = Math.abs(state.vel);
    state.pos = g.x0;
  }
  state.pos += state.vel;
  if (g.bar + g.x0 < state.pos) {
    state.pos = (g.bar + g.x0) * 2 - state.pos;
    state.vel = -state.vel;
  }
  if (state.pos < g.x0) {
    state.pos = g.x0 * 2 - state.pos;
    state.vel = -state.vel;
  }
  return { done: false };
}

/** Where the marker is on the bar, 0 (left end) to 1 (right end), for drawing. */
export function swordplayFraction(state: SwordplayState, g: SwordplayGeometry): number {
  return (state.pos - g.x0) / g.bar;
}

/** The window as shares of the bar: where it starts and how wide it is, each 0 to 1, for drawing. */
export function swordplayWindowFractions(g: SwordplayGeometry): { start: number; width: number } {
  return { start: (g.lo - g.x0) / g.bar, width: (g.hi - g.lo) / g.bar };
}
