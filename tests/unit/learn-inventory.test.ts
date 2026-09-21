import { describe, expect, it } from 'vitest';
import { buildInventory, noteFor } from '../../learn/shared/inventory.ts';
import type { Piece, PieceCard, Specimen, System } from '../../learn/shared/model.ts';
import { defineSpecimen, withCounts } from '../../learn/shared/model.ts';

/** Placeholder fixtures only — never game facts (AGENTS.md hard rule 6 is about product code, not tests). */
function card(factValue: string): PieceCard {
  return {
    eyebrow: 'Fixture',
    body: 'A placeholder.',
    claimKind: 'fixture',
    facts: [{ label: 'Fact', value: factValue }],
    cite: 'fixture-source §1',
    tabs: [],
  };
}

function piece(overrides: Partial<Piece> & Pick<Piece, 'id' | 'systemId' | 'kind' | 'size'>): Piece {
  return {
    name: overrides.id,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 0, y: 0, z: 0 },
    card: card('12 of 12'),
    ...overrides,
  };
}

const SYSTEMS: readonly System[] = [];

function specimenOf(pieces: readonly Piece[]): Specimen {
  const inputs = [
    { id: 'alpha', name: 'Alpha', colour: '#111' },
    { id: 'beta', name: 'Beta', colour: '#222' },
    { id: 'gamma', name: 'Gamma', colour: '#333' },
  ];
  void SYSTEMS;
  return defineSpecimen({
    id: 'fixture',
    title: 'Fixture',
    eyebrow: 'Fixture',
    factsLine: 'fixture',
    game: 'ffx2',
    systems: withCounts(inputs, pieces),
    pieces,
  });
}

describe('noteFor', () => {
  it('always shows a painting’s leading number', () => {
    expect(noteFor(piece({ id: 'p', systemId: 'alpha', kind: 'painting', size: 3, card: card('38,420') }))).toBe('38,420');
  });

  it('shows nothing for a card piece: its name is the whole point', () => {
    expect(noteFor(piece({ id: 'c', systemId: 'alpha', kind: 'card', size: 2, card: card('30') }))).toBeUndefined();
  });

  it('shows a tile’s leading fact when it is not a bare count', () => {
    expect(noteFor(piece({ id: 't', systemId: 'alpha', kind: 'tile', size: 1, card: card('12 of 12') }))).toBe('12 of 12');
    expect(noteFor(piece({ id: 'u', systemId: 'alpha', kind: 'tile', size: 1, card: card('1') }))).toBeUndefined();
  });
});

describe('buildInventory', () => {
  const pieces = [
    piece({ id: 'small-paint', systemId: 'alpha', kind: 'painting', size: 5, art: 'a/idle.png' }),
    piece({ id: 'chip', systemId: 'alpha', kind: 'tile', size: 90 }),
    piece({ id: 'big-paint', systemId: 'alpha', kind: 'painting', size: 9, art: 'b/idle.png' }),
    piece({ id: 'beta-1', systemId: 'beta', kind: 'card', size: 4 }),
  ];
  const specimen = specimenOf(pieces);

  it('keeps the specimen’s own system order and drops systems with nothing visible', () => {
    const groups = buildInventory(specimen, pieces);
    expect(groups.map((g) => g.systemId)).toEqual(['alpha', 'beta']);
  });

  it('leads each group with its paintings, largest first, then everything else', () => {
    const alpha = buildInventory(specimen, pieces)[0];
    expect(alpha?.cells.map((c) => c.id)).toEqual(['big-paint', 'small-paint', 'chip']);
    expect(alpha?.cells.map((c) => c.kind)).toEqual(['picture', 'picture', 'chip']);
  });

  it('counts the cells it actually built rather than the system’s own count', () => {
    const groups = buildInventory(specimen, pieces.filter((p) => p.systemId === 'alpha'));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(3);
  });

  it('follows a hidden system: a piece that is not visible is not catalogued', () => {
    const groups = buildInventory(specimen, pieces.filter((p) => p.id !== 'chip'));
    expect(groups[0]?.cells.map((c) => c.id)).toEqual(['big-paint', 'small-paint']);
    expect(groups[0]?.count).toBe(2);
  });
});
