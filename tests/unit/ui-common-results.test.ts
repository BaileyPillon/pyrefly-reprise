import { describe, expect, it } from 'vitest';
import {
  apPerMember,
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
