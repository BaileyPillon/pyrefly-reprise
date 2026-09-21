import { describe, expect, it } from 'vitest';
import { fadeInFor } from '../../learn/shared/stage.ts';
import type { Piece, PieceCard } from '../../learn/shared/model.ts';

function card(): PieceCard {
  return { eyebrow: 'e', body: 'b', claimKind: 'k', facts: [], cite: 'fixture-source §1', tabs: [] };
}

function piece(kind: Piece['kind']): Piece {
  return {
    id: 'p',
    systemId: 's',
    name: 'Piece',
    kind,
    size: 10,
    home: { x: 0, y: 0, z: 0 },
    burst: { x: 0, y: 0, z: 0 },
    card: card(),
  };
}

describe('fadeInFor', () => {
  it('keeps a painted piece fully opaque at every explode value', () => {
    expect(fadeInFor(piece('painting'), 0)).toBe(1);
    expect(fadeInFor(piece('painting'), 0.5)).toBe(1);
    expect(fadeInFor(piece('painting'), 1)).toBe(1);
  });

  it('starts a card piece fully transparent at explode 0', () => {
    expect(fadeInFor(piece('card'), 0)).toBe(0);
  });

  it('starts a tile piece fully transparent at explode 0', () => {
    expect(fadeInFor(piece('tile'), 0)).toBe(0);
  });

  it('brings a card piece to full opacity by the fade-in threshold, and keeps it there', () => {
    expect(fadeInFor(piece('card'), 0.12)).toBe(1);
    expect(fadeInFor(piece('card'), 0.5)).toBe(1);
    expect(fadeInFor(piece('card'), 1)).toBe(1);
  });

  it('is partial partway through the fade-in window', () => {
    const value = fadeInFor(piece('card'), 0.06);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(1);
  });
});
