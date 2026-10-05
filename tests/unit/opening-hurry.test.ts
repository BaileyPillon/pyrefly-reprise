// PR-0061 (both games): what arms the hurried opening, and for how long the card holds.
import { describe, expect, it } from 'vitest';
import { HURRIED_CARD_HOLD_MS, OpeningHurry } from '../../src/ui/common/transitions/openingHurry.ts';
import { BATTLE_START_HOLD_MS } from '../../src/ui/common/BattleStartBanner.ts';

describe('OpeningHurry', () => {
  it('is one-shot: true once armed, then spent', () => {
    const h = new OpeningHurry();
    expect(h.take()).toBe(false);
    h.arm();
    expect(h.pending).toBe(true);
    expect(h.take()).toBe(true);
    expect(h.take()).toBe(false);
    expect(h.pending).toBe(false);
  });
  it('can be disarmed', () => {
    const h = new OpeningHurry();
    h.arm();
    h.arm(false);
    expect(h.take()).toBe(false);
  });
  it('the hurried card still shows: a real beat, well under the full one', () => {
    expect(HURRIED_CARD_HOLD_MS).toBeGreaterThanOrEqual(500);
    expect(HURRIED_CARD_HOLD_MS).toBeLessThan(BATTLE_START_HOLD_MS / 2);
  });
});
