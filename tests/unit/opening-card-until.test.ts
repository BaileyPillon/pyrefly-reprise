// @vitest-environment jsdom
/**
 * The battle-start card is the opening's cover (the Chapter IV first-menu framing race; **both games**: shared opening plumbing): it is held past its hold until CHAPTER FRAMING's first
 * plan has landed under it (`BattleStartBanner` `until`, `engine/fx/mix/openingGate.ts`), so the plan never lands under the first menu. A press or a click still dismisses it at once, and
 * a card with no `until` is exactly the card it was.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BattleStartBanner } from '../../src/ui/common/BattleStartBanner.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const make = (until?: () => Promise<unknown>, holdMs = 1900) => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const banner = new BattleStartBanner({ root, bossName: 'Bahamut', holdMs, ...(until ? { until } : {}) });
  let gone = false;
  void banner.show().then(() => void (gone = true));
  return { banner, root, isGone: () => gone };
};
const flush = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
};

describe('BattleStartBanner until', () => {
  it('with no until the card leaves at its hold, as it always did', async () => {
    const c = make();
    await flush(1899);
    expect(c.isGone()).toBe(false);
    await flush(400);
    expect(c.isGone()).toBe(true);
  });

  it('is held past its hold while the plan is owed, and leaves once the plan has landed', async () => {
    let land!: () => void;
    const c = make(() => new Promise<void>((r) => (land = r)));
    await flush(1900 + 5000); // the hold is long over; the plan has not landed
    expect(c.isGone()).toBe(false);
    expect(c.root.querySelector('[data-role="battle-start"]')).not.toBeNull();
    land();
    await flush(400);
    expect(c.isGone()).toBe(true);
  });

  it('a press (dismiss) still takes it down at once, the plan landed or not', async () => {
    const c = make(() => new Promise<void>(() => undefined));
    await flush(300);
    c.banner.dismiss();
    await flush(300);
    expect(c.isGone()).toBe(true);
  });

  it('a wait that rejects never keeps the card up', async () => {
    const c = make(() => Promise.reject(new Error('no framing')));
    await flush(1900 + 400);
    expect(c.isGone()).toBe(true);
  });

  it('is not asked before the hold is over', async () => {
    const until = vi.fn(() => Promise.resolve());
    make(until);
    await flush(1000);
    expect(until).not.toHaveBeenCalled();
    await flush(1000);
    expect(until).toHaveBeenCalledTimes(1);
  });
});
