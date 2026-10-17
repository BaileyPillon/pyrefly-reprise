import type { ReelResult } from '../../../battle/common/types.ts';

/**
 * Pure resolvers shared by the minigame overlays and their tests. Every
 * function here takes plain numbers/strings — no DOM, no timers, no
 * `requestAnimationFrame` — so a test can drive a minigame's *outcome* logic
 * deterministically ("fake-input mode") without simulating real frames or
 * real key events. The interactive `open*` functions in the sibling files are
 * thin real-time/DOM wrappers around these.
 *
 * Swordplay, Bushido and Fury no longer live here: their rules are the game's controllers, one frame at a time, in
 * `battle/ffx/kernel/minigame-*.ts` (re-parity RC9, lane FFX-A), and the overlays drive them through `./frameDriver.ts`.
 */

/** research/visual-bible.md §3.11.0: `damage * (1 + timeRemaining / (timerMs * 2))`, as a display percentage. */
export function timingBonusPercent(timeRemainingMs: number, timerMs: number): number {
  if (timerMs <= 0) return 0;
  return Math.round((timeRemainingMs / (timerMs * 2)) * 100);
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
