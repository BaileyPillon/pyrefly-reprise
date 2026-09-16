import type { FuryResult, ReelResult, SequenceResult, TimingResult } from '../../../battle/common/types.ts';

/**
 * Pure resolvers shared by the minigame overlays and their tests. Every
 * function here takes plain numbers/strings — no DOM, no timers, no
 * `requestAnimationFrame` — so a test can drive a minigame's *outcome* logic
 * deterministically ("fake-input mode") without simulating real frames or
 * real key events. The interactive `open*` functions in the sibling files are
 * thin real-time/DOM wrappers around these.
 */

// ------------------------------------------------------------ Tidus timing

/** Ping-pong position of the Swordplay cursor along `[0, barWidth]` at time `elapsedMs`. */
export function tidusCursorPosition(elapsedMs: number, barWidth: number, speedPxPerSec: number): number {
  if (barWidth <= 0) return 0;
  const period = (2 * barWidth) / speedPxPerSec; // seconds for a full ping-pong
  const t = (elapsedMs / 1000) % period;
  const distance = t * speedPxPerSec;
  return distance <= barWidth ? distance : 2 * barWidth - distance;
}

export function resolveTidusTiming(input: {
  cursorPos: number;
  barWidth: number;
  zoneHalfWidth: number;
  elapsedMs: number;
  timerMs: number;
}): TimingResult {
  const center = input.barWidth / 2;
  const success = Math.abs(input.cursorPos - center) <= input.zoneHalfWidth;
  return { success, timeRemainingMs: Math.max(0, input.timerMs - input.elapsedMs), timerMs: input.timerMs };
}

/** research/visual-bible.md §3.11.0: `damage * (1 + timeRemaining / (timerMs * 2))`, as a display percentage. */
export function timingBonusPercent(timeRemainingMs: number, timerMs: number): number {
  if (timerMs <= 0) return 0;
  return Math.round((timeRemainingMs / (timerMs * 2)) * 100);
}

// ----------------------------------------------------------- Auron sequence

/**
 * One step of Bushido's button sequence. Bushido has **no partial credit**: a
 * wrong input ends the attempt immediately [visual-bible §3.11.2].
 */
export function stepAuronSequence(
  sequence: readonly string[],
  correctSoFar: number,
  pressed: string,
): { correctSoFar: number; wrong: boolean; done: boolean } {
  const expected = sequence[correctSoFar];
  if (expected === undefined) return { correctSoFar, wrong: false, done: true };
  if (pressed !== expected) return { correctSoFar, wrong: true, done: true };
  const next = correctSoFar + 1;
  return { correctSoFar: next, wrong: false, done: next >= sequence.length };
}

export function resolveAuronSequence(input: {
  sequenceLength: number;
  correctInputs: number;
  elapsedMs: number;
  timerMs: number;
  targetImmuneToRider?: boolean;
}): SequenceResult {
  const success = input.correctInputs >= input.sequenceLength && input.elapsedMs <= input.timerMs;
  const result: SequenceResult = {
    success,
    correctInputs: input.correctInputs,
    timeRemainingMs: Math.max(0, input.timerMs - input.elapsedMs),
  };
  if (input.targetImmuneToRider !== undefined) result.targetImmuneToRider = input.targetImmuneToRider;
  return result;
}

// -------------------------------------------------------------- Wakka reels

/** Which symbol a reel lands on if stopped `elapsedMs` after it started spinning. */
export function resolveReelStop(strip: readonly string[], elapsedMs: number, msPerSymbol: number): string {
  if (!strip.length) return '';
  const index = Math.floor(elapsedMs / Math.max(1, msPerSymbol)) % strip.length;
  return strip[index]!;
}

export function resolveReels(
  symbols: [string, string, string],
  elapsedMs: number,
  timerMs: number,
  reelSet: 'attack' | 'element' | 'status' | 'aurochs' = 'element',
): ReelResult {
  const threeOfAKind = symbols[0] === symbols[1] && symbols[1] === symbols[2];
  const result: ReelResult = { symbols, threeOfAKind, timeRemainingMs: Math.max(0, timerMs - elapsedMs) };
  if (reelSet === 'attack') {
    const sum = symbols.reduce((total, s) => total + (Number(s) || 0), 0);
    result.hits = threeOfAKind ? sum * 2 : sum;
  }
  return result;
}

// --------------------------------------------------------------- Lulu fury

/**
 * `[estimate]`: no source publishes the exact rotation-size growth curve, only
 * that it grows with Magic and with rotations already made
 * [ffx-combat-core §5.7, visual-bible §3.11.4]. One full lap (360°) per cast,
 * plus 40° per cast already banked, capped at two laps (720°) — big enough
 * that a high-Magic Lulu visibly needs more of the dial for her later casts,
 * small enough that 16 casts is still reachable inside the ~4s window.
 */
export function degreesPerCast(magic: number, castsSoFar: number): number {
  const base = 360 + Math.max(0, magic - 20) * 0.5;
  return Math.min(720, base + castsSoFar * 40);
}

export function furyCastsFromSweep(sweptDegrees: number, magic: number): number {
  let remaining = sweptDegrees;
  let casts = 0;
  while (casts < 16) {
    const need = degreesPerCast(magic, casts);
    if (remaining < need) break;
    remaining -= need;
    casts++;
  }
  return casts;
}

export function resolveFury(sweptDegrees: number, magic: number): FuryResult {
  return { sweptDegrees, casts: Math.min(16, furyCastsFromSweep(sweptDegrees, magic)) };
}
