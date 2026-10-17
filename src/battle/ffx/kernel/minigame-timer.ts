/**
 * The limit timer the three Overdrive minigame controllers share (Tidus's Swordplay, Auron's Bushido, Lulu's Fury).
 *
 * **Game case: FFX only** (FFX-2 has no Swordplay, Bushido or Fury). Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D;
 * the private note `FFX-G01` section 6.1. The timer routine is VA 0x00891AC0, called once per battle frame by the minigame dispatcher
 * (0x0089AE20) while the timer state word is 2 (running). Proven with the game's own machine code run in an emulator
 * (`tests/unit/parity-ffx-minigames.test.ts`, vectors in `tests/fixtures/parity/ffx/minigame_*.json`).
 *
 * Each call adds 1 to the tick counter and stores `A = float32(B - ticks / 30)`, or `/ 25` when the PAL flag is set (the language codes of
 * the original European release); when the result is 0 or below, `A` is stored as 0. `B` is the limit in seconds, a float32 too. The
 * arithmetic is x87 at 53-bit precision, i.e. IEEE double, so `Math.fround` of a double expression is exact.
 *
 * The English Steam build reads PAL = 0 and the language byte 0 at the title screen (live read, 2026-10-13, `FFX-G01` section 6.1), so
 * 30 ticks a second is the rate; 25 is kept for the proof only. How many battle frames the dispatcher gets in a second is not measured
 * in a battle (the front end runs at 30); the overlays drive these controllers at 30 frames a second.
 *
 * Pure, DOM-free, deterministic.
 */

import type { ScaleOverride } from './modifiers.ts';

/** Ticks per second on a non-PAL build (the English Steam build). */
export const TICKS_PER_SECOND = 30;
/** Ticks per second when the PAL flag is set (proof only; no shipped build sets it). */
export const TICKS_PER_SECOND_PAL = 25;

/** A frame at the game's tick rate, in milliseconds. */
export const FRAME_MS = 1000 / TICKS_PER_SECOND;

/**
 * The timer value `A` after `ticks` calls, for a limit of `limitSeconds`: a float32, or 0 once it is not above 0.
 * `ticks` 0 is the value the set-up stores (`A = B`).
 */
export function timerA(limitSeconds: number, ticks: number, pal = false): number {
  const limit = Math.fround(limitSeconds);
  if (ticks <= 0) return limit;
  const a = Math.fround(limit - ticks / (pal ? TICKS_PER_SECOND_PAL : TICKS_PER_SECOND));
  return a > 0 ? a : 0;
}

/**
 * The two floats the damage scale override (VA 0x0078bd90) reads from the user's struct, `A` at `Chr+0xd2c` and `B` at `Chr+0xd30`, for a Swordplay or
 * Bushido result (re-parity RC9, lane FFX-B3; `FFX-G01` section 5 and row 22 of section 10). Both are float32 **seconds**: `B` is the move's limit
 * and `A` the timer's value when the input was accepted, `float32(B - frame / 30)`, 0 once it is not above 0. The game only ever produces whole
 * frames, so for an instant it can produce the figures are exactly its own; the float32 of the same instant in milliseconds, which the engine fed the
 * override before, differs by one point in about 1 percent of (instant, damage) pairs.
 *
 * `frame` is the controller frame the move ended in (the result's `frame`, counted from 1) and is what the game's `A` is built from. A result that
 * carries none (the headless stand-in's whole milliseconds, a test rig's hand-built result) is read as the float32 of its time left in seconds,
 * clamped to 0 to `limitMs`.
 */
export function timingScale(limitMs: number, timeRemainingMs: number, frame?: number): ScaleOverride {
  const b = Math.fround(limitMs / 1000);
  if (frame !== undefined) return { a: timerA(b, frame), b };
  return { a: Math.fround(Math.min(Math.max(timeRemainingMs, 0), limitMs) / 1000), b };
}

/**
 * How many whole battle frames have passed `elapsedMs` after an overlay opened: frame `n` is processed once `n * FRAME_MS` has gone by.
 * The overlays call their controller once for each frame that has come due.
 */
export function framesDue(elapsedMs: number): number {
  return elapsedMs <= 0 ? 0 : Math.floor(elapsedMs / FRAME_MS + 1e-9);
}
