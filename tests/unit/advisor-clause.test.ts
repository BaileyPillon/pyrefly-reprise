import { describe, expect, it } from 'vitest';
import { firstClause, reasonClauses } from '../../src/ui/common/advisorClause.ts';

/**
 * PR-0330 (release 39.1; both games: the shared card): a reason is cut at a clause or not at all. Round 22 read the card's two-line clamp, which ended
 * a sentence in an ellipsis ("Take the pouch off Guado Guardian A: one..."), as clipped text; `MoveAdvisor`'s rungs now print a reason whole, as its first
 * whole clause, or not at all.
 */
describe('reasonClauses', () => {
  it('cuts at a semicolon and at the end of a sentence, and drops the separators and the closing stop', () => {
    expect(reasonClauses('It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all')).toEqual([
      'It puts Cheer on the party',
      'next, Mortiphasm Spells hits for about 4,400 in all',
    ]);
    expect(reasonClauses('Wakka first. Then Cheer.')).toEqual(['Wakka first', 'Then Cheer']);
  });

  it('never cuts at a colon or a dash: what follows is the point', () => {
    const steal = 'Take the pouch off Guado Guardian A: one successful Steal ends its 1,000 HP Auto-Potion counter and its Hi-Potions for Seymour — and nothing else, so it will still Remedy him';
    expect(reasonClauses(steal)).toEqual([steal]);
    const revive = 'Only Yuna can call an aeon, revive or heal — stand Yuna up';
    expect(reasonClauses(revive)).toEqual([revive]);
  });

  it('keeps a number with its decimal point or its thousands comma whole', () => {
    expect(reasonClauses('Hits for about 1.5 times the usual 4,400')).toEqual(['Hits for about 1.5 times the usual 4,400']);
  });

  it('is one empty-safe clause for an empty or blank reason', () => {
    expect(reasonClauses('')).toEqual([]);
    expect(firstClause('')).toBe('');
    expect(firstClause('   ')).toBe('');
  });
});

describe('firstClause', () => {
  it('is the first whole clause, and the reason itself when it has one', () => {
    expect(firstClause('It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all')).toBe('It puts Cheer on the party');
    expect(firstClause('It puts Haste on the party')).toBe('It puts Haste on the party');
    expect(firstClause('Most damage on the board.')).toBe('Most damage on the board');
  });
});
