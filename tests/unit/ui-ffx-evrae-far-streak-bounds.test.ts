// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  EVRAE_FAR_STREAK_ASPECT,
  evraeFarStreakRect,
  widenForEvraeFarStreak,
} from '../../src/ui/ffx/evraeFarStreakBounds.ts';
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

describe('evraeFarStreakRect', () => {
  const identity = (x: number, y: number) => ({ x, y });

  it('is null for anything but Evrae at FAR, or with no real rect', () => {
    expect(evraeFarStreakRect('seymour', stateWithRange('far'), { x: 0, y: 0, w: 10, h: 10 }, identity)).toBeNull();
    expect(evraeFarStreakRect(EVRAE_ID, stateWithRange('near'), { x: 0, y: 0, w: 10, h: 10 }, identity)).toBeNull();
    expect(evraeFarStreakRect(EVRAE_ID, stateWithRange('far'), null, identity)).toBeNull();
  });

  it('converts the tight alpha-box rect through the grid transform exactly', () => {
    const toGrid = (x: number, y: number) => ({ x: x / 2 - 5, y: y / 2 - 3 });
    const got = evraeFarStreakRect(EVRAE_ID, stateWithRange('far'), { x: 40, y: 20, w: 100, h: 60 }, toGrid);
    expect(got).toEqual({ left: 15, top: 7, right: 65, bottom: 37 });
  });

  /**
   * Round-10 verifier (refuted item (c)): at 1600x900, decision d2, the
   * aspect-only widen still overlapped Evrae's real silhouette by 9 413 px²,
   * because it kept the humanoid estimate's height and vertical position and
   * only widened the width. The verifier measured the true silhouette at
   * `{ x: 856, y: 288, w: 234, h: 173 }` via `BattleScreen.stage.projectRect
   * ('evrae')` (right 1090, bottom 461 — the exact numbers the report
   * cites). The fix (`FFXBattleHud.enemySpriteRects`) now hands the advisor
   * solver this measurement itself as the obstacle, instead of a
   * reconstruction of it built from head/feet anchors, so the obstacle
   * cannot itself be an under- or over-estimate of where Evrae actually is.
   */
  it('reproduces round-10 decision d2 exactly: the real silhouette the verifier measured', () => {
    const real = { x: 856, y: 288, w: 234, h: 173 }; // right 1090, bottom 461
    const got = evraeFarStreakRect(EVRAE_ID, stateWithRange('far'), real, identity)!;
    expect(got).toEqual({ left: 856, top: 288, right: 1090, bottom: 461 });
  });
});
