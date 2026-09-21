import { describe, expect, it } from 'vitest';
import { defineSpecimen } from '../../learn/shared/model.ts';
import type { Piece, PieceCard, Specimen } from '../../learn/shared/model.ts';
import { buildIndex, search } from '../../learn/shared/search.ts';

function card(overrides: Partial<PieceCard> = {}): PieceCard {
  return {
    eyebrow: '',
    body: '',
    claimKind: '',
    facts: [],
    cite: 'fixture-source §1',
    tabs: [],
    ...overrides,
  };
}

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    id: 'piece',
    systemId: 'system-a',
    name: 'Piece',
    kind: 'painting',
    size: 10,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 0, y: 0, z: 0 },
    card: card(),
    ...overrides,
  };
}

/**
 * Placeholder names only, chosen so a query of "head" exercises every
 * ranking tier in a known order: exact, name-prefix, word-prefix,
 * substring, then cite-or-system-only matches (tied, broken by order).
 */
function rankingFixture(): Specimen {
  return defineSpecimen({
    id: 'fixture',
    title: 'Fixture Specimen',
    eyebrow: 'TEST',
    factsLine: '7 pieces · fixture',
    game: 'ffx',
    systems: [
      { id: 'system-a', name: 'Fixture System', colour: '#111', count: 6 },
      { id: 'system-head', name: 'Headgear', colour: '#222', count: 1 },
    ],
    pieces: [
      piece({ id: 'p-exact', name: 'Head' }), // tier 0
      piece({ id: 'p-prefix', name: 'Headlamp' }), // tier 1
      piece({ id: 'p-word-prefix', name: 'Armored Head' }), // tier 2
      piece({ id: 'p-substring', name: 'Forehead Guard' }), // tier 3
      piece({ id: 'p-cite', name: 'Tail Fin', card: card({ cite: 'documented in the head office notes' }) }), // tier 4
      piece({ id: 'p-system', name: 'Wing Strut', systemId: 'system-head' }), // tier 4
      piece({ id: 'p-no-match', name: 'Something Else' }), // no match at all
    ],
  });
}

describe('buildIndex', () => {
  it('indexes every piece, preserving specimen order', () => {
    const index = buildIndex(rankingFixture());
    expect(index.entries.map((entry) => entry.pieceId)).toEqual([
      'p-exact',
      'p-prefix',
      'p-word-prefix',
      'p-substring',
      'p-cite',
      'p-system',
      'p-no-match',
    ]);
  });
});

describe('search: ranking', () => {
  it('orders exact > name-prefix > word-prefix > substring > cite/system, ties by specimen order', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, 'head', 10)).toEqual([
      'p-exact',
      'p-prefix',
      'p-word-prefix',
      'p-substring',
      'p-cite',
      'p-system',
    ]);
  });

  it('is case-insensitive', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, 'HEAD', 10)).toEqual(search(index, 'head', 10));
    expect(search(index, 'Head', 10)).toEqual(search(index, 'head', 10));
  });

  it('excludes pieces that match nowhere', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, 'head', 10)).not.toContain('p-no-match');
  });

  it('respects the limit', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, 'head', 2)).toEqual(['p-exact', 'p-prefix']);
  });

  it('returns no results for a query nothing matches', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, 'zzz-nothing', 10)).toEqual([]);
  });
});

describe('search: empty query', () => {
  it('returns no results for an empty query', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, '', 10)).toEqual([]);
  });

  it('returns no results for a whitespace-only query', () => {
    const index = buildIndex(rankingFixture());
    expect(search(index, '   ', 10)).toEqual([]);
  });
});

describe('search: stable order for ties', () => {
  it('keeps specimen order among two pieces in the same tier', () => {
    const specimen = defineSpecimen({
      id: 'tie-fixture',
      title: 'Tie Fixture',
      eyebrow: 'TEST',
      factsLine: '2 pieces · fixture',
      game: 'ffx2',
      systems: [{ id: 'system-a', name: 'System A', colour: '#111', count: 2 }],
      pieces: [piece({ id: 'first', name: 'Bighead Thing' }), piece({ id: 'second', name: 'Pinhead Object' })],
    });
    const index = buildIndex(specimen);
    expect(search(index, 'head', 10)).toEqual(['first', 'second']);
  });
});
