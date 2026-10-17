// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { resolveReels, resolveReelStop, timingBonusPercent } from '../../src/ui/ffx/minigames/logic.ts';
import { Pad, bushidoFrame, bushidoStart } from '../../src/battle/ffx/kernel/minigame-bushido.ts';
import { FURY_MAX_CASTS, furyCasts, furyThresholds } from '../../src/battle/ffx/kernel/minigame-fury-tables.ts';
import { swordplayFraction, swordplayFrame, swordplayGeometry, swordplayStart } from '../../src/battle/ffx/kernel/minigame-swordplay.ts';
import { openMinigame } from '../../src/ui/ffx/minigames/index.ts';

/**
 * "Fake-input mode" for the seven Overdrive minigames: every function here is
 * pure (no DOM, no timers, no requestAnimationFrame), so a test can drive a
 * minigame's *outcome* logic — the part that actually decides the
 * `MinigameResult` shape the engine consumes — with plain numbers.
 */

describe('tidus-timing', () => {
  it('the marker bounces between the two ends of the bar, a whole step a frame (re-parity RC9: the controller of the game)', () => {
    const g = swordplayGeometry(0x20);
    const s = swordplayStart(g);
    expect(swordplayFraction(s, g)).toBe(0);
    swordplayFrame(s, g, false);
    expect(swordplayFraction(s, g)).toBeCloseTo(11 / 275, 6); // one step of 11 units on a 275-unit bar
    for (let f = 2; f <= 25; f++) swordplayFrame(s, g, false);
    expect(swordplayFraction(s, g)).toBe(1); // 25 steps: the right end exactly
    swordplayFrame(s, g, false);
    expect(swordplayFraction(s, g)).toBeLessThan(1); // reflected: on its way back
  });

  it('a press resolves success inside the window and is a miss outside it', () => {
    const g = swordplayGeometry(0x20);
    const hit = swordplayStart(g);
    for (let f = 1; f <= 12; f++) swordplayFrame(hit, g, false);
    expect(swordplayFrame(hit, g, true)).toEqual({ done: true, grade: 1, a: Math.fround(3 - 13 / 30), frame: 13 });
    const miss = swordplayStart(g);
    for (let f = 1; f <= 4; f++) swordplayFrame(miss, g, false);
    expect(swordplayFrame(miss, g, true)).toEqual({ done: false });
    expect(miss.misses).toBe(1);
  });

  it('timing bonus percent matches the §5.2 formula shape', () => {
    expect(timingBonusPercent(0, 3000)).toBe(0);
    expect(timingBonusPercent(3000, 3000)).toBe(50);
  });
});

describe('auron-sequence', () => {
  const move = { limit: 4, words: [Pad.Up, Pad.Down, Pad.Cross] };

  it('advances on a correct word; a wrong one sends progress back to input 1 and the attempt continues', () => {
    const s = bushidoStart();
    expect(bushidoFrame(s, move, Pad.Up)).toEqual({ done: false, wrong: false });
    expect(s.index).toBe(1);
    // research/ffx-overdrive-input-rules-2026-09-30.md Q1 [verified: 3 sources, now the exe]: start the sequence over.
    expect(bushidoFrame(s, move, Pad.Left)).toEqual({ done: false, wrong: true });
    expect(s.index).toBe(0);
    bushidoFrame(s, move, Pad.Up);
    bushidoFrame(s, move, Pad.Down);
    expect(bushidoFrame(s, move, Pad.Cross)).toMatchObject({ done: true, grade: 1 });
  });

  it('a finished run is graded by the frame it was finished in: A = limit - frame / 30', () => {
    const s = bushidoStart();
    for (const w of [0, 0, 0, Pad.Up, 0, Pad.Down, 0, 0]) bushidoFrame(s, move, w);
    expect(bushidoFrame(s, move, Pad.Cross)).toEqual({ done: true, grade: 1, a: Math.fround(4 - 9 / 30), frame: 9 });
  });

  it('fails when the limit runs out even with every input correct but one: no time left', () => {
    const s = bushidoStart();
    bushidoFrame(s, move, Pad.Up);
    bushidoFrame(s, move, Pad.Down);
    let r = bushidoFrame(s, move, 0);
    for (let f = 4; f <= 121; f++) r = bushidoFrame(s, move, 0);
    expect(r).toEqual({ done: true, grade: 0, a: 0, frame: 121 });
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
    expect(furyCasts(1, 20, 1_000_000)).toBe(FURY_MAX_CASTS);
  });

  it('needs at least as many rotations for each later cast: the thresholds only rise', () => {
    for (let variant = 0; variant < 19; variant++) {
      const t = furyThresholds(variant, 20);
      for (let k = 1; k < t.length; k++) expect(t[k]).toBeGreaterThan(t[k - 1] as number);
    }
  });

  it('no rotation at all still casts once (the first cast is free)', () => {
    expect(furyCasts(1, 20, 0)).toBe(1);
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
