// @vitest-environment jsdom
/**
 * The boss card's hold after a loading card (`ui/common/transitions/cardHold.ts`; post-conference lane "post-fight-start", PR-0481; both games, shared opening plumbing).
 * A fight that loads behind the entry has shown the card over the ink for as long as the load took; the battle's own card counts that time and holds the rest of its 1.9 s, but never under 1000 ms
 * (the entry's reveal, measured 929 to 962 ms in FFX and 701 to 785 ms in FFX-2). A fight that loaded inside the 400 ms delay, a hurried opening and `?cardhold=full` keep what they had.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BATTLE_START_HOLD_MS } from '../../src/ui/common/BattleStartBanner.ts';
import { CARD_HOLD_FLOOR_MS, FULL_CARD_HOLD_MS, cardHoldAfterLoading, cardHoldCounted, cardHoldOption, loadingCardUpMs, noteLoadingCardGone, noteLoadingCardUp } from '../../src/ui/common/transitions/cardHold.ts';
import { loadingCardWait, LOADING_CARD_DELAY_MS } from '../../src/ui/common/transitions/loadingCard.ts';
import { HURRIED_CARD_HOLD_MS } from '../../src/ui/common/transitions/openingHurry.ts';
import { battleScreenSource } from './helpers/battleScreenSource.ts';

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
    expect(cardHoldAfterLoading(1900, 900)).toBe(CARD_HOLD_FLOOR_MS); // 900 + 1000 = 1900: the whole hold, as ever
  });
  it('never goes under the floor, which covers the whole of the entry\'s reveal (measured 929 to 962 ms in FFX, 701 to 785 ms in FFX-2)', () => {
    expect(cardHoldAfterLoading(1900, 2160)).toBe(CARD_HOLD_FLOOR_MS); // Chapter I of the demo: 2.16 s of loading card
    expect(cardHoldAfterLoading(1900, 3150)).toBe(CARD_HOLD_FLOOR_MS); // Chapter IV
    expect(CARD_HOLD_FLOOR_MS).toBeGreaterThan(962); // the longest reveal measured (FFX: the battle card up to the entry overlay removed): the card never fades while the ink is coming down
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

describe('the wiring: nothing else fails if the card stops asking for its hold, or the loading card stops telling how long it was up', () => {
  const src = (rel: string): string => readFileSync(join(__dirname, '..', '..', rel), 'utf8').replace(/\r\n/g, '\n');
  it('BattleScreen.showBattleStart spreads cardHoldOption(...) into the battle\'s own BattleStartBanner (the same source pin as the r62 test uses for stopDemoWarm)', () => {
    const battle = battleScreenSource();
    const from = battle.indexOf('async showBattleStart');
    expect(from).toBeGreaterThan(0);
    const body = battle.slice(from, battle.indexOf('private async runEncounter'));
    const made = body.indexOf('new BattleStartBanner({');
    const closed = body.indexOf('});', made);
    expect(made).toBeGreaterThan(0);
    const spread = body.indexOf('...cardHoldOption(!!this.opts.openingHurry)'); // the hurried hold for a hurried opening, else the full hold less the time the loading card has been up
    expect(spread).toBeGreaterThan(made);
    expect(spread).toBeLessThan(closed);
  });
  it('the loading card notes the moment it goes up and the moment it hands over', () => {
    const loading = src('src/ui/common/transitions/loadingCard.ts');
    expect(loading).toContain('noteLoadingCardUp(up);');
    expect(loading).toContain('noteLoadingCardGone();');
  });
});
