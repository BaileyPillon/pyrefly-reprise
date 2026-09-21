import { describe, expect, it } from 'vitest';
import { accentForGame, defineSpecimen, definePiece, withCounts } from '../../learn/shared/model.ts';
import type { Piece, PieceCard, PieceCardTab, SpecimenInput, System, SystemInput } from '../../learn/shared/model.ts';

/** Placeholder fixtures only — never game facts (AGENTS.md hard rule 6 is about product code, not tests). */
function card(overrides: Partial<PieceCard> = {}): PieceCard {
  return {
    eyebrow: 'Structure',
    body: 'A placeholder part for testing.',
    claimKind: 'System overview',
    facts: [{ label: 'Fact', value: 'one' }],
    cite: 'fixture-source §1',
    tabs: [],
    ...overrides,
  };
}

function piece(overrides: Partial<Piece> = {}): Piece {
  return {
    id: 'piece-a',
    systemId: 'system-a',
    name: 'Piece A',
    kind: 'painting',
    size: 10,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 5, y: 5, z: 5 },
    card: card(),
    ...overrides,
  };
}

describe('accentForGame', () => {
  it('maps ffx to gold and ffx2 to pink', () => {
    expect(accentForGame('ffx')).toBe('gold');
    expect(accentForGame('ffx2')).toBe('pink');
  });
});

describe('definePiece', () => {
  it('returns a valid piece unchanged', () => {
    const p = piece();
    expect(definePiece(p)).toBe(p);
  });

  it('throws when the card has an empty cite', () => {
    expect(() => definePiece(piece({ card: card({ cite: '' }) }))).toThrow(/cite/);
  });

  it('throws when the card cite is only whitespace', () => {
    expect(() => definePiece(piece({ card: card({ cite: '   ' }) }))).toThrow(/cite/);
  });
});

describe('withCounts', () => {
  it('computes each system count from the pieces that name it', () => {
    const systems: readonly SystemInput[] = [
      { id: 'system-a', name: 'System A', colour: '#111' },
      { id: 'system-b', name: 'System B', colour: '#222' },
    ];
    const pieces = [
      piece({ id: 'p1', systemId: 'system-a' }),
      piece({ id: 'p2', systemId: 'system-a' }),
      piece({ id: 'p3', systemId: 'system-b' }),
    ];

    expect(withCounts(systems, pieces)).toEqual([
      { id: 'system-a', name: 'System A', colour: '#111', count: 2 },
      { id: 'system-b', name: 'System B', colour: '#222', count: 1 },
    ]);
  });

  it('gives a system with no matching pieces a count of 0', () => {
    const systems: readonly SystemInput[] = [{ id: 'empty', name: 'Empty', colour: '#000' }];
    expect(withCounts(systems, [])).toEqual([{ id: 'empty', name: 'Empty', colour: '#000', count: 0 }]);
  });
});

const pieceA = piece({ id: 'p1', systemId: 'system-a' });
const pieceB = piece({ id: 'p2', systemId: 'system-b' });

function baseSystems(): System[] {
  return [
    { id: 'system-a', name: 'System A', colour: '#111', count: 1 },
    { id: 'system-b', name: 'System B', colour: '#222', count: 1 },
  ];
}

function baseSpecimenInput(): SpecimenInput {
  return {
    id: 'fixture',
    title: 'Fixture Specimen',
    eyebrow: 'TEST SPECIMEN',
    factsLine: '2 pieces · fixture',
    game: 'ffx',
    systems: baseSystems(),
    pieces: [pieceA, pieceB],
  };
}

describe('defineSpecimen', () => {
  it('builds a valid specimen', () => {
    const specimen = defineSpecimen(baseSpecimenInput());
    expect(specimen.pieces).toHaveLength(2);
    expect(specimen.systems.map((system) => system.count)).toEqual([1, 1]);
  });

  it('throws when a piece card has an empty cite', () => {
    const input: SpecimenInput = {
      ...baseSpecimenInput(),
      pieces: [piece({ id: 'p1', systemId: 'system-a', card: card({ cite: '' }) }), pieceB],
    };
    expect(() => defineSpecimen(input)).toThrow(/cite/);
  });

  it('throws when a piece names an unknown system', () => {
    const input: SpecimenInput = {
      ...baseSpecimenInput(),
      pieces: [pieceA, piece({ id: 'p2', systemId: 'nonexistent' })],
    };
    expect(() => defineSpecimen(input)).toThrow(/unknown system/);
  });

  it('throws when two pieces share an id', () => {
    const input: SpecimenInput = {
      ...baseSpecimenInput(),
      pieces: [piece({ id: 'dup', systemId: 'system-a' }), piece({ id: 'dup', systemId: 'system-b' })],
    };
    expect(() => defineSpecimen(input)).toThrow(/duplicate piece id/);
  });

  it('throws when two systems share an id', () => {
    const input: SpecimenInput = {
      ...baseSpecimenInput(),
      systems: [
        { id: 'dup', name: 'A', colour: '#111', count: 1 },
        { id: 'dup', name: 'B', colour: '#222', count: 1 },
      ],
    };
    expect(() => defineSpecimen(input)).toThrow(/duplicate system id/);
  });

  it('throws when a system count disagrees with its actual pieces', () => {
    const input: SpecimenInput = {
      ...baseSpecimenInput(),
      systems: [
        { id: 'system-a', name: 'System A', colour: '#111', count: 5 },
        { id: 'system-b', name: 'System B', colour: '#222', count: 1 },
      ],
    };
    expect(() => defineSpecimen(input)).toThrow(/declares count/);
  });
});

describe('PieceCardTab.sections', () => {
  it('accepts a tab whose content is cited sections, each with its own cite and an optional heading', () => {
    const sectioned: PieceCardTab = {
      id: 'how-to-answer-it',
      label: 'How to answer it',
      body: '',
      sections: [
        { heading: 'Phase 2', text: 'Watch for the sword.', cite: 'fixture-source §2' },
        { text: 'A section may omit its heading.', cite: 'fixture-source §3' },
      ],
    };
    expect(sectioned.sections).toHaveLength(2);
    expect(sectioned.sections?.[0]).toEqual({ heading: 'Phase 2', text: 'Watch for the sword.', cite: 'fixture-source §2' });
    expect(sectioned.sections?.[1]?.heading).toBeUndefined();
  });

  it('still allows a plain body-only tab with no sections at all', () => {
    const bodyOnly: PieceCardTab = { id: 'overview', label: 'Overview', body: 'Plain text.' };
    expect(bodyOnly.sections).toBeUndefined();
  });

  it('a card whose tab carries sections still passes definePiece — cite lives on the card, not the tab', () => {
    const p = piece({
      card: card({
        tabs: [
          {
            id: 'how-to-answer-it',
            label: 'How to answer it',
            body: '',
            sections: [{ heading: 'Watch', text: 'Do the thing.', cite: 'fixture-source §4' }],
          },
        ],
      }),
    });
    expect(definePiece(p)).toBe(p);
  });
});
