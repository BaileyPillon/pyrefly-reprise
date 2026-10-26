// @vitest-environment jsdom
/**
 * The boss card's hold after a loading card (`ui/common/transitions/cardHold.ts`; post-conference lane "post-fight-start", PR-0481; both games, shared opening plumbing).
 * A fight that loads behind the entry has shown the card over the ink for as long as the load took; the battle's own card counts that time and holds the rest of its 1.9 s, but never under 900 ms
 * (the entry's reveal). A fight that loaded inside the 400 ms delay, a hurried opening and `?cardhold=full` keep what they had.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BATTLE_START_HOLD_MS } from '../../src/ui/common/BattleStartBanner.ts';
import { CARD_HOLD_FLOOR_MS, FULL_CARD_HOLD_MS, cardHoldAfterLoading, cardHoldCounted, cardHoldOption, loadingCardUpMs, noteLoadingCardGone, noteLoadingCardUp } from '../../src/ui/common/transitions/cardHold.ts';
import { loadingCardWait, LOADING_CARD_DELAY_MS } from '../../src/ui/common/transitions/loadingCard.ts';
import { HURRIED_CARD_HOLD_MS } from '../../src/ui/common/transitions/openingHurry.ts';

const CARD = { bossName: 'Seymour Flux', chapterNumber: 1, location: 'Mt. Gagazet', game: 'ffx' as const };

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  noteLoadingCardGone();
});

describe('cardHoldAfterLoading', () => {
  it("the full hold is the banner's own", () => {
    expect(FULL_CARD_HOLD_MS).toBe(BATTLE_START_HOLD_MS);
  });
  it('is the whole hold when no loading card was up', () => {
    expect(cardHoldAfterLoading(BATTLE_START_HOLD_MS, 0)).toBe(BATTLE_START_HOLD_MS);
  });
  it('is the rest of the hold when the card has been up less than the hold less the floor, so the card is on screen the base hold in all', () => {
    expect(cardHoldAfterLoading(1900, 500)).toBe(1400);
    expect(cardHoldAfterLoading(1900, 1000)).toBe(CARD_HOLD_FLOOR_MS); // 1000 + 900 = 1900: the whole hold, as ever
  });
  it('never goes under the floor, which covers the entry\'s reveal (700 ms in FFX, 560 ms in FFX-2)', () => {
    expect(cardHoldAfterLoading(1900, 2160)).toBe(CARD_HOLD_FLOOR_MS); // Chapter I of the demo: 2.16 s of loading card
    expect(cardHoldAfterLoading(1900, 3150)).toBe(CARD_HOLD_FLOOR_MS); // Chapter IV
    expect(CARD_HOLD_FLOOR_MS).toBeGreaterThan(700);
  });
  it('never lengthens a hold: the hurried 700 ms is under the floor and stays', () => {
    expect(cardHoldAfterLoading(HURRIED_CARD_HOLD_MS, 2500)).toBe(HURRIED_CARD_HOLD_MS);
  });
});

describe('cardHoldOption', () => {
  it('keeps the banner\'s default (no option) with no loading card up', () => {
    expect(cardHoldOption(false, 5000, '')).toEqual({});
  });
  it('is the hurried hold for a hurried opening, loading card or not', () => {
    expect(cardHoldOption(true, 5000, '')).toEqual({ holdMs: HURRIED_CARD_HOLD_MS });
    noteLoadingCardUp(1000);
    expect(cardHoldOption(true, 5000, '')).toEqual({ holdMs: HURRIED_CARD_HOLD_MS });
  });
  it('shortens the hold by the time the loading card has been up', () => {
    noteLoadingCardUp(1000);
    expect(loadingCardUpMs(3160)).toBe(2160);
    expect(cardHoldOption(false, 3160, '')).toEqual({ holdMs: CARD_HOLD_FLOOR_MS });
    expect(cardHoldOption(false, 1500, '')).toEqual({ holdMs: 1400 });
  });
  it('`?cardhold=full` is the old behaviour', () => {
    noteLoadingCardUp(1000);
    expect(cardHoldCounted('?cardhold=full')).toBe(false);
    expect(cardHoldOption(false, 9000, '?cardhold=full')).toEqual({});
    expect(cardHoldCounted('?demo=1')).toBe(true);
  });
});

describe('the loading card tells how long it has been up', () => {
  it('counts from the moment it goes up, and not at all on a warm load or after the hand-over', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    let ready: () => void = () => {};
    const wait = loadingCardWait(root, () => CARD)(new Promise<void>((r) => (ready = r)));
    expect(loadingCardUpMs()).toBe(0); // before the delay: no card
    await vi.advanceTimersByTimeAsync(LOADING_CARD_DELAY_MS + 5);
    expect(root.querySelector('.bstart--loading')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(1500);
    expect(loadingCardUpMs()).toBeGreaterThanOrEqual(1495); // what `showBattleStart` reads as the battle's own card is made
    ready();
    const real = document.createElement('div');
    real.dataset['role'] = 'battle-start';
    document.body.appendChild(real);
    await vi.advanceTimersByTimeAsync(60);
    await wait;
    expect(loadingCardUpMs()).toBe(0); // handed over
  });

  it('a warm load that is ready inside the delay leaves nothing up', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const wait = loadingCardWait(root, () => CARD)(new Promise((r) => setTimeout(r, LOADING_CARD_DELAY_MS - 100)));
    await vi.advanceTimersByTimeAsync(LOADING_CARD_DELAY_MS + 50);
    await wait;
    expect(loadingCardUpMs()).toBe(0);
    expect(cardHoldOption(false, performance.now(), '')).toEqual({});
  });
});
