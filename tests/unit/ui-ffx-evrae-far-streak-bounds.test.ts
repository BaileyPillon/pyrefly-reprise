import { describe, expect, it } from 'vitest';
import { EVRAE_FAR_STREAK_ASPECT, widenForEvraeFarStreak } from '../../src/ui/ffx/evraeFarStreakBounds.ts';
import { AIRSHIP_RANGE } from '../../src/battle/ffx/ai/evrae-rules.ts';
import { EVRAE_ID } from '../../src/data/ffx/enemies/evrae.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

function stateWithRange(range: 'near' | 'far' | undefined): Pick<BattleState, 'flags'> {
  return { flags: range === undefined ? {} : { [AIRSHIP_RANGE]: range } };
}

const rect = { left: 100, right: 110, top: 50, bottom: 60 }; // 10 wide, 10 tall

describe('widenForEvraeFarStreak', () => {
  it('is a no-op for a non-Evrae id even at FAR', () => {
    expect(widenForEvraeFarStreak(rect, 'seymour', stateWithRange('far'))).toEqual(rect);
  });

  it('is a no-op for Evrae at NEAR (or with no range flag at all)', () => {
    expect(widenForEvraeFarStreak(rect, EVRAE_ID, stateWithRange('near'))).toEqual(rect);
    expect(widenForEvraeFarStreak(rect, EVRAE_ID, stateWithRange(undefined))).toEqual(rect);
  });

  it('widens Evrae at FAR to the streak aspect, centred on the same midpoint', () => {
    const wide = widenForEvraeFarStreak(rect, EVRAE_ID, stateWithRange('far'));
    expect(EVRAE_FAR_STREAK_ASPECT).toBeGreaterThan(2); // idle-far.json: 1024 / 461
    const height = rect.bottom - rect.top;
    expect(wide.right - wide.left).toBeCloseTo(height * EVRAE_FAR_STREAK_ASPECT, 5);
    expect((wide.left + wide.right) / 2).toBeCloseTo((rect.left + rect.right) / 2, 5);
    expect(wide.top).toBe(rect.top);
    expect(wide.bottom).toBe(rect.bottom);
    // And it actually grew — this is the whole point of the fix.
    expect(wide.right - wide.left).toBeGreaterThan(rect.right - rect.left);
  });

  it('never shrinks the estimate the span-based rect already had', () => {
    // A tall, narrow input where the span-based half-width already exceeds
    // the streak aspect's want-width should be left alone.
    const tall = { left: 0, right: 100, top: 0, bottom: 10 };
    expect(widenForEvraeFarStreak(tall, EVRAE_ID, stateWithRange('far'))).toEqual(tall);
  });
});
