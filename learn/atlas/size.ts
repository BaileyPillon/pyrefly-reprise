/**
 * `Piece.size` — "used only to order pieces largest-first and to scale
 * inventory cells" (`learn/shared/model.ts`). `docs/plans/learning-sites.md`
 * site A spec: "painted parts by max HP (largest first), then cards, then
 * tiles, as the a3 inventory frame orders them."
 *
 * A raw stat can't be compared across kinds directly — some support parts
 * hold more HP than any painted boss (Vegnagun's Nodes: 300,000 HP, more
 * than any of the five painted parts), which would sort a Node above the
 * paintings if `size` were just HP. Each `PieceKind` gets its own numeric
 * band, spaced far enough apart that no real magnitude below can cross into
 * the next band, so a plain largest-first sort always keeps paintings above
 * cards above tiles, while still ordering *within* a kind by a real,
 * data-derived number (HP, ability power, or how many combatants share a
 * fact) rather than an arbitrary index.
 */

import type { PieceKind } from '../shared/model.ts';

const BAND: Record<PieceKind, number> = {
  painting: 2_000_000,
  card: 1_000_000,
  tile: 0,
};

/** `magnitude` must be a real, sourced, non-negative number (HP, ability power, a combatant count, ...) — never an invented rank. */
export function tieredSize(kind: PieceKind, magnitude: number): number {
  return BAND[kind] + magnitude;
}
