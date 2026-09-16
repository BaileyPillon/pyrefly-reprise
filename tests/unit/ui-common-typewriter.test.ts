import { describe, expect, it } from 'vitest';
import {
  autoAdvanceHoldMs,
  computeRevealCount,
  isFullyRevealed,
  msPerChar,
  typingDurationMs,
} from '../../src/ui/common/typewriter.ts';

describe('msPerChar', () => {
  it('is halved at 2x text speed', () => {
    expect(msPerChar(2)).toBeCloseTo(msPerChar(1) / 2, 6);
  });

  it('falls back to speed 1 for zero or negative speeds', () => {
    expect(msPerChar(0)).toBe(msPerChar(1));
    expect(msPerChar(-3)).toBe(msPerChar(1));
  });
});

describe('computeRevealCount', () => {
  it('reveals nothing at t=0 or for empty text', () => {
    expect(computeRevealCount('Hello.', 0)).toBe(0);
    expect(computeRevealCount('', 5000)).toBe(0);
  });

  it('reveals more characters as time passes, monotonically', () => {
    const text = 'Kimahri charges. Seymour does not move.';
    const early = computeRevealCount(text, 200);
    const later = computeRevealCount(text, 800);
    expect(later).toBeGreaterThan(early);
  });

  it('clamps to the full text length and never exceeds it', () => {
    const text = 'Short.';
    expect(computeRevealCount(text, 10_000)).toBe(text.length);
    expect(computeRevealCount(text, 10_000, 5)).toBe(text.length);
  });

  it('reveals faster at a higher text speed for the same elapsed time', () => {
    const text = 'It is not over.';
    const normal = computeRevealCount(text, 300, 1);
    const fast = computeRevealCount(text, 300, 3);
    expect(fast).toBeGreaterThanOrEqual(normal);
  });
});

describe('isFullyRevealed / typingDurationMs', () => {
  it('agree with each other at the exact duration boundary', () => {
    const text = 'Names as complete lines.';
    const duration = typingDurationMs(text);
    expect(isFullyRevealed(text, duration - 1)).toBe(false);
    expect(isFullyRevealed(text, duration + 1)).toBe(true);
  });

  it('a longer text speed multiplier shortens the total typing duration', () => {
    const text = 'A line long enough to matter for timing.';
    expect(typingDurationMs(text, 2)).toBeLessThan(typingDurationMs(text, 1));
  });
});

describe('autoAdvanceHoldMs', () => {
  it('never goes below the floor even for a one-word line', () => {
    expect(autoAdvanceHoldMs('Yuna.')).toBeGreaterThanOrEqual(900);
  });

  it('never exceeds the ceiling even for a very long line', () => {
    const long = 'word '.repeat(80);
    expect(autoAdvanceHoldMs(long)).toBeLessThanOrEqual(4200);
  });

  it('grows with word count between the floor and ceiling', () => {
    const short = autoAdvanceHoldMs('A short line here.');
    const longer = autoAdvanceHoldMs('A rather longer line with quite a few more words in it than the short one.');
    expect(longer).toBeGreaterThan(short);
  });

  it('handles empty text without throwing', () => {
    expect(() => autoAdvanceHoldMs('')).not.toThrow();
    expect(autoAdvanceHoldMs('')).toBeGreaterThanOrEqual(900);
  });
});
