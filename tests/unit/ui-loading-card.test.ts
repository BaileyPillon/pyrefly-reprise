// @vitest-environment jsdom
/**
 * A-3 (both games): when the entry transition's cover waits more than about
 * 400 ms for a cold battle, the approved battle-start card goes up over the
 * ink with a hairline; a warm load shows nothing new; the card hands over to
 * the battle screen's own card and the swirl stays closed until it does.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadingCardWait, LOADING_CARD_DELAY_MS } from '../../src/ui/common/transitions/loadingCard.ts';
import { playBattleSwirl } from '../../src/ui/common/transitions/swirl.ts';

const CARD = { bossName: 'Seymour Flux', chapterNumber: 1, location: 'Mt. Gagazet', game: 'ffx' as const };

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('the loading card', () => {
  it('stays off a warm load that is ready inside the delay', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const wait = loadingCardWait(root, () => CARD)(new Promise((r) => setTimeout(r, LOADING_CARD_DELAY_MS - 100)));
    await vi.advanceTimersByTimeAsync(LOADING_CARD_DELAY_MS + 50);
    await wait;
    expect(root.querySelector('.bstart--loading')).toBeNull();
  });

  it('goes up over the ink after the delay on a cold load, with the hairline, and hands over', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    document.body.appendChild(root);
    let ready: () => void = () => {};
    let done = false;
    const wait = loadingCardWait(root, () => CARD)(new Promise<void>((r) => (ready = r))).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(LOADING_CARD_DELAY_MS - 1);
    expect(root.querySelector('.bstart--loading')).toBeNull();
    await vi.advanceTimersByTimeAsync(2);
    const card = root.querySelector('.bstart--loading');
    expect(card).not.toBeNull();
    expect(card!.querySelector('.bstart__load')).not.toBeNull();
    expect(card!.textContent).toContain('Seymour');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(done).toBe(false); // still loading
    ready();
    // The battle screen's own card arrives: the loading card leaves.
    const real = document.createElement('div');
    real.dataset['role'] = 'battle-start';
    document.body.appendChild(real);
    await vi.advanceTimersByTimeAsync(40);
    await wait;
    expect(card!.classList.contains('bstart--leaving')).toBe(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(root.querySelector('.bstart--loading')).toBeNull();
  });

  it('shows nothing when there is nobody to name yet', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div');
    const wait = loadingCardWait(root, () => null)(new Promise((r) => setTimeout(r, 2000)));
    await vi.advanceTimersByTimeAsync(2100);
    await wait;
    expect(root.children).toHaveLength(0);
  });

  it('keeps the swirl closed until the cover wait resolves', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    const root = document.createElement('div');
    let release: () => void = () => {};
    let done = false;
    const p = playBattleSwirl(root, {
      durationMs: 200,
      onCover: () => undefined,
      whileCovered: () => new Promise<void>((r) => (release = r)),
    }).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(5000);
    expect(done).toBe(false);
    release();
    await vi.advanceTimersByTimeAsync(200);
    await p;
    expect(done).toBe(true);
    vi.unstubAllGlobals();
  });
});
