import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import {
  apPerMember,
  buildMemberRows,
  clearTimeMs,
  dropsLabel,
  FFX_MS_PER_TICK,
  formatClearTime,
  formatNumber,
  isGrimChapter,
  isNewBest,
  isSilentResultsChapter,
  pickVictoryQuip,
} from '../../src/ui/common/resultsMath.ts';

describe('formatClearTime', () => {
  it('formats sub-minute times with a zero-padded seconds field', () => {
    expect(formatClearTime(5_000)).toBe('0:05');
  });

  it('formats minutes and seconds', () => {
    expect(formatClearTime(65_000)).toBe('1:05');
  });

  it('floors partial seconds rather than rounding', () => {
    expect(formatClearTime(65_999)).toBe('1:05');
  });

  it('clamps a negative duration to zero', () => {
    expect(formatClearTime(-500)).toBe('0:00');
  });
});

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1200)).toBe('1,200');
  });

  it('rounds a fractional value', () => {
    expect(formatNumber(999.6)).toBe('1,000');
  });
});

describe('isGrimChapter / isSilentResultsChapter', () => {
  it('flags E1, E2 and E4 as grim', () => {
    expect(isGrimChapter('seymour-flux')).toBe(true);
    expect(isGrimChapter('yunalesca')).toBe(true);
    expect(isGrimChapter('ffx2-bahamut')).toBe(true);
  });

  it('does not flag E3 or E5 as grim', () => {
    expect(isGrimChapter('braskas-final-aeon')).toBe(false);
    expect(isGrimChapter('ffx2-vegnagun-shuyin')).toBe(false);
  });

  it('only chapter 4 (Bahamut) suppresses the entire results flourish', () => {
    expect(isSilentResultsChapter('ffx2-bahamut')).toBe(true);
    expect(isSilentResultsChapter('seymour-flux')).toBe(false);
    expect(isSilentResultsChapter('yunalesca')).toBe(false);
  });
});

describe('pickVictoryQuip', () => {
  it('returns undefined for an empty or missing list', () => {
    expect(pickVictoryQuip(undefined)).toBeUndefined();
    expect(pickVictoryQuip([])).toBeUndefined();
  });

  it('is deterministic by default (index 0), for screenshot/e2e stability', () => {
    const lines = ['Hmph.', 'Adequate.', 'It isn’t over.'];
    expect(pickVictoryQuip(lines)).toBe('Hmph.');
    expect(pickVictoryQuip(lines)).toBe(pickVictoryQuip(lines));
  });

  it('wraps a positive index within the list length', () => {
    const lines = ['a', 'b', 'c'];
    expect(pickVictoryQuip(lines, 4)).toBe('b');
  });

  it('wraps a negative index into range instead of returning undefined', () => {
    const lines = ['a', 'b', 'c'];
    expect(pickVictoryQuip(lines, -1)).toBe('c');
  });
});

describe('isNewBest', () => {
  it('treats no previous record as always a new best', () => {
    expect(isNewBest(null, 999_999)).toBe(true);
  });

  it('is true only for a strictly faster time', () => {
    expect(isNewBest(60_000, 59_999)).toBe(true);
    expect(isNewBest(60_000, 60_000)).toBe(false);
    expect(isNewBest(60_000, 60_001)).toBe(false);
  });
});

describe('apPerMember', () => {
  it('credits the full AP total to every active member, not a split', () => {
    expect(apPerMember(36, ['tidus', 'yuna', 'auron'])).toEqual({
      tidus: 36,
      yuna: 36,
      auron: 36,
    });
  });

  it('returns an empty record for no members', () => {
    expect(apPerMember(36, [])).toEqual({});
  });
});

describe('clearTimeMs', () => {
  const ffxResult = { elapsedMs: 0, elapsedTicks: 140 };

  it('prefers the presenter wall clock over everything else', () => {
    expect(clearTimeMs({ elapsedMs: 5_000, elapsedTicks: 9_000 }, 14_200, 'ffx')).toBe(14_200);
  });

  it('falls back to the engine clock when no wall clock is supplied', () => {
    expect(clearTimeMs({ elapsedMs: 5_400, elapsedTicks: 9_000 }, undefined, 'ffx2')).toBe(5_400);
  });

  it('never reports 0:00 for an FFX clear, whose engine leaves elapsedMs at 0', () => {
    // The defect this screen was rebuilt for: a 14 s fight printed "RESULTS · 0:00".
    expect(clearTimeMs(ffxResult, 0, 'ffx')).toBe(140 * FFX_MS_PER_TICK);
    expect(formatClearTime(clearTimeMs(ffxResult, undefined, 'ffx'))).not.toBe('0:00');
  });

  it('converts FFX-2 ticks at the exact 3000/s rate', () => {
    expect(clearTimeMs({ elapsedMs: 0, elapsedTicks: 9_000 }, undefined, 'ffx2')).toBe(3_000);
  });

  it('ignores the sub-second wall clock of a `speed: skip` automated run', () => {
    // The critic and the gallery collapse every animation wait, so the wall
    // clock is a few hundred ms and would print "0:00" again.
    expect(clearTimeMs({ elapsedMs: 0, elapsedTicks: 140 }, 180, 'ffx')).toBe(140 * FFX_MS_PER_TICK);
  });
});

describe('buildMemberRows', () => {
  const base = {
    outcome: 'victory' as const,
    turns: 12,
    elapsedTicks: 0,
    elapsedMs: 0,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };

  it('returns nothing when the chapter is unknown', () => {
    expect(buildMemberRows(undefined, { ...base, ap: 36 })).toEqual([]);
  });

  /**
   * The row set now comes from `sphereLevelsGained`'s keys — every member who
   * earned this battle's AP (`ffx-combat-core.md §1.7`) — not the pre-battle
   * `build.activeSlots`, per round 03's gate major on a switched member's
   * row: see `tests/unit/ffx-results-ap.test.ts` for that scenario driven
   * through a real engine. The ordinary no-switch case still lists all three
   * active members, because in that case all three are `sphereLevelsGained`
   * keys too — Yuna and Kimahri simply gained no S.Lv (`levelDelta` 0) from
   * this battle's AP.
   */
  it('lists the three active FFX members and pays each the full AP', () => {
    const rows = buildMemberRows(getChapter('seymour-flux'), {
      ...base,
      ap: 36,
      sphereLevelsGained: { tidus: 1, yuna: 0, kimahri: 0 },
    });
    expect(rows.map((r) => r.id)).toEqual(['tidus', 'yuna', 'kimahri']);
    expect(rows.every((r) => r.award === 36 && r.awardUnit === 'AP')).toBe(true);
    expect(rows[0]?.levelDelta).toBe(1);
    expect(rows[0]?.levelUnit).toBe('S.Lv');
    expect(rows[0]?.detail).toMatch(/^S\.LV \d+ · [\d,]+\/[\d,]+ AP$/);
  });

  it('pays FFX-2 in EXP and names the dressphere the AP went to', () => {
    const rows = buildMemberRows(getChapter('ffx2-vegnagun-shuyin'), {
      ...base,
      ap: 180,
      exp: 1480,
      levelsGained: { yuna: 1 },
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]?.award).toBe(1480);
    expect(rows[0]?.awardUnit).toBe('EXP');
    expect(rows[0]?.levelUnit).toBe('Lv');
    expect(rows[0]?.detail.startsWith('WHITE MAGE')).toBe(true);
  });
});

describe('dropsLabel', () => {
  it('prints names, with a count only where there is more than one', () => {
    expect(
      dropsLabel([
        { itemId: 'phoenix-down', count: 2 },
        { itemId: 'elixir', count: 1 },
      ]),
    ).toBe('Phoenix Down \u00d72, Elixir');
  });

  it('is empty for no drops, so the ITEMS row can be dropped entirely', () => {
    expect(dropsLabel([])).toBe('');
  });
});
