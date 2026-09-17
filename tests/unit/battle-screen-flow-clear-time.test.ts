/**
 * `clearTimeToRecord` — the `best-time-flow` fix.
 *
 * `BattleScreenFlow.runChapter` used to call `save.recordClear(id,
 * outcome.elapsedMs, ...)` with the raw wall clock, before the Results
 * panel's own plausibility floor (`ui/common/resultsMath.ts`'s `clearTimeMs`)
 * ever applied. At `speed: 'skip'` every animation wait collapses to zero, so
 * an automated run could write a sub-second "best time" that Chapter Select
 * then printed. These tests cover the two guards the fix adds: the same
 * floored conversion the panel itself uses, and never recording anything at
 * all for an automated run (`RunChapterOptions.auto`).
 */
import { describe, expect, it } from 'vitest';
import { clearTimeToRecord } from '../../src/app/screens/BattleScreenFlow.ts';
import { MIN_PLAUSIBLE_WALL_CLOCK_MS } from '../../src/ui/common/resultsMath.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { AutoStrategy } from '../../src/engine/BattlePresenter.ts';

/** A stand-in `AutoStrategy` — its body never runs in these tests. */
const stubAutoStrategy: AutoStrategy = () => null;

/** A minimal, otherwise-inert `BattleResult` — only the clock fields matter here. */
function makeResult(elapsedTicks: number, elapsedMs: number): BattleResult {
  return {
    outcome: 'victory',
    turns: 3,
    elapsedTicks,
    elapsedMs,
    ap: 0,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };
}

describe('clearTimeToRecord', () => {
  it('records the plausibility-floored wall clock for a real, non-automated run', () => {
    const result = makeResult(0, 45_000);
    expect(clearTimeToRecord(result, 45_000, 'ffx', null)).toBe(45_000);
  });

  it('never records a sub-floor wall clock as-is — an automated skip-speed run would report ~0ms', () => {
    // Simulates `speed: 'skip'`: every animation wait collapses to zero, so
    // the wall clock the BattleScreen measured is a handful of milliseconds.
    const rawSkipMs = 8;
    const result = makeResult(106, rawSkipMs);
    const recorded = clearTimeToRecord(result, rawSkipMs, 'ffx', null);
    expect(recorded).not.toBe(rawSkipMs);
    expect(recorded).toBeGreaterThanOrEqual(MIN_PLAUSIBLE_WALL_CLOCK_MS);
    // Falls through to the tick-based estimate, exactly like the Results panel.
    expect(recorded).toBe(Math.round(106 * 400));
  });

  it('never records anything for an automated run, however long it took wall-clock', () => {
    const result = makeResult(0, 90_000);
    expect(clearTimeToRecord(result, 90_000, 'ffx', stubAutoStrategy)).toBeNull();
  });

  it('never records anything for an automated run even at a plausible time', () => {
    const result = makeResult(500, 12_000);
    expect(clearTimeToRecord(result, 12_000, 'ffx2', stubAutoStrategy)).toBeNull();
  });

  it('treats a null/undefined auto strategy as a real run', () => {
    const result = makeResult(0, 30_000);
    expect(clearTimeToRecord(result, 30_000, 'ffx', undefined)).toBe(30_000);
    expect(clearTimeToRecord(result, 30_000, 'ffx', null)).toBe(30_000);
  });
});
