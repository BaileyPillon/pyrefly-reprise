// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLadyLuckReels } from '../../src/ui/ffx2/LadyLuckReels.ts';

describe('Lady Luck reels (fake-input mode)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports three-of-a-kind when every forced stop matches', async () => {
    const handle = createLadyLuckReels(container, {
      stopOrder: [0, 1, 2],
      forcedStops: ['red7', 'red7', 'red7'],
    });
    handle.press();
    handle.press();
    handle.press();
    const result = await handle.result;
    expect(result.symbols).toEqual(['red7', 'red7', 'red7']);
    expect(result.threeOfAKind).toBe(true);
  });

  it('reports no match when the forced stops differ', async () => {
    const handle = createLadyLuckReels(container, {
      stopOrder: [0, 1, 2],
      forcedStops: ['red7', 'bar', 'cherry'],
    });
    handle.press();
    handle.press();
    handle.press();
    const result = await handle.result;
    expect(result.symbols).toEqual(['red7', 'bar', 'cherry']);
    expect(result.threeOfAKind).toBe(false);
  });

  it('stops reels in the given random order, not left to right', async () => {
    const handle = createLadyLuckReels(container, {
      stopOrder: [2, 0, 1],
      forcedStops: ['bar', 'cherry', 'red7'],
    });
    handle.press(); // stops reel 2 with 'bar'
    handle.press(); // stops reel 0 with 'cherry'
    handle.press(); // stops reel 1 with 'red7'
    const result = await handle.result;
    // symbols are reported reel-index order (0,1,2), regardless of stop order.
    expect(result.symbols).toEqual(['cherry', 'red7', 'bar']);
  });

  it('auto-stops every remaining reel once the timer runs out', async () => {
    const handle = createLadyLuckReels(container, {
      stopOrder: [0, 1, 2],
      forcedStops: ['bar', 'bar', 'bar'],
      timerMs: 1000,
    });
    handle.press(); // only the first reel stopped manually
    await vi.advanceTimersByTimeAsync(1100);
    const result = await handle.result;
    expect(result.symbols).toEqual(['bar', 'bar', 'bar']);
    expect(result.timeRemainingMs).toBe(0);
  });

  it('ignores a fourth press once all three reels have stopped', async () => {
    const handle = createLadyLuckReels(container, {
      stopOrder: [0, 1, 2],
      forcedStops: ['bar', 'bar', 'bar'],
    });
    handle.press();
    handle.press();
    handle.press();
    handle.press(); // no-op
    const result = await handle.result;
    expect(result.symbols).toEqual(['bar', 'bar', 'bar']);
  });
});
