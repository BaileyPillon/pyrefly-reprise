/**
 * Rescales `Piece.size` into a small on-screen range before it reaches
 * `pack.ts` or `layout.ts`.
 *
 * A site's data layer bands `size` by kind so widely (e.g.
 * `learn/atlas/size.ts`'s `tieredSize`: painting pieces start at 2,000,000)
 * that a painting with real-world HP for its magnitude sorts above every
 * card and tile, as intended — but `pack.ts` packs literal squares of side
 * `piece.size` and `layout.ts` sets a piece's authored on-stage width to the
 * same number, so used directly a painting would be millions of pixels
 * wide. This module keeps the ordering (largest of a kind stays largest;
 * painting > card > tile, because the ranges below never overlap) while
 * mapping each kind onto CSS-pixel-sized cells, so neither `pack.ts` nor
 * `layout.ts` has to know anything about the bands.
 */

import type { Piece, PieceKind } from './model.ts';

/** Target on-screen side length (CSS px) for one piece kind's stage/inventory cell. */
export interface DisplayRange {
  readonly min: number;
  readonly max: number;
}

export const DEFAULT_DISPLAY_RANGES: Readonly<Record<PieceKind, DisplayRange>> = {
  painting: { min: 110, max: 220 },
  card: { min: 30, max: 56 },
  tile: { min: 14, max: 24 },
};

/**
 * Returns a copy of `pieces` with `size` rescaled per kind into `ranges`.
 * Within a kind, the smallest piece maps to `range.min` and the largest to
 * `range.max`; a kind with only one piece (or every piece tied) maps to
 * `range.max`. Every other field is untouched.
 */
export function normalizeSizesForDisplay(
  pieces: readonly Piece[],
  ranges: Readonly<Record<PieceKind, DisplayRange>> = DEFAULT_DISPLAY_RANGES,
): Piece[] {
  const byKind = new Map<PieceKind, Piece[]>();
  for (const piece of pieces) {
    const group = byKind.get(piece.kind);
    if (group) {
      group.push(piece);
    } else {
      byKind.set(piece.kind, [piece]);
    }
  }

  const sizeById = new Map<string, number>();
  for (const [kind, group] of byKind) {
    const range = ranges[kind];
    const min = Math.min(...group.map((p) => p.size));
    const max = Math.max(...group.map((p) => p.size));
    for (const piece of group) {
      const t = max > min ? (piece.size - min) / (max - min) : 1;
      sizeById.set(piece.id, range.min + t * (range.max - range.min));
    }
  }

  return pieces.map((piece) => ({ ...piece, size: sizeById.get(piece.id) ?? ranges[piece.kind].min }));
}
