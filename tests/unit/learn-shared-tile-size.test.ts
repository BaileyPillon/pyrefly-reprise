import { describe, expect, it } from 'vitest';
import { normalizeSizesForDisplay } from '../../learn/shared/tile-size.ts';
import type { Piece, PieceCard } from '../../learn/shared/model.ts';

function card(): PieceCard {
  return { eyebrow: 'e', body: 'b', claimKind: 'k', facts: [], cite: 'fixture-source §1', tabs: [] };
}

function piece(overrides: Partial<Piece>): Piece {
  return {
    id: 'p',
    systemId: 's',
    name: 'Piece',
    kind: 'painting',
    size: 100,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 0, y: 0, z: 0 },
    card: card(),
    ...overrides,
  };
}

describe('normalizeSizesForDisplay', () => {
  it('maps the smallest and largest of a kind to that kind range\'s min and max', () => {
    const pieces = [
      piece({ id: 'small', kind: 'painting', size: 2_000_010 }),
      piece({ id: 'big', kind: 'painting', size: 2_050_000 }),
    ];
    const [small, big] = normalizeSizesForDisplay(pieces, {
      painting: { min: 100, max: 200 },
      card: { min: 0, max: 0 },
      tile: { min: 0, max: 0 },
    });
    expect(small?.size).toBe(100);
    expect(big?.size).toBe(200);
  });

  it('keeps painting, card and tile ranges disjoint and ordered painting > card > tile', () => {
    const pieces = [
      piece({ id: 'a-painting', kind: 'painting', size: 2_000_000 }),
      piece({ id: 'a-card', kind: 'card', size: 1_300_000 }),
      piece({ id: 'a-tile', kind: 'tile', size: 12 }),
    ];
    const [normPainting, normCard, normTile] = normalizeSizesForDisplay(pieces);
    expect(normPainting?.size).toBeGreaterThan(normCard?.size ?? 0);
    expect(normCard?.size).toBeGreaterThan(normTile?.size ?? 0);
  });

  it('maps a lone piece (or a tie) of a kind to that range\'s max', () => {
    const pieces = [piece({ id: 'only', kind: 'tile', size: 999 })];
    const [only] = normalizeSizesForDisplay(pieces, {
      painting: { min: 0, max: 0 },
      card: { min: 0, max: 0 },
      tile: { min: 10, max: 40 },
    });
    expect(only?.size).toBe(40);
  });

  it('leaves every other field untouched', () => {
    const original = piece({ id: 'x', name: 'Body / Core', art: 'characters/vegnagun-body/idle.png' });
    const [normalized] = normalizeSizesForDisplay([original]);
    expect(normalized).toMatchObject({ id: 'x', name: 'Body / Core', art: 'characters/vegnagun-body/idle.png' });
    expect(normalized?.size).not.toBe(original.size);
  });
});
