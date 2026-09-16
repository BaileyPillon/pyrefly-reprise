// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  degreesPerCast,
  furyCastsFromSweep,
  resolveAuronSequence,
  resolveFury,
  resolveReels,
  resolveReelStop,
  resolveTidusTiming,
  stepAuronSequence,
  tidusCursorPosition,
  timingBonusPercent,
} from '../../src/ui/ffx/minigames/logic.ts';
import { openMinigame } from '../../src/ui/ffx/minigames/index.ts';

/**
 * "Fake-input mode" for the seven Overdrive minigames: every function here is
 * pure (no DOM, no timers, no requestAnimationFrame), so a test can drive a
 * minigame's *outcome* logic — the part that actually decides the
 * `MinigameResult` shape the engine consumes — with plain numbers.
 */

describe('tidus-timing', () => {
  it('ping-pongs between 0 and barWidth', () => {
    const barWidth = 360;
    const speed = 340;
    expect(tidusCursorPosition(0, barWidth, speed)).toBeCloseTo(0, 5);
    // Halfway through one crossing: still travelling outward, at barWidth/2.
    const halfCrossingMs = (barWidth / speed / 2) * 1000;
    expect(tidusCursorPosition(halfCrossingMs, barWidth, speed)).toBeCloseTo(barWidth / 2, 0);
    // A full crossing plus a bit: now travelling back (ping-pong), past the far edge.
    const pastFarEdgeMs = (barWidth / speed) * 1000 + 10;
    expect(tidusCursorPosition(pastFarEdgeMs, barWidth, speed)).toBeLessThan(barWidth);
  });

  it('resolves success inside the zone and failure outside it', () => {
    const inZone = resolveTidusTiming({ cursorPos: 180, barWidth: 360, zoneHalfWidth: 22, elapsedMs: 500, timerMs: 3000 });
    expect(inZone).toEqual<typeof inZone>({ success: true, timeRemainingMs: 2500, timerMs: 3000 });

    const outOfZone = resolveTidusTiming({ cursorPos: 50, barWidth: 360, zoneHalfWidth: 22, elapsedMs: 2900, timerMs: 3000 });
    expect(outOfZone.success).toBe(false);
    expect(outOfZone.timeRemainingMs).toBe(100);
  });

  it('timing bonus percent matches the §5.2 formula shape', () => {
    expect(timingBonusPercent(0, 3000)).toBe(0);
    expect(timingBonusPercent(3000, 3000)).toBe(50);
  });
});

describe('auron-sequence', () => {
  const sequence = ['up', 'down', 'confirm'];

  it('advances on a correct input and finishes without partial credit on a wrong one', () => {
    const step1 = stepAuronSequence(sequence, 0, 'up');
    expect(step1).toEqual({ correctSoFar: 1, wrong: false, done: false });

    const wrong = stepAuronSequence(sequence, 1, 'left');
    expect(wrong).toEqual({ correctSoFar: 1, wrong: true, done: true });

    const finalStep = stepAuronSequence(sequence, 2, 'confirm');
    expect(finalStep).toEqual({ correctSoFar: 3, wrong: false, done: true });
  });

  it('resolves a SequenceResult with the correct-input count and remaining time', () => {
    const result = resolveAuronSequence({ sequenceLength: 3, correctInputs: 3, elapsedMs: 1200, timerMs: 4000 });
    expect(result).toEqual({ success: true, correctInputs: 3, timeRemainingMs: 2800 });
  });

  it('fails when the timer runs out even with every input correct', () => {
    const result = resolveAuronSequence({ sequenceLength: 3, correctInputs: 3, elapsedMs: 4500, timerMs: 4000 });
    expect(result.success).toBe(false);
    expect(result.timeRemainingMs).toBe(0);
  });

  it('carries targetImmuneToRider through only when supplied', () => {
    const withFlag = resolveAuronSequence({ sequenceLength: 1, correctInputs: 1, elapsedMs: 0, timerMs: 1000, targetImmuneToRider: true });
    expect(withFlag.targetImmuneToRider).toBe(true);
    const without = resolveAuronSequence({ sequenceLength: 1, correctInputs: 1, elapsedMs: 0, timerMs: 1000 });
    expect(without.targetImmuneToRider).toBeUndefined();
  });
});

describe('wakka-reels', () => {
  it('picks the symbol at the strip index for the elapsed time', () => {
    const strip = ['fire', 'ice', 'water', 'thunder'];
    expect(resolveReelStop(strip, 0, 90)).toBe('fire');
    expect(resolveReelStop(strip, 90, 90)).toBe('ice');
    expect(resolveReelStop(strip, 90 * 4, 90)).toBe('fire'); // wraps
  });

  it('flags three-of-a-kind and doubles Attack Reels hits on a match', () => {
    const jackpot = resolveReels(['1', '1', '1'], 5000, 20000, 'attack');
    expect(jackpot.threeOfAKind).toBe(true);
    expect(jackpot.hits).toBe(6); // sum=3, doubled

    const miss = resolveReels(['1', '2', '1'], 5000, 20000, 'attack');
    expect(miss.threeOfAKind).toBe(false);
    expect(miss.hits).toBe(4); // sum, not doubled
  });

  it('reports time remaining on the 20s timer', () => {
    const reels = resolveReels(['fire', 'ice', 'water'], 15000, 20000);
    expect(reels.timeRemainingMs).toBe(5000);
  });
});

describe('lulu-fury', () => {
  it('never exceeds the 16-cast cap', () => {
    expect(furyCastsFromSweep(1_000_000, 20)).toBe(16);
    expect(resolveFury(1_000_000, 20).casts).toBe(16);
  });

  it('needs more degrees per cast as more casts are already banked', () => {
    expect(degreesPerCast(20, 1)).toBeGreaterThan(degreesPerCast(20, 0));
  });

  it('zero sweep yields zero casts', () => {
    expect(resolveFury(0, 20)).toEqual({ sweptDegrees: 0, casts: 0 });
  });
});

describe('openMinigame dispatcher', () => {
  it('rejects FFX-2 minigame kinds — those belong to src/ui/ffx2/', async () => {
    const root = document.createElement('div');
    await expect(openMinigame(root, 'gunner-trigger', {})).rejects.toThrow(/ffx2/i);
    await expect(openMinigame(root, 'ladyluck-reels', {})).rejects.toThrow(/ffx2/i);
  });

  it('rejects an unknown kind', async () => {
    const root = document.createElement('div');
    // @ts-expect-error deliberately invalid kind, to check the runtime guard
    await expect(openMinigame(root, 'not-a-real-kind', {})).rejects.toThrow(/unknown/i);
  });
});
